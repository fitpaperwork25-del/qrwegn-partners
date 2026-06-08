-- Allow promotors to insert leads assigned to themselves.
-- submitted_by_promotor_id must match the promotor_id in their own profile row.

DROP POLICY IF EXISTS "promotors can insert leads" ON public.leads;
CREATE POLICY "promotors can insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by_promotor_id = (
    SELECT promotor_id FROM public.profiles
    WHERE profiles.id   = auth.uid()
      AND profiles.role = 'promotor'
  )
);

-- Allow promotors to read back only their own submitted leads.

DROP POLICY IF EXISTS "promotors can select own leads" ON public.leads;
CREATE POLICY "promotors can select own leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  submitted_by_promotor_id = (
    SELECT promotor_id FROM public.profiles
    WHERE profiles.id   = auth.uid()
      AND profiles.role = 'promotor'
  )
);
