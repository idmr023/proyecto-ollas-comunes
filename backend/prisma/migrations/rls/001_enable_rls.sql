-- ================================================================
-- SIGO-OLLAS — Row Level Security (2.1)
-- RLS policies para aislamiento multi-tenant a nivel de BD
-- Requiere haber creado el schema audit y funciones primero
-- Ejecutar: npx prisma db execute --file prisma/migrations/rls/001_enable_rls.sql
-- ================================================================

-- 1. Habilitar RLS en tablas transaccionales
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ollas_comunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_delivery_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_sources ENABLE ROW LEVEL SECURITY;

-- 2. Función para obtener tenant_id del JWT
-- La app debe ejecutar: SELECT set_config('app.current_tenant_id', $1, true)
CREATE OR REPLACE FUNCTION audit.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 3. Política genérica: el usuario solo ve datos de su tenant
-- tenants
CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  USING (id = audit.current_tenant_id());

-- app_users
CREATE POLICY tenant_isolation ON app_users
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());

-- ollas_comunes
CREATE POLICY tenant_isolation ON ollas_comunes
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());

-- beneficiaries
CREATE POLICY tenant_isolation ON beneficiaries
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());

-- inventory_movements
CREATE POLICY tenant_isolation ON inventory_movements
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());

-- inventory_stock
CREATE POLICY tenant_isolation ON inventory_stock
  FOR ALL
  USING (olla_id IN (SELECT id FROM ollas_comunes WHERE tenant_id = audit.current_tenant_id()));

-- menu_plans
CREATE POLICY tenant_isolation ON menu_plans
  FOR ALL
  USING (olla_id IN (SELECT id FROM ollas_comunes WHERE tenant_id = audit.current_tenant_id()));

-- meal_deliveries
CREATE POLICY tenant_isolation ON meal_deliveries
  FOR ALL
  USING (menu_plan_id IN (SELECT id FROM menu_plans WHERE olla_id IN (SELECT id FROM ollas_comunes WHERE tenant_id = audit.current_tenant_id())));

-- meal_delivery_details
CREATE POLICY tenant_isolation ON meal_delivery_details
  FOR ALL
  USING (delivery_id IN (SELECT id FROM meal_deliveries WHERE menu_plan_id IN (SELECT id FROM menu_plans WHERE olla_id IN (SELECT id FROM ollas_comunes WHERE tenant_id = audit.current_tenant_id()))));

-- recommendations
CREATE POLICY tenant_isolation ON recommendations
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());

-- alerts
CREATE POLICY tenant_isolation ON alerts
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());

-- documents
CREATE POLICY tenant_isolation ON documents
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());

-- supply_sources
CREATE POLICY tenant_isolation ON supply_sources
  FOR ALL
  USING (tenant_id = audit.current_tenant_id());
