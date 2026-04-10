import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function buildBrandContext(): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const [
    { data: brandCore },
    { data: founder },
    { data: principles },
    { data: voice },
    { data: pillars },
    { data: offers },
    { data: pages },
    { data: examples },
  ] = await Promise.all([
    sb.from('brand_core').select('*').limit(1).single(),
    sb.from('founder_profile').select('*').limit(1).single(),
    sb.from('spiral_principles').select('*').order('sort_order'),
    sb.from('voice_rules').select('*').limit(1).single(),
    sb.from('brand_content_pillars').select('*').order('sort_order'),
    sb.from('offers').select('*').order('sort_order'),
    sb.from('website_pages').select('*'),
    sb.from('example_content').select('*').limit(10),
  ]);

  const sections: string[] = [];

  if (brandCore) {
    sections.push(`## BRAND IDENTITY
Brand: ${brandCore.brand_name || 'Spiral Up'}
Tagline: ${brandCore.tagline || ''}
Founder: ${brandCore.founder || ''} (${brandCore.company || ''})
Website: ${brandCore.website || ''}
Mission: ${brandCore.mission || 'Not defined'}
Vision: ${brandCore.vision || 'Not defined'}
${brandCore.short_description ? `Short Description: ${brandCore.short_description}` : ''}
${brandCore.long_description ? `Full Description: ${brandCore.long_description}` : ''}
${(brandCore.key_beliefs || []).length > 0 ? `Key Beliefs:\n${brandCore.key_beliefs.map((b: string) => `- ${b}`).join('\n')}` : ''}`);
  }

  if (founder) {
    const parts = [];
    if (founder.short_bio) parts.push(`Short Bio: ${founder.short_bio}`);
    if (founder.long_bio) parts.push(`Full Bio: ${founder.long_bio}`);
    if ((founder.expertise_areas || []).length > 0) parts.push(`Expertise: ${founder.expertise_areas.join(', ')}`);
    if ((founder.speaking_topics || []).length > 0) parts.push(`Speaking Topics: ${founder.speaking_topics.join(', ')}`);
    if (founder.personal_tone_guidelines) parts.push(`Personal Tone: ${founder.personal_tone_guidelines}`);
    if (parts.length > 0) sections.push(`## FOUNDER PROFILE\n${parts.join('\n')}`);
  }

  if (principles && principles.length > 0) {
    const defined = principles.filter((p: any) => p.principle_name);
    if (defined.length > 0) {
      const lines = defined.map((p: any) => {
        let line = `- ${p.letter}: ${p.principle_name}`;
        if (p.short_description) line += ` — ${p.short_description}`;
        if (p.long_explanation) line += `\n  ${p.long_explanation}`;
        return line;
      });
      sections.push(`## THE SPIRAL FRAMEWORK\n${lines.join('\n')}`);
    }
  }

  if (voice) {
    const parts = [];
    if (voice.tone_description) parts.push(`Tone: ${voice.tone_description}`);
    if ((voice.words_to_avoid || []).length > 0) parts.push(`AVOID: ${voice.words_to_avoid.join(', ')}`);
    if ((voice.words_to_prefer || []).length > 0) parts.push(`PREFER: ${voice.words_to_prefer.join(', ')}`);
    if ((voice.writing_style_rules || []).length > 0) parts.push(`Rules:\n${voice.writing_style_rules.map((r: string) => `- ${r}`).join('\n')}`);
    if (parts.length > 0) sections.push(`## VOICE & TONE\n${parts.join('\n')}`);
  }

  if (pillars && pillars.length > 0) {
    const lines = pillars.map((p: any) => {
      let line = `- ${p.emoji || '📌'} ${p.title}: ${p.description || ''}`;
      if ((p.keywords || []).length > 0) line += ` [${p.keywords.join(', ')}]`;
      return line;
    });
    sections.push(`## CONTENT PILLARS\n${lines.join('\n')}`);
  }

  if (offers && offers.length > 0) {
    const lines = offers.map((o: any) => `- ${o.icon || '🎯'} ${o.offer_name}: ${o.description || ''}`);
    sections.push(`## OFFERS\n${lines.join('\n')}`);
  }

  if (pages && pages.length > 0) {
    const lines = pages.slice(0, 5).map((p: any) => `- ${p.title || p.url}: ${(p.page_text || '').slice(0, 300)}`);
    sections.push(`## WEBSITE KNOWLEDGE\n${lines.join('\n')}`);
  }

  if (examples && examples.length > 0) {
    const lines = examples.slice(0, 3).map((e: any) => `- [${e.content_type}] "${e.title}": ${(e.content || '').slice(0, 200)}...`);
    sections.push(`## EXAMPLE STYLE\n${lines.join('\n')}`);
  }

  return `You are the AI content engine for Spiral Up. Every piece of content must align with this brand intelligence.

${sections.join('\n\n')}

RULES:
- Stay unmistakably Spiral Up in voice and positioning
- Never use generic AI marketing language
- Be human, direct, pragmatic, and energizing
- Short paragraphs, bold openings, thought-provoking questions
- Blog posts are for SpiralingUp.works/blog — include SEO titles and meta descriptions`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');

    // Build dynamic brand context from database
    const brandContext = await buildBrandContext();

    const anthropicUrl = 'https://api.anthropic.com/v1/messages';

    // Handle streaming chat messages
    if (body.messages) {
      const response = await fetch(anthropicUrl, {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: brandContext,
          messages: body.messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        const t = await response.text();
        console.error('Anthropic API error:', status, t);
        return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Convert Anthropic SSE stream to OpenAI-compatible SSE format for the client
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });

              let newlineIdx: number;
              while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIdx).trim();
                buffer = buffer.slice(newlineIdx + 1);

                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6);
                if (jsonStr === '[DONE]') continue;

                try {
                  const event = JSON.parse(jsonStr);
                  if (event.type === 'content_block_delta' && event.delta?.text) {
                    // Emit OpenAI-compatible SSE
                    const openaiChunk = { choices: [{ delta: { content: event.delta.text } }] };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
                  } else if (event.type === 'message_stop') {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  }
                } catch { /* skip unparseable */ }
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (e) {
            console.error('Stream transform error:', e);
            controller.close();
          }
        },
      });

      return new Response(readable, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' } });
    }

    // Handle structured content generation (non-streaming)
    const contentType = body.contentType || 'blog_post';
    const pillar = body.pillar || 'general';
    const topic = body.topic || '';
    const additionalContext = body.additionalContext || '';

    const userPrompt = `Generate a ${contentType} about "${topic}" aligned with the "${pillar}" content pillar.${additionalContext ? ' Additional context: ' + additionalContext : ''}\n\nStay unmistakably Spiral Up in voice and positioning.`;

    const response = await fetch(anthropicUrl, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: brandContext,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      console.error('Anthropic API error:', status);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('generate-content error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
