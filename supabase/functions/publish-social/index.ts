import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Validate that a URL looks like a public image the platforms will accept */
function isValidPublicImageUrl(url: unknown): url is string {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const ext = u.pathname.split(".").pop()?.toLowerCase() ?? "";
    if (ext && !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Publish directly to LinkedIn API */
async function publishToLinkedIn(
  caption: string,
  imageUrl: string | null,
  title: string | null,
  keyMessage: string | null
): Promise<{ success: boolean; response: unknown; error?: string }> {
  const linkedinToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
  const linkedinUrn = Deno.env.get("LINKEDIN_PERSON_URN");

  if (!linkedinToken || !linkedinUrn) {
    return { success: false, response: null, error: "LinkedIn credentials not configured" };
  }

  const linkedinPayload: Record<string, unknown> = {
    author: linkedinUrn,
    commentary: caption,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrl) {
    linkedinPayload.content = {
      article: {
        source: imageUrl,
        title: title || "",
        description: keyMessage || "",
      },
    };
  }

  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${linkedinToken}`,
      "LinkedIn-Version": "202603",
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(linkedinPayload),
  });

  const responseText = await res.text();
  let responseBody: unknown;
  try { responseBody = JSON.parse(responseText); } catch { responseBody = responseText; }

  if (!res.ok) {
    return { success: false, response: responseBody, error: `LinkedIn API ${res.status}: ${responseText}` };
  }

  return { success: true, response: responseBody };
}

/** Publish to Facebook or Instagram via Buffer GraphQL API */
async function publishToBuffer(
  platform: "facebook" | "instagram",
  caption: string,
  imageUrl: string | null,
  publishDate: string | null,
  publishTime: string | null,
): Promise<{ success: boolean; response: unknown; error?: string; skipped?: boolean; postId?: string }> {
  const bufferToken = Deno.env.get("BUFFER_ACCESS_TOKEN");
  if (!bufferToken) {
    return { success: false, response: null, error: "BUFFER_ACCESS_TOKEN not configured" };
  }

  const channelIds: Record<string, string> = {
    facebook: "5e837d5420c4a32a2146aa63",
    instagram: "69b5bbc77be9f8b17157f30c",
  };

  // Instagram requires an image
  if (platform === "instagram" && !imageUrl) {
    return { success: false, response: null, skipped: true, error: "Instagram requires an image" };
  }

  const time = publishTime || "09:00";
  const date = publishDate || new Date().toISOString().split("T")[0];
  const dueAt = `${date}T${time}:00Z`;

  const input: Record<string, unknown> = {
    channelId: channelIds[platform],
    text: caption,
    publishingScheduleType: "SCHEDULED",
    dueAt,
  };
  if (imageUrl) {
    input.mediaUrls = [imageUrl];
  }

  const graphqlBody = {
    query: `mutation CreatePost($input: CreatePostInput!) { createPost(input: $input) { post { id status } } }`,
    variables: { input },
  };

  try {
    const res = await fetch("https://api.buffer.com/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${bufferToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphqlBody),
    });

    const responseText = await res.text();
    let responseBody: unknown;
    try { responseBody = JSON.parse(responseText); } catch { responseBody = responseText; }

    if (!res.ok) {
      return { success: false, response: responseBody, error: `Buffer GraphQL ${res.status}: ${responseText}` };
    }

    // Check for GraphQL-level errors
    const parsed = responseBody as Record<string, unknown>;
    if (parsed.errors) {
      return { success: false, response: responseBody, error: `Buffer GraphQL errors: ${JSON.stringify(parsed.errors)}` };
    }

    const post = (parsed.data as any)?.createPost?.post;
    return { success: true, response: responseBody, postId: post?.id };
  } catch (err) {
    return { success: false, response: null, error: err instanceof Error ? err.message : "Buffer GraphQL fetch failed" };
  }
}
/** Publish to spiralingup.works blog via webhook */
async function publishToBlog(
  item: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>
): Promise<{ success: boolean; response: unknown; error?: string }> {
  const webhookSecret = Deno.env.get("WEBSITE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return { success: false, response: null, error: "WEBSITE_WEBHOOK_SECRET not configured" };
  }

  const title = (item.working_title as string) || "";
  const content = (item.draft_content as string) || "";
  const slug =
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") +
    "-" +
    Date.now();
  const excerpt = content.substring(0, 200);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));
  const readTime = `${readMinutes} min read`;

  const payload = {
    title,
    slug,
    content,
    excerpt,
    image_url: item.image_url || null,
    tags: item.content_pillar ? [item.content_pillar] : ["Leadership"],
    category: (item.content_pillar as string) || "Leadership",
    read_time: readTime,
  };

  try {
    const res = await fetch(
      "https://eevyrvxnazncasfaybwx.supabase.co/functions/v1/receive-blog-post",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": webhookSecret,
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await res.text();
    let responseBody: unknown;
    try { responseBody = JSON.parse(responseText); } catch { responseBody = responseText; }

    if (!res.ok) {
      return { success: false, response: responseBody, error: `Blog webhook ${res.status}: ${responseText}` };
    }

    return { success: true, response: responseBody };
  } catch (err) {
    return { success: false, response: null, error: err instanceof Error ? err.message : "Blog publish fetch failed" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { editorialItemId, channels, action } = await req.json();
    const isUnpublish = action === "unpublish";

    if (!editorialItemId) {
      return new Response(
        JSON.stringify({ error: "editorialItemId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch editorial item ──
    const { data: item, error: itemErr } = await supabase
      .from("editorial_items")
      .select("*")
      .eq("id", editorialItemId)
      .single();

    if (itemErr || !item) {
      return new Response(
        JSON.stringify({ error: "Editorial item not found", details: itemErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Resolve target platforms ──
    let targetPlatforms: string[] = [];
    if (channels && channels.length > 0) {
      targetPlatforms = channels;
    } else {
      targetPlatforms = [item.channel];
    }

    // ═══════════════════════════════════════════
    // UNPUBLISH FLOW
    // ═══════════════════════════════════════════
    if (isUnpublish) {
      // Reset status to approved
      await supabase
        .from("editorial_items")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", editorialItemId);

      await supabase.from("audit_log").insert({
        action: "unpublish_social",
        entity_type: "editorial_item",
        entity_id: editorialItemId,
        details: { platforms: targetPlatforms, success: true },
      });

      return new Response(
        JSON.stringify({ success: true, action: "unpublished", platforms: targetPlatforms }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════
    // PUBLISH FLOW
    // ═══════════════════════════════════════════

    // 0. Use manually attached image_url if present
    let imageUrl: string | null = isValidPublicImageUrl(item.image_url) ? item.image_url : null;

    // 1. Generate image if visual concept exists and no manual image
    if (!imageUrl && item.visual_concept) {
      try {
        console.log("Generating social image for:", item.visual_concept);
        const imgRes = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-social-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              visual_concept: item.visual_concept,
              visual_type: item.visual_type,
              channel: item.channel,
              title: item.working_title,
              editorial_item_id: item.id,
              content_format: item.content_format,
              objective: item.objective,
              key_message: item.key_message,
              post_angle: item.post_angle,
              cta: item.suggested_cta || item.cta,
              content: item.draft_content?.substring(0, 500),
            }),
          }
        );
        const imgData = await imgRes.json();
        if (imgData.image_url) {
          imageUrl = imgData.image_url;
          console.log("Image generated:", imageUrl);
        } else {
          console.warn("Image generation returned no URL:", imgData.error);
        }
      } catch (imgErr) {
        console.warn("Image generation failed, continuing without image:", imgErr);
      }
    }

    // 2. Fallback: look up a brand asset matching visual_type or content_pillar
    if (!imageUrl && (item.visual_type || item.content_pillar)) {
      try {
        const searchTerms = [item.visual_type, item.content_pillar].filter(Boolean);
        console.log("Looking up brand asset for:", searchTerms);
        for (const term of searchTerms) {
          if (imageUrl) break;
          const { data: assets } = await supabase
            .from("brand_assets")
            .select("file_url, name")
            .eq("asset_status", "approved")
            .ilike("name", `%${term}%`)
            .limit(1);
          if (assets && assets.length > 0 && isValidPublicImageUrl(assets[0].file_url)) {
            imageUrl = assets[0].file_url;
            console.log("Brand asset found:", assets[0].name, imageUrl);
          }
        }
      } catch (assetErr) {
        console.warn("Brand asset lookup failed:", assetErr);
      }
    }

    // 3. Validate final image URL
    const finalImageUrl = isValidPublicImageUrl(imageUrl) ? imageUrl : null;

    // 3. Publish to each platform via direct API calls
    const results: Record<string, { success: boolean; response: unknown; error?: string }> = {};
    let allSuccess = true;

    for (const platform of targetPlatforms) {
      if (platform === "linkedin") {
        const result = await publishToLinkedIn(
          item.draft_content || "",
          finalImageUrl,
          item.working_title || null,
          item.key_message || null
        );
        results[platform] = result;
        if (!result.success) allSuccess = false;
      } else if (platform === "blog") {
        const result = await publishToBlog(item, supabase);
        results[platform] = result;
        if (!result.success) allSuccess = false;
      } else if (platform === "facebook" || platform === "instagram") {
        const result = await publishToBuffer(
          platform,
          item.draft_content || "",
          finalImageUrl,
        );
        results[platform] = result;
        if (result.skipped) {
          // Instagram skipped due to no image — audit separately
          await supabase.from("audit_log").insert({
            action: `${platform}_skipped_no_image`,
            entity_type: "editorial_item",
            entity_id: editorialItemId,
            details: { reason: result.error },
          });
        }
        if (!result.success) allSuccess = false;
      } else {
        // Unsupported platform — log and skip
        results[platform] = {
          success: false,
          response: null,
          error: `Direct publishing not yet supported for platform: ${platform}. Only LinkedIn and Blog are currently supported.`,
        };
        allSuccess = false;
      }
    }

    // 4. Update editorial item status
    if (allSuccess) {
      await supabase
        .from("editorial_items")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", editorialItemId);
    } else {
      const errorSummary = Object.entries(results)
        .filter(([, r]) => !r.success)
        .map(([p, r]) => `${p}: ${r.error}`)
        .join("; ");

      await supabase
        .from("editorial_items")
        .update({
          status: "approved",
          rejection_reason: errorSummary || "Publishing failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", editorialItemId);
    }

    // 5. Audit log — one entry per platform for clarity
    for (const [platform, result] of Object.entries(results)) {
      await supabase.from("audit_log").insert({
        action: result.success
          ? `${platform}_published`
          : (result.skipped ? `${platform}_skipped_no_image` : `${platform}_publish_failed`),
        entity_type: "editorial_item",
        entity_id: editorialItemId,
        details: {
          channel: platform,
          working_title: item.working_title,
          publish_date: item.publish_date,
          image_url: finalImageUrl,
          success: result.success,
          linkedin_response: result.response,
          error: result.error || undefined,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: allSuccess,
        platforms: targetPlatforms,
        image_url: finalImageUrl,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("publish-social error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
