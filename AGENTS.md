# AGENTS.md — Guía para asistentes de IA

> Instrucciones operativas y de contexto para asistentes de IA que trabajen en **SIGO-OLLAS** (Sistema de Gestión de Ollas Comunes).
> Léelo entero antes de proponer cambios. La ignorancia de las reglas de esta guía se considera bug.

---

## 0. Regla obligatoria antes de actuar

**Antes de proponer, modificar o crear CUALQUIER archivo del proyecto, un asistente de IA DEBE:**

1. **Revisar el grafo de código** (`codebase-memory-mcp`) con las herramientas disponibles
   (`search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`, `query_graph`).
   **No usar `grep`/`glob` directamente** si el MCP puede responder la pregunta.
   Estas son la fuente de verdad sobre la estructura, relaciones, callers/callees y patrones del código.

2. **Leer la carpeta `docs/`** completa, especialmente:
   - `docs/Fixes_Sonar_Qube.md` — decisiones de refactor y por qué se hicieron así.
   - `docs/REPORT_PRUEBAS.md` — qué está testeado y qué no.
   - `docs/CATALOGO_CONTROLES_SEGURIDAD.md` — antes de tocar auth o añadir endpoints.
   - `docs/INFORME_SEGURIDAD_CIFRADO.md` — para datos sensibles, secrets, hashing.
   - `docs/DISENO_FISICO_BD.md` — antes de migraciones o cambios de schema.
   - `docs/ONBOARDING.md` — setup inicial del dev environment.
   - `docs/DIAGRAMA_REPOSITORY_PATTERN.md` — patrón de acceso a datos.
   - `docs/pwa_documentation.md` — para cambios en flujo offline.
   - `docs/HISTORIAS_USUARIO.md` — para entender el dominio funcional.

**Excepción:** tareas puramente cosméticas (typos, formato, comentarios) no requieren este paso.

Si después de revisar el grafo y los docs sigues sin tener el contexto necesario, **pregunta al Tech Lead antes de asumir**.

---

## 1. Identidad del proyecto

SIGO-OLLAS es una plataforma SaaS para digitalizar la administración de **ollas comunes** en Perú: beneficiarios, inventario, menús, entregas y reportes. Multitenant, con Supabase como backend de datos.

- **Tipo:** Monorepo (frontend + backend en el mismo repo, sin workspaces npm).
- **Estado:** producción en uso real (`https://proyecto-ollas-comunes.vercel.app` + Supabase pooler).

---

## 2. Stack (NO mezclar versiones)

| Capa | Tecnología | Versión / Notas |
|---|---|---|
| Frontend | Next.js (App Router) | **Versión custom instalada** — leer `node_modules/next/dist/docs/` antes de asumir APIs. |
| Frontend | TypeScript, Tailwind v4, shadcn/ui, sonner, motion, zustand | Tailwind v4 (NO v3, configs distintas). |
| Frontend | PWA con Service Worker en `frontend/public/sw.js` | ⚠️ Cachea `/login/otp` — ver §6. |
| Backend | Express + TypeScript + Prisma + Supabase (Postgres) | Driver `@prisma/adapter-pg` + `pg.Pool`. |
| Backend | nodemailer, otplib, bcryptjs, jsonwebtoken, zod, helmet, cors, express-rate-limit | — |
| Auth | Flujo en 2 pasos: email+password → TOTP (otplib) → JWT | **Side-effect crítico en `/login`**, ver §6. |
| DB | Postgres via Supabase Transaction Pooler (PgBouncer) | `?pgbouncer=true` en DATABASE_URL obligatorio. |
| Tests backend | Vitest 4 (pool=`forks`, `maxWorkers: 1`) | — |
| Tests frontend | Playwright E2E + script `run-usability-tests.mjs` para análisis estático de JSX | Sin tests unitarios frontend aún. |
| Calidad | SonarQube | Reporte histórico en `docs/Fixes_Sonar_Qube.md`. |

---

## 3. Estructura del repositorio

