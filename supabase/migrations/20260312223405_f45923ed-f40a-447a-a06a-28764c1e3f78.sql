
CREATE TABLE public.social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  account_name text NOT NULL DEFAULT '',
  connected boolean NOT NULL DEFAULT false,
  last_sync timestamptz,
  followers int,
  access_token text DEFAULT '',
  profile_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on social_connections" ON public.social_connections FOR ALL USING (true) WITH CHECK (true);

-- Seed with Spiral Up accounts
INSERT INTO public.social_connections (channel, account_name, connected) VALUES
  ('linkedin', 'Christophe Martinot', false),
  ('twitter', '@spiralup_', false),
  ('instagram', '@spiralingup', false),
  ('youtube', 'Spiral Up', false),
  ('facebook', 'SeedingEnergy', false),
  ('email', 'Newsletter', false);
