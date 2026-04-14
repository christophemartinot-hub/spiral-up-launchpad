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

// ============================================
// COMPOSIO v3 PUBLISHING
// ============================================

const COMPOSIO_API_KEY = Deno.env.get("COMPOSIO_API_KEY");
const COMPOSIO_EXECUTE_URL = "https://backend.composio.dev/api/v3/actions/execute";
const FACEBOOK_PAGE_ID = "1005887942614017";

function getComposioAccountId(platform: string): string {
  const accountIds: Record<string, string> = {
    linkedin: "linkedin_boba-irving",
    facebook: "facebook_wafer-furor",
    instagram: "instagram_manal-sarah",
  };
  const id = accountIds[platform.toLowerCase()];
  if (!id) throw new Error(`No account ID configured for ${platform}`);
  return id;
}

async function executeComposioAction(
  toolSlug: string,
  input: Record<string, unknown>,
  accountId: string,
): Promise<unknown> {
  const response = await fetch(COMPOSIO_EXECUTE_URL, {
    method: "POST",
    headers: {
      "x-api-key": COMPOSIO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tool_slug: toolSlug,
      input,
      connected_account_id: accountId,
    }),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Composio API error ${response.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Composio returned non-JSON: ${text.slice(0, 200)}`);
  }
}

async function publishToLinkedIn(
  content: string,
  imageUrl?: string | null,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const LINKEDIN_TOKEN = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
    if (!LINKEDIN_TOKEN) throw new Error("Missing LINKEDIN_ACCESS_TOKEN");

    const body: Record<string, unknown> = {
      author: "urn:li:person:W6qTJ8EL8v",
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LINKEDIN_TOKEN}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202504",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn API error ${response.status}: ${error}`);
    }

    const postId = response.headers.get("x-restli-id") || "";
    return { success: true, postId };
  } catch (error: unknown) {
    console.error("LinkedIn publish error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function publishToFacebook(
  content: string,
  imageUrl?: string | null,
): Promise<{ success: boolean; response?: unknown; postId?: string; error?: string }> {
  try {
    const accountId = getComposioAccountId("facebook");
    const input: Record<string, unknown> = {
      page_id: FACEBOOK_PAGE_ID,
      message: content,
    };
    if (imageUrl) {
      input.link = imageUrl;
    }

    const data = await executeComposioAction(
      "FACEBOOK_CREATE_PAGE_POST",
      input,
      accountId,
    ) as Record<string, any>;

    return {
      success: true,
      response: data,
      postId: data?.data?.id || data?.executionId,
    };
  } catch (error: unknown) {
    console.error("Facebook publish error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function publishToInstagram(
  caption: string,
  imageUrl?: string | null,
): Promise<{ success: boolean; response?: unknown; postId?: string; error?: string; skipped?: boolean }> {
  try {
    if (!imageUrl) {
      console.warn("Instagram requires an image — skipping");
      return { success: false, skipped: true, error: "Instagram requires an image URL" };
    }
    const accountId = getComposioAccountId("instagram");
    const input: Record<string, unknown> = {
      caption,
      image_url: imageUrl,
    };

    const data = await executeComposioAction(
      "INSTAGRAM_CREATE_PHOTO_POST",
      input,
      accountId,
    ) as Record<string, any>;

    return {
      success: true,
      response: data,
      postId: data?.data?.id || data?.executionId,
    };
  } catch (error: unknown) {
    console.error("Instagram publish error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
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
        );
        results[platform] = result;
        if (!result.success) allSuccess = false;
      } else if (platform === "blog") {
        const result = await publishToBlog(item, supabase);
        results[platform] = result;
        if (!result.success) allSuccess = false;
      } else if (platform === "facebook") {
        const result = await publishToFacebook(
          item.draft_content || "",
          finalImageUrl,
        );
        results[platform] = result;
        if (!result.success) allSuccess = false;
      } else if (platform === "instagram") {
        const result = await publishToInstagram(
          item.draft_content || "",
          finalImageUrl,
        );
        results[platform] = result;
        if (result.skipped) {
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
          composio_post_id: (result as any).postId || undefined,
          platform_response: result.response,
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
