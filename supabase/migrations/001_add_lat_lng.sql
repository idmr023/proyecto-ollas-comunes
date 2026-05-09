-- Migration: 001_add_lat_lng.sql
-- Adds latitude and longitude columns to the tenants table

BEGIN;

-- Add nullable latitude/longitude columns
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Optional index to speed up simple range/point queries
CREATE INDEX IF NOT EXISTS idx_tenants_lat_lng ON public.tenants (latitude, longitude);

COMMIT;

-- To apply this migration:
-- 1) In Supabase SQL editor: paste the contents and run.
-- 2) Or via psql (if you have a DATABASE_URL):
--    psql "$DATABASE_URL" -f backend/migrations/001_add_lat_lng.sql
