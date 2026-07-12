## Table `tenants`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `code` | `varchar` |  Unique |
| `name` | `varchar` |  |
| `status` | `varchar` |  |
| `created_at` | `timestamp` |  |
| `category` | `varchar` |  |
| `location` | `varchar` |  |

## Table `app_users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `email` | `text` |  Unique |
| `full_name` | `varchar` |  |
| `password_hash` | `text` |  |
| `role` | `varchar` |  |
| `status` | `varchar` |  |
| `created_at` | `timestamp` |  |
| `totp_secret` | `varchar` |  Nullable |

## Table `districts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int2` | Primary |
| `name` | `varchar` |  Unique |

## Table `ollas_comunes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `district_id` | `int2` |  Nullable |
| `code` | `varchar` |  |
| `name` | `varchar` |  |
| `address` | `text` |  Nullable |
| `contact_name` | `varchar` |  Nullable |
| `contact_phone` | `varchar` |  Nullable |
| `estimated_daily_capacity` | `int4` |  Nullable |
| `status` | `varchar` |  |
| `created_at` | `timestamp` |  |
| `latitude` | `float8` |  Nullable |
| `longitude` | `float8` |  Nullable |

## Table `beneficiaries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `olla_id` | `uuid` |  Nullable |
| `dni` | `varchar` |  Nullable Unique |
| `first_name` | `varchar` |  |
| `last_name` | `varchar` |  |
| `gender` | `varchar` |  |
| `birth_date` | `date` |  |
| `phone` | `varchar` |  Nullable |
| `address` | `text` |  Nullable |
| `priority_level` | `varchar` |  |
| `status` | `varchar` |  |
| `registered_at` | `timestamp` |  |

## Table `health_conditions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int2` | Primary |
| `name` | `varchar` |  Unique |
| `status` | `varchar` |  |

## Table `beneficiary_health_conditions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `beneficiary_id` | `uuid` | Primary |
| `health_condition_id` | `int2` | Primary |
| `notes` | `text` |  Nullable |

## Table `supply_categories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int2` | Primary |
| `name` | `varchar` |  Unique |

## Table `supply_sources`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `source_type` | `varchar` |  |
| `name` | `varchar` |  |
| `contact_name` | `varchar` |  Nullable |
| `contact_phone` | `varchar` |  Nullable |
| `notes` | `text` |  Nullable |
| `status` | `varchar` |  |
| `created_at` | `timestamp` |  |

## Table `supply_items`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `category_id` | `int2` |  Nullable |
| `name` | `varchar` |  |
| `unit` | `varchar` |  |
| `is_perishable` | `bool` |  |
| `status` | `varchar` |  |

## Table `inventory_movements`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `olla_id` | `uuid` |  |
| `supply_item_id` | `uuid` |  |
| `source_id` | `uuid` |  Nullable |
| `movement_type` | `varchar` |  |
| `quantity` | `numeric` |  |
| `movement_date` | `timestamp` |  |
| `notes` | `text` |  Nullable |
| `created_by` | `uuid` |  Nullable |

## Table `inventory_stock`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `olla_id` | `uuid` | Primary |
| `supply_item_id` | `uuid` | Primary |
| `quantity` | `numeric` |  |
| `updated_at` | `timestamp` |  |

## Table `recipes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `name` | `varchar` |  |
| `description` | `text` |  Nullable |
| `estimated_servings` | `int4` |  |
| `status` | `varchar` |  |
| `created_at` | `timestamp` |  |

## Table `recipe_ingredients`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `recipe_id` | `uuid` | Primary |
| `supply_item_id` | `uuid` | Primary |
| `quantity` | `numeric` |  |
| `unit` | `varchar` |  |
| `notes` | `text` |  Nullable |

## Table `menu_plans`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `olla_id` | `uuid` |  |
| `recipe_id` | `uuid` |  Nullable |
| `operation_date` | `date` |  |
| `dish_name` | `varchar` |  |
| `planned_servings` | `int4` |  |
| `suggested_by_type` | `varchar` |  |
| `created_by` | `uuid` |  Nullable |
| `status` | `varchar` |  |
| `created_at` | `timestamp` |  |

## Table `meal_deliveries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `menu_plan_id` | `uuid` |  |
| `delivered_at` | `timestamp` |  |
| `total_rations` | `int4` |  |
| `created_by` | `uuid` |  Nullable |

## Table `meal_delivery_details`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `delivery_id` | `uuid` | Primary |
| `beneficiary_id` | `uuid` | Primary |
| `ration_type` | `varchar` |  Nullable |

## Table `recommendations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `olla_id` | `uuid` |  Nullable |
| `recommendation_type` | `varchar` |  |
| `target_date` | `date` |  Nullable |
| `related_recipe_id` | `uuid` |  Nullable |
| `title` | `varchar` |  |
| `description` | `text` |  Nullable |
| `generated_by_type` | `varchar` |  |
| `status` | `varchar` |  |
| `approved_by` | `uuid` |  Nullable |
| `approved_at` | `timestamp` |  Nullable |
| `created_at` | `timestamp` |  |

## Table `alerts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `olla_id` | `uuid` |  Nullable |
| `alert_type` | `varchar` |  |
| `severity` | `varchar` |  |
| `message` | `text` |  |
| `status` | `varchar` |  |
| `detected_at` | `timestamp` |  |
| `resolved_at` | `timestamp` |  Nullable |

## Table `documents`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `tenant_id` | `uuid` |  |
| `olla_id` | `uuid` |  Nullable |
| `uploaded_by` | `uuid` |  Nullable |
| `document_type` | `varchar` |  |
| `title` | `varchar` |  |
| `file_url` | `text` |  |
| `description` | `text` |  Nullable |
| `uploaded_at` | `timestamp` |  |

## Table `audit_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `table_name` | `varchar` |  |
| `record_id` | `text` |  Nullable |
| `action_type` | `varchar` |  |
| `changed_by` | `uuid` |  Nullable |
| `changed_at` | `timestamp` |  |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |

## Table `failed_sync_backups`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `tenant_id` | `uuid` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `path` | `varchar` |  |
| `method` | `varchar` |  |
| `body` | `jsonb` |  Nullable |
| `errorMessage` | `text` |  Nullable |
| `status` | `int4` |  Nullable |
| `original_timestamp` | `timestamp` |  |
| `reported_at` | `timestamp` |  |
| `email_sent` | `bool` |  |

