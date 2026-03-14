CREATE TABLE public.book_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_number integer NOT NULL DEFAULT 0,
  chapter_title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  key_concepts jsonb DEFAULT '[]'::jsonb,
  quotes jsonb DEFAULT '[]'::jsonb,
  related_principles jsonb DEFAULT '[]'::jsonb,
  word_count integer DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on book_chapters"
ON public.book_chapters
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);