import { useState, useMemo, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft, ChevronRight, Plus, Filter, CheckCircle2, XCircle,
  Palette, Image as ImageIcon, Eye, Pencil, Clock, Sparkles, Check,
  Instagram, Linkedin, Facebook, PenLine, Globe, GripVertical,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChannelType, CHANNEL_CONFIG } from '@/data/types';
import { useAllEditorialItems, useUpdateEditorialItem } from '@/hooks/use-editorial';
import { resolveBrandIcon } from '@/lib/brand-assets';
import { toast } from 'sonner';

// ─── Helpers ───
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDayHeader(d: Date) {
  return {
    dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
    dayNum: d.getDate(),
    monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

const STATUS_STYLES: Record<string, string> = {
  suggested: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const VISUAL_STATUS_STYLES: Record<string, { label: string; color: string }> = {
  suggested: { label: 'Awaiting Approval', color: 'text-amber-600' },
  approved: { label: 'Ready', color: 'text-green-600' },
  rejected: { label: 'Needs Redesign', color: 'text-red-600' },
  none: { label: 'No Visual', color: 'text-muted-foreground' },
};

const ACCENT_MAP: Record<string, string> = {
  email: 'border-l-[hsl(35,90%,55%)]',
  blog: 'border-l-[hsl(200,70%,50%)]',
  linkedin: 'border-l-primary',
  instagram: 'border-l-[hsl(330,70%,55%)]',
};

const CHANNEL_ICON_MAP: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  blog: PenLine,
  email: Globe,
};

const CHANNEL_ICON_COLORS: Record<string, string> = {
  instagram: 'text-pink-500',
  linkedin: 'text-blue-600',
  facebook: 'text-blue-500',
  blog: 'text-accent-foreground',
  email: 'text-muted-foreground',
};

// ─── Calendar Card ───
function CalendarEditorialCard({
  item, onClick, onQuickApprove,
}: {
  item: any; onClick: () => void; onQuickApprove?: () => void;
}) {
  const channel = item.channel as string;
  const brandIcon = resolveBrandIcon(item.content_pillar || item.working_title || '');
  const vs = VISUAL_STATUS_STYLES[item.visual_status] || VISUAL_STATUS_STYLES.none;
  const hasVisual = item.visual_status && item.visual_status !== 'none';
  const canApprove = item.status === 'suggested' || item.status === 'under_review';
  const ChannelIconComp = CHANNEL_ICON_MAP[channel] || Globe;
  const channelColor = CHANNEL_ICON_COLORS[channel] || 'text-muted-foreground';

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/editorial-item-id', item.id);
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).classList.add('opacity-40', 'scale-95');
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).classList.remove('opacity-40', 'scale-95');
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`group rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing overflow-hidden border-l-4 ${ACCENT_MAP[channel] || 'border-l-primary'}`}
    >
      {/* Header */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          <ChannelIconComp className={`w-4 h-4 ${channelColor}`} />
          <span className="text-[10px] font-medium text-muted-foreground">{item.content_format?.replace(/_/g, ' ') || 'Post'}</span>
        </div>
        <div className="flex items-center gap-1">
          {item.publish_time && (
            <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" /> {item.publish_time}
            </span>
          )}
          {brandIcon && <img src={brandIcon} alt="" className="w-4 h-4 object-contain opacity-60" />}
          {canApprove && onQuickApprove && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onQuickApprove(); }}
                  className="w-5 h-5 rounded-full border-2 border-green-400 hover:bg-green-500 hover:border-green-500 hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Check className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Quick approve & publish</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="px-3 pb-1.5">
        <p className="text-xs font-semibold leading-snug line-clamp-2">{item.working_title}</p>
      </div>

      {/* Visual indicator */}
      {hasVisual && (
        <div className="px-3 pb-1.5 flex items-center gap-1.5">
          <Palette className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground">{item.visual_type?.replace(/_/g, ' ')}</span>
          <span className={`text-[9px] font-medium ${vs.color}`}>· {vs.label}</span>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pb-2 flex items-center justify-between">
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[item.status] || ''}`}>
          {item.status}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] text-primary font-medium">Edit</span>
        </div>
      </div>
    </div>
  );
}

// ─── Detail / Edit Dialog ───
function ItemDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (v: boolean) => void }) {
  const updateItem = useUpdateEditorialItem();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  const startEdit = () => {
    setForm({
      working_title: item.working_title,
      key_message: item.key_message || '',
      cta: item.cta || '',
      visual_type: item.visual_type || '',
      visual_concept: item.visual_concept || '',
      visual_headline: item.visual_headline || '',
      publish_date: item.publish_date || '',
      publish_time: item.publish_time || '',
      draft_content: item.draft_content || '',
    });
    setEditing(true);
  };

  const save = async () => {
    try {
      await updateItem.mutateAsync({ id: item.id, ...form });
      toast.success('Item updated');
      setEditing(false);
    } catch {
      toast.error('Failed to save');
    }
  };

  const approve = async (field: 'status' | 'visual_status') => {
    try {
      await updateItem.mutateAsync({ id: item.id, [field]: 'approved' });
      toast.success(field === 'status' ? 'Content approved' : 'Visual approved');
    } catch {
      toast.error('Failed to approve');
    }
  };

  const reject = async (field: 'status' | 'visual_status') => {
    try {
      await updateItem.mutateAsync({ id: item.id, [field]: 'rejected' });
      toast.success(field === 'status' ? 'Content rejected' : 'Visual rejected');
    } catch {
      toast.error('Failed to reject');
    }
  };

  const brandIcon = resolveBrandIcon(item.content_pillar || item.working_title || '');
  const vs = VISUAL_STATUS_STYLES[item.visual_status] || VISUAL_STATUS_STYLES.none;
  const hasVisual = item.visual_status && item.visual_status !== 'none';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {brandIcon && <img src={brandIcon} alt="" className="w-6 h-6 object-contain" />}
            <DialogTitle className="font-display text-lg">{item.working_title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status + Channel */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={STATUS_STYLES[item.status]}>{item.status}</Badge>
            <Badge variant="outline">{item.channel}</Badge>
            <Badge variant="outline">{item.content_format}</Badge>
            {item.content_pillar && <Badge variant="secondary">{item.content_pillar}</Badge>}
            {item.publish_time && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" /> {item.publish_time}
              </Badge>
            )}
            {item.outcome_score > 0 && (
              <Badge variant="outline" className="gap-1">
                <Sparkles className="w-3 h-3" /> Score: {item.outcome_score}
              </Badge>
            )}
          </div>

          {/* Content Actions */}
          <div className="flex gap-2">
            {item.status !== 'approved' && item.status !== 'published' && (
              <Button size="sm" className="gap-1.5" onClick={() => approve('status')}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
              </Button>
            )}
            {item.status !== 'rejected' && item.status !== 'published' && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => reject('status')}>
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            )}
            {!editing && (
              <Button size="sm" variant="ghost" className="gap-1.5" onClick={startEdit}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>

          {/* Outcome Framework */}
          {(item.audience_challenge || item.insight_delivered || item.practical_takeaway) && (
            <div className="bg-muted/40 rounded-lg p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">Outcome Framework</p>
              {item.audience_challenge && (
                <div><span className="text-[10px] font-medium text-muted-foreground">Challenge:</span> <span className="text-xs">{item.audience_challenge}</span></div>
              )}
              {item.insight_delivered && (
                <div><span className="text-[10px] font-medium text-muted-foreground">Insight:</span> <span className="text-xs">{item.insight_delivered}</span></div>
              )}
              {item.practical_takeaway && (
                <div><span className="text-[10px] font-medium text-muted-foreground">Takeaway:</span> <span className="text-xs">{item.practical_takeaway}</span></div>
              )}
              {item.expected_audience_action && (
                <div><span className="text-[10px] font-medium text-muted-foreground">Expected action:</span> <span className="text-xs">{item.expected_audience_action}</span></div>
              )}
            </div>
          )}

          {/* ─── Visual Package ─── */}
          {hasVisual && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-display font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" /> Visual Package
                </p>
                <span className={`text-xs font-medium ${vs.color}`}>{vs.label}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {item.visual_type && (
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{item.visual_type.replace(/_/g, ' ')}</span></div>
                )}
                {item.format_ratio && (
                  <div><span className="text-muted-foreground">Format:</span> <span className="font-medium">{item.format_ratio}</span></div>
                )}
                {item.visual_headline && (
                  <div className="col-span-2"><span className="text-muted-foreground">Headline:</span> <span className="font-medium">{item.visual_headline}</span></div>
                )}
                {item.visual_subheadline && (
                  <div className="col-span-2"><span className="text-muted-foreground">Subheadline:</span> <span className="font-medium">{item.visual_subheadline}</span></div>
                )}
              </div>

              {item.visual_concept && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Concept</p>
                  <p className="text-xs">{item.visual_concept}</p>
                </div>
              )}

              {item.visual_rationale && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Rationale</p>
                  <p className="text-xs">{item.visual_rationale}</p>
                </div>
              )}

              {item.backup_visual_concept && (
                <div className="bg-muted/30 rounded-lg p-3 border-l-2 border-muted-foreground/20">
                  <p className="text-[10px] font-medium text-muted-foreground mb-1">Backup Concept</p>
                  <p className="text-xs">{item.backup_visual_concept}</p>
                  {item.backup_visual_type && <p className="text-[10px] text-muted-foreground mt-1">Type: {item.backup_visual_type.replace(/_/g, ' ')}</p>}
                </div>
              )}

              {/* Visual Actions */}
              <div className="flex gap-2 pt-1">
                {item.visual_status !== 'approved' && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50" onClick={() => approve('visual_status')}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Visual
                  </Button>
                )}
                {item.visual_status !== 'rejected' && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => reject('visual_status')}>
                    <XCircle className="w-3.5 h-3.5" /> Reject Visual
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ─── Edit Form ─── */}
          {editing && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <p className="text-sm font-display font-semibold">Edit Item</p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={form.working_title} onChange={e => setForm({ ...form, working_title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Key Message</Label>
                  <Textarea value={form.key_message} onChange={e => setForm({ ...form, key_message: e.target.value })} rows={2} />
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
                  <Label className="text-xs">Visual Concept</Label>
                  <Textarea value={form.visual_concept} onChange={e => setForm({ ...form, visual_concept: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label className="text-xs">Draft Content</Label>
                  <Textarea value={form.draft_content} onChange={e => setForm({ ...form, draft_content: e.target.value })} rows={4} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={updateItem.isPending}>Save Changes</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Key message / draft preview when not editing */}
          {!editing && item.key_message && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Key Message</p>
              <p className="text-sm">{item.key_message}</p>
            </div>
          )}
          {!editing && item.draft_content && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Draft Content</p>
              <p className="text-sm whitespace-pre-wrap">{item.draft_content}</p>
            </div>
          )}

          {item.suggestion_rationale && (
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-[10px] font-medium text-primary mb-1">Why this was suggested</p>
              <p className="text-xs">{item.suggestion_rationale}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ───
export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: editorialItems } = useAllEditorialItems();
  const updateItem = useUpdateEditorialItem();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const handleQuickApprove = async (item: any) => {
    try {
      await updateItem.mutateAsync({ id: item.id, status: 'approved' });
      toast.success(`"${item.working_title}" approved ✓`);
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetDateKey: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const itemId = e.dataTransfer.getData('application/editorial-item-id');
    if (!itemId) return;

    const item = (editorialItems || []).find((i: any) => i.id === itemId);
    if (!item || item.publish_date === targetDateKey) return;

    // Reset published items to approved when rescheduled
    const statusUpdate = item.status === 'published' ? { status: 'approved' } : {};

    try {
      await updateItem.mutateAsync({ id: itemId, publish_date: targetDateKey, ...statusUpdate });
      toast.success(`Moved to ${new Date(targetDateKey + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
    } catch {
      toast.error('Failed to reschedule');
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateKey);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = formatDateKey(new Date());

  const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

  const editorialByDateAndHour = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    (editorialItems || []).forEach((item: any) => {
      if (!item.publish_date) return;
      if (!map[item.publish_date]) map[item.publish_date] = {};
      const hour = item.publish_time ? parseInt(item.publish_time.split(':')[0], 10) : -1;
      const slotKey = hour >= 7 && hour <= 21 ? String(hour) : 'allday';
      if (!map[item.publish_date][slotKey]) map[item.publish_date][slotKey] = [];
      map[item.publish_date][slotKey].push(item);
    });
    return map;
  }, [editorialItems]);

  const goToday = () => setCurrentDate(new Date());
  const prev = () => setCurrentDate(addDays(currentDate, -7));
  const next = () => setCurrentDate(addDays(currentDate, 7));

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto space-y-4 h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-display font-bold">Calendar</h1>
          <div className="flex items-center gap-1 ml-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-sm font-medium" onClick={goToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground font-medium ml-2">
            {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Drag cards to reschedule · Click to edit · ✓ to approve & publish</p>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-0 border border-border rounded-xl overflow-hidden bg-muted/30 min-h-[calc(100vh-180px)]">
        {weekDays.map((day, idx) => {
          const dateKey = formatDateKey(day);
          const { dayName, dayNum } = formatDayHeader(day);
          const isToday = dateKey === todayKey;
          const editorials = editorialByDate[dateKey] || [];
          const isDragOver = dragOverDate === dateKey;

          return (
            <div
              key={dateKey}
              onDrop={(e) => handleDrop(e, dateKey)}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={handleDragLeave}
              className={`flex flex-col ${idx < 6 ? 'border-r border-border' : ''} transition-colors ${
                isDragOver ? 'bg-primary/10' : isToday ? 'bg-primary/[0.03]' : 'bg-background'
              }`}
            >
              <div className={`px-3 py-2.5 text-center border-b border-border sticky top-0 z-10 ${isToday ? 'bg-primary/[0.06]' : 'bg-muted/50'}`}>
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{dayName}</div>
                <div className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>{dayNum}</div>
                {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-0.5" />}
              </div>

              <div className={`flex-1 p-1.5 space-y-1.5 overflow-y-auto min-h-[80px] transition-all ${isDragOver ? 'ring-2 ring-primary/30 ring-inset rounded-b-lg' : ''}`}>
                {editorials.map((item: any) => (
                  <CalendarEditorialCard key={item.id} item={item} onClick={() => setSelectedItem(item)} onQuickApprove={() => handleQuickApprove(item)} />
                ))}
                {editorials.length === 0 && (
                  <div className={`flex items-center justify-center h-20 text-[10px] italic ${isDragOver ? 'text-primary font-medium' : 'text-muted-foreground/40'}`}>
                    {isDragOver ? 'Drop here' : '—'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog */}
      {selectedItem && (
        <ItemDetailDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(v) => { if (!v) setSelectedItem(null); }}
        />
      )}
    </div>
  );
}
