-- Movimiento de geolocalizacion de tenants a ollas_comunes
-- Ejecutar en orden:

ALTER TABLE ollas_comunes
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision;

ALTER TABLE tenants
  DROP COLUMN latitude,
  DROP COLUMN longitude;
