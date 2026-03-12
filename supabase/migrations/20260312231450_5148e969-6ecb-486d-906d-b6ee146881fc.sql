
-- Add visual fields to editorial_items
ALTER TABLE public.editorial_items
  ADD COLUMN IF NOT EXISTS visual_type text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS visual_concept text DEFAULT '',
  ADD COLUMN IF NOT EXISTS visual_layout text DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_direction text DEFAULT '',
  ADD COLUMN IF NOT EXISTS visual_headline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS visual_subheadline text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_placement text DEFAULT '',
  ADD COLUMN IF NOT EXISTS format_ratio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS recommended_assets jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visual_status text DEFAULT 'none' NOT NULL,
  ADD COLUMN IF NOT EXISTS visual_notes text DEFAULT '';

-- Create visual_config table for AI Visual Prompt settings
CREATE TABLE IF NOT EXISTS public.visual_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preferred_styles jsonb NOT NULL DEFAULT '["clean","minimal","professional"]'::jsonb,
  formats_by_channel jsonb NOT NULL DEFAULT '{"linkedin":"1:1","instagram":"4:5","blog":"16:9","email":"600px wide"}'::jsonb,
  illustration_preference text NOT NULL DEFAULT 'illustrations_first',
  use_book_visuals boolean NOT NULL DEFAULT true,
  use_event_visuals boolean NOT NULL DEFAULT true,
  text_density text NOT NULL DEFAULT 'low',
  cta_placement_pref text NOT NULL DEFAULT 'bottom',
  exclusion_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  simplicity_level text NOT NULL DEFAULT 'high',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visual_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on visual_config" ON public.visual_config FOR ALL TO public USING (true) WITH CHECK (true);

-- Seed default visual config
INSERT INTO public.visual_config (id) VALUES (gen_random_uuid());
