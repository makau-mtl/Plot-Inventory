/*
# Miribo Plot Manager — schema

1. New Tables
- `projects`: id (text PK), name (text), location (text), created_at
- `plots`: id (uuid PK), project_id (text FK -> projects), plot_number (int),
  status (enum AVAILABLE/RESERVED/SOLD, default AVAILABLE), price (numeric),
  ha_label (text), size_label (text), is_corner (bool), created_at
- `leads`: id (uuid PK), project_id (text FK -> projects), plot_number (int),
  name (text), phone (text), created_at

2. Security
- RLS enabled on all three tables.
- This is a no-auth app (admin uses a hardcoded password, no Supabase auth),
  so policies allow anon + authenticated full CRUD — the data is intentionally
  public/shared (plot availability is shown to the public, leads are submitted
  by the public).

3. Notes
- `plots.project_id` is a text FK referencing `projects.id`.
- `leads.project_id` is a text FK referencing `projects.id`.
- Unique constraint on (project_id, plot_number) to prevent duplicate plots.
*/

CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plot_number int NOT NULL,
  status text NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE','RESERVED','SOLD')),
  price numeric(12,2) NOT NULL DEFAULT 0,
  ha_label text NOT NULL DEFAULT '',
  size_label text NOT NULL DEFAULT '',
  is_corner boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (project_id, plot_number)
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plot_number int NOT NULL,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- projects policies (anon + authenticated, public data)
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

-- plots policies
DROP POLICY IF EXISTS "anon_select_plots" ON plots;
CREATE POLICY "anon_select_plots" ON plots FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_plots" ON plots;
CREATE POLICY "anon_insert_plots" ON plots FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_plots" ON plots;
CREATE POLICY "anon_update_plots" ON plots FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_plots" ON plots;
CREATE POLICY "anon_delete_plots" ON plots FOR DELETE
  TO anon, authenticated USING (true);

-- leads policies
DROP POLICY IF EXISTS "anon_select_leads" ON leads;
CREATE POLICY "anon_select_leads" ON leads FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leads" ON leads;
CREATE POLICY "anon_update_leads" ON leads FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leads" ON leads;
CREATE POLICY "anon_delete_leads" ON leads FOR DELETE
  TO anon, authenticated USING (true);