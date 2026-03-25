
CREATE OR REPLACE FUNCTION public.trigger_publish_linkedin_on_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND NEW.channel = 'linkedin' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_item_scheduled_linkedin ON editorial_items;
CREATE TRIGGER on_item_scheduled_linkedin
  AFTER UPDATE ON editorial_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_publish_linkedin_on_schedule();
