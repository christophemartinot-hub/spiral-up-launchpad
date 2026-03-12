import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function buildBrandContext(sb: any): Promise<string> {
  const [
    { data: brandCore },
    { data: founder },
    { data: principles },
    { data: voice },
    { data: pillars },
    { data: offers },
    { data: examples },
    { data: bookInfo },
    { data: events },
    { data: brandAssets },
  ] = await Promise.all([
    sb.from('brand_core').select('*').limit(1).single(),
    sb.from('founder_profile').select('*').limit(1).single(),
    sb.from('spiral_principles').select('*').order('sort_order'),
    sb.from('voice_rules').select('*').limit(1).single(),
    sb.from('brand_content_pillars').select('*').order('sort_order'),
    sb.from('offers').select('*').order('sort_order'),
    sb.from('example_content').select('*').limit(10),
    sb.from('book_info').select('*').limit(1).single(),
    sb.from('events_workshops').select('*').order('sort_order'),
    sb.from('brand_assets').select('*').order('created_at'),
  ]);

  const sections: string[] = [];

  if (brandCore) {
    sections.push(`## BRAND IDENTITY
Brand: ${brandCore.brand_name || 'Spiral Up'}
Tagline: ${brandCore.tagline || ''}
Founder: ${brandCore.founder || ''} (${brandCore.company || ''})
Website: ${brandCore.website || ''}
Mission: ${brandCore.mission || ''}
Vision: ${brandCore.vision || ''}`);
  }

  if (founder) {
    const parts = [];
    if (founder.short_bio) parts.push(`Bio: ${founder.short_bio}`);
    if ((founder.expertise_areas || []).length > 0) parts.push(`Expertise: ${founder.expertise_areas.join(', ')}`);
    if (founder.personal_tone_guidelines) parts.push(`Tone: ${founder.personal_tone_guidelines}`);
    if (parts.length > 0) sections.push(`## FOUNDER\n${parts.join('\n')}`);
  }

  if (principles && principles.length > 0) {
    const lines = principles.filter((p: any) => p.principle_name).map((p: any) => 
      `- ${p.letter}: ${p.principle_name} — ${p.short_description || ''}`
    );
    if (lines.length > 0) sections.push(`## SPIRAL FRAMEWORK\n${lines.join('\n')}`);
  }

  if (voice) {
    const parts = [];
    if (voice.tone_description) parts.push(`Tone: ${voice.tone_description}`);
    if ((voice.words_to_avoid || []).length > 0) parts.push(`AVOID: ${voice.words_to_avoid.join(', ')}`);
    if ((voice.writing_style_rules || []).length > 0) parts.push(`Rules: ${voice.writing_style_rules.join('; ')}`);
    if (parts.length > 0) sections.push(`## VOICE\n${parts.join('\n')}`);
  }

  if (pillars && pillars.length > 0) {
    const lines = pillars.map((p: any) => `- ${p.emoji || '📌'} ${p.title}: ${p.description || ''}`);
    sections.push(`## CONTENT PILLARS\n${lines.join('\n')}`);
  }

  if (offers && offers.length > 0) {
    const lines = offers.map((o: any) => `- ${o.icon || '🎯'} ${o.offer_name}: ${o.description || ''}`);
    sections.push(`## OFFERS\n${lines.join('\n')}`);
  }

  if (bookInfo) {
    sections.push(`## BOOK\nTitle: ${bookInfo.title}\nSubtitle: ${bookInfo.subtitle || ''}\nDescription: ${bookInfo.description || ''}`);
  }

  if (events && events.length > 0) {
    const lines = events.map((e: any) => `- ${e.event_name} [${e.event_type}]: ${e.description || ''}`);
    sections.push(`## EVENTS & WORKSHOPS\n${lines.join('\n')}`);
  }

  if (examples && examples.length > 0) {
    const lines = examples.slice(0, 3).map((e: any) => `- [${e.content_type}] "${e.title}": ${(e.content || '').slice(0, 200)}...`);
    sections.push(`## EXAMPLE STYLE\n${lines.join('\n')}`);
  }

  if (brandAssets && brandAssets.length > 0) {
    const approved = brandAssets.filter((a: any) => a.asset_status === 'approved');
    const nonApproved = brandAssets.filter((a: any) => a.asset_status !== 'approved');

    const approvedLines = approved.map((a: any) => `- [${a.category}] ${a.name}: ${a.description || ''} (${a.file_url || 'no file'})${a.usage_guidelines ? ' | Usage: ' + a.usage_guidelines : ''}`);
    const missingLines = nonApproved.filter((a: any) => a.asset_status !== 'archived').map((a: any) => `- [${a.category}] ${a.name} (STATUS: ${a.asset_status}) — NOT available for AI use`);

    const parts = [`## BRAND KIT — ASSET GOVERNANCE
CRITICAL RULE: You may ONLY use assets listed under "APPROVED ASSETS" below. NEVER reference, suggest, or use assets marked as Draft, Placeholder, or Archived.

If you need an asset that does not exist or is not approved:
1. Propose a visual concept description
2. State which asset type is needed
3. Mark it as: "Brand asset not yet available — visual brief only"

Priority order for approved assets:
1. Official Martin Tognola illustrations (Spiral Up book illustrations)
2. Uploaded SPIRAL principle icons
3. Uploaded zone icons (spiraling up, spiraling down, stagnating)
4. Approved brand templates
5. Neutral placeholder visual concept (LAST RESORT ONLY)

NEVER generate new icons or illustrations if official ones exist in the approved list.`];

    if (approvedLines.length > 0) {
      parts.push(`\nAPPROVED ASSETS (safe to use in AI content):\n${approvedLines.join('\n')}`);
    } else {
      parts.push(`\nNo approved assets available. Use placeholder visual briefs only.`);
    }

    if (missingLines.length > 0) {
      parts.push(`\nNON-APPROVED ASSETS (DO NOT USE — listed for awareness only):\n${missingLines.join('\n')}`);
    }

    sections.push(parts.join('\n'));
  }

  return sections.join('\n\n');
}

