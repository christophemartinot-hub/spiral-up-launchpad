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
    sb.from('brand_assets').select('*'),
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
    const lines = brandAssets.map((a: any) => `- [${a.category}] ${a.name}: ${a.description || ''} (${a.file_url || 'no file'})`);
    sections.push(`## BRAND ASSETS (available for visual suggestions)\n${lines.join('\n')}`);
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

async function getRecentItems(sb: any): Promise<string> {
  const { data: recentItems } = await sb
    .from('editorial_items')
    .select('working_title, channel, content_format, content_pillar, post_angle, visual_type, visual_concept')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!recentItems || recentItems.length === 0) return '';

  const lines = recentItems.map((i: any) => 
    `- "${i.working_title}" [${i.channel}/${i.content_format}] pillar:${i.content_pillar || 'none'} visual:${i.visual_type || 'none'}`
  );
  return `\n\n## RECENTLY GENERATED (avoid repeating these themes/angles/visuals)\n${lines.join('\n')}`;
}

const VISUAL_FIELDS_SPEC = `
- visual_type: one of "single_image","carousel","quote_card","framework_card","event_promo","workshop_promo","book_promo","infographic","article_cover","video_storyboard","document_post"
- visual_concept: 1-2 sentence describing the visual idea
- visual_layout: describe layout structure (e.g. "headline top, illustration center, CTA bottom")
- image_direction: what the main image/illustration should depict
- visual_headline: headline text to appear on the visual
- visual_subheadline: subheadline if relevant (empty string if none)
- cta_placement: where CTA should appear on visual
- format_ratio: aspect ratio for the channel (e.g. "1:1", "4:5", "16:9")
- recommended_assets: array of strings naming brand assets to use (book cover, SPIRAL icons, illustrations, etc). Use actual existing brand asset names when possible.`;

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

    const [brandContext, visualConfig, recentItems] = await Promise.all([
      buildBrandContext(sb),
      getVisualConfig(sb),
      getRecentItems(sb),
    ]);

    const { config, cycleStart, cycleEnd, action } = body;

    // Regenerate a single item
    if (action === 'regenerate_item') {
      const { item } = body;
      const systemPrompt = `You are the AI editorial planner for Spiral Up. ${brandContext}${visualConfig}${recentItems}

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
${VISUAL_FIELDS_SPEC}

VISUAL RULES:
- Always suggest a visual that matches the content
- Prioritize existing brand assets (SPIRAL illustrations, book cover, zone icons)
- Keep visuals clean, professional, uncluttered
- Never invent fake brand materials — if no asset exists, describe a concept instead
- Match format ratio to channel

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
      const systemPrompt = `You are the AI visual director for Spiral Up. ${brandContext}${visualConfig}

TASK: Generate a new visual direction for this content:
Title: ${item.working_title}
Channel: ${item.channel}
Format: ${item.content_format}
Key Message: ${item.key_message || ''}
Draft: ${(item.draft_content || '').slice(0, 500)}

Return a JSON object with ONLY these visual fields:
${VISUAL_FIELDS_SPEC}

VISUAL RULES:
- Prioritize existing brand assets
- Keep visuals clean, professional, uncluttered  
- Never invent fake brand materials
- Match format ratio to channel
- Designs should feel human, direct, practical — not flashy

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

    // Generate full editorial plan
    const channels = config?.channels || ['linkedin', 'blog', 'email'];
    const postsPerCycle = config?.posts_per_cycle || 5;
    const preferredFormats = config?.preferred_formats || ['linkedin_post', 'blog_post', 'newsletter'];
    const priorityTopics = config?.priority_topics || [];
    const targetAudience = config?.target_audience || '';
    const ctaPrefs = config?.cta_preferences || [];
    const campaignFocus = config?.campaign_focus || '';
    const exclusionRules = config?.exclusion_rules || [];

    const systemPrompt = `You are the AI editorial planner for Spiral Up. Your role is to create a strategic content plan with visual directions for the upcoming publication cycle.

${brandContext}${visualConfig}${recentItems}

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

VISUAL RULES:
- Always suggest a visual that matches the content
- Prioritize existing brand assets (SPIRAL illustrations, book cover, zone icons)
- Keep visuals clean, professional, uncluttered
- Never invent fake brand materials — if no asset exists, describe a concept instead
- Match format ratio to channel
- Vary visual types across the plan

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
        sort_order: idx,
        // Visual fields
        visual_type: item.visual_type || '',
        visual_concept: item.visual_concept || '',
        visual_layout: item.visual_layout || '',
        image_direction: item.image_direction || '',
        visual_headline: item.visual_headline || '',
        visual_subheadline: item.visual_subheadline || '',
        cta_placement: item.cta_placement || '',
        format_ratio: item.format_ratio || '',
        recommended_assets: item.recommended_assets || [],
        visual_status: item.visual_type ? 'suggested' : 'none',
      }));

      const { error: itemsError } = await sb.from('editorial_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

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
