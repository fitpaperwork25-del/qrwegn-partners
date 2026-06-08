-- Enable pg_net so pg_cron can make HTTP calls to edge functions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove existing job if present (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-pending-notifications') THEN
    PERFORM cron.unschedule('send-pending-notifications');
  END IF;
END $$;

-- Invoke send-pending-notifications edge function every 10 minutes
SELECT cron.schedule(
  'send-pending-notifications',
  '*/10 * * * *',
  $$
  SELECT extensions.net.http_post(
    url     := 'https://ijlgbljeuhlrehutyifn.supabase.co/functions/v1/send-pending-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbGdibGpldWhscmVodXR5aWZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0NTg3NSwiZXhwIjoyMDk1MDIxODc1fQ.jfGVaD-kqf4saSooArp3aH4d3arZnthQWuF60fjj1Hc',
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
