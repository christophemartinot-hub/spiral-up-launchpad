
-- Content Performance tracking
CREATE TABLE IF NOT EXISTS public.content_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  editorial_item_id uuid REFERENCES public.editorial_items(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT '',
  publish_date date,
  content_format text NOT NULL DEFAULT '',
  content_pillar text DEFAULT '',
  topic text DEFAULT '',
  cta text DEFAULT '',
  visual_type text DEFAULT '',
  asset_used text DEFAULT '',
  audience_segment text DEFAULT '',
  impressions integer DEFAULT 0,
  reach integer DEFAULT 0,
  clicks integer DEFAULT 0,
  opens integer DEFAULT 0,
  engagement integer DEFAULT 0,
  saves integer DEFAULT 0,
  shares integer DEFAULT 0,
  comments integer DEFAULT 0,
  conversions integer DEFAULT 0,
  unsubscribe_rate numeric(5,2) DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  click_rate numeric(5,2) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on content_performance" ON public.content_performance FOR ALL TO public USING (true) WITH CHECK (true);

-- Performance learning config
CREATE TABLE IF NOT EXISTS public.performance_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_metrics jsonb NOT NULL DEFAULT '["engagement_rate","clicks","conversions"]'::jsonb,
  engagement_weight numeric(3,2) NOT NULL DEFAULT 0.5,
  conversion_weight numeric(3,2) NOT NULL DEFAULT 0.3,
  strategic_weight numeric(3,2) NOT NULL DEFAULT 0.2,
  favored_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  repetition_limit integer NOT NULL DEFAULT 3,
  deprioritized_types jsonb NOT NULL DEFAULT '[]'::jsonb,
  blog_success_signals jsonb NOT NULL DEFAULT '["time_on_page","shares","comments"]'::jsonb,
  social_success_signals jsonb NOT NULL DEFAULT '["engagement_rate","saves","shares"]'::jsonb,
  email_success_signals jsonb NOT NULL DEFAULT '["open_rate","click_rate","conversions"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on performance_config" ON public.performance_config FOR ALL TO public USING (true) WITH CHECK (true);

INSERT INTO public.performance_config (id) VALUES (gen_random_uuid());

-- Subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text DEFAULT '',
  segment text DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on subscribers" ON public.subscribers FOR ALL TO public USING (true) WITH CHECK (true);

-- Email campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  editorial_item_id uuid REFERENCES public.editorial_items(id) ON DELETE SET NULL,
  subject_line text NOT NULL DEFAULT '',
  preview_text text DEFAULT '',
  intro_text text DEFAULT '',
  blog_summary text DEFAULT '',
  cta_text text DEFAULT 'Read the full article',
  cta_url text DEFAULT '',
  header_image_url text DEFAULT '',
  visual_recommendation text DEFAULT '',
  plain_text_fallback text DEFAULT '',
  recipient_segment text DEFAULT 'all',
  recipient_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  scheduled_send_date timestamptz,
  sent_at timestamptz,
  open_rate numeric(5,2) DEFAULT 0,
  click_rate numeric(5,2) DEFAULT 0,
  unsubscribe_rate numeric(5,2) DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on email_campaigns" ON public.email_campaigns FOR ALL TO public USING (true) WITH CHECK (true);