async function getVisualConfig(sb: any): Promise<string> {
  const { data } = await sb.from('visual_config').select('*').limit(1).single();
  if (!data) return '';

  const parts = [];
  if (data.preferred_styles?.length) parts.push(`Preferred visual styles: ${data.preferred_styles.join(', ')}`);
  if (data.formats_by_channel) parts.push(`Format ratios by channel: ${JSON.stringify(data.formats_by_channel)}`);
  parts.push(`Illustration preference: ${data.illustration_preference}`);
  parts.push(`Use book visuals: ${data.use_book_visuals}`);
  parts.push(`Use event visuals: ${data.use_event_visuals}`);
  parts.push(`Text density: ${data.text_density}`);
  parts.push(`CTA placement preference: ${data.cta_placement_pref}`);
  parts.push(`Design simplicity level: ${data.simplicity_level}`);
  if (data.exclusion_rules?.length) parts.push(`Visual exclusions: ${data.exclusion_rules.join(', ')}`);

  return `\n\n## VISUAL DESIGN RULES\n${parts.join('\n')}`;
}

async function getRecentItems(sb: any, cooldownCycles: number): Promise<string> {
  // Get recent items across multiple cycles for diversity control
  const { data: recentItems } = await sb
    .from('editorial_items')
    .select('working_title, channel, content_format, content_pillar, post_angle, visual_type, visual_concept, key_message, plan_id')
    .order('created_at', { ascending: false })
    .limit(cooldownCycles * 10);

  if (!recentItems || recentItems.length === 0) return '';

  // Extract topics used recently for cooldown
  const recentTopics = [...new Set(recentItems.map((i: any) => i.key_message || i.working_title).filter(Boolean))];
  const recentPillars: Record<string, number> = {};
  for (const i of recentItems) {
    const p = i.content_pillar || 'none';
    recentPillars[p] = (recentPillars[p] || 0) + 1;
  }

  const lines = recentItems.slice(0, 20).map((i: any) => 
    `- "${i.working_title}" [${i.channel}/${i.content_format}] pillar:${i.content_pillar || 'none'} visual:${i.visual_type || 'none'}`
  );

  const parts = [
    `## RECENTLY GENERATED (avoid repeating these themes/angles/visuals)`,
    lines.join('\n'),
    `\n## TOPIC COOLDOWN (${cooldownCycles}-cycle window)`,
    `These topics were used recently — do NOT repeat them. Find fresh angles or entirely new topics:`,
    recentTopics.slice(0, 15).map(t => `- "${t}"`).join('\n'),
    `\n## PILLAR USAGE (recent ${recentItems.length} items)`,
    Object.entries(recentPillars).map(([p, c]) => `- ${p}: ${c} items`).join('\n'),
    `Underused pillars should get MORE content. Overused pillars should get LESS.`,
  ];

  return '\n\n' + parts.join('\n');
}

