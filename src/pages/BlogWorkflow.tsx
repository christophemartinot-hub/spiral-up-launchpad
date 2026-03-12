import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { brandProfile } from '@/data/brand';
import { streamContent } from '@/lib/ai';
import { Sparkles, FileText, Globe, Link2, Hash, Eye, Copy, Check, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

interface BlogPost {
  title: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  pillar: string;
  seoKeywords: string[];
  internalLinks: string[];
  linkedinVersion: string;
  newsletterVersion: string;
  status: 'draft' | 'review' | 'approved' | 'published';
}

const sampleBlogPosts: BlogPost[] = [
  {
    title: 'Why Most Transformations Fail Before They Start',
    metaDescription: 'Discover the systemic patterns that doom organizational transformations and learn how the SPIRAL framework prevents them.',
    excerpt: 'The problem isn\'t the transformation plan. It\'s the system the plan lives in.',
    content: '',
    pillar: 'systemic_change',
    seoKeywords: ['organizational transformation', 'change management', 'systemic change', 'SPIRAL framework'],
    internalLinks: ['/blog/spiral-framework-guide', '/blog/leadership-evolution'],
    linkedinVersion: 'Most transformations fail. Not because the plan is bad — but because the system resists it...',
    newsletterVersion: 'This week I want to share something uncomfortable: the real reason transformations fail...',
    status: 'published',
  },
  {
    title: 'The Leader\'s Paradox: Control vs. Enablement',
    metaDescription: 'How leaders can shift from controlling outcomes to enabling their teams to thrive in complex environments.',
    excerpt: 'The best leaders don\'t control more. They enable more.',
    content: '',
    pillar: 'leadership_evolution',
    seoKeywords: ['leadership', 'team empowerment', 'servant leadership', 'adaptive leadership'],
    internalLinks: ['/blog/healthy-systems', '/blog/resilience-building'],
    linkedinVersion: 'I used to think great leadership meant having all the answers...',
    newsletterVersion: 'Dear reader, let me ask you something: When was the last time you let go of control?',
    status: 'review',
  },
  {
    title: 'Agility Is a Means, Not an End',
    metaDescription: 'Stop treating agile as the destination. Learn how to use business agility as a vehicle for delivering real customer value.',
    excerpt: 'If your agile transformation doesn\'t change outcomes, it\'s just theater.',
    content: '',
    pillar: 'business_agility',
    seoKeywords: ['business agility', 'agile transformation', 'customer value', 'agile beyond IT'],
    internalLinks: ['/blog/customer-centricity', '/blog/spiral-framework-guide'],
    linkedinVersion: 'Agile isn\'t the goal. It never was. The goal is delivering value to customers faster...',
    newsletterVersion: 'This might be controversial, but I need to say it: most agile transformations are solving the wrong problem...',
    status: 'draft',
  },
];

export default function BlogWorkflow() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [topic, setTopic] = useState('');
  const [pillar, setPillar] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');

  const handleGenerateBlog = useCallback(async () => {
    if (!topic.trim()) {
      toast.error('Enter a blog topic');
      return;
    }

    setIsGenerating(true);
    setGeneratedPost('');
    setActiveTab('editor');

    const selectedPillar = brandProfile.contentPillars.find(p => p.id === pillar);

    const prompt = `Create a complete blog post for publication at SpiralingUp.works/blog.

Topic: "${topic}"
Content Pillar: ${selectedPillar?.name || 'General'}

IMPORTANT: Generate ALL of the following sections clearly labeled:

## SEO METADATA
- Title (under 60 characters)
- Meta Description (under 160 characters)
- Excerpt (1-2 sentences)
- Primary Keywords (comma-separated)

## BLOG POST
Write the full article in markdown with:
- A compelling opening hook (2-3 sentences that grab attention)
- 3-5 H2 sections with substantive content
- Use of the SPIRAL framework where relevant
- Real-world examples or analogies
- A strong conclusion with a clear call to action
- Total length: 1200-1800 words

## INTERNAL LINKING SUGGESTIONS
- 3 suggested internal links to related topics on the blog

## HERO VISUAL DIRECTION
For every blog post, suggest a matching hero visual. The blog must never be text-only.

### Primary Visual Concept
- Visual Type: choose one of: editorial cover image, illustrated article cover, simple framework visual, quote-led cover, book-related visual, event/workshop visual, branded abstract visual
- Visual Concept: 1-2 sentences describing the primary visual idea
- Cover Title: the headline to display on the visual
- Cover Subtitle: optional subtitle (or "none")
- Layout Guidance: describe the layout (e.g. "headline top-left, illustration center-right, brand mark bottom")
- Recommended Asset Source: specify which existing Spiral Up assets to use (e.g. "SPIRAL Synergize illustration", "Spiral Up book cover", "zone spiraling-up icon"). If no approved asset fits, describe a neutral placeholder concept.
- Format: 16:9 (blog hero standard)
- Visual Rationale: 1-2 sentences explaining why this visual fits the article

### Backup Visual Concept
- Visual Type: a different type from primary
- Visual Concept: 1-2 sentences describing an alternative direction
- Recommended Asset Source: different asset or approach
- Why: brief reason this backup works

VISUAL QUALITY RULES:
- Must feel like a thoughtful editorial brand asset, NOT random AI art
- Avoid glossy, surreal, hyper-polished, or fake stock-photo aesthetics
- Avoid cliché AI imagery: floating holograms, robotic hands, glowing brains, futuristic dashboards
- Prefer human, editorial, illustrated, or clean branded look
- Use official Spiral Up illustrations, book assets, event visuals, or brand shapes first
- Keep the result credible, modern, warm, and professional

## REPURPOSED CONTENT

### LinkedIn Post Version
Create a standalone LinkedIn post (max 1300 chars) derived from the blog's key insight.

### Newsletter Version
Create a newsletter intro (200-300 words) that drives readers to the full blog post.

### Social Media Snippet
Create 2-3 short social media snippets (tweets/threads) from the blog.

Voice: Human, direct, pragmatic. No corporate jargon. No empty inspiration.`;

    let content = '';
    await streamContent({
      messages: [{ role: 'user', content: prompt }],
      onDelta: (delta) => {
        content += delta;
        setGeneratedPost(content);
      },
      onDone: () => setIsGenerating(false),
      onError: (error) => {
        toast.error(error);
        setIsGenerating(false);
      },
    });
  }, [topic, pillar]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    review: 'bg-warning/10 text-warning',
    approved: 'bg-info/10 text-info',
    published: 'bg-success/10 text-success',
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Blog Workflow</h1>
            <p className="text-muted-foreground mt-1">
              Create, review, and publish posts for SpiralingUp.works/blog
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span>Target: spiralingup.works/blog</span>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['draft', 'review', 'approved', 'published'].map(status => {
              const posts = sampleBlogPosts.filter(p => p.status === status);
              return (
                <Card key={status} className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-sm flex items-center justify-between">
                      <span className="capitalize">{status}</span>
                      <Badge variant="secondary" className="text-[10px]">{posts.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {posts.map((post, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedPost(post); setActiveTab('editor'); }}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                      >
                        <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.excerpt}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-[10px] border-0 ${statusColors[post.status]}`}>
                            {post.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {brandProfile.contentPillars.find(p => p.id === post.pillar)?.emoji}{' '}
                            {brandProfile.contentPillars.find(p => p.id === post.pillar)?.name}
                          </span>
                        </div>
                      </button>
                    ))}
                    {posts.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No posts</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Generate Blog Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Blog Topic *</Label>
                  <Input
                    placeholder="e.g. Why leaders must go first in any transformation"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content Pillar</Label>
                  <Select value={pillar} onValueChange={setPillar}>
                    <SelectTrigger><SelectValue placeholder="Select pillar..." /></SelectTrigger>
                    <SelectContent>
                      {brandProfile.contentPillars.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.emoji} {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateBlog}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating full blog post...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Blog Post + Repurposed Assets</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base">What Gets Generated</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: FileText, label: 'Full blog post', desc: 'SEO-optimized, CMS-ready markdown' },
                  { icon: Hash, label: 'SEO metadata', desc: 'Title, meta description, keywords' },
                  { icon: Link2, label: 'Internal linking', desc: 'Suggested links to related blog content' },
                  { icon: '💼', label: 'LinkedIn post', desc: 'Standalone post derived from the blog' },
                  { icon: '📧', label: 'Newsletter version', desc: 'Intro that drives readers to the full post' },
                  { icon: '📱', label: 'Social snippets', desc: '2-3 short-form snippets for social media' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                    <span className="text-sm mt-0.5">
                      {typeof item.icon === 'string' ? item.icon : <item.icon className="w-4 h-4 text-primary" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          {(generatedPost || selectedPost) ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base">
                    {selectedPost ? selectedPost.title : 'Generated Blog Post'}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button size="sm" className="gradient-brand text-primary-foreground hover:opacity-90">
                      <Eye className="w-3 h-3 mr-1" /> Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedPost && !generatedPost ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Meta Description</p>
                        <p>{selectedPost.metaDescription}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">SEO Keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedPost.seoKeywords.map(k => (
                            <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2">LinkedIn Version</p>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedPost.linkedinVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Newsletter Version</p>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedPost.newsletterVersion}</p>
                    </div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-body leading-relaxed">
                    {generatedPost}
                    {isGenerating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
                  </pre>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-20 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-display font-semibold">No post selected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a post from the pipeline or generate a new one.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
