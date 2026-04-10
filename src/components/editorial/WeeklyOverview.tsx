import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, ChevronRight, FileText, Linkedin, Instagram, PenLine, Globe,
} from 'lucide-react';
import {
  format, parseISO, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay, isValid,
} from 'date-fns';
import { useAllEditorialItems } from '@/hooks/use-editorial';
import { useBlogPosts } from '@/hooks/use-blog';
import { useLinkedinPosts } from '@/hooks/use-linkedin-posts';
import { useInstagramPosts } from '@/hooks/use-instagram-posts';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning/10 text-warning',
  approved: 'bg-info/10 text-info',
  published: 'bg-success/10 text-success',
  suggested: 'bg-muted text-muted-foreground',
  scheduled: 'bg-info/10 text-info',
};

type UnifiedItem = {
  id: string;
  title: string;
  date: Date;
  status: string;
  channel: 'editorial' | 'blog' | 'linkedin' | 'instagram';
  pillar?: string;
  imageUrl?: string;
};

const CHANNEL_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  editorial: { icon: PenLine, label: 'Editorial', color: 'text-accent-foreground' },
  blog: { icon: FileText, label: 'Blog', color: 'text-orange-600' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-[#0077B5]' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-[#E4405F]' },
};

export default function WeeklyOverview() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: editorialItems = [] } = useAllEditorialItems();
  const { data: blogPosts = [] } = useBlogPosts();
  const { data: linkedinPosts = [] } = useLinkedinPosts();
  const { data: instagramPosts = [] } = useInstagramPosts();

  const now = new Date();
  const weekStart = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(now, weekOffset), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const unified = useMemo<UnifiedItem[]>(() => {
    const items: UnifiedItem[] = [];

    editorialItems.forEach((i: any) => {
      const d = parseISO(i.publish_date);
      if (isValid(d)) {
        items.push({
          id: 'ed-' + i.id,
          title: i.working_title || 'Untitled',
          date: d,
          status: i.status,
          channel: 'editorial',
          pillar: i.content_pillar || '',
          imageUrl: i.image_url || '',
        });
      }
    });

    blogPosts.forEach((p: any) => {
      const d = p.scheduled_publish_at ? parseISO(p.scheduled_publish_at) : parseISO(p.created_at);
      if (isValid(d)) {
        items.push({
          id: 'blog-' + p.id,
          title: p.title || 'Untitled Blog',
          date: d,
          status: p.status,
          channel: 'blog',
          pillar: p.content_pillar || '',
          imageUrl: p.hero_image_url || '',
        });
      }
    });

    linkedinPosts.forEach((p: any) => {
      const d = p.scheduled_publish_at ? parseISO(p.scheduled_publish_at) : parseISO(p.created_at);
      if (isValid(d)) {
        items.push({
          id: 'li-' + p.id,
          title: p.hook || p.content?.slice(0, 60) || 'Untitled Post',
          date: d,
          status: p.status,
          channel: 'linkedin',
          pillar: p.content_pillar || '',
          imageUrl: p.image_url || '',
        });
      }
    });

    instagramPosts.forEach((p: any) => {
      const d = p.scheduled_publish_at ? parseISO(p.scheduled_publish_at) : parseISO(p.created_at);
      if (isValid(d)) {
        items.push({
          id: 'ig-' + p.id,
          title: p.caption?.slice(0, 60) || 'Untitled Post',
          date: d,
          status: p.status,
          channel: 'instagram',
          pillar: p.content_pillar || '',
          imageUrl: p.cover_image_url || '',
        });
      }
    });

    return items;
  }, [editorialItems, blogPosts, linkedinPosts, instagramPosts]);

  // Summary counts
  const weekItems = unified.filter(i => i.date >= weekStart && i.date <= weekEnd);
  const channelCounts = {
    editorial: weekItems.filter(i => i.channel === 'editorial').length,
    blog: weekItems.filter(i => i.channel === 'blog').length,
    linkedin: weekItems.filter(i => i.channel === 'linkedin').length,
    instagram: weekItems.filter(i => i.channel === 'instagram').length,
  };

  return (
    <div className="space-y-4">
      {/* Week Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
          </p>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[10px] text-primary hover:underline">
              Today
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(o => o + 1)}>
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Channel summary */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <cfg.icon className={cn('w-3.5 h-3.5', cfg.color)} />
            <span className="text-muted-foreground">{cfg.label}:</span>
            <span className="font-semibold">{channelCounts[key as keyof typeof channelCounts]}</span>
          </div>
        ))}
        <span className="text-xs text-muted-foreground ml-auto font-medium">
          Total: {weekItems.length}
        </span>
      </div>

      {/* Day Columns */}
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayItems = unified
            .filter(i => isSameDay(i.date, day))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
          const isToday = isSameDay(day, now);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'rounded-xl border p-2 min-h-[200px]',
                isToday ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="text-center mb-2">
                <p className={cn(
                  'text-[10px] font-medium uppercase',
                  isToday ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {format(day, 'EEE')}
                </p>
                <p className={cn(
                  'text-sm font-bold',
                  isToday ? 'text-primary' : ''
                )}>
                  {format(day, 'd')}
                </p>
              </div>

              <div className="space-y-1.5">
                {dayItems.map(item => {
                  const cfg = CHANNEL_CONFIG[item.channel];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={item.id}
                      className="p-1.5 rounded-lg border border-border bg-card hover:border-primary/30 transition-all text-left"
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" className="w-full h-10 object-cover rounded mb-1" />
                      )}
                      <div className="flex items-center gap-1 mb-0.5">
                        <Icon className={cn('w-3 h-3 flex-shrink-0', cfg.color)} />
                        <span className="text-[9px] text-muted-foreground">{cfg.label}</span>
                      </div>
                      <p className="text-[10px] font-medium leading-tight line-clamp-2">{item.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className={cn('text-[8px] px-1 py-0 border-0', STATUS_COLORS[item.status] || STATUS_COLORS.draft)}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {dayItems.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/50 text-center pt-4">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
