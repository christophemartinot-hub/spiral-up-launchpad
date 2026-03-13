import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Calendar, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, parseISO } from 'date-fns';
import {
  useEditorialPlans,
  useEditorialItems,
  useGenerateEditorialPlan,
  usePlanningConfig,
  useCycleCompletionStatus,
} from '@/hooks/use-editorial';
import EditorialItemCard from './EditorialItemCard';
import { toast } from 'sonner';

interface Props {
  activePlanId: string | null;
  onPlanChange: (id: string | null) => void;
}

export default function EditorialAgenda({ activePlanId, onPlanChange }: Props) {
  const { data: plans, isLoading: plansLoading } = useEditorialPlans();
  const { data: config } = usePlanningConfig();
  const { data: items, isLoading: itemsLoading } = useEditorialItems(activePlanId);
  const { data: cycleStatus } = useCycleCompletionStatus(activePlanId);
  const generate = useGenerateEditorialPlan();

  // Auto-select latest plan
  useEffect(() => {
    if (!activePlanId && plans && plans.length > 0) {
      onPlanChange(plans[0].id);
    }
  }, [plans, activePlanId, onPlanChange]);

  const getNextCycleDates = () => {
    const now = new Date();
    const cadence = config?.cadence || 'weekly';
    const activePlan = plans?.find(p => p.id === activePlanId);
    
    // If there's an active plan, start next cycle after it ends
    const baseDate = activePlan ? parseISO(activePlan.cycle_end) : now;
    const nextStart = addDays(baseDate, 1);
    const cycleStart = format(startOfWeek(nextStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const cycleEnd = cadence === 'weekly'
      ? format(endOfWeek(nextStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      : format(endOfWeek(addWeeks(nextStart, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return { cycleStart, cycleEnd };
  };

  const handleGenerate = () => {
    const { cycleStart, cycleEnd } = plans && plans.length > 0
      ? getNextCycleDates()
      : (() => {
          const now = new Date();
          const cadence = config?.cadence || 'weekly';
          return {
            cycleStart: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
            cycleEnd: cadence === 'weekly'
              ? format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
              : format(endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          };
        })();

    generate.mutate(
      { config, cycleStart, cycleEnd },
      {
        onSuccess: (data) => {
          toast.success(`Editorial plan generated with ${data.items_count} items`);
          onPlanChange(data.plan_id);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Failed to generate plan');
        },
      }
    );
  };

  // Compute stats
  const stats = {
    suggested: items?.filter(i => i.status === 'suggested').length || 0,
    under_review: items?.filter(i => i.status === 'under_review').length || 0,
    approved: items?.filter(i => i.status === 'approved').length || 0,
    rejected: items?.filter(i => i.status === 'rejected').length || 0,
    scheduled: items?.filter(i => i.status === 'scheduled').length || 0,
    published: items?.filter(i => i.status === 'published').length || 0,
  };

  const activePlan = plans?.find(p => p.id === activePlanId);

  if (plansLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Header with generate button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {activePlan ? (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(parseISO(activePlan.cycle_start), 'MMM d')} — {format(parseISO(activePlan.cycle_end), 'MMM d, yyyy')}
              </span>
              <Badge variant="outline" className="text-xs">{activePlan.cadence}</Badge>
              {config?.intelligence_mode && (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {(config.intelligence_mode as string) === 'learning' ? '🧠 Learning' : 
                   (config.intelligence_mode as string) === 'strategic' ? '🎯 Strategic' : '💡 Assist'}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No editorial plan yet. Generate your first one!</p>
          )}
        </div>
        <Button onClick={handleGenerate} disabled={generate.isPending} className="gap-2">
          {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generate.isPending ? 'Generating plan...' : activePlan ? 'Generate New Cycle' : 'Generate First Plan'}
        </Button>
      </div>

      {/* Next cycle suggestion banner */}
      {cycleStatus?.complete && activePlan && (
        <Card className="border-2 border-primary/30 bg-primary/5 shadow-card">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-sm">Next Cycle Ready</p>
                <p className="text-xs text-muted-foreground">
                  {cycleStatus.pct}% of items decided ({cycleStatus.decided}/{cycleStatus.total}). 
                  The AI has analyzed your feedback and performance data to prepare the next cycle.
                </p>
              </div>
            </div>
            <Button onClick={handleGenerate} disabled={generate.isPending} variant="default" className="gap-2 whitespace-nowrap">
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Next Suggested Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats bar */}
      {items && items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {([
            { key: 'suggested', label: 'Suggested', icon: Sparkles, color: 'text-blue-500' },
            { key: 'under_review', label: 'Review', icon: Clock, color: 'text-amber-500' },
            { key: 'approved', label: 'Approved', icon: CheckCircle2, color: 'text-green-500' },
            { key: 'rejected', label: 'Rejected', icon: AlertCircle, color: 'text-red-500' },
            { key: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-purple-500' },
            { key: 'published', label: 'Published', icon: CheckCircle2, color: 'text-emerald-500' },
          ] as const).map(({ key, label, icon: Icon, color }) => (
            <Card key={key} className="shadow-card">
              <CardContent className="p-3 text-center">
                <Icon className={`w-4 h-4 mx-auto ${color}`} />
                <p className="text-lg font-bold mt-1">{stats[key as keyof typeof stats]}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Items */}
      {itemsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : items && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item: any) => (
            <EditorialItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : activePlanId ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No items in this plan.</p>
        </div>
      ) : null}

      {/* Empty state */}
      {(!plans || plans.length === 0) && (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-10 h-10 mx-auto text-primary/50 mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">Your AI Editorial Copilot</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Click "Generate First Plan" and I'll create a complete content agenda based on your Brand Intelligence, 
              content pillars, and planning preferences. You review. You approve. Nothing publishes without you.
            </p>
            <Button onClick={handleGenerate} disabled={generate.isPending} className="gap-2">
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
