import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const MAX_SOURCES_PER_RUN = 6
const SCRAPE_TIMEOUT_MS = 10_000

const SOURCES = [
  { name: 'HBR', url: 'https://hbr.org/topic/subject/organizational-transformation' },
  { name: 'McKinsey', url: 'https://www.mckinsey.com/featured-insights' },
  { name: 'MIT Sloan', url: 'https://sloanreview.mit.edu/topic/organizational-behavior/' },
  { name: 'BCG', url: 'https://www.bcg.com/capabilities/people-strategy/insights' },
  { name: 'Gartner', url: 'https://www.gartner.com/en/insights/future-of-work' },
  { name: 'Corporate Rebels', url: 'https://corporate-rebels.com/blog/' },
  { name: 'Agile Alliance', url: 'https://www.agilealliance.org/resources/agile-library/' },
  { name: 'Business Agility Institute', url: 'https://businessagility.institute/learn/' },
  { name: 'Agile Business Consortium', url: 'https://www.agilebusiness.org/resource-library.html' },
]

const SPIRAL_PRINCIPLES = [
  'Synergize', 'Provide', 'Inspect', 'Respond', 'Act & Accept', 'Learn'
]

async function scrapeSource(url: string): Promise<{ title: string; url: string; summary: string } | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS)

  try {
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

    const data = await response.json()
    if (!data.success && !data.data?.markdown) return null

    const markdown = (data.data?.markdown || data.markdown || '').slice(0, 2000)
    if (!markdown || markdown.length < 100) return null

    // Skip access-denied pages
    const lower = markdown.toLowerCase()
    if (lower.includes('access denied') || lower.includes('403 forbidden') || lower.includes('please verify you are a human')) {
      return null
    }

    const titleMatch = markdown.match(/^#{1,3}\s+(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : 'Recent article'
    const summary = markdown.replace(/#{1,6}\s+/g, '').slice(0, 800).trim()

    return { title, url, summary }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      console.warn(`Scrape timeout for ${url}`)
    } else {
      console.error(`Firecrawl error for ${url}:`, e)
    }
    return null
  } finally {
    clearTimeout(timeout)
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
FOUNDER: ${founder.data?.short_bio || 'Christophe Martinot'}
VOICE: ${voice.data?.map((v: any) => v.tone_description).filter(Boolean).join('. ') || ''}
SPIRAL PRINCIPLES: ${principles.data?.map((p: any) => `${p.principle_name}: ${p.short_description}`).join(' | ') || SPIRAL_PRINCIPLES.join(', ')}
  `.trim()
}

async function generatePost(
  brandContext: string,
  article: { title: string; url: string; summary: string },
  sourceName: string
): Promise<{ post: string; principle: string; title: string; description: string }> {

  const prompt = `You are writing a LinkedIn post for Christophe Martinot, creator of SPIRAL UP®.

BRAND CONTEXT:
${brandContext}

SOURCE ARTICLE from ${sourceName}:
Title: ${article.title}
Summary: ${article.summary}

TASK:
1. Extract the strongest insight or tension from this article
2. Connect it naturally to ONE of the SPIRAL UP® principles: Synergize, Provide, Inspect, Respond, Act & Accept, Learn
3. Write a LinkedIn post in Christophe's voice:
   - Short sentences, active voice
   - No jargon, no corporate language
   - Practical and grounded in real organizational experience
   - Maximum 200 words
   - End with #SpiralUpWorks
4. Generate a short idea title (max 8 words)
5. Generate a one-sentence description of the strategic angle

Respond ONLY in this JSON format:
{
  "post": "the full LinkedIn post text",
  "principle": "one of the 6 SPIRAL principles",
  "title": "short idea title",
  "description": "one sentence strategic description"
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
      max_tokens: 1000,
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const cycleId = await getActiveCycleId(supabase)
    if (!cycleId) {
      return new Response(JSON.stringify({ error: 'No active strategic cycle found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const brandContext = await getBrandContext(supabase)

    // 1. Scrape all sources in parallel with individual timeouts
    console.log(`Scraping ${SOURCES.length} sources in parallel...`)
    const scrapeResults = await Promise.allSettled(
      SOURCES.map(async (source) => {
        const article = await scrapeSource(source.url)
        return { source, article }
      })
    )

    // 2. Collect valid articles, cap at MAX_SOURCES_PER_RUN
    const validSources: { source: typeof SOURCES[0]; article: NonNullable<Awaited<ReturnType<typeof scrapeSource>>> }[] = []
    for (const result of scrapeResults) {
      if (validSources.length >= MAX_SOURCES_PER_RUN) break
      if (result.status === 'fulfilled' && result.value.article) {
        validSources.push({ source: result.value.source, article: result.value.article })
        console.log(`✅ Scraped: ${result.value.source.name}`)
      } else if (result.status === 'fulfilled') {
        console.log(`⏭️ Skipped (no content): ${result.value.source.name}`)
      } else {
        console.warn(`❌ Failed:`, result.reason)
      }
    }

    console.log(`${validSources.length} sources with valid content, generating ideas...`)

    // 3. Generate ideas in parallel for all valid sources
    const generateResults = await Promise.allSettled(
      validSources.map(async ({ source, article }) => {
        const { data: signal } = await supabase
          .from('content_signals')
          .insert({
            source_name: source.name,
            source_url: source.url,
            article_title: article.title,
            article_url: article.url,
            article_summary: article.summary,
            status: 'pending',
          })
          .select()
          .single()

        const generated = await generatePost(brandContext, article, source.name)

        const { data: idea } = await supabase
          .from('strategic_ideas')
          .insert({
            cycle_id: cycleId,
            idea_type: 'content',
            title: generated.title,
            description: generated.description,
            content_potential: generated.post,
            tension_statement: generated.post,
            why_fits_spiral_up: `Connects to ${generated.principle} principle`,
            related_pillar: generated.principle,
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

        if (signal && idea) {
          await supabase
            .from('content_signals')
            .update({
              status: 'generated',
              generated_idea_id: idea.id,
              spiral_principle: generated.principle,
            })
            .eq('id', signal.id)
        }

        console.log(`✅ ${source.name}: ${generated.title}`)
        return {
          source: source.name,
          title: generated.title,
          principle: generated.principle,
          idea_id: idea?.id,
        }
      })
    )

    // 4. Collect results
    const results = generateResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value)

    const errors = generateResults
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r, i) => ({ source: validSources[i]?.source.name, error: String(r.reason) }))

    if (errors.length > 0) {
      console.warn('Generation errors:', JSON.stringify(errors))
    }

    return new Response(JSON.stringify({ success: true, generated: results.length, skipped: SOURCES.length - validSources.length, results, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('scrape-and-generate error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
