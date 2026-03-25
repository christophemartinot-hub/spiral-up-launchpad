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

    // 1. Generate image if visual concept exists
    let imageUrl: string | null = null;
    if (item.visual_concept) {
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

    // 2. Validate image URL
    const validImage = isValidPublicImageUrl(imageUrl);
    const finalImageUrl = validImage ? imageUrl : null;

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
      } else {
        // Unsupported platform — log and skip
        results[platform] = {
          success: false,
          response: null,
          error: `Direct publishing not yet supported for platform: ${platform}. Only LinkedIn is currently supported.`,
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
        action: result.success ? "linkedin_published" : `${platform}_publish_failed`,
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
