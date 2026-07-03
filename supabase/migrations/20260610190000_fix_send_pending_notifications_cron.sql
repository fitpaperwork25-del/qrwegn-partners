-- Remove existing broken job if present (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-pending-notifications') THEN
    PERFORM cron.unschedule('send-pending-notifications');
  END IF;
END $$;

-- Prerequisite (run manually, NOT committed to git):
--   select vault.create_secret('<service-role-jwt>', 'service_role_jwt');

-- Invoke send-pending-notifications edge function every 10 minutes
SELECT cron.schedule(
  'send-pending-notifications',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ijlgbljeuhlrehutyifn.supabase.co/functions/v1/send-pending-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'service_role_jwt'
      ),
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
