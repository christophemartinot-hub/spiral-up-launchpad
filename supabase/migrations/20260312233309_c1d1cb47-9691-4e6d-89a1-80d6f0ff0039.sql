
-- Learning memory table for continuous loop
CREATE TABLE public.learning_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES public.editorial_plans(id) ON DELETE SET NULL,
  memory_type text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  content_pillar text DEFAULT '',
  channel text DEFAULT '',
  content_format text DEFAULT '',
  visual_type text DEFAULT '',
  cta text DEFAULT '',
  action_outcome text DEFAULT '',
  performance_score numeric DEFAULT 0,
  notes text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on learning_memory" ON public.learning_memory FOR ALL TO public USING (true) WITH CHECK (true);

-- Add intelligence_mode to planning_config
ALTER TABLE public.planning_config ADD COLUMN IF NOT EXISTS intelligence_mode text NOT NULL DEFAULT 'learning';
-- Add strategic_balance config
ALTER TABLE public.planning_config ADD COLUMN IF NOT EXISTS strategic_balance jsonb DEFAULT '{"spiral_framework": 20, "leadership_insights": 20, "organizational_transformation": 15, "blog_promotion": 15, "book_promotion": 10, "events_workshops": 10, "thought_leadership": 10}'::jsonb;
-- Add topic_cooldown
ALTER TABLE public.planning_config ADD COLUMN IF NOT EXISTS topic_cooldown_cycles integer NOT NULL DEFAULT 3;

-- Add suggestion_rationale to editorial_items
ALTER TABLE public.editorial_items ADD COLUMN IF NOT EXISTS suggestion_rationale text DEFAULT '';
