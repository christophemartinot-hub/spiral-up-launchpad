import { useState, useCallback, useRef, useEffect } from 'react';
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
import { brandProfile } from '@/data/brand';
import { streamContent } from '@/lib/ai';
import { supabase } from '@/integrations/supabase/client';
import {
  useInstagramPosts, useCreateInstagramPost, useUpdateInstagramPost, useDeleteInstagramPost,
} from '@/hooks/use-instagram-posts';
import {
  Sparkles, Eye, Loader2, Save, Send, Trash2, Pencil,
  Lightbulb, ImagePlus, Upload, ArrowRight, Instagram, CheckCircle, Plus, X, Film, Image, Layers,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning/10 text-warning',
  approved: 'bg-info/10 text-info',
  published: 'bg-success/10 text-success',
};
const STATUS_ORDER = ['draft', 'review', 'approved', 'published'];
const MEDIA_TYPE_ICONS: Record<string, typeof Image> = { post: Image, carousel: Layers, reel: Film };

export default function InstagramPublishing() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { data: posts = [], isLoading } = useInstagramPosts();
  const createPost = useCreateInstagramPost();
  const updatePost = useUpdateInstagramPost();
  const deletePost = useDeleteInstagramPost();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Generation state
  const [topic, setTopic] = useState('');
  const [pillar, setPillar] = useState('');
  const [mediaType, setMediaType] = useState('post');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Editor state
  const [editCaption, setEditCaption] = useState('');
  const [editMediaType, setEditMediaType] = useState('post');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editCta, setEditCta] = useState('');
  const [editPillar, setEditPillar] = useState('');
  const [editReelScript, setEditReelScript] = useState('');
  const [editCarouselSlides, setEditCarouselSlides] = useState<string[]>([]);
  const [carouselSlideImages, setCarouselSlideImages] = useState<(string | null)[]>([]);
  const [generatingSlideImages, setGeneratingSlideImages] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  // Drag state
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  const selectedPost = posts.find(p => p.id === selectedId) ?? null;

  // AI topic suggestions
  useEffect(() => {
    if (!pillar) { setSuggestedTopics([]); return; }
    const sp = brandProfile.contentPillars.find(p => p.id === pillar);
    if (!sp) return;
    let cancelled = false;
    setIsLoadingTopics(true);
    setSuggestedTopics([]);
    supabase.functions.invoke('generate-content', {
      body: {
        messages: [{ role: 'user', content: `Suggest exactly 5 compelling Instagram ${mediaType} topics for the "${sp.name}" content pillar (${sp.description}). Return ONLY a JSON array of 5 short topic strings.` }],
        stream: false,
      },
    }).then(({ data }) => {
      if (cancelled) return;
      setIsLoadingTopics(false);
      const text = typeof data === 'string' ? data : data?.content || '';
      try {
        const m = text.match(/\[[\s\S]*\]/);
        if (m) { const t = JSON.parse(m[0]); if (Array.isArray(t)) setSuggestedTopics(t.slice(0, 5)); }
      } catch {}
    });
    return () => { cancelled = true; };
  }, [pillar, mediaType]);

  const loadPostToEditor = useCallback((post: any) => {
    setEditCaption(post.caption || '');
    setEditMediaType(post.media_type || 'post');
    setEditCoverImage(post.cover_image_url || '');
    setEditHashtags(Array.isArray(post.hashtags) ? (post.hashtags as string[]).join(', ') : '');
    setEditCta(post.cta || '');
    setEditPillar(post.content_pillar || '');
    setEditReelScript(post.reel_script || '');
    setEditCarouselSlides(Array.isArray(post.carousel_slides) ? post.carousel_slides as string[] : []);
    // Load slide images from media_urls if available
    const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls as (string | null)[] : [];
    setCarouselSlideImages(mediaUrls);
    setPreviewSlideIndex(0);
    setSelectedId(post.id);
    setActiveTab('editor');
  }, []);

  // ─── Generate ───
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    setIsGenerating(true);
    const selectedPillar = brandProfile.contentPillars.find(p => p.id === pillar);

    const typeInstructions: Record<string, string> = {
      post: `Create an Instagram post caption (max 2200 chars). Include a hook first line, compelling body, CTA, and hashtags.`,
      carousel: `Create an Instagram carousel post with 5-8 slides. Include:
## CAPTION
[The full caption with hook and CTA]
## SLIDES
[Slide 1 headline and key point]
---
[Slide 2 headline and key point]
---
[Continue for each slide]
## HASHTAGS
[comma-separated hashtags]`,
      reel: `Create an Instagram Reel script. Include:
## CAPTION
[The reel caption]
## REEL SCRIPT
[Scene-by-scene script with timing and text overlays, 30-60 seconds]
## HASHTAGS
[comma-separated hashtags]`,
    };

    const prompt = `Create Instagram ${mediaType} content about "${topic}" for the "${selectedPillar?.name || 'General'}" content pillar.

${typeInstructions[mediaType]}

## CTA
[The call to action]

Format all hashtags at the end.
Stay unmistakably Spiral Up in voice. Write as Christophe Martinot.`;

    let content = '';
    await streamContent({
      messages: [{ role: 'user', content: prompt }],
      onDelta: (d) => { content += d; },
      onDone: async () => {
        const captionMatch = content.match(/## CAPTION\s*\n([\s\S]*?)(?=\n## (?:SLIDES|REEL SCRIPT|CTA|HASHTAGS))/);
        const slidesMatch = content.match(/## SLIDES\s*\n([\s\S]*?)(?=\n## (?:CTA|HASHTAGS))/);
        const reelMatch = content.match(/## REEL SCRIPT\s*\n([\s\S]*?)(?=\n## (?:CTA|HASHTAGS))/);
        const ctaMatch = content.match(/## CTA\s*\n([\s\S]*?)(?=\n## HASHTAGS)/);
        const hashMatch = content.match(/## HASHTAGS\s*\n([\s\S]*?)$/);

        const caption = captionMatch?.[1]?.trim() || content;
        const cta = ctaMatch?.[1]?.trim() || '';
        const hashtags = hashMatch?.[1]?.trim().split(',').map(h => h.trim().replace(/^#/, '')) || [];
        const carouselSlides = slidesMatch ? slidesMatch[1].split('---').map(s => s.trim()).filter(Boolean) : [];
        const reelScript = reelMatch?.[1]?.trim() || '';

        try {
          const newPost = await createPost.mutateAsync({
            caption,
            media_type: mediaType,
            cta,
            hashtags,
            content_pillar: selectedPillar?.name || '',
            carousel_slides: carouselSlides,
            reel_script: reelScript,
            status: 'draft',
          });
          if (newPost) loadPostToEditor(newPost);
          toast.success(`Instagram ${mediaType} generated!`);
        } catch (e: any) {
          toast.error('Failed to save: ' + e.message);
        }
        setIsGenerating(false);
      },
      onError: (e) => { toast.error(e); setIsGenerating(false); },
    });
  }, [topic, pillar, mediaType, createPost, loadPostToEditor]);

  // ─── Save ───
  const handleSave = async () => {
    if (!selectedId) return;
    const hashtags = editHashtags.split(',').map(h => h.trim()).filter(Boolean);
    await updatePost.mutateAsync({
      id: selectedId,
      caption: editCaption,
      media_type: editMediaType,
      cover_image_url: editCoverImage,
      hashtags,
      cta: editCta,
      content_pillar: editPillar,
      reel_script: editReelScript,
      carousel_slides: editCarouselSlides,
    });
    toast.success('Saved!');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updatePost.mutateAsync({ id, status: newStatus });
    toast.success(`Moved to ${newStatus}`);
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    const post = posts.find(p => p.id === selectedId);
    if (!post) return;
    if (!post.cover_image_url && post.media_type !== 'reel') {
      toast.error('Instagram requires an image. Please add one before publishing.');
      return;
    }
    try {
      // Publish via Buffer (Instagram)
      const { error } = await supabase.functions.invoke('publish-social', {
        body: {
          item_id: selectedId,
          channel: 'instagram',
          content: post.caption,
          image_url: post.cover_image_url,
          source: 'instagram_posts',
        },
      });
      if (error) throw error;
      await updatePost.mutateAsync({ id: selectedId, status: 'published', published_at: new Date().toISOString() });
      toast.success('Published to Instagram!');
    } catch (e: any) {
      toast.error('Publish failed: ' + e.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const path = `instagram/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand-assets').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploadingImage(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path);
    setEditCoverImage(publicUrl);
    if (selectedId) await updatePost.mutateAsync({ id: selectedId, cover_image_url: publicUrl });
    toast.success('Image uploaded!');
    setUploadingImage(false);
  };

  // Drag handlers
  const handleDragStart = (postId: string) => setDraggedPostId(postId);
  const handleDragOver = (e: React.DragEvent, col: string) => { e.preventDefault(); setDragOverColumn(col); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = async (col: string) => {
    if (draggedPostId) await handleStatusChange(draggedPostId, col);
    setDraggedPostId(null);
    setDragOverColumn(null);
  };

  const columns = STATUS_ORDER.map(status => ({
    status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    posts: posts.filter(p => p.status === status),
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold flex items-center gap-2">
              <Instagram className="w-6 h-6 text-[#E4405F]" /> Instagram Publishing
            </h1>
            <p className="text-muted-foreground mt-1">Generate, review, approve & publish Instagram content.</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="editor" disabled={!selectedId}>Editor</TabsTrigger>
          <TabsTrigger value="preview" disabled={!selectedId}>Preview</TabsTrigger>
        </TabsList>

        {/* ─── Pipeline ─── */}
        <TabsContent value="pipeline">
          <div className="grid grid-cols-4 gap-4">
            {columns.map(col => (
              <div
                key={col.status}
                onDragOver={e => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(col.status)}
                className={cn(
                  'rounded-xl border-2 border-dashed p-3 min-h-[300px] transition-colors',
                  dragOverColumn === col.status ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge className={cn('text-xs', STATUS_STYLES[col.status])}>{col.label}</Badge>
                  <span className="text-xs text-muted-foreground">{col.posts.length}</span>
                </div>
                <div className="space-y-2">
                  {col.posts.map(post => {
                    const MediaIcon = MEDIA_TYPE_ICONS[post.media_type] || Image;
                    return (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={() => handleDragStart(post.id)}
                        onClick={() => loadPostToEditor(post)}
                        className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 cursor-pointer transition-all"
                      >
                        {post.cover_image_url && (
                          <img src={post.cover_image_url} alt="" className="w-full h-20 object-cover rounded mb-2" />
                        )}
                        <div className="flex items-center gap-1.5 mb-1">
                          <MediaIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground capitalize">{post.media_type}</span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">{post.caption?.slice(0, 80) || 'Untitled'}</p>
                        {post.content_pillar && <Badge variant="outline" className="text-[10px] mt-1">{post.content_pillar}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── Generate ─── */}
        <TabsContent value="generate">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Generate Instagram Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'post', label: 'Post', icon: Image },
                      { value: 'carousel', label: 'Carousel', icon: Layers },
                      { value: 'reel', label: 'Reel', icon: Film },
                    ].map(t => (
                      <button
                        key={t.value}
                        onClick={() => setMediaType(t.value)}
                        className={cn(
                          'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all text-sm',
                          mediaType === t.value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30'
                        )}
                      >
                        <t.icon className="w-5 h-5" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Topic *</Label>
                  <Input placeholder="e.g. The real cost of ignoring team dynamics" value={topic} onChange={e => setTopic(e.target.value)} />
                  {isLoadingTopics && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Generating topic ideas…
                    </div>
                  )}
                  {suggestedTopics.length > 0 && !isLoadingTopics && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-primary" /> AI-suggested topics
                      </p>
                      {suggestedTopics.map(t => (
                        <button key={t} onClick={() => setTopic(t)} className="w-full text-left text-xs p-2 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all">
                          <ArrowRight className="w-3 h-3 inline mr-1.5 text-primary" />{t}
                        </button>
                      ))}
                    </div>
                  )}
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
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate {mediaType === 'reel' ? 'Reel' : mediaType === 'carousel' ? 'Carousel' : 'Post'}</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display text-base">Publishing Workflow</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { step: '1', label: 'Generate', desc: `AI creates ${mediaType} with caption, hashtags & visuals` },
                    { step: '2', label: 'Edit', desc: 'Refine caption, images, carousel slides or reel script' },
                    { step: '3', label: 'Preview', desc: 'See how it will appear on Instagram' },
                    { step: '4', label: 'Approve', desc: 'Move from draft → review → approved' },
                    { step: '5', label: 'Publish', desc: 'Push to Instagram via Buffer' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{item.step}</div>
                      <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Editor ─── */}
        <TabsContent value="editor">
          {selectedPost ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> Edit {editMediaType}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs">{editMediaType}</Badge>
                        <Badge className={cn('text-xs', STATUS_STYLES[selectedPost.status])}>{selectedPost.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Caption</Label>
                      <Textarea value={editCaption} onChange={e => setEditCaption(e.target.value)} rows={8} />
                      <p className={cn('text-xs', editCaption.length > 2200 ? 'text-destructive' : 'text-muted-foreground')}>
                        {editCaption.length} / 2200 characters
                      </p>
                    </div>

                    {editMediaType === 'reel' && (
                      <div className="space-y-2">
                        <Label>Reel Script</Label>
                        <Textarea value={editReelScript} onChange={e => setEditReelScript(e.target.value)} rows={8} placeholder="Scene 1: [0-5s] Hook text overlay..." />
                      </div>
                    )}

                    {editMediaType === 'carousel' && (
                      <div className="space-y-2">
                        <Label>Carousel Slides</Label>
                        {editCarouselSlides.map((slide, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-xs text-muted-foreground mt-2 w-6 flex-shrink-0">{i + 1}.</span>
                            <Textarea value={slide} onChange={e => {
                              const ns = [...editCarouselSlides];
                              ns[i] = e.target.value;
                              setEditCarouselSlides(ns);
                            }} rows={2} className="flex-1" />
                            <Button variant="ghost" size="sm" onClick={() => setEditCarouselSlides(editCarouselSlides.filter((_, idx) => idx !== i))}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setEditCarouselSlides([...editCarouselSlides, ''])}>
                          <Plus className="w-3 h-3 mr-1" /> Add Slide
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>CTA</Label>
                      <Input value={editCta} onChange={e => setEditCta(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hashtags</Label>
                      <Input value={editHashtags} onChange={e => setEditHashtags(e.target.value)} placeholder="#leadership, #agile" />
                    </div>
                    <div className="space-y-2">
                      <Label>Content Pillar</Label>
                      <Select value={editPillar} onValueChange={setEditPillar}>
                        <SelectTrigger><SelectValue placeholder="Select pillar..." /></SelectTrigger>
                        <SelectContent>
                          {brandProfile.contentPillars.map(p => (
                            <SelectItem key={p.id} value={p.name}>{p.emoji} {p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="gradient-brand text-primary-foreground"><Save className="w-4 h-4 mr-1" /> Save</Button>
                      <Button variant="outline" onClick={() => setActiveTab('preview')}><Eye className="w-4 h-4 mr-1" /> Preview</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="shadow-card">
                  <CardHeader><CardTitle className="font-display text-base">Cover Image</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {editCoverImage ? (
                      <img src={editCoverImage} alt="" className="w-full rounded-lg aspect-[4/5] object-cover" />
                    ) : (
                      <div className="w-full aspect-[4/5] rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <ImagePlus className="w-8 h-8" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Input value={editCoverImage} onChange={e => setEditCoverImage(e.target.value)} placeholder="Image URL..." />
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploadingImage}>
                        {uploadingImage ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />} Upload Image
                      </Button>
                      <Button
                        variant="outline" size="sm" className="w-full"
                        disabled={generatingImage || !editCaption}
                        onClick={async () => {
                          setGeneratingImage(true);
                          try {
                            const concept = editCaption?.slice(0, 200) || 'Leadership and transformation';
                            const { data, error } = await supabase.functions.invoke('generate-social-image', {
                              body: {
                                visual_concept: concept,
                                visual_type: 'editorial_photo',
                                channel: 'instagram',
                                title: editCaption?.slice(0, 80),
                                content: editCaption,
                              },
                            });
                            if (error) throw error;
                            if (data?.image_url) {
                              setEditCoverImage(data.image_url);
                              if (selectedId) await updatePost.mutateAsync({ id: selectedId, cover_image_url: data.image_url });
                              toast.success('AI image generated!');
                            } else {
                              toast.error(data?.error || 'Image generation failed');
                            }
                          } catch (e: any) {
                            toast.error('Image generation failed: ' + e.message);
                          }
                          setGeneratingImage(false);
                        }}
                      >
                        {generatingImage ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} AI Generate Image
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader><CardTitle className="font-display text-base">Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {selectedPost.status === 'draft' && (
                      <Button variant="outline" className="w-full" onClick={() => handleStatusChange(selectedId!, 'review')}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Move to Review
                      </Button>
                    )}
                    {selectedPost.status === 'review' && (
                      <Button variant="outline" className="w-full" onClick={() => handleStatusChange(selectedId!, 'approved')}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    )}
                    {selectedPost.status === 'approved' && (
                      <Button className="w-full gradient-brand text-primary-foreground" onClick={handlePublish}>
                        <Send className="w-4 h-4 mr-1" /> Publish to Instagram
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" className="w-full" onClick={async () => {
                      await deletePost.mutateAsync(selectedId!);
                      setSelectedId(null);
                      setActiveTab('pipeline');
                      toast.success('Deleted');
                    }}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">Select a post from the Pipeline to edit.</div>
          )}
        </TabsContent>

        {/* ─── Preview ─── */}
        <TabsContent value="preview">
          {selectedPost ? (
            <div className="max-w-md mx-auto">
              <Card className="shadow-card overflow-hidden">
                {/* Instagram header */}
                <div className="flex items-center gap-3 p-3 border-b border-border">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743] flex items-center justify-center text-white text-xs font-bold">CM</div>
                  <div>
                    <p className="font-semibold text-xs">christophe.martinot</p>
                    <p className="text-[10px] text-muted-foreground">Spiral Up</p>
                  </div>
                </div>
                {/* Image */}
                {selectedPost.cover_image_url ? (
                  <img src={selectedPost.cover_image_url} alt="" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-muted/50 flex items-center justify-center">
                    <ImagePlus className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                {/* Caption */}
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap"><span className="font-semibold mr-1">christophe.martinot</span>{selectedPost.caption}</p>
                  {Array.isArray(selectedPost.hashtags) && selectedPost.hashtags.length > 0 && (
                    <p className="text-sm text-primary mt-2">{(selectedPost.hashtags as string[]).map(h => `#${h}`).join(' ')}</p>
                  )}
                  {selectedPost.media_type === 'carousel' && Array.isArray(selectedPost.carousel_slides) && (selectedPost.carousel_slides as string[]).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium mb-2">Carousel Slides ({(selectedPost.carousel_slides as string[]).length})</p>
                      {(selectedPost.carousel_slides as string[]).map((slide, i) => (
                        <div key={i} className="text-xs p-2 mb-1 bg-muted/30 rounded">{i + 1}. {slide}</div>
                      ))}
                    </div>
                  )}
                  {selectedPost.media_type === 'reel' && selectedPost.reel_script && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium mb-2">Reel Script</p>
                      <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-2 rounded">{selectedPost.reel_script}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">Select a post to preview.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
