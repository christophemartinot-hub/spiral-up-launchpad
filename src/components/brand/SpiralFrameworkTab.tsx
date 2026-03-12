import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useSpiralPrinciples, useUpdateSpiralPrinciple } from '@/hooks/use-brand-data';
import { toast } from 'sonner';
import { PRINCIPLE_ASSETS, ZONE_ASSETS, resolveBrandIcon } from '@/lib/brand-assets';

export default function SpiralFrameworkTab() {
  const { data: principles, isLoading } = useSpiralPrinciples();
  const update = useUpdateSpiralPrinciple();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Define each SPIRAL principle. These definitions feed the AI engine for consistent content generation.
      </p>

      {/* Zones overview */}
      <div>
        <h3 className="text-sm font-display font-semibold mb-3">SPIRAL Zones</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(ZONE_ASSETS).map(([key, zone]) => (
            <Card key={key} className="shadow-card">
              <CardContent className="p-4 flex items-center gap-3">
                <img src={zone.icon} alt={zone.label} className="w-12 h-12 object-contain flex-shrink-0" />
                <div>
                  <p className="font-display font-semibold text-sm">{zone.label}</p>
                  <p className="text-[10px] text-muted-foreground">Official icon</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {(principles || []).map((p: any) => (
          <PrincipleEditor
            key={p.id}
            principle={p}
            isExpanded={expanded === p.id}
            onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
            onSave={(updates) => update.mutate({ id: p.id, ...updates }, { onSuccess: () => toast.success(`${p.letter} principle saved`) })}
            isSaving={update.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function PrincipleEditor({ principle, isExpanded, onToggle, onSave, isSaving }: {
  principle: any; isExpanded: boolean; onToggle: () => void;
  onSave: (u: Record<string, any>) => void; isSaving: boolean;
}) {
  const [form, setForm] = useState(principle);
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

  const asset = PRINCIPLE_ASSETS[principle.letter];
  const officialIcon = asset?.icon;
  const officialIllustration = asset?.illustration;

  return (
    <Card className="shadow-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/30 transition-colors">
        {officialIcon ? (
          <img src={officialIcon} alt={`${principle.letter} — ${asset?.label}`} className="w-12 h-12 object-contain rounded-xl flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-display font-bold text-xl flex-shrink-0">
            {principle.letter}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-display font-bold text-primary">{principle.letter}</span>
            <p className="font-display font-semibold">{form.principle_name || `(${principle.letter} — not yet defined)`}</p>
          </div>
          <p className="text-sm text-muted-foreground truncate">{form.short_description || 'Click to expand and define this principle'}</p>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <CardContent className="border-t pt-5 space-y-5">
          {/* Official illustration */}
          {officialIllustration && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted-foreground mb-2">Official Illustration (Martin Tognola)</p>
              <img src={officialIllustration} alt={`${asset?.label} illustration`} className="rounded-lg max-h-40 object-contain" />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Principle Name</label>
              <Input value={form.principle_name || ''} onChange={e => setForm((f: any) => ({ ...f, principle_name: e.target.value }))} placeholder="e.g. Systemic Thinking" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Visual Icon (emoji fallback)</label>
              <Input value={form.visual_icon || ''} onChange={e => setForm((f: any) => ({ ...f, visual_icon: e.target.value }))} placeholder="🔄" />
              <p className="text-[9px] text-muted-foreground mt-0.5">Official icon is used automatically when available.</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Short Description</label>
            <Input value={form.short_description || ''} onChange={e => setForm((f: any) => ({ ...f, short_description: e.target.value }))} placeholder="One-line summary..." />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Long Explanation</label>
            <Textarea rows={4} value={form.long_explanation || ''} onChange={e => setForm((f: any) => ({ ...f, long_explanation: e.target.value }))} placeholder="Full explanation of this principle..." />
          </div>

          {(['key_questions', 'practical_examples', 'quotes'] as const).map(field => (
            <div key={field}>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(form[field] || []).map((item: string, i: number) => (
                  <Badge key={i} variant="outline" className="gap-1 pr-1 max-w-xs truncate">
                    <span className="truncate">{item}</span>
                    <button onClick={() => removeFromList(field, i)} className="ml-1 hover:text-destructive flex-shrink-0"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={`Add ${field.replace(/_/g, ' ')}...`}
                  value={newItem[field] || ''}
                  onChange={e => setNewItem(n => ({ ...n, [field]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addToList(field); } }}
                />
                <Button variant="outline" size="sm" onClick={() => addToList(field)}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => {
              const { id, created_at, updated_at, letter, sort_order, ...fields } = form;
              onSave(fields);
            }} disabled={isSaving} className="gap-1.5">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save {principle.letter}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
