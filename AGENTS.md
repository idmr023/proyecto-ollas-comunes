# SIGO-OLLAS — Agentes de IA

## Descripción
Plataforma SaaS para gestión de ollas comunes en Perú. Multi-tenant con roles, inventario, menús, beneficiarios, alertas y recomendaciones IA.

## Stack

| Capa | Stack |
|------|-------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Radix UI, Zustand, React Hook Form + Zod, recharts, motion (Framer), sonner (toasts) |
| **Backend** | Express 5, TypeScript, Prisma 7 + PostgreSQL, Zod, JWT, bcryptjs, TOTP (otplib), nodemailer |
| **DB** | Supabase PostgreSQL (pooler aws-1-us-east-1.pooler.supabase.com), Supabase Storage, Supabase Auth (Google OAuth) |
| **Auth** | JWT (24h) + TOTP (2FA) + captcha Turnstile (opcional para lideresas) |
| **AI** | Cloudflare Workers AI (sugerencias de menú), OpenAI-compatible |
| **Deploy** | Render (backend), Vercel (frontend), Cloudflare Workers (Turnstile proxy) |
| **Testing** | Vitest (backend unit), Playwright (frontend e2e), scripts en `/` (cloud, usabilidad) |

## Estructura

```
proyecto-ollas-comunes/
├── AGENTS.md              ← este archivo
├── backend/
│   ├── src/
│   │   ├── app.ts         ← Express app, middlewares, rutas
│   │   ├── server.ts      ← Entry point
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── supabase.ts
│   │   │   ├── repository.ts
│   │   │   ├── middleware/auth.ts  ← requireAuth middleware
│   │   │   └── date-utils.ts
│   │   └── modules/
│   │       ├── auth/       ← login, register, TOTP, Google OAuth, captcha
│   │       ├── beneficiaries/
│   │       ├── mobile/     ← dashboard, alertas, sugerencias IA
│   │       ├── notifications/
│   │       ├── ollas-comunes/
│   │       └── organizations/
│   ├── prisma/schema.prisma
│   ├── .env               ← NO subir a git
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/             ← /login
│   │   │   ├── workspace/         ← /workspace (admin_municipal)
│   │   │   │   ├── home/
│   │   │   │   ├── beneficiarios/
│   │   │   │   ├── inventario/
│   │   │   │   ├── organizaciones/
│   │   │   │   ├── alertas/
│   │   │   │   ├── reportes/
│   │   │   │   ├── configuracion/
│   │   │   │   └── perfil/
│   │   │   └── mobile/           ← /mobile (lideresa_olla)
│   │   │       ├── inicio/
│   │   │       ├── padron/
│   │   │       ├── inventario/
│   │   │       ├── menu-ia/
│   │   │       ├── alertas/
│   │   │       └── evidencias/
│   │   ├── components/
│   │   │   ├── ui/          ← shadcn/ui components
│   │   │   ├── login/       ← LoginForm, CaptchaWidget
│   │   │   ├── auth/
│   │   │   ├── shared/
│   │   │   ├── workspace/
│   │   │   └── mobile/
│   │   ├── store/           ← Zustand stores (auth-store, theme-store)
│   │   ├── lib/             ← API clients, utils, indexed-db, validations
│   │   ├── hooks/
│   │   └── types/
│   ├── .env.local           ← NO subir a git
│   └── .env.example
```

## Convenciones

### Backend
- **Módulos**: cada módulo en `src/modules/<name>/` con `router.ts`, `service.ts`, `types.ts`, `validators.ts`
- **Middleware**: `requireAuth` en `src/lib/middleware/auth.ts` — extrae JWT, setea `request.user`
- **Respuestas**: siempre `{ ok: boolean, ... }`; errores con `{ ok: false, message: string }`
- **Prisma**: esquema en `prisma/schema.prisma`, generado vía `prisma generate` (postinstall)
- **BD**: mapeo snake_case (`@@map`, `@map`) a camelCase en modelos
- **Tests**: Vitest, archivos `*.test.ts` junto al módulo
- **Repository pattern**: módulos con `repository.ts` que extienden `PrismaRepository<T>` (base en `src/lib/prisma-repository.ts`)
- **DI container**: `src/lib/container.ts` — registrar factories con `container.register()`, resolver con `container.get<T>()`
- **Retry + Circuit Breaker**: `src/lib/retry.ts` — `withRetry(fn)` (exponential backoff), `withCircuitBreaker(key, fn)` (3 failures → open 30s)
- **Audit context**: `src/lib/audit-context.ts` — `withAudit(userId, fn)` inyecta usuario en sesión PostgreSQL para triggers

