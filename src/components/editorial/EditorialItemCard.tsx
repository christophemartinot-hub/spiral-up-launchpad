import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RefreshCw,
  Edit3,
  Calendar,
  Loader2,
  Info,
  Palette,
} from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateEditorialItem, useRegenerateItem } from '@/hooks/use-editorial';
import { toast } from 'sonner';
import VisualBriefPanel from './VisualBriefPanel';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  suggested: { label: 'Suggested', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
};

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: '💼',
  blog: '📝',
  email: '✉️',
  instagram: '📸',
  twitter: '𝕏',
  facebook: '👤',
  youtube: '▶️',
};

export default function EditorialItemCard({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const updateItem = useUpdateEditorialItem();
  const regenerate = useRegenerateItem();

  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.suggested;

  const handleApprove = () => {
    updateItem.mutate(
      { id: item.id, status: 'approved' },
      { onSuccess: () => toast.success('Content approved ✓') }
    );
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    updateItem.mutate(
      { id: item.id, status: 'rejected', rejection_reason: rejectionReason },
      {
        onSuccess: () => {
          toast.success('Content rejected');
          setShowRejectInput(false);
          setRejectionReason('');
        },
      }
    );
  };

  const handleRegenerate = () => {
    regenerate.mutate(item, {
      onSuccess: () => toast.success('Content regenerated with fresh angle'),
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to regenerate'),
    });
  };

  const handleSaveEdit = () => {
    const { id, created_at, updated_at, plan_id, ...fields } = form;
    updateItem.mutate(
      { id: item.id, ...fields },
      {
        onSuccess: () => {
          toast.success('Edits saved');
          setEditing(false);
        },
      }
    );
  };

  const handleSchedule = () => {
    updateItem.mutate(
      { id: item.id, status: 'scheduled' },
      { onSuccess: () => toast.success('Content scheduled') }
    );
  };

  const handleMoveDate = (newDate: string) => {
    updateItem.mutate(
      { id: item.id, publish_date: newDate },
      { onSuccess: () => toast.success('Date updated') }
    );
  };

  return (
    <Card className={`shadow-card overflow-hidden transition-all ${item.status === 'approved' ? 'border-green-200 dark:border-green-800' : ''}`}>
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="text-xl flex-shrink-0">{CHANNEL_ICONS[item.channel] || '📌'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConf.color}`}>
              {statusConf.label}
            </span>
            <Badge variant="outline" className="text-[10px]">{item.content_format}</Badge>
            {item.content_pillar && <Badge variant="secondary" className="text-[10px]">{item.content_pillar}</Badge>}
            {item.visual_type && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Palette className="w-2.5 h-2.5" /> {item.visual_type.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
          <p className="font-display font-semibold text-sm mt-1 truncate">{item.working_title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <Calendar className="w-3 h-3 inline mr-1" />
            {format(new Date(item.publish_date), 'EEE, MMM d')} • {item.channel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {item.status === 'suggested' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={(e) => { e.stopPropagation(); handleApprove(); }}>
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); setShowRejectInput(true); setExpanded(true); }}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <CardContent className="border-t pt-4 space-y-4">
          {/* Key message & objective */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Key Message</p>
              {editing ? (
                <Input value={form.key_message || ''} onChange={e => setForm((f: any) => ({ ...f, key_message: e.target.value }))} />
              ) : (
                <p className="text-sm">{item.key_message || '—'}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Objective</p>
              {editing ? (
                <Input value={form.objective || ''} onChange={e => setForm((f: any) => ({ ...f, objective: e.target.value }))} />
              ) : (
                <p className="text-sm">{item.objective || '—'}</p>
              )}
            </div>
          </div>

          {/* Post angle */}
          {(item.post_angle || editing) && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Post Angle / Hook</p>
              {editing ? (
                <Textarea rows={2} value={form.post_angle || ''} onChange={e => setForm((f: any) => ({ ...f, post_angle: e.target.value }))} />
              ) : (
                <p className="text-sm italic">{item.post_angle}</p>
              )}
            </div>
          )}

          {/* Draft content */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Draft Content</p>
            {editing ? (
              <Textarea rows={8} value={form.draft_content || ''} onChange={e => setForm((f: any) => ({ ...f, draft_content: e.target.value }))} className="font-mono text-xs" />
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                {item.draft_content || 'No draft yet.'}
              </div>
            )}
          </div>

          {/* CTA & carousel idea */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Suggested CTA</p>
              {editing ? (
                <Input value={form.suggested_cta || ''} onChange={e => setForm((f: any) => ({ ...f, suggested_cta: e.target.value }))} />
              ) : (
                <p className="text-sm">{item.suggested_cta || item.cta || '—'}</p>
              )}
            </div>
            {(item.carousel_idea || editing) && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Carousel / Visual Idea</p>
                {editing ? (
                  <Input value={form.carousel_idea || ''} onChange={e => setForm((f: any) => ({ ...f, carousel_idea: e.target.value }))} />
                ) : (
                  <p className="text-sm">{item.carousel_idea || '—'}</p>
                )}
              </div>
            )}
          </div>

          {/* Brand alignment */}
          {item.brand_alignment && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Why this suggestion</p>
              <p className="text-xs text-muted-foreground">{item.brand_alignment}</p>
            </div>
          )}

          {/* Related offer */}
          {item.related_offer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Related Offer</p>
              <Badge variant="outline">{item.related_offer}</Badge>
            </div>
          )}

          {/* Rejection input */}
          {showRejectInput && (
            <div className="space-y-2 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              <p className="text-xs font-medium text-red-700 dark:text-red-300">Reason for rejection (helps AI improve)</p>
              <Textarea
                rows={2}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Too generic, already covered this topic..."
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Date picker for moving */}
          {editing && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Publication Date</p>
              <Input
                type="date"
                value={form.publish_date || ''}
                onChange={e => setForm((f: any) => ({ ...f, publish_date: e.target.value }))}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSaveEdit} disabled={updateItem.isPending} className="gap-1.5">
                  {updateItem.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Edits
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setForm(item); }}>Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => { setForm(item); setEditing(true); }} className="gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Button>
                {(item.status === 'suggested' || item.status === 'under_review') && (
                  <Button size="sm" variant="outline" onClick={handleApprove} className="gap-1.5 text-green-600">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                )}
                {item.status === 'approved' && (
                  <Button size="sm" variant="outline" onClick={handleSchedule} className="gap-1.5 text-purple-600">
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={regenerate.isPending} className="gap-1.5">
                  {regenerate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Regenerate
                </Button>
                {!showRejectInput && (item.status === 'suggested' || item.status === 'under_review') && (
                  <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(true)} className="gap-1.5 text-red-500">
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
