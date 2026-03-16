import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Fetch the editorial item
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

    // Fetch social connections with webhook URLs
    let query = supabase
      .from("social_connections")
      .select("*")
      .eq("connected", true)
      .not("webhook_url", "is", null);

    // If specific channels requested, filter
    if (channels && channels.length > 0) {
      query = query.in("channel", channels);
    } else {
      // Default: send to the item's channel
      query = query.eq("channel", item.channel);
    }

    const { data: connections, error: connErr } = await query;

    if (connErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch connections", details: connErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: "No connected channels with webhook URLs found for this content" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UNPUBLISH FLOW ──
    if (isUnpublish) {
      const targetPlatforms = connections.map((c: any) => c.channel as string);
      const unpublishPayload = {
        post_id: `post_${item.id}`,
        platforms: targetPlatforms,
        action: "unpublish",
        status: "unpublished",
        editorial_item_id: item.id,
        title: item.working_title,
        source: "spiral-up-editorial",
      };

      const results: Array<{ channel: string; account: string; success: boolean; error?: string }> = [];

      // Group by webhook URL
      const webhookGroups = new Map<string, typeof connections>();
      for (const conn of connections) {
        const url = conn.webhook_url;
        if (!webhookGroups.has(url)) webhookGroups.set(url, []);
        webhookGroups.get(url)!.push(conn);
      }

      for (const [webhookUrl, conns] of webhookGroups) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...unpublishPayload, platforms: conns.map((c: any) => c.channel) }),
          });
          for (const conn of conns) {
            results.push({ channel: conn.channel, account: conn.account_name, success: true });
          }
        } catch (err) {
          for (const conn of conns) {
            results.push({ channel: conn.channel, account: conn.account_name, success: false, error: err instanceof Error ? err.message : "Unknown error" });
          }
        }
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
        details: { results, channels: connections.map((c: any) => c.channel) },
      });

      return new Response(
        JSON.stringify({ success: true, results, action: "unpublished" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── PUBLISH FLOW ──
    // Generate image from visual concept if available
    let imageUrl = "";
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

    // Map visual_type / content_format to Make.com-friendly post_type
    const resolvePostType = (visualType: string, contentFormat: string): string => {
      const vt = (visualType || "").toLowerCase();
      const cf = (contentFormat || "").toLowerCase();
      if (vt === "carousel" || cf === "carousel") return "carousel";
      if (vt === "video_storyboard" || cf === "reel" || cf === "video") return "reel";
      if (vt === "single_image" || vt === "quote_card" || vt === "framework_card" ||
          vt === "infographic" || vt === "event_promo" || vt === "workshop_promo" ||
          vt === "book_promo" || vt === "article_cover") return "image";
      if (vt === "document_post") return "document";
      return imageUrl ? "image" : "text";
    };

    const postType = resolvePostType(item.visual_type, item.content_format);
    const caption = item.draft_content || "";
    const targetPlatforms = connections.map((c: any) => c.channel as string);

    // ── Flat payload for Make.com webhook ──
    // If we have a real image URL → post_type from visual mapping; otherwise always "text"
    const finalPostType = imageUrl ? postType : "text";
    const payload: Record<string, unknown> = {
      platforms: targetPlatforms,
      post_type: finalPostType,
      caption,
      image_url: imageUrl || null,
    };

    // Group connections by unique webhook URL
    const webhookGroups = new Map<string, typeof connections>();
    for (const conn of connections) {
      const url = conn.webhook_url;
      if (!webhookGroups.has(url)) webhookGroups.set(url, []);
      webhookGroups.get(url)!.push(conn);
    }

    const results: Array<{ channel: string; account: string; success: boolean; error?: string }> = [];

    for (const [webhookUrl, conns] of webhookGroups) {
      try {
        const webhookPayload = { ...payload, platforms: conns.map((c: any) => c.channel) };
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        for (const conn of conns) {
          results.push({ channel: conn.channel, account: conn.account_name, success: true });
        }
      } catch (err) {
        for (const conn of conns) {
          results.push({ channel: conn.channel, account: conn.account_name, success: false, error: err instanceof Error ? err.message : "Unknown error" });
        }
      }
    }

    // Update status to published
    const allSuccess = results.every((r) => r.success);
    if (allSuccess) {
      await supabase
        .from("editorial_items")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", editorialItemId);
    }

    await supabase.from("audit_log").insert({
      action: "publish_social",
      entity_type: "editorial_item",
      entity_id: editorialItemId,
      details: { results, channels: connections.map((c: any) => c.channel) },
    });

    return new Response(
      JSON.stringify({ success: allSuccess, results }),
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
