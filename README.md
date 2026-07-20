# SIGO-OLLAS — Sistema de Gestión de Ollas Comunes

> **Proyecto colaborativo** — Presentación al equipo de desarrollo

---

## Qué es SIGO-OLLAS

SIGO-OLLAS es un **Sistema de Gestión de Ollas Comunes** diseñado para digitalizar y optimizar la administración de sopas comunitarias en Perú. El sistema permite gestionar organizaciones, ollas comunes, beneficiarios, inventarios, recetas, menús, entregas de comida y generar recomendaciones inteligentes para mejorar la operación diaria.

### Problemática que resolvemos

Las ollas comunes enfrentan desafíos en:
- Registro y seguimiento de beneficiarios
- Control de inventario de insumos
- Planificación de menús y recetas
- Trazabilidad de entregas de comida
- Coordinación entre organizaciones y distritos

SIGO-OLLAS centraliza toda esta gestión en una plataforma web accesible y fácil de usar.

---

## Arquitectura del Proyecto

```
proyecto-ollas-comunes/
├── frontend/          → Next.js + TypeScript + Tailwind v4 + shadcn/ui
├── backend/           → Express + TypeScript + Supabase
├── supabase/          → Migraciones SQL versionadas
├── docs/              → Documentación técnica del equipo
└── README.md          → Este archivo
```

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Sonner (notificaciones) |
| **Backend** | Express.js, TypeScript, `@supabase/supabase-js` |
| **Base de Datos** | PostgreSQL 15 vía Supabase |
| **Autenticación** | Supabase Auth con JWT |
| **Despliegue** | Vercel (frontend), Supabase (backend + BD) |

---

## Características Principales

### 1. Arquitectura Multi-Tenant (SaaS)
- Múltiples organizaciones (municipalidades, ONGs) comparten la misma plataforma
- Aislamiento de datos garantizado por **Row Level Security (RLS)**
- Cada organización gestiona sus propias ollas comunes, beneficiarios y recursos

### 2. Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **Organizaciones (Tenants)** | Gestión de entidades que administran ollas comunes |
| **Ollas Comunes** | Registro de puntos de operación con geolocalización |
| **Beneficiarios** | Padrón con perfil de salud (anemia, diabetes, etc.) |
| **Inventario** | Control de stock, movimientos y fuentes de abastecimiento |
| **Recetas y Menús** | Planificación semanal con sugerencias IA |
| **Entregas** | Registro de raciones entregadas por beneficiario |
| **Recomendaciones** | Sugerencias de menú, prioridades y alertas de stock |
| **Alertas** | Notificaciones de stock bajo, consumo inusual, reportes faltantes |
| **Documentos** | Adjuntar evidencia, reportes y actas |
| **Auditoría** | Trazabilidad completa de cambios (`audit_logs`) |

---


---

## Calidad de Código — SonarQube

El proyecto mantiene un perfil de calidad en SonarQube. En julio 2026 se ejecutó un plan de remediación que redujo los issues de **324 a ~50**:

| Fase | Reglas | Issues eliminados | Tipo |
|------|--------|-------------------|------|
| 0 | S7764 (tipado estricto), S6759 (camelCase JS) | −118 | Desactivación vía Quality Profile |
| 1 | S3776, S2004, S4123 (CRITICAL) | −20 | Extracción de helpers, reducción de complejidad |
| 2 | S1128, S3358, S6582, S7772, S1854, S2486, S7785 | −53 | Mecánicos (imports, ternarios, optional chaining, código muerto) |
| 3 | S1874, S6478, S3863, S6479, S4624 | −10 | APIs deprecadas, keys de React, templates anidados |

**Cambios funcionales derivados:**
- **Accesibilidad:** Backdrop de modal migrado de `<div role="button">` a `<button type="button">` — corrige tab order y anuncio en lectores de pantalla.
- **Formulario de beneficiarios:** Integración del componente `BeneficiaryForm` (antes huérfano). Ahora incluye sección "Contacto" con teléfono y dirección. Al editar, se preserva el estado original del beneficiario (antes se reseteaba a `'active'`).

Documentación relacionada: `docs/Fixes_Sonar_Qube.md`.

---

## Documentación Disponible

| Archivo | Contenido |
|---------|-----------|
| `docs/ONBOARDING.md` | Guía rápida para nuevos integrantes |
| `docs/SUPABASE-EQUIPO.md` | Configuración de credenciales de Supabase |
| `docs/DIAGRAMA_REPOSITORY_PATTERN.md` | Diagrama UML y justificación del patrón de datos |
| `docs/DISENO_FISICO_BD.md` | Diagrama ER completo + diccionario de 20 tablas |
| `docs/INFORME_ADMINISTRACION_REPLICACION.md` | Replicación WAL, backups, plan de contingencia |
| `docs/INFORME_SEGURIDAD_CIFRADO.md` | TLS, bcrypt, AES-256, JWT, RLS, RBAC, audit_logs |
| `docs/CATALOGO_CONTROLES_SEGURIDAD.md` | 24 controles mapeados contra estándares internacionales |

---

## Reglas del Equipo

- **NO** subir `.env` ni credenciales al repositorio
- **NO** usar el dashboard de Supabase como fuente principal del esquema
- **NO** mezclar cambios de infraestructura y funcionalidad en el mismo PR
- **SÍ** versionar todos los cambios de BD en migraciones SQL
- **SÍ** actualizar el README si se modifica algo estructural
- **SÍ** compartir credenciales solo por canales privados


> **SIGO-OLLAS** — Sistema de Gestión de Ollas Comunes
> Proyecto académico — Mayo 2026