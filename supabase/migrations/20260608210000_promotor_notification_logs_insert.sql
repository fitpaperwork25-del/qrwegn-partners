-- Allow authenticated promotors to INSERT notification_logs rows.
-- Required because a SECURITY INVOKER trigger on public.leads fires on INSERT
-- and writes to notification_logs in the calling session's context.
-- Mirrors the existing "Partners can insert notification_logs rows" policy.

DROP POLICY IF EXISTS "promotors can insert notification_logs rows" ON public.notification_logs;
CREATE POLICY "promotors can insert notification_logs rows"
ON public.notification_logs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id   = auth.uid()
      AND profiles.role = 'promotor'
  )
);
