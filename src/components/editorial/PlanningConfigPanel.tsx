import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlanningConfig, useUpdatePlanningConfig } from '@/hooks/use-editorial';
import { toast } from 'sonner';

const CHANNEL_OPTIONS = ['linkedin', 'blog', 'email', 'instagram', 'twitter', 'facebook', 'youtube'];
const FORMAT_OPTIONS = ['linkedin_post', 'blog_post', 'newsletter', 'carousel', 'video_script', 'email_sequence', 'event_promo'];

export default function PlanningConfigPanel() {
  const { data: config, isLoading } = usePlanningConfig();
  const update = useUpdatePlanningConfig();
  const [form, setForm] = useState<any>(null);
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config && !form) setForm({ ...config });
  }, [config]);

  if (isLoading || !form) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const addToList = (field: string) => {
    const val = newItem[field]?.trim();
    if (!val) return;
    setForm((f: any) => ({ ...f, [field]: [...(f[field] || []), val] }));
    setNewItem(n => ({ ...n, [field]: '' }));
  };

  const removeFromList = (field: string, i: number) => {
    setForm((f: any) => ({ ...f, [field]: (f[field] || []).filter((_: any, idx: number) => idx !== i) }));
  };

  const toggleInList = (field: string, value: string) => {
    setForm((f: any) => {
      const list = f[field] || [];
      if (list.includes(value)) {
        return { ...f, [field]: list.filter((v: string) => v !== value) };
      }
      return { ...f, [field]: [...list, value] };
    });
  };

  const handleSave = () => {
    const { id, created_at, updated_at, ...updates } = form;
    update.mutate(updates, { onSuccess: () => toast.success('Planning config saved') });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configure how the AI generates your editorial plans.</p>
        <Button size="sm" onClick={handleSave} disabled={update.isPending} className="gap-1.5">
          {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Config
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cadence */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Planning Cadence</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={form.cadence} onValueChange={v => setForm((f: any) => ({ ...f, cadence: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Posts per Cycle</label>
              <Input type="number" min={1} max={20} value={form.posts_per_cycle} onChange={e => setForm((f: any) => ({ ...f, posts_per_cycle: parseInt(e.target.value) || 5 }))} />
            </div>
          </CardContent>
        </Card>

        {/* Channels */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Channels to Include</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map(ch => (
                <Badge
                  key={ch}
                  variant={(form.channels || []).includes(ch) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleInList('channels', ch)}
                >
                  {ch}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preferred Formats */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Preferred Formats</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(f => (
                <Badge
                  key={f}
                  variant={(form.preferred_formats || []).includes(f) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleInList('preferred_formats', f)}
                >
                  {f.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Audience */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Target Audience</CardTitle></CardHeader>
          <CardContent>
            <Input value={form.target_audience || ''} onChange={e => setForm((f: any) => ({ ...f, target_audience: e.target.value }))} placeholder="e.g. C-suite, transformation leaders..." />
          </CardContent>
        </Card>

        {/* Campaign Focus */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Campaign Focus</CardTitle></CardHeader>
          <CardContent>
            <Input value={form.campaign_focus || ''} onChange={e => setForm((f: any) => ({ ...f, campaign_focus: e.target.value }))} placeholder="e.g. Book launch, Q1 workshops..." />
          </CardContent>
        </Card>

        {/* Auto-publish toggle */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Publishing Model</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              {form.auto_publish ? '⚠️ Auto-publishing enabled' : '✓ Approval-first (recommended)'}
            </p>
            <Button
              variant={form.auto_publish ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setForm((f: any) => ({ ...f, auto_publish: !f.auto_publish }))}
            >
              {form.auto_publish ? 'Disable Auto-Publish' : 'Currently: Manual Approval'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* List fields */}
      {(['priority_topics', 'cta_preferences', 'exclusion_rules'] as const).map(field => (
        <Card key={field} className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {(form[field] || []).map((item: string, i: number) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {item}
                  <button onClick={() => removeFromList(field, i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
