import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditorialAgenda from '@/components/editorial/EditorialAgenda';
import WeekReviewBoard from '@/components/editorial/WeekReviewBoard';
import WeeklyOverview from '@/components/editorial/WeeklyOverview';
import PlanningConfigPanel from '@/components/editorial/PlanningConfigPanel';
import VisualConfigPanel from '@/components/editorial/VisualConfigPanel';
import PlanHistory from '@/components/editorial/PlanHistory';
import EditorialIntelligence from '@/components/editorial/EditorialIntelligence';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function EditorialPlanning() {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-xl md:text-2xl font-display font-bold">Editorial Planning</h1>
        <p className="text-muted-foreground mt-1">
          Your AI editorial copilot — review, approve, and schedule brand-aligned content with visual directions.
        </p>
      </motion.div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="weekly">📅 Weekly Overview</TabsTrigger>
          <TabsTrigger value="agenda">📋 Agenda</TabsTrigger>
          <TabsTrigger value="week-review">👁️ Week Review</TabsTrigger>
          <TabsTrigger value="intelligence">🧠 Intelligence</TabsTrigger>
          <TabsTrigger value="config">⚙️ AI Planning Prompt</TabsTrigger>
          <TabsTrigger value="visual-config">🎨 AI Visual Prompt</TabsTrigger>
          <TabsTrigger value="history">📁 Plan History</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <WeeklyOverview />
        </TabsContent>
        <TabsContent value="agenda">
          <EditorialAgenda activePlanId={activePlanId} onPlanChange={setActivePlanId} />
        </TabsContent>
        <TabsContent value="week-review">
          <WeekReviewBoard activePlanId={activePlanId} />
        </TabsContent>
        <TabsContent value="intelligence">
          <EditorialIntelligence />
        </TabsContent>
        <TabsContent value="config">
          <PlanningConfigPanel />
        </TabsContent>
        <TabsContent value="visual-config">
          <VisualConfigPanel />
        </TabsContent>
        <TabsContent value="history">
          <PlanHistory onSelectPlan={setActivePlanId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
