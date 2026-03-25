import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  ChevronDown, ChevronUp, Check, X, RefreshCw, Edit3, Calendar,
  Loader2, Info, Palette, Lightbulb, Send,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useUpdateEditorialItem, useRegenerateItem } from '@/hooks/use-editorial';
import { useRecordFeedback } from '@/hooks/use-feedback';
import { toast } from 'sonner';
import VisualBriefPanel from './VisualBriefPanel';
import { resolveBrandIcon } from '@/lib/brand-assets';
import { supabase } from '@/integrations/supabase/client';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  suggested: { label: 'Suggested', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  scheduled: { label: 'Scheduled', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
};

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: '💼', blog: '📝', email: '✉️', instagram: '📸',
  twitter: '𝕏', facebook: '👤', youtube: '▶️',
};

export default function EditorialItemCard({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(item);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sendingToMake, setSendingToMake] = useState(false);
  const [publishingLinkedIn, setPublishingLinkedIn] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState(item.image_url || '');
  const [savingImage, setSavingImage] = useState(false);
  const queryClient = useQueryClient();
  const updateItem = useUpdateEditorialItem();
  const regenerate = useRegenerateItem();
  const recordFeedback = useRecordFeedback();

  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.suggested;

  const buildFeedback = (actionType: string, finalForm?: any) => ({
    editorial_item_id: item.id,
    plan_id: item.plan_id,
    action_type: actionType,
    original_title: item.working_title || '',
    original_content: (item.draft_content || '').slice(0, 2000),
    original_cta: item.suggested_cta || item.cta || '',
    original_visual_type: item.visual_type || '',
    original_content_pillar: item.content_pillar || '',
    original_topic: item.key_message || item.working_title || '',
    final_title: finalForm?.working_title || item.working_title || '',
    final_content: (finalForm?.draft_content || item.draft_content || '').slice(0, 2000),
    final_cta: finalForm?.suggested_cta || finalForm?.cta || item.suggested_cta || item.cta || '',
    final_visual_type: finalForm?.visual_type || item.visual_type || '',
    final_content_pillar: finalForm?.content_pillar || item.content_pillar || '',
    title_changed: finalForm ? (finalForm.working_title !== item.working_title) : false,
    content_changed: finalForm ? (finalForm.draft_content !== item.draft_content) : false,
    cta_changed: finalForm ? ((finalForm.suggested_cta || finalForm.cta) !== (item.suggested_cta || item.cta)) : false,
    visual_changed: finalForm ? (finalForm.visual_type !== item.visual_type) : false,
    pillar_changed: finalForm ? (finalForm.content_pillar !== item.content_pillar) : false,
    channel: item.channel || '',
    content_format: item.content_format || '',
  });

  const handleApprove = () => {
    updateItem.mutate(
      { id: item.id, status: 'approved' },
      {
        onSuccess: () => {
          recordFeedback.mutate(buildFeedback('approved_clean'));
          toast.success('Content approved ✓');
        },
      }
    );
  };

  const handleReject = () => {
    if (!showRejectInput) { setShowRejectInput(true); return; }
    updateItem.mutate(
      { id: item.id, status: 'rejected', rejection_reason: rejectionReason },
      {
        onSuccess: () => {
          recordFeedback.mutate({
            ...buildFeedback('rejected'),
            rejection_reason: rejectionReason,
          });
          toast.success('Content rejected');
          setShowRejectInput(false);
          setRejectionReason('');
        },
      }
    );
  };

  const handleRegenerate = () => {
    regenerate.mutate(item, {
      onSuccess: () => {
        recordFeedback.mutate(buildFeedback('regenerated'));
        toast.success('Content regenerated with fresh angle');
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to regenerate'),
    });
  };

  const handleSaveEdit = () => {
    const { id, created_at, updated_at, plan_id, ...fields } = form;
    updateItem.mutate(
      { id: item.id, ...fields },
      {
        onSuccess: () => {
          recordFeedback.mutate(buildFeedback('approved_edited', form));
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

  const handlePublishSocial = async () => {
    setPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('publish-social', {
        body: { editorialItemId: item.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.success) {
        toast.success('Published successfully ✅');
      } else {
        const results = data?.results || {};
        const errors = Object.entries(results)
          .filter(([, r]: [string, any]) => !r.success)
          .map(([p, r]: [string, any]) => `${p}: ${r.error}`)
          .join('; ');
        throw new Error(errors || 'Publishing failed');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };


  const handleSendToMake = async () => {
    setSendingToMake(true);
    try {
      const { data, error } = await supabase.functions.invoke('publish-to-make', {
        body: { item_id: item.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Sent to Make for publishing ✅');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send to Make');
    } finally {
      setSendingToMake(false);
    }
  };

  const handlePublishLinkedIn = async () => {
    setPublishingLinkedIn(true);
    try {
      const { data, error } = await supabase.functions.invoke('publish-to-linkedin', {
        body: { item_id: item.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.skipped) {
        toast.info(data.reason || 'Skipped — not a LinkedIn item');
      } else {
        toast.success('Published to LinkedIn ✅');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'LinkedIn publish failed');
    } finally {
      setPublishingLinkedIn(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('publish-social', {
        body: { editorialItemId: item.id, action: 'unpublish' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Unpublished — status reset to approved');
      queryClient.invalidateQueries({ queryKey: ['editorial-items'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-items-all'] });
      queryClient.invalidateQueries({ queryKey: ['editorial-items-pending'] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Card className={`shadow-card overflow-hidden transition-all ${item.status === 'approved' ? 'border-green-200 dark:border-green-800' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        {(() => {
          const brandIcon = resolveBrandIcon(item.content_pillar || item.working_title || '');
          return brandIcon ? (
            <img src={brandIcon} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded" />
          ) : (
            <div className="text-xl flex-shrink-0">{CHANNEL_ICONS[item.channel] || '📌'}</div>
          );
        })()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusConf.color}`}>{statusConf.label}</span>
            <Badge variant="outline" className="text-[10px]">{item.content_format}</Badge>
            {item.content_pillar && <Badge variant="secondary" className="text-[10px]">{item.content_pillar}</Badge>}
            {item.visual_type && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <Palette className="w-2.5 h-2.5" /> {item.visual_type.replace(/_/g, ' ')}
              </Badge>
            )}
            {item.outcome_score > 0 && (
              <Badge className={`text-[10px] ${
                item.outcome_score >= 7 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                item.outcome_score >= 4 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                'bg-muted text-muted-foreground'
              }`}>
                {item.outcome_score >= 7 ? '🎯 High' : item.outcome_score >= 4 ? '📊 Medium' : '📉 Low'} Impact
              </Badge>
            )}
          </div>
          <p className="font-display font-semibold text-sm mt-1 truncate">{item.working_title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <Calendar className="w-3 h-3 inline mr-1" />
            {format(parseISO(item.publish_date), 'EEE, MMM d')}{item.publish_time ? ` at ${item.publish_time}` : ''} • {item.channel}
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

      {expanded && (
        <CardContent className="border-t pt-4 space-y-4">
          {/* Hero image preview — prominent for blogs */}
          {item.image_url && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                🖼️ {item.channel === 'blog' ? 'Blog Hero Image' : 'Visual Preview'}
              </p>
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                <img
                  src={item.image_url}
                  alt={`Visual for: ${item.working_title}`}
                  className="w-full max-h-72 object-cover"
                />
              </div>
            </div>
          )}

          {/* Suggestion rationale */}
          {item.suggestion_rationale && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Why this is suggested
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{item.suggestion_rationale}</p>
            </div>
          )}

          {/* Outcome Definition */}
          {(item.audience_challenge || item.insight_delivered || item.outcome_score > 0 || editing) && (
            <div className="bg-primary/5 border border-primary/15 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-display font-semibold text-primary flex items-center gap-1.5">
                  🎯 Outcome Definition
                </p>
                {item.outcome_score > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.outcome_score >= 7 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    item.outcome_score >= 4 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    Score: {item.outcome_score}/10
                  </span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Audience Challenge</p>
                  {editing ? (
                    <Input value={form.audience_challenge || ''} onChange={e => setForm((f: any) => ({ ...f, audience_challenge: e.target.value }))} placeholder="What problem does the audience face?" />
                  ) : (
                    <p className="text-xs">{item.audience_challenge || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Insight Delivered</p>
                  {editing ? (
                    <Input value={form.insight_delivered || ''} onChange={e => setForm((f: any) => ({ ...f, insight_delivered: e.target.value }))} placeholder="Key idea the audience gains" />
                  ) : (
                    <p className="text-xs">{item.insight_delivered || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Practical Takeaway</p>
                  {editing ? (
                    <Input value={form.practical_takeaway || ''} onChange={e => setForm((f: any) => ({ ...f, practical_takeaway: e.target.value }))} placeholder="What can they apply?" />
                  ) : (
                    <p className="text-xs">{item.practical_takeaway || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Expected Action</p>
                  {editing ? (
                    <Input value={form.expected_audience_action || ''} onChange={e => setForm((f: any) => ({ ...f, expected_audience_action: e.target.value }))} placeholder="save, share, follow..." />
                  ) : (
                    <p className="text-xs capitalize">{(item.expected_audience_action || '—').replace(/_/g, ' ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

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

          {item.brand_alignment && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
              <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Brand alignment</p>
              <p className="text-xs text-muted-foreground">{item.brand_alignment}</p>
            </div>
          )}

          {item.related_offer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Related Offer</p>
              <Badge variant="outline">{item.related_offer}</Badge>
            </div>
          )}

          <VisualBriefPanel item={item} />

          {/* Image URL attachment */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">📷 Attached Image URL</p>
            <p className="text-[10px] text-muted-foreground">Paste a direct image URL, or an Unsplash photo page URL — it will be auto-converted.</p>
            <div className="flex gap-2">
              <Input
                value={imageUrlInput}
                onChange={e => setImageUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/photo-... or https://unsplash.com/photos/..."
                className="text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={savingImage || imageUrlInput === (item.image_url || '')}
                onClick={async () => {
                  setSavingImage(true);
                  try {
                    let finalUrl = imageUrlInput.trim();
                    // Auto-convert Unsplash page URLs to direct image URLs
                    const unsplashMatch = finalUrl.match(/unsplash\.com\/photos\/(?:[^/?]+-)?([a-zA-Z0-9_-]+)(?:\?.*)?$/);
                    if (unsplashMatch) {
                      const photoId = unsplashMatch[1];
                      finalUrl = `https://images.unsplash.com/photo-${photoId}?w=1200&q=80&auto=format&fit=crop`;
                      setImageUrlInput(finalUrl);
                    }
                    updateItem.mutate(
                      { id: item.id, image_url: finalUrl || '' },
                      {
                        onSuccess: () => {
                          toast.success('Image URL saved');
                          setSavingImage(false);
                        },
                        onError: (err) => {
                          toast.error(err instanceof Error ? err.message : 'Failed to save');
                          setSavingImage(false);
                        },
                      }
                    );
                  } catch {
                    setSavingImage(false);
                  }
                }}
              >
                {savingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </Button>
            </div>
            {item.image_url && !expanded && (
              <img
                src={item.image_url}
                alt="Attached visual"
                className="rounded-lg max-h-20 object-cover border border-border"
              />
            )}
          </div>

          {showRejectInput && (
            <div className="space-y-2 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              <p className="text-xs font-medium text-red-700 dark:text-red-300">Reason for rejection (helps AI improve)</p>
              <Textarea rows={2} value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="e.g. Too generic, already covered this topic..." />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowRejectInput(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {editing && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Publication Date</p>
              <Input type="date" value={form.publish_date || ''} onChange={e => setForm((f: any) => ({ ...f, publish_date: e.target.value }))} />
            </div>
          )}

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
                {(item.status === 'approved' || item.status === 'scheduled') && (
                  <>
                    {item.status === 'approved' && (
                      <Button size="sm" variant="outline" onClick={handleSchedule} className="gap-1.5 text-purple-600">
                        <Calendar className="w-3.5 h-3.5" /> Schedule
                      </Button>
                    )}
                    <Button size="sm" onClick={handlePublishSocial} disabled={publishing} className="gap-1.5">
                      {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Publish to Social
                    </Button>
                    {item.status === 'scheduled' && item.channel === 'linkedin' && (
                      <Button size="sm" variant="outline" onClick={handlePublishLinkedIn} disabled={publishingLinkedIn} className="gap-1.5 text-blue-600">
                        {publishingLinkedIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Publish to LinkedIn
                      </Button>
                    )}
                  </>
                )}
                {item.status === 'published' && (
                  <Button size="sm" variant="outline" onClick={handleUnpublish} disabled={publishing} className="gap-1.5 text-red-500">
                    {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Unpublish
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
