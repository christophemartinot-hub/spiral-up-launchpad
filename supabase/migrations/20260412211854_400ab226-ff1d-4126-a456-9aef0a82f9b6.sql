CREATE TABLE IF NOT EXISTS public.facebook_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  link_url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  visual_concept TEXT DEFAULT '',
  hashtags JSONB DEFAULT '[]',
  content_pillar TEXT DEFAULT '',
  cta TEXT DEFAULT '',
  editorial_item_id UUID REFERENCES public.editorial_items(id),
  external_post_id TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_publish_at TIMESTAMPTZ,
  engagement_data JSONB DEFAULT '{}',
  linkedin_version TEXT DEFAULT '',
  blog_version TEXT DEFAULT '',
  instagram_version TEXT DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Christophe Martinot',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_facebook_posts_status ON public.facebook_posts(status);

ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage facebook_posts"
  ON public.facebook_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);