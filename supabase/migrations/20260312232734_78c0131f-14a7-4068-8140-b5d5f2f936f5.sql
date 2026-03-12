
-- Editorial feedback tracking table for learning signals
CREATE TABLE IF NOT EXISTS public.editorial_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  editorial_item_id uuid REFERENCES public.editorial_items(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.editorial_plans(id) ON DELETE CASCADE,
  action_type text NOT NULL DEFAULT '',
  -- Content signals (snapshot of AI-generated version)
  original_title text DEFAULT '',
  original_content text DEFAULT '',
  original_cta text DEFAULT '',
  original_visual_type text DEFAULT '',
  original_content_pillar text DEFAULT '',
  original_topic text DEFAULT '',
  -- Final approved version
  final_title text DEFAULT '',
  final_content text DEFAULT '',
  final_cta text DEFAULT '',
  final_visual_type text DEFAULT '',
  final_content_pillar text DEFAULT '',
  -- Edit delta signals
  title_changed boolean DEFAULT false,
  content_changed boolean DEFAULT false,
  cta_changed boolean DEFAULT false,
  visual_changed boolean DEFAULT false,
  pillar_changed boolean DEFAULT false,
  tone_adjusted boolean DEFAULT false,
  -- Metadata
  rejection_reason text DEFAULT '',
  channel text DEFAULT '',
  content_format text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.editorial_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on editorial_feedback" ON public.editorial_feedback FOR ALL TO public USING (true) WITH CHECK (true);