```
proyecto-ollas-comunes/
├── backend/                  → API Express + Prisma
│   ├── prisma/schema.prisma  → schema de BD (modelos: Tenant, AppUser, OllaComun, Beneficiary, ...)
│   ├── src/
│   │   ├── app.ts            → middleware + routers (CORS, helmet, rate-limit, express.json)
│   │   ├── server.ts         → entrypoint
│   │   ├── lib/              → prisma, supabase, cors, email, date-utils, middleware/auth
│   │   ├── modules/          → auth, beneficiaries, mobile, organizations, notifications, ollas-comunes
│   │   └── test/             → functional.test.ts, integration.test.ts, cors.test.ts
│   ├── test-connection.mjs   → CLI script para validar conexión a BD
│   ├── vitest.config.ts
│   └── package.json
├── frontend/                 → Next.js (App Router)
│   ├── src/
│   │   ├── app/              → rutas (workspace/, mobile/, login/, etc.)
│   │   ├── components/       → ui/ (shadcn), login/, general/, etc.
│   │   ├── hooks/            → use-api.ts, etc.
│   │   ├── lib/              → auth-api.ts, indexed-db.ts (PWA), beneficiaries-api.ts, ...
│   │   ├── store/            → auth-store.ts (Zustand con persist)
│   │   └── types/            → tipos compartidos
│   ├── public/sw.js          → Service Worker PWA (ver §6)
│   ├── e2e/                  → Playwright specs
│   └── package.json
├── prisma/                   → schema.prisma raíz (genera cliente en `../generated/prisma`) + seed.cjs
├── supabase/                 → migraciones SQL versionadas
├── docs/                     → documentación técnica (CATALOGO_CONTROLES_SEGURIDAD.md, REPORT_PRUEBAS.md, Fixes_Sonar_Qube.md, ...)
├── sonar-project.properties
├── test-*.mjs                → scripts de testing de smoke
└── run-*.mjs / run-*.bat     → runners de tests
```

---

## 4. Comandos clave

| Acción | Comando | Notas |
|---|---|---|
| Dev backend | `cd backend && npm run dev` | `tsc && node --watch dist/server.js`. Logs en stdout. |
| Dev frontend | `cd frontend && npm run dev` | Next.js dev server, puerto 3000. |
| Build backend | `cd backend && npm run build` | `tsc -p tsconfig.json` → `dist/`. |
| Test backend | `cd backend && npm test` | Vitest run. **No** ejecuta integration.test.ts sin servidor levantado. |
| Cobertura backend | `cd backend && npm run test:coverage` | Genera `coverage/lcov.info` (alimenta SonarQube). |
| Test E2E frontend | `cd frontend && npm run test:e2e` | Playwright. |
| SonarQube | `sonar-scanner` en la raíz | Lee `sonar-project.properties`. |
| Aplicar migraciones | `cd backend && npx prisma migrate deploy` | Supabase. |
| Generar Prisma client | `cd backend && npx prisma generate` | Obligatorio tras cambios en schema. |

---

## 5. Convenciones de código

### TypeScript
- **Sin comentarios en código** salvo que sean no-obvios o de seguridad. El usuario lo prohíbe explícitamente.
- Imports relativos con `@/` para frontend (tsconfig paths).
- Backend usa imports relativos `../../lib/...`.
- `import type` cuando sea solo tipo.

### Backend
- Cada módulo sigue el patrón: `router.ts` (rutas Express) + `service.ts` (lógica) + `validators.ts` (zod) + `types.ts` (interfaces) + `errors.ts` (clases de error personalizadas). Algunos tienen `repository.ts` para acceso a Prisma.
- Errores de dominio: lanzar `AuthError(STATUS, "Mensaje.")` y dejar que `handleError()` en el router traduzca a JSON.
- NUNCA importar prisma directamente en routes, siempre vía repository.
- **Side-effect warning:** el endpoint `/api/auth/login` muta BD (crea TOTP secret). Ver §6.

### Frontend
- Componentes con `"use client"` en la primera línea si usan hooks.
- Estado global: Zustand con `persist` (ver `auth-store.ts`).
- Formularios: react-hook-form + zod (donde aplica).
- Iconos: `lucide-react`.
- Notificaciones: `sonner` (toast).
- Rutas API client centralizadas en `src/lib/*-api.ts` (ej. `auth-api.ts`).

### Git (no hacer commits sin pedirlo)
- Mensajes en español, imperativo, presente: `Arregla X`, `Agrega Y`, `Refactoriza Z`.
- No incluir secretos, tokens, ni archivos `.env`.

---

## 6. Gotchas y trampas conocidas

### 🔴 `/api/auth/login` muta la BD como side-effect
Si el usuario no tiene TOTP secret, **`/login` lo crea y lo guarda** (como preparación para mostrar el QR). Esto significa que cualquier llamada a `/login` con un usuario nuevo le asigna un secret. Si quieres verificar que un usuario "no tiene secret", **nunca** uses `curl /api/auth/login` como smoke test — lee Prisma directamente.

