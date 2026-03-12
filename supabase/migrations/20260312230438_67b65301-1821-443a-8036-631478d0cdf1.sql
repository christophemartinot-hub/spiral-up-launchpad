
-- Book info table (single row, like brand_core)
CREATE TABLE public.book_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'SPIRAL UP',
  subtitle text DEFAULT '',
  author text DEFAULT 'Christophe Martinot',
  description text DEFAULT '',
  key_discoveries jsonb DEFAULT '[]'::jsonb,
  expert_contributors jsonb DEFAULT '[]'::jsonb,
  endorsements jsonb DEFAULT '[]'::jsonb,
  press_mentions jsonb DEFAULT '[]'::jsonb,
  seen_with_book jsonb DEFAULT '[]'::jsonb,
  purchase_links jsonb DEFAULT '[]'::jsonb,
  cover_image_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.book_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on book_info" ON public.book_info
  FOR ALL TO public
  USING (true) WITH CHECK (true);

-- Events & workshops table (multiple rows)
CREATE TABLE public.events_workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL DEFAULT '',
  event_type text NOT NULL DEFAULT 'workshop',
  description text DEFAULT '',
  date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL,
  location text DEFAULT '',
  url text DEFAULT '',
  image_url text DEFAULT '',
  status text NOT NULL DEFAULT 'upcoming',
  key_outcomes jsonb DEFAULT '[]'::jsonb,
  target_audience text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events_workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on events_workshops" ON public.events_workshops
  FOR ALL TO public
  USING (true) WITH CHECK (true);
