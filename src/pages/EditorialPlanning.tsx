import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditorialAgenda from '@/components/editorial/EditorialAgenda';
import PlanningConfigPanel from '@/components/editorial/PlanningConfigPanel';
import PlanHistory from '@/components/editorial/PlanHistory';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function EditorialPlanning() {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Editorial Planning</h1>
        <p className="text-muted-foreground mt-1">
          Your AI editorial copilot — review, approve, and schedule brand-aligned content.
        </p>
      </motion.div>

      <Tabs defaultValue="agenda" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="agenda">📋 Agenda</TabsTrigger>
          <TabsTrigger value="config">⚙️ AI Planning Prompt</TabsTrigger>
          <TabsTrigger value="history">📁 Plan History</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda">
          <EditorialAgenda activePlanId={activePlanId} onPlanChange={setActivePlanId} />
        </TabsContent>
        <TabsContent value="config">
          <PlanningConfigPanel />
        </TabsContent>
        <TabsContent value="history">
          <PlanHistory onSelectPlan={setActivePlanId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
