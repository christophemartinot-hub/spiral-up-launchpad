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
import { Switch } from '@/components/ui/switch';
import { useVisualConfig, useUpdateVisualConfig } from '@/hooks/use-editorial';
import { toast } from 'sonner';

const STYLE_OPTIONS = ['clean', 'minimal', 'professional', 'bold', 'editorial', 'organic', 'geometric', 'typographic'];

export default function VisualConfigPanel() {
  const { data: config, isLoading } = useVisualConfig();
  const update = useUpdateVisualConfig();
  const [form, setForm] = useState<any>(null);
  const [newExclusion, setNewExclusion] = useState('');

  useEffect(() => {
    if (config && !form) setForm({ ...config });
  }, [config]);

  if (isLoading || !form) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const toggleStyle = (style: string) => {
    setForm((f: any) => {
      const list = f.preferred_styles || [];
      return { ...f, preferred_styles: list.includes(style) ? list.filter((s: string) => s !== style) : [...list, style] };
    });
  };

  const addExclusion = () => {
    if (!newExclusion.trim()) return;
    setForm((f: any) => ({ ...f, exclusion_rules: [...(f.exclusion_rules || []), newExclusion.trim()] }));
    setNewExclusion('');
  };

  const removeExclusion = (i: number) => {
    setForm((f: any) => ({ ...f, exclusion_rules: f.exclusion_rules.filter((_: any, idx: number) => idx !== i) }));
  };

  const handleSave = () => {
    const { id, created_at, updated_at, ...updates } = form;
    update.mutate(updates, { onSuccess: () => toast.success('Visual config saved') });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configure how the AI generates visual directions for your content.</p>
        <Button size="sm" onClick={handleSave} disabled={update.isPending} className="gap-1.5">
          {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Config
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Preferred Styles */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Preferred Visual Styles</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map(s => (
                <Badge key={s} variant={(form.preferred_styles || []).includes(s) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleStyle(s)}>
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Illustration Preference */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Illustration vs Photos</CardTitle></CardHeader>
          <CardContent>
            <Select value={form.illustration_preference} onValueChange={v => setForm((f: any) => ({ ...f, illustration_preference: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="illustrations_first">Illustrations First</SelectItem>
                <SelectItem value="photos_first">Photos First</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="illustrations_only">Illustrations Only</SelectItem>
                <SelectItem value="text_only">Text / Typography Only</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Text Density */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Text Density on Visuals</CardTitle></CardHeader>
          <CardContent>
            <Select value={form.text_density} onValueChange={v => setForm((f: any) => ({ ...f, text_density: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="minimal">Minimal (headline only)</SelectItem>
                <SelectItem value="low">Low (headline + subhead)</SelectItem>
                <SelectItem value="medium">Medium (headline + body)</SelectItem>
                <SelectItem value="high">High (detailed text)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* CTA Placement */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">CTA Placement Preference</CardTitle></CardHeader>
          <CardContent>
            <Select value={form.cta_placement_pref} onValueChange={v => setForm((f: any) => ({ ...f, cta_placement_pref: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom">Bottom of visual</SelectItem>
                <SelectItem value="top">Top of visual</SelectItem>
                <SelectItem value="overlay">Overlay on image</SelectItem>
                <SelectItem value="caption_only">Caption only (not on visual)</SelectItem>
                <SelectItem value="varies">Varies by content</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Design Simplicity */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Design Simplicity</CardTitle></CardHeader>
          <CardContent>
            <Select value={form.simplicity_level} onValueChange={v => setForm((f: any) => ({ ...f, simplicity_level: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="very_high">Very High — ultra clean</SelectItem>
                <SelectItem value="high">High — clean & professional</SelectItem>
                <SelectItem value="medium">Medium — some visual richness</SelectItem>
                <SelectItem value="low">Low — rich & detailed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Asset toggles */}
        <Card className="shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Brand Asset Usage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Use book visuals</span>
              <Switch checked={form.use_book_visuals} onCheckedChange={v => setForm((f: any) => ({ ...f, use_book_visuals: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Use event/workshop visuals</span>
              <Switch checked={form.use_event_visuals} onCheckedChange={v => setForm((f: any) => ({ ...f, use_event_visuals: v }))} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exclusion rules */}
      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Visual Exclusion Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {(form.exclusion_rules || []).map((rule: string, i: number) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                {rule}
                <button onClick={() => removeExclusion(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="e.g. No stock photos, No gradients..." value={newExclusion} onChange={e => setNewExclusion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExclusion(); } }} />
            <Button variant="outline" size="sm" onClick={addExclusion}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Format ratios by channel */}
      <Card className="shadow-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Format Ratios by Channel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(form.formats_by_channel || {}).map(([channel, ratio]) => (
              <div key={channel} className="flex items-center gap-2">
                <span className="text-sm font-medium w-20">{channel}</span>
                <Input value={ratio as string} onChange={e => setForm((f: any) => ({ ...f, formats_by_channel: { ...f.formats_by_channel, [channel]: e.target.value } }))} className="flex-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
