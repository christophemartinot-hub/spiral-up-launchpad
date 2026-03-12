
ALTER TABLE public.editorial_items
  ADD COLUMN IF NOT EXISTS backup_visual_concept text DEFAULT '',
  ADD COLUMN IF NOT EXISTS backup_visual_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS visual_rationale text DEFAULT '';
