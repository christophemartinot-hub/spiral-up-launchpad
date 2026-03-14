import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Check, X, Loader2, CheckCheck, Eye, ChevronLeft, ChevronRight,
  Palette, Calendar, Target, Lightbulb, Instagram, Linkedin, Facebook, PenLine, Globe,
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { useEditorialItems, useUpdateEditorialItem } from '@/hooks/use-editorial';
import { useRecordFeedback } from '@/hooks/use-feedback';
import { resolveBrandIcon, resolveBrandIllustration } from '@/lib/brand-assets';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import VisualBriefPanel from './VisualBriefPanel';

const CHANNEL_ICON_COMPONENTS: Record<string, { icon: any; color: string }> = {
  instagram: { icon: Instagram, color: 'text-pink-500' },
  linkedin: { icon: Linkedin, color: 'text-blue-600' },
  facebook: { icon: Facebook, color: 'text-blue-500' },
  blog: { icon: PenLine, color: 'text-accent-foreground' },
  email: { icon: Globe, color: 'text-muted-foreground' },
  twitter: { icon: Globe, color: 'text-foreground' },
  youtube: { icon: Globe, color: 'text-destructive' },
};

const ChannelIcon = ({ channel, size = 12 }: { channel: string; size?: number }) => {
  const entry = CHANNEL_ICON_COMPONENTS[channel];
  if (!entry) return <Globe className="text-muted-foreground" style={{ width: size, height: size }} />;
  const Icon = entry.icon;
  return <Icon className={entry.color} style={{ width: size, height: size }} />;
};

const VISUAL_TYPE_ICONS: Record<string, string> = {
  single_image: '🖼️', carousel: '🎠', quote_card: '💬', framework_card: '🔷',
  event_promo: '🎪', workshop_promo: '🛠️', book_promo: '📖', infographic: '📊',
  article_cover: '📰', video_storyboard: '🎬', document_post: '📄',
};

interface Props {
  activePlanId: string | null;
}

