# Plan — App Móvil Flutter + API REST escalable (SIGO-OLLAS)

> Plan de implementación por fases. Idioma de código y documentación: **Español**.
> Arquitectura Flutter según `awtu/.cursor/rules/global.mdc` (clean architecture, Riverpod,
> getIt, AutoRoute, freezed, repository pattern). API: **extiende** el backend Express existente.

---

## 1. Objetivo

Construir una aplicación móvil en **Flutter** para SIGO-OLLAS y, en paralelo, llevar la
**API REST en Express** a un estándar escalable y modular que la app consuma de forma estable.

Decisiones tomadas:

- **API**: extender el backend Express actual (`backend/`), no crear uno nuevo.
- **Ubicación app**: nueva carpeta `mobile_app/` dentro del monorepo `proyecto-ollas-comunes`.
- **Alcance**: MVP por fases.
- **Idioma**: español en todo el código y documentación.

---

## 2. Estado actual (punto de partida real)

**Backend Express ya tiene:**

- Estructura modular: `backend/src/modules/{auth, beneficiaries, mobile, ollas-comunes, organizations}`,
  cada uno con `router.ts` / `service.ts` / `repository.ts` / `errors.ts`.
- Auth JWT + TOTP: `POST /api/auth/login` (email+password → `MFA_PENDING`),
  `POST /api/auth/verify-otp` (código TOTP → JWT), `GET /api/auth/me`.
- Multi-tenant: middleware `requireAuth` inyecta `request.user.{userId, tenantId}`.
- Módulo `mobile` ya expone: `GET /dashboard`, `GET /inventory`, `POST /inventory/movements`,
  `GET /alerts`, `GET /suggestions`, `POST /deliveries`, `POST /menu-plans/execute`,
  `POST /documents/upload`.
- Seguridad: `helmet`, `cors` por allowlist, `express-rate-limit` en auth.
- Persistencia: Prisma + Supabase (`@supabase/supabase-js`).

**Implicación:** el grueso de los endpoints que la app necesita en el MVP **ya existe**.
El trabajo de API se centra en *escalabilidad y contrato estable*, no en reescribir.

---

## 3. Parte A — API REST escalable (backend Express)

Objetivo: contrato estable y predecible para que la app no se rompa al evolucionar.

### A1. Versionado y contrato
- Montar las rutas bajo `/api/v1/...` conservando `/api/...` como alias temporal (deprecación suave).
- Estandarizar **envelope de respuesta**: `{ ok, data, meta?, error? }` de forma consistente
  (hoy mezcla `{ ok, ...data }`). Crear helper `responderExito()` / `responderError()`.
- Definir tipos de error de dominio uniformes (extender el patrón `AuthError` a todos los módulos).

### A2. Validación de entrada
- Validar todos los `request.body` / query con **Zod** (ya está en `auth`). Crear middleware
  `validarCuerpo(schema)` y `validarQuery(schema)` reutilizable en `lib/middleware/`.

### A3. Paginación, filtrado y orden
- Para colecciones (`/inventory`, padrón de beneficiarios, alertas): soportar
  `?page`, `?pageSize`, `?orden`, filtros básicos. Devolver `meta: { page, pageSize, total }`.

### A4. Documentación OpenAPI
- Generar `docs/openapi.yaml` (o vía `zod-to-openapi`) con todos los endpoints v1.
  Sirve como contrato único para generar/validar el cliente Flutter.

### A5. Observabilidad y robustez
- Middleware global de manejo de errores (evitar `try/catch` repetido en cada router).
- Logger estructurado (request id, latencia, tenant).
- Health checks ya existen (`/api/health`, `/health/prisma`, `/health/supabase`).

### A6. Endpoints faltantes para el MVP
- Confirmar/crear endpoint de **padrón de beneficiarios** para móvil (listar/crear/editar)
  reutilizando `modules/beneficiaries`. Exponerlo bajo `/api/v1/mobile/beneficiarios` o
  directamente `/api/v1/beneficiaries` con paginación.

### A7. Pruebas
- Tests de integración por módulo (Vitest, ya configurado) sobre el contrato v1.

---

## 4. Parte B — App Flutter (`mobile_app/`)

Arquitectura **clean** + **feature-first**, siguiendo `global.mdc`.

### B0. Andamiaje del proyecto
- `flutter create` en `mobile_app/` (org/bundle a definir).
- Dependencias base: `flutter_riverpod`, `freezed` + `build_runner`, `get_it`,
  `auto_route`, `dio` (cliente HTTP), `flutter_secure_storage` (JWT), `intl`/`AppLocalizations`.
- Configurar `ThemeData`, constantes, entorno (`APP_API_BASE_URL` por flavor dev/prod).

