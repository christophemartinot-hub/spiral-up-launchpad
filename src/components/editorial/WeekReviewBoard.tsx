import { useState, useMemo, DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Check, X, Loader2, CheckCheck, Eye, ChevronLeft, ChevronRight,
  Palette, Calendar, Target, Lightbulb, Instagram, Linkedin, Facebook, PenLine, Globe, Home,
  Pencil, Save,
} from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { useAllEditorialItems, useUpdateEditorialItem } from '@/hooks/use-editorial';
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
  newsletter: { icon: Globe, color: 'text-muted-foreground' },
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
  const { data: allItems, isLoading } = useAllEditorialItems();
  const updateItem = useUpdateEditorialItem();
  const recordFeedback = useRecordFeedback();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<any>(null);
  const [approving, setApproving] = useState(false);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  // Always default to current week + offset
  const weekStart = useMemo(() => {
    return startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  }, [weekOffset]);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter items visible in this week (from ALL plans)
  const weekItems = useMemo(() => {
    if (!allItems) return [];
    return allItems.filter((i: any) => {
      try {
        const d = parseISO(i.publish_date);
        return d >= weekStart && d <= weekEnd;
      } catch { return false; }
    });
  }, [allItems, weekStart, weekEnd]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd');
      map.set(key, weekItems.filter((i: any) => {
        try { return isSameDay(parseISO(i.publish_date), day); } catch { return false; }
      }));
    }
    return map;
  }, [weekItems, days]);

  const suggestedItems = useMemo(() =>
    weekItems.filter((i: any) => i.status === 'suggested' || i.status === 'under_review'),
  [weekItems]);

  // Count items in nearby weeks for quick context
  const nearbyWeekCounts = useMemo(() => {
    if (!allItems) return { prev: 0, next: 0 };
    const prevStart = startOfWeek(addWeeks(new Date(), weekOffset - 1), { weekStartsOn: 1 });
    const prevEnd = endOfWeek(prevStart, { weekStartsOn: 1 });
    const nextStart = startOfWeek(addWeeks(new Date(), weekOffset + 1), { weekStartsOn: 1 });
    const nextEnd = endOfWeek(nextStart, { weekStartsOn: 1 });
    return {
      prev: allItems.filter((i: any) => { try { const d = parseISO(i.publish_date); return d >= prevStart && d <= prevEnd; } catch { return false; } }).length,
      next: allItems.filter((i: any) => { try { const d = parseISO(i.publish_date); return d >= nextStart && d <= nextEnd; } catch { return false; } }).length,
    };
  }, [allItems, weekOffset]);

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

  const handleQuickApprove = async (item: any) => {
    try {
      updateItem.mutate({ id: item.id, status: 'approved' }, {
        onSuccess: () => {
          recordFeedback.mutate({
            editorial_item_id: item.id,
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
          toast.success(`"${item.working_title}" approved ✓`);
        },
      });
    } catch { toast.error('Failed to approve'); }
  };

  const handleBatchApprove = async () => {
    if (selected.size === 0) return;
    setApproving(true);
    let count = 0;
    for (const id of selected) {
      const item = weekItems.find((i: any) => i.id === id);
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
      item.content_pillar || '',
      item.key_message || '',
    ].join(' ').toLowerCase();

    if (fields.includes('spiraling down') || fields.includes('spiral down') || fields.includes('spiraling_down')) {
      return resolveBrandIllustration('spiraling_down');
    }
    if (fields.includes('spiraling up') || fields.includes('spiral up') || fields.includes('spiraling_up')) {
      return resolveBrandIllustration('spiraling_up');
    }
    if (fields.includes('stagnat')) {
      return resolveBrandIllustration('stagnating');
    }

    const principles = ['synergize', 'provide', 'inspect', 'respond', 'learn'];
    for (const p of principles) {
      if (fields.includes(p)) return resolveBrandIllustration(p);
    }
    if (fields.includes('act') && fields.includes('accept')) {
      return resolveBrandIllustration('act_accept');
    }

    return null;
  };

  const handleDropToDay = async (e: DragEvent<HTMLDivElement>, targetDateKey: string) => {
    e.preventDefault();
    setDragOverDay(null);
    const itemId = e.dataTransfer.getData('application/editorial-item-id');
    if (!itemId) return;
    const item = (allItems || []).find((i: any) => i.id === itemId);
    if (!item || item.publish_date === targetDateKey) return;
    const statusUpdate = item.status === 'published' ? { status: 'approved' } : {};
    try {
      await updateItem.mutateAsync({ id: itemId, publish_date: targetDateKey, ...statusUpdate });
      const label = new Date(targetDateKey + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      toast.success(`Moved to ${label}`);
    } catch {
      toast.error('Failed to reschedule');
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Week navigation & batch actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              {nearbyWeekCounts.prev > 0 && (
                <TooltipContent side="bottom" className="text-xs">{nearbyWeekCounts.prev} item{nearbyWeekCounts.prev !== 1 ? 's' : ''}</TooltipContent>
              )}
            </Tooltip>

            <span className="text-sm font-display font-semibold min-w-[180px] text-center">
              {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              {nearbyWeekCounts.next > 0 && (
                <TooltipContent side="bottom" className="text-xs">{nearbyWeekCounts.next} item{nearbyWeekCounts.next !== 1 ? 's' : ''}</TooltipContent>
              )}
            </Tooltip>

            {weekOffset !== 0 && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-8" onClick={() => setWeekOffset(0)}>
                <Home className="w-3 h-3" /> Today
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {weekItems.length} item{weekItems.length !== 1 ? 's' : ''} this week
            </Badge>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">Drag to reschedule</span>
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
            const isPast = day < new Date() && !isToday;

            return (
              <div key={key} className={`min-h-[180px] ${isPast ? 'opacity-75' : ''}`}>
                {/* Day header */}
                <div className={`text-center pb-1.5 mb-2 border-b ${isToday ? 'border-primary' : 'border-border'}`}>
                  <p className="text-[10px] uppercase text-muted-foreground font-medium">{format(day, 'EEE')}</p>
                  <p className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
                </div>

                {/* Droppable day column */}
                <div
                  className={`space-y-3 min-h-[120px] rounded-lg p-1 transition-colors ${dragOverDay === key ? 'bg-primary/10 ring-2 ring-inset ring-primary/30' : ''}`}
                  onDrop={(e) => handleDropToDay(e, key)}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverDay(key); }}
                  onDragLeave={() => setDragOverDay(null)}
                >
                  {dayItems.map((item: any) => {
                    const illustration = resolveIllustration(item);
                    const icon = resolveBrandIcon(item.content_pillar || item.working_title || '');
                    const isSuggested = item.status === 'suggested' || item.status === 'under_review';
                    const isSelected = selected.has(item.id);
                    const isApproved = item.status === 'approved' || item.status === 'scheduled';
                    const isPublished = item.status === 'published';
                    const isVisualChannel = ['instagram', 'linkedin', 'facebook', 'blog'].includes(item.channel);

                    return (
                      <Card
                        key={item.id}
                        draggable
                        onDragStart={(e: DragEvent<HTMLDivElement>) => {
                          e.dataTransfer.setData('application/editorial-item-id', item.id);
                          e.dataTransfer.effectAllowed = 'move';
                          (e.currentTarget as HTMLElement).classList.add('opacity-40', 'scale-95');
                        }}
                        onDragEnd={(e: DragEvent<HTMLDivElement>) => {
                          (e.currentTarget as HTMLElement).classList.remove('opacity-40', 'scale-95');
                        }}
                        className={`group/card cursor-grab active:cursor-grabbing transition-all hover:shadow-md overflow-hidden ${
                          isSelected ? 'ring-2 ring-green-500 shadow-md' :
                          isPublished ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' :
                          isApproved ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' : ''
                        }`}
                        onClick={() => setDetailItem(item)}
                      >
                        {/* Visual thumbnail */}
                        {illustration ? (
                          <div className={`${isVisualChannel ? 'h-24' : 'h-16'} overflow-hidden bg-muted/30 relative`}>
                            <img src={illustration} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1">
                              <div className="bg-background/80 backdrop-blur-sm rounded-full p-0.5">
                                <ChannelIcon channel={item.channel} size={12} />
                              </div>
                            </div>
                            {isSuggested && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleQuickApprove(item); }}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity shadow-md hover:bg-green-600"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">Quick approve</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : icon ? (
                          <div className={`${isVisualChannel ? 'h-20' : 'h-14'} bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center relative`}>
                            <img src={icon} alt="" className={`${isVisualChannel ? 'w-10 h-10' : 'w-6 h-6'} object-contain`} />
                            <div className="absolute top-1 left-1">
                              <div className="bg-background/80 backdrop-blur-sm rounded-full p-0.5">
                                <ChannelIcon channel={item.channel} size={12} />
                              </div>
                            </div>
                            {isSuggested && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleQuickApprove(item); }}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity shadow-md hover:bg-green-600"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">Quick approve</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <div className={`${isVisualChannel ? 'h-20' : 'h-14'} bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center relative`}>
                            <ChannelIcon channel={item.channel} size={isVisualChannel ? 24 : 16} />
                            {isSuggested && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleQuickApprove(item); }}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity shadow-md hover:bg-green-600"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">Quick approve</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}

                        <CardContent className="p-2.5 space-y-1.5">
                          {/* Channel + visual type + status */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <div className="flex items-center gap-1">
                              <ChannelIcon channel={item.channel} size={11} />
                              <span className={`text-[9px] font-semibold uppercase tracking-wide ${CHANNEL_ICON_COMPONENTS[item.channel]?.color || 'text-muted-foreground'}`}>
                                {item.channel === 'blog' ? 'Blog' : item.channel === 'email' || item.channel === 'newsletter' ? 'Email' : item.channel?.charAt(0).toUpperCase() + item.channel?.slice(1)}
                              </span>
                            </div>
                            {item.visual_type && (
                              <span className="text-[9px]">{VISUAL_TYPE_ICONS[item.visual_type] || '🎨'}</span>
                            )}
                            {item.content_format && (
                              <span className="text-[8px] text-muted-foreground capitalize">{item.content_format.replace(/_/g, ' ')}</span>
                            )}
                            {item.outcome_score >= 7 && <span className="text-[9px]">🎯</span>}
                            <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ml-auto ${
                              isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                              isApproved ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                              item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            }`}>
                              {item.status === 'suggested' ? 'NEW' :
                               item.status === 'published' ? 'LIVE' :
                               item.status.toUpperCase().slice(0, 3)}
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
              <WeekReviewDetailDialog
                item={detailItem}
                allItems={allItems}
                onClose={() => setDetailItem(null)}
                updateItem={updateItem}
                recordFeedback={recordFeedback}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ─── Detail / Edit Dialog ───
function WeekReviewDetailDialog({
  item: initialItem, allItems, onClose, updateItem, recordFeedback,
}: {
  item: any; allItems: any[] | undefined; onClose: () => void;
  updateItem: ReturnType<typeof useUpdateEditorialItem>;
  recordFeedback: ReturnType<typeof useRecordFeedback>;
}) {
  const item = useMemo(
    () => (allItems || []).find((i: any) => i.id === initialItem.id) || initialItem,
    [allItems, initialItem]
  );

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const startEdit = () => {
    setForm({
      working_title: item.working_title || '',
      key_message: item.key_message || '',
      objective: item.objective || '',
      post_angle: item.post_angle || '',
      draft_content: item.draft_content || '',
      cta: item.cta || item.suggested_cta || '',
      publish_date: item.publish_date || '',
      publish_time: item.publish_time || '',
      visual_type: item.visual_type || '',
      visual_concept: item.visual_concept || '',
      visual_headline: item.visual_headline || '',
      visual_subheadline: item.visual_subheadline || '',
      image_url: item.image_url || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await updateItem.mutateAsync({ id: item.id, ...form });
      toast.success('Item updated');
      setEditing(false);
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <ChannelIcon channel={item.channel} size={18} />
          <DialogTitle className="font-display">{item.working_title}</DialogTitle>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Badge variant="outline" className="text-[10px]">{item.content_format}</Badge>
          <Badge variant="secondary" className="text-[10px]">{item.content_pillar}</Badge>
          <span className="text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 inline mr-1" />
            {format(parseISO(item.publish_date), 'EEE, MMM d')}
          </span>
          <Badge variant="outline" className="text-[10px] capitalize">
            {item.status === 'published' ? '✅ Published' : item.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        {/* Action bar */}
        <div className="flex gap-2 flex-wrap">
          {(item.status === 'suggested' || item.status === 'under_review') && (
            <>
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  updateItem.mutate({ id: item.id, status: 'approved' }, {
                    onSuccess: () => {
                      recordFeedback.mutate({
                        editorial_item_id: item.id,
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
                      toast.success('Approved ✓');
                      onClose();
                    },
                  });
                }}
              >
                <Check className="w-3.5 h-3.5" /> Approve & Publish
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={() => {
                  updateItem.mutate({ id: item.id, status: 'rejected' }, {
                    onSuccess: () => { toast.success('Rejected'); onClose(); },
                  });
                }}
              >
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
            </>
          )}
          {!editing && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={startEdit}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
        </div>

        {/* Suggestion rationale */}
        {!editing && item.suggestion_rationale && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" /> Why this is suggested
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">{item.suggestion_rationale}</p>
          </div>
        )}

        {editing ? (
          /* ─── Edit Form ─── */
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <p className="text-sm font-display font-semibold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" /> Edit Content & Visuals
            </p>

            {/* Content fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={form.working_title} onChange={e => setForm({ ...form, working_title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Key Message</Label>
                  <Textarea value={form.key_message} onChange={e => setForm({ ...form, key_message: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="text-xs">Objective</Label>
                  <Textarea value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} rows={2} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Post Angle</Label>
                <Input value={form.post_angle} onChange={e => setForm({ ...form, post_angle: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Draft Content</Label>
                <Textarea value={form.draft_content} onChange={e => setForm({ ...form, draft_content: e.target.value })} rows={6} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">CTA</Label>
                  <Input value={form.cta} onChange={e => setForm({ ...form, cta: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Publish Date</Label>
                  <Input type="date" value={form.publish_date} onChange={e => setForm({ ...form, publish_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Publish Time</Label>
                  <Input type="time" value={form.publish_time} onChange={e => setForm({ ...form, publish_time: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Visual fields */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-display font-semibold flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-primary" /> Visual Direction
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Visual Type</Label>
                  <Input value={form.visual_type} onChange={e => setForm({ ...form, visual_type: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Visual Headline</Label>
                  <Input value={form.visual_headline} onChange={e => setForm({ ...form, visual_headline: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Visual Subheadline</Label>
                <Input value={form.visual_subheadline} onChange={e => setForm({ ...form, visual_subheadline: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Visual Concept</Label>
                <Textarea value={form.visual_concept} onChange={e => setForm({ ...form, visual_concept: e.target.value })} rows={2} />
              </div>
              <div>
                <Label className="text-xs">Image URL</Label>
                <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="Paste image or Unsplash URL..." />
              </div>
              {form.image_url && (() => {
                const normalizedUrl = form.image_url.includes('images.unsplash.com') ? form.image_url
                  : form.image_url.match(/unsplash\.com\/photos\/([^/?#]+)/) ? `https://source.unsplash.com/${form.image_url.match(/unsplash\.com\/photos\/([^/?#]+)/)![1]}/1600x900`
                  : form.image_url;
                return (
                  <div className="rounded-lg overflow-hidden border h-32">
                    <img src={normalizedUrl} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={saveEdit} disabled={updateItem.isPending} className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> Save Changes
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          /* ─── Read-only View ─── */
          <>
            {/* Outcome */}
            {(item.audience_challenge || item.insight_delivered) && (
              <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 space-y-2">
                <p className="text-xs font-display font-semibold text-primary">🎯 Outcome Definition</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><p className="text-[10px] text-muted-foreground">Challenge</p><p className="text-xs">{item.audience_challenge || '—'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Insight</p><p className="text-xs">{item.insight_delivered || '—'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Takeaway</p><p className="text-xs">{item.practical_takeaway || '—'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">Expected Action</p><p className="text-xs capitalize">{(item.expected_audience_action || '—').replace(/_/g, ' ')}</p></div>
                </div>
              </div>
            )}

            {/* Key message & objective */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="text-xs font-medium text-muted-foreground">Key Message</p><p className="text-sm">{item.key_message || '—'}</p></div>
              <div><p className="text-xs font-medium text-muted-foreground">Objective</p><p className="text-sm">{item.objective || '—'}</p></div>
            </div>

            {/* Post angle */}
            {item.post_angle && (
              <div><p className="text-xs font-medium text-muted-foreground">Post Angle</p><p className="text-sm italic">{item.post_angle}</p></div>
            )}

            {/* Draft */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Draft Content</p>
              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {item.draft_content || 'No draft yet.'}
              </div>
            </div>

            {/* CTA */}
            {(item.suggested_cta || item.cta) && (
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-sm">{item.suggested_cta || item.cta}</p>
              </div>
            )}

            {/* Visual Brief */}
            <VisualBriefPanel item={item} />
          </>
        )}
      </div>
    </>
  );
}
