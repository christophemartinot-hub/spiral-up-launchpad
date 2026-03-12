import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { useFeedbackSummary } from '@/hooks/use-feedback';
import { usePerformanceSummary } from '@/hooks/use-performance';

export default function EditorialIntelligence() {
  const { data: feedback, isLoading: fbLoading } = useFeedbackSummary();
  const { data: perf, isLoading: perfLoading } = usePerformanceSummary();

  if (fbLoading || perfLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (!feedback && !perf) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-16 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">Learning Engine Warming Up</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The system learns from your approval behavior, edits, and performance data.
            Start approving, editing, or rejecting editorial items to activate the learning engine.
          </p>
        </CardContent>
      </Card>
    );
  }

  const learnings: { type: 'success' | 'warning' | 'info'; icon: any; message: string }[] = [];

  // Feedback-based learnings
  if (feedback) {
    learnings.push({
      type: 'info', icon: BarChart3,
      message: `${feedback.total} items reviewed: ${feedback.approvalRate}% approval rate (${feedback.cleanApprovalRate}% approved without edits, ${feedback.editRate}% edited before approval).`,
    });

    if (feedback.topApproved.length > 0) {
      const top = feedback.topApproved[0];
      learnings.push({
        type: 'success', icon: TrendingUp,
        message: `"${top.topic}" topics are your most approved theme (${top.approved} approvals). The AI will suggest more content in this direction.`,
      });
    }

    if (feedback.topRejected.length > 0) {
      const worst = feedback.topRejected[0];
      learnings.push({
        type: 'warning', icon: TrendingDown,
        message: `"${worst.topic}" topics were rejected ${worst.rejected} times. The AI will reduce suggestions in this area and try new angles.`,
      });
    }

    if (feedback.titleEdits > 0) {
      learnings.push({
        type: 'info', icon: AlertTriangle,
        message: `You edited ${feedback.titleEdits} titles — the AI will adapt headline style to match your preferences.`,
      });
    }

    if (feedback.ctaEdits > 0) {
      learnings.push({
        type: 'info', icon: AlertTriangle,
        message: `You changed CTAs ${feedback.ctaEdits} times — the AI will simplify and adjust future CTA patterns.`,
      });
    }

    if (feedback.visualEdits > 0) {
      learnings.push({
        type: 'info', icon: AlertTriangle,
        message: `You modified visuals ${feedback.visualEdits} times — the AI will adjust visual selection accordingly.`,
      });
    }
  }

  // Performance-based learnings
  if (perf) {
    const topChannel = Object.entries(perf.byChannel).sort((a, b) => b[1].totalEngagement - a[1].totalEngagement)[0];
    if (topChannel) {
      learnings.push({
        type: 'success', icon: TrendingUp,
        message: `${topChannel[0]} drives ${topChannel[1].totalEngagement} total engagement across ${topChannel[1].count} posts — prioritize this channel.`,
      });
    }

    const topVisual = Object.entries(perf.byVisual).filter(([k]) => k !== 'none').sort((a, b) => b[1].totalEngagement - a[1].totalEngagement)[0];
    if (topVisual) {
      learnings.push({
        type: 'success', icon: TrendingUp,
        message: `"${topVisual[0].replace(/_/g, ' ')}" visuals perform best (${topVisual[1].totalEngagement} engagement) — use more of this style.`,
      });
    }
  }

  // Suggested adjustments
  const adjustments: string[] = [];
  if (feedback) {
    if (feedback.cleanApprovalRate < 50 && feedback.total > 3) {
      adjustments.push('Approval rate is below 50%. The AI should improve topic relevance and tone matching.');
    }
    if (feedback.titleEdits > feedback.total * 0.3) {
      adjustments.push('Headlines are being edited frequently. Adjust headline style to be more direct and specific.');
    }
    if (feedback.ctaEdits > feedback.total * 0.3) {
      adjustments.push('CTAs are being simplified. Use shorter, more action-oriented CTAs.');
    }
    if (feedback.topRejected.length > 0) {
      adjustments.push(`Reduce content about "${feedback.topRejected[0].topic}" and explore underrepresented pillars.`);
    }
    if (feedback.topApproved.length > 0 && feedback.topApproved[0].approved > 3) {
      adjustments.push(`"${feedback.topApproved[0].topic}" works well but avoid over-repetition — vary the angles.`);
    }
  }
  if (perf) {
    const pillarEntries = Object.entries(perf.byPillar).sort((a, b) => a[1].count - b[1].count);
    if (pillarEntries.length > 1) {
      adjustments.push(`Increase content for "${pillarEntries[0][0]}" pillar to maintain editorial diversity.`);
    }
  }
  if (adjustments.length === 0) {
    adjustments.push('Keep generating and reviewing content — the learning engine needs more data for specific adjustments.');
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {feedback && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{feedback.total}</p>
              <p className="text-[10px] text-muted-foreground">Items Reviewed</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{feedback.approvalRate}%</p>
              <p className="text-[10px] text-muted-foreground">Approval Rate</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{feedback.editRate}%</p>
              <p className="text-[10px] text-muted-foreground">Edit Rate</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-500">{feedback.rejected}</p>
              <p className="text-[10px] text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Learnings */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4" /> What the System Is Learning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {learnings.map((l, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              l.type === 'success' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' :
              l.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
              'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
            }`}>
              <l.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{l.message}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Most approved / rejected / edited */}
      {feedback && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">✅ Most Approved Topics</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {feedback.topApproved.length === 0 ? (
                <p className="text-xs text-muted-foreground">Not enough data yet.</p>
              ) : feedback.topApproved.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{t.topic}</span>
                  <Badge variant="secondary" className="text-[10px] ml-2">{t.approved} approved</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-red-500">❌ Most Rejected Themes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {feedback.topRejected.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rejections yet.</p>
              ) : feedback.topRejected.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{t.topic}</span>
                  <Badge variant="destructive" className="text-[10px] ml-2">{t.rejected} rejected</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-600">✏️ Most Edited Areas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {feedback.mostEdited.length === 0 ? (
                <p className="text-xs text-muted-foreground">No edits tracked yet.</p>
              ) : feedback.mostEdited.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{t.topic}</span>
                  <Badge variant="outline" className="text-[10px] ml-2">{t.edited} edits</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Adjustments */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">📈 Suggested Adjustments for Next Cycle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {adjustments.map((a, i) => (
            <p key={i} className="text-sm">• {a}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
