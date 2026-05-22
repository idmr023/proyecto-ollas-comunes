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

### 3. Base de Datos
- **20 tablas** relacionales con restricciones e índices optimizados
- Migraciones SQL versionadas en `supabase/migrations/`
- Replicación asíncrona WAL con RPO < 5min / RTO < 30min
- Backups PITR automáticos cada 2 horas

### 4. Seguridad
- TLS 1.3 en tránsito
- bcrypt para contraseñas, AES-256/pgcrypto para datos sensibles
- JWT para autenticación, RBAC para roles (admin_municipal, lideresa_olla, supervisor)
- 24 controles de seguridad mapeados contra ISO 27001:2022, OWASP Top 10 y NIST SP 800-53

### 5. Patrones de Diseño
- **Repository Pattern** para acceso a datos (separación lógica de negocio/persistencia)
- Interfaz genérica `Repository<T, ID>` con implementación base `SupabaseRepository`
- Testabilidad mejorada mediante mock de repositorios

---

## Cómo Levantar el Proyecto

### Requisitos
- Node.js y npm instalados
- Credenciales de Supabase (solicitar por canal privado)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acceder a: `http://localhost:3000`

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Verificar:
- `http://localhost:4000/api/health`
- `http://localhost:4000/api/health/supabase`

## Pendientes (Requisitos Académicos)

**1. Diseño Lógico de la Base de Datos**
*   **Plataformas/Servicios:** **Lucidchart** u otra herramienta de modelado.
*   **Lo que falta:** Elaborar el Modelo de Entidad-Relación (DER) de alto nivel e insertarlo en la sección 8.1 antes de tu diagrama físico.

**2. Evidencias de Monitoreo y Administración**
*   **Plataformas/Servicios:** **Grafana** o **Datadog**, y extensiones nativas de **PostgreSQL** (`pg_buffercache` y `pgstattuple`).
*   **Lo que falta:** Detallar en el informe que se usarán estas herramientas visuales para monitorear el ratio de aciertos de la memoria RAM y detectar la inflación de tuplas muertas en la base de datos.

**3. Patrón de Acceso a Datos y Middleware**  ✅
*   **Plataformas/Servicios:** Prisma (ORM / Cliente de Base de Datos), **Supavisor** (Connection Pooler de Supabase), y **Node.js/Express** (API Gateway). ✅ 
*   **Lo que falta:** Explicar que **Supavisor** actuará como un proxy intermediario (*connection pooler*) para balancear y enrutar las peticiones, evitando que el backend en Express agote el límite físico de conexiones de la base de datos. ✅ 

**4. Evidencias de Código y Script SQL (Anexos A y B)** ✅
*   **Plataformas/Servicios:** Código fuente de tu proyecto (**Node.js/React**) y el motor **PostgreSQL/Supabase**. ✅
*   **Lo que falta:** Pegar el código real de tu clase "Repository" en el **Anexo B**. Además, colocar todo tu script SQL en el **Anexo A**, evidenciando la creación de tus tablas, y de forma muy importante, la tabla inmutable `audit_logs` con sus *triggers* pasivos configurados para guardar información forense en JSONB. ✅

**5. Módulo de Autenticación y Autorización Implementado** ✅
*   **Plataformas/Servicios:** **Supabase Auth**, tokens **JWT**, y el cliente web en **React/Next.js**. ✅
*   **Lo que falta:** Ya tienes los prototipos, pero debes incluir **capturas de pantalla del sistema real funcionando**, explicar la gestión segura de las sesiones con los tokens JWT y poner el enlace a tu código fuente de este módulo. ✅

**6. Pruebas de Seguridad Web**
*   **Plataformas/Servicios:** **Kali Linux**.
*   **Lo que falta:** Ejecutar una herramienta de *pen testing* y escaneo de vulnerabilidades, detallar qué problemas encontraste (y cómo mitigarlos) y adjuntar este reporte automatizado en el **Anexo D** de tu informe.

**7. Validación, Casos de Prueba y Evidencias de Despliegue**
*   **Plataformas/Servicios:** **Vercel** (Frontend), **Render** (Backend), y **Supabase** (Capa de datos).
*   **Lo que falta:** Elaborar plantillas de prueba estructuradas para validar requerimientos y adjuntar en el Punto 11 de tu documento las capturas de pantalla reales que demuestren que el panel de Vercel está en "Ready", la API en Render en "Live" y las tablas de Supabase operativas.

---

## Flujo de Trabajo del Equipo

### Convenciones de Desarrollo

1. **Frontend**: Crear páginas y componentes modulares, no meter todo en un solo archivo
2. **Backend**: Rutas/controladores por módulo, acceso a BD centralizado en repositorios
3. **Base de datos**: Todos los cambios de esquema van en `supabase/migrations/`, nunca manualmente en el dashboard
4. **Git**: No subir `.env` ni credenciales al repositorio

### Estructura de Módulos (Backend)

```
backend/src/modules/
├── organizations/
│   ├── router.ts        → Endpoints HTTP
│   ├── service.ts       → Lógica de negocio
│   ├── repository.ts    → Acceso a datos (Supabase)
│   └── errors.ts        → Errores específicos del módulo
```

### Para extender el Repository Pattern a nuevos módulos:

1. Crear `repository.ts` en el módulo
2. Extender `SupabaseRepository` con el tipo de entidad
3. Implementar `toDomain()` y métodos específicos
4. Refactorizar el servicio para usar el repositorio

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

## Estado Actual del Proyecto

| Área | Estado |
|------|--------|
| Estructura base | Completado |
| Frontend setup | Next.js + TypeScript + Tailwind + shadcn/ui |
| Backend setup | Express + TypeScript + Supabase |
| Base de datos | Esquema completo (20 tablas) versionado en migraciones |
| Repository Pattern | Implementado para módulo Organizations |
| Seguridad | Catálogo de controles + informe de cifrado documentados |
| Integración Supabase | Conexión server-side activa + health checks |
| **Próximos pasos** | Desarrollo de módulos restantes, autenticación, UI |

---

## Reglas del Equipo

- **NO** subir `.env` ni credenciales al repositorio
- **NO** usar el dashboard de Supabase como fuente principal del esquema
- **NO** mezclar cambios de infraestructura y funcionalidad en el mismo PR
- **SÍ** versionar todos los cambios de BD en migraciones SQL
- **SÍ** actualizar el README si se modifica algo estructural
- **SÍ** compartir credenciales solo por canales privados

---

## Contacto

Para dudas o acceso a credenciales, contactar al responsable del proyecto por canal privado.

---

> **SIGO-OLLAS** — Sistema de Gestión de Ollas Comunes
> Proyecto académico — Mayo 2026