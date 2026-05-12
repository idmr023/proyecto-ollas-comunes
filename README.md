# SIGO-OLLAS

Base tecnica inicial del proyecto, pensada para que el equipo construya sobre una estructura estable sin acoplar aun logica de negocio.

Onboarding rapido del equipo: ver [docs/ONBOARDING.md](docs/ONBOARDING.md).

## Estructura actual

```text
proyecto-ollas-comunes/
  frontend/  -> Next.js + TypeScript + Tailwind v4 + shadcn/ui
  backend/   -> Express + TypeScript + Supabase
  supabase/  -> config local y migraciones SQL versionadas
  README.md
```

## Supabase en este proyecto

- El backend usa `@supabase/supabase-js` para conectarse a Supabase desde servidor.
- La estructura `supabase/` se usa para gestionar configuracion local y migraciones SQL desde el repo.
- No se usa `direct session pooler` como mecanismo principal del runtime del backend.
- El panel web de Supabase se deja para inspeccion, logs y administracion, no como fuente principal del esquema.

## Endpoints activos

- `GET /`
- `GET /api/health`
- `GET /api/health/supabase`

# Faltantes

**1. Diseño Lógico de la Base de Datos**
*   **Plataformas/Servicios:** **Lucidchart** u otra herramienta de modelado.
*   **Lo que falta:** Elaborar el Modelo de Entidad-Relación (DER) de alto nivel e insertarlo en la sección 8.1 antes de tu diagrama físico.

**2. Evidencias de Monitoreo y Administración**
*   **Plataformas/Servicios:** **Grafana** o **Datadog**, y extensiones nativas de **PostgreSQL** (`pg_buffercache` y `pgstattuple`).
*   **Lo que falta:** Detallar en el informe que se usarán estas herramientas visuales para monitorear el ratio de aciertos de la memoria RAM y detectar la inflación de tuplas muertas en la base de datos.

**3. Patrón de Acceso a Datos y Middleware** 
*   **Plataformas/Servicios:** Prisma (ORM / Cliente de Base de Datos), **Supavisor** (Connection Pooler de Supabase), y **Node.js/Express** (API Gateway). ✅ 
*   **Lo que falta:** Explicar que **Supavisor** actuará como un proxy intermediario (*connection pooler*) para balancear y enrutar las peticiones, evitando que el backend en Express agote el límite físico de conexiones de la base de datos. ✅ 

**4. Evidencias de Código y Script SQL (Anexos A y B)**
*   **Plataformas/Servicios:** Código fuente de tu proyecto (**Node.js/React**) y el motor **PostgreSQL/Supabase**.
*   **Lo que falta:** Pegar el código real de tu clase "Repository" en el **Anexo B**. Además, colocar todo tu script SQL en el **Anexo A**, evidenciando la creación de tus tablas, y de forma muy importante, la tabla inmutable `audit_logs` con sus *triggers* pasivos configurados para guardar información forense en JSONB.

**5. Módulo de Autenticación y Autorización Implementado**
*   **Plataformas/Servicios:** **Supabase Auth**, tokens **JWT**, y el cliente web en **React/Next.js**.
*   **Lo que falta:** Ya tienes los prototipos, pero debes incluir **capturas de pantalla del sistema real funcionando**, explicar la gestión segura de las sesiones con los tokens JWT y poner el enlace a tu código fuente de este módulo.

**6. Pruebas de Seguridad Web**
*   **Plataformas/Servicios:** **Kali Linux**.
*   **Lo que falta:** Ejecutar una herramienta de *pen testing* y escaneo de vulnerabilidades, detallar qué problemas encontraste (y cómo mitigarlos) y adjuntar este reporte automatizado en el **Anexo D** de tu informe.

**7. Validación, Casos de Prueba y Evidencias de Despliegue**
*   **Plataformas/Servicios:** **Vercel** (Frontend), **Render** (Backend), y **Supabase** (Capa de datos).
*   **Lo que falta:** Elaborar plantillas de prueba estructuradas para validar requerimientos y adjuntar en el Punto 11 de tu documento las capturas de pantalla reales que demuestren que el panel de Vercel está en "Ready", la API en Render en "Live" y las tablas de Supabase operativas.

Backend:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Supabase CLI:

```bash
npx supabase --version
npx supabase init
npx supabase migration new initial_schema
```

## Flujo recomendado para la base de datos

1. Mantener el esquema SQL dentro de `supabase/migrations/`.
2. Convertir el SQL inicial del proyecto en la primera migracion versionada.
3. Aplicar cambios futuros a la base mediante nuevas migraciones, no editando el esquema manualmente en la web de Supabase.
4. Usar el panel web solo para revisar tablas, logs, storage, auth y estado del proyecto.

## Archivos clave del backend

- `backend/src/server.ts`: arranque.
- `backend/src/app.ts`: rutas y middlewares.
- `backend/src/lib/supabase.ts`: cliente Supabase y estado de configuracion.

## Archivos clave de Supabase

- `supabase/config.toml`: configuracion local de Supabase CLI.
- `supabase/migrations/`: migraciones SQL versionadas del esquema.
- `supabase/README.md`: guia corta para adoptar el proyecto remoto y cargar la migracion inicial.

## Notas

- Mantener la `SUPABASE_SECRET_KEY` fuera del frontend y fuera de control de versiones.
- No usar `direct session pooler` salvo que mas adelante entren ORM o scripts SQL que realmente necesiten conexion Postgres directa.
- En algunos entornos Windows con PowerShell restringido, puede ser necesario ejecutar npm/npx via `cmd /c`.

## Estado actual de la integracion

- Ya existe conexion server-side por `supabase-js` en el backend.
- La carpeta `supabase/` ya esta inicializada en el repo.
- La migracion inicial oficial ya vive en `supabase/migrations/20260424004514_initial_schema.sql`.

## Actualizaciones - 11 de Mayo 2026

### Patrón Repository (Punto 2)
- Creada **interfaz genérica `Repository<T, ID>`** y clase abstracta `SupabaseRepository` en `backend/src/lib/repository.ts`
- Creado **`OrganizationRepository`** en `backend/src/modules/organizations/repository.ts` con métodos `findBySlug`, `existsByName`, `findDuplicatesByName`, `getExistingCodes`
- Creado `backend/src/modules/organizations/errors.ts` con `OrganizationServiceError`
- **Refactorizado** `backend/src/modules/organizations/service.ts`: eliminada dependencia directa de Supabase; ahora usa `OrganizationRepository`
- Documentado en `docs/DIAGRAMA_REPOSITORY_PATTERN.md` (diagrama de clases UML + justificación técnica)

### Catálogo e Informe de Seguridad (Punto 5)
- `docs/CATALOGO_CONTROLES_SEGURIDAD.md` — 24 controles de seguridad mapeados contra ISO 27001:2022, OWASP Top 10 (2021) y NIST SP 800-53
- `docs/INFORME_SEGURIDAD_CIFRADO.md` — TLS 1.3, bcrypt, AES-256/pgcrypto, JWT, RLS, RBAC, tabla `audit_logs`, trazabilidad de sesiones

### Diseño y Administración de Base de Datos (Punto 6)
- `docs/DISENO_FISICO_BD.md` — Diagrama entidad-relación, diccionario completo de las 20 tablas con tipos, constraints e índices
- `docs/INFORME_ADMINISTRACION_REPLICACION.md` — Streaming Replication asíncrona vía WAL, backups PITR, RPO < 5min / RTO < 30min, plan de contingencia
