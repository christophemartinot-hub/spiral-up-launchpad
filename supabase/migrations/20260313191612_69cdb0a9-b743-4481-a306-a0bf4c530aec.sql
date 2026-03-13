
-- Strategic cycles group ideas per editorial cycle
CREATE TABLE public.strategic_cycles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_start date NOT NULL,
  cycle_end date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  recommended_focus text DEFAULT '',
  generated_at timestamp with time zone,
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access on strategic_cycles"
  ON public.strategic_cycles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Strategic ideas: individual tensions, opportunities, myths, lessons, conversions
CREATE TABLE public.strategic_ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id uuid REFERENCES public.strategic_cycles(id) ON DELETE CASCADE NOT NULL,
  idea_type text NOT NULL DEFAULT 'opportunity',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  
  -- Tension-specific fields
  tension_statement text DEFAULT '',
  who_affected text DEFAULT '',
  why_now text DEFAULT '',
  
  -- Common enrichment
  related_pillar text DEFAULT '',
  related_offer text DEFAULT '',
  content_potential text DEFAULT '',
  follower_growth_potential text DEFAULT '',
  business_relevance text DEFAULT '',
  
  -- Explanation layer
  why_matters_now text DEFAULT '',
  why_relevant_to_audience text DEFAULT '',
  why_fits_spiral_up text DEFAULT '',
  why_supports_growth text DEFAULT '',
  intended_outcome text DEFAULT '',
  
  -- Ranking
  audience_value_score integer NOT NULL DEFAULT 0,
  outcome_potential_score integer NOT NULL DEFAULT 0,
  growth_potential_score integer NOT NULL DEFAULT 0,
  brand_relevance_score integer NOT NULL DEFAULT 0,
  offer_relevance_score integer NOT NULL DEFAULT 0,
  diversity_score integer NOT NULL DEFAULT 0,
  performance_learning_score integer NOT NULL DEFAULT 0,
  overall_rank integer NOT NULL DEFAULT 0,
  
  -- Human control
  status text NOT NULL DEFAULT 'suggested',
  pinned boolean NOT NULL DEFAULT false,
  rejection_reason text DEFAULT '',
  
  -- Conversion
  converted_to text DEFAULT '',
  converted_item_id uuid DEFAULT NULL,
  
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated access on strategic_ideas"
  ON public.strategic_ideas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
