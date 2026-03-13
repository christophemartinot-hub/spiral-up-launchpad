import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { cycleStart, cycleEnd } = await req.json();
    if (!cycleStart || !cycleEnd) {
      return new Response(JSON.stringify({ error: 'cycleStart and cycleEnd required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Gather all brand intelligence in parallel ───
    const [
      { data: brandCore },
      { data: founder },
      { data: principles },
      { data: pillars },
      { data: offers },
      { data: bookInfo },
      { data: events },
      { data: voice },
      { data: websitePages },
      { data: recentItems },
      { data: feedback },
      { data: performance },
      { data: learningMemory },
      { data: blogPosts },
      { data: perfConfig },
    ] = await Promise.all([
      sb.from('brand_core').select('*').limit(1).single(),
      sb.from('founder_profile').select('*').limit(1).single(),
      sb.from('spiral_principles').select('*').order('sort_order'),
      sb.from('brand_content_pillars').select('*').order('sort_order'),
      sb.from('offers').select('*').order('sort_order'),
      sb.from('book_info').select('*').limit(1).single(),
      sb.from('events_workshops').select('*').order('sort_order'),
      sb.from('voice_rules').select('*').limit(1).single(),
      sb.from('website_pages').select('title, url, key_topics, linked_pillars').limit(20),
      sb.from('editorial_items').select('working_title, channel, content_format, content_pillar, status, key_message, cta, visual_type, rejection_reason').order('created_at', { ascending: false }).limit(60),
      sb.from('editorial_feedback').select('*').order('created_at', { ascending: false }).limit(100),
      sb.from('content_performance').select('*').order('publish_date', { ascending: false }).limit(50),
      sb.from('learning_memory').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('blog_posts').select('title, slug, content_pillar, status, tags').order('created_at', { ascending: false }).limit(30),
      sb.from('performance_config').select('*').limit(1).single(),
    ]);

    // ─── Build context sections ───
    const sections: string[] = [];

    // Brand identity
    if (brandCore) {
      sections.push(`## BRAND IDENTITY
Brand: ${brandCore.brand_name} | Tagline: ${brandCore.tagline}
Founder: ${brandCore.founder} (${brandCore.company})
Mission: ${brandCore.mission}
Vision: ${brandCore.vision}`);
    }

    // SPIRAL framework
    if (principles?.length) {
      sections.push(`## SPIRAL FRAMEWORK\n${principles.map((p: any) => `- ${p.letter}: ${p.principle_name} — ${p.short_description}`).join('\n')}`);
    }

    // Content pillars
    if (pillars?.length) {
      sections.push(`## CONTENT PILLARS\n${pillars.map((p: any) => `- ${p.emoji} ${p.title}: ${p.description} | Topics: ${(p.typical_topics || []).join(', ')} | Audience: ${p.target_audience}`).join('\n')}`);
    }

    // Offers
    if (offers?.length) {
      sections.push(`## OFFERS & SERVICES\n${offers.map((o: any) => `- ${o.icon} ${o.offer_name}: ${o.description} | Target: ${o.target_clients} | CTA examples: ${(o.cta_examples || []).join(', ')}`).join('\n')}`);
    }

    // Book
    if (bookInfo) {
      sections.push(`## BOOK\n${bookInfo.title}: ${bookInfo.subtitle}\n${bookInfo.description}`);
    }

    // Events
    if (events?.length) {
      sections.push(`## EVENTS & WORKSHOPS\n${events.map((e: any) => `- ${e.event_name} [${e.event_type}] ${e.status}: ${e.description}`).join('\n')}`);
    }

    // Website knowledge
    if (websitePages?.length) {
      sections.push(`## WEBSITE KNOWLEDGE\n${websitePages.map((p: any) => `- ${p.title} (${p.url}): Topics: ${(p.key_topics || []).join(', ')}`).join('\n')}`);
    }

    // Blog library
    if (blogPosts?.length) {
      sections.push(`## PUBLISHED BLOG LIBRARY\n${blogPosts.map((b: any) => `- "${b.title}" [${b.status}] pillar:${b.content_pillar || 'none'} tags:${(b.tags || []).join(',')}`).join('\n')}`);
    }

    // Recent editorial items (for topic cooldown & diversity)
    if (recentItems?.length) {
      const pillarCounts: Record<string, number> = {};
      const recentTopics = recentItems.map((i: any) => i.key_message || i.working_title).filter(Boolean);
      recentItems.forEach((i: any) => {
        const p = i.content_pillar || 'none';
        pillarCounts[p] = (pillarCounts[p] || 0) + 1;
      });
      sections.push(`## RECENT EDITORIAL ITEMS (last ${recentItems.length})\nTopics covered: ${recentTopics.slice(0, 20).join('; ')}\nPillar distribution: ${Object.entries(pillarCounts).map(([p, c]) => `${p}:${c}`).join(', ')}`);
    }

    // Feedback/approval behavior
    if (feedback?.length) {
      const total = feedback.length;
      const approved = feedback.filter((f: any) => f.action_type?.startsWith('approved')).length;
      const rejected = feedback.filter((f: any) => f.action_type === 'rejected').length;
      const rejReasons = feedback.filter((f: any) => f.rejection_reason).map((f: any) => f.rejection_reason).slice(0, 8);
      const approvedTopics = feedback.filter((f: any) => f.action_type?.startsWith('approved')).map((f: any) => f.original_topic).filter(Boolean).slice(0, 10);
      const rejectedTopics = feedback.filter((f: any) => f.action_type === 'rejected').map((f: any) => f.original_topic).filter(Boolean).slice(0, 10);
      sections.push(`## EDITORIAL BEHAVIOR\nApproval rate: ${Math.round((approved / total) * 100)}% (${approved}/${total})\nRejected: ${rejected}\nApproved topics: ${approvedTopics.join('; ')}\nRejected topics: ${rejectedTopics.join('; ')}\nRejection reasons: ${rejReasons.join('; ')}`);
    }

    // Performance signals
    if (performance?.length) {
      const totalSaves = performance.reduce((s: number, p: any) => s + (p.saves || 0), 0);
      const totalShares = performance.reduce((s: number, p: any) => s + (p.shares || 0), 0);
      const totalGrowth = performance.reduce((s: number, p: any) => s + (p.follower_growth || 0), 0);
      const totalSignups = performance.reduce((s: number, p: any) => s + (p.newsletter_signups || 0), 0);
      const byPillar: Record<string, number> = {};
      performance.forEach((p: any) => {
        const pl = p.content_pillar || 'none';
        byPillar[pl] = (byPillar[pl] || 0) + (p.engagement || 0);
      });
      sections.push(`## PERFORMANCE DATA (${performance.length} items)\nSaves: ${totalSaves} | Shares: ${totalShares} | Follower growth: ${totalGrowth} | Newsletter signups: ${totalSignups}\nEngagement by pillar: ${Object.entries(byPillar).map(([p, e]) => `${p}:${e}`).join(', ')}`);
    }

    // Learning memory
    if (learningMemory?.length) {
      const approved = learningMemory.filter((m: any) => m.action_outcome === 'approved').map((m: any) => m.topic).slice(0, 10);
      const rejected = learningMemory.filter((m: any) => m.action_outcome === 'rejected').map((m: any) => m.topic).slice(0, 10);
      sections.push(`## LEARNING MEMORY\nLearned-approved topics: ${approved.join('; ')}\nLearned-rejected topics: ${rejected.join('; ')}`);
    }

    const brandContext = sections.join('\n\n');

    // ─── Build prompt ───
    const systemPrompt = `You are the Strategic Idea Engine for Spiral Up, a brand intelligence platform.

Your job is to analyze the complete brand context, performance data, editorial history, and audience landscape to generate prioritized strategic content opportunities for the editorial cycle: ${cycleStart} to ${cycleEnd}.

You must think strategically: what conversations should Spiral Up lead? What audience tensions deserve attention? What myths need challenging? What practical lessons deserve teaching?

${brandContext}

## YOUR OUTPUT REQUIREMENTS

Return a JSON object with this exact structure:
{
  "tensions": [
    {
      "title": "short title",
      "tension_statement": "The full tension described as a paradox",
      "who_affected": "Who experiences this tension",
      "why_now": "Why this is urgent now",
      "related_pillar": "matching content pillar name",
      "content_potential": "How this could become content",
      "follower_growth_potential": "Why this could drive growth",
      "business_relevance": "How this connects to Spiral Up offers",
      "why_matters_now": "Strategic explanation",
      "why_relevant_to_audience": "Audience explanation",
      "why_fits_spiral_up": "Brand alignment",
      "why_supports_growth": "Growth logic",
      "intended_outcome": "What we want the audience to do/feel/think",
      "audience_value_score": 1-10,
      "outcome_potential_score": 1-10,
      "growth_potential_score": 1-10,
      "brand_relevance_score": 1-10,
      "offer_relevance_score": 1-10,
      "diversity_score": 1-10
    }
  ],
  "opportunities": [
    {
      "title": "short title",
      "description": "Full description of the opportunity",
      "opportunity_type": "teach|myth_challenge|lesson|opinion|blog_theme|event_angle|book_idea|offer_linked",
      "related_pillar": "pillar name",
      "related_offer": "offer name if applicable",
      "content_potential": "...",
      "follower_growth_potential": "...",
      "business_relevance": "...",
      "why_matters_now": "...",
      "why_relevant_to_audience": "...",
      "why_fits_spiral_up": "...",
      "why_supports_growth": "...",
      "intended_outcome": "...",
      "audience_value_score": 1-10,
      "outcome_potential_score": 1-10,
      "growth_potential_score": 1-10,
      "brand_relevance_score": 1-10,
      "offer_relevance_score": 1-10,
      "diversity_score": 1-10
    }
  ],
  "myths": [
    {
      "title": "The myth statement",
      "description": "Why this is a myth and how to challenge it",
      "related_pillar": "...",
      "content_potential": "...",
      "why_matters_now": "...",
      "why_fits_spiral_up": "...",
      "intended_outcome": "...",
      "audience_value_score": 1-10,
      "outcome_potential_score": 1-10,
      "growth_potential_score": 1-10,
      "brand_relevance_score": 1-10
    }
  ],
  "lessons": [
    {
      "title": "Lesson title",
      "description": "The practical lesson and how to teach it",
      "related_pillar": "...",
      "content_potential": "...",
      "why_matters_now": "...",
      "why_fits_spiral_up": "...",
      "intended_outcome": "...",
      "audience_value_score": 1-10,
      "outcome_potential_score": 1-10,
      "growth_potential_score": 1-10,
      "brand_relevance_score": 1-10
    }
  ],
  "conversions": [
    {
      "title": "Conversion opportunity title",
      "description": "How this drives business outcomes",
      "related_offer": "specific offer name",
      "related_pillar": "...",
      "content_potential": "...",
      "business_relevance": "...",
      "why_matters_now": "...",
      "intended_outcome": "...",
      "audience_value_score": 1-10,
      "outcome_potential_score": 1-10,
      "offer_relevance_score": 1-10,
      "brand_relevance_score": 1-10
    }
  ],
  "recommended_focus": "A 2-3 sentence recommendation for the overall editorial focus of this cycle"
}

RULES:
- Generate exactly 5 tensions, 5 opportunities, 3 myths, 3 lessons, 3 conversions
- Each idea must be distinct and non-overlapping
- Avoid topics recently covered (see RECENT EDITORIAL ITEMS)
- Favor underused pillars
- Prioritize ideas that drive saves, shares, and follower growth over vanity metrics
- Every idea must connect to Spiral Up's brand, framework, or offers
- Score honestly — not everything should be 8+
- The recommended_focus should synthesize the strongest themes into a cycle direction

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

    // ─── Call AI ───
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate strategic ideas for the editorial cycle ${cycleStart} to ${cycleEnd}. Analyze all the brand intelligence, performance data, and editorial history provided. Think deeply about what conversations Spiral Up should lead this cycle.` },
        ],
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error('AI error:', errText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResp.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonStr = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: rawContent.slice(0, 200) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── Store results ───
    // Create strategic cycle
    const { data: cycle, error: cycleErr } = await sb
      .from('strategic_cycles')
      .insert({
        cycle_start: cycleStart,
        cycle_end: cycleEnd,
        status: 'generated',
        recommended_focus: parsed.recommended_focus || '',
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (cycleErr || !cycle) {
      return new Response(JSON.stringify({ error: 'Failed to create strategic cycle', details: cycleErr?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build all ideas for batch insert
    const ideas: any[] = [];
    let sortOrder = 0;

    const mapIdea = (item: any, ideaType: string) => {
      sortOrder++;
      const overall = Math.round(
        ((item.audience_value_score || 0) * 0.25) +
        ((item.outcome_potential_score || 0) * 0.2) +
        ((item.growth_potential_score || 0) * 0.2) +
        ((item.brand_relevance_score || 0) * 0.15) +
        ((item.offer_relevance_score || 0) * 0.1) +
        ((item.diversity_score || 0) * 0.1)
      );
      return {
        cycle_id: cycle.id,
        idea_type: ideaType,
        title: item.title || '',
        description: item.description || item.tension_statement || '',
        tension_statement: item.tension_statement || '',
        who_affected: item.who_affected || '',
        why_now: item.why_now || '',
        related_pillar: item.related_pillar || '',
        related_offer: item.related_offer || '',
        content_potential: item.content_potential || '',
        follower_growth_potential: item.follower_growth_potential || '',
        business_relevance: item.business_relevance || '',
        why_matters_now: item.why_matters_now || '',
        why_relevant_to_audience: item.why_relevant_to_audience || '',
        why_fits_spiral_up: item.why_fits_spiral_up || '',
        why_supports_growth: item.why_supports_growth || '',
        intended_outcome: item.intended_outcome || '',
        audience_value_score: item.audience_value_score || 0,
        outcome_potential_score: item.outcome_potential_score || 0,
        growth_potential_score: item.growth_potential_score || 0,
        brand_relevance_score: item.brand_relevance_score || 0,
        offer_relevance_score: item.offer_relevance_score || 0,
        diversity_score: item.diversity_score || 0,
        overall_rank: overall,
        sort_order: sortOrder,
        status: 'suggested',
      };
    };

    for (const t of (parsed.tensions || [])) ideas.push(mapIdea(t, 'tension'));
    for (const o of (parsed.opportunities || [])) ideas.push(mapIdea(o, 'opportunity'));
    for (const m of (parsed.myths || [])) ideas.push(mapIdea(m, 'myth'));
    for (const l of (parsed.lessons || [])) ideas.push(mapIdea(l, 'lesson'));
    for (const c of (parsed.conversions || [])) ideas.push(mapIdea(c, 'conversion'));

    const { error: insertErr } = await sb.from('strategic_ideas').insert(ideas);
    if (insertErr) {
      console.error('Insert error:', insertErr);
    }

    return new Response(JSON.stringify({
      success: true,
      cycleId: cycle.id,
      totalIdeas: ideas.length,
      recommended_focus: parsed.recommended_focus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('generate-strategic-ideas error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
