-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call the edge function when status becomes 'scheduled'
CREATE OR REPLACE FUNCTION public.notify_make_on_schedule()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND (OLD.status IS NULL OR OLD.status != 'scheduled') THEN
    PERFORM
      net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/publish-to-make',
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

-- Attach the trigger to editorial_items
DROP TRIGGER IF EXISTS on_editorial_item_scheduled ON public.editorial_items;
CREATE TRIGGER on_editorial_item_scheduled
  AFTER UPDATE ON public.editorial_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_make_on_schedule();