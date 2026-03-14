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

    const { visual_concept, visual_type, channel, title, editorial_item_id, content_format, objective, key_message, post_angle, cta, content } = await req.json();

    if (!visual_concept) {
      return new Response(
        JSON.stringify({ error: "visual_concept is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 1: Use a text model to refine the raw visual concept into a brand-ready image prompt
    const masterPrompt = `You are generating a social media image for the Spiral Up brand.

Your job is to produce one image brief for an AI image model. The image must feel consistent with Spiral Up brand guidelines and with the specific channel and post context provided below.

SPIRAL UP BRAND RULES

Brand personality: Human. Direct. Pragmatic. Energizing. Professional.

Brand message territory: Sustainable impact through systemic change. Healthy systems. Empowered teams. Aligned operating models. Business agility. Resilience. Adaptability. Customer centricity. Leadership that creates the conditions for value delivery.

Visual principles: Clean. Modern. High-trust. Human-centered. Editorial quality. Professional. Simple. Spacious. Credible.

Layout and composition rules: Prioritize clarity over decoration. Use generous white space. Keep composition focused. Avoid clutter. Avoid crowded scenes. Avoid visual noise. Use strong hierarchy in the image composition. Use one clear idea per image. Use visuals only if they support the message.

Style rules: No text overlay. No typography inside the image. No logos inside the image unless explicitly provided as an overlay step outside generation. No meme style. No fantasy style. No cartoon style unless explicitly requested. No exaggerated AI-art look. No surrealism. No glossy sci-fi aesthetics. No stock-photo cliché energy. No handshake clichés. No fake conference-stage clichés. No exaggerated smiles. No over-designed business visuals. No decorative icon overload. No random arrows, charts, or floating UI elements unless the concept explicitly requires them. No invented brand symbols.

Color rules: Use only a restrained and professional palette. Keep tones warm, balanced, and credible. Use subtle accents only. Do not invent official Spiral Up brand colors. If exact brand colors are not provided, stay visually neutral and premium. Avoid neon. Avoid harsh saturation. Avoid loud gradients.

Image intent: The image should communicate business relevance, human systems, leadership, adaptability, resilience, collaboration, customer focus, or systemic change. It must look credible to leaders, consultants, and transformation professionals.

Channel adaptation: If channel is instagram, optimize for visual impact, emotional clarity, and 4:5 composition. If channel is linkedin, optimize for professional credibility, business clarity, and 16:9 or square composition depending on the requested format. If channel is facebook, optimize for broad readability, clean composition, and 16:9 composition. If format is carousel cover, make the image bold, simple, and concept-led. If format is single image post, make the image self-sufficient and immediately understandable.

INPUTS

Channel: ${channel || "linkedin"}
Format: ${content_format || "single image post"}
Visual type: ${visual_type || "graphic"}
Objective: ${objective || ""}
Key message: ${key_message || ""}
Post angle: ${post_angle || ""}
CTA: ${cta || ""}
Visual concept raw: ${visual_concept}
Title: ${title || ""}
Content excerpt: ${content || ""}

TASK

Rewrite the raw visual concept into a brand-ready image prompt for an image model.

The final image prompt must: Reflect the Spiral Up brand rules above. Be concrete and visual. Describe the scene, composition, mood, subject, setting, framing, and style. Adapt to the channel and format. Avoid generic corporate visuals. Avoid text inside the image. Avoid mentioning brand colors unless exact approved colors are provided separately. Stay concise but specific.

OUTPUT FORMAT

Return only the final image prompt. Do not explain. Do not add labels. Do not add bullet points.`;

    console.log("Step 1: Refining visual concept with text model...");

    const refineResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: masterPrompt }],
      }),
    });

    if (!refineResponse.ok) {
      const errText = await refineResponse.text();
      throw new Error(`Prompt refinement failed [${refineResponse.status}]: ${errText}`);
    }

    const refineData = await refineResponse.json();
    const refinedPrompt = refineData.choices?.[0]?.message?.content?.trim();

    if (!refinedPrompt) {
      throw new Error("No refined prompt returned from text model");
    }

    console.log("Step 1 complete. Refined prompt:", refinedPrompt);

    // STEP 2: Generate the image using the refined prompt
    console.log("Step 2: Generating image...");

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
            content: `Generate this image. Do not return any text, only the image.\n\n${refinedPrompt}`,
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
      JSON.stringify({ success: true, image_url: publicUrl, refined_prompt: refinedPrompt }),
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
