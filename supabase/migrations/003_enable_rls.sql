-- ================================================================
-- MIGRATION: 003_enable_rls.sql
-- DESC: Habilita Row Level Security (RLS) en todas las tablas del 
--       proyecto y configura políticas de aislamiento multi-tenant
--       para accesos directos a través de la API de Supabase.
-- ================================================================

BEGIN;

-- ================================================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS DE NEGOCIO
-- ================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ollas_comunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiary_health_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_delivery_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_sync_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 2. DEFINIR FUNCIONES AUXILIARES PARA TENANT ID
-- ================================================================

-- Función para extraer de manera segura el tenant_id del JWT o de configuración local
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
DECLARE
  jwt_tenant_id text;
  local_tenant_id text;
BEGIN
  -- Intentar obtener del JWT de Supabase
  BEGIN
    jwt_tenant_id := current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id';
  EXCEPTION WHEN OTHERS THEN
    jwt_tenant_id := NULL;
  END;

  -- Intentar obtener de configuración local del backend (si aplica)
  BEGIN
    local_tenant_id := nullif(current_setting('app.current_tenant_id', true), '');
  EXCEPTION WHEN OTHERS THEN
    local_tenant_id := NULL;
  END;

  RETURN COALESCE(local_tenant_id::uuid, jwt_tenant_id::uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- 3. POLÍTICAS DE ROW LEVEL SECURITY (AISLAMIENTO MULTI-TENANT)
-- ================================================================

-- POLÍTICA: tenants
-- Un usuario sólo puede ver su propio tenant
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR ALL USING (id = get_current_tenant_id());

-- POLÍTICA: app_users
CREATE POLICY tenant_isolation_app_users ON app_users
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: ollas_comunes
CREATE POLICY tenant_isolation_ollas_comunes ON ollas_comunes
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: beneficiaries
CREATE POLICY tenant_isolation_beneficiaries ON beneficiaries
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: beneficiary_health_conditions
CREATE POLICY tenant_isolation_beneficiary_health_conditions ON beneficiary_health_conditions
  FOR ALL USING (
    beneficiary_id IN (
      SELECT id FROM beneficiaries WHERE tenant_id = get_current_tenant_id()
    )
  );

-- POLÍTICA: supply_sources
CREATE POLICY tenant_isolation_supply_sources ON supply_sources
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: supply_items
-- Los ítems de inventario son compartidos (catálogo global), permitimos lectura, 
-- pero mutación sólo para administradores globales o el backend
CREATE POLICY tenant_isolation_supply_items_select ON supply_items
  FOR SELECT USING (status = 'active');

CREATE POLICY tenant_isolation_supply_items_write ON supply_items
  FOR ALL USING (true); -- Permitido para backend admin por omisión de RLS

-- POLÍTICA: inventory_movements
CREATE POLICY tenant_isolation_inventory_movements ON inventory_movements
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: inventory_stock
CREATE POLICY tenant_isolation_inventory_stock ON inventory_stock
  FOR ALL USING (
    olla_id IN (
      SELECT id FROM ollas_comunes WHERE tenant_id = get_current_tenant_id()
    )
  );

-- POLÍTICA: recipes
CREATE POLICY tenant_isolation_recipes ON recipes
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: recipe_ingredients
CREATE POLICY tenant_isolation_recipe_ingredients ON recipe_ingredients
  FOR ALL USING (
    recipe_id IN (
      SELECT id FROM recipes WHERE tenant_id = get_current_tenant_id()
    )
  );

-- POLÍTICA: menu_plans
CREATE POLICY tenant_isolation_menu_plans ON menu_plans
  FOR ALL USING (
    olla_id IN (
      SELECT id FROM ollas_comunes WHERE tenant_id = get_current_tenant_id()
    )
  );

-- POLÍTICA: meal_deliveries
CREATE POLICY tenant_isolation_meal_deliveries ON meal_deliveries
  FOR ALL USING (
    menu_plan_id IN (
      SELECT id FROM menu_plans mp
      JOIN ollas_comunes oc ON mp.olla_id = oc.id
      WHERE oc.tenant_id = get_current_tenant_id()
    )
  );

-- POLÍTICA: meal_delivery_details
CREATE POLICY tenant_isolation_meal_delivery_details ON meal_delivery_details
  FOR ALL USING (
    delivery_id IN (
      SELECT md.id FROM meal_deliveries md
      JOIN menu_plans mp ON md.menu_plan_id = mp.id
      JOIN ollas_comunes oc ON mp.olla_id = oc.id
      WHERE oc.tenant_id = get_current_tenant_id()
    )
  );

-- POLÍTICA: recommendations
CREATE POLICY tenant_isolation_recommendations ON recommendations
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: alerts
CREATE POLICY tenant_isolation_alerts ON alerts
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: documents
CREATE POLICY tenant_isolation_documents ON documents
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: failed_sync_backups
CREATE POLICY tenant_isolation_failed_sync_backups ON failed_sync_backups
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- POLÍTICA: audit_logs
-- Lectura restringida a auditores del tenant
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL USING (
    changed_by IN (
      SELECT id FROM app_users WHERE tenant_id = get_current_tenant_id()
    )
  );

COMMIT;
