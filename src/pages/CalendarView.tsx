import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Wand2, Filter } from 'lucide-react';
import { ContentStatusBadge } from '@/components/StatusBadge';
import { demoContent, demoCampaigns } from '@/data/demo';
import { ChannelType, CHANNEL_CONFIG } from '@/data/types';
import { useEditorialItems } from '@/hooks/use-editorial';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Helpers ───
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
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

function formatDayHeader(d: Date): { dayName: string; dayNum: number; monthShort: string } {
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
  return { dayName, dayNum: d.getDate(), monthShort };
}

const CHANNEL_ICONS: Record<ChannelType, string[]> = {
  linkedin: ['in'],
  instagram: ['📷'],
  facebook: ['f'],
  twitter: ['𝕏'],
  tiktok: ['♪'],
  youtube: ['▶'],
  email: ['📧'],
};

// Channel icon pills (small colored circles like in the reference)
function ChannelIconPills({ channels }: { channels: ChannelType[] }) {
  const colors: Record<ChannelType, string> = {
    linkedin: 'bg-[hsl(210,80%,45%)]',
    instagram: 'bg-gradient-to-br from-[hsl(330,70%,55%)] to-[hsl(30,90%,55%)]',
    facebook: 'bg-[hsl(220,70%,50%)]',
    twitter: 'bg-foreground',
    tiktok: 'bg-foreground',
    youtube: 'bg-[hsl(0,80%,50%)]',
    email: 'bg-[hsl(35,90%,55%)]',
  };
  return (
    <div className="flex -space-x-1">
      {channels.map((ch) => (
        <div
          key={ch}
          className={`w-5 h-5 rounded-full ${colors[ch]} flex items-center justify-center text-[9px] text-white font-bold ring-2 ring-background`}
          title={CHANNEL_CONFIG[ch].label}
        >
          {ch === 'linkedin' ? 'in' : ch === 'facebook' ? 'f' : ch === 'email' ? '✉' : ch === 'youtube' ? '▶' : ch === 'instagram' ? '📷' : ch === 'twitter' ? '𝕏' : '♪'}
        </div>
      ))}
    </div>
  );
}

// ─── Content card inside the calendar ───
function CalendarContentCard({ item, campaign }: { item: typeof demoContent[0]; campaign?: typeof demoCampaigns[0] }) {
  const config = CHANNEL_CONFIG[item.channel];
  const typeLabel = item.type === 'email' ? 'Email' : item.type === 'reel' ? 'Story' : item.type === 'carousel' ? 'Carousel' : item.type === 'video' ? 'Video' : 'Post';

  // Determine accent color
  const accentMap: Record<string, string> = {
    email: 'border-l-[hsl(35,90%,55%)]',
    post: 'border-l-primary',
    reel: 'border-l-[hsl(280,70%,60%)]',
    story: 'border-l-[hsl(280,70%,60%)]',
    carousel: 'border-l-[hsl(200,70%,50%)]',
    video: 'border-l-[hsl(0,80%,50%)]',
  };

  return (
    <div
      className={`group rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-l-4 ${accentMap[item.type] || 'border-l-primary'}`}
    >
      {/* Header row */}
      <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChannelIconPills channels={[item.channel]} />
          <span className="text-xs font-medium text-muted-foreground">{typeLabel}</span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">10:00am</span>
      </div>

      {/* Title */}
      <div className="px-3 pb-2">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</p>
      </div>

      {/* Body preview */}
      <div className="px-3 pb-2">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.body}</p>
      </div>

      {/* Footer */}
      <div className="px-3 pb-2.5 flex items-center justify-between">
        <ContentStatusBadge status={item.status} />
        <button className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Connect
        </button>
      </div>
    </div>
  );
}

// ─── Editorial item card ───
function CalendarEditorialCard({ item }: { item: any }) {
  const typeLabel = item.content_format || 'Post';
  const channel = item.channel as ChannelType;
  const config = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.linkedin;

  const statusMap: Record<string, string> = {
    approved: 'bg-success/15 text-success',
    pending: 'bg-warning/15 text-warning',
    rejected: 'bg-destructive/15 text-destructive',
    draft: 'bg-muted text-muted-foreground',
  };

  const accentMap: Record<string, string> = {
    email: 'border-l-[hsl(35,90%,55%)]',
    blog: 'border-l-[hsl(200,70%,50%)]',
  };

  return (
    <div className={`group rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border-l-4 ${accentMap[channel] || 'border-l-primary'}`}>
      <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChannelIconPills channels={[channel]} />
          <span className="text-xs font-medium text-muted-foreground">{typeLabel}</span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {item.publish_date ? new Date(item.publish_date + 'T12:00:00').toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
        </span>
      </div>
      <div className="px-3 pb-2">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{item.working_title}</p>
      </div>
      {item.key_message && (
        <div className="px-3 pb-2">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.key_message}</p>
        </div>
      )}
      <div className="px-3 pb-2.5 flex items-center justify-between">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusMap[item.status] || statusMap.draft}`}>
          {item.status}
        </span>
        <button className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Connect
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───
export default function CalendarView() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 13)); // Today: March 13 2026
  const { data: editorialItems } = useEditorialItems(null);

  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = formatDateKey(new Date(2026, 2, 13));

  // Index demo content by date
  const contentByDate = useMemo(() => {
    const map: Record<string, typeof demoContent> = {};
    demoContent.forEach((item) => {
      if (!item.publishDate) return;
      if (!map[item.publishDate]) map[item.publishDate] = [];
      map[item.publishDate].push(item);
    });
    return map;
  }, []);

  // Index editorial items by date
  const editorialByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (editorialItems || []).forEach((item: any) => {
      if (!item.publish_date) return;
      const key = item.publish_date;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [editorialItems]);

  const goToday = () => setCurrentDate(new Date(2026, 2, 13));
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
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Create
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            Improve
          </Button>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Filter className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-0 border border-border rounded-xl overflow-hidden bg-muted/30 min-h-[calc(100vh-180px)]">
        {weekDays.map((day, idx) => {
          const dateKey = formatDateKey(day);
          const { dayName, dayNum, monthShort } = formatDayHeader(day);
          const isToday = dateKey === todayKey;
          const items = contentByDate[dateKey] || [];
          const editorials = editorialByDate[dateKey] || [];
          const hasContent = items.length > 0 || editorials.length > 0;

          return (
            <div
              key={dateKey}
              className={`flex flex-col ${idx < 6 ? 'border-r border-border' : ''} ${isToday ? 'bg-primary/[0.03]' : 'bg-background'}`}
            >
              {/* Day header */}
              <div className={`px-3 py-2.5 text-center border-b border-border sticky top-0 z-10 ${isToday ? 'bg-primary/[0.06]' : 'bg-muted/50'}`}>
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{monthShort} {dayNum} {dayName}</div>
                {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />}
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {items.map((item) => {
                  const campaign = demoCampaigns.find((c) => c.id === item.campaignId);
                  return <CalendarContentCard key={item.id} item={item} campaign={campaign} />;
                })}
                {editorials.map((item: any) => (
                  <CalendarEditorialCard key={item.id} item={item} />
                ))}
                {!hasContent && (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50 italic">
                    No posts
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
