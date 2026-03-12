ALTER TABLE public.editorial_items 
  ADD COLUMN IF NOT EXISTS audience_challenge text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS insight_delivered text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS practical_takeaway text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS expected_audience_action text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS outcome_score integer NOT NULL DEFAULT 0;

ALTER TABLE public.content_performance
  ADD COLUMN IF NOT EXISTS profile_visits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follower_growth integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blog_clickthroughs integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS newsletter_signups integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS event_signups integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meaningful_comments integer DEFAULT 0;