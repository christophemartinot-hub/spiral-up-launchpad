import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return new Response(
        JSON.stringify({ error: "item_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: item, error: fetchError } = await supabase
      .from("editorial_items")
      .select("*")
      .eq("id", item_id)
      .single();

    if (fetchError || !item) {
      return new Response(
        JSON.stringify({ error: "Item not found", details: fetchError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");

    if (!makeWebhookUrl) {
      return new Response(
        JSON.stringify({ error: "MAKE_WEBHOOK_URL secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const makePayload = {
      item_id: item.id,
      channel: item.channel,
      working_title: item.working_title,
      draft_content: item.draft_content,
      image_url: item.image_url,
      publish_date: item.publish_date,
      publish_time: item.publish_time,
      content_pillar: item.content_pillar,
      cta: item.cta,
      status: item.status,
    };

    const makeResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makePayload),
    });

    if (!makeResponse.ok) {
      const makeError = await makeResponse.text();
      return new Response(
        JSON.stringify({ error: "Make webhook call failed", details: makeError }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Consume body
    await makeResponse.text();

    await supabase.from("audit_log").insert({
      action: "publish_dispatched_to_make",
      entity_type: "editorial_item",
      entity_id: item_id,
      details: {
        channel: item.channel,
        publish_date: item.publish_date,
        publish_time: item.publish_time,
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: `Dispatched to Make for channel: ${item.channel}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
