import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Brain, PenTool, BarChart3, ArrowRight, Calendar,
  Loader2, Lightbulb, CheckCircle2, Clock, AlertCircle, Eye, Palette,
  Mail, Zap, TrendingUp, FileText, RefreshCw, Image as ImageIcon,
  MessageSquare, Target, BookOpen, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useEditorialPlans, useEditorialItems, useCycleCompletionStatus, useLearningMemory } from '@/hooks/use-editorial';
import { useFeedbackSummary } from '@/hooks/use-feedback';
import { usePerformanceSummary } from '@/hooks/use-performance';
import { useCommentCounts } from '@/hooks/use-comments';
import { useLatestApprovedIdeas, useStrategicCycles } from '@/hooks/use-strategic';
import { resolveBrandIcon } from '@/lib/brand-assets';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const STATUS_COLORS: Record<string, string> = {
  suggested: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: '💼', blog: '📝', email: '✉️', instagram: '📸', twitter: '𝕏',
};

const VISUAL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  suggested: { label: 'Awaiting Approval', color: 'text-amber-600' },
  approved: { label: 'Ready', color: 'text-green-600' },
  rejected: { label: 'Needs Redesign', color: 'text-red-600' },
  none: { label: 'No Visual', color: 'text-muted-foreground' },
};

