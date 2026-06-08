-- Make log_new_lead_notification run as the function owner (DB superuser)
-- instead of the calling session user. This removes the dependency on
-- per-role notification_logs INSERT policies for trigger-initiated writes.

ALTER FUNCTION public.log_new_lead_notification() SECURITY DEFINER;
ALTER FUNCTION public.log_new_lead_notification() SET search_path = public;