export default function WeekReviewBoard({ activePlanId }: Props) {
  const { data: items, isLoading } = useEditorialItems(activePlanId);
  const updateItem = useUpdateEditorialItem();
  const recordFeedback = useRecordFeedback();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<any>(null);
  const [approving, setApproving] = useState(false);

  const weekStart = useMemo(() => {
    if (!items || items.length === 0) return startOfWeek(new Date(), { weekStartsOn: 1 });
    const earliest = items.reduce((min: string, i: any) => i.publish_date < min ? i.publish_date : min, items[0].publish_date);
    return startOfWeek(addWeeks(parseISO(earliest), weekOffset), { weekStartsOn: 1 });
  }, [items, weekOffset]);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const itemsByDay = useMemo(() => {
    if (!items) return new Map();
    const map = new Map<string, any[]>();
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd');
      map.set(key, items.filter((i: any) => {
        try { return isSameDay(parseISO(i.publish_date), day); } catch { return false; }
      }));
    }
    return map;
  }, [items, days]);

  const suggestedItems = useMemo(() =>
    items?.filter((i: any) => i.status === 'suggested' || i.status === 'under_review') || [],
  [items]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllSuggested = () => {
    if (selected.size === suggestedItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestedItems.map((i: any) => i.id)));
    }
  };

  const handleBatchApprove = async () => {
    if (selected.size === 0) return;
    setApproving(true);
    let count = 0;
    for (const id of selected) {
      const item = items?.find((i: any) => i.id === id);
      if (!item || (item.status !== 'suggested' && item.status !== 'under_review')) continue;
      try {
        await new Promise<void>((resolve, reject) => {
          updateItem.mutate({ id, status: 'approved' }, {
            onSuccess: () => {
              recordFeedback.mutate({
                editorial_item_id: id,
                plan_id: item.plan_id,
                action_type: 'approved_clean',
                original_title: item.working_title || '',
                original_content: (item.draft_content || '').slice(0, 2000),
                original_cta: item.suggested_cta || item.cta || '',
                original_visual_type: item.visual_type || '',
                original_content_pillar: item.content_pillar || '',
                original_topic: item.key_message || item.working_title || '',
                channel: item.channel || '',
                content_format: item.content_format || '',
              });
              count++;
              resolve();
            },
            onError: reject,
          });
        });
      } catch { /* continue */ }
    }
    toast.success(`Approved ${count} item${count !== 1 ? 's' : ''} ✓`);
    setSelected(new Set());
    setApproving(false);
  };

  const resolveIllustration = (item: any): string | null => {
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
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Eye className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No editorial items to review. Generate a plan first from the Agenda tab.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Week navigation & batch actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-display font-semibold min-w-[180px] text-center">
              {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {suggestedItems.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={selectAllSuggested} className="gap-1.5 text-xs">
                  <CheckCheck className="w-3.5 h-3.5" />
                  {selected.size === suggestedItems.length ? 'Deselect All' : `Select All (${suggestedItems.length})`}
                </Button>
                {selected.size > 0 && (
                  <Button size="sm" onClick={handleBatchApprove} disabled={approving} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                    {approving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve {selected.size} Item{selected.size !== 1 ? 's' : ''}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-3">
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDay.get(key) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div key={key} className="min-h-[180px]">
                {/* Day header */}
                <div className={`text-center pb-1.5 mb-2 border-b ${isToday ? 'border-primary' : 'border-border'}`}>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">{format(day, 'EEE')}</p>
                  <p className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                </div>

                {/* Day items */}
                <div className="space-y-3">
                  {dayItems.map((item: any) => {
                    const illustration = resolveIllustration(item);
                    const icon = resolveBrandIcon(item.content_pillar || item.working_title || '');
                    const isSuggested = item.status === 'suggested' || item.status === 'under_review';
                    const isSelected = selected.has(item.id);
                    const isApproved = item.status === 'approved' || item.status === 'scheduled' || item.status === 'published';
                    const isVisualChannel = ['instagram', 'linkedin', 'facebook', 'blog'].includes(item.channel);

                    return (
                      <Card
                        key={item.id}
                        className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${
                          isSelected ? 'ring-2 ring-green-500 shadow-md' :
                          isApproved ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' : ''
                        }`}
                        onClick={() => setDetailItem(item)}
                      >
                        {/* Visual thumbnail — taller for visual channels */}
                        {illustration ? (
                          <div className={`${isVisualChannel ? 'h-24' : 'h-16'} overflow-hidden bg-muted/30 relative`}>
                            <img src={illustration} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1">
                              <div className="bg-background/80 backdrop-blur-sm rounded-full p-0.5">
                                <ChannelIcon channel={item.channel} size={12} />
                              </div>
                            </div>
                          </div>
                        ) : icon ? (
                          <div className={`${isVisualChannel ? 'h-20' : 'h-14'} bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center relative`}>
                            <img src={icon} alt="" className={`${isVisualChannel ? 'w-10 h-10' : 'w-6 h-6'} object-contain`} />
                            <div className="absolute top-1 left-1">
                              <div className="bg-background/80 backdrop-blur-sm rounded-full p-0.5">
                                <ChannelIcon channel={item.channel} size={12} />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`${isVisualChannel ? 'h-20' : 'h-14'} bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center relative`}>
                            <ChannelIcon channel={item.channel} size={isVisualChannel ? 24 : 16} />
                            {item.visual_headline && (
                              <div className="absolute inset-0 flex items-center justify-center px-2">
                                <p className="text-[8px] font-bold text-center leading-tight text-foreground/70 line-clamp-2">{item.visual_headline}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <CardContent className="p-2.5 space-y-1.5">
                          {/* Channel + visual type + status */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {item.visual_type && (
                              <span className="text-[9px]">{VISUAL_TYPE_ICONS[item.visual_type] || '🎨'}</span>
                            )}
                            {item.content_format && (
                              <span className="text-[8px] text-muted-foreground capitalize">{item.content_format.replace(/_/g, ' ')}</span>
                            )}
                            {item.outcome_score >= 7 && <span className="text-[9px]">🎯</span>}
                            <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ml-auto ${
                              isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                              {item.status === 'suggested' ? 'NEW' : item.status.toUpperCase().slice(0, 3)}
                            </span>
                          </div>

                          {/* Title */}
                          <p className="text-[11px] font-semibold leading-tight line-clamp-2">{item.working_title}</p>

                          {/* Visual concept snippet */}
                          {item.visual_concept && (
                            <p className="text-[9px] text-muted-foreground line-clamp-2 italic">
                              <Palette className="w-2.5 h-2.5 inline mr-0.5" />{item.visual_concept}
                            </p>
                          )}

                          {/* Quick approve checkbox for suggested items */}
                          {isSuggested && (
                            <div className="flex justify-end pt-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                      isSelected
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-muted-foreground/30 hover:border-green-500'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3" />}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {isSelected ? 'Deselect' : 'Select for batch approve'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  {dayItems.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-[9px] text-muted-foreground/50">—</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail dialog */}
        <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {detailItem && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <ChannelIcon channel={detailItem.channel} size={18} />
                    <DialogTitle className="font-display">{detailItem.working_title}</DialogTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge variant="outline" className="text-[10px]">{detailItem.content_format}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{detailItem.content_pillar}</Badge>
                    <span className="text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {format(parseISO(detailItem.publish_date), 'EEE, MMM d')}
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Suggestion rationale */}
                  {detailItem.suggestion_rationale && (
                    <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Why this is suggested
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">{detailItem.suggestion_rationale}</p>
                    </div>
                  )}

                  {/* Outcome */}
                  {(detailItem.audience_challenge || detailItem.insight_delivered) && (
                    <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-display font-semibold text-primary">🎯 Outcome Definition</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div><p className="text-[10px] text-muted-foreground">Challenge</p><p className="text-xs">{detailItem.audience_challenge || '—'}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Insight</p><p className="text-xs">{detailItem.insight_delivered || '—'}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Takeaway</p><p className="text-xs">{detailItem.practical_takeaway || '—'}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Expected Action</p><p className="text-xs capitalize">{(detailItem.expected_audience_action || '—').replace(/_/g, ' ')}</p></div>
                      </div>
                    </div>
                  )}

                  {/* Key message & objective */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><p className="text-xs font-medium text-muted-foreground">Key Message</p><p className="text-sm">{detailItem.key_message || '—'}</p></div>
                    <div><p className="text-xs font-medium text-muted-foreground">Objective</p><p className="text-sm">{detailItem.objective || '—'}</p></div>
                  </div>

                  {/* Post angle */}
                  {detailItem.post_angle && (
                    <div><p className="text-xs font-medium text-muted-foreground">Post Angle</p><p className="text-sm italic">{detailItem.post_angle}</p></div>
                  )}

                  {/* Draft */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Draft Content</p>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {detailItem.draft_content || 'No draft yet.'}
                    </div>
                  </div>

                  {/* CTA */}
                  {(detailItem.suggested_cta || detailItem.cta) && (
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm">{detailItem.suggested_cta || detailItem.cta}</p>
                    </div>
                  )}

                  {/* Visual Brief */}
                  <VisualBriefPanel item={detailItem} />

                  {/* Quick actions */}
                  {(detailItem.status === 'suggested' || detailItem.status === 'under_review') && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          updateItem.mutate({ id: detailItem.id, status: 'approved' }, {
                            onSuccess: () => {
                              recordFeedback.mutate({
                                editorial_item_id: detailItem.id,
                                plan_id: detailItem.plan_id,
                                action_type: 'approved_clean',
                                original_title: detailItem.working_title || '',
                                original_content: (detailItem.draft_content || '').slice(0, 2000),
                                original_cta: detailItem.suggested_cta || detailItem.cta || '',
                                original_visual_type: detailItem.visual_type || '',
                                original_content_pillar: detailItem.content_pillar || '',
                                original_topic: detailItem.key_message || detailItem.working_title || '',
                                channel: detailItem.channel || '',
                                content_format: detailItem.content_format || '',
                              });
                              toast.success('Approved ✓');
                              setDetailItem(null);
                            },
                          });
                        }}
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1.5"
                        onClick={() => {
                          updateItem.mutate({ id: detailItem.id, status: 'rejected' }, {
                            onSuccess: () => {
                              toast.success('Rejected');
                              setDetailItem(null);
                            },
                          });
                        }}
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
