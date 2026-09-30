-- Admin access is granted through Supabase Auth user app_metadata.role = 'admin'.
-- Public clients can still read projects/plots and submit leads, but cannot
-- change inventory or read lead contact details.

-- Keep this migration usable when the optional buyer-fields migration was not
-- applied to an existing project.
ALTER TABLE public.plots ADD COLUMN IF NOT EXISTS buyer_name text;
ALTER TABLE public.plots ADD COLUMN IF NOT EXISTS sold_at timestamptz;
ALTER TABLE public.plots ADD COLUMN IF NOT EXISTS beacon_photo_url text;
ALTER TABLE public.plots ADD COLUMN IF NOT EXISTS proof_image_url text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'NEW'
  CHECK (stage IN ('NEW', 'CONTACTED', 'RESERVED', 'SOLD'));
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS location text;

DROP POLICY IF EXISTS "anon_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "anon_update_projects" ON public.projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON public.projects;
DROP POLICY IF EXISTS "anon_insert_plots" ON public.plots;
DROP POLICY IF EXISTS "anon_update_plots" ON public.plots;
DROP POLICY IF EXISTS "anon_delete_plots" ON public.plots;
DROP POLICY IF EXISTS "anon_select_leads" ON public.leads;
DROP POLICY IF EXISTS "anon_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "anon_update_leads" ON public.leads;
DROP POLICY IF EXISTS "anon_delete_leads" ON public.leads;
DROP POLICY IF EXISTS "admin_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "admin_update_projects" ON public.projects;
DROP POLICY IF EXISTS "admin_delete_projects" ON public.projects;
DROP POLICY IF EXISTS "admin_insert_plots" ON public.plots;
DROP POLICY IF EXISTS "admin_update_plots" ON public.plots;
DROP POLICY IF EXISTS "admin_delete_plots" ON public.plots;
DROP POLICY IF EXISTS "public_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "admin_select_leads" ON public.leads;
DROP POLICY IF EXISTS "admin_update_leads" ON public.leads;
DROP POLICY IF EXISTS "admin_delete_leads" ON public.leads;

CREATE POLICY "admin_insert_projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_update_projects" ON public.projects FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_delete_projects" ON public.projects FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admin_insert_plots" ON public.plots FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_update_plots" ON public.plots FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_delete_plots" ON public.plots FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "public_insert_leads" ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "admin_select_leads" ON public.leads FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_update_leads" ON public.leads FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "admin_delete_leads" ON public.leads FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE OR REPLACE VIEW public.public_lead_social_proof AS
  SELECT project_id, plot_number, name, location, created_at
  FROM public.leads;
REVOKE ALL ON public.public_lead_social_proof FROM PUBLIC;
GRANT SELECT ON public.public_lead_social_proof TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plot-images',
  'plot-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "plot_images_admin_insert" ON storage.objects;
DROP POLICY IF EXISTS "plot_images_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "plot_images_admin_delete" ON storage.objects;
CREATE POLICY "plot_images_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'plot-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
CREATE POLICY "plot_images_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'plot-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'plot-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
CREATE POLICY "plot_images_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'plot-images'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );