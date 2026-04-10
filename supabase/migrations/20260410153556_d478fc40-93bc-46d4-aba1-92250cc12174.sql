-- LinkedIn posts table
CREATE TABLE public.linkedin_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hook text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  hashtags jsonb DEFAULT '[]'::jsonb,
  image_url text DEFAULT '',
  visual_concept text DEFAULT '',
  visual_type text DEFAULT '',
  content_pillar text DEFAULT '',
  cta text DEFAULT '',
  character_count integer DEFAULT 0,
  editorial_item_id uuid REFERENCES editorial_items(id),
  external_post_id text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_publish_at timestamptz,
  engagement_data jsonb DEFAULT '{}'::jsonb,
  linkedin_version text DEFAULT '',
  blog_version text DEFAULT '',
  newsletter_version text DEFAULT '',
  author text NOT NULL DEFAULT 'Christophe Martinot',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.linkedin_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on linkedin_posts" ON public.linkedin_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Instagram posts table
CREATE TABLE public.instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caption text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'post',
  media_urls jsonb DEFAULT '[]'::jsonb,
  cover_image_url text DEFAULT '',
  visual_concept text DEFAULT '',
  visual_type text DEFAULT '',
  hashtags jsonb DEFAULT '[]'::jsonb,
  content_pillar text DEFAULT '',
  cta text DEFAULT '',
  reel_script text DEFAULT '',
  carousel_slides jsonb DEFAULT '[]'::jsonb,
  editorial_item_id uuid REFERENCES editorial_items(id),
  external_post_id text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_publish_at timestamptz,
  engagement_data jsonb DEFAULT '{}'::jsonb,
  linkedin_version text DEFAULT '',
  blog_version text DEFAULT '',
  author text NOT NULL DEFAULT 'Christophe Martinot',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on instagram_posts" ON public.instagram_posts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);