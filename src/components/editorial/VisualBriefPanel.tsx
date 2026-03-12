import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image,
  Layout,
  Type,
  Target,
  RefreshCw,
  Check,
  X,
  Edit3,
  Loader2,
  Palette,
  Layers,
  Monitor,
} from 'lucide-react';
import { useUpdateEditorialItem, useRegenerateVisual } from '@/hooks/use-editorial';
import { toast } from 'sonner';
import { resolveBrandIcon, resolveBrandIllustration } from '@/lib/brand-assets';

const VISUAL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  none: { label: 'No Visual', color: 'bg-muted text-muted-foreground' },
  suggested: { label: 'Visual Suggested', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  approved: { label: 'Visual Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  rework_needed: { label: 'Rework Needed', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  ready_for_design: { label: 'Ready for Design', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  ready_for_publishing: { label: 'Ready for Publishing', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
};

const VISUAL_TYPES = [
  'single_image', 'carousel', 'quote_card', 'framework_card', 'event_promo',
  'workshop_promo', 'book_promo', 'infographic', 'article_cover', 'video_storyboard', 'document_post',
];

const VISUAL_TYPE_ICONS: Record<string, string> = {
  single_image: '🖼️', carousel: '🎠', quote_card: '💬', framework_card: '🔷',
  event_promo: '🎪', workshop_promo: '🛠️', book_promo: '📖', infographic: '📊',
  article_cover: '📰', video_storyboard: '🎬', document_post: '📄',
};

/**
 * Try to resolve a brand icon from recommended_assets or visual_concept fields.
 * Scans for SPIRAL principle/zone keywords.
 */
function resolveRecommendedAssetIcon(item: any): string | null {
  const searchFields = [
    ...(item.recommended_assets || []),
    item.visual_concept || '',
    item.image_direction || '',
    item.working_title || '',
  ].join(' ').toLowerCase();

  // Check for principle keywords
  const principleKeywords = ['synergize', 'provide', 'inspect', 'respond', 'act & accept', 'act_accept', 'learn'];
  for (const kw of principleKeywords) {
    if (searchFields.includes(kw)) return resolveBrandIcon(kw);
  }

  // Check for zone keywords
  const zoneKeywords = ['spiraling_up', 'spiralling up', 'spiraling up', 'spiraling_down', 'spiralling down', 'spiraling down', 'stagnating'];
  for (const kw of zoneKeywords) {
    if (searchFields.includes(kw)) return resolveBrandIcon(kw.replace(/\s+/g, '_'));
  }

  return null;
}

export default function VisualBriefPanel({ item }: { item: any }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const updateItem = useUpdateEditorialItem();
  const regenerateVisual = useRegenerateVisual();

  const visualStatus = VISUAL_STATUS_CONFIG[item.visual_status] || VISUAL_STATUS_CONFIG.none;
  const hasVisual = item.visual_type && item.visual_type !== '';
  const matchedIcon = resolveRecommendedAssetIcon(item);
  const matchedIllustration = (() => {
    const fields = [
      ...(item.recommended_assets || []),
      item.visual_concept || '',
      item.working_title || '',
    ].join(' ').toLowerCase();
    const keywords = ['synergize', 'provide', 'inspect', 'respond', 'act & accept', 'act_accept', 'learn',
      'spiraling_up', 'spiraling_down', 'stagnating'];
    for (const kw of keywords) {
      if (fields.includes(kw)) return resolveBrandIllustration(kw.replace(/\s+/g, '_'));
    }
    return null;
  })();

  const handleSave = () => {
    const updates: { id: string } & Record<string, unknown> = {
      id: item.id,
      visual_type: form.visual_type,
      visual_concept: form.visual_concept,
      backup_visual_concept: form.backup_visual_concept,
      backup_visual_type: form.backup_visual_type,
      visual_rationale: form.visual_rationale,
      visual_layout: form.visual_layout,
      image_direction: form.image_direction,
      visual_headline: form.visual_headline,
      visual_subheadline: form.visual_subheadline,
      cta_placement: form.cta_placement,
      format_ratio: form.format_ratio,
      recommended_assets: form.recommended_assets,
      visual_notes: form.visual_notes,
    };
    updateItem.mutate(updates, {
      onSuccess: () => { toast.success('Visual brief saved'); setEditing(false); },
    });
  };

  const handleApproveVisual = () => {
    updateItem.mutate(
      { id: item.id, visual_status: 'approved' },
      { onSuccess: () => toast.success('Visual approved ✓') }
    );
  };

  const handleRequestRework = () => {
    updateItem.mutate(
      { id: item.id, visual_status: 'rework_needed' },
      { onSuccess: () => toast.success('Visual marked for rework') }
    );
  };

  const handleRegenerate = () => {
    regenerateVisual.mutate(item, {
      onSuccess: () => toast.success('New visual direction generated'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
    });
  };

  const handleMarkReady = (status: string) => {
    updateItem.mutate(
      { id: item.id, visual_status: status },
      { onSuccess: () => toast.success(`Status updated`) }
    );
  };

  if (!hasVisual && !editing) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-6 text-center">
          <Image className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No visual direction yet</p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerateVisual.isPending} className="gap-1.5">
              {regenerateVisual.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Palette className="w-3.5 h-3.5" />}
              Generate Visual
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Add Manually
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4" /> Visual Direction
          </CardTitle>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${visualStatus.color}`}>
            {visualStatus.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Brand asset match indicator */}
        {matchedIcon && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-3">
            <img src={matchedIcon} alt="Official brand asset" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-300">✅ Official Brand Asset Matched</p>
              <p className="text-[10px] text-muted-foreground">This visual references an official SPIRAL icon from the Brand Kit.</p>
            </div>
          </div>
        )}

        {/* Matched illustration preview */}
        {matchedIllustration && (
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-2">📎 Official Illustration (Martin Tognola)</p>
            <img src={matchedIllustration} alt="Official illustration" className="rounded-lg max-h-32 object-contain" />
          </div>
        )}

        {/* Visual Canvas Preview */}
        <div className="bg-muted/30 rounded-lg border p-4 space-y-3">
          {/* Visual type & format */}
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <Select value={form.visual_type || ''} onValueChange={v => setForm((f: any) => ({ ...f, visual_type: v }))}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Visual type" /></SelectTrigger>
                <SelectContent>
                  {VISUAL_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{VISUAL_TYPE_ICONS[t] || '📌'} {t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className="gap-1">
                {VISUAL_TYPE_ICONS[item.visual_type] || '📌'} {(item.visual_type || '').replace(/_/g, ' ')}
              </Badge>
            )}
            {editing ? (
              <Input className="w-24" value={form.format_ratio || ''} onChange={e => setForm((f: any) => ({ ...f, format_ratio: e.target.value }))} placeholder="e.g. 1:1" />
            ) : item.format_ratio && (
              <Badge variant="outline" className="gap-1">
                <Monitor className="w-3 h-3" /> {item.format_ratio}
              </Badge>
            )}
          </div>

          {/* Visual headline mock */}
          <div className="bg-background rounded-lg border p-4 min-h-[120px] flex flex-col justify-between">
            <div>
              {editing ? (
                <Input className="font-display font-bold text-lg border-none shadow-none p-0 h-auto" value={form.visual_headline || ''} onChange={e => setForm((f: any) => ({ ...f, visual_headline: e.target.value }))} placeholder="Visual headline..." />
              ) : (
                <p className="font-display font-bold text-lg">{item.visual_headline || 'No headline'}</p>
              )}
              {editing ? (
                <Input className="text-sm text-muted-foreground border-none shadow-none p-0 h-auto mt-1" value={form.visual_subheadline || ''} onChange={e => setForm((f: any) => ({ ...f, visual_subheadline: e.target.value }))} placeholder="Subheadline..." />
              ) : item.visual_subheadline && (
                <p className="text-sm text-muted-foreground mt-1">{item.visual_subheadline}</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {matchedIcon ? (
                  <img src={matchedIcon} alt="" className="w-4 h-4 object-contain" />
                ) : (
                  <Image className="w-3 h-3" />
                )}
                <span>{item.image_direction ? 'Illustration area' : 'Image placeholder'}</span>
              </div>
              {item.cta_placement && (
                <Badge variant="outline" className="text-[10px]">
                  <Target className="w-2.5 h-2.5 mr-1" /> CTA: {item.cta_placement}
                </Badge>
              )}
            </div>
          </div>

          {/* Detail fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Visual Concept
              </p>
              {editing ? (
                <Textarea rows={2} value={form.visual_concept || ''} onChange={e => setForm((f: any) => ({ ...f, visual_concept: e.target.value }))} />
              ) : (
                <p className="text-sm">{item.visual_concept || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Layout className="w-3 h-3" /> Layout
              </p>
              {editing ? (
                <Textarea rows={2} value={form.visual_layout || ''} onChange={e => setForm((f: any) => ({ ...f, visual_layout: e.target.value }))} />
              ) : (
                <p className="text-sm">{item.visual_layout || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Image className="w-3 h-3" /> Image Direction
              </p>
              {editing ? (
                <Textarea rows={2} value={form.image_direction || ''} onChange={e => setForm((f: any) => ({ ...f, image_direction: e.target.value }))} />
              ) : (
                <p className="text-sm">{item.image_direction || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Type className="w-3 h-3" /> CTA Placement
              </p>
              {editing ? (
                <Input value={form.cta_placement || ''} onChange={e => setForm((f: any) => ({ ...f, cta_placement: e.target.value }))} />
              ) : (
                <p className="text-sm">{item.cta_placement || '—'}</p>
              )}
            </div>
          </div>

          {/* Recommended assets */}
          {(item.recommended_assets?.length > 0 || editing) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Recommended Brand Assets</p>
              <div className="flex flex-wrap gap-1.5">
                {(editing ? form.recommended_assets : item.recommended_assets || []).map((asset: string, i: number) => {
                  const assetIcon = resolveBrandIcon(asset);
                  return (
                    <Badge key={i} variant="outline" className="text-[10px] gap-1">
                      {assetIcon ? (
                        <img src={assetIcon} alt="" className="w-3 h-3 object-contain" />
                      ) : (
                        '🎨'
                      )}
                      {asset}
                      {editing && (
                        <button onClick={() => setForm((f: any) => ({ ...f, recommended_assets: f.recommended_assets.filter((_: any, idx: number) => idx !== i) }))} className="hover:text-destructive">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Backup visual concept */}
          {(item.backup_visual_concept || editing) && (
            <div className="bg-accent/30 rounded-lg border border-accent/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                🔄 Backup Visual Concept
              </p>
              {editing ? (
                <div className="space-y-2">
                  <Select value={form.backup_visual_type || ''} onValueChange={v => setForm((f: any) => ({ ...f, backup_visual_type: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Backup type" /></SelectTrigger>
                    <SelectContent>
                      {VISUAL_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{VISUAL_TYPE_ICONS[t] || '📌'} {t.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea rows={2} value={form.backup_visual_concept || ''} onChange={e => setForm((f: any) => ({ ...f, backup_visual_concept: e.target.value }))} placeholder="Alternative visual direction..." />
                </div>
              ) : (
                <div>
                  {item.backup_visual_type && (
                    <Badge variant="outline" className="text-[10px] mb-1 gap-1">
                      {VISUAL_TYPE_ICONS[item.backup_visual_type] || '📌'} {item.backup_visual_type.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  <p className="text-sm">{item.backup_visual_concept}</p>
                </div>
              )}
              {!editing && item.backup_visual_concept && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-xs gap-1"
                  onClick={() => {
                    updateItem.mutate({
                      id: item.id,
                      visual_concept: item.backup_visual_concept,
                      visual_type: item.backup_visual_type || item.visual_type,
                      backup_visual_concept: item.visual_concept,
                      backup_visual_type: item.visual_type,
                    }, { onSuccess: () => toast.success('Swapped to backup visual') });
                  }}
                >
                  <RefreshCw className="w-3 h-3" /> Use This Instead
                </Button>
              )}
            </div>
          )}

          {/* Visual rationale */}
          {(item.visual_rationale || editing) && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">💡 Visual Rationale</p>
              {editing ? (
                <Textarea rows={2} value={form.visual_rationale || ''} onChange={e => setForm((f: any) => ({ ...f, visual_rationale: e.target.value }))} />
              ) : (
                <p className="text-xs text-muted-foreground">{item.visual_rationale}</p>
              )}
            </div>
          )}

          {/* Visual notes */}
          {editing && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Visual Notes</p>
              <Textarea rows={2} value={form.visual_notes || ''} onChange={e => setForm((f: any) => ({ ...f, visual_notes: e.target.value }))} placeholder="Any notes for the designer..." />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={updateItem.isPending} className="gap-1.5">
                {updateItem.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Visual Brief
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(item); }}>Cancel</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => { setForm(item); setEditing(true); }} className="gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Edit Visual
              </Button>
              {(item.visual_status === 'suggested' || item.visual_status === 'rework_needed') && (
                <Button size="sm" variant="outline" onClick={handleApproveVisual} className="gap-1.5 text-green-600">
                  <Check className="w-3.5 h-3.5" /> Approve Visual
                </Button>
              )}
              {item.visual_status === 'suggested' && (
                <Button size="sm" variant="ghost" onClick={handleRequestRework} className="gap-1.5 text-orange-500">
                  <X className="w-3.5 h-3.5" /> Request Rework
                </Button>
              )}
              {item.visual_status === 'approved' && (
                <Button size="sm" variant="outline" onClick={() => handleMarkReady('ready_for_design')} className="gap-1.5 text-purple-600">
                  <Palette className="w-3.5 h-3.5" /> Ready for Design
                </Button>
              )}
              {item.visual_status === 'ready_for_design' && (
                <Button size="sm" variant="outline" onClick={() => handleMarkReady('ready_for_publishing')} className="gap-1.5 text-emerald-600">
                  <Check className="w-3.5 h-3.5" /> Ready for Publishing
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerateVisual.isPending} className="gap-1.5">
                {regenerateVisual.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Regenerate Visual
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
