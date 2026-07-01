CREATE OR REPLACE FUNCTION my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
ALTER FUNCTION my_role() OWNER TO postgres;

CREATE OR REPLACE FUNCTION my_promotor_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT promotor_id FROM profiles WHERE id = auth.uid();
$$;
ALTER FUNCTION my_promotor_id() OWNER TO postgres;

DROP POLICY IF EXISTS partner_update_own_promotors ON promotors;
CREATE POLICY partner_update_own_promotors ON promotors
FOR UPDATE TO authenticated
USING (partner_id = my_partner_id())
WITH CHECK (partner_id = my_partner_id());

DROP POLICY IF EXISTS promotors_admin_all ON promotors;
CREATE POLICY promotors_admin_all ON promotors
FOR ALL TO authenticated
USING (my_role() = 'admin')
WITH CHECK (my_role() = 'admin');

DROP POLICY IF EXISTS promotors_partner_read ON promotors;
CREATE POLICY promotors_partner_read ON promotors
FOR SELECT TO authenticated
USING (partner_id = my_partner_id());

DROP POLICY IF EXISTS promotors_partner_recruit ON promotors;
CREATE POLICY promotors_partner_recruit ON promotors
FOR INSERT TO authenticated
WITH CHECK (partner_id = my_partner_id());

DROP POLICY IF EXISTS promotors_self_read ON promotors;
CREATE POLICY promotors_self_read ON promotors
FOR SELECT TO authenticated
USING (id = my_promotor_id());