async function getFeedbackLearnings(sb: any): Promise<string> {
  const { data: feedback } = await sb
    .from('editorial_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!feedback || feedback.length === 0) return '';

  const total = feedback.length;
  const approved = feedback.filter((f: any) => f.action_type === 'approved_clean').length;
  const approvedEdited = feedback.filter((f: any) => f.action_type === 'approved_edited').length;
  const rejected = feedback.filter((f: any) => f.action_type === 'rejected').length;

  const topicApprovals: Record<string, number> = {};
  const topicRejections: Record<string, number> = {};
  const titleEdits = feedback.filter((f: any) => f.title_changed).length;
  const ctaEdits = feedback.filter((f: any) => f.cta_changed).length;
  const visualEdits = feedback.filter((f: any) => f.visual_changed).length;
  const rejectionReasons = feedback.filter((f: any) => f.rejection_reason).map((f: any) => f.rejection_reason).slice(0, 5);

  for (const f of feedback) {
    const topic = f.original_topic || 'unknown';
    if (f.action_type?.startsWith('approved')) topicApprovals[topic] = (topicApprovals[topic] || 0) + 1;
    if (f.action_type === 'rejected') topicRejections[topic] = (topicRejections[topic] || 0) + 1;
  }

  const topApproved = Object.entries(topicApprovals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topRejected = Object.entries(topicRejections).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const parts: string[] = [];
  parts.push(`Review stats: ${total} items reviewed, ${approved} approved clean, ${approvedEdited} approved after edits, ${rejected} rejected.`);
  parts.push(`Approval rate: ${Math.round(((approved + approvedEdited) / total) * 100)}%`);

  if (topApproved.length > 0) {
    parts.push(`Most approved topics: ${topApproved.map(([t, c]) => `"${t}" (${c}x)`).join(', ')}. Suggest MORE content like these.`);
  }
  if (topRejected.length > 0) {
    parts.push(`Most rejected topics: ${topRejected.map(([t, c]) => `"${t}" (${c}x)`).join(', ')}. AVOID these themes or try completely new angles.`);
  }
  if (titleEdits > total * 0.3) {
    parts.push(`Headlines are edited ${Math.round((titleEdits / total) * 100)}% of the time. Use more direct, specific, human headlines.`);
  }
  if (ctaEdits > total * 0.3) {
    parts.push(`CTAs are changed ${Math.round((ctaEdits / total) * 100)}% of the time. Use simpler, more action-oriented CTAs.`);
  }
  if (visualEdits > total * 0.2) {
    parts.push(`Visuals are modified ${Math.round((visualEdits / total) * 100)}% of the time. Prefer brand illustrations over AI-generated concepts.`);
  }
  if (rejectionReasons.length > 0) {
    parts.push(`Recent rejection reasons: ${rejectionReasons.join('; ')}`);
  }

  return `\n\n## EDITORIAL LEARNING (from user behavior)\n${parts.join('\n')}`;
}

async function getPerformanceLearnings(sb: any): Promise<string> {
  const { data: perf } = await sb
    .from('content_performance')
    .select('*')
    .order('publish_date', { ascending: false })
    .limit(50);

  if (!perf || perf.length === 0) return '';

  const { data: perfConfig } = await sb.from('performance_config').select('*').limit(1).single();

  const byChannel: Record<string, { count: number; eng: number }> = {};
  const byFormat: Record<string, { count: number; eng: number }> = {};
  const byVisual: Record<string, { count: number; eng: number }> = {};
  const byPillar: Record<string, { count: number; eng: number }> = {};

  for (const p of perf) {
    const ch = p.channel || 'unknown';
    if (!byChannel[ch]) byChannel[ch] = { count: 0, eng: 0 };
    byChannel[ch].count++; byChannel[ch].eng += p.engagement || 0;

    const fmt = p.content_format || 'unknown';
    if (!byFormat[fmt]) byFormat[fmt] = { count: 0, eng: 0 };
    byFormat[fmt].count++; byFormat[fmt].eng += p.engagement || 0;

    const vt = p.visual_type || 'none';
    if (vt !== 'none') {
      if (!byVisual[vt]) byVisual[vt] = { count: 0, eng: 0 };
      byVisual[vt].count++; byVisual[vt].eng += p.engagement || 0;
    }

    const pl = p.content_pillar || 'none';
    if (!byPillar[pl]) byPillar[pl] = { count: 0, eng: 0 };
    byPillar[pl].count++; byPillar[pl].eng += p.engagement || 0;
  }

  const parts: string[] = [];
  parts.push(`Performance data from ${perf.length} published items.`);

  const topChannels = Object.entries(byChannel).sort((a, b) => b[1].eng - a[1].eng).slice(0, 3);
  if (topChannels.length > 0) {
    parts.push(`Best channels: ${topChannels.map(([c, v]) => `${c} (${v.eng} eng, ${v.count} posts)`).join(', ')}`);
  }

  const topFormats = Object.entries(byFormat).sort((a, b) => b[1].eng - a[1].eng).slice(0, 3);
  if (topFormats.length > 0) {
    parts.push(`Best formats: ${topFormats.map(([f, v]) => `${f} (${v.eng} eng)`).join(', ')}`);
  }

  const topVisuals = Object.entries(byVisual).sort((a, b) => b[1].eng - a[1].eng).slice(0, 3);
  if (topVisuals.length > 0) {
    parts.push(`Best visual types: ${topVisuals.map(([v, d]) => `${v} (${d.eng} eng)`).join(', ')}`);
  }

  const underusedPillars = Object.entries(byPillar).sort((a, b) => a[1].count - b[1].count).slice(0, 2);
  if (underusedPillars.length > 0) {
    parts.push(`Underused pillars: ${underusedPillars.map(([p, v]) => `${p} (${v.count} posts)`).join(', ')} — increase coverage.`);
  }

  if (perfConfig) {
    parts.push(`\nWeight config: engagement=${perfConfig.engagement_weight}, conversion=${perfConfig.conversion_weight}, strategic=${perfConfig.strategic_weight}`);
    parts.push(`Repetition limit: ${perfConfig.repetition_limit} (don't repeat same pattern more than this)`);
    if (perfConfig.favored_patterns?.length > 0) parts.push(`Favored patterns: ${perfConfig.favored_patterns.join(', ')}`);
    if (perfConfig.deprioritized_types?.length > 0) parts.push(`Deprioritized: ${perfConfig.deprioritized_types.join(', ')}`);
  }

  parts.push(`\nIMPORTANT: Use these learnings to improve suggestions but maintain editorial diversity. Don't over-optimize for one pattern. Balance performance with brand strategy. Explain WHY you're suggesting a topic using this data.`);

  return `\n\n## PERFORMANCE LEARNINGS (from published content data)\n${parts.join('\n')}`;
}

function getIntelligenceModeInstructions(mode: string): string {
  if (mode === 'assist') {
    return `\n\n## INTELLIGENCE MODE: ASSIST
You are in ASSIST mode. Generate suggestions based purely on brand knowledge and content pillars. Do NOT heavily weight performance data or user behavior patterns. Focus on strategic brand alignment and content variety.`;
  }
  if (mode === 'strategic') {
    return `\n\n## INTELLIGENCE MODE: STRATEGIC
You are in STRATEGIC mode. Prioritize brand strategy, mission alignment, and long-term positioning over short-term engagement metrics. If a strategically important topic underperforms, suggest NEW ANGLES for it rather than dropping it. Weight strategic_weight at 3x normal. Maintain full pillar coverage even if some pillars have lower engagement.`;
  }
  // Default: learning mode
  return `\n\n## INTELLIGENCE MODE: LEARNING
You are in LEARNING mode. Actively learn from ALL signals: performance metrics, user approval behavior, and editing patterns. Improve suggestions based on what the user approves, rejects, and edits. Balance performance optimization with editorial diversity. Explain your reasoning using learned signals.`;
}

const VISUAL_FIELDS_SPEC = `
- visual_type: one of "single_image","carousel","quote_card","framework_card","event_promo","workshop_promo","book_promo","infographic","article_cover","video_storyboard","document_post"
- visual_concept: 1-2 sentence describing the PRIMARY visual idea (this is the main creative direction)
- backup_visual_concept: 1-2 sentence describing a BACKUP visual idea (alternative direction if primary is rejected)
- backup_visual_type: visual type for the backup concept
- visual_layout: describe layout structure (e.g. "headline top, illustration center, CTA bottom")
- image_direction: what the main image/illustration should depict
- visual_headline: headline text to appear on the visual
- visual_subheadline: subheadline if relevant (empty string if none)
- cta_placement: where CTA should appear on visual
- format_ratio: aspect ratio for the channel (e.g. "1:1", "4:5", "16:9")
- recommended_assets: array of strings naming brand assets to use (book cover, SPIRAL icons, illustrations, etc). Use actual existing brand asset names when possible.
- visual_rationale: 1-2 sentence explaining WHY this visual direction was chosen for this content and how it reinforces the message`;

const SUGGESTION_RATIONALE_SPEC = `
- suggestion_rationale: 1-3 sentences explaining WHY this specific topic/angle was suggested for this cycle, using concrete data from learned signals. Examples:
  * "Suggested because leadership transformation posts had 42% higher engagement in the last 6 posts and you approved similar topics without edits."
  * "This pillar has been underrepresented (only 2 posts in last 15) — adding it restores editorial balance."
  * "Testing a new angle on a strategically important but underperforming topic based on recent rejection feedback."
  IMPORTANT: Every item MUST have a meaningful suggestion_rationale. Never leave it generic.`;

const OUTCOME_FIELDS_SPEC = `
## OUTCOME-DRIVEN CONTENT (MANDATORY)
Every content item MUST be designed for AUDIENCE IMPACT, not just output. The goal is to create meaningful change for leaders and organizations — not just "more posts."

For each item, include these outcome fields:
- audience_challenge: What real problem, tension, or question the audience faces that this content addresses. Be specific. Example: "Leaders struggle to sustain change after initial transformation excitement fades."
- insight_delivered: The key idea or shift in thinking the audience will gain. Not a summary — the actual insight. Example: "Transformation fails not because of bad strategy but because leaders focus on tools instead of behaviors."
- practical_takeaway: What the audience can DO after consuming this content. Be concrete. Example: "A 3-question diagnostic leaders can use in their next team meeting to assess behavioral vs. tool-based change."
- expected_audience_action: The most likely audience response. One of: "save", "share", "follow", "subscribe", "read_more", "attend_event", "book_call", "reflect"
- outcome_score: Integer 1-10 rating the potential IMPACT on the audience. Score based on:
  * Depth of insight (surface = 1-3, reframing = 4-6, paradigm-shifting = 7-10)
  * Actionability (vague inspiration = low, concrete framework = high)
  * Shareability (would someone forward this to a colleague?)
  * Relevance to audience's real challenges

RANKING RULE: Prioritize content by outcome_score. Content that is polished but low-impact (score ≤ 3) should NOT be suggested. Aim for scores of 6+ on every item.

WEAK (do NOT generate):
- "5 tips for business agility" (generic, no insight, no challenge addressed)
- "The importance of leadership" (vague, no audience tension)

STRONG (generate this kind):
- "Why transformation fails when leaders focus on tools instead of behavior" (specific challenge, clear insight, actionable)
- "The question every leader avoids asking their team — and why it matters" (tension, curiosity, practical)`;

async function storeLearningMemory(sb: any, planId: string, items: any[]) {
  const memories = items.map((item: any) => ({
    cycle_id: planId,
    memory_type: 'generated',
    topic: item.key_message || item.working_title || '',
    content_pillar: item.content_pillar || '',
    channel: item.channel || '',
    content_format: item.content_format || '',
    visual_type: item.visual_type || '',
    cta: item.suggested_cta || item.cta || '',
    action_outcome: 'suggested',
    notes: item.suggestion_rationale || '',
  }));
  
  if (memories.length > 0) {
    await sb.from('learning_memory').insert(memories);
  }
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

    const { config, cycleStart, cycleEnd, action } = body;

    // Get planning config for intelligence mode and cooldown
    const { data: planningConfig } = await sb.from('planning_config').select('*').limit(1).single();
    const intelligenceMode = planningConfig?.intelligence_mode || 'learning';
    const topicCooldown = planningConfig?.topic_cooldown_cycles || 3;
    const strategicBalance = planningConfig?.strategic_balance || {};

    const [brandContext, visualConfig, recentItems, feedbackLearnings, perfLearnings] = await Promise.all([
      buildBrandContext(sb),
      getVisualConfig(sb),
      getRecentItems(sb, topicCooldown),
      getFeedbackLearnings(sb),
      getPerformanceLearnings(sb),
    ]);

    const intelligenceModeInstructions = getIntelligenceModeInstructions(intelligenceMode);

    // Regenerate a single item
    if (action === 'regenerate_item') {
      const { item } = body;
      const systemPrompt = `You are the AI editorial planner for Spiral Up. ${brandContext}${visualConfig}${recentItems}${feedbackLearnings}${perfLearnings}${intelligenceModeInstructions}

TASK: Regenerate a fresh content suggestion for a ${item.channel} ${item.content_format} scheduled on ${item.publish_date}.
The previous suggestion was rejected${item.rejection_reason ? ': ' + item.rejection_reason : ''}. Generate a completely different angle.

Return a JSON object with these fields:
- working_title: compelling title
- objective: what this content achieves
- content_pillar: which pillar it serves
- related_offer: relevant Spiral Up offer if any
- cta: call to action
- post_angle: the unique angle/hook
- draft_content: full draft copy (200-400 words for posts, 800+ for blog)
- carousel_idea: optional carousel or visual idea
- key_message: the core message in one sentence
- suggested_cta: specific CTA text
- brand_alignment: brief explanation of why this aligns with Spiral Up brand
${SUGGESTION_RATIONALE_SPEC}
${OUTCOME_FIELDS_SPEC}
${VISUAL_FIELDS_SPEC}

VISUAL RULES:
- CRITICAL: Check the BRAND KIT assets list FIRST. Use official assets before inventing anything.
- Asset priority: 1) Official Spiral Up illustrations 2) SPIRAL icons 3) Book illustrations by Tognola 4) Brand templates 5) Placeholder brief
- NEVER auto-generate icons or illustrations if official ones exist
- Keep visuals clean, professional, uncluttered
- Never invent fake brand materials — if no asset exists, describe a placeholder brief
- Match format ratio to channel
- visual_rationale must reference which Brand Kit asset is used

Return ONLY valid JSON, no markdown.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate a fresh content suggestion with visual direction.' },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ item: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Regenerate visual only
    if (action === 'regenerate_visual') {
      const { item } = body;
      const systemPrompt = `You are the AI visual director for Spiral Up. ${brandContext}${visualConfig}${feedbackLearnings}${perfLearnings}

TASK: Generate a new visual direction for this content:
Title: ${item.working_title}
Channel: ${item.channel}
Format: ${item.content_format}
Key Message: ${item.key_message || ''}
Draft: ${(item.draft_content || '').slice(0, 500)}

Return a JSON object with ONLY these visual fields:
${VISUAL_FIELDS_SPEC}

VISUAL RULES:
- CRITICAL: Check the BRAND KIT assets list FIRST. Use official assets before inventing anything.
- Asset priority: 1) Official Spiral Up illustrations 2) SPIRAL icons 3) Book illustrations by Tognola 4) Brand templates 5) Placeholder brief
- NEVER auto-generate icons or illustrations if official ones exist
- Keep visuals clean, professional, uncluttered
- Never invent fake brand materials — describe a placeholder brief instead
- Match format ratio to channel
- Designs should feel human, direct, practical — not flashy
- visual_rationale must reference which Brand Kit asset is used

