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

    const { editorialItemId, channels } = await req.json();

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

    // Build the payload for the webhook (Make.com, Zapier, etc.)
    const payload = {
      title: item.working_title,
      content: item.draft_content || "",
      channel: item.channel,
      content_format: item.content_format,
      content_pillar: item.content_pillar || "",
      cta: item.suggested_cta || item.cta || "",
      publish_date: item.publish_date,
      key_message: item.key_message || "",
      post_angle: item.post_angle || "",
      visual_type: item.visual_type || "",
      visual_concept: item.visual_concept || "",
      hashtags: "",
      carousel_idea: item.carousel_idea || "",
      objective: item.objective || "",
      source: "spiral-up-editorial",
      editorial_item_id: item.id,
      timestamp: new Date().toISOString(),
    };

    // Fire webhooks for each connection
    const results: Array<{ channel: string; account: string; success: boolean; error?: string }> = [];

    for (const conn of connections) {
      try {
        const webhookPayload = {
          ...payload,
          target_channel: conn.channel,
          target_account: conn.account_name,
        };

        await fetch(conn.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        // Webhook services typically return 200, so we assume success
        results.push({ channel: conn.channel, account: conn.account_name, success: true });
      } catch (err) {
        results.push({
          channel: conn.channel,
          account: conn.account_name,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Update the editorial item status to published
    const allSuccess = results.every((r) => r.success);
    if (allSuccess) {
      await supabase
        .from("editorial_items")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", editorialItemId);
    }

    // Log to audit
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
