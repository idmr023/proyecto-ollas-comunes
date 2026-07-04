-- ================================================================
-- SIGO-OLLAS — Audit Triggers (4.2/4.4)
-- Triggers de auditoría inmutables con captura de deltas JSONB
-- Ejecutar: npx prisma db execute --file prisma/migrations/audit_triggers/001_audit_triggers.sql
-- ================================================================

-- 1. Extensión pgcrypto para funciones hash
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Función para obtener el usuario actual desde la configuración de sesión
-- La aplicación debe ejecutar: SELECT set_config('app.current_user_id', $1, true)
CREATE OR REPLACE FUNCTION audit.current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 3. Función genérica de trigger de auditoría
CREATE OR REPLACE FUNCTION audit.trigger_audit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := audit.current_user_id();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      table_name, record_id, action_type,
      old_data, new_data, changed_by, changed_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::text,
      'insert',
      NULL,
      to_jsonb(NEW),
      v_user_id,
      now()
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, action_type,
      old_data, new_data, changed_by, changed_at
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::text,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      v_user_id,
      now()
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      table_name, record_id, action_type,
      old_data, new_data, changed_by, changed_at
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id::text,
      'delete',
      to_jsonb(OLD),
      NULL,
      v_user_id,
      now()
    );
    RETURN OLD;
  END IF;
END;
$$;

-- 4. Aplicar triggers a las tablas transaccionales principales
CREATE TRIGGER audit_beneficiaries
  AFTER INSERT OR UPDATE OR DELETE ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

CREATE TRIGGER audit_inventory_movements
  AFTER INSERT OR UPDATE OR DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

CREATE TRIGGER audit_menu_plans
  AFTER INSERT OR UPDATE OR DELETE ON menu_plans
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

CREATE TRIGGER audit_meal_deliveries
  AFTER INSERT OR UPDATE OR DELETE ON meal_deliveries
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

CREATE TRIGGER audit_app_users
  AFTER INSERT OR UPDATE OR DELETE ON app_users
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

CREATE TRIGGER audit_ollas_comunes
  AFTER INSERT OR UPDATE OR DELETE ON ollas_comunes
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

CREATE TRIGGER audit_supply_sources
  AFTER INSERT OR UPDATE OR DELETE ON supply_sources
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

CREATE TRIGGER audit_recommendations
  AFTER INSERT OR UPDATE OR DELETE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION audit.trigger_audit();

-- 5. Revocar privilegios de modificación en audit_logs (WORM)
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM anon, authenticated, service_role;
