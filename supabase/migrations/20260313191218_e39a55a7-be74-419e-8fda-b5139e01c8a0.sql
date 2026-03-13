
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  slug text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  meta_description text DEFAULT '',
  hero_image_url text DEFAULT '',
  author text NOT NULL DEFAULT 'Christophe Martinot',
  tags jsonb DEFAULT '[]'::jsonb,
  seo_keywords jsonb DEFAULT '[]'::jsonb,
  content_pillar text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  editorial_item_id uuid REFERENCES public.editorial_items(id) ON DELETE SET NULL,
  external_id text DEFAULT '',
  published_at timestamp with time zone,
  linkedin_version text DEFAULT '',
  newsletter_version text DEFAULT '',
  social_snippets jsonb DEFAULT '[]'::jsonb,
  visual_concept text DEFAULT '',
  visual_type text DEFAULT '',
  visual_rationale text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on blog_posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
