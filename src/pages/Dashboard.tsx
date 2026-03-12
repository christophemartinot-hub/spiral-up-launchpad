import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Brain, PenTool, BarChart3, ArrowRight, FileText,
  TrendingUp, Calendar, Rocket, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { brandProfile } from '@/data/brand';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const quickActions = [
  { label: 'Generate Content', icon: Sparkles, path: '/studio', color: 'gradient-brand' },
  { label: 'Blog Post', icon: PenTool, path: '/blog', color: 'gradient-warm' },
  { label: 'Brand Intelligence', icon: Brain, path: '/brand', color: 'gradient-cool' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics', color: 'bg-accent' },
];

const recentActivity = [
  { action: 'Blog post generated', detail: '"Why Most Transformations Fail"', time: '2 hours ago', icon: FileText },
  { action: 'LinkedIn post published', detail: 'Leadership evolution series #3', time: '5 hours ago', icon: TrendingUp },
  { action: 'Campaign created', detail: 'Q2 Thought Leadership Sprint', time: '1 day ago', icon: Rocket },
  { action: 'Newsletter sent', detail: 'SPIRAL Framework Deep Dive', time: '2 days ago', icon: Eye },
];

const strategicLoop = [
  { step: '1', label: 'Analyze', description: 'Ingest brand assets & learn', active: true },
  { step: '2', label: 'Strategize', description: 'Define content strategy', active: true },
  { step: '3', label: 'Generate', description: 'AI-powered content creation', active: true },
  { step: '4', label: 'Publish', description: 'Schedule across channels', active: false },
  { step: '5', label: 'Track', description: 'Measure performance', active: false },
  { step: '6', label: 'Optimize', description: 'Learn & improve', active: false },
];

export default function Dashboard() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Command Center</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, Christophe. Your AI marketing engine is ready.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <motion.div key={action.label} variants={fadeIn}>
            <Link to={action.path}>
              <Card className="shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5 cursor-pointer group">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="font-display font-semibold text-sm">{action.label}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-2 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Strategic Loop */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Strategic Content Loop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {strategicLoop.map((item) => (
                <div key={item.step} className={`text-center p-3 rounded-xl border-2 transition-colors ${
                  item.active ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-display font-bold ${
                    item.active ? 'gradient-brand text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.step}
                  </div>
                  <p className="text-xs font-display font-semibold mt-2">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                  <p className="text-[10px] text-muted-foreground/60">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Content Pillars Overview */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-4">Content Pillars</h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {brandProfile.contentPillars.map((p) => (
            <Card key={p.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{p.emoji}</span>
                  <p className="font-display font-semibold text-sm">{p.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                <div className="flex flex-wrap gap-1">
                  {p.topics.slice(0, 3).map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Start */}
      <Card className="shadow-card border-2 border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-bold text-base">Ready to create?</p>
              <p className="text-sm text-muted-foreground">Generate brand-aligned content in seconds.</p>
            </div>
          </div>
          <Link to="/studio">
            <Button className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
              <Sparkles className="w-4 h-4 mr-2" /> Open Content Studio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
