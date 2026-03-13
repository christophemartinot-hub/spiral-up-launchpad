import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const { campaignId } = await req.json();
    if (!campaignId) {
      return new Response(JSON.stringify({ error: "campaignId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch campaign
    const { data: campaign, error: campErr } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active subscribers
    const segment = campaign.recipient_segment || "all";
    let query = supabase.from("subscribers").select("email, name").eq("status", "active");
    if (segment !== "all") {
      query = query.eq("segment", segment);
    }
    const { data: subscribers, error: subErr } = await query;

    if (subErr || !subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ error: "No active subscribers found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build HTML email body
    const htmlBody = buildEmailHtml(campaign);

    // Send via Resend (batch - up to 100 per call)
    const batchSize = 50;
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      // Send individually to personalize
      const sendPromises = batch.map(async (sub) => {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Spiral Up <connect@spiralingup.works>",
              to: [sub.email],
              subject: campaign.subject_line,
              html: htmlBody.replace("{{name}}", sub.name || "there"),
              text: campaign.plain_text_fallback || undefined,
            }),
          });

          if (res.ok) {
            totalSent++;
          } else {
            const errData = await res.json();
            console.error(`Failed to send to ${sub.email}:`, errData);
            totalFailed++;
          }
        } catch (e) {
          console.error(`Error sending to ${sub.email}:`, e);
          totalFailed++;
        }
      });

      await Promise.all(sendPromises);
    }

    // Update campaign with results
    const updateData: Record<string, unknown> = {
      status: totalSent > 0 ? "sent" : "failed",
      sent_at: new Date().toISOString(),
      total_sent: totalSent,
      recipient_count: subscribers.length,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("email_campaigns").update(updateData).eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        totalSent,
        totalFailed,
        totalRecipients: subscribers.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-email error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildEmailHtml(campaign: Record<string, unknown>): string {
  const previewText = (campaign.preview_text as string) || "";
  const introText = (campaign.intro_text as string) || "";
  const blogSummary = (campaign.blog_summary as string) || "";
  const ctaText = (campaign.cta_text as string) || "Read More";
  const ctaUrl = (campaign.cta_url as string) || "https://spiralingup.works";
  const headerImage = campaign.header_image_url as string;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${campaign.subject_line}</title>
  ${previewText ? `<span style="display:none;max-height:0;overflow:hidden">${previewText}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:#f7f5f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6B4226,#8B5E3C);padding:32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Spiral Up</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Leadership & Growth Insights</p>
        </td></tr>
        ${headerImage ? `<tr><td><img src="${headerImage}" width="600" style="display:block;width:100%;height:auto;" /></td></tr>` : ""}
        <!-- Body -->
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#333;">Hi {{name}},</p>
          ${introText ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#444;">${introText}</p>` : ""}
          ${blogSummary ? `<div style="margin:20px 0;padding:20px;background:#f9f7f5;border-left:4px solid #8B5E3C;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#444;">${blogSummary}</p>
          </div>` : ""}
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td align="center">
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background:#6B4226;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">${ctaText}</a>
            </td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} Spiral Up · spiralingup.works</p>
          <p style="margin:8px 0 0;font-size:11px;color:#bbb;">You're receiving this because you subscribed to our insights.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
