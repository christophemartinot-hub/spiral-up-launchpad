
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  brief text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  start_date date,
  end_date date,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_pillars jsonb NOT NULL DEFAULT '[]'::jsonb,
  budget numeric DEFAULT 0,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress integer NOT NULL DEFAULT 0,
  owner_name text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated access on campaigns"
  ON public.campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
