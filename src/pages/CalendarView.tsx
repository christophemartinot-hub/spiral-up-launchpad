import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentStatusBadge } from '@/components/StatusBadge';
import ChannelBadge from '@/components/ChannelBadge';
import { demoContent, demoCampaigns } from '@/data/demo';
import { CHANNEL_CONFIG } from '@/data/types';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const contentByDate = useMemo(() => {
    const map: Record<string, typeof demoContent> = {};
    demoContent.forEach(item => {
      if (!item.publishDate) return;
      const d = item.publishDate;
      if (!map[d]) map[d] = [];
      map[d].push(item);
    });
    return map;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedContent = selectedDate ? contentByDate[selectedDate] || [] : [];

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Content Calendar</h1>
        <p className="text-muted-foreground mt-1">Plan and visualize your publishing schedule.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
            <CardTitle className="font-display">{MONTH_NAMES[month]} {year}</CardTitle>
            <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="p-2 text-xs font-medium text-muted-foreground text-center">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="p-2" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const items = contentByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === '2026-03-12';

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`p-1.5 min-h-[60px] md:min-h-[80px] rounded-lg text-left transition-colors border ${
                      isSelected ? 'border-primary bg-primary/5' :
                      isToday ? 'border-primary/30 bg-primary/5' :
                      'border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? 'text-primary' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {items.slice(0, 2).map(item => (
                        <div key={item.id} className="text-[10px] px-1 py-0.5 rounded truncate" style={{ backgroundColor: `${CHANNEL_CONFIG[item.channel].color}20`, color: CHANNEL_CONFIG[item.channel].color }}>
                          {CHANNEL_CONFIG[item.channel].icon} {item.title.slice(0, 15)}
                        </div>
                      ))}
                      {items.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{items.length - 2} more</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">
              {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No content scheduled for this date.</p>
            ) : (
              <div className="space-y-3">
                {selectedContent.map(item => {
                  const campaign = demoCampaigns.find(c => c.id === item.campaignId);
                  return (
                    <div key={item.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{campaign?.name}</p>
                      <div className="flex gap-2 flex-wrap">
                        <ChannelBadge channel={item.channel} />
                        <ContentStatusBadge status={item.status} />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
