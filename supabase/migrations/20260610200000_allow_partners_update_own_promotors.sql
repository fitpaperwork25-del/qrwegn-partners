create policy "partner_update_own_promotors"
on public.promotors
for update
to authenticated
using (
  partner_id = (
    select profiles.partner_id
    from public.profiles
    where profiles.id = auth.uid()
  )
)
with check (
  partner_id = (
    select profiles.partner_id
    from public.profiles
    where profiles.id = auth.uid()
  )
);
