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

    const body = await req.json();
    const { item_id, content, image_url, source } = body;

    if (!item_id) {
      return new Response(
        JSON.stringify({ error: "item_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve post content based on source
    let postContent: string;
    let postImageUrl: string | null = null;
    let postTitle: string | null = null;
    let keyMessage: string | null = null;

    if (source === "linkedin_posts") {
      // Called from LinkedIn Publishing page — use body content directly
      postContent = content || "";
      postImageUrl = image_url || null;

      // Optionally enrich from the DB row
      const { data: post } = await supabase
        .from("linkedin_posts")
        .select("content, image_url, hook, content_pillar")
        .eq("id", item_id)
        .maybeSingle();

      if (post) {
        postContent = postContent || post.content;
        postImageUrl = postImageUrl || post.image_url || null;
        postTitle = post.hook || null;
      }
    } else {
      // Default: editorial_items source
      const { data: item, error: fetchError } = await supabase
        .from("editorial_items")
        .select("*")
        .eq("id", item_id)
        .maybeSingle();

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

      postContent = item.draft_content || item.working_title;
      postImageUrl = item.image_url || null;
      postTitle = item.working_title || null;
      keyMessage = item.key_message || null;
    }

    // Validate credentials
    const linkedinToken = Deno.env.get("LINKEDIN_ACCESS_TOKEN");
    const linkedinUrn = Deno.env.get("LINKEDIN_PERSON_URN");

    if (!linkedinToken || !linkedinUrn) {
      return new Response(
        JSON.stringify({ error: "LinkedIn credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build LinkedIn payload
    const linkedinPayload: Record<string, unknown> = {
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

    if (postImageUrl) {
      linkedinPayload.content = {
        article: {
          source: postImageUrl,
          title: postTitle || "",
          description: keyMessage || "",
        },
      };
    }

    console.log("Publishing to LinkedIn:", { item_id, source, hasImage: !!postImageUrl });

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

    // Audit log
    const auditAction = linkedinResponse.ok ? "linkedin_published" : "linkedin_publish_failed";
    await supabase.from("audit_log").insert({
      action: auditAction,
      entity_type: source === "linkedin_posts" ? "linkedin_post" : "editorial_item",
      entity_id: item_id,
      details: {
        source,
        status: linkedinResponse.status,
        image_url: postImageUrl,
        response: linkedinResponseText.substring(0, 500),
      },
    });

    if (!linkedinResponse.ok) {
      return new Response(
        JSON.stringify({ error: "LinkedIn API call failed", details: linkedinResponseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status in source table
    if (source === "linkedin_posts") {
      await supabase
        .from("linkedin_posts")
        .update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", item_id);
    } else {
      await supabase
        .from("editorial_items")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", item_id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Published to LinkedIn ✅" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("publish-to-linkedin error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
