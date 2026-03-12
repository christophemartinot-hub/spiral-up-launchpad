import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, X, Loader2 } from 'lucide-react';
import { useFounderProfile, useUpdateFounderProfile } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

export default function FounderProfileTab() {
  const { data, isLoading } = useFounderProfile();
  const update = useUpdateFounderProfile();
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = () => {
    const { id, created_at, updated_at, ...fields } = form;
    update.mutate(fields, { onSuccess: () => toast.success('Founder profile saved') });
  };

  const addToList = (field: string, value: string) => {
    if (!value.trim()) return;
    setForm(f => ({ ...f, [field]: [...(f[field] || []), value.trim()] }));
  };

  const removeFromList = (field: string, i: number) => {
    setForm(f => ({ ...f, [field]: (f[field] || []).filter((_: any, idx: number) => idx !== i) }));
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Christophe Martinot's profile — guides AI writing voice and references.</p>
        <Button size="sm" onClick={save} disabled={update.isPending} className="gap-1.5">
          {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Bios</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Short Bio</label>
              <Textarea rows={2} value={form.short_bio || ''} onChange={e => setForm(f => ({ ...f, short_bio: e.target.value }))} placeholder="One-liner for social profiles..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Long Bio</label>
              <Textarea rows={5} value={form.long_bio || ''} onChange={e => setForm(f => ({ ...f, long_bio: e.target.value }))} placeholder="Full bio for about pages, speaker kits..." />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Tone Guidelines</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={5} value={form.personal_tone_guidelines || ''} onChange={e => setForm(f => ({ ...f, personal_tone_guidelines: e.target.value }))} placeholder="How should AI write as/for Christophe? Personal voice nuances..." />
          </CardContent>
        </Card>
      </div>

      {['expertise_areas', 'past_companies', 'certifications', 'speaking_topics'].map(field => (
        <ListCard
          key={field}
          title={field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          items={form[field] || []}
          onAdd={(v) => addToList(field, v)}
          onRemove={(i) => removeFromList(field, i)}
        />
      ))}
    </div>
  );
}

function ListCard({ title, items, onAdd, onRemove }: { title: string; items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void }) {
  const [val, setVal] = useState('');
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="font-display text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {items.map((item: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              {item}
              <button onClick={() => onRemove(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder={`Add ${title.toLowerCase()}...`} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(val); setVal(''); } }} />
          <Button variant="outline" size="sm" onClick={() => { onAdd(val); setVal(''); }}><Plus className="w-3.5 h-3.5" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