### B1. Estructura de carpetas (feature-first)
```
mobile_app/lib/
├── core/            → tema, constantes, extensiones, errores, cliente_http (Dio + interceptores)
├── config/          → inyeccion (getIt), router (AutoRoute), entorno
├── shared/          → widgets reutilizables (ErrorModal, SuccessModal, ConfirmationModal, loaders)
└── features/
    ├── auth/        → data(repository,api) | domain(entidades,casos_uso) | presentation(controllers,paginas,widgets)
    ├── dashboard/
    ├── inventario/
    ├── padron/
    ├── menu_ia/
    ├── alertas/
    └── evidencias/
```
Reglas: una exportación por archivo, nombres `underscores_case`, clases `PascalCase`,
booleanos con verbo (`isCargando`, `hasError`), funciones cortas (<20 instrucciones),
modales en vez de SnackBar, `const` donde se pueda, árboles de widgets planos.

### B2. Capa de red y sesión (transversal)
- `ClienteHttp` sobre Dio con interceptor que agrega `Authorization: Bearer <jwt>`.
- `AlmacenSesion` con `flutter_secure_storage` para persistir el JWT.
- Manejo global de 401 → cerrar sesión y enrutar a login.
- Mapeo de `{ ok, data, error }` a `Result`/`freezed` (éxito/fallo) sin lanzar excepciones a la UI.

### B3. Estado y dependencias
- **Riverpod** para estado; estados de UI con **freezed** (`Cargando/Datos/Error`).
- **getIt**: singleton para servicios/repositorios, lazy singleton para controllers, factory para casos de uso.
- **AutoRoute** para navegación; `extras` para pasar datos entre páginas.

---

## 5. Fases de entrega (MVP por fases)

Cada fase es un incremento verificable de punta a punta (API ↔ app).

### Fase 0 — Cimientos
- API: A1 (versionado v1 + envelope), A5 (manejo global de errores).
- Flutter: B0, B1, B2, B3 (andamiaje, red, sesión, DI, router, tema).
- **Verificación**: app compila, hace `GET /api/v1/health`, muestra pantalla base.

### Fase 1 — Autenticación
- API: confirmar contrato v1 de `login` / `verify-otp` / `me` (TOTP).
- Flutter: feature `auth` completa — login (email+password), pantalla TOTP, persistencia JWT,
  guardia de rutas, `/me`.
- **Verificación**: login real contra backend dev → token guardado → navega a dashboard.

### Fase 2 — Dashboard
- API: `GET /api/v1/mobile/dashboard` (ya existe).
- Flutter: feature `dashboard` con KPIs/resumen del tenant.
- **Verificación**: dashboard carga datos reales del tenant autenticado.

### Fase 3 — Inventario
- API: A2/A3 sobre `GET /inventory` (paginación) + `POST /inventory/movements`.
- Flutter: feature `inventario` — listado, detalle, registrar movimiento (stepper),
  alertas de stock bajo. Modales de éxito/error.
- **Verificación**: listar inventario, registrar un movimiento, ver reflejo del cambio.

### Fase 4 — Padrón de beneficiarios
- API: A6 (endpoint padrón con paginación/búsqueda) sobre `modules/beneficiaries`.
- Flutter: feature `padron` — listar/buscar, ficha de beneficiario (perfil de salud), alta/edición.
- **Verificación**: buscar beneficiario, crear uno, editar perfil.

### Fase 5 — Resto de módulos
- `menu_ia` (`GET /suggestions`, `POST /menu-plans/execute`),
  `alertas` (`GET /alerts`), `evidencias` (`POST /documents/upload` + cámara/galería).
- **Verificación**: por módulo, flujo principal funcionando contra la API.

### Fase 6 — Cierre
- OpenAPI (A4) actualizado, tests de integración por módulo (API) y widget/integration (Flutter),
  README de `mobile_app/`, build de release dev.

---

## 6. Estándares y testing (de `global.mdc`)
- **Tests Flutter**: widget tests estándar; integration tests por módulo de API.
  Convención AAA y `inputX/mockX/actualX/expectedX`; aceptación Given-When-Then por módulo.
- **Tests API**: Vitest (ya configurado) — integración por módulo sobre contrato v1.
- SOLID, composición sobre herencia, clases pequeñas (<200 instrucciones, <10 métodos públicos),
  RO-RO para parámetros, inmutabilidad, sin números mágicos (constantes).

---

## 7. Riesgos y decisiones pendientes
- **Flutter SDK**: confirmar que está instalado en la máquina (Windows). Si no, instalarlo es prerequisito de Fase 0.
- **Rama de trabajo**: estas son cambios grandes; conviene una rama dedicada
  (ej. `feat/app-movil-flutter`) en vez de seguir en `feat/auth-otp-login`.
- **org/bundle id** de la app y **flavors** (dev/prod) — definir antes de B0.
- **TOTP en móvil**: el flujo actual asume app autenticadora externa; confirmar UX en móvil
  (mostrar QR / pedir código) en Fase 1.
- **Base URL de API dev**: la app necesita apuntar al backend (localhost vs IP de red para
  dispositivo físico vs Render).

---

## 8. Orden de ejecución sugerido
Fase 0 → 1 → 2 → 3 → 4 → 5 → 6, con checkpoint de revisión al cerrar cada fase.
```
