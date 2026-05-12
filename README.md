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

## Variables de entorno backend

Archivo: `backend/.env`

```env
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SECRET_KEY="tu-secret-key"
SUPABASE_HEALTHCHECK_TABLE="tenants"
PORT=4000
```

- `SUPABASE_SECRET_KEY` se usa solo en backend.
- `SUPABASE_HEALTHCHECK_TABLE` es opcional.
  Si se define, `GET /api/health/supabase` valida una tabla real de la base.
  Si no se define, el health verifica conectividad general a Supabase via Storage.

## Comandos utiles

Frontend:

```bash
cd frontend
npm install
npm run dev
```

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
