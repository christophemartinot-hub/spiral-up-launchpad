import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, X, FileText } from 'lucide-react';
import { useExampleContent, useUpsertExampleContent, useDeleteExampleContent } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

const CONTENT_TYPES = ['blog_post', 'linkedin_post', 'keynote_outline', 'case_study', 'article'] as const;

export default function ExampleContentTab() {
  const { data: examples, isLoading } = useExampleContent();
  const upsert = useUpsertExampleContent();
  const deleteItem = useDeleteExampleContent();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', content_type: 'blog_post', tags: [] as string[] });
  const [newTag, setNewTag] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const save = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    upsert.mutate(form, { onSuccess: () => { toast.success('Example saved'); setAdding(false); setForm({ title: '', content: '', content_type: 'blog_post', tags: [] }); } });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">High-quality content examples the AI learns from to match your style.</p>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Example</Button>
      </div>

      {adding && (
        <Card className="shadow-card border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Content Type</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Content</label>
              <Textarea rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Paste example content..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((t, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }))} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add tag..." value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTag.trim()) { setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] })); setNewTag(''); } } }} />
                <Button variant="outline" size="sm" onClick={() => { if (newTag.trim()) { setForm(f => ({ ...f, tags: [...f.tags, newTag.trim()] })); setNewTag(''); } }}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={upsert.isPending}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(examples || []).map((ex: any) => (
          <Card key={ex.id} className="shadow-card group cursor-pointer" onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-sm">{ex.title}</p>
                    <Badge variant="outline" className="text-[10px]">{(ex.content_type || '').replace(/_/g, ' ')}</Badge>
                  </div>
                  {expanded === ex.id ? (
                    <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap font-body">{ex.content}</pre>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ex.content?.slice(0, 200)}</p>
                  )}
                  {(ex.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ex.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive flex-shrink-0" onClick={(e) => { e.stopPropagation(); deleteItem.mutate(ex.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(examples || []).length === 0 && !adding && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No example content yet. Add your best pieces to train the AI.</p>
        </div>
      )}
    </div>
  );
}
