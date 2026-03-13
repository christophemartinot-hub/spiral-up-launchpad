
-- 1. User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Audit log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT '',
  entity_id TEXT DEFAULT '',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- 7. RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. RLS policies for audit_log
CREATE POLICY "Admins and editors can view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "Authenticated users can insert audit log"
  ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- 9. Update ALL existing tables to require authentication
-- Drop the old "allow all" policies and add auth-required ones

-- book_info
DROP POLICY IF EXISTS "Allow all on book_info" ON public.book_info;
CREATE POLICY "Authenticated access on book_info" ON public.book_info FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- brand_assets
DROP POLICY IF EXISTS "Allow all on brand_assets" ON public.brand_assets;
CREATE POLICY "Authenticated access on brand_assets" ON public.brand_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- brand_content_pillars
DROP POLICY IF EXISTS "Allow all on brand_content_pillars" ON public.brand_content_pillars;
CREATE POLICY "Authenticated access on brand_content_pillars" ON public.brand_content_pillars FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- brand_core
DROP POLICY IF EXISTS "Allow all on brand_core" ON public.brand_core;
CREATE POLICY "Authenticated access on brand_core" ON public.brand_core FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- comment_inbox
DROP POLICY IF EXISTS "Allow all on comment_inbox" ON public.comment_inbox;
CREATE POLICY "Authenticated access on comment_inbox" ON public.comment_inbox FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- comment_replies
DROP POLICY IF EXISTS "Allow all on comment_replies" ON public.comment_replies;
CREATE POLICY "Authenticated access on comment_replies" ON public.comment_replies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- comment_reply_feedback
DROP POLICY IF EXISTS "Allow all on comment_reply_feedback" ON public.comment_reply_feedback;
CREATE POLICY "Authenticated access on comment_reply_feedback" ON public.comment_reply_feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- content_performance
DROP POLICY IF EXISTS "Allow all on content_performance" ON public.content_performance;
CREATE POLICY "Authenticated access on content_performance" ON public.content_performance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- editorial_feedback
DROP POLICY IF EXISTS "Allow all on editorial_feedback" ON public.editorial_feedback;
CREATE POLICY "Authenticated access on editorial_feedback" ON public.editorial_feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- editorial_items
DROP POLICY IF EXISTS "Allow all on editorial_items" ON public.editorial_items;
CREATE POLICY "Authenticated access on editorial_items" ON public.editorial_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- editorial_plans
DROP POLICY IF EXISTS "Allow all on editorial_plans" ON public.editorial_plans;
CREATE POLICY "Authenticated access on editorial_plans" ON public.editorial_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- email_campaigns
DROP POLICY IF EXISTS "Allow all on email_campaigns" ON public.email_campaigns;
CREATE POLICY "Authenticated access on email_campaigns" ON public.email_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- events_workshops
DROP POLICY IF EXISTS "Allow all on events_workshops" ON public.events_workshops;
CREATE POLICY "Authenticated access on events_workshops" ON public.events_workshops FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- example_content
DROP POLICY IF EXISTS "Allow all on example_content" ON public.example_content;
CREATE POLICY "Authenticated access on example_content" ON public.example_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- founder_profile
DROP POLICY IF EXISTS "Allow all on founder_profile" ON public.founder_profile;
CREATE POLICY "Authenticated access on founder_profile" ON public.founder_profile FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- learning_memory
DROP POLICY IF EXISTS "Allow all on learning_memory" ON public.learning_memory;
CREATE POLICY "Authenticated access on learning_memory" ON public.learning_memory FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- offers
DROP POLICY IF EXISTS "Allow all on offers" ON public.offers;
CREATE POLICY "Authenticated access on offers" ON public.offers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- performance_config
DROP POLICY IF EXISTS "Allow all on performance_config" ON public.performance_config;
CREATE POLICY "Authenticated access on performance_config" ON public.performance_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- planning_config
DROP POLICY IF EXISTS "Allow all on planning_config" ON public.planning_config;
CREATE POLICY "Authenticated access on planning_config" ON public.planning_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- social_connections
DROP POLICY IF EXISTS "Allow all on social_connections" ON public.social_connections;
CREATE POLICY "Authenticated access on social_connections" ON public.social_connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- spiral_principles
DROP POLICY IF EXISTS "Allow all on spiral_principles" ON public.spiral_principles;
CREATE POLICY "Authenticated access on spiral_principles" ON public.spiral_principles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- subscribers
DROP POLICY IF EXISTS "Allow all on subscribers" ON public.subscribers;
CREATE POLICY "Authenticated access on subscribers" ON public.subscribers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- visual_config
DROP POLICY IF EXISTS "Allow all on visual_config" ON public.visual_config;
CREATE POLICY "Authenticated access on visual_config" ON public.visual_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- voice_rules
DROP POLICY IF EXISTS "Allow all on voice_rules" ON public.voice_rules;
CREATE POLICY "Authenticated access on voice_rules" ON public.voice_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- website_pages
DROP POLICY IF EXISTS "Allow all on website_pages" ON public.website_pages;
CREATE POLICY "Authenticated access on website_pages" ON public.website_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);
