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

    if (item.channel !== "linkedin") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not a LinkedIn item" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const linkedinToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
    const linkedinUrn = Deno.env.get("LINKEDIN_PERSON_URN");

    if (!linkedinToken || !linkedinUrn) {
      return new Response(
        JSON.stringify({ error: "LinkedIn credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const postContent = item.draft_content || item.working_title;

    const linkedinPayload: any = {
      author: linkedinUrn,
      commentary: postContent,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    if (item.image_url) {
      linkedinPayload.content = {
        article: {
          source: item.image_url,
          title: item.working_title,
          description: item.key_message || "",
        },
      };
    }

    const linkedinResponse = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${linkedinToken}`,
        "LinkedIn-Version": "202603",
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(linkedinPayload),
    });

    const linkedinResponseText = await linkedinResponse.text();

    if (!linkedinResponse.ok) {
      await supabase.from("audit_log").insert({
        action: "linkedin_publish_failed",
        entity_type: "editorial_item",
        entity_id: item_id,
        details: {
          status: linkedinResponse.status,
          error: linkedinResponseText,
        },
      });

      return new Response(
        JSON.stringify({ error: "LinkedIn API call failed", details: linkedinResponseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("editorial_items")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", item_id);

    await supabase.from("audit_log").insert({
      action: "linkedin_published",
      entity_type: "editorial_item",
      entity_id: item_id,
      details: {
        channel: "linkedin",
        working_title: item.working_title,
        publish_date: item.publish_date,
        linkedin_response: linkedinResponseText,
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Published to LinkedIn ✅" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
