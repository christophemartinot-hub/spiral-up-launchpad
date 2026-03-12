
-- Planning configuration (single row)
CREATE TABLE public.planning_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence text NOT NULL DEFAULT 'weekly',
  channels jsonb NOT NULL DEFAULT '["linkedin", "blog", "email"]'::jsonb,
  posts_per_cycle integer NOT NULL DEFAULT 5,
  priority_topics jsonb DEFAULT '[]'::jsonb,
  target_audience text DEFAULT '',
  preferred_formats jsonb DEFAULT '["blog_post", "linkedin_post", "newsletter"]'::jsonb,
  cta_preferences jsonb DEFAULT '[]'::jsonb,
  campaign_focus text DEFAULT '',
  exclusion_rules jsonb DEFAULT '[]'::jsonb,
  auto_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planning_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on planning_config" ON public.planning_config
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Editorial plans (one per cycle)
CREATE TABLE public.editorial_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_start date NOT NULL,
  cycle_end date NOT NULL,
  cadence text NOT NULL DEFAULT 'weekly',
  status text NOT NULL DEFAULT 'draft',
  generated_at timestamptz DEFAULT now(),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.editorial_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on editorial_plans" ON public.editorial_plans
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Editorial items (individual content suggestions within a plan)
CREATE TABLE public.editorial_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.editorial_plans(id) ON DELETE CASCADE NOT NULL,
  publish_date date NOT NULL,
  channel text NOT NULL DEFAULT 'linkedin',
  content_format text NOT NULL DEFAULT 'linkedin_post',
  working_title text NOT NULL DEFAULT '',
  objective text DEFAULT '',
  content_pillar text DEFAULT '',
  related_offer text DEFAULT '',
  cta text DEFAULT '',
  status text NOT NULL DEFAULT 'suggested',
  post_angle text DEFAULT '',
  draft_content text DEFAULT '',
  carousel_idea text DEFAULT '',
  key_message text DEFAULT '',
  suggested_cta text DEFAULT '',
  brand_alignment text DEFAULT '',
  rejection_reason text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.editorial_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on editorial_items" ON public.editorial_items
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed default planning config
INSERT INTO public.planning_config (cadence, channels, posts_per_cycle, target_audience, preferred_formats)
VALUES ('weekly', '["linkedin", "blog", "email"]'::jsonb, 5, 'C-suite executives, transformation leaders, agile coaches', '["linkedin_post", "blog_post", "newsletter"]'::jsonb);
