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
--
-- NOTE: this migration is historical/superseded — the hardcoded bearer
-- token below is a legacy service_role JWT that has since been disabled
-- in Supabase, and the live cron job now authenticates via a vault
-- secret instead (see 20260610190000_fix_send_pending_notifications_cron.sql).
-- The placeholder here replaces the original plaintext token, which is
-- no longer valid.
SELECT cron.schedule(
  'send-pending-notifications',
  '*/10 * * * *',
  $$
  SELECT extensions.net.http_post(
    url     := 'https://ijlgbljeuhlrehutyifn.supabase.co/functions/v1/send-pending-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <redacted-disabled-legacy-jwt>',
      'Content-Type', 'application/json'
    ),
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
