CREATE TABLE public.brand_content_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source text DEFAULT 'spiralingup.works',
  title text NOT NULL,
  slug text,
  excerpt text,
  content text,
  image_url text,
  tags text[],
  category text,
  read_time text,
  author text,
  published_at timestamptz,
  imported_at timestamptz DEFAULT now(),
  writing_style_notes text
);

ALTER TABLE public.brand_content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on brand_content_library"
  ON public.brand_content_library
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);