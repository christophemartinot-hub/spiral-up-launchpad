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

    const WEBSITE_URL = Deno.env.get("SPIRALUP_WEBSITE_SUPABASE_URL");
    const WEBSITE_KEY = Deno.env.get("SPIRALUP_WEBSITE_SERVICE_ROLE_KEY");
    if (!WEBSITE_URL || !WEBSITE_KEY) {
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const websiteDb = createClient(WEBSITE_URL, WEBSITE_KEY);

    const now = new Date().toISOString();

    // Find approved posts whose scheduled time has passed
    const { data: duePosts, error: queryErr } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "approved")
      .not("scheduled_publish_at", "is", null)
      .lte("scheduled_publish_at", now);

    if (queryErr) {
      console.error("Query error:", queryErr);
      return new Response(
        JSON.stringify({ error: queryErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!duePosts || duePosts.length === 0) {
      return new Response(
        JSON.stringify({ published: 0, message: "No posts due for publishing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Array<{ id: string; slug: string; success: boolean; error?: string }> = [];

    for (const post of duePosts) {
      try {
        const publishedAt = new Date().toISOString();
        const externalPayload = {
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          author: post.author,
          tags: post.tags || [],
          image_url: post.hero_image_url || "",
          status: "published",
          published_at: publishedAt,
        };

        let externalId = post.external_id;

        if (externalId) {
          const { error: updateErr } = await websiteDb
            .from("blog_posts")
            .update(externalPayload)
            .eq("id", externalId);
          if (updateErr) throw updateErr;
        } else {
          const { data: inserted, error: insertErr } = await websiteDb
            .from("blog_posts")
            .insert(externalPayload)
            .select("id")
            .single();
          if (insertErr || !inserted) throw insertErr || new Error("Insert failed");
          externalId = inserted.id;
        }

        await supabase
          .from("blog_posts")
          .update({
            status: "published",
            external_id: externalId,
            published_at: publishedAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({ id: post.id, slug: post.slug, success: true });
      } catch (e) {
        console.error(`Failed to publish ${post.id}:`, e);
        results.push({ id: post.id, slug: post.slug, success: false, error: e.message });
      }
    }

    return new Response(
      JSON.stringify({ published: results.filter(r => r.success).length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("publish-scheduled-blogs error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
