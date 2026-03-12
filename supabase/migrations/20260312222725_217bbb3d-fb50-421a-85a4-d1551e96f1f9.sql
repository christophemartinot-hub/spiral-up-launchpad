
-- Brand Core - single row store
CREATE TABLE public.brand_core (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'Spiral Up',
  tagline text DEFAULT 'Spiral Up. Elevate through every challenge.',
  founder text DEFAULT 'Christophe Martinot',
  company text DEFAULT 'SeedingEnergy',
  website text DEFAULT 'https://spiralingup.works',
  mission text DEFAULT '',
  vision text DEFAULT '',
  key_beliefs jsonb DEFAULT '[]'::jsonb,
  short_description text DEFAULT '',
  long_description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Founder Profile
CREATE TABLE public.founder_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_bio text DEFAULT '',
  long_bio text DEFAULT '',
  expertise_areas jsonb DEFAULT '[]'::jsonb,
  past_companies jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  speaking_topics jsonb DEFAULT '[]'::jsonb,
  personal_tone_guidelines text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- SPIRAL Framework Principles
CREATE TABLE public.spiral_principles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter char(1) NOT NULL,
  principle_name text NOT NULL DEFAULT '',
  short_description text DEFAULT '',
  long_explanation text DEFAULT '',
  key_questions jsonb DEFAULT '[]'::jsonb,
  practical_examples jsonb DEFAULT '[]'::jsonb,
  quotes jsonb DEFAULT '[]'::jsonb,
  visual_icon text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Voice and Tone Rules
CREATE TABLE public.voice_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tone_description text DEFAULT '',
  words_to_avoid jsonb DEFAULT '[]'::jsonb,
  words_to_prefer jsonb DEFAULT '[]'::jsonb,
  writing_style_rules jsonb DEFAULT '[]'::jsonb,
  sentence_style_examples jsonb DEFAULT '[]'::jsonb,
  typical_expressions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Content Pillars
CREATE TABLE public.brand_content_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  target_audience text DEFAULT '',
  typical_topics jsonb DEFAULT '[]'::jsonb,
  example_posts jsonb DEFAULT '[]'::jsonb,
  keywords jsonb DEFAULT '[]'::jsonb,
  emoji text DEFAULT '📌',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Brand Assets (Brand Kit)
CREATE TABLE public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  description text DEFAULT '',
  usage_guidelines text DEFAULT '',
  file_url text DEFAULT '',
  file_type text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Website Knowledge Base
CREATE TABLE public.website_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL DEFAULT '',
  title text DEFAULT '',
  page_text text DEFAULT '',
  key_topics jsonb DEFAULT '[]'::jsonb,
  linked_pillars jsonb DEFAULT '[]'::jsonb,
  last_scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Offer Library
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  target_clients text DEFAULT '',
  key_outcomes jsonb DEFAULT '[]'::jsonb,
  use_cases jsonb DEFAULT '[]'::jsonb,
  cta_examples jsonb DEFAULT '[]'::jsonb,
  icon text DEFAULT '🎯',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Example Content Library
CREATE TABLE public.example_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  content_type text NOT NULL DEFAULT 'blog_post',
  related_pillar uuid REFERENCES public.brand_content_pillars(id) ON DELETE SET NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

-- RLS policies - open for now (no auth yet)
ALTER TABLE public.brand_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founder_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spiral_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_content_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.example_content ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (will lock down after auth is added)
CREATE POLICY "Allow all on brand_core" ON public.brand_core FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on founder_profile" ON public.founder_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on spiral_principles" ON public.spiral_principles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on voice_rules" ON public.voice_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on brand_content_pillars" ON public.brand_content_pillars FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on brand_assets" ON public.brand_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on website_pages" ON public.website_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on offers" ON public.offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on example_content" ON public.example_content FOR ALL USING (true) WITH CHECK (true);

-- Storage policies
CREATE POLICY "Allow all uploads to brand-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-assets');
CREATE POLICY "Allow all reads from brand-assets" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
CREATE POLICY "Allow all updates to brand-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'brand-assets');
CREATE POLICY "Allow all deletes from brand-assets" ON storage.objects FOR DELETE USING (bucket_id = 'brand-assets');

-- Seed default SPIRAL principles
INSERT INTO public.spiral_principles (letter, principle_name, sort_order) VALUES
  ('S', '', 0),
  ('P', '', 1),
  ('I', '', 2),
  ('R', '', 3),
  ('A', '', 4),
  ('L', '', 5);

-- Seed brand_core with one row
INSERT INTO public.brand_core (brand_name, tagline, founder, company, website) VALUES
  ('Spiral Up', 'Spiral Up. Elevate through every challenge.', 'Christophe Martinot', 'SeedingEnergy', 'https://spiralingup.works');

-- Seed founder_profile with one row
INSERT INTO public.founder_profile (short_bio) VALUES ('');

-- Seed voice_rules with one row
INSERT INTO public.voice_rules (tone_description) VALUES ('');
