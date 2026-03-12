import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, Globe, ExternalLink } from 'lucide-react';
import { useWebsitePages, useUpsertWebsitePage, useDeleteWebsitePage } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

export default function WebsiteKBTab() {
  const { data: pages, isLoading } = useWebsitePages();
  const upsert = useUpsertWebsitePage();
  const deletePage = useDeleteWebsitePage();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ url: '', title: '', page_text: '', key_topics: [] as string[], linked_pillars: [] as string[] });
  const [newTopic, setNewTopic] = useState('');

  const save = () => {
    if (!form.url.trim()) { toast.error('URL is required'); return; }
    upsert.mutate(form, { onSuccess: () => { toast.success('Page saved'); setAdding(false); setForm({ url: '', title: '', page_text: '', key_topics: [], linked_pillars: [] }); } });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Ingested website content the AI can reference when generating.</p>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Page</Button>
      </div>

      {adding && (
        <Card className="shadow-card border-primary/20">
          <CardContent className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">URL</label>
                <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://spiralingup.works/about" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="About Spiral Up" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Page Content</label>
              <Textarea rows={6} value={form.page_text} onChange={e => setForm(f => ({ ...f, page_text: e.target.value }))} placeholder="Paste or enter the page text content..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Key Topics</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.key_topics.map((t, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button onClick={() => setForm(f => ({ ...f, key_topics: f.key_topics.filter((_, idx) => idx !== i) }))} className="ml-1 hover:text-destructive"><span className="text-xs">✕</span></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add topic..." value={newTopic} onChange={e => setNewTopic(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newTopic.trim()) { setForm(f => ({ ...f, key_topics: [...f.key_topics, newTopic.trim()] })); setNewTopic(''); } } }} />
                <Button variant="outline" size="sm" onClick={() => { if (newTopic.trim()) { setForm(f => ({ ...f, key_topics: [...f.key_topics, newTopic.trim()] })); setNewTopic(''); } }}><Plus className="w-3.5 h-3.5" /></Button>
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
        {(pages || []).map((p: any) => (
          <Card key={p.id} className="shadow-card group">
            <CardContent className="p-4 flex items-start gap-4">
              <Globe className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-sm">{p.title || p.url}</p>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><ExternalLink className="w-3 h-3" /></a>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.url}</p>
                {p.page_text && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.page_text.slice(0, 200)}...</p>}
                {(p.key_topics || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.key_topics.map((t: string) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deletePage.mutate(p.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {(pages || []).length === 0 && !adding && (
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No website pages ingested yet.</p>
        </div>
      )}
    </div>
  );
}