export default function Dashboard() {
  const { data: plans, isLoading: plansLoading } = useEditorialPlans();
  const activePlan = plans?.[0];
  const { data: items, isLoading: itemsLoading } = useEditorialItems(activePlan?.id ?? null);
  const { data: cycleStatus } = useCycleCompletionStatus(activePlan?.id ?? null);
  const { data: feedback, isLoading: fbLoading } = useFeedbackSummary();
  const { data: perf, isLoading: perfLoading } = usePerformanceSummary();
  const { data: memories } = useLearningMemory();
  const { data: commentCounts } = useCommentCounts();
  const { data: strategicCycles = [] } = useStrategicCycles();
  const { data: approvedIdeas = [] } = useLatestApprovedIdeas();

  const loading = plansLoading || itemsLoading;

  // Compute editorial stats
  const statusCounts = {
    suggested: items?.filter(i => i.status === 'suggested').length || 0,
    under_review: items?.filter(i => i.status === 'under_review').length || 0,
    approved: items?.filter(i => i.status === 'approved').length || 0,
    rejected: items?.filter(i => i.status === 'rejected').length || 0,
    scheduled: items?.filter(i => i.status === 'scheduled').length || 0,
    published: items?.filter(i => i.status === 'published').length || 0,
  };

  // Visual workflow stats
  const visualItems = items?.filter(i => i.visual_status && i.visual_status !== 'none') || [];
  const visualsAwaiting = visualItems.filter(i => i.visual_status === 'suggested').length;
  const visualsRedesign = visualItems.filter(i => i.visual_status === 'rejected').length;
  const visualsReady = visualItems.filter(i => i.visual_status === 'approved').length;

  // Performance top items
  const topPosts = perf?.items?.sort((a: any, b: any) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 3) || [];
  const topChannel = perf ? Object.entries(perf.byChannel).sort((a, b) => b[1].totalEngagement - a[1].totalEngagement)[0] : null;

  // Learning insights from memories
  const approvedMemories = memories?.filter(m => m.memory_type === 'approved' || m.action_outcome === 'approved') || [];
  const rejectedMemories = memories?.filter(m => m.memory_type === 'rejected' || m.action_outcome === 'rejected') || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Content Command Center</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your strategic content operating system — analyze, create, approve, publish.
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial="hidden" animate="show" variants={stagger}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'New Editorial Cycle', icon: Sparkles, path: '/editorial', color: 'gradient-brand' },
          { label: 'Blog Draft', icon: PenTool, path: '/blog', color: 'gradient-warm' },
          { label: 'Social Post', icon: FileText, path: '/studio', color: 'gradient-cool' },
          { label: 'Newsletter', icon: Mail, path: '/email', color: 'bg-accent' },
          { label: 'Comment Replies', icon: MessageSquare, path: '/comments', color: 'bg-secondary' },
          { label: 'Visual Concept', icon: Palette, path: '/editorial', color: 'bg-muted' },
        ].map(a => (
          <motion.div key={a.label} variants={fadeIn}>
            <Link to={a.path}>
              <Card className="shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5 cursor-pointer group">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center mb-2`}>
                    <a.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="font-display font-semibold text-xs">{a.label}</p>
                  <ArrowRight className="w-3 h-3 text-muted-foreground mt-1.5 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── EDITORIAL AGENDA (2 cols) ─── */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Editorial Agenda
              </CardTitle>
              <Link to="/editorial">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            {activePlan && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(activePlan.cycle_start), 'MMM d')} — {format(new Date(activePlan.cycle_end), 'MMM d, yyyy')}
                <Badge variant="outline" className="ml-2 text-[10px]">{activePlan.cadence}</Badge>
              </p>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : !activePlan ? (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 mx-auto text-primary/40 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">No editorial plan yet.</p>
                <Link to="/editorial"><Button size="sm" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Generate First Plan</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status bar */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {([
                    { key: 'suggested', label: 'Suggested', icon: Sparkles, color: 'text-blue-500' },
                    { key: 'under_review', label: 'Review', icon: Clock, color: 'text-amber-500' },
                    { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-green-500' },
                    { key: 'rejected', label: 'Rejected', icon: AlertCircle, color: 'text-red-500' },
                    { key: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-purple-500' },
                    { key: 'published', label: 'Published', icon: CheckCircle2, color: 'text-emerald-500' },
                  ] as const).map(({ key, label, icon: Icon, color }) => (
                    <div key={key} className="text-center p-2 rounded-lg bg-muted/40">
                      <Icon className={`w-3.5 h-3.5 mx-auto ${color}`} />
                      <p className="text-base font-bold mt-0.5">{statusCounts[key as keyof typeof statusCounts]}</p>
                      <p className="text-[9px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Item list */}
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {items?.slice(0, 10).map((item: any) => {
                    const brandIcon = resolveBrandIcon(item.content_pillar || item.working_title || '');
                    return (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      {brandIcon ? (
                        <img src={brandIcon} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                      ) : (
                        <span className="text-sm flex-shrink-0">{CHANNEL_ICONS[item.channel] || '📌'}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.working_title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[item.status] || ''}`}>
                            {item.status}
                          </span>
                          {item.content_pillar && (
                            <span className="text-[9px] text-muted-foreground">{item.content_pillar}</span>
                          )}
                          {item.visual_type && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Palette className="w-2 h-2" /> {item.visual_type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground flex-shrink-0">
                        {format(new Date(item.publish_date), 'MMM d')}
                      </span>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── VISUAL WORKFLOW ─── */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Palette className="w-4 h-4 text-secondary" /> Visual Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                <div className="space-y-2">
                  {[
                    { label: 'Awaiting Approval', count: visualsAwaiting, icon: Clock, color: 'text-amber-500' },
                    { label: 'Needs Redesign', count: visualsRedesign, icon: RefreshCw, color: 'text-red-500' },
                    { label: 'Ready to Publish', count: visualsReady, icon: CheckCircle2, color: 'text-green-500' },
                  ].map(v => (
                    <div key={v.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2">
                        <v.icon className={`w-3.5 h-3.5 ${v.color}`} />
                        <span className="text-xs font-medium">{v.label}</span>
                      </div>
                      <span className="text-sm font-bold">{v.count}</span>
                    </div>
                  ))}
                </div>

                {/* Visual items needing action */}
                {visualItems.filter(i => i.visual_status === 'suggested' || i.visual_status === 'rejected').slice(0, 4).map((item: any) => {
                  const vs = VISUAL_STATUS_LABELS[item.visual_status] || VISUAL_STATUS_LABELS.none;
                  return (
                    <div key={item.id} className="border rounded-lg p-2.5 space-y-1">
                      <p className="text-xs font-medium truncate">{item.working_title}</p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <ImageIcon className="w-2.5 h-2.5" />
                        <span>{item.visual_type?.replace(/_/g, ' ') || 'No type'}</span>
                        <span className={`font-medium ${vs.color}`}>{vs.label}</span>
                      </div>
                    </div>
                  );
                })}

                <Link to="/editorial">
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                    <Eye className="w-3 h-3" /> Review All Visuals
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* ─── CONTENT PERFORMANCE ─── */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {perfLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : !perf ? (
              <p className="text-xs text-muted-foreground text-center py-4">No performance data yet.</p>
            ) : (
              <>
                {topPosts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Top Posts</p>
                    {topPosts.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <span className="text-xs truncate flex-1">{p.topic || 'Untitled'}</span>
                        <Badge variant="secondary" className="text-[9px] ml-2">{p.engagement || 0} eng</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {topChannel && (
                  <div className="bg-muted/40 rounded-lg p-2.5">
                    <p className="text-[10px] font-medium text-muted-foreground">Best Channel</p>
                    <p className="text-sm font-bold">{topChannel[0]}</p>
                    <p className="text-[10px] text-muted-foreground">{topChannel[1].totalEngagement} total engagement</p>
                  </div>
                )}

                {perf.byPillar && Object.keys(perf.byPillar).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">By Pillar</p>
                    {Object.entries(perf.byPillar).sort((a, b) => b[1].totalEngagement - a[1].totalEngagement).slice(0, 4).map(([pillar, data]: any) => (
                      <div key={pillar} className="flex items-center justify-between py-0.5">
                        <span className="text-xs truncate">{pillar}</span>
                        <span className="text-[10px] text-muted-foreground">{data.totalEngagement} eng</span>
                      </div>
                    ))}
                  </div>
                )}

                <Link to="/performance">
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                    <BarChart3 className="w-3 h-3" /> Full Performance
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── LEARNING INSIGHTS ─── */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fbLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : !feedback ? (
              <p className="text-xs text-muted-foreground text-center py-4">Start reviewing content to activate intelligence.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-green-600">{feedback.approvalRate}%</p>
                    <p className="text-[9px] text-muted-foreground">Approval Rate</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-amber-600">{feedback.editRate}%</p>
                    <p className="text-[9px] text-muted-foreground">Edit Rate</p>
                  </div>
                </div>

                {feedback.topApproved?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-green-600 mb-1">✅ Most Approved</p>
                    {feedback.topApproved.slice(0, 3).map((t: any, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">• {t.topic}</p>
                    ))}
                  </div>
                )}

                {feedback.mostEdited?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-amber-600 mb-1">✏️ Most Edited</p>
                    {feedback.mostEdited.slice(0, 2).map((t: any, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">• {t.topic} ({t.edited}x)</p>
                    ))}
                  </div>
                )}

                {feedback.topRejected?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-red-500 mb-1">❌ Rejected Themes</p>
                    {feedback.topRejected.slice(0, 2).map((t: any, i: number) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">• {t.topic}</p>
                    ))}
                  </div>
                )}

                {perf?.byVisual && Object.keys(perf.byVisual).filter(v => v !== 'none').length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-purple-600 mb-1">🎨 Best Visual Types</p>
                    {Object.entries(perf.byVisual).filter(([k]) => k !== 'none').sort((a, b) => b[1].totalEngagement - a[1].totalEngagement).slice(0, 2).map(([type, data]: any) => (
                      <p key={type} className="text-xs text-muted-foreground">• {type.replace(/_/g, ' ')} ({data.totalEngagement} eng)</p>
                    ))}
                  </div>
                )}

                <Link to="/editorial">
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                    <Brain className="w-3 h-3" /> Full Intelligence
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── NEXT CYCLE SUGGESTIONS ─── */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Next Cycle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cycleStatus?.complete ? (
              <>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                  <Zap className="w-6 h-6 text-primary mx-auto mb-1" />
                  <p className="text-sm font-display font-semibold">Ready to Generate</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {cycleStatus.pct}% decided ({cycleStatus.decided}/{cycleStatus.total} items).
                    The AI has analyzed your feedback.
                  </p>
                </div>
                <Link to="/editorial">
                  <Button className="w-full gap-1.5" size="sm">
                    <Sparkles className="w-3.5 h-3.5" /> Generate Next Plan
                  </Button>
                </Link>
              </>
            ) : activePlan ? (
              <>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm font-display font-semibold">Current Cycle Active</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {cycleStatus?.pct || 0}% complete — review remaining items to unlock next cycle.
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${cycleStatus?.pct || 0}%` }} />
                </div>

                {/* Suggested themes from learning memory */}
                {memories && memories.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Suggested Themes</p>
                    {memories.filter(m => m.action_outcome === 'approved' || m.memory_type === 'approved').slice(0, 3).map((m: any) => (
                      <div key={m.id} className="text-xs text-muted-foreground py-0.5 flex items-center gap-1">
                        <span className="text-green-500">↑</span> {m.topic}
                      </div>
                    ))}
                    {memories.filter(m => m.action_outcome === 'rejected' || m.memory_type === 'rejected').slice(0, 2).map((m: any) => (
                      <div key={m.id} className="text-xs text-muted-foreground py-0.5 flex items-center gap-1">
                        <span className="text-red-500">↓</span> {m.topic}
                      </div>
                    ))}
                  </div>
                )}

                <Link to="/editorial">
                  <Button variant="outline" className="w-full gap-1.5 text-xs" size="sm">
                    <Eye className="w-3 h-3" /> Review Items
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <Sparkles className="w-8 h-8 mx-auto text-primary/30 mb-2" />
                <p className="text-xs text-muted-foreground mb-3">Start your first editorial cycle</p>
                <Link to="/editorial">
                  <Button size="sm" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Get Started</Button>
                </Link>
        {/* ─── COMMENT INBOX ─── */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Comments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {commentCounts ? (
              <>
                <div className="space-y-2">
                  {[
                    { label: 'New', count: commentCounts.byStatus?.new || 0, color: 'text-blue-500' },
                    { label: 'Awaiting Approval', count: (commentCounts.byStatus?.reply_suggested || 0) + (commentCounts.byStatus?.awaiting_approval || 0), color: 'text-amber-500' },
                    { label: 'Answered', count: commentCounts.byStatus?.sent || 0, color: 'text-green-500' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                      <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
                      <span className="text-sm font-bold">{s.count}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/40 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{commentCounts.total}</p>
                  <p className="text-[9px] text-muted-foreground">Total Comments</p>
                </div>
                <Link to="/comments">
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1">
                    <MessageSquare className="w-3 h-3" /> Manage Comments
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No comments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Loop */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center flex-wrap gap-2 justify-center text-xs font-display font-semibold">
            {['Analyze', 'Strategize', 'Generate', 'Publish', 'Track', 'Optimize'].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
                {i < 5 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
              </span>
            ))}
            <ArrowRight className="w-3 h-3 text-primary" />
            <span className="text-primary">Repeat</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
