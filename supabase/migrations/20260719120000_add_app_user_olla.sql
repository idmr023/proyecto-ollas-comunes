-- Vincula cada usuario con la olla común que gestiona.
--
-- Motivo: `app_users` no tenía ninguna referencia a `ollas_comunes`, de modo que
-- el backend resolvía "la olla de la lideresa" como la primera olla activa del
-- tenant por orden alfabético. En organizaciones con más de una olla eso hacía
-- que todas las lideresas compartieran la misma olla arbitraria: veían el padrón
-- ajeno, recibían 403 sobre sus propios beneficiarios, y las entregas y
-- movimientos de inventario se escribían en la olla equivocada.
--
-- La columna es NULA a propósito: los roles administrativos
-- (`admin_municipal`, `supervisor`) operan sobre toda la organización y no
-- tienen una olla propia.

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS olla_id UUID;

-- ON DELETE SET NULL: al dar de baja una olla el usuario debe sobrevivir sin
-- asignación, no desaparecer con ella.
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_olla_id_fkey;

ALTER TABLE app_users
  ADD CONSTRAINT app_users_olla_id_fkey
  FOREIGN KEY (olla_id) REFERENCES ollas_comunes (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_olla_id ON app_users (olla_id);

-- Backfill conservador: solo se asigna automáticamente cuando la organización
-- tiene EXACTAMENTE UNA olla activa. En ese caso no hay ambigüedad y el
-- resultado coincide con el comportamiento anterior.
--
-- Las lideresas de organizaciones con varias ollas se dejan SIN asignar de
-- forma deliberada: adivinar aquí reproduciría el mismo error que se corrige.
-- Deben asignarse a mano; hasta entonces el backend les niega el acceso
-- (fail-closed) en lugar de darles una olla que no les corresponde.
UPDATE app_users u
SET olla_id = o.id
FROM ollas_comunes o
WHERE o.tenant_id = u.tenant_id
  AND o.status = 'active'
  AND u.role = 'lideresa_olla'
  AND u.olla_id IS NULL
  AND (
    SELECT COUNT(*)
    FROM ollas_comunes o2
    WHERE o2.tenant_id = u.tenant_id AND o2.status = 'active'
  ) = 1;

-- Revisión posterior al despliegue: lideresas que quedaron sin olla y necesitan
-- asignación manual.
--
--   SELECT u.id, u.email, u.full_name, t.name AS organizacion
--   FROM app_users u
--   JOIN tenants t ON t.id = u.tenant_id
--   WHERE u.role = 'lideresa_olla' AND u.olla_id IS NULL;
