import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const SOURCES = [
  { name: 'HBR', url: 'https://hbr.org/topic/subject/organizational-transformation' },
  { name: 'MIT Sloan', url: 'https://sloanreview.mit.edu/topic/organizational-behavior/' },
  { name: 'BCG', url: 'https://www.bcg.com/capabilities/people-strategy/insights' },
  { name: 'Gartner', url: 'https://www.gartner.com/en/insights/future-of-work' },
  { name: 'Corporate Rebels', url: 'https://corporate-rebels.com/blog/' },
  { name: 'Agile Alliance', url: 'https://www.agilealliance.org/resources/agile-library/' },
  { name: 'Business Agility Institute', url: 'https://businessagility.institute/learn/' },
  { name: 'Agile Business Consortium', url: 'https://www.agilebusiness.org/resource-library.html' },
]

async function scrapeSource(url: string): Promise<{ title: string; url: string; summary: string } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const data = await response.json()
    if (!data.success || !data.data?.markdown) return null

    const markdown = data.data.markdown.slice(0, 2000)
    if (markdown.length < 100) return null
    if (markdown.toLowerCase().includes('access denied')) return null

    const titleMatch = markdown.match(/^#{1,3}\s+(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : 'Recent article'
    const summary = markdown.replace(/#{1,6}\s+/g, '').slice(0, 800).trim()

    return { title, url, summary }
  } catch (e) {
    console.error(`Firecrawl error for ${url}:`, e)
    return null
  }
}

