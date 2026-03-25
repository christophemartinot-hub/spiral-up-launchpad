
CREATE OR REPLACE FUNCTION public.trigger_publish_linkedin_on_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  recent_exists boolean;
BEGIN
  IF NEW.status = 'scheduled' AND NEW.channel = 'linkedin' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
    -- Check for duplicate dispatch in the last 60 seconds
    SELECT EXISTS (
      SELECT 1 FROM public.audit_log
      WHERE entity_id = NEW.id::text
        AND action = 'publish_social'
        AND created_at > (now() - interval '60 seconds')
    ) INTO recent_exists;

    IF NOT recent_exists THEN
      PERFORM
        net.http_post(
          url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/publish-to-linkedin',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
          )::jsonb,
          body := jsonb_build_object('item_id', NEW.id)::jsonb
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
