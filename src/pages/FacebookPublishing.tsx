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
  useFacebookPosts, useCreateFacebookPost, useUpdateFacebookPost, useDeleteFacebookPost,
} from '@/hooks/use-facebook-posts';
import {
  Sparkles, Eye, Copy, Check, Loader2, Save, Send, Trash2, Pencil, ArrowLeft,
  Lightbulb, ImagePlus, RefreshCw, Upload, ArrowRight, CheckCircle, Facebook,
} from 'lucide-react';
import { toast } from 'sonner';
import { SchedulePublishingPanel } from '@/components/SchedulePublishingPanel';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning/10 text-warning',
  approved: 'bg-info/10 text-info',
  published: 'bg-success/10 text-success',
};
const STATUS_ORDER = ['draft', 'review', 'approved', 'published'];

export default function FacebookPublishing() {
  const heroFileRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { data: posts = [], isLoading } = useFacebookPosts();
  const createPost = useCreateFacebookPost();
  const updatePost = useUpdateFacebookPost();
  const deletePost = useDeleteFacebookPost();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Generation state
  const [topic, setTopic] = useState('');
  const [pillar, setPillar] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Editor state
  const [editContent, setEditContent] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editCta, setEditCta] = useState('');
  const [editPillar, setEditPillar] = useState('');

  // Drag state
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');

  const selectedPost = posts.find((p: any) => p.id === selectedId) ?? null;

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
        messages: [{ role: 'user', content: `Suggest exactly 5 compelling Facebook post topics for the "${sp.name}" content pillar (${sp.description}). These should be engaging, shareable, and suited for Facebook's audience. Return ONLY a JSON array of 5 short topic strings.` }],
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
  }, [pillar]);

  const loadPostToEditor = useCallback((post: any) => {
    setEditContent(post.content || '');
    setEditLinkUrl(post.link_url || '');
    setEditImageUrl(post.image_url || '');
    setEditHashtags(Array.isArray(post.hashtags) ? (post.hashtags as string[]).join(', ') : '');
    setEditCta(post.cta || '');
    setEditPillar(post.content_pillar || '');
    setSelectedId(post.id);
    setActiveTab('editor');
  }, []);

  // ─── Generate ───
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    setIsGenerating(true);
    const selectedPillar = brandProfile.contentPillars.find(p => p.id === pillar);

    const prompt = `Create a Facebook post about "${topic}" for the "${selectedPillar?.name || 'General'}" content pillar.

Requirements:
- Max 500 characters for optimal engagement
- Start with a hook that stops the scroll
- Conversational, warm tone — writing as Christophe Martinot
- Include a clear CTA
- Suggest 3-5 relevant hashtags — ALWAYS include #SpiralUpWorks
- If relevant, suggest a link to include

Format the output as:
## CONTENT
[The full post text]

## CTA
[The call to action]

## HASHTAGS
[comma-separated hashtags]

## LINK
[suggested link URL or "none"]

Stay unmistakably Spiral Up in voice.`;

    let content = '';
    await streamContent({
      messages: [{ role: 'user', content: prompt }],
      onDelta: (d) => { content += d; },
      onDone: async () => {
        const contentMatch = content.match(/## CONTENT\s*\n([\s\S]*?)(?=\n## CTA)/);
        const ctaMatch = content.match(/## CTA\s*\n([\s\S]*?)(?=\n## HASHTAGS)/);
        const hashMatch = content.match(/## HASHTAGS\s*\n([\s\S]*?)(?=\n## LINK|$)/);
        const linkMatch = content.match(/## LINK\s*\n([\s\S]*?)$/);

        const body = contentMatch?.[1]?.trim() || content;
        const cta = ctaMatch?.[1]?.trim() || '';
        const hashtags = hashMatch?.[1]?.trim().split(',').map(h => h.trim().replace(/^#/, '')) || [];
        if (!hashtags.some(h => h.toLowerCase() === 'spiralupworks')) hashtags.push('SpiralUpWorks');
        const link = linkMatch?.[1]?.trim();
        const linkUrl = link && link.toLowerCase() !== 'none' ? link : '';

        try {
          const newPost = await createPost.mutateAsync({
            content: body,
            cta,
            hashtags,
            link_url: linkUrl,
            content_pillar: selectedPillar?.name || '',
            status: 'draft',
          });
          if (newPost) loadPostToEditor(newPost);
          toast.success('Facebook post generated!');
        } catch (e: any) {
          toast.error('Failed to save: ' + e.message);
        }
        setIsGenerating(false);
      },
      onError: (e) => { toast.error(e); setIsGenerating(false); },
    });
  }, [topic, pillar, createPost, loadPostToEditor]);

  // ─── Save ───
  const handleSave = async () => {
    if (!selectedId) return;
    const hashtags = editHashtags.split(',').map(h => h.trim()).filter(Boolean);
    if (!hashtags.some(h => h.toLowerCase() === 'spiralupworks')) hashtags.push('SpiralUpWorks');
    await updatePost.mutateAsync({
      id: selectedId,
      content: editContent,
      link_url: editLinkUrl,
      image_url: editImageUrl,
      hashtags,
      cta: editCta,
      content_pillar: editPillar,
    });
    toast.success('Saved!');
  };

  // ─── Status change ───
  const handleStatusChange = async (id: string, newStatus: string) => {
    await updatePost.mutateAsync({ id, status: newStatus });
    toast.success(`Moved to ${newStatus}`);
  };

  // ─── Publish via Buffer ───
  const handlePublish = async () => {
    if (!selectedId) return;
    try {
      const post = posts.find((p: any) => p.id === selectedId);
      if (!post) return;
      const { error } = await supabase.functions.invoke('publish-social', {
        body: {
          item_id: selectedId,
          channel: 'facebook',
          content: (post as any).content,
          image_url: (post as any).image_url,
          source: 'facebook_posts',
        },
      });
      if (error) throw error;
      await updatePost.mutateAsync({ id: selectedId, status: 'published', published_at: new Date().toISOString() });
      toast.success('Published to Facebook via Buffer!');
    } catch (e: any) {
      toast.error('Publish failed: ' + e.message);
    }
  };

  // ─── Image upload ───
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const path = `facebook/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('brand-assets').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploadingImage(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(path);
    setEditImageUrl(publicUrl);
    if (selectedId) await updatePost.mutateAsync({ id: selectedId, image_url: publicUrl });
    toast.success('Image uploaded!');
    setUploadingImage(false);
  };

  // ─── Drag & Drop ───
  const handleDragStart = (postId: string) => setDraggedPostId(postId);
  const handleDragOver = (e: React.DragEvent, col: string) => { e.preventDefault(); setDragOverColumn(col); };
  const handleDragLeave = () => setDragOverColumn(null);
  const handleDrop = async (col: string) => {
    if (draggedPostId) await handleStatusChange(draggedPostId, col);
    setDraggedPostId(null);
    setDragOverColumn(null);
  };

  // ─── Column posts ───
  const columns = STATUS_ORDER.map(status => ({
    status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
    posts: posts.filter((p: any) => p.status === status),
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold flex items-center gap-2">
              <Facebook className="w-6 h-6 text-[#1877F2]" /> Facebook Publishing
            </h1>
            <p className="text-muted-foreground mt-1">Generate, review, approve & publish Facebook posts.</p>
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

        {/* ─── Pipeline Tab ─── */}
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
                  {col.posts.map((post: any) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => handleDragStart(post.id)}
                      onClick={() => loadPostToEditor(post)}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/30 cursor-pointer transition-all"
                    >
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="w-full h-20 object-cover rounded mb-2" />
                      )}
                      <p className="text-sm font-medium line-clamp-2">{post.content?.slice(0, 80) || 'Untitled'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {post.content_pillar && <Badge variant="outline" className="text-[10px]">{post.content_pillar}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── Generate Tab ─── */}
        <TabsContent value="generate">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Generate Facebook Post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Topic *</Label>
                  <Input placeholder="e.g. Why most transformations fail silently" value={topic} onChange={e => setTopic(e.target.value)} />
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
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Post</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display text-base">Publishing Workflow</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { step: '1', label: 'Generate', desc: 'AI creates a Facebook post with CTA & hashtags' },
                    { step: '2', label: 'Edit', desc: 'Refine content, image, link, and hashtags' },
                    { step: '3', label: 'Preview', desc: 'See how it will appear on Facebook' },
                    { step: '4', label: 'Approve', desc: 'Move from draft → review → approved' },
                    { step: '5', label: 'Publish', desc: 'Push to Facebook via Buffer' },
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

        {/* ─── Editor Tab ─── */}
        <TabsContent value="editor">
          {selectedPost ? (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display text-base flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> Edit Post
                      </CardTitle>
                      <Badge className={cn('text-xs', STATUS_STYLES[(selectedPost as any).status])}>{(selectedPost as any).status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Post Content</Label>
                      <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} />
                      <p className={cn('text-xs', editContent.length > 500 ? 'text-destructive' : 'text-muted-foreground')}>
                        {editContent.length} / 500 characters (optimal)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Link URL</Label>
                      <Input value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)} placeholder="https://spiralingup.works/..." />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA</Label>
                      <Input value={editCta} onChange={e => setEditCta(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hashtags (comma-separated)</Label>
                      <Input value={editHashtags} onChange={e => setEditHashtags(e.target.value)} placeholder="#leadership, #transformation" />
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
                {/* Image */}
                <Card className="shadow-card">
                  <CardHeader><CardTitle className="font-display text-base">Post Image</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {editImageUrl ? (
                      <img src={editImageUrl} alt="" className="w-full rounded-lg aspect-video object-cover" />
                    ) : (
                      <div className="w-full aspect-video rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <ImagePlus className="w-8 h-8" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} placeholder="Image URL..." />
                      <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Button variant="outline" size="sm" className="w-full" onClick={() => heroFileRef.current?.click()} disabled={uploadingImage}>
                        {uploadingImage ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />} Upload Image
                      </Button>
                      <Button
                        variant="outline" size="sm" className="w-full"
                        disabled={generatingImage || !editContent}
                        onClick={async () => {
                          setGeneratingImage(true);
                          try {
                            const concept = editContent?.slice(0, 200) || 'Leadership and transformation';
                            const { data, error } = await supabase.functions.invoke('generate-social-image', {
                              body: {
                                visual_concept: concept,
                                visual_type: 'editorial_photo',
                                channel: 'facebook',
                                title: editContent?.slice(0, 60),
                                content: editContent,
                              },
                            });
                            if (error) throw error;
                            if (data?.image_url) {
                              setEditImageUrl(data.image_url);
                              if (selectedId) await updatePost.mutateAsync({ id: selectedId, image_url: data.image_url });
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

                {/* Actions */}
                <Card className="shadow-card">
                  <CardHeader><CardTitle className="font-display text-base">Actions</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {(selectedPost as any).status === 'draft' && (
                      <Button variant="outline" className="w-full" onClick={() => handleStatusChange(selectedId!, 'review')}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Move to Review
                      </Button>
                    )}
                    {(selectedPost as any).status === 'review' && (
                      <Button variant="outline" className="w-full" onClick={() => handleStatusChange(selectedId!, 'approved')}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                      </Button>
                    )}
                    {(selectedPost as any).status === 'approved' && (
                      <Button className="w-full gradient-brand text-primary-foreground" onClick={handlePublish}>
                        <Send className="w-4 h-4 mr-1" /> Publish to Facebook
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

        {/* ─── Preview Tab ─── */}
        <TabsContent value="preview">
          {selectedPost ? (
            <div className="max-w-xl mx-auto">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] font-bold text-sm">CM</div>
                    <div>
                      <p className="font-semibold text-sm">Christophe Martinot</p>
                      <p className="text-xs text-muted-foreground">Founder @ SeedingEnergy · <Facebook className="w-3 h-3 inline" /></p>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed mb-3">{(selectedPost as any).content}</div>
                  {(selectedPost as any).image_url && (
                    <img src={(selectedPost as any).image_url} alt="" className="w-full rounded-lg mb-3" />
                  )}
                  {(selectedPost as any).link_url && (
                    <div className="p-3 rounded-lg border border-border bg-muted/30 mb-3">
                      <p className="text-xs text-muted-foreground truncate">{(selectedPost as any).link_url}</p>
                    </div>
                  )}
                  {Array.isArray((selectedPost as any).hashtags) && (selectedPost as any).hashtags.length > 0 && (
                    <p className="text-sm text-[#1877F2]">{((selectedPost as any).hashtags as string[]).map(h => `#${h}`).join(' ')}</p>
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
