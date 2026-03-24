import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Sparkles, PenTool, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { useEditorialPlans, useEditorialItems } from '@/hooks/use-editorial';

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: '💼', blog: '📝', email: '✉️', instagram: '📸', twitter: '𝕏',
  facebook: '📘', tiktok: '🎵', youtube: '▶️',
};

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { data: plans, isLoading: plansLoading } = useEditorialPlans();
  const activePlan = plans?.[0];
  const { data: items, isLoading: itemsLoading } = useEditorialItems(activePlan?.id ?? null);

  const loading = plansLoading || itemsLoading;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thirtyDaysAgo = subDays(now, 30);

  const thisWeekCount = items?.filter(i => {
    const d = parseISO(i.publish_date);
    return d >= weekStart && d <= weekEnd;
  }).length || 0;

  const inProgressCount = items?.filter(i =>
    i.status === 'suggested' || i.status === 'under_review'
  ).length || 0;

  const publishedCount = items?.filter(i =>
    i.status === 'published' && parseISO(i.publish_date) >= thirtyDaysAgo
  ).length || 0;

  const recentItems = items?.slice(0, 5) || [];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      {/* Greeting */}
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-xl md:text-2xl font-display font-bold">
          {getGreeting()}, Christophe.
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {inProgressCount > 0
            ? `You have ${inProgressCount} item${inProgressCount !== 1 ? 's' : ''} waiting for review.`
            : 'Everything is up to date.'}
        </p>
        {inProgressCount > 0 && (
          <Link to="/editorial">
            <Button className="mt-3 gap-1.5" size="sm">
              Review Now <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: 'This Week', value: thisWeekCount },
          { label: 'In Progress', value: inProgressCount },
          { label: 'Published (30d)', value: publishedCount },
        ].map(s => (
          <motion.div key={s.label} variants={fadeIn}>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-display font-bold">{loading ? '–' : s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/ideas" className="block">
          <Button variant="outline" className="w-full h-12 gap-2 text-sm">
            <Brain className="w-4 h-4" /> New Idea
          </Button>
        </Link>
        <Link to="/editorial" className="block">
          <Button variant="outline" className="w-full h-12 gap-2 text-sm">
            <Sparkles className="w-4 h-4" /> Generate Plan
          </Button>
        </Link>
        <Link to="/studio" className="block">
          <Button variant="outline" className="w-full h-12 gap-2 text-sm">
            <PenTool className="w-4 h-4" /> Write Now
          </Button>
        </Link>
      </div>

      {/* Recent Items */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No editorial items yet.</p>
              <Link to="/editorial">
                <Button size="sm" className="mt-2 gap-1.5 text-xs">
                  <Sparkles className="w-3 h-3" /> Generate First Plan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentItems.map((item: any) => (
                <Link
                  key={item.id}
                  to="/editorial"
                  className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                >
                  <ChannelBadge channel={item.channel} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.working_title}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{item.status}</Badge>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(parseISO(item.publish_date), 'MMM d')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
