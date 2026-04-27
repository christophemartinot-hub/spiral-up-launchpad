UPDATE public.linkedin_posts
SET external_post_id = 'urn:li:share:7448408677264556033',
    updated_at = now()
WHERE id = 'cf7c52e9-763b-4e2f-b65e-241aa92ae7ec'
  AND (external_post_id IS NULL OR external_post_id = '');