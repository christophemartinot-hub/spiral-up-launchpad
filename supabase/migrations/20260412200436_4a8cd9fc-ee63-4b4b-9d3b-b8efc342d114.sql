CREATE TABLE IF NOT EXISTS content_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_url TEXT,
  article_summary TEXT,
  spiral_principle TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'generated', 'discarded')),
  generated_idea_id UUID REFERENCES strategic_ideas(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_content_signals_status 
  ON content_signals(status);

CREATE INDEX idx_content_signals_scraped_at 
  ON content_signals(scraped_at DESC);

ALTER TABLE content_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage content_signals"
  ON content_signals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);