### Frontend
- **Next.js 16**: app router, server components por defecto, `'use client'` cuando se necesita interactividad
- **Rutas**: `src/app/<ruta>/page.tsx` con layout propio si aplica
- **Componentes UI**: shadcn/ui en `src/components/ui/`, regenerar con `npx shadcn add`
- **Estilos**: Tailwind CSS v4 con `tw-animate-css` para animaciones
- **Estado global**: Zustand en `src/store/`
- **API calls**: fetch directo a `NEXT_PUBLIC_API_URL`
- **PWA**: offline con IndexedDB (`src/lib/indexed-db.ts`), sync manager en layout
- **Env vars públicas**: prefijo `NEXT_PUBLIC_`

## Flujo de Login
1. Email + password → POST `/api/auth/login` → valida credenciales
2. Si `lideresa_olla` y no captcha → `{ status: 'CAPTCHA_REQUIRED' }` → CaptchaWidget → re-envía con `captchaToken`
3. Si admin y no TOTP → `{ status: 'TOTP_SETUP_REQUIRED' }` → escanea QR → POST `/api/auth/verify-otp`
4. Si admin con TOTP → `{ status: 'MFA_PENDING' }` → ingresa código → POST `/api/auth/verify-otp`
5. Éxito → `{ token, user }` → `setAuth()` en store → redirect según `role`

## Roles
- `admin_municipal` → workspace (`/workspace/home`)
- `lideresa_olla` → mobile (`/mobile/inicio`)
- `supervisor`, `operador_olla`, `coordinador` → mobile

## Modelo BD (Prisma)
Ver `backend/prisma/schema.prisma`. Modelos principales:
- **Tenant** → tenant (multi-tenant)
- **AppUser** → usuarios con password_hash, totp_secret, role
- **OllaComun** → ollas por tenant y distrito
- **Beneficiary** → beneficiarios con condiciones médicas (N:M)
- **SupplyItem / SupplyCategory / SupplySource** → insumos y fuentes
- **InventoryMovement / InventoryStock** → inventario
- **Recipe / RecipeIngredient / MenuPlan** → recetas y menús
- **MealDelivery / MealDeliveryDetail** → entregas de raciones
- **Recommendation** → recomendaciones IA
- **Alert** → alertas de stock/consumo
- **Document** → evidencias/documentos
- **AuditLog** → auditoría de cambios

## Env Vars

### Backend (`.env`)
```
SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_HEALTHCHECK_TABLE
DATABASE_URL
PORT, HOST, ALLOWED_ORIGINS
JWT_SECRET
SMTP_HOST/PORT/USER/PASS/FROM
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL
TURNSTILE_SECRET_KEY, TURNSTILE_WORKER_URL
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_TURNSTILE_SITE_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

## Scripts Principales

| Comando | Descripción |
|---------|-------------|
| `npm run dev` (en backend/) | tsc + node --watch |
| `npm run dev` (en frontend/) | next dev |
| `npm run build` (en backend/) | tsc |
| `npm run build` (en frontend/) | next build |
| `npm run test` (en backend/) | vitest |
| `npm run test:usability` (en frontend/) | pruebas de usabilidad |
| `npm run test:e2e` (en frontend/) | Playwright |
| `npm run test:cloud` (en /) | test contra Render |
| `npm run test:all` (en /) | todas las pruebas |
| `npx prisma db execute --file <path>` | Ejecutar migraciones SQL (audit, RLS, encrypt) |

## Migraciones SQL (BD)

Archivos raw SQL en `backend/prisma/migrations/` para características fuera del schema de Prisma:

| Migración | Propósito |
|-----------|-----------|
| `audit_triggers/001_audit_triggers.sql` | Triggers que capturan deltas JSONB en `audit_logs` con usuario desde sesión PostgreSQL |
| `rls/001_enable_rls.sql` | RLS: políticas `tenant_isolation` en 14 tablas vía `app.current_tenant_id` |
| `column_encryption/001_encrypt_sensitive.sql` | Cifrado AES-256 (`pgcrypto`) en DNI/teléfono/email + hash SHA-256 para búsquedas ciegas |

> La app debe llamar `setAuditUser(userId)` y setear `app.current_tenant_id` al inicio de cada request autenticado para que RLS y audit triggers funcionen.

## Captcha (Cloudflare Turnstile)
- Widget creado vía API: sitekey `0x4AAAAAADvi0arnhUk4EflP`
- Worker proxy: `https://turnstile-siteverify-sigo-ollas.sigo-ollasworkersdev.workers.dev`
- Secreto SOLO en Worker (no en backend)
- `action: 'turnstile-spin-v1'` en todas las instancias del widget
- Frontend: `<CaptchaWidget>` → token → backend → Worker → Cloudflare API
