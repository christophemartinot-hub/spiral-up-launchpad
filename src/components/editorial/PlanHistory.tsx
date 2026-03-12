import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useEditorialPlans, useDeleteEditorialPlan } from '@/hooks/use-editorial';
import { toast } from 'sonner';

export default function PlanHistory({ onSelectPlan }: { onSelectPlan: (id: string) => void }) {
  const { data: plans, isLoading } = useEditorialPlans();
  const deletePlan = useDeleteEditorialPlan();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No editorial plans yet. Generate your first one from the Agenda tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">All generated editorial plans. Click to view items.</p>
      {plans.map((plan: any) => (
        <Card key={plan.id} className="shadow-card group">
          <CardContent className="p-4 flex items-center justify-between">
            <button
              className="flex-1 text-left flex items-center gap-4"
              onClick={() => onSelectPlan(plan.id)}
            >
              <div>
                <p className="font-display font-semibold text-sm">
                  {format(new Date(plan.cycle_start), 'MMM d')} — {format(new Date(plan.cycle_end), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px]">{plan.cadence}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{plan.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Created {format(new Date(plan.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-2"
              onClick={() => deletePlan.mutate(plan.id, { onSuccess: () => toast.success('Plan deleted') })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
