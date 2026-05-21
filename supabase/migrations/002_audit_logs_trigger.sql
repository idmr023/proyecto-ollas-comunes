-- ================================================================
-- MIGRATION: 002_audit_logs_trigger.sql
-- DESC: Implementa el sistema de auditoria forense (ledger) con
--       triggers post-operacionales para inventario y padron.
--       Garantiza el principio de no repudio mediante captura
--       automatica de old_data / new_data en formato JSONB.
-- ================================================================

BEGIN;

-- ================================================================
-- 1. MODIFICAR TABLA audit_logs
-- ================================================================

-- Cambiar record_id a text para soportar IDs de distintos tipos (uuid, serial, compuestos)
ALTER TABLE audit_logs ALTER COLUMN record_id TYPE text;
ALTER TABLE audit_logs ALTER COLUMN record_id DROP NOT NULL;

-- Agregar columnas JSONB para estado previo y nuevo
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS old_data jsonb,
  ADD COLUMN IF NOT EXISTS new_data jsonb;

-- ================================================================
-- 2. FUNCION GENERICA DE AUDITORIA
-- ================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id text;
  record_id_val text;
BEGIN
  -- Obtener el usuario desde configuracion de sesion (seteado por la app)
  BEGIN
    current_user_id := current_setting('app.current_user_id', true);
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- Determinar el ID del registro (maneja PKs compuestas)
  IF TG_OP = 'DELETE' THEN
    BEGIN
      record_id_val := OLD.id::text;
    EXCEPTION WHEN OTHERS THEN
      -- Tabla con PK compuesta: serializar las PKs como JSON
      record_id_val := NULL;
    END;
  ELSE
    BEGIN
      record_id_val := NEW.id::text;
    EXCEPTION WHEN OTHERS THEN
      record_id_val := NULL;
    END;
  END IF;

  INSERT INTO audit_logs (
    table_name,
    record_id,
    action_type,
    old_data,
    new_data,
    changed_by,
    changed_at
  ) VALUES (
    TG_TABLE_NAME,
    record_id_val,
    lower(TG_OP),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN current_user_id IS NOT NULL THEN current_user_id::uuid ELSE NULL END,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 3. TRIGGERS SOBRE TABLAS DE INVENTARIO
-- ================================================================

CREATE TRIGGER trg_audit_inventory_movements
  AFTER INSERT OR UPDATE OR DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_inventory_stock
  AFTER INSERT OR UPDATE OR DELETE ON inventory_stock
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_supply_items
  AFTER INSERT OR UPDATE OR DELETE ON supply_items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_supply_sources
  AFTER INSERT OR UPDATE OR DELETE ON supply_sources
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ================================================================
-- 4. TRIGGERS SOBRE TABLAS DEL PADRON
-- ================================================================

CREATE TRIGGER trg_audit_beneficiaries
  AFTER INSERT OR UPDATE OR DELETE ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_beneficiary_health_conditions
  AFTER INSERT OR UPDATE OR DELETE ON beneficiary_health_conditions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_ollas_comunes
  AFTER INSERT OR UPDATE OR DELETE ON ollas_comunes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ================================================================
-- 5. TRIGGERS SOBRE TABLAS OPERATIVAS (menus, entregas, recetas)
-- ================================================================

CREATE TRIGGER trg_audit_recipes
  AFTER INSERT OR UPDATE OR DELETE ON recipes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_recipe_ingredients
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_menu_plans
  AFTER INSERT OR UPDATE OR DELETE ON menu_plans
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_meal_deliveries
  AFTER INSERT OR UPDATE OR DELETE ON meal_deliveries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER trg_audit_meal_delivery_details
  AFTER INSERT OR UPDATE OR DELETE ON meal_delivery_details
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ================================================================
-- 6. INDICES PARA CONSULTAS DE AUDITORIA
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

COMMIT;
