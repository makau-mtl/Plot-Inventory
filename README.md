# Plot-Inventory
Land selling business

## Admin setup

1. Apply the migrations in `supabase/migrations` to the Supabase project. The latest migration creates the `plot-images` public-read bucket and its admin-only write policies.
2. Enable email/password sign-in in Supabase Auth and create an admin user.
3. In the Supabase dashboard, set that user's **app metadata** to include `{"role":"admin"}`. Do not use user metadata; it is user-editable and is not accepted by the admin role policies.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the app's `.env` file.

The admin login is at `/#/admin`. Plot images are limited to JPEG, PNG, WebP, and AVIF files up to 10 MB.
