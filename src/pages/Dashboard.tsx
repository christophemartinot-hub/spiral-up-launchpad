import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Brain, PenTool, BarChart3, ArrowRight, FileText,
  TrendingUp, Calendar, Rocket, Eye, Lightbulb, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { brandProfile } from '@/data/brand';
import { useFeedbackSummary } from '@/hooks/use-feedback';
import { usePerformanceSummary } from '@/hooks/use-performance';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const quickActions = [
  { label: 'Generate Content', icon: Sparkles, path: '/studio', color: 'gradient-brand' },
  { label: 'Blog Post', icon: PenTool, path: '/blog', color: 'gradient-warm' },
  { label: 'Brand Intelligence', icon: Brain, path: '/brand', color: 'gradient-cool' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics', color: 'bg-accent' },
];

const strategicLoop = [
  { step: '1', label: 'Analyze', description: 'Ingest brand assets & learn', active: true },
  { step: '2', label: 'Strategize', description: 'Define content strategy', active: true },
  { step: '3', label: 'Generate', description: 'AI-powered content creation', active: true },
  { step: '4', label: 'Publish', description: 'Schedule across channels', active: true },
  { step: '5', label: 'Track', description: 'Measure performance', active: true },
  { step: '6', label: 'Optimize', description: 'Learn & improve', active: true },
];

export default function Dashboard() {
  const { data: feedback, isLoading: fbLoading } = useFeedbackSummary();
  const { data: perf, isLoading: perfLoading } = usePerformanceSummary();

  // Derive intelligence insights
  const topTopics = feedback?.topApproved?.slice(0, 3) || [];
  const rejectedThemes = feedback?.topRejected?.slice(0, 2) || [];
  const topChannel = perf ? Object.entries(perf.byChannel).sort((a, b) => b[1].totalEngagement - a[1].totalEngagement)[0] : null;

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
            <CardTitle className="font-display text-base">Continuous Content Loop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {strategicLoop.map((item) => (
                <div key={item.step} className="text-center p-3 rounded-xl border-2 border-primary bg-primary/5">
                  <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-display font-bold gradient-brand text-primary-foreground">
                    {item.step}
                  </div>
                  <p className="text-xs font-display font-semibold mt-2">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Intelligence */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Content Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fbLoading || perfLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {feedback && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Approval Rate</span>
                      <span className="font-semibold text-green-600">{feedback.approvalRate}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Items Reviewed</span>
                      <span className="font-semibold">{feedback.total}</span>
                    </div>
                  </div>
                )}

                {topTopics.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-green-600 mb-1">✅ Top Themes</p>
                    {topTopics.map((t: any, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">• {t.topic}</p>
                    ))}
                  </div>
                )}

                {rejectedThemes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-red-500 mb-1">❌ Avoid</p>
                    {rejectedThemes.map((t: any, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">• {t.topic}</p>
                    ))}
                  </div>
                )}

                {topChannel && (
                  <div>
                    <p className="text-[10px] font-medium text-blue-600 mb-1">📊 Best Channel</p>
                    <p className="text-xs text-muted-foreground">{topChannel[0]} — {topChannel[1].totalEngagement} engagement</p>
                  </div>
                )}

                {!feedback && !perf && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Start reviewing content to activate intelligence.
                  </p>
                )}

                <Link to="/editorial">
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1 mt-1">
                    <Brain className="w-3 h-3" /> View Full Intelligence
                  </Button>
                </Link>
              </>
            )}
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
