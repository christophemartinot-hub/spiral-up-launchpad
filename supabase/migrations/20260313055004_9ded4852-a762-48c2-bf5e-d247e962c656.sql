
-- Comment inbox table
CREATE TABLE public.comment_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL DEFAULT '',
  post_reference text DEFAULT '',
  post_title text DEFAULT '',
  editorial_item_id uuid REFERENCES public.editorial_items(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT '',
  author_handle text DEFAULT '',
  author_avatar_url text DEFAULT '',
  comment_text text NOT NULL DEFAULT '',
  comment_date timestamptz NOT NULL DEFAULT now(),
  external_comment_id text DEFAULT '',
  parent_comment_id uuid REFERENCES public.comment_inbox(id) ON DELETE SET NULL,
  comment_type text NOT NULL DEFAULT 'unknown',
  sentiment text NOT NULL DEFAULT 'neutral',
  urgency text NOT NULL DEFAULT 'normal',
  requires_reply boolean NOT NULL DEFAULT true,
  requires_human_review boolean NOT NULL DEFAULT false,
  is_sensitive boolean NOT NULL DEFAULT false,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'new',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on comment_inbox" ON public.comment_inbox FOR ALL TO public USING (true) WITH CHECK (true);

-- Reply suggestions table
CREATE TABLE public.comment_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comment_inbox(id) ON DELETE CASCADE,
  reply_type text NOT NULL DEFAULT 'thoughtful',
  reply_text text NOT NULL DEFAULT '',
  tone text DEFAULT 'warm',
  status text NOT NULL DEFAULT 'suggested',
  approved_text text DEFAULT '',
  sent_at timestamptz,
  external_reply_id text DEFAULT '',
  engagement_result jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on comment_replies" ON public.comment_replies FOR ALL TO public USING (true) WITH CHECK (true);

-- Reply feedback / learning table
CREATE TABLE public.comment_reply_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comment_inbox(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.comment_replies(id) ON DELETE SET NULL,
  action_type text NOT NULL DEFAULT '',
  original_text text DEFAULT '',
  final_text text DEFAULT '',
  text_was_edited boolean DEFAULT false,
  tone_preference text DEFAULT '',
  length_preference text DEFAULT '',
  reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_reply_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on comment_reply_feedback" ON public.comment_reply_feedback FOR ALL TO public USING (true) WITH CHECK (true);
