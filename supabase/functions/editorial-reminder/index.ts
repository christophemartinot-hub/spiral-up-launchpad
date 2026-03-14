import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if there's already a plan for this week
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const { data: existingPlan } = await supabase
      .from("editorial_plans")
      .select("id, status")
      .gte("cycle_start", monday.toISOString().split("T")[0])
      .lte("cycle_start", sunday.toISOString().split("T")[0])
      .limit(1)
      .maybeSingle();

    // If a plan already exists for this week, skip the reminder
    if (existingPlan) {
      return new Response(JSON.stringify({ skipped: true, reason: "Plan already exists for this week" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send reminder email via Resend
    const weekLabel = `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Spiral Up Platform <connect@spiralingup.works>",
        to: ["cmartinot@mac.com"],
        subject: `📋 Time to generate your editorial plan (${weekLabel})`,
        html: `
          <div style="font-family: 'Titillium Web', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
            <h1 style="color: #2E446D; font-size: 22px; margin-bottom: 8px;">Weekly Editorial Reminder</h1>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Hi Christophe,
            </p>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              No editorial plan has been generated yet for <strong>${weekLabel}</strong>.
            </p>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">
              Head to the platform and hit <strong>"Generate Plan"</strong> to get your AI-powered content suggestions for the week.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://id-preview--40de3559-336d-4867-a118-004257f4ba17.lovable.app/editorial"
                 style="display: inline-block; background-color: #E8503A; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Open Editorial Planner →
              </a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
              This is an automated reminder from your Spiral Up Content Platform.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Failed to send reminder email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sent: true, week: weekLabel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Reminder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