Return ONLY valid JSON, no markdown.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate a visual direction for this content.' },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ visual: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Generate blog email version
    if (action === 'generate_blog_email') {
      const { item } = body;
      const systemPrompt = `You are the email marketing writer for Spiral Up. ${brandContext}

TASK: Convert this approved blog post into an email campaign for subscribers.

Blog Title: ${item.working_title}
Key Message: ${item.key_message || ''}
Content Pillar: ${item.content_pillar || ''}
Draft Content: ${(item.draft_content || '').slice(0, 2000)}
CTA: ${item.suggested_cta || item.cta || ''}

Return a JSON object with:
- subject_line: compelling email subject (under 60 chars, avoid spam triggers)
- preview_text: email preview text (under 100 chars)
- intro_text: warm, personal intro (2-3 sentences) that hooks the reader
- blog_summary: concise summary of the blog's key value points (3-5 bullet points as text)
- cta_text: specific call to action text
- cta_url: suggested URL path (e.g. /blog/article-slug)
- visual_recommendation: describe what header image or visual to use in the email
- plain_text_fallback: plain text version of the email (no HTML)

RULES:
- Subject line must be human and specific — no clickbait, no ALL CAPS, no excessive punctuation
- Intro should feel like a personal note from Christophe Martinot
- Summary should give enough value that the reader wants to read the full article
- CTA should be clear and specific
- Stay on brand: human, direct, practical, credible
- Visual recommendation should reference existing brand assets when possible

Return ONLY valid JSON, no markdown.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate an email version of this blog post.' },
          ],
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify({ email: parsed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: content }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Generate full editorial plan
    const channels = config?.channels || ['linkedin', 'blog', 'email'];
    const postsPerCycle = config?.posts_per_cycle || 5;
    const preferredFormats = config?.preferred_formats || ['linkedin_post', 'blog_post', 'newsletter'];
    const priorityTopics = config?.priority_topics || [];
    const targetAudience = config?.target_audience || '';
    const ctaPrefs = config?.cta_preferences || [];
    const campaignFocus = config?.campaign_focus || '';
    const exclusionRules = config?.exclusion_rules || [];

    // Strategic balance instructions
    const balanceEntries = Object.entries(strategicBalance);
    const balanceStr = balanceEntries.length > 0
      ? `\n\nSTRATEGIC CONTENT MIX (target percentages per cycle):\n${balanceEntries.map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ~${v}%`).join('\n')}\nDistribute items to match this balance. If ${postsPerCycle} items, allocate proportionally.`
      : '';

    const systemPrompt = `You are the AI editorial planner for Spiral Up. Your role is to create a strategic content plan with visual directions for the upcoming publication cycle.

${brandContext}${visualConfig}${recentItems}${feedbackLearnings}${perfLearnings}${intelligenceModeInstructions}${balanceStr}

PLANNING CONSTRAINTS:
- Cycle: ${cycleStart} to ${cycleEnd}
- Channels: ${channels.join(', ')}
- Number of posts: ${postsPerCycle}
- Preferred formats: ${preferredFormats.join(', ')}
${targetAudience ? `- Target audience: ${targetAudience}` : ''}
${priorityTopics.length > 0 ? `- Priority topics: ${priorityTopics.join(', ')}` : ''}
${ctaPrefs.length > 0 ? `- CTA preferences: ${ctaPrefs.join(', ')}` : ''}
${campaignFocus ? `- Campaign focus: ${campaignFocus}` : ''}
${exclusionRules.length > 0 ? `- EXCLUDE these topics: ${exclusionRules.join(', ')}` : ''}

RULES:
- Vary channels across the cycle
- Vary content pillars — don't repeat the same pillar consecutively
- Mix formats: posts, articles, newsletters, carousels
- Balance between thought leadership, book promotion, workshops/events, educational content, and offers
- Each item must have a unique angle — avoid generic or repetitive themes
- CTAs should vary and align with the content
- Draft content should be publication-ready quality
- Blog posts should be longer (800+ words), social posts shorter (150-300 words)
- Always explain WHY each suggestion aligns with Spiral Up brand
- Content must be human, direct, pragmatic — never generic AI marketing
- Spread publish dates across the cycle
- Each item MUST include a visual direction
- TOPIC DIVERSITY: Check the TOPIC COOLDOWN section. If a topic appears there, DO NOT use it again. Find a fresh angle or entirely new topic.

VISUAL RULES:
- CRITICAL: ALWAYS check the BRAND KIT assets list above FIRST. Never generate, invent, or propose a new icon, illustration, or visual asset if an official one already exists in the Brand Kit.
- ASSET PRIORITY ORDER (strict):
  1. Official uploaded Spiral Up illustrations
  2. Official SPIRAL framework icons
  3. Book illustrations by Martin Tognola
  4. Approved brand templates, zone icons, event visuals
  5. Clean branded layout using approved colors, typography, and shapes
  6. Neutral placeholder visual brief — ONLY as last resort
- In recommended_assets, ALWAYS reference actual asset names from the Brand Kit when they match the content theme
- Every item MUST include a visual direction
- BLOG POSTS must include a hero visual concept
- NEVER suggest glossy, surreal, hyper-polished, or fake stock-photo aesthetics
- NEVER use cliché AI imagery
- NEVER auto-generate icons or illustrations — use official brand assets only
- Match format ratio to channel (blog = 16:9, linkedin = 1:1, instagram = 4:5)
- Vary visual types across the plan
- visual_rationale must explain which Brand Kit asset is being used and WHY

Return a JSON array of ${postsPerCycle} items. Each item must have:
- publish_date: YYYY-MM-DD format, within the cycle dates
- channel: one of the allowed channels
- content_format: appropriate format for the channel
- working_title: compelling title
- objective: what this content achieves
- content_pillar: which pillar it serves
- related_offer: relevant Spiral Up offer if any (empty string if none)
- cta: call to action
- post_angle: the unique angle/hook
- draft_content: full draft copy
- carousel_idea: optional carousel or visual idea (empty string if N/A)
- key_message: the core message in one sentence
- suggested_cta: specific CTA text
- brand_alignment: brief explanation of why this aligns with Spiral Up
${SUGGESTION_RATIONALE_SPEC}
${OUTCOME_FIELDS_SPEC}
${VISUAL_FIELDS_SPEC}

Return ONLY a valid JSON array, no markdown wrapping.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate an editorial plan with visual directions for the cycle ${cycleStart} to ${cycleEnd}.` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (status === 402) return new Response(JSON.stringify({ error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const t = await response.text();
      console.error('AI gateway error:', status, t);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const items = JSON.parse(content);
      if (!Array.isArray(items)) throw new Error('Not an array');

      const { data: plan, error: planError } = await sb
        .from('editorial_plans')
        .insert({ cycle_start: cycleStart, cycle_end: cycleEnd, cadence: config?.cadence || 'weekly', status: 'active' })
        .select()
        .single();

      if (planError) throw planError;

      const itemsToInsert = items.map((item: any, idx: number) => ({
        plan_id: plan.id,
        publish_date: item.publish_date,
        channel: item.channel || 'linkedin',
        content_format: item.content_format || 'linkedin_post',
        working_title: item.working_title || '',
        objective: item.objective || '',
        content_pillar: item.content_pillar || '',
        related_offer: item.related_offer || '',
        cta: item.cta || '',
        status: 'suggested',
        post_angle: item.post_angle || '',
        draft_content: item.draft_content || '',
        carousel_idea: item.carousel_idea || '',
        key_message: item.key_message || '',
        suggested_cta: item.suggested_cta || '',
        brand_alignment: item.brand_alignment || '',
        suggestion_rationale: item.suggestion_rationale || '',
        sort_order: idx,
        visual_type: item.visual_type || '',
        visual_concept: item.visual_concept || '',
        backup_visual_concept: item.backup_visual_concept || '',
        backup_visual_type: item.backup_visual_type || '',
        visual_rationale: item.visual_rationale || '',
        visual_layout: item.visual_layout || '',
        image_direction: item.image_direction || '',
        visual_headline: item.visual_headline || '',
        visual_subheadline: item.visual_subheadline || '',
        cta_placement: item.cta_placement || '',
        format_ratio: item.format_ratio || '',
        recommended_assets: item.recommended_assets || [],
        visual_status: item.visual_type ? 'suggested' : 'none',
        audience_challenge: item.audience_challenge || '',
        insight_delivered: item.insight_delivered || '',
        practical_takeaway: item.practical_takeaway || '',
        expected_audience_action: item.expected_audience_action || '',
        outcome_score: item.outcome_score || 0,
      }));

      const { error: itemsError } = await sb.from('editorial_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Store learning memory for this cycle
      await storeLearningMemory(sb, plan.id, items);

      return new Response(JSON.stringify({ plan_id: plan.id, items_count: items.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Raw:', content.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI plan', raw: content.slice(0, 500) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('generate-editorial-plan error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