async function getBrandContext(supabase: any): Promise<string> {
  const [brand, voice, principles, founder] = await Promise.all([
    supabase.from('brand_core').select('*').maybeSingle(),
    supabase.from('voice_rules').select('*').limit(10),
    supabase.from('spiral_principles').select('*'),
    supabase.from('founder_profile').select('*').maybeSingle(),
  ])

  return `
BRAND: ${brand.data?.brand_name || 'Spiral Up'}
MISSION: ${brand.data?.mission || ''}
POSITIONING: ${brand.data?.positioning || ''}
FOUNDER: ${founder.data?.name || 'Christophe Martinot'} — ${founder.data?.bio || ''}
VOICE RULES: ${voice.data?.map((v: any) => v.rule).join('. ') || ''}
SPIRAL PRINCIPLES: ${principles.data?.map((p: any) => `${p.name}: ${p.description}`).join(' | ') || ''}
  `.trim()
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

async function generateAllContent(
  brandContext: string,
  article: { title: string; url: string; summary: string },
  sourceName: string
): Promise<any> {

  const prompt = `You are a content strategist for Christophe Martinot, creator of SPIRAL UP®.

BRAND CONTEXT:
${brandContext}

SOURCE ARTICLE from ${sourceName}:
Title: ${article.title}
Summary: ${article.summary}

TASK: Generate four distinct pieces of content based on the strongest insight from this article.

VOICE RULES:
- Short sentences, active voice
- No jargon, no corporate language  
- Practical, grounded in real organizational experience
- Human, direct, authentic
- Examples from pharma, healthcare, leadership contexts when relevant

Respond ONLY in this exact JSON format with no markdown:
{
  "idea": {
    "title": "max 8 words, sharp and specific",
    "description": "one sentence strategic angle",
    "principle": "one of: Synergize | Provide | Inspect | Respond | Act & Accept | Learn",
    "tension_statement": "the core organizational tension this idea addresses, 2-3 sentences"
  },
  "linkedin": {
    "hook": "first punchy line that stops the scroll, max 15 words",
    "content": "full post 150-200 words ending with #SpiralUpWorks",
    "hashtags": ["SpiralUpWorks", "OrganizationalTransformation", "Leadership", "Agility"],
    "cta": "one closing question or call to action"
  },
  "blog": {
    "title": "SEO-optimized title with primary keyword",
    "slug": "url-friendly-slug-from-title",
    "content": "600-800 word blog article in markdown with ## H2 headers, practical examples, actionable takeaways. Written in Christophe's voice.",
    "excerpt": "2-3 sentence compelling hook for the article",
    "meta_description": "max 155 chars SEO meta description with primary keyword",
    "tags": ["transformation", "leadership", "agility", "spiral-up", "organizational-change"],
    "seo_keywords": ["organizational transformation", "leadership change", "agile organization", "spiral up framework", "team performance"]
  },
  "instagram": {
    "caption": "engaging caption 80-120 words, visual storytelling angle",
    "hashtags": ["SpiralUpWorks", "OrganizationalTransformation", "Leadership", "Agility", "FutureOfWork", "BusinessTransformation", "ServantLeadership", "TeamDevelopment"],
    "cta": "link in bio or save this post style"
  },
  "facebook": {
    "content": "conversational post 100-150 words, slightly different angle than LinkedIn, invites discussion",
    "hashtags": ["SpiralUpWorks", "Leadership", "Transformation"],
    "cta": "question that invites comments"
  }
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

async function getActiveCycleId(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('strategic_cycles')
    .select('id')
    .eq('status', 'active')
    .order('cycle_start', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.id || null
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!FIRECRAWL_API_KEY || !ANTHROPIC_API_KEY) {
      throw new Error('Missing required secrets: FIRECRAWL_API_KEY or ANTHROPIC_API_KEY')
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const cycleId = await getActiveCycleId(supabase)
    if (!cycleId) {
      return new Response(JSON.stringify({ error: 'No active strategic cycle found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const brandContext = await getBrandContext(supabase)

    // Scrape all sources in parallel
    const scrapeResults = await Promise.allSettled(
      SOURCES.map(source => scrapeSource(source.url).then(result => ({ source, result })))
    )

    // Filter valid results, max 6
    const validSources = scrapeResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.result !== null)
      .map(r => r.value)
      .slice(0, 6)

    const results = []

    // Generate content for each valid source
    for (const { source, result: article } of validSources) {
      try {
        const generated = await generateAllContent(brandContext, article, source.name)

        // Store signal
        const { data: signal } = await supabase
          .from('content_signals')
          .insert({
            source_name: source.name,
            source_url: source.url,
            article_title: article.title,
            article_url: article.url,
            article_summary: article.summary,
            spiral_principle: generated.idea.principle,
            status: 'pending',
          })
          .select()
          .single()

        // Insert strategic idea with all content pre-populated
        const { data: idea } = await supabase
          .from('strategic_ideas')
          .insert({
            cycle_id: cycleId,
            idea_type: 'content',
            title: generated.idea.title,
            description: generated.idea.description,
            tension_statement: generated.idea.tension_statement,
            content_potential: generated.linkedin.content,
            why_fits_spiral_up: `Connects to ${generated.idea.principle} principle`,
            related_pillar: generated.idea.principle,
            status: 'suggested',
            audience_value_score: 7,
            outcome_potential_score: 7,
            growth_potential_score: 7,
            brand_relevance_score: 8,
            offer_relevance_score: 6,
            diversity_score: 6,
            performance_learning_score: 6,
            overall_rank: 7,
          })
          .select()
          .single()

        // Pre-create all four content drafts
        await Promise.all([
          // Blog draft
          supabase.from('blog_posts').insert({
            title: generated.blog.title,
            slug: generateSlug(generated.blog.title),
            content: generated.blog.content,
            excerpt: generated.blog.excerpt,
            meta_description: generated.blog.meta_description,
            tags: generated.blog.tags,
            seo_keywords: generated.blog.seo_keywords,
            content_pillar: generated.idea.principle,
            status: 'draft',
          }),

          // LinkedIn draft
          supabase.from('linkedin_posts').insert({
            hook: generated.linkedin.hook,
            content: generated.linkedin.content,
            hashtags: generated.linkedin.hashtags,
            cta: generated.linkedin.cta,
            content_pillar: generated.idea.principle,
            character_count: generated.linkedin.content.length,
            status: 'draft',
          }),

          // Instagram draft
          supabase.from('instagram_posts').insert({
            caption: generated.instagram.caption,
            hashtags: generated.instagram.hashtags,
            cta: generated.instagram.cta,
            content_pillar: generated.idea.principle,
            media_type: 'post',
            status: 'draft',
          }),

          // Facebook draft
          supabase.from('facebook_posts').insert({
            content: generated.facebook.content,
            hashtags: generated.facebook.hashtags,
            cta: generated.facebook.cta,
            content_pillar: generated.idea.principle,
            status: 'draft',
          }),
        ])

        // Update signal
        await supabase
          .from('content_signals')
          .update({ status: 'generated', generated_idea_id: idea.id })
          .eq('id', signal.id)

        results.push({
          source: source.name,
          title: generated.idea.title,
          principle: generated.idea.principle,
          idea_id: idea.id,
        })

      } catch (e) {
        console.error(`Error processing ${source.name}:`, e)
        continue
      }
    }

    return new Response(
      JSON.stringify({ success: true, generated: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('scrape-and-generate error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
