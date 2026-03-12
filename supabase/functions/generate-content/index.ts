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
- Transformation is not a project — it's a way of being
- Start with the system, not the symptom
- Agility is a means, not an end
- Leaders must go first
- Sustainable change beats fast change
- Complexity requires curiosity, not control
- Customer value is the ultimate compass
- Healthy systems produce healthy outcomes

OFFERS: Keynote Speaking, Transformation Consulting, Leadership Workshops, Coaching & Advisory, The Spiral Up Book.

AVOID: Generic AI marketing language, startup clichés, empty inspiration, overpromising, corporate jargon, passive language.

Blog posts are for publication at SpiralingUp.works/blog. Include SEO-friendly titles, meta descriptions, and structured content.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Handle streaming chat messages
    if (body.messages) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
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
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const t = await response.text();
        console.error('AI gateway error:', response.status, t);
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
    const { contentType, pillar, topic, additionalContext } = body;

    const userPrompt = \`Generate a \${contentType} about "\${topic}" aligned with the "\${pillar}" content pillar.\${additionalContext ? \` Additional context: \${additionalContext}\` : ''}

Requirements based on content type:
\${contentType === 'blog_post' ? \`- Create a full blog post for SpiralingUp.works/blog
- Include: SEO title (under 60 chars), meta description (under 160 chars), excerpt, the full article with headers (H2, H3), a compelling introduction, 3-5 key sections, and a strong conclusion with CTA
- Suggest internal linking opportunities and related content ideas
- Format in clean markdown ready for CMS publishing\` : ''}
\${contentType === 'linkedin_post' ? \`- Create a LinkedIn post (1300 chars max)
- Start with a bold hook that stops the scroll
- Use short paragraphs (1-2 sentences each)
- Include a clear CTA at the end
- Suggest 3-5 relevant hashtags\` : ''}
\${contentType === 'newsletter' ? \`- Create a newsletter article
- Include: subject line, preview text, greeting, main content with clear sections, and CTA
- Tone should feel personal and conversational
- Include a "What I'm thinking about" or "One question for you" section\` : ''}
\${contentType === 'event_promo' ? \`- Create promotional copy for an event/conference
- Include: headline, description, key takeaways for attendees, speaker bio snippet, and registration CTA\` : ''}
\${contentType === 'landing_page' ? \`- Create landing page copy
- Include: headline, subheadline, 3-4 value propositions, social proof placeholder, and primary CTA
- Focus on one clear conversion goal\` : ''}
\${contentType === 'lead_magnet' ? \`- Create a lead magnet concept and landing copy
- Include: title, description, what's inside, who it's for, and download CTA\` : ''}
\${contentType === 'email_sequence' ? \`- Create a 3-5 email nurture sequence
- Include subject lines, preview text, and body for each email
- Build toward a clear conversion goal\` : ''}
\${contentType === 'campaign_copy' ? \`- Create campaign copy for multiple channels
- Include: campaign theme, LinkedIn post, newsletter excerpt, blog intro, and email subject line\` : ''}

Remember: Stay unmistakably Spiral Up in voice and positioning.\`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${LOVABLE_API_KEY}\`,
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
