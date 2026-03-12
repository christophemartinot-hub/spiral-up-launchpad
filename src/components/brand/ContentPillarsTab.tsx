import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2, Trash2, Save } from 'lucide-react';
import { useContentPillars, useUpsertContentPillar, useDeleteContentPillar } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

export default function ContentPillarsTab() {
  const { data: pillars, isLoading } = useContentPillars();
  const upsert = useUpsertContentPillar();
  const deletePillar = useDeleteContentPillar();
  const [editing, setEditing] = useState<any | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Strategic content themes that guide all Spiral Up content.</p>
        <Button size="sm" onClick={() => setEditing({ title: '', description: '', target_audience: '', typical_topics: [], example_posts: [], keywords: [], emoji: '📌', sort_order: (pillars?.length || 0) })} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Pillar
        </Button>
      </div>

      {editing && <PillarEditor pillar={editing} onSave={(p) => {
        upsert.mutate(p, { onSuccess: () => { toast.success('Pillar saved'); setEditing(null); } });
      }} onCancel={() => setEditing(null)} isSaving={upsert.isPending} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(pillars || []).map((p: any) => (
          <Card key={p.id} className="shadow-card hover:shadow-elevated transition-shadow group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="text-2xl mb-2">{p.emoji}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(p)}><Save className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePillar.mutate(p.id, { onSuccess: () => toast.success('Deleted') })}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <p className="font-display font-semibold text-sm">{p.title}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-2">{p.description}</p>
              {p.target_audience && <p className="text-xs text-muted-foreground mb-2">🎯 {p.target_audience}</p>}
              <div className="flex flex-wrap gap-1">
                {(p.keywords || []).slice(0, 5).map((k: string) => (
                  <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PillarEditor({ pillar, onSave, onCancel, isSaving }: { pillar: any; onSave: (p: any) => void; onCancel: () => void; isSaving: boolean }) {
  const [form, setForm] = useState(pillar);
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  const addToList = (field: string) => {
    const val = newItem[field]?.trim();
    if (!val) return;
    setForm((f: any) => ({ ...f, [field]: [...(f[field] || []), val] }));
    setNewItem(n => ({ ...n, [field]: '' }));
  };

  const removeFromList = (field: string, i: number) => {
    setForm((f: any) => ({ ...f, [field]: (f[field] || []).filter((_: any, idx: number) => idx !== i) }));
  };

  return (
    <Card className="shadow-card border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Emoji</label>
            <Input value={form.emoji || ''} onChange={e => setForm((f: any) => ({ ...f, emoji: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
            <Input value={form.title || ''} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <Textarea rows={2} value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Audience</label>
          <Input value={form.target_audience || ''} onChange={e => setForm((f: any) => ({ ...f, target_audience: e.target.value }))} />
        </div>

        {(['typical_topics', 'keywords', 'example_posts'] as const).map(field => (
          <div key={field}>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form[field] || []).map((item: string, i: number) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {item}
                  <button onClick={() => removeFromList(field, i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder={`Add...`} value={newItem[field] || ''} onChange={e => setNewItem(n => ({ ...n, [field]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList(field); } }} />
              <Button variant="outline" size="sm" onClick={() => addToList(field)}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(form)} disabled={isSaving} className="gap-1.5">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
