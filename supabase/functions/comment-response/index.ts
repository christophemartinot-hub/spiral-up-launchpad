import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function getBrandVoiceContext(sb: any): Promise<string> {
  const [{ data: brandCore }, { data: voice }] = await Promise.all([
    sb.from('brand_core').select('*').limit(1).single(),
    sb.from('voice_rules').select('*').limit(1).single(),
  ]);

  const parts: string[] = [];

  if (brandCore) {
    parts.push(`Brand: ${brandCore.brand_name || 'Spiral Up'}
Founder: ${brandCore.founder || 'Christophe Martinot'}
Mission: ${brandCore.mission || ''}`);
  }

  if (voice) {
    if (voice.tone_description) parts.push(`Tone: ${voice.tone_description}`);
    if (voice.words_to_avoid?.length) parts.push(`NEVER use: ${voice.words_to_avoid.join(', ')}`);
    if (voice.writing_style_rules?.length) parts.push(`Style rules: ${voice.writing_style_rules.join('; ')}`);
    if (voice.typical_expressions?.length) parts.push(`Natural expressions: ${voice.typical_expressions.join(', ')}`);
  }

  return parts.join('\n');
}

async function getReplyLearnings(sb: any): Promise<string> {
  const { data: feedback } = await sb
    .from('comment_reply_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!feedback || feedback.length === 0) return '';

  const total = feedback.length;
  const approved = feedback.filter((f: any) => f.action_type === 'approved').length;
  const approvedEdited = feedback.filter((f: any) => f.action_type === 'approved_edited').length;
  const ignored = feedback.filter((f: any) => f.action_type === 'ignored').length;
  const rejected = feedback.filter((f: any) => f.action_type === 'rejected').length;

  const editedTexts = feedback.filter((f: any) => f.text_was_edited);
  const shortPreferred = editedTexts.filter((f: any) => (f.final_text || '').length < (f.original_text || '').length).length;
  const longPreferred = editedTexts.length - shortPreferred;

  const tonePrefs: Record<string, number> = {};
  for (const f of feedback) {
    if (f.tone_preference) tonePrefs[f.tone_preference] = (tonePrefs[f.tone_preference] || 0) + 1;
  }

  const parts: string[] = [];
  parts.push(`Reply stats: ${total} replies reviewed. ${approved} approved clean, ${approvedEdited} edited then approved, ${rejected} rejected, ${ignored} ignored.`);
  
  if (editedTexts.length > 0) {
    parts.push(`Length preference: ${shortPreferred > longPreferred ? 'shorter replies preferred' : 'longer, more detailed replies preferred'} (${shortPreferred} shortened, ${longPreferred} lengthened).`);
  }

  const topTones = Object.entries(tonePrefs).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topTones.length > 0) {
    parts.push(`Preferred tones: ${topTones.map(([t, c]) => `${t} (${c}x)`).join(', ')}`);
  }

  if (ignored > total * 0.3) {
    parts.push(`Many comments are being ignored (${Math.round((ignored / total) * 100)}%). Be more selective about which comments truly need a reply.`);
  }

  return `\n\nREPLY LEARNINGS:\n${parts.join('\n')}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { action } = body;

    // ─── Analyze a comment ───
    if (action === 'analyze_comment') {
      const { comment } = body;
      const brandVoice = await getBrandVoiceContext(sb);

      const systemPrompt = `You are a community management analyst for Spiral Up, a brand about organizational transformation and leadership.

${brandVoice}

TASK: Analyze this comment and classify it.

Comment: "${comment.comment_text}"
Platform: ${comment.channel || 'unknown'}
Post: ${comment.post_title || 'unknown'}
Author: ${comment.author_name || 'unknown'}

Return a JSON object with:
- comment_type: one of "appreciation", "question", "objection", "disagreement", "criticism", "request_detail", "spam", "irrelevant", "lead_signal", "collaboration_opportunity"
- sentiment: one of "positive", "neutral", "negative", "mixed"
- urgency: one of "low", "normal", "high", "critical"
- requires_reply: boolean — should we reply?
- requires_human_review: boolean — is this sensitive/risky and needs manual attention?
- is_sensitive: boolean — involves conflict, criticism, personal attacks, political/controversial topics, legal/medical claims?
- risk_flags: array of strings describing any risks (empty if none)
- priority: one of "low", "normal", "high", "urgent"
- analysis_notes: 1-2 sentences explaining why you classified it this way

SENSITIVITY RULES — flag as sensitive if:
- Contains criticism or negative feedback
- Personal attacks
- Political or controversial topics
- Legal or medical claims
- Spam or suspicious content
- Conflict or hostility

Return ONLY valid JSON, no markdown.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Analyze this comment.' },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ error: 'AI analysis failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ analysis: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse analysis', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ─── Generate reply suggestions ───
    if (action === 'generate_replies') {
      const { comment } = body;
      const [brandVoice, learnings] = await Promise.all([
        getBrandVoiceContext(sb),
        getReplyLearnings(sb),
      ]);

      const systemPrompt = `You are the community response writer for Spiral Up, a brand about organizational transformation, leadership, and agility.

${brandVoice}${learnings}

TASK: Generate 3 reply suggestions for this comment.

Comment: "${comment.comment_text}"
Comment type: ${comment.comment_type || 'unknown'}
Sentiment: ${comment.sentiment || 'neutral'}
Platform: ${comment.channel || 'unknown'}
Post: ${comment.post_title || 'unknown'}
Author: ${comment.author_name || 'unknown'}

REPLY RULES:
- Human, warm, direct, pragmatic, respectful
- NEVER defensive, NEVER generic, NEVER overly promotional
- NEVER sound like AI — no "Great question!", "Thanks for sharing!", "I appreciate your input!"

VALUE GATE (apply before suggesting ANY reply):
Before proposing each reply, ask: "Does this reply add value to the conversation or strengthen the relationship?"
If the answer is no, do NOT include that reply. Only suggest replies that genuinely contribute something — a clarification, a deeper insight, encouragement, a useful perspective, or a meaningful acknowledgment.
Empty pleasantries, generic thanks, or replies that exist only to "be present" must be excluded.
- Acknowledge the person naturally
- Add value where relevant
- Answer clearly if there's a question
- Keep conversation open when useful
- Protect brand credibility
- Match the platform's tone (LinkedIn = professional, Instagram = warmer, etc.)

VALUE-DRIVEN REPLIES:
- Replies should build trust, credibility, and community
- When appropriate: clarify an idea, deepen the conversation, encourage reflection
- Reinforce useful insights
- Create positive engagement
- Support follower growth through quality interaction
- Do NOT optimize for reply volume — optimize for quality

Return a JSON array of 3 reply objects:
[
  { "reply_type": "short", "reply_text": "...", "tone": "warm" },
  { "reply_type": "thoughtful", "reply_text": "...", "tone": "warm" },
  { "reply_type": "engagement_building", "reply_text": "...", "tone": "warm" }
]

The "short" reply is concise (1-2 sentences).
The "thoughtful" reply adds perspective or insight (2-4 sentences).
The "engagement_building" reply continues the conversation or asks a follow-up (2-3 sentences).

Return ONLY valid JSON array, no markdown.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate reply suggestions for this comment.' },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ error: 'AI reply generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ replies: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse replies', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('comment-response error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
