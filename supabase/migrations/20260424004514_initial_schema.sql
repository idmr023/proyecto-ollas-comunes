-- ================================================================
-- PROYECTO: SIGO-Ollas
-- ESQUEMA: V3 COMPACTA MEJORADA
-- DESCRIPCION: SaaS basico para gestion de ollas comunes
-- ALCANCE: MVP academico mejorado
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- 1. NUCLEO SaaS Y USUARIOS
-- ================================================================

CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) UNIQUE NOT NULL,
    name varchar(150) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name varchar(150) NOT NULL,
    password_hash text NOT NULL,
    role varchar(30) NOT NULL
        CHECK (role IN ('admin_municipal', 'lideresa_olla', 'supervisor')),
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- 2. ESTRUCTURA TERRITORIAL Y OPERATIVA
-- ================================================================

CREATE TABLE districts (
    id smallserial PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL
);

CREATE TABLE ollas_comunes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    district_id smallint REFERENCES districts(id),
    code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    address text,
    contact_name varchar(150),
    contact_phone varchar(30),
    estimated_daily_capacity integer CHECK (estimated_daily_capacity >= 0),
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, code)
);

-- ================================================================
-- 3. PADRON Y PERFIL DE SALUD
-- ================================================================

CREATE TABLE beneficiaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    olla_id uuid REFERENCES ollas_comunes(id) ON DELETE SET NULL,
    dni varchar(20) UNIQUE,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    gender varchar(20) NOT NULL DEFAULT 'not_specified'
        CHECK (gender IN ('male', 'female', 'other', 'not_specified')),
    birth_date date NOT NULL,
    phone varchar(30),
    address text,
    priority_level varchar(20) DEFAULT 'normal'
        CHECK (priority_level IN ('low', 'normal', 'high')),
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    registered_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE health_conditions (
    id smallserial PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE beneficiary_health_conditions (
    beneficiary_id uuid NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
    health_condition_id smallint NOT NULL REFERENCES health_conditions(id) ON DELETE RESTRICT,
    notes text,
    PRIMARY KEY (beneficiary_id, health_condition_id)
);

-- ================================================================
-- 4. INVENTARIO Y ABASTECIMIENTO
-- ================================================================

CREATE TABLE supply_categories (
    id smallserial PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL
);

CREATE TABLE supply_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type varchar(30) NOT NULL
        CHECK (source_type IN ('municipality', 'ngo', 'company', 'private_donor', 'local_purchase')),
    name varchar(150) NOT NULL,
    contact_name varchar(150),
    contact_phone varchar(30),
    notes text,
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE supply_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id smallint REFERENCES supply_categories(id) ON DELETE SET NULL,
    name varchar(120) NOT NULL,
    unit varchar(20) NOT NULL
        CHECK (unit IN ('kg', 'g', 'lt', 'ml', 'un')),
    is_perishable boolean NOT NULL DEFAULT true,
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    UNIQUE (name, unit)
);

