import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { brandProfile } from '@/data/brand';
import { streamContent } from '@/lib/ai';
import { supabase } from '@/integrations/supabase/client';
import {
  useBlogPosts, useBlogPost, useCreateBlogPost, useUpdateBlogPost,
  useDeleteBlogPost, usePublishBlogPost, useUnpublishBlogPost, generateSlug,
} from '@/hooks/use-blog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO, setHours, setMinutes, addDays, nextTuesday, nextWednesday, nextThursday, isBefore } from 'date-fns';
import {
  Sparkles, FileText, Globe, Eye, Copy, Check, Loader2,
  Save, CheckCircle, Send, Trash2, ExternalLink, Pencil, ArrowLeft,
  CalendarIcon, Clock, Lightbulb, ImagePlus, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning/10 text-warning',
  approved: 'bg-info/10 text-info',
  published: 'bg-success/10 text-success',
};

export default function BlogWorkflow() {
  const { data: posts = [], isLoading } = useBlogPosts();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const publishPost = usePublishBlogPost();
  const unpublishPost = useUnpublishBlogPost();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Generation state
  const [topic, setTopic] = useState('');
  const [pillar, setPillar] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editHeroImage, setEditHeroImage] = useState('');
  const [editAuthor, setEditAuthor] = useState('Christophe Martinot');
  const [editTags, setEditTags] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editNewsletter, setEditNewsletter] = useState('');
  const [editVisualConcept, setEditVisualConcept] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState<Date | undefined>(undefined);

  const selectedPost = posts.find(p => p.id === selectedId) ?? null;

  const loadPostToEditor = useCallback((post: any) => {
    setEditTitle(post.title || '');
    setEditSlug(post.slug || '');
    setEditExcerpt(post.excerpt || '');
    setEditMetaDesc(post.meta_description || '');
    setEditContent(post.content || '');
    setEditHeroImage(post.hero_image_url || '');
    setEditAuthor(post.author || 'Christophe Martinot');
    setEditTags(Array.isArray(post.tags) ? (post.tags as string[]).join(', ') : '');
    setEditLinkedin(post.linkedin_version || '');
    setEditNewsletter(post.newsletter_version || '');
    setEditVisualConcept(post.visual_concept || '');
    setEditScheduledAt(post.scheduled_publish_at ? parseISO(post.scheduled_publish_at) : undefined);
    setSelectedId(post.id);
    setActiveTab('editor');
  }, []);

  // ─── Generate ───
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error('Enter a blog topic'); return; }
    setIsGenerating(true);

    const selectedPillar = brandProfile.contentPillars.find(p => p.id === pillar);

    const prompt = `Create a complete blog post for publication at SpiralingUp.works/blog.

Topic: "${topic}"
Content Pillar: ${selectedPillar?.name || 'General'}

Generate ALL of the following clearly labeled:

## SEO METADATA
- Title (under 60 characters)
- Meta Description (under 160 characters)
- Excerpt (1-2 sentences)
- Primary Keywords (comma-separated)

## BLOG POST
Full article in markdown, 1200-1800 words, with:
- A compelling opening hook
- 3-5 H2 sections
- Use of the SPIRAL framework where relevant
- Real-world examples
- Strong conclusion with CTA

## HERO VISUAL DIRECTION
- Visual Type, Visual Concept, Cover Title, Layout Guidance, Asset Source, Format: 16:9, Visual Rationale

## LINKEDIN POST VERSION
Standalone LinkedIn post (max 1300 chars)

## NEWSLETTER VERSION
Newsletter intro (200-300 words)

Voice: Human, direct, pragmatic. No corporate jargon.`;

    let content = '';
    await streamContent({
      messages: [{ role: 'user', content: prompt }],
      onDelta: (delta) => { content += delta; setEditContent(content); },
      onDone: async () => {
        setIsGenerating(false);
        // Parse out title from generated content
        const titleMatch = content.match(/Title[:\s]*(.+)/i);
        const metaMatch = content.match(/Meta Description[:\s]*(.+)/i);
        const excerptMatch = content.match(/Excerpt[:\s]*(.+)/i);
        const keywordsMatch = content.match(/Primary Keywords[:\s]*(.+)/i);
        const parsedTitle = titleMatch?.[1]?.trim() || topic;
        const parsedSlug = generateSlug(parsedTitle);

        setEditTitle(parsedTitle);
        setEditSlug(parsedSlug);
        setEditMetaDesc(metaMatch?.[1]?.trim() || '');
        setEditExcerpt(excerptMatch?.[1]?.trim() || '');
        setEditTags(keywordsMatch?.[1]?.trim() || '');

        // Save as draft
        try {
          const result = await createPost.mutateAsync({
            title: parsedTitle,
            slug: parsedSlug,
            content,
            excerpt: excerptMatch?.[1]?.trim() || '',
            meta_description: metaMatch?.[1]?.trim() || '',
            seo_keywords: keywordsMatch?.[1]?.split(',').map((k: string) => k.trim()) || [],
            content_pillar: pillar || '',
            author: 'Christophe Martinot',
            status: 'draft',
          } as any);
          if (result) setSelectedId(result.id);
          toast.success('Blog draft saved');
        } catch (e: any) {
          toast.error('Failed to save draft: ' + e.message);
        }
      },
      onError: (error) => { toast.error(error); setIsGenerating(false); },
    });
    setActiveTab('editor');
  }, [topic, pillar, createPost]);

  // ─── Save ───
  const handleSave = useCallback(async () => {
    if (!selectedId) return;
    try {
      await updatePost.mutateAsync({
        id: selectedId,
        title: editTitle,
        slug: editSlug,
        content: editContent,
        excerpt: editExcerpt,
        meta_description: editMetaDesc,
        hero_image_url: editHeroImage,
        author: editAuthor,
        tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
        linkedin_version: editLinkedin,
        newsletter_version: editNewsletter,
        visual_concept: editVisualConcept,
        scheduled_publish_at: editScheduledAt ? editScheduledAt.toISOString() : null,
      });
      toast.success('Saved');
    } catch (e: any) {
      toast.error(e.message);
    }
  }, [selectedId, editTitle, editSlug, editContent, editExcerpt, editMetaDesc, editHeroImage, editAuthor, editTags, editLinkedin, editNewsletter, editVisualConcept, updatePost]);

  const handleGenerateHeroImage = useCallback(async () => {
    if (!editTitle.trim()) { toast.error('Add a title first'); return; }
    setIsGeneratingImage(true);
    try {
      const visualConcept = editVisualConcept?.trim()
        || `Professional editorial hero image for a blog post titled "${editTitle}". Clean, modern, editorial quality, suitable as a blog header image.`;

      const { data, error } = await supabase.functions.invoke('generate-social-image', {
        body: {
          visual_concept: visualConcept,
          visual_type: 'editorial',
          channel: 'blog',
          title: editTitle,
          content: editExcerpt || editContent?.slice(0, 300),
        },
      });
      if (error || !data?.image_url) throw new Error(error?.message || 'No image returned');
      setEditHeroImage(data.image_url);
      // Auto-save the image to the post
      if (selectedId) {
        await updatePost.mutateAsync({ id: selectedId, hero_image_url: data.image_url });
      }
      toast.success('Hero image generated!');
    } catch (e: any) {
      toast.error('Image generation failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsGeneratingImage(false);
    }
  }, [editTitle, editVisualConcept, editExcerpt, editContent, selectedId, updatePost]);

  // ─── Status transitions ───
  const setStatus = useCallback(async (status: string) => {
    if (!selectedId) return;
    try {
      await updatePost.mutateAsync({ id: selectedId, status });
      toast.success(`Status → ${status}`);
    } catch (e: any) { toast.error(e.message); }
  }, [selectedId, updatePost]);

  const handlePublish = useCallback(async () => {
    if (!selectedId) return;
    publishPost.mutate(selectedId);
  }, [selectedId, publishPost]);

  const handleUnpublish = useCallback(async () => {
    if (!selectedId) return;
    unpublishPost.mutate(selectedId);
  }, [selectedId, unpublishPost]);

  const handleDelete = useCallback(async () => {
    if (!selectedId) return;
    if (!confirm('Delete this blog post?')) return;
    deletePost.mutate(selectedId);
    setSelectedId(null);
    setActiveTab('pipeline');
  }, [selectedId, deletePost]);

  // Pipeline groups
  const grouped = useMemo(() => {
    const groups: Record<string, typeof posts> = { draft: [], review: [], approved: [], published: [] };
    posts.forEach(p => {
      const s = p.status || 'draft';
      if (groups[s]) groups[s].push(p);
      else groups.draft.push(p);
    });
    return groups;
  }, [posts]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">Blog Publishing</h1>
            <p className="text-muted-foreground mt-1">
              Generate, review, approve &amp; publish to spiralingup.works
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5" />
            <span>Target: spiralingup.works/blog</span>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="create">Generate</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* ─── PIPELINE ─── */}
        <TabsContent value="pipeline" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(['draft', 'review', 'approved', 'published'] as const).map(status => (
                <Card key={status} className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-sm flex items-center justify-between">
                      <span className="capitalize">{status}</span>
                      <Badge variant="secondary" className="text-[10px]">{grouped[status]?.length || 0}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {(grouped[status] || []).map(post => (
                      <div
                        key={post.id}
                        className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                      >
                        <button onClick={() => loadPostToEditor(post)} className="w-full text-left">
                          <p className="text-sm font-medium line-clamp-2">{post.title || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.excerpt}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={`text-[10px] border-0 ${STATUS_STYLES[post.status] || STATUS_STYLES.draft}`}>
                              {post.status}
                            </Badge>
                            {(post as any).scheduled_publish_at && post.status !== 'published' && (
                              <span className="text-[10px] text-primary flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {format(parseISO((post as any).scheduled_publish_at), "MMM d")}
                              </span>
                            )}
                            {post.status === 'published' && post.published_at && (
                              <span className="text-[10px] text-muted-foreground">
                                {format(parseISO(post.published_at), "MMM d, yyyy")}
                              </span>
                            )}
                          </div>
                        </button>
                        {post.status === 'published' && post.slug && (
                          <a
                            href={`https://spiralingup.works/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 mt-2 text-[11px] text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> spiralingup.works/blog/{post.slug}
                          </a>
                        )}
                      </div>
                    ))}
                    {(!grouped[status] || grouped[status].length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-6">No posts</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── GENERATE ─── */}
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
                  <Input placeholder="e.g. Why leaders must go first in any transformation" value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Content Pillar</Label>
                  <Select value={pillar} onValueChange={setPillar}>
                    <SelectTrigger><SelectValue placeholder="Select pillar..." /></SelectTrigger>
                    <SelectContent>
                      {brandProfile.contentPillars.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="w-full gradient-brand text-primary-foreground shadow-glow hover:opacity-90">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Blog Post</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base">Publishing Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { step: '1', label: 'Generate', desc: 'AI creates full blog post with SEO, visuals & repurposed versions' },
                    { step: '2', label: 'Edit', desc: 'Refine title, slug, content, tags, and hero image' },
                    { step: '3', label: 'Preview', desc: 'See exactly how it will appear on spiralingup.works' },
                    { step: '4', label: 'Approve', desc: 'Move from draft → review → approved' },
                    { step: '5', label: 'Publish', desc: 'Push approved post to spiralingup.works/blog' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{item.step}</span>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── EDITOR ─── */}
        <TabsContent value="editor" className="space-y-4">
          {selectedId ? (
            <div className="space-y-4">
              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedId(null); setActiveTab('pipeline'); }}>
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={updatePost.isPending}>
                  <Save className="w-3 h-3 mr-1" /> Save
                </Button>

                {selectedPost?.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={() => setStatus('review')}>
                    <Eye className="w-3 h-3 mr-1" /> Submit for Review
                  </Button>
                )}
                {selectedPost?.status === 'review' && (
                  <Button variant="outline" size="sm" onClick={() => setStatus('approved')} className="border-info/30 text-info hover:bg-info/10">
                    <CheckCircle className="w-3 h-3 mr-1" /> Approve
                  </Button>
                )}
                {selectedPost?.status === 'approved' && !editScheduledAt && (
                  <Button size="sm" onClick={handlePublish} disabled={publishPost.isPending} className="gradient-brand text-primary-foreground hover:opacity-90">
                    {publishPost.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                    Publish Now
                  </Button>
                )}
                {selectedPost?.status === 'approved' && editScheduledAt && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    <Clock className="w-3 h-3 mr-1" /> Scheduled: {format(editScheduledAt, "MMM d 'at' HH:mm")}
                  </Badge>
                )}
                {selectedPost?.status === 'published' && (
                  <>
                    <Button variant="outline" size="sm" onClick={handleUnpublish} disabled={unpublishPost.isPending}>
                      Unpublish
                    </Button>
                    <a href={`https://spiralingup.works/blog/${selectedPost.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 mr-1" /> View Live
                      </Button>
                    </a>
                  </>
                )}

                <Button variant="outline" size="sm" onClick={() => { setActiveTab('preview'); }}>
                  <Eye className="w-3 h-3 mr-1" /> Preview
                </Button>

                <div className="ml-auto">
                  <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="shadow-card">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={editTitle} onChange={e => { setEditTitle(e.target.value); if (!selectedPost?.external_id) setEditSlug(generateSlug(e.target.value)); }} />
                      </div>
                      <div className="space-y-2">
                        <Label>URL Slug</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground shrink-0">/blog/</span>
                          <Input value={editSlug} onChange={e => setEditSlug(e.target.value)} className="font-mono text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Content (Markdown)</Label>
                        <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={20} className="font-mono text-sm" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={`${STATUS_STYLES[selectedPost?.status || 'draft']} border-0`}>
                        {selectedPost?.status || 'draft'}
                      </Badge>
                      {selectedPost?.published_at && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Published: {new Date(selectedPost.published_at).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* ─── Schedule Publishing ─── */}
                  <ScheduleCard
                    scheduledAt={editScheduledAt}
                    onScheduleChange={setEditScheduledAt}
                    status={selectedPost?.status || 'draft'}
                  />

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">SEO & Meta</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Excerpt</Label>
                        <Textarea value={editExcerpt} onChange={e => setEditExcerpt(e.target.value)} rows={2} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Meta Description</Label>
                        <Textarea value={editMetaDesc} onChange={e => setEditMetaDesc(e.target.value)} rows={2} />
                        <p className="text-[10px] text-muted-foreground">{editMetaDesc.length}/160</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tags (comma-separated)</Label>
                        <Input value={editTags} onChange={e => setEditTags(e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Hero Image</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Input placeholder="Paste direct image URL (e.g. https://images.unsplash.com/...)" value={editHeroImage} onChange={e => setEditHeroImage(e.target.value)} />
                      <p className="text-[10px] text-muted-foreground">Tip: On Unsplash, right-click the photo → "Copy image address" to get a direct URL</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={editHeroImage ? 'outline' : 'default'}
                          onClick={handleGenerateHeroImage}
                          disabled={isGeneratingImage}
                          className="flex-1"
                        >
                          {isGeneratingImage
                            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
                            : editHeroImage
                              ? <><RefreshCw className="w-3 h-3 mr-1" /> Regenerate</>
                              : <><ImagePlus className="w-3 h-3 mr-1" /> Generate Image</>
                          }
                        </Button>
                        {editHeroImage && (
                          <Button size="sm" variant="ghost" onClick={() => setEditHeroImage('')} className="text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <a
                        href={`https://unsplash.com/s/photos/${encodeURIComponent(editTitle || 'business leadership')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Browse Unsplash for photos
                      </a>
                      {editHeroImage && (
                        <img src={editHeroImage} alt="Hero" className="w-full rounded-lg border border-border aspect-video object-cover" />
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Author</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} />
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Visual Direction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea value={editVisualConcept} onChange={e => setEditVisualConcept(e.target.value)} rows={3} placeholder="Visual concept notes..." />
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-display">Repurposed Versions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">LinkedIn Post</Label>
                        <Textarea value={editLinkedin} onChange={e => setEditLinkedin(e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Newsletter Intro</Label>
                        <Textarea value={editNewsletter} onChange={e => setEditNewsletter(e.target.value)} rows={3} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-20 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-display font-semibold">No post selected</p>
                <p className="text-xs text-muted-foreground mt-1">Select a post from the pipeline or generate a new one.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── PREVIEW ─── */}
        <TabsContent value="preview">
          {selectedId ? (
            <BlogPreview
              title={editTitle}
              slug={editSlug}
              excerpt={editExcerpt}
              content={editContent}
              heroImage={editHeroImage}
              author={editAuthor}
              tags={editTags.split(',').map(t => t.trim()).filter(Boolean)}
              publishedAt={selectedPost?.published_at || new Date().toISOString()}
            />
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-20 text-center">
                <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-display font-semibold">No post to preview</p>
                <p className="text-xs text-muted-foreground mt-1">Select or generate a blog post first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
// ─── Recommended publish times for B2B / leadership content ───
const RECOMMENDED_TIMES = [
  { label: 'Tue 8:00 AM', day: 2, hour: 8, min: 0, reason: 'Peak LinkedIn engagement for B2B professionals' },
  { label: 'Wed 10:00 AM', day: 3, hour: 10, min: 0, reason: 'Mid-week sweet spot — high open rates' },
  { label: 'Thu 7:30 AM', day: 4, hour: 7, min: 30, reason: 'Early readers before the workday starts' },
  { label: 'Tue 12:00 PM', day: 2, hour: 12, min: 0, reason: 'Lunch-break reading window' },
];

function getNextSlot(dayOfWeek: number, hour: number, min: number): Date {
  const now = new Date();
  const diff = (dayOfWeek - now.getDay() + 7) % 7 || 7;
  const target = setMinutes(setHours(addDays(now, diff), hour), min);
  return isBefore(target, now) ? addDays(target, 7) : target;
}

function ScheduleCard({
  scheduledAt,
  onScheduleChange,
  status,
}: {
  scheduledAt: Date | undefined;
  onScheduleChange: (d: Date | undefined) => void;
  status: string;
}) {
  const [timeStr, setTimeStr] = useState(scheduledAt ? format(scheduledAt, 'HH:mm') : '08:00');

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) { onScheduleChange(undefined); return; }
    const [h, m] = timeStr.split(':').map(Number);
    onScheduleChange(setMinutes(setHours(date, h), m));
  };

  const handleTimeChange = (val: string) => {
    setTimeStr(val);
    if (scheduledAt) {
      const [h, m] = val.split(':').map(Number);
      onScheduleChange(setMinutes(setHours(scheduledAt, h), m));
    }
  };

  const applyRecommendation = (rec: typeof RECOMMENDED_TIMES[0]) => {
    const target = getNextSlot(rec.day, rec.hour, rec.min);
    setTimeStr(format(target, 'HH:mm'));
    onScheduleChange(target);
  };

  if (status === 'published') return null;

  return (
    <Card className="shadow-card border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" /> Schedule Publishing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Publish Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left text-sm font-normal", !scheduledAt && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                {scheduledAt ? format(scheduledAt, 'PPP') : 'Select date…'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduledAt}
                onSelect={handleDateSelect}
                disabled={(date) => isBefore(date, addDays(new Date(), -1))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Publish Time (CET)</Label>
          <Input type="time" value={timeStr} onChange={e => handleTimeChange(e.target.value)} className="text-sm" />
        </div>

        {scheduledAt && (
          <p className="text-[10px] text-muted-foreground">
            Will auto-publish: {format(scheduledAt, "PPP 'at' HH:mm")}
          </p>
        )}

        {scheduledAt && (
          <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => { onScheduleChange(undefined); }}>
            Clear schedule (publish manually)
          </Button>
        )}

        {/* Recommended times */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3 h-3 text-warning" />
            <span className="text-[11px] font-medium text-foreground">Recommended times</span>
          </div>
          <div className="space-y-1.5">
            {RECOMMENDED_TIMES.map((rec) => {
              const target = getNextSlot(rec.day, rec.hour, rec.min);
              return (
                <button
                  key={rec.label}
                  onClick={() => applyRecommendation(rec)}
                  className="w-full text-left p-2 rounded-md border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{format(target, "EEE, MMM d 'at' HH:mm")}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{rec.reason}</p>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function BlogPreview({
  title, slug, excerpt, content, heroImage, author, tags, publishedAt,
}: {
  title: string; slug: string; excerpt: string; content: string;
  heroImage: string; author: string; tags: string[]; publishedAt: string;
}) {
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Simple markdown-to-HTML for preview
  const htmlContent = content
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-muted-foreground leading-relaxed mb-4">')
    .replace(/\n/g, '<br/>');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Globe className="w-3.5 h-3.5" />
        <span>Preview — spiralingup.works/blog/{slug}</span>
      </div>

      <Card className="shadow-card overflow-hidden">
        {/* Simulated website header */}
        <div className="bg-[hsl(var(--accent))] px-6 py-3">
          <p className="text-accent-foreground font-display font-bold text-sm">spiralingup.works</p>
        </div>

        {heroImage && (
          <img src={heroImage} alt={title} className="w-full aspect-video object-cover" />
        )}

        <CardContent className="p-6 md:p-10 space-y-4">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-display font-bold leading-tight">{title || 'Untitled Post'}</h1>

          {/* Author & Date */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground border-b border-border pb-4">
            <span className="font-medium text-foreground">{author}</span>
            <span>·</span>
            <span>{formattedDate}</span>
          </div>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">{excerpt}</p>
          )}

          {/* Body */}
          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: `<p class="text-muted-foreground leading-relaxed mb-4">${htmlContent}</p>` }}
          />

          {/* CTA Section */}
          <div className="mt-8 p-6 rounded-xl bg-muted/50 border border-border text-center space-y-3">
            <p className="font-display font-bold text-lg">📚 Get the Book</p>
            <p className="text-sm text-muted-foreground">Discover the complete SPIRAL UP® framework and transform how your team delivers value.</p>
            <Button className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90">
              Buy Spiral Up →
            </Button>
          </div>

          <div className="mt-4 p-6 rounded-xl bg-accent/10 border border-accent/20 text-center space-y-3">
            <p className="font-display font-bold text-lg">📊 How Agile Is Your Organization?</p>
            <p className="text-sm text-muted-foreground">Take our free Business Agility Diagnostic.</p>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
              Take the Diagnostic →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
