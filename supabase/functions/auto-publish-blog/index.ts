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

    const { editorialItemId } = await req.json();
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

    // Check if blog_post already exists for this editorial item
    const { data: existingPost } = await supabase
      .from("blog_posts")
      .select("id, status, external_id")
      .eq("editorial_item_id", editorialItemId)
      .maybeSingle();

    const slug = (item.working_title || "post")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    const publishedAt = new Date().toISOString();

    const blogPayload = {
      title: item.working_title || "Untitled",
      slug,
      content: item.draft_content || "",
      excerpt: item.practical_takeaway || item.insight_delivered || "",
      meta_description: item.key_message || item.practical_takeaway || "",
      author: "Christophe Martinot",
      tags: [item.content_pillar, item.content_format].filter(Boolean),
      content_pillar: item.content_pillar || null,
      visual_type: item.visual_type || null,
      visual_concept: item.visual_concept || null,
      visual_rationale: item.visual_rationale || null,
      editorial_item_id: editorialItemId,
      hero_image_url: "",
      status: "approved",
    };

    let blogPostId: string;

    if (existingPost) {
      // Update existing blog post
      blogPostId = existingPost.id;
      const { error: updateErr } = await supabase
        .from("blog_posts")
        .update({ ...blogPayload, updated_at: publishedAt })
        .eq("id", blogPostId);
      if (updateErr) throw updateErr;
    } else {
      // Create new blog post
      const { data: created, error: createErr } = await supabase
        .from("blog_posts")
        .insert(blogPayload)
        .select("id")
        .single();
      if (createErr || !created) throw createErr || new Error("Failed to create blog post");
      blogPostId = created.id;
    }

    // Now publish to external website
    const externalPayload = {
      title: blogPayload.title,
      slug: blogPayload.slug,
      content: blogPayload.content,
      excerpt: blogPayload.excerpt,
      author: blogPayload.author,
      tags: blogPayload.tags || [],
      image_url: item.image_url || blogPayload.hero_image_url || "",
      status: "published",
      published_at: publishedAt,
    };

    let externalId = existingPost?.external_id || null;

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
      if (insertErr || !inserted) throw insertErr || new Error("External insert failed");
      externalId = inserted.id;
    }

    // Update local blog_post with published status
    await supabase
      .from("blog_posts")
      .update({
        status: "published",
        external_id: externalId,
        published_at: publishedAt,
        updated_at: publishedAt,
      })
      .eq("id", blogPostId);

    // Update editorial item to published
    await supabase
      .from("editorial_items")
      .update({ status: "published", updated_at: publishedAt })
      .eq("id", editorialItemId);

    return new Response(
      JSON.stringify({
        success: true,
        blogPostId,
        externalId,
        url: `https://spiralingup.works/blog/${slug}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("auto-publish-blog error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
