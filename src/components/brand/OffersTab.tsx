import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, Save, X } from 'lucide-react';
import { useOffers, useUpsertOffer, useDeleteOffer } from '@/hooks/use-brand-data';
import { toast } from 'sonner';

export default function OffersTab() {
  const { data: offers, isLoading } = useOffers();
  const upsert = useUpsertOffer();
  const deleteOffer = useDeleteOffer();
  const [editing, setEditing] = useState<any | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Spiral Up services and programs — referenced in AI-generated CTAs and content.</p>
        <Button size="sm" onClick={() => setEditing({ offer_name: '', description: '', target_clients: '', key_outcomes: [], use_cases: [], cta_examples: [], icon: '🎯', sort_order: (offers?.length || 0) })} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Offer
        </Button>
      </div>

      {editing && <OfferEditor offer={editing} onSave={(o) => {
        upsert.mutate(o, { onSuccess: () => { toast.success('Offer saved'); setEditing(null); } });
      }} onCancel={() => setEditing(null)} isSaving={upsert.isPending} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(offers || []).map((o: any) => (
          <Card key={o.id} className="shadow-card group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="text-2xl mb-2">{o.icon}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(o)}><Save className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteOffer.mutate(o.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <p className="font-display font-semibold text-sm">{o.offer_name}</p>
              <p className="text-xs text-muted-foreground mt-1">{o.description}</p>
              {o.target_clients && <p className="text-xs text-muted-foreground mt-2">🎯 {o.target_clients}</p>}
              {(o.cta_examples || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {o.cta_examples.slice(0, 2).map((c: string) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(offers || []).length === 0 && !editing && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No offers defined yet.</p>
        </div>
      )}
    </div>
  );
}

function OfferEditor({ offer, onSave, onCancel, isSaving }: { offer: any; onSave: (o: any) => void; onCancel: () => void; isSaving: boolean }) {
  const [form, setForm] = useState(offer);
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
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
            <Input value={form.icon || ''} onChange={e => setForm((f: any) => ({ ...f, icon: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Offer Name</label>
            <Input value={form.offer_name || ''} onChange={e => setForm((f: any) => ({ ...f, offer_name: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
          <Textarea rows={2} value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Clients</label>
          <Input value={form.target_clients || ''} onChange={e => setForm((f: any) => ({ ...f, target_clients: e.target.value }))} />
        </div>

        {(['key_outcomes', 'use_cases', 'cta_examples'] as const).map(field => (
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
              <Input placeholder="Add..." value={newItem[field] || ''} onChange={e => setNewItem(n => ({ ...n, [field]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList(field); } }} />
              <Button variant="outline" size="sm" onClick={() => addToList(field)}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(form)} disabled={isSaving}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}
