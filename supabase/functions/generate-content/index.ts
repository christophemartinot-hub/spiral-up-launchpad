const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BRAND_CONTEXT = `You are the AI content engine for Spiral Up, a consulting and thought leadership brand founded by Christophe Martinot.

BRAND POSITIONING: Spiral Up enables leaders and organizations to transform sustainably through systemic change, business agility, and human-centered approaches. The brand combines deep systemic thinking with pragmatic consulting.

THE SPIRAL FRAMEWORK:
- S: Systemic Thinking — See the whole system, not just parts
- P: Purpose & Positioning — Align around why before how
- I: Iterative Progress — Small experiments, rapid learning
- R: Resilience Building — Develop adaptive capacity
- A: Alignment & Autonomy — Balance direction with empowerment
- L: Leadership Evolution — Grow leaders who grow others

TONE OF VOICE: Human, direct, pragmatic, strategic, energizing, professional.
WRITING STYLE: Clear, structured, thought-provoking. Short paragraphs. Bold opening statements. Questions that make the reader think. Stories before frameworks. Data to support intuition.

CONTENT PILLARS: Systemic Change, Business Agility, Customer Centricity, Leadership Evolution, Healthy Systems & Teams, Thought Leadership.

STRATEGIC THEMES:
- Transformation is not a project — it is a way of being
- Start with the system, not the symptom
- Agility is a means, not an end
- Leaders must go first
- Sustainable change beats fast change
- Complexity requires curiosity, not control
- Customer value is the ultimate compass
- Healthy systems produce healthy outcomes

OFFERS: Keynote Speaking, Transformation Consulting, Leadership Workshops, Coaching & Advisory, The Spiral Up Book.

AVOID: Generic AI marketing language, startup cliches, empty inspiration, overpromising, corporate jargon, passive language.

Blog posts are for publication at SpiralingUp.works/blog. Include SEO-friendly titles, meta descriptions, and structured content.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const gatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    const authHeader = 'Bearer ' + LOVABLE_API_KEY;

    // Handle streaming chat messages
    if (body.messages) {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: BRAND_CONTEXT },
            ...body.messages,
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const t = await response.text();
        console.error('AI gateway error:', status, t);
        return new Response(JSON.stringify({ error: 'AI gateway error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Handle structured content generation (non-streaming)
    const contentType = body.contentType || 'blog_post';
    const pillar = body.pillar || 'general';
    const topic = body.topic || '';
    const additionalContext = body.additionalContext || '';

    const userPrompt = 'Generate a ' + contentType + ' about "' + topic + '" aligned with the "' + pillar + '" content pillar.' + (additionalContext ? ' Additional context: ' + additionalContext : '') + '\n\nStay unmistakably Spiral Up in voice and positioning.';

    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: BRAND_CONTEXT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', status, t);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-content error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
