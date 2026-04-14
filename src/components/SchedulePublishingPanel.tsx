import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Clock, Lightbulb, Calendar } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-warning/10 text-warning',
  approved: 'bg-info/10 text-info',
  published: 'bg-success/10 text-success',
};

interface RecommendedTime {
  label: string;
  description: string;
}

const RECOMMENDED_TIMES: Record<string, RecommendedTime[]> = {
  linkedin: [
    { label: 'Tue, {nextTue} at 08:00', description: 'Peak LinkedIn engagement for B2B professionals' },
    { label: 'Wed, {nextWed} at 10:00', description: 'Mid-week sweet spot — high open rates' },
    { label: 'Thu, {nextThu} at 07:30', description: 'Early readers before the workday starts' },
    { label: 'Tue, {nextTue2} at 12:00', description: 'Lunch-break reading window' },
  ],
  facebook: [
    { label: 'Wed, {nextWed} at 13:00', description: 'Peak Facebook engagement for pages' },
    { label: 'Thu, {nextThu} at 09:00', description: 'Morning scroll — high reach window' },
    { label: 'Fri, {nextFri} at 11:00', description: 'End-of-week sharing moment' },
    { label: 'Sun, {nextSun} at 10:00', description: 'Weekend leisure browsing peak' },
  ],
  instagram: [
    { label: 'Mon, {nextMon} at 11:00', description: 'Monday engagement spike on Instagram' },
    { label: 'Wed, {nextWed} at 14:00', description: 'Mid-week afternoon scroll peak' },
    { label: 'Fri, {nextFri} at 10:00', description: 'Friday morning discovery window' },
    { label: 'Sat, {nextSat} at 09:00', description: 'Weekend morning — high save rates' },
  ],
};

function getNextDayOfWeek(dayOfWeek: number, offset = 0): Date {
  const today = new Date();
  const diff = ((dayOfWeek - today.getDay()) + 7) % 7 || 7;
  const date = new Date(today);
  date.setDate(today.getDate() + diff + offset * 7);
  return date;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function resolveTimeLabel(label: string): string {
  const nextMon = getNextDayOfWeek(1);
  const nextTue = getNextDayOfWeek(2);
  const nextWed = getNextDayOfWeek(3);
  const nextThu = getNextDayOfWeek(4);
  const nextFri = getNextDayOfWeek(5);
  const nextSat = getNextDayOfWeek(6);
  const nextSun = getNextDayOfWeek(0);
  const nextTue2 = getNextDayOfWeek(2, 1);

  return label
    .replace('{nextMon}', formatShortDate(nextMon))
    .replace('{nextTue2}', formatShortDate(nextTue2))
    .replace('{nextTue}', formatShortDate(nextTue))
    .replace('{nextWed}', formatShortDate(nextWed))
    .replace('{nextThu}', formatShortDate(nextThu))
    .replace('{nextFri}', formatShortDate(nextFri))
    .replace('{nextSat}', formatShortDate(nextSat))
    .replace('{nextSun}', formatShortDate(nextSun));
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
  const recommendedTimes = useMemo(() => {
    return (RECOMMENDED_TIMES[platform] || []).map(t => ({
      ...t,
      label: resolveTimeLabel(t.label),
    }));
  }, [platform]);

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
                  onChange={e => onPublishDateChange(e.target.value)}
                  className="pl-9"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Publish Time (CET)</Label>
              <div className="relative">
                <Input
                  type="time"
                  value={publishTime}
                  onChange={e => onPublishTimeChange(e.target.value)}
                  className="pl-3"
                />
              </div>
            </div>

            {/* Recommended times */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-warning" /> Recommended times
              </p>
              <div className="space-y-1.5">
                {recommendedTimes.map((rt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // Parse the date/time from the label
                      const timeMatch = rt.label.match(/at (\d{2}:\d{2})/);
                      if (timeMatch) onPublishTimeChange(timeMatch[1]);
                    }}
                    className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                  >
                    <p className="text-sm font-medium">{rt.label}</p>
                    <p className="text-xs text-muted-foreground">{rt.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
