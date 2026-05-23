-- EJECUTAR EN EL SQL EDITOR DE SUPABASE (no via pooler)
-- Agrega roles operador_olla y coordinador al constraint de app_users

ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('admin_municipal', 'lideresa_olla', 'supervisor', 'operador_olla', 'coordinador'));
