import { supabase } from '@/integrations/supabase/client';

/**
 * AI Context Generator
 * Compiles all Brand Intelligence data into a structured system prompt
 * that feeds the AI content generator for consistent Spiral Up output.
 */
export async function buildBrandContext(): Promise<string> {
  // Fetch all brand data in parallel
  const [
    { data: brandCore },
    { data: founder },
    { data: principles },
    { data: voice },
    { data: pillars },
    { data: offers },
    { data: pages },
    { data: examples },
    { data: bookInfo },
    { data: events },
  ] = await Promise.all([
    supabase.from('brand_core').select('*').limit(1).single(),
    supabase.from('founder_profile').select('*').limit(1).single(),
    supabase.from('spiral_principles').select('*').order('sort_order'),
    supabase.from('voice_rules').select('*').limit(1).single(),
    supabase.from('brand_content_pillars').select('*').order('sort_order'),
    supabase.from('offers').select('*').order('sort_order'),
    supabase.from('website_pages').select('*'),
    supabase.from('example_content').select('*').limit(10),
    supabase.from('book_info').select('*').limit(1).single(),
    supabase.from('events_workshops').select('*').order('sort_order'),
  ]);

  const sections: string[] = [];

  // ── Brand Identity ──
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
${(brandCore.key_beliefs as string[] || []).length > 0 ? `Key Beliefs:\n${(brandCore.key_beliefs as string[]).map((b: string) => `- ${b}`).join('\n')}` : ''}`);
  }

  // ── Founder Profile ──
  if (founder) {
    const parts = [];
    if (founder.short_bio) parts.push(`Short Bio: ${founder.short_bio}`);
    if (founder.long_bio) parts.push(`Full Bio: ${founder.long_bio}`);
    if ((founder.expertise_areas as string[] || []).length > 0) parts.push(`Expertise: ${(founder.expertise_areas as string[]).join(', ')}`);
    if ((founder.speaking_topics as string[] || []).length > 0) parts.push(`Speaking Topics: ${(founder.speaking_topics as string[]).join(', ')}`);
    if (founder.personal_tone_guidelines) parts.push(`Personal Tone: ${founder.personal_tone_guidelines}`);
    if (parts.length > 0) {
      sections.push(`## FOUNDER PROFILE\n${parts.join('\n')}`);
    }
  }

  // ── SPIRAL Framework ──
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

  // ── Voice & Tone ──
  if (voice) {
    const parts = [];
    if (voice.tone_description) parts.push(`Tone: ${voice.tone_description}`);
    if ((voice.words_to_avoid as string[] || []).length > 0) parts.push(`AVOID these words/phrases: ${(voice.words_to_avoid as string[]).join(', ')}`);
    if ((voice.words_to_prefer as string[] || []).length > 0) parts.push(`PREFER these words/phrases: ${(voice.words_to_prefer as string[]).join(', ')}`);
    if ((voice.writing_style_rules as string[] || []).length > 0) parts.push(`Writing Rules:\n${(voice.writing_style_rules as string[]).map((r: string) => `- ${r}`).join('\n')}`);
    if ((voice.typical_expressions as string[] || []).length > 0) parts.push(`Typical expressions: ${(voice.typical_expressions as string[]).join(', ')}`);
    if (parts.length > 0) {
      sections.push(`## VOICE & TONE RULES\n${parts.join('\n')}`);
    }
  }

  // ── Content Pillars ──
  if (pillars && pillars.length > 0) {
    const lines = pillars.map((p: any) => {
      let line = `- ${p.emoji || '📌'} ${p.title}`;
      if (p.description) line += `: ${p.description}`;
      if (p.target_audience) line += ` (Audience: ${p.target_audience})`;
      if ((p.keywords as string[] || []).length > 0) line += `\n  Keywords: ${(p.keywords as string[]).join(', ')}`;
      return line;
    });
    sections.push(`## CONTENT PILLARS\n${lines.join('\n')}`);
  }

  // ── Offers ──
  if (offers && offers.length > 0) {
    const lines = offers.map((o: any) => {
      let line = `- ${o.icon || '🎯'} ${o.offer_name}`;
      if (o.description) line += `: ${o.description}`;
      if (o.target_clients) line += ` (For: ${o.target_clients})`;
      return line;
    });
    sections.push(`## OFFERS & SERVICES\n${lines.join('\n')}`);
  }

  // ── Website Knowledge ──
  if (pages && pages.length > 0) {
    const lines = pages.slice(0, 5).map((p: any) => {
      let line = `- ${p.title || p.url}`;
      if (p.page_text) line += `\n  ${p.page_text.slice(0, 500)}`;
      return line;
    });
    sections.push(`## WEBSITE KNOWLEDGE\n${lines.join('\n')}`);
  }

  // ── Example Content Style ──
  if (examples && examples.length > 0) {
    const lines = examples.slice(0, 3).map((e: any) => {
      return `- [${(e.content_type || '').replace(/_/g, ' ')}] "${e.title}"\n  ${(e.content || '').slice(0, 300)}...`;
    });
    sections.push(`## EXAMPLE CONTENT (match this style)\n${lines.join('\n')}`);
  }

  const systemPrompt = `You are the AI content engine for Spiral Up. Every piece of content you generate must align with the brand intelligence below.

${sections.join('\n\n')}

RULES:
- Stay unmistakably Spiral Up in voice and positioning
- Never use generic AI marketing language
- Be human, direct, pragmatic, and energizing
- Short paragraphs, bold openings, thought-provoking questions
- Stories before frameworks, data to support intuition
- Blog posts are for SpiralingUp.works/blog — include SEO-friendly titles and meta descriptions`;

  return systemPrompt;
}
