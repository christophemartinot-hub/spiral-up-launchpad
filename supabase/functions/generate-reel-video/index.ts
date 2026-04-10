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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { reel_script, caption, content_pillar, post_id } = await req.json();

    if (!reel_script && !caption) {
      return new Response(
        JSON.stringify({ error: "reel_script or caption is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Use AI to create a concise video prompt from the reel script
    console.log("Step 1: Creating video prompt from reel script...");

    const refineResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: `You are creating a video prompt for a professional Instagram Reel for the Spiral Up brand.

BRAND CONTEXT:
- Spiral Up is a business transformation and leadership brand
- Visual style: Professional, human-centered, modern, editorial quality
- Topics: Team dynamics, leadership, organizational transformation, business agility

REEL SCRIPT:
${reel_script || caption}

CONTENT PILLAR: ${content_pillar || "Leadership"}

TASK:
Create a single, concise video generation prompt (2-3 sentences max) that describes the visual scene for this reel.
- Focus on professional, realistic visuals
- Include specific scene description, camera movement, lighting, and mood
- Aspect ratio is 9:16 (vertical/portrait for Instagram)
- Should feel cinematic and professional, not stock-footage generic
- No text overlays in the video itself
- No logos
- Avoid corporate clichés (handshakes, boardroom meetings)

Return ONLY the video prompt. No explanation.`
        }],
      }),
    });

    if (!refineResponse.ok) {
      const errText = await refineResponse.text();
      throw new Error(`Prompt refinement failed [${refineResponse.status}]: ${errText}`);
    }

    const refineData = await refineResponse.json();
    const videoPrompt = refineData.choices?.[0]?.message?.content?.trim();

    if (!videoPrompt) {
      throw new Error("No video prompt returned from AI");
    }

    console.log("Video prompt:", videoPrompt);

    // Step 2: Generate video using Lovable's video generation
    console.log("Step 2: Generating video...");

    const videoResponse = await fetch("https://ai.gateway.lovable.dev/v1/video/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: videoPrompt,
        aspect_ratio: "9:16",
        duration: 5,
        resolution: "1080p",
      }),
    });

    if (!videoResponse.ok) {
      const errText = await videoResponse.text();
      throw new Error(`Video generation failed [${videoResponse.status}]: ${errText}`);
    }

    const videoData = await videoResponse.json();
    const videoUrl = videoData.url || videoData.video_url || videoData.data?.[0]?.url;

    if (!videoUrl) {
      console.error("Video response:", JSON.stringify(videoData).substring(0, 2000));
      throw new Error("No video URL returned from generation API");
    }

    console.log("Video generated:", videoUrl);

    // Step 3: Download and upload to storage
    console.log("Step 3: Uploading to storage...");

    const videoDownload = await fetch(videoUrl);
    if (!videoDownload.ok) {
      throw new Error(`Failed to download generated video: ${videoDownload.status}`);
    }

    const videoBytes = new Uint8Array(await videoDownload.arrayBuffer());
    const fileName = `reels/${post_id || crypto.randomUUID()}_${Date.now()}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, videoBytes, {
        contentType: "video/mp4",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Step 4: Update the instagram post with video URL
    if (post_id) {
      await supabase
        .from("instagram_posts")
        .update({
          media_urls: [publicUrl],
          updated_at: new Date().toISOString(),
        })
        .eq("id", post_id);
    }

    console.log("Reel video uploaded:", publicUrl);

    return new Response(
      JSON.stringify({ success: true, video_url: publicUrl, prompt: videoPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-reel-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