Flujo correcto del setup TOTP (post-refactor):
1. `POST /api/auth/login` → 200 con `{ status: "TOTP_SETUP_REQUIRED", tempToken, email }` (sin secret en body, sin side-effect).
2. `POST /api/auth/totp/setup` con `{ tempToken }` → 200 con `{ secret, qrCodeUri, email }` (**aquí** SÍ se persiste).
3. `POST /api/auth/verify-otp` con `{ email, tempToken, code }` → 200 con JWT.

`/totp/setup` es idempotente: llamarlo dos veces devuelve el mismo secret.

### 🟡 Service Worker cachea páginas
`frontend/public/sw.js` precachea `/login` y `/login/otp` en el evento `install`. El handler de `fetch` hace network-first con fallback a cache. **Si ves comportamientos raros en login (pantalla sin QR, login fantasma),** puede ser el SW. Para depurar: DevTools → Application → Service Workers → Unregister + Clear storage.

### 🟡 Alias `pgbouncer=true` obligatorio
El `DATABASE_URL` de Supabase pooler debe llevar `?pgbouncer=true`. Sin esto, Prisma falla con errores de prepared statements incompatibles con PgBouncer.

### 🟡 SSL a Supabase
En `backend/src/lib/prisma.ts`, el `Pool` se configura con `ssl: { rejectUnauthorized: false }`. Esto es **deliberado** para Supabase (no es bug). NO cambiar a `true` sin verificar el cert chain primero.

### 🟡 Complejidad cognitiva en `pwa-sync-manager.tsx`
Este archivo es frágil. Cualquier nuevo helper debe mantener la complejidad individual < 8. Si añades lógica al orquestador `syncOfflineMutations`, extráela a un helper. **Regla SonarQube:** 15 es el máximo.

### 🟡 `login-form.tsx` está huérfano
`frontend/src/components/login/login-form.tsx` existe pero **no se usa en ninguna ruta**. Si lo modificas, mantenlo en sync con `app/login/page.tsx`. Si quieres eliminarlo, hazlo en un commit aparte.

---

## 7. Patrones arquitectónicos

- **Repository pattern:** `src/modules/<modulo>/repository.ts` encapsula Prisma. Services nunca tocan `prisma.*` directamente. Ver `src/modules/ollas-comunes/repository.ts` como referencia.
- **Auth flow 2-step:** todo lo relacionado con TOTP pasa por `tempToken` con `purpose: 'mfa'` en el JWT.
- **PWA offline-first:** las mutaciones offline se persisten en IndexedDB (`src/lib/indexed-db.ts`) y se reintentan al reconectarse (`PwaSyncManager`).
- **CORS seguro:** whitelist exacta (no `endsWith`), fail-secure en producción (el servidor no arranca sin `ALLOWED_ORIGINS`). Lógica en `src/lib/cors.ts`.

---

## 8. Documentación de referencia

| Documento | Cuándo leerlo |
|---|---|
| `docs/Fixes_Sonar_Qube.md` | Antes de tocar cualquier archivo listado en su §6. Detalla por qué se hicieron los refactors. |
| `docs/REPORT_PRUEBAS.md` | Para entender qué hay testeado y qué no. |
| `docs/CATALOGO_CONTROLES_SEGURIDAD.md` | Antes de añadir endpoints o tocar auth. |
| `docs/INFORME_SEGURIDAD_CIFRADO.md` | Para datos sensibles, secrets, hashing. |
| `docs/DISENO_FISICO_BD.md` | Antes de migraciones o cambios de schema. |
| `docs/ONBOARDING.md` | Setup inicial del dev environment. |
| `frontend/AGENTS.md` | Notas específicas de Next.js custom version. |
| `backend/prisma/schema.prisma` | Source of truth del modelo de datos. |

---

## 9. Cuándo pedir confirmación al usuario

- **Siempre** antes de hacer commit, push, o crear PR.
- **Siempre** antes de modificar `schema.prisma` o escribir migraciones.
- **Siempre** antes de cambiar el flujo de auth.
- **Siempre** antes de eliminar archivos.
- **Casi siempre** antes de cambiar configuración de SonarQube, Vitest, o package.json (puede romper el escaneo o los tests).

Si dudas entre dos enfoques, pregunta. El usuario es Tech Lead y prefiere decisiones explícitas sobre suposiciones.
