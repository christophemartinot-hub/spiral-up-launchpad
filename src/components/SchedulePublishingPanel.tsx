import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Clock, Lightbulb, Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning/10 text-warning',
  approved: 'bg-info/10 text-info',
  published: 'bg-success/10 text-success',
};

interface RecommendedSlot {
  dayOfWeek: number; // 0=Sun..6=Sat
  weekOffset: number; // 0 = this coming occurrence, 1 = the one after
  time: string; // HH:mm
  description: string;
}

const RECOMMENDED_SLOTS: Record<string, RecommendedSlot[]> = {
  linkedin: [
    { dayOfWeek: 2, weekOffset: 0, time: '08:00', description: 'Peak LinkedIn engagement for B2B professionals' },
    { dayOfWeek: 3, weekOffset: 0, time: '10:00', description: 'Mid-week sweet spot — high open rates' },
    { dayOfWeek: 4, weekOffset: 0, time: '07:30', description: 'Early readers before the workday starts' },
    { dayOfWeek: 2, weekOffset: 1, time: '12:00', description: 'Lunch-break reading window' },
  ],
  facebook: [
    { dayOfWeek: 3, weekOffset: 0, time: '13:00', description: 'Peak Facebook engagement for pages' },
    { dayOfWeek: 4, weekOffset: 0, time: '09:00', description: 'Morning scroll — high reach window' },
    { dayOfWeek: 5, weekOffset: 0, time: '11:00', description: 'End-of-week sharing moment' },
    { dayOfWeek: 0, weekOffset: 0, time: '10:00', description: 'Weekend leisure browsing peak' },
  ],
  instagram: [
    { dayOfWeek: 1, weekOffset: 0, time: '11:00', description: 'Monday engagement spike on Instagram' },
    { dayOfWeek: 3, weekOffset: 0, time: '14:00', description: 'Mid-week afternoon scroll peak' },
    { dayOfWeek: 5, weekOffset: 0, time: '10:00', description: 'Friday morning discovery window' },
    { dayOfWeek: 6, weekOffset: 0, time: '09:00', description: 'Weekend morning — high save rates' },
  ],
};

function getNextDayOfWeek(dayOfWeek: number, offset = 0): Date {
  const today = new Date();
  const diff = ((dayOfWeek - today.getDay()) + 7) % 7 || 7;
  const date = new Date(today);
  date.setDate(today.getDate() + diff + offset * 7);
  return date;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ResolvedSlot {
  date: Date;
  dateStr: string;
  time: string;
  label: string;
  description: string;
}

interface SchedulePublishingPanelProps {
  status: string;
  platform: 'linkedin' | 'facebook' | 'instagram';
  publishDate: string;
  publishTime: string;
  onPublishDateChange: (date: string) => void;
  onPublishTimeChange: (time: string) => void;
}

export function SchedulePublishingPanel({
  status,
  platform,
  publishDate,
  publishTime,
  onPublishDateChange,
  onPublishTimeChange,
}: SchedulePublishingPanelProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const resolvedSlots: ResolvedSlot[] = useMemo(() => {
    return (RECOMMENDED_SLOTS[platform] || []).map(slot => {
      const date = getNextDayOfWeek(slot.dayOfWeek, slot.weekOffset);
      const dayName = DAY_NAMES[slot.dayOfWeek];
      const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date,
        dateStr: toISODate(date),
        time: slot.time,
        label: `${dayName}, ${shortDate} at ${slot.time}`,
        description: slot.description,
      };
    });
  }, [platform]);

  const handleSlotClick = (slot: ResolvedSlot, index: number) => {
    onPublishDateChange(slot.dateStr);
    onPublishTimeChange(slot.time);
    setSelectedSlotIndex(index);
    toast.success(`Scheduled for ${slot.label}`);
  };

  return (
    <>
      {/* Status */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={cn('text-xs', STATUS_STYLES[status] || 'bg-muted text-muted-foreground')}>
            {status}
          </Badge>
        </CardContent>
      </Card>

      {/* Schedule Publishing */}
      {(status === 'approved' || status === 'review') && (
        <Card className="shadow-card border-warning/20">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" /> Schedule Publishing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Publish Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={publishDate}
                  onChange={e => { onPublishDateChange(e.target.value); setSelectedSlotIndex(null); }}
                  className="pl-9"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Publish Time (CET)</Label>
              <Input
                type="time"
                value={publishTime}
                onChange={e => { onPublishTimeChange(e.target.value); setSelectedSlotIndex(null); }}
              />
            </div>

            {/* Recommended times */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-warning" /> Recommended times
              </p>
              <div className="space-y-1.5">
                {resolvedSlots.map((slot, i) => {
                  const isSelected = selectedSlotIndex === i ||
                    (selectedSlotIndex === null && publishDate === slot.dateStr && publishTime === slot.time);
                  return (
                    <button
                      key={i}
                      onClick={() => handleSlotClick(slot, i)}
                      className={cn(
                        'w-full text-left p-2.5 rounded-lg border transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{slot.label}</p>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{slot.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
