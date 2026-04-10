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
  useLinkedinPosts, useCreateLinkedinPost, useUpdateLinkedinPost, useDeleteLinkedinPost,
} from '@/hooks/use-linkedin-posts';
import {
  Sparkles, Eye, Copy, Check, Loader2, Save, Send, Trash2, Pencil, ArrowLeft,
  Lightbulb, ImagePlus, RefreshCw, Upload, ArrowRight, Linkedin, CheckCircle,
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

export default function LinkedInPublishing() {
  const heroFileRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { data: posts = [], isLoading } = useLinkedinPosts();
  const createPost = useCreateLinkedinPost();
  const updatePost = useUpdateLinkedinPost();
  const deletePost = useDeleteLinkedinPost();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Generation state
  const [topic, setTopic] = useState('');
  const [pillar, setPillar] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  // Editor state
  const [editHook, setEditHook] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editCta, setEditCta] = useState('');
  const [editPillar, setEditPillar] = useState('');

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
        messages: [{ role: 'user', content: `Suggest exactly 5 compelling LinkedIn post topics for the "${sp.name}" content pillar (${sp.description}). Return ONLY a JSON array of 5 short topic strings.` }],
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
    setEditHook(post.hook || '');
    setEditContent(post.content || '');
    setEditHashtags(Array.isArray(post.hashtags) ? (post.hashtags as string[]).join(', ') : '');
    setEditImageUrl(post.image_url || '');
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

    const prompt = `Create a LinkedIn post about "${topic}" for the "${selectedPillar?.name || 'General'}" content pillar.

Requirements:
- Max 1300 characters
- Start with a bold, attention-grabbing hook (first line)
- Short paragraphs (1-2 sentences each)
- Personal, direct tone — writing as Christophe Martinot
- Include a clear CTA at the end
- Suggest 3-5 relevant hashtags at the very end

Format the output as:
## HOOK
[The opening hook line]

## BODY
[The full post body including hook]

## CTA
[The call to action]

## HASHTAGS
[comma-separated hashtags]

Stay unmistakably Spiral Up in voice.`;

    let content = '';
    await streamContent({
      messages: [{ role: 'user', content: prompt }],
      onDelta: (d) => { content += d; },
      onDone: async () => {
        // Parse sections
        const hookMatch = content.match(/## HOOK\s*\n([\s\S]*?)(?=\n## BODY)/);
        const bodyMatch = content.match(/## BODY\s*\n([\s\S]*?)(?=\n## CTA)/);
        const ctaMatch = content.match(/## CTA\s*\n([\s\S]*?)(?=\n## HASHTAGS)/);
        const hashMatch = content.match(/## HASHTAGS\s*\n([\s\S]*?)$/);

        const hook = hookMatch?.[1]?.trim() || '';
        const body = bodyMatch?.[1]?.trim() || content;
        const cta = ctaMatch?.[1]?.trim() || '';
        const hashtags = hashMatch?.[1]?.trim().split(',').map(h => h.trim().replace(/^#/, '')) || [];

        try {
          const newPost = await createPost.mutateAsync({
            hook,
            content: body,
            cta,
            hashtags,
            content_pillar: selectedPillar?.name || '',
            character_count: body.length,
            status: 'draft',
          });
          if (newPost) loadPostToEditor(newPost);
          toast.success('LinkedIn post generated!');
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
    await updatePost.mutateAsync({
      id: selectedId,
      hook: editHook,
      content: editContent,
      hashtags,
      image_url: editImageUrl,
      cta: editCta,
      content_pillar: editPillar,
      character_count: editContent.length,
    });
    toast.success('Saved!');
  };

  // ─── Status change ───
  const handleStatusChange = async (id: string, newStatus: string) => {
    await updatePost.mutateAsync({ id, status: newStatus });
    toast.success(`Moved to ${newStatus}`);
  };

  // ─── Publish ───
  const handlePublish = async () => {
    if (!selectedId) return;
    try {
      const post = posts.find(p => p.id === selectedId);
      if (!post) return;
      const { error } = await supabase.functions.invoke('publish-to-linkedin', {
        body: {
          item_id: selectedId,
          content: post.content,
          image_url: post.image_url,
          source: 'linkedin_posts',
        },
      });
      if (error) throw error;
      await updatePost.mutateAsync({ id: selectedId, status: 'published', published_at: new Date().toISOString() });
      toast.success('Published to LinkedIn!');
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
    const path = `linkedin/${Date.now()}.${ext}`;
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
    posts: posts.filter(p => p.status === status),
  }));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold flex items-center gap-2">
              <Linkedin className="w-6 h-6 text-[#0077B5]" /> LinkedIn Publishing
            </h1>
            <p className="text-muted-foreground mt-1">Generate, review, approve & publish LinkedIn posts.</p>
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
                  {col.posts.map(post => (
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
                      <p className="text-sm font-medium line-clamp-2">{post.hook || post.content?.slice(0, 80) || 'Untitled'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {post.content_pillar && <Badge variant="outline" className="text-[10px]">{post.content_pillar}</Badge>}
                        <span className="text-[10px] text-muted-foreground">{post.character_count || 0} chars</span>
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
                  <Sparkles className="w-4 h-4 text-primary" /> Generate LinkedIn Post
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
                    { step: '1', label: 'Generate', desc: 'AI creates LinkedIn post with hook, CTA & hashtags' },
                    { step: '2', label: 'Edit', desc: 'Refine content, image, and hashtags' },
                    { step: '3', label: 'Preview', desc: 'See how it will appear on LinkedIn' },
                    { step: '4', label: 'Approve', desc: 'Move from draft → review → approved' },
                    { step: '5', label: 'Publish', desc: 'Push to LinkedIn via API' },
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
                      <Badge className={cn('text-xs', STATUS_STYLES[selectedPost.status])}>{selectedPost.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hook (first line)</Label>
                      <Input value={editHook} onChange={e => setEditHook(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Post Content</Label>
                      <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={10} />
                      <p className={cn('text-xs', editContent.length > 1300 ? 'text-destructive' : 'text-muted-foreground')}>
                        {editContent.length} / 1300 characters
                      </p>
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
                      <img src={editImageUrl} alt="" className="w-full rounded-lg aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <ImagePlus className="w-8 h-8" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Input value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} placeholder="Image URL..." />
                      <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Button variant="outline" size="sm" className="w-full" onClick={() => heroFileRef.current?.click()} disabled={uploadingImage}>
                        {uploadingImage ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />} Upload Image
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
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
                        <Send className="w-4 h-4 mr-1" /> Publish to LinkedIn
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
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">CM</div>
                    <div>
                      <p className="font-semibold text-sm">Christophe Martinot</p>
                      <p className="text-xs text-muted-foreground">Founder @ SeedingEnergy | SPIRAL Up</p>
                    </div>
                  </div>
                  {selectedPost.image_url && (
                    <img src={selectedPost.image_url} alt="" className="w-full rounded-lg mb-4" />
                  )}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{selectedPost.content}</div>
                  {Array.isArray(selectedPost.hashtags) && selectedPost.hashtags.length > 0 && (
                    <p className="text-sm text-primary mt-3">{(selectedPost.hashtags as string[]).map(h => `#${h}`).join(' ')}</p>
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
