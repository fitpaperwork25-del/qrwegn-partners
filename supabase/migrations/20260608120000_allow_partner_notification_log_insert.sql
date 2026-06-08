-- Allow authenticated partners to INSERT notification_logs rows only.
-- Does not grant SELECT, UPDATE, or DELETE, and does not modify any existing
-- admin policy on this table.

create policy "Partners can insert notification_logs rows"
on public.notification_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'partner'
  )
);
