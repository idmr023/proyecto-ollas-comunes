-- EJECUTAR EN EL SQL EDITOR DE SUPABASE (no via pooler)
-- Mueve lat/lng de tenants a ollas_comunes

ALTER TABLE ollas_comunes
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Opcional: eliminar de tenants si ya migraste los datos
-- ALTER TABLE tenants DROP COLUMN IF EXISTS latitude, DROP COLUMN IF EXISTS longitude;
