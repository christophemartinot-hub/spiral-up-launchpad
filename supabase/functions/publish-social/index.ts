import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/wc79v8shf54gem9nwuq913fzpfikppi2";

/** Map visual_type / content_format to a Make-friendly post_type */
function resolvePostType(visualType: string, contentFormat: string, hasImage: boolean): string {
  const vt = (visualType || "").toLowerCase();
  const cf = (contentFormat || "").toLowerCase();
  if (vt === "carousel" || cf === "carousel") return "carousel";
  if (vt === "video_storyboard" || cf === "reel" || cf === "video") return "video";
  if (vt === "document_post") return "document";
  if (hasImage) return "image";
  return "text";
}

/** Validate that a URL looks like a public image the platforms will accept */
function isValidPublicImageUrl(url: unknown): url is string {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    // Basic extension check – platforms accept jpg/jpeg/png/webp
    const ext = u.pathname.split(".").pop()?.toLowerCase() ?? "";
    // Also accept URLs without extension (e.g. Supabase Storage signed URLs)
    if (ext && !["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return false;
    return true;
  } catch {
    return false;
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
      const unpublishPayload = {
        platforms: targetPlatforms,
        post_type: "text",
        caption: "",
        image_url: null,
        alt_text: null,
        title: item.working_title || null,
        content_id: `post_${item.id}`,
        action: "unpublish",
      };

      console.log("Sending unpublish to Make.com:", JSON.stringify(unpublishPayload));

      let webhookSuccess = false;
      let webhookError = "";
      try {
        const res = await fetch(MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(unpublishPayload),
        });
        webhookSuccess = res.ok;
        if (!res.ok) webhookError = `HTTP ${res.status}`;
      } catch (err) {
        webhookError = err instanceof Error ? err.message : "Unknown error";
      }

      // Reset status to approved
      await supabase
        .from("editorial_items")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", editorialItemId);

      await supabase.from("audit_log").insert({
        action: "unpublish_social",
        entity_type: "editorial_item",
        entity_id: editorialItemId,
        details: { platforms: targetPlatforms, success: webhookSuccess, error: webhookError || undefined },
      });

      return new Response(
        JSON.stringify({ success: webhookSuccess, action: "unpublished", platforms: targetPlatforms }),
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

    // 2. Validate image URL — never send empty string
    const validImage = isValidPublicImageUrl(imageUrl);
    const finalImageUrl = validImage ? imageUrl : null;

    // 3. Resolve post_type
    const postType = resolvePostType(item.visual_type, item.content_format, !!finalImageUrl);

    // 4. Build payload matching the exact Make.com structure
    const payload = {
      platforms: targetPlatforms,
      post_type: postType,
      caption: item.draft_content || "",
      image_url: finalImageUrl,
      alt_text: item.visual_concept || null,
      title: item.working_title || null,
      content_id: `post_${item.id}`,
    };

    console.log("Sending publish to Make.com:", JSON.stringify(payload));

    // 5. POST to Make.com webhook
    let webhookSuccess = false;
    let webhookError = "";
    let webhookResponseBody: unknown = null;
    try {
      const res = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Capture Make.com response body for debugging
      try {
        const responseText = await res.text();
        try { webhookResponseBody = JSON.parse(responseText); } catch { webhookResponseBody = responseText; }
      } catch { /* ignore */ }

      if (!res.ok) {
        webhookSuccess = false;
        webhookError = `HTTP ${res.status}: ${typeof webhookResponseBody === 'string' ? webhookResponseBody : JSON.stringify(webhookResponseBody)}`;
      } else {
        // Check if Make.com returned an error in the body (e.g. "Accepted" without execution)
        const body = webhookResponseBody;
        if (body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)) {
          webhookSuccess = false;
          webhookError = `Make.com error: ${(body as Record<string, unknown>).error}`;
        } else {
          webhookSuccess = true;
        }
      }
      console.log("Make.com response:", res.status, JSON.stringify(webhookResponseBody));
    } catch (err) {
      webhookError = err instanceof Error ? err.message : "Unknown error";
    }

    // 6. Update status — only mark published on confirmed success
    if (webhookSuccess) {
      await supabase
        .from("editorial_items")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", editorialItemId);
    } else {
      // Mark as error so the user sees it failed
      await supabase
        .from("editorial_items")
        .update({ status: "approved", rejection_reason: webhookError || "Publishing failed — check Make.com scenario", updated_at: new Date().toISOString() })
        .eq("id", editorialItemId);
    }

    // 7. Audit log with full response body
    await supabase.from("audit_log").insert({
      action: "publish_social",
      entity_type: "editorial_item",
      entity_id: editorialItemId,
      details: { payload, success: webhookSuccess, error: webhookError || undefined, make_response: webhookResponseBody },
    });

    return new Response(
      JSON.stringify({
        success: webhookSuccess,
        platforms: targetPlatforms,
        post_type: postType,
        image_url: finalImageUrl,
        error: webhookError || undefined,
        make_response: webhookResponseBody,
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
