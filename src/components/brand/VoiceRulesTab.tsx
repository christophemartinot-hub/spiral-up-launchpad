import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, X, Loader2 } from 'lucide-react';
import { useVoiceRules, useUpdateVoiceRules } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

export default function VoiceRulesTab() {
  const { data, isLoading } = useVoiceRules();
  const update = useUpdateVoiceRules();
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = () => {
    const { id, created_at, updated_at, ...fields } = form;
    update.mutate(fields, { onSuccess: () => toast.success('Voice rules saved') });
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
        <p className="text-sm text-muted-foreground">Define voice & tone rules the AI must follow when generating content.</p>
        <Button size="sm" onClick={save} disabled={update.isPending} className="gap-1.5">
          {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-base">Tone Description</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={3} value={form.tone_description || ''} onChange={e => setForm(f => ({ ...f, tone_description: e.target.value }))} placeholder="Describe the overall tone: human, direct, pragmatic..." />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ListCard title="🚫 Words to Avoid" field="words_to_avoid" items={form.words_to_avoid || []} onAdd={addToList} onRemove={removeFromList} variant="destructive" />
        <ListCard title="✅ Words to Prefer" field="words_to_prefer" items={form.words_to_prefer || []} onAdd={addToList} onRemove={removeFromList} variant="default" />
      </div>

      <ListCard title="Writing Style Rules" field="writing_style_rules" items={form.writing_style_rules || []} onAdd={addToList} onRemove={removeFromList} variant="secondary" />
      <ListCard title="Sentence Style Examples" field="sentence_style_examples" items={form.sentence_style_examples || []} onAdd={addToList} onRemove={removeFromList} variant="outline" />
      <ListCard title="Typical Spiral Up Expressions" field="typical_expressions" items={form.typical_expressions || []} onAdd={addToList} onRemove={removeFromList} variant="secondary" />
    </div>
  );
}

function ListCard({ title, field, items, onAdd, onRemove, variant }: {
  title: string; field: string; items: string[];
  onAdd: (f: string, v: string) => void; onRemove: (f: string, i: number) => void;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}) {
  const [val, setVal] = useState('');
  return (
    <Card className="shadow-card">
      <CardHeader><CardTitle className="font-display text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {items.map((item: string, i: number) => (
            <Badge key={i} variant={variant as any} className="gap-1 pr-1">
              {item}
              <button onClick={() => onRemove(field, i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add..." value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(field, val); setVal(''); } }} />
          <Button variant="outline" size="sm" onClick={() => { onAdd(field, val); setVal(''); }}><Plus className="w-3.5 h-3.5" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}
