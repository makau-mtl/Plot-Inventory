/*
# Miribo — add buyer fields, proof fields, lead stage

1. Modified Tables
- `plots`: add `buyer_name` (text, nullable), `sold_at` (timestamptz, nullable),
  `beacon_photo_url` (text, nullable), `proof_image_url` (text, nullable).
- `leads`: add `stage` (text, default 'NEW', CHECK in NEW/CONTACTED/RESERVED/SOLD),
  `location` (text, nullable — buyer's area e.g. "Kasarani").

2. Security
- No new tables. Existing anon+authenticated CRUD policies still apply to the new columns.

3. Notes
- Uses `DO $$ ... END $$` to add columns idempotently (skips if already present).
- `sold_at` is set by the admin when a plot is marked SOLD (application logic).
- `beacon_photo_url` stores a URL to a beacon photo for the plot.
*/

DO $$ BEGIN
  ALTER TABLE plots ADD COLUMN IF NOT EXISTS buyer_name text;
  ALTER TABLE plots ADD COLUMN IF NOT EXISTS sold_at timestamptz;
  ALTER TABLE plots ADD COLUMN IF NOT EXISTS beacon_photo_url text;
  ALTER TABLE plots ADD COLUMN IF NOT EXISTS proof_image_url text;
END $$;

DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'NEW'
    CHECK (stage IN ('NEW','CONTACTED','RESERVED','SOLD'));
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS location text;
END $$;

-- Populate buyer_name + sold_at for already-SOLD plots
UPDATE plots
  SET buyer_name = CASE plot_number
    WHEN 1 THEN 'James M.'
    WHEN 2 THEN 'Wanjiku K.'
    WHEN 5 THEN 'Otieno P.'
    WHEN 6 THEN 'Achieng R.'
    WHEN 7 THEN 'Kipngeno T.'
  END,
  sold_at = CASE plot_number
    WHEN 1 THEN now() - interval '2 days'
    WHEN 2 THEN now() - interval '5 days'
    WHEN 5 THEN now() - interval '8 days'
    WHEN 6 THEN now() - interval '12 days'
    WHEN 7 THEN now() - interval '15 days'
  END
WHERE project_id = 'donyo-sabuk-122564' AND status = 'SOLD';

-- Insert 5 mock leads for social proof
INSERT INTO leads (project_id, plot_number, name, phone, location, stage) VALUES
  ('donyo-sabuk-122564', 5, 'Peter K.', '254712345678', 'Kasarani', 'RESERVED'),
  ('donyo-sabuk-122564', 3, 'Mary W.', '254723456789', 'Ruaka', 'CONTACTED'),
  ('donyo-sabuk-122564', 9, 'John M.', '254734567890', 'Thika Road', 'NEW'),
  ('donyo-sabuk-122564', 4, 'Fatuma A.', '254745678901', 'Kahawa West', 'NEW'),
  ('donyo-sabuk-122564', 10, 'Brian O.', '254756789012', 'Ruiru', 'CONTACTED')
ON CONFLICT DO NOTHING;

SELECT count(*) AS lead_count FROM leads WHERE project_id = 'donyo-sabuk-122564';