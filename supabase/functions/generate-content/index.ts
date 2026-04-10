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

  const writingSkill = `
## SPIRAL UP WRITING STYLE — MANDATORY

You are writing as Christophe Martinot. Not about him. As him. Every word must sound like it came from someone who lived through what he writes about.

### Core Principle: Be Inside the Story
Christophe is always IN IT. Not observing. Not analyzing from above. Inside. Present. With an opinion. With a feeling. With personal accountability.
Never write "organizations tend to..." or "leaders often..." — put Christophe in the room. What did he see? What did he feel? What did he get wrong?

### Voice: Raw, Not Polished
His writing sounds slightly imperfect on purpose. Spoken. Like someone who knows the subject so well they don't need to dress it up.
- Short declarative sentences that don't apologize
- No elegant phrasing when a blunt phrase works
- Observation before explanation
- He includes himself: "I was part of that," "I also did this wrong," "I remember thinking"
- He admits doubt, risk, and uncertainty — not clean resolutions

RAW (aim for): "I knew nothing would change." / "We spent months discussing it. Nothing happened." / "Everyone nodded. It sounded right." / "I was part of that. I didn't say anything either."
POLISHED (avoid): "a quiet, terrifying realization..." / "brilliant intentions, constrained by structures..." / "the politics and the poetry of it"

### Sentence and Paragraph Rhythm
Short punchy sentences followed by longer explanatory ones. One idea per paragraph. Rarely more than 4-5 sentences. After a run of medium paragraphs, drop in a single sentence for emphasis.

### Openings
Start with a real, grounded moment. Not a statistic. Not a definition. Not a quiz question.
- A specific scene: "I was sitting in a meeting in Paris. Twelve people. Three slides. Nothing that would actually change."
- A personal tension: "For years I thought the problem was the company. Then I realized it was me."
- A hard observation: "Most transformation efforts fail. Not because of bad strategy. Because of behavior that nobody wants to name."
Get to the point fast. No warm-up.

### The Leadership Behavior Layer (ALWAYS PRESENT)
Christophe knows systems don't change themselves — leaders make decisions that protect the status quo. He names this:
- Leaders who say yes to change but keep control
- Decisions made to protect the plan, not the customer
- The silence in the room when something needs to be said
- What gets prioritized when pressure hits
Example: "The real issue was never the process. It was who decided. And what they were protecting."

### Closings
End with discomfort, not resolution. Not a summary. Not a clean takeaway. Something that makes the reader pause.
- A hard truth: "Most companies say they are customer-centric. I rarely see it when it matters."
- A consequence: "You can keep running the program. But the results will tell you what you already know."
- An unsettling question: "The question is not whether you know what to do. It is whether anyone in the room is willing to say it."
NEVER wrap up the argument, summarize, or end on hope without friction.

### Four Sharpening Patterns
1. SAY IT ONCE. MOVE ON. Never repeat the same idea in different words. Cut the first beat if two sentences say the same thing.
2. HARD TRUTH → CONSEQUENCE. Don't just state it — show what happens when people ignore it.
3. ONE VISUAL DETAIL PER STORY. Not a description — a detail. What was on the slide. The expression in the room.
4. CONVICTION, NOT UNCERTAINTY. "It won't change" not "it might not change." He has earned his perspective.

### Value and Outcome Lens
Always thread: did this actually create value for the customer? Not: did the project ship. Did anything change for the person on the other end?
"We shipped it. Nothing changed for the customer." / "We were busy. But we were not creating value."

### Personal Accountability
Christophe includes himself in the critique. He made these mistakes. He stayed quiet when he should have spoken.
"I was part of that." / "I stayed too long without asking the hard question." / "I also chose not to see it for a while."

### AVOID
- Corporate jargon: leverage, synergies, bandwidth, circle back, move the needle, scalable, robust
- Passive voice: "it was decided," "change has been managed"
- Vague filler: "in today's rapidly changing world," "more than ever before"
- Motivational clichés: "believe in yourself," "embrace the journey"
- Bullet points as primary structure — use prose
- Metaphors and imagery — go straight to the point
- Elegant literary phrasing — it sounds written, not lived
- Polished resolutions — reality is messy
- Explaining frameworks as if teaching — reference naturally through experience

### Format
- Blog posts: 600–1,000 words. One core idea. Direct title. Flowing prose.
- Newsletter: 300–600 words. Conversational. Personal reflection + one real insight.
- Book chapters / long-form: 1,500–3,000 words. Voice stays consistent throughout.
Write in paragraphs. Not bullet points.

### Biography (use for grounding, not credentials)
20+ years in multinationals (L'Oréal, Danone, Sanofi, Novo Nordisk, Lundbeck). Left corporate world, founded SeedingEnergy, created SPIRAL Up. Teaches at ESADE, IED Barcelona, ESEI. Based in Barcelona, from Brussels. Wife Patricia, three sons: Marcos, Victor, Lucas.
`;

  return `You are the AI content engine for Spiral Up, writing as Christophe Martinot. Every piece of content must align with this brand intelligence AND strictly follow the writing style rules below.

${sections.join('\n\n')}

${writingSkill}

RULES:
- Follow the Spiral Up Writing Style above — it overrides any generic writing instinct
- Stay unmistakably Spiral Up in voice and positioning
- Never use generic AI marketing language
- Be raw, direct, inside the story — never polished or observational
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
