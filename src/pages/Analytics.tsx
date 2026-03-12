import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Eye, Users, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const stats = [
  { label: 'Total Impressions', value: '124.5K', change: '+18%', up: true, icon: Eye },
  { label: 'Engagement Rate', value: '4.2%', change: '+0.8%', up: true, icon: TrendingUp },
  { label: 'New Followers', value: '1,240', change: '+12%', up: true, icon: Users },
  { label: 'Content Published', value: '34', change: '+6', up: true, icon: FileText },
];

const topContent = [
  { title: 'Why Most Transformations Fail Before They Start', channel: 'Blog', views: '8,420', engagement: '6.1%' },
  { title: 'The Leader\'s Paradox: Control vs. Enablement', channel: 'LinkedIn', views: '12,300', engagement: '5.8%' },
  { title: '5 signs your transformation is performative', channel: 'LinkedIn', views: '9,800', engagement: '7.2%' },
  { title: 'Agility Is a Means, Not an End', channel: 'Blog', views: '5,600', engagement: '4.9%' },
  { title: 'SPIRAL Framework Deep Dive Newsletter', channel: 'Email', views: '3,200', engagement: '38%' },
];

const channelPerformance = [
  { channel: 'LinkedIn', followers: '8,900', posts: 12, engagement: '5.4%', trend: 'up' },
  { channel: 'Blog', followers: '—', posts: 8, engagement: '4.8%', trend: 'up' },
  { channel: 'Email', followers: '2,400', posts: 6, engagement: '34%', trend: 'up' },
  { channel: 'Twitter/X', followers: '1,200', posts: 5, engagement: '2.1%', trend: 'down' },
];

export default function Analytics() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track, learn, and optimize Spiral Up's content performance.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <motion.div key={s.label} variants={fadeIn}>
            <Card className="shadow-card">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                  <Badge variant="secondary" className={`text-[10px] ${s.up ? 'text-success' : 'text-destructive'}`}>
                    {s.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                    {s.change}
                  </Badge>
                </div>
                <p className="text-2xl font-display font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Content */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Top Performing Content</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topContent.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <span className="text-xs text-muted-foreground font-display font-bold w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.channel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.views}</p>
                    <p className="text-xs text-success">{item.engagement} eng.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Channel Performance */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Channel Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {channelPerformance.map((ch, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ch.channel}</p>
                    <p className="text-xs text-muted-foreground">{ch.followers} followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{ch.posts}</p>
                    <p className="text-xs text-muted-foreground">posts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{ch.engagement}</p>
                    <Badge variant="secondary" className={`text-[10px] ${ch.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                      {ch.trend === 'up' ? '↑' : '↓'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Insights */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-base">🧠 AI Optimization Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { insight: 'Posts about "leadership" outperform other pillars by 34%', action: 'Create more leadership content' },
              { insight: 'Tuesday and Wednesday posts get 2x more engagement', action: 'Schedule key content mid-week' },
              { insight: 'LinkedIn posts with questions get 45% more comments', action: 'End posts with thought-provoking questions' },
              { insight: 'Blog posts with the SPIRAL framework get 28% more shares', action: 'Reference SPIRAL in more articles' },
              { insight: 'Newsletter open rate peaks at 8am CET', action: 'Schedule sends for early morning' },
              { insight: 'Short-form content (< 200 words) has higher engagement on LinkedIn', action: 'Create more concise LinkedIn posts' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg border border-border">
                <p className="text-sm font-medium">{item.insight}</p>
                <p className="text-xs text-primary mt-1 font-medium">→ {item.action}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
