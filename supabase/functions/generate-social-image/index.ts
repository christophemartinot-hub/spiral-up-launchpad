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

    const { visual_concept, visual_type, channel, title, editorial_item_id } = await req.json();

    if (!visual_concept) {
      return new Response(
        JSON.stringify({ error: "visual_concept is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a prompt tailored for social media visuals
    const aspectRatio = channel === "instagram" ? "4:5" : "16:9";
    const prompt = `Create a professional, brand-aligned social media visual for ${channel || "social media"}.

Visual type: ${visual_type || "graphic"}
Concept: ${visual_concept}
Post title: ${title || ""}

Style: Clean, modern, inspirational. Use warm tones with accents of teal/gold. 
The image should be suitable for ${channel || "social media"} (aspect ratio ${aspectRatio}).
Do NOT include any text in the image — text overlays will be added separately.
Make it visually striking and scroll-stopping.`;

    console.log("Generating image with prompt:", prompt);

    // Call Lovable AI image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI image generation failed [${aiResponse.status}]: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const imageDataUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      throw new Error("No image returned from AI model");
    }

    // Extract base64 data and upload to storage
    const base64Match = imageDataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format from AI");
    }

    const imageFormat = base64Match[1] === "jpg" ? "jpeg" : base64Match[1];
    const base64Data = base64Match[2];

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `social-images/${editorial_item_id || crypto.randomUUID()}_${Date.now()}.${imageFormat === "jpeg" ? "jpg" : imageFormat}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    console.log("Image generated and uploaded:", publicUrl);

    return new Response(
      JSON.stringify({ success: true, image_url: publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-social-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
