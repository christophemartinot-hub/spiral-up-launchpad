// Scans editorial_items scheduled in the past for social channels
// (linkedin, facebook, instagram) and dispatches them via publish-social.
// Triggered by pg_cron every 5 minutes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIAL_CHANNELS = ["linkedin", "facebook", "instagram"];

function buildScheduleTimestamp(date: string, time: string | null): string {
  // editorial_items.publish_date is a date, publish_time is "HH:MM" or null.
  const t = time && /^\d{2}:\d{2}/.test(time) ? time : "09:00";
  // Treat as UTC to keep deterministic comparison with now()
  return `${date}T${t}:00Z`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const nowMs = Date.now();

    // Pick scheduled or approved items on social channels with a publish_date.
    const { data: items, error } = await supabase
      .from("editorial_items")
      .select("id, channel, status, publish_date, publish_time, working_title")
      .in("channel", SOCIAL_CHANNELS)
      .in("status", ["scheduled", "approved"])
      .not("publish_date", "is", null)
      .order("publish_date", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Query error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const due = (items || []).filter((it) => {
      const ts = buildScheduleTimestamp(it.publish_date as string, (it as any).publish_time);
      return Date.parse(ts) <= nowMs;
    });

    if (due.length === 0) {
      return new Response(
        JSON.stringify({ dispatched: 0, message: "No social items due" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: Array<{ id: string; channel: string; success: boolean; error?: string }> = [];

    for (const item of due) {
      try {
        // Skip if a recent publish was already dispatched (idempotency guard)
        const { data: recent } = await supabase
          .from("audit_log")
          .select("id")
          .eq("entity_id", item.id)
          .in("action", ["publish_social", "linkedin_published"])
          .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
          .limit(1);

        if (recent && recent.length > 0) {
          results.push({ id: item.id, channel: item.channel, success: true, error: "skipped (recent dispatch)" });
          continue;
        }

        const res = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/publish-social`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ editorialItemId: item.id }),
          },
        );

        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);

        results.push({ id: item.id, channel: item.channel, success: true });
      } catch (e: any) {
        console.error(`Failed dispatch for ${item.id}:`, e);
        results.push({ id: item.id, channel: item.channel, success: false, error: e.message });
      }
    }

    return new Response(
      JSON.stringify({
        dispatched: results.filter((r) => r.success).length,
        total: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("publish-scheduled-social error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