CREATE TABLE inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    olla_id uuid NOT NULL REFERENCES ollas_comunes(id) ON DELETE CASCADE,
    supply_item_id uuid NOT NULL REFERENCES supply_items(id) ON DELETE RESTRICT,
    source_id uuid REFERENCES supply_sources(id) ON DELETE SET NULL,
    movement_type varchar(20) NOT NULL
        CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste')),
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    movement_date timestamptz NOT NULL DEFAULT now(),
    notes text,
    created_by uuid REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE TABLE inventory_stock (
    olla_id uuid NOT NULL REFERENCES ollas_comunes(id) ON DELETE CASCADE,
    supply_item_id uuid NOT NULL REFERENCES supply_items(id) ON DELETE RESTRICT,
    quantity numeric(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (olla_id, supply_item_id)
);

-- ================================================================
-- 5. RECETAS, MENUS Y ENTREGAS
-- ================================================================

CREATE TABLE recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name varchar(150) NOT NULL,
    description text,
    estimated_servings integer NOT NULL DEFAULT 1 CHECK (estimated_servings > 0),
    status varchar(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

CREATE TABLE recipe_ingredients (
    recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    supply_item_id uuid NOT NULL REFERENCES supply_items(id) ON DELETE RESTRICT,
    quantity numeric(12,2) NOT NULL CHECK (quantity > 0),
    unit varchar(20) NOT NULL
        CHECK (unit IN ('kg', 'g', 'lt', 'ml', 'un')),
    notes text,
    PRIMARY KEY (recipe_id, supply_item_id)
);

CREATE TABLE menu_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    olla_id uuid NOT NULL REFERENCES ollas_comunes(id) ON DELETE CASCADE,
    recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
    operation_date date NOT NULL,
    dish_name varchar(150) NOT NULL,
    planned_servings integer NOT NULL CHECK (planned_servings > 0),
    suggested_by_type varchar(20) NOT NULL DEFAULT 'user'
        CHECK (suggested_by_type IN ('user', 'ia')),
    created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
    status varchar(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'approved', 'executed', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (olla_id, operation_date)
);

CREATE TABLE meal_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_plan_id uuid NOT NULL REFERENCES menu_plans(id) ON DELETE CASCADE,
    delivered_at timestamptz NOT NULL DEFAULT now(),
    total_rations integer NOT NULL CHECK (total_rations >= 0),
    created_by uuid REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE TABLE meal_delivery_details (
    delivery_id uuid NOT NULL REFERENCES meal_deliveries(id) ON DELETE CASCADE,
    beneficiary_id uuid NOT NULL REFERENCES beneficiaries(id) ON DELETE RESTRICT,
    ration_type varchar(50),
    PRIMARY KEY (delivery_id, beneficiary_id)
);

-- ================================================================
-- 6. RECOMENDACIONES, ALERTAS Y AUDITORIA
-- ================================================================

CREATE TABLE recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    olla_id uuid REFERENCES ollas_comunes(id) ON DELETE CASCADE,
    recommendation_type varchar(30) NOT NULL
        CHECK (recommendation_type IN ('menu', 'priority', 'stock_alert')),
    target_date date,
    related_recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
    title varchar(150) NOT NULL,
    description text,
    generated_by_type varchar(20) NOT NULL DEFAULT 'ia'
        CHECK (generated_by_type IN ('ia', 'system', 'user')),
    status varchar(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
    approved_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    olla_id uuid REFERENCES ollas_comunes(id) ON DELETE CASCADE,
    alert_type varchar(50) NOT NULL
        CHECK (alert_type IN (
            'low_stock',
            'unusual_consumption',
            'missing_daily_report',
            'high_priority_beneficiary'
        )),
    severity varchar(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message text NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
    detected_at timestamptz NOT NULL DEFAULT now(),
    resolved_at timestamptz
);

CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    olla_id uuid REFERENCES ollas_comunes(id) ON DELETE CASCADE,
    uploaded_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
    document_type varchar(30) NOT NULL
        CHECK (document_type IN ('evidence', 'report', 'acta', 'photo', 'other')),
    title varchar(150) NOT NULL,
    file_url text NOT NULL,
    description text,
    uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id bigserial PRIMARY KEY,
    table_name varchar(100) NOT NULL,
    record_id uuid NOT NULL,
    action_type varchar(20) NOT NULL
        CHECK (action_type IN ('insert', 'update', 'delete')),
    changed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- INDICES
-- ================================================================

CREATE INDEX idx_app_users_tenant_id ON app_users(tenant_id);

CREATE INDEX idx_ollas_comunes_tenant_id ON ollas_comunes(tenant_id);
CREATE INDEX idx_ollas_comunes_district_id ON ollas_comunes(district_id);

CREATE INDEX idx_beneficiaries_tenant_id ON beneficiaries(tenant_id);
CREATE INDEX idx_beneficiaries_olla_id ON beneficiaries(olla_id);
CREATE INDEX idx_beneficiaries_status ON beneficiaries(status);

CREATE INDEX idx_supply_sources_tenant_id ON supply_sources(tenant_id);
CREATE INDEX idx_supply_sources_type ON supply_sources(source_type);

CREATE INDEX idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX idx_inventory_movements_olla_id ON inventory_movements(olla_id);
CREATE INDEX idx_inventory_movements_supply_item_id ON inventory_movements(supply_item_id);
CREATE INDEX idx_inventory_movements_source_id ON inventory_movements(source_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(movement_date);

CREATE INDEX idx_recipes_tenant_id ON recipes(tenant_id);

CREATE INDEX idx_menu_plans_olla_id ON menu_plans(olla_id);
CREATE INDEX idx_menu_plans_operation_date ON menu_plans(operation_date);
CREATE INDEX idx_menu_plans_recipe_id ON menu_plans(recipe_id);

CREATE INDEX idx_meal_deliveries_menu_plan_id ON meal_deliveries(menu_plan_id);

CREATE INDEX idx_recommendations_tenant_id ON recommendations(tenant_id);
CREATE INDEX idx_recommendations_olla_id ON recommendations(olla_id);
CREATE INDEX idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX idx_recommendations_status ON recommendations(status);

CREATE INDEX idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX idx_alerts_olla_id ON alerts(olla_id);
CREATE INDEX idx_alerts_status ON alerts(status);

CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_olla_id ON documents(olla_id);
CREATE INDEX idx_documents_type ON documents(document_type);

CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);

-- ================================================================
-- DATOS SEMILLA
-- ================================================================

INSERT INTO health_conditions (name) VALUES
('Anemia'),
('Diabetes'),
('Gestante'),
('Adulto mayor'),
('Hipertension')
ON CONFLICT (name) DO NOTHING;

INSERT INTO supply_categories (name) VALUES
('Granos'),
('Verduras'),
('Proteinas'),
('Lacteos'),
('Condimentos')
ON CONFLICT (name) DO NOTHING;
