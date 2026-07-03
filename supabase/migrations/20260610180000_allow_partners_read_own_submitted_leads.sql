create policy "partner_read_own_submitted"
on public.leads
for select
to authenticated
using (
  submitted_by_partner_id = (
    select profiles.partner_id
    from public.profiles
    where profiles.id = auth.uid()
  )
);
