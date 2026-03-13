import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Internal Supabase client (this project – for campaigns table)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // External Supabase client (spiralingup.works – for subscribers)
    const WEBSITE_URL = Deno.env.get("SPIRALUP_WEBSITE_SUPABASE_URL");
    const WEBSITE_KEY = Deno.env.get("SPIRALUP_WEBSITE_SERVICE_ROLE_KEY");
    if (!WEBSITE_URL || !WEBSITE_KEY) {
      return new Response(JSON.stringify({ error: "External Supabase credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const websiteDb = createClient(WEBSITE_URL, WEBSITE_KEY);

    const { campaignId } = await req.json();
    if (!campaignId) {
      return new Response(JSON.stringify({ error: "campaignId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch campaign from internal DB
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

    // Fetch subscribers from external spiralingup.works DB (book_leads table)
    const segment = campaign.recipient_segment || "all";
    let query = websiteDb.from("book_leads").select("email, source").eq("updates", true);
    if (segment !== "all") {
      query = query.eq("source", segment);
    }
    const { data: subscribers, error: subErr } = await query;

    if (subErr || !subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ error: "No subscribers found in book_leads", details: subErr?.message }), {
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
  const introText = (campaign.intro_text as string) || "Insights on leadership, team dynamics, and the 6 principles that help teams move from stagnation to transformation.";
  const blogSummary = (campaign.blog_summary as string) || "";
  const ctaText = (campaign.cta_text as string) || "Read Full Article →";
  const ctaUrl = (campaign.cta_url as string) || "https://spiralingup.works";
  const headerImage = campaign.header_image_url as string;
  const subjectLine = (campaign.subject_line as string) || "";
  const year = new Date().getFullYear();

  const teal = "#6BA8A0";
  const coral = "#D4836B";
  const bgOuter = "#f5f3f0";
  const bgCard = "#ffffff";
  const bgMint = "#f0f7f5";
  const textDark = "#2d2d2d";
  const textMuted = "#666666";
  const textLight = "#999999";

  const previewSpan = previewText
    ? '<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">' + previewText + '</span>'
    : "";

  const headerImageBlock = headerImage
    ? '<tr><td style="background:' + bgCard + ';padding:16px 32px;">' +
      '<img src="' + headerImage + '" width="536" style="display:block;width:100%;height:auto;border-radius:12px;" alt="Article illustration" />' +
      '</td></tr>'
    : "";

  const blogSummaryBlock = blogSummary
    ? '<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:' + textMuted + ';">' + blogSummary + '</p>'
    : "";

  return '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>' + subjectLine + '</title>' + previewSpan + '</head>' +
    '<body style="margin:0;padding:0;background-color:' + bgOuter + ';font-family:\'Helvetica Neue\',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:' + bgOuter + ';padding:24px 16px;">' +
    '<tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">' +

    // HEADER BANNER
    '<tr><td>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:' + teal + ';border-radius:16px 16px 0 0;overflow:hidden;">' +
    '<tr><td style="padding:28px 32px;">' +
    '<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;font-family:Georgia,\'Times New Roman\',serif;">Let\'s SPIRAL <span style="color:#FFD93D;">UP!</span></h1>' +
    '<p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">✨ HI {{name}}, NEW ARTICLE!</p>' +
    '</td></tr></table></td></tr>' +

    // INTRO TEXT
    '<tr><td style="background:' + bgCard + ';padding:28px 32px 12px;">' +
    '<p style="margin:0;font-size:15px;line-height:1.7;color:' + textMuted + ';font-style:italic;text-align:center;">' +
    introText + '</p></td></tr>' +

    // HEADER IMAGE
    headerImageBlock +

    // ARTICLE TITLE & SUMMARY
    '<tr><td style="background:' + bgCard + ';padding:20px 32px;">' +
    '<h2 style="margin:0 0 12px;font-size:24px;font-weight:800;color:' + textDark + ';font-family:Georgia,\'Times New Roman\',serif;line-height:1.3;">' +
    subjectLine + '</h2>' + blogSummaryBlock + '</td></tr>' +

    // PRIMARY CTA
    '<tr><td style="background:' + bgCard + ';padding:4px 32px 24px;">' +
    '<table cellpadding="0" cellspacing="0"><tr><td style="background:' + teal + ';border-radius:8px;">' +
    '<a href="' + ctaUrl + '" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">' + ctaText + '</a>' +
    '</td></tr></table></td></tr>' +

    // LANGUAGE NOTICE
    '<tr><td style="background:' + bgCard + ';padding:0 32px 24px;">' +
    '<div style="background:' + bgMint + ';border-radius:8px;padding:14px 18px;">' +
    '<p style="margin:0;font-size:13px;color:' + textMuted + ';">🌍 <strong>Now available in multiple languages!</strong><br/>Read this article in 🇪🇸 Spanish or 🇫🇷 French — just click the translate buttons on the article page.</p>' +
    '</div></td></tr>' +

    // DIVIDER
    '<tr><td style="padding:8px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #e8e4e0;"></td></tr></table></td></tr>' +

    // GET THE BOOK
    '<tr><td>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4e0;border-radius:12px;overflow:hidden;background:' + bgCard + ';">' +
    '<tr><td style="padding:28px 32px;">' +
    '<div style="background:' + bgMint + ';border-radius:12px;padding:24px;">' +
    '<h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:' + textDark + ';font-family:Georgia,\'Times New Roman\',serif;">📚 Get the Book</h3>' +
    '<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:' + textMuted + ';">Discover the complete SPIRAL UP® framework and transform how your team delivers value.</p>' +
    '<table cellpadding="0" cellspacing="0"><tr><td style="background:' + coral + ';border-radius:8px;">' +
    '<a href="https://spiralingup.works/book" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">Buy the Book →</a>' +
    '</td></tr></table></div></td></tr></table></td></tr>' +

    // SPACER
    '<tr><td style="height:16px;"></td></tr>' +

    // DIAGNOSTIC CTA
    '<tr><td>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e4e0;border-radius:12px;overflow:hidden;background:' + bgCard + ';">' +
    '<tr><td style="padding:28px 32px;text-align:center;">' +
    '<h3 style="margin:0 0 8px;font-size:18px;font-weight:700;color:' + textDark + ';font-family:Georgia,\'Times New Roman\',serif;">📊 How Agile Is Your Organization?</h3>' +
    '<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:' + textMuted + ';">Take our free 5-minute Business Agility Diagnostic to uncover whether your organization is locked in rigidity or truly adaptive.</p>' +
    '<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background:' + teal + ';border-radius:8px;">' +
    '<a href="https://spiralingup.works/diagnostic" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">Take the Diagnostic →</a>' +
    '</td></tr></table></td></tr></table></td></tr>' +

    // SPACER
    '<tr><td style="height:16px;"></td></tr>' +

    // FOOTER
    '<tr><td>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:' + bgCard + ';border-radius:0 0 16px 16px;border:1px solid #e8e4e0;">' +
    '<tr><td style="padding:24px 32px;text-align:center;">' +
    '<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:' + textDark + ';">Connect With Us</p>' +
    '<p style="margin:0 0 20px;font-size:13px;">' +
    '<a href="https://linkedin.com/company/spiral-up" style="color:' + teal + ';text-decoration:none;font-weight:500;">LinkedIn</a>' +
    '<span style="color:#ccc;"> | </span>' +
    '<a href="https://instagram.com/spiralingup" style="color:' + coral + ';text-decoration:none;font-weight:500;">Instagram</a>' +
    '<span style="color:#ccc;"> | </span>' +
    '<a href="https://wa.me/" style="color:#25D366;text-decoration:none;font-weight:500;">WhatsApp</a>' +
    '<span style="color:#ccc;"> | </span>' +
    '<a href="mailto:connect@spiralingup.works" style="color:' + textMuted + ';text-decoration:none;font-weight:500;">Email</a>' +
    '<span style="color:#ccc;"> | </span>' +
    '<a href="https://spiralingup.works/meeting" style="color:' + coral + ';text-decoration:none;font-weight:500;">Book a Meeting</a></p>' +
    '<p style="margin:0 0 8px;font-size:12px;color:' + textLight + ';">You received this because you signed up for Spiral Up updates.</p>' +
    '<p style="margin:0 0 16px;font-size:12px;"><a href="https://spiralingup.works/unsubscribe" style="color:' + textLight + ';text-decoration:underline;">Unsubscribe from these emails</a></p>' +
    '<p style="margin:0;font-size:11px;color:' + textLight + ';">© ' + year + ' SPIRAL UP™. All rights reserved.</p>' +
    '</td></tr></table></td></tr>' +

    // BOTTOM TAG
    '<tr><td style="padding:16px 0;text-align:center;">' +
    '<p style="margin:0;font-size:11px;color:' + textLight + ';">Transform your team with the SPIRAL UP® framework</p>' +
    '</td></tr>' +

    '</table></td></tr></table></body></html>';
}
