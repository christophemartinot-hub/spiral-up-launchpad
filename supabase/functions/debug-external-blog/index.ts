import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SPIRALUP_WEBSITE_SUPABASE_URL");
    const key = Deno.env.get("SPIRALUP_WEBSITE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      return new Response(JSON.stringify({ error: "missing creds", url: !!url, key: !!key }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const db = createClient(url, key);
    const ids = ["d51e33c9-75fc-48a4-b983-d3a290606e34", "05961524-f0a2-44b8-8185-9455e285c905"];
    const byId: any[] = [];
    for (const id of ids) {
      const { data, error } = await db.from("blog_posts").select("id, slug, title, status, published_at").eq("id", id).maybeSingle();
      byId.push({ id, data, error: error?.message });
    }
    const { data: agile } = await db
      .from("blog_posts")
      .select("*")
      .eq("slug", "why-agile-transformation-is-an-oxymoron")
      .maybeSingle();
    const { data: recent } = await db
      .from("blog_posts")
      .select("id, slug, title, status, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    return new Response(JSON.stringify({ byId, agile, recent }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
