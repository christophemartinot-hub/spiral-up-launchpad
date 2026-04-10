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
    // Internal Supabase client (this project)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // External Supabase client (spiralingup.works)
    const WEBSITE_URL = Deno.env.get("SPIRALUP_WEBSITE_SUPABASE_URL");
    const WEBSITE_KEY = Deno.env.get("SPIRALUP_WEBSITE_SERVICE_ROLE_KEY");
    if (!WEBSITE_URL || !WEBSITE_KEY) {
      return new Response(
        JSON.stringify({ error: "External Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const websiteDb = createClient(WEBSITE_URL, WEBSITE_KEY);

    const { blogPostId, action } = await req.json();

    // Debug: verify what's in the external DB
    if (action === "verify") {
      const { data: extPosts, error: extErr } = await websiteDb
        .from("blog_posts")
        .select("id, slug, title, status, published_at, image_url")
        .order("published_at", { ascending: false })
        .limit(10);
      
      return new Response(
        JSON.stringify({ external_posts: extPosts, error: extErr?.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!blogPostId) {
      return new Response(
        JSON.stringify({ error: "blogPostId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch blog post from internal DB
    const { data: post, error: postErr } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", blogPostId)
      .single();

    if (postErr || !post) {
      return new Response(
        JSON.stringify({ error: "Blog post not found", details: postErr?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (post.status !== "approved" && post.status !== "published" && action !== "unpublish") {
      return new Response(
        JSON.stringify({ error: "Blog post must be approved before publishing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle unpublish
    if (action === "unpublish") {
      if (!post.external_id) {
        return new Response(
          JSON.stringify({ error: "Post has no external ID to unpublish" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: unpubErr } = await websiteDb
        .from("blog_posts")
        .update({ status: "draft" })
        .eq("id", post.external_id);

      if (unpubErr) {
        return new Response(
          JSON.stringify({ error: "Failed to unpublish on website", details: unpubErr.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("blog_posts")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", blogPostId);

      return new Response(
        JSON.stringify({ success: true, action: "unpublished" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Publish: upsert to external blog_posts table
    const publishedAt = new Date().toISOString();
    const wordCount = (post.content || "").split(/\s+/).filter(Boolean).length;
    const readMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readTime = `${readMinutes} min read`;
    const category = post.content_pillar || "Leadership";
    const tags = (post.tags && (post.tags as string[]).length > 0)
      ? post.tags
      : (post.content_pillar ? [post.content_pillar] : ["Leadership"]);

    const externalPayload = {
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || post.content?.substring(0, 200) || "",
      author: post.author,
      tags,
      category,
      read_time: readTime,
      image_url: post.hero_image_url || "",
      status: "published",
      published_at: publishedAt,
    };

    let externalId = post.external_id;

    if (externalId) {
      // Verify the external record actually exists
      const { data: extCheck } = await websiteDb
        .from("blog_posts")
        .select("id")
        .eq("id", externalId)
        .maybeSingle();

      if (extCheck) {
        // Update existing
        const { error: updateErr } = await websiteDb
          .from("blog_posts")
          .update(externalPayload)
          .eq("id", externalId);

        if (updateErr) {
          return new Response(
            JSON.stringify({ error: "Failed to update on website", details: updateErr.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Stale external_id — record was deleted, insert fresh
        console.log(`Stale external_id ${externalId}, inserting new record`);
        externalId = null;
      }
    }

    if (!externalId) {
      // Insert new
      const { data: inserted, error: insertErr } = await websiteDb
        .from("blog_posts")
        .insert(externalPayload)
        .select("id")
        .single();

      if (insertErr || !inserted) {
        return new Response(
          JSON.stringify({ error: "Failed to publish to website", details: insertErr?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      externalId = inserted.id;
    }

    // Update local record
    await supabase
      .from("blog_posts")
      .update({
        status: "published",
        external_id: externalId,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", blogPostId);

    return new Response(
      JSON.stringify({
        success: true,
        action: "published",
        externalId,
        url: `https://spiralingup.works/blog/${post.slug}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("publish-blog error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
