import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, X, Loader2 } from 'lucide-react';
import { useBrandCore, useUpdateBrandCore } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

export default function BrandCoreTab() {
  const { data, isLoading } = useBrandCore();
  const update = useUpdateBrandCore();
  const [form, setForm] = useState<Record<string, any>>({});
  const [newBelief, setNewBelief] = useState('');

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = () => {
    const { id, created_at, updated_at, ...fields } = form;
    update.mutate(fields, { onSuccess: () => toast.success('Brand core saved') });
  };

  const addBelief = () => {
    if (!newBelief.trim()) return;
    const beliefs = [...(form.key_beliefs || []), newBelief.trim()];
    setForm(f => ({ ...f, key_beliefs: beliefs }));
    setNewBelief('');
  };

  const removeBelief = (i: number) => {
    setForm(f => ({ ...f, key_beliefs: (f.key_beliefs || []).filter((_: any, idx: number) => idx !== i) }));
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Fundamental identity that powers all AI-generated content.</p>
        <Button size="sm" onClick={save} disabled={update.isPending} className="gap-1.5">
          {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Brand Name" value={form.brand_name} onChange={v => setForm(f => ({ ...f, brand_name: v }))} />
            <Field label="Tagline" value={form.tagline} onChange={v => setForm(f => ({ ...f, tagline: v }))} />
            <Field label="Founder" value={form.founder} onChange={v => setForm(f => ({ ...f, founder: v }))} />
            <Field label="Company" value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} />
            <Field label="Website" value={form.website} onChange={v => setForm(f => ({ ...f, website: v }))} />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Purpose</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <AreaField label="Mission" value={form.mission} onChange={v => setForm(f => ({ ...f, mission: v }))} />
            <AreaField label="Vision" value={form.vision} onChange={v => setForm(f => ({ ...f, vision: v }))} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-display text-base">Key Beliefs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(form.key_beliefs || []).map((b: string, i: number) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {b}
                <button onClick={() => removeBelief(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add a key belief..." value={newBelief} onChange={e => setNewBelief(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBelief())} />
            <Button variant="outline" size="sm" onClick={addBelief}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Short Description</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} value={form.short_description || ''} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Brief brand description for social bios, meta tags..." />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-base">Long Description</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} value={form.long_description || ''} onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))} placeholder="Detailed brand narrative for about pages, press kits..." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <Input value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function AreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <Textarea rows={3} value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
