# Registro de cambios — Remediación de auditoría

**Fecha:** 19 de julio de 2026
**Base:** [`DIAGNOSTICO_AUDITORIA.md`](./DIAGNOSTICO_AUDITORIA.md)
**Alcance:** `backend/`, `frontend/`, `prisma/`, `supabase/migrations/`. Excluido `mobile_app/`.

Estado: **17 de los 26 hallazgos resueltos**, más 2 fallos no recogidos en la auditoría.
Nada está commiteado.

---

## 1. Antes de desplegar — leer esto primero

Estos pasos no son opcionales. Algunos, en el orden equivocado, provocan pérdida de datos.

| # | Acción | Por qué |
|---|--------|---------|
| 1 | **Fijar `DB_ENCRYPTION_KEY`** al `sha256` del `JWT_SECRET` **actual**, antes de rotar nada | Los DNI y secretos TOTP existentes están cifrados con esa clave derivada. Si rotas `JWT_SECRET` primero, quedan ilegibles de forma irreversible |
| 2 | Rotar credenciales (C-5) | `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `JWT_SECRET`, `SMTP_PASS`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY` |
| 3 | `ALLOWED_ORIGINS` debe incluir el dominio de Vercel | CORS pasó a `credentials: true`; un origen no listado hace fallar toda petición |
| 4 | Aplicar la migración `20260719120000_add_app_user_olla.sql` | Sin ella, ninguna lideresa tiene olla asignada |
| 5 | Asignar olla a las lideresas que la migración deje sin asignar | El backend les niega el acceso hasta entonces (ver §3) |
| 6 | `npm install` + `npm run build` en `frontend/` | Ver §6: no pudo ejecutarse aquí |

La migración incluye al final la consulta que lista las lideresas pendientes de asignación. A partir de ahora las altas nuevas ya no pueden quedar en ese estado: `register` exige `ollaId` para ese rol.

Comando para el paso 1:

```bash
node -e "console.log(require('crypto').createHash('sha256').update(process.env.JWT_SECRET).digest('hex'))"
```

Variable nueva y opcional: `EXPOSE_ERROR_DETAILS=true` activa el detalle de errores en las respuestas. Por defecto está desactivado, también fuera de producción.

---

## 2. Etapa 1 — Hallazgos críticos (C-1 a C-5)

### C-1 · Registro público con escalada de privilegios

`POST /api/auth/register` era público y aceptaba `tenantId` y `role` del cuerpo, con `admin_municipal` por defecto.

- La ruta exige `requireAuth` + rol administrativo.
- `tenantId` se deriva del token. El esquema Zod es `.strict()`, así que enviarlo falla de forma visible en lugar de ignorarse.
- Matriz de asignación de roles: un `supervisor` no puede crear un `admin_municipal`; una `lideresa_olla` no puede crear a nadie.
- Rol por defecto: `lideresa_olla` (el de menor privilegio).

**Fallo adicional encontrado:** `register` devolvía un JWT del usuario recién creado, **saltándose el segundo factor por completo**. Ahora devuelve solo el usuario.

### C-2 · IDOR cross-tenant en organizaciones

Las rutas `:slug` no comprobaban la pertenencia del recurso.

- Resuelven por `findById(tenantId)` del token y comparan contra el slug pedido.
- Desajuste → `404`, nunca `403`: un `403` confirmaría la existencia del recurso ajeno.
- `GET /api/organizations` devuelve solo la organización propia.
- Efecto colateral: elimina el escaneo O(n) de M-8 en las rutas críticas.

### C-3 · `JWT_SECRET` con fallback inseguro

Nuevo [`backend/src/lib/config/secrets.ts`](./backend/src/lib/config/secrets.ts): falla el arranque si `JWT_SECRET` falta o mide menos de 32 caracteres, y separa la clave de firma de la de cifrado. Eliminados los tres `?? 'fallback-secret'`.

`DB_ENCRYPTION_KEY` es obligatoria en producción. En desarrollo se deriva de `JWT_SECRET` para no romper el flujo local.

### C-4 · Inyección SQL en el extension de Prisma

`$executeRawUnsafe` con interpolación → `$executeRaw` parametrizado, más validación de UUID en el middleware antes de propagar el `userId`.

La validación acepta la forma hexadecimal `8-4-4-4-12` sin exigir los nibbles de versión/variante: el objetivo es impedir inyección, y exigir v4 estricto rechazaría identificadores de semilla legítimos.

### C-5 · `.git-rewrite/` versionado

113 archivos desindexados (`git rm -r --cached`) y regla añadida a `.gitignore`.

**Corrección al diagnóstico:** verifiqué los commits de `backup-refs` con `git cat-file -e`. **Ya no existen** en el almacén local y `refs/original` está vacío. El informe deducía de los 650 MB que los objetos originales seguían presentes; localmente no es así, y `gc --prune --aggressive` aportaría poco. El riesgo real es que el mapa commiteado llegó al remoto. **La rotación sigue siendo necesaria**, como seguro barato.

No se ejecutó `reflog expire` ni `gc` por ser irreversibles.

---

## 3. Fallos encontrados fuera de la auditoría

### `getUserOlla` no vinculaba usuario con olla

El más grave de los dos, y del que colgaban **14 llamadas**.

```ts
// Antes
async getUserOlla(tenantId: string) {
  return prisma.ollaComun.findFirst({
    where: { tenantId, status: "active" },
    orderBy: { name: "asc" },   // la primera por orden alfabético
  })
}
```

`AppUser` no tenía ningún campo `ollaId`: **no existía relación usuario↔olla en el modelo**. Y un tenant puede tener muchas ollas. Así que "la olla de la lideresa" era *la olla del tenant que va primero por nombre*, idéntica para todas las lideresas de esa organización.

Consecuencias, con más de una olla por tenant:

- Una lideresa veía el padrón de otra olla y recibía **403 sobre sus propios beneficiarios**.
- En `mobile`: entregas, movimientos de inventario y ejecución de menús **se escribían en la olla equivocada**. Eso corrompe datos, no solo los expone.

Esto implica que el alcance por fila que se preservó en la Etapa 2 (los seis `if (role === 'lideresa_olla')` de `beneficiaries`) estaba construido sobre una consulta que no discriminaba por usuario. Preservarlos fue correcto —romperlos habría ampliado el acceso— pero no arreglaban lo que aparentaban.

**Corrección:**

- Columna `olla_id` en `app_users`, nula (los roles administrativos no tienen olla propia), con FK `ON DELETE SET NULL` e índice.
- `getUserOlla(userId)` resuelve desde el usuario: olla asignada si la tiene; para roles administrativos se conserva la resolución por tenant; **para una lideresa sin asignar devuelve `null`** — se falla cerrado.
- Backfill conservador: solo asigna automáticamente cuando la organización tiene **exactamente una** olla activa. Con varias se deja sin asignar a propósito; adivinar reproduciría el mismo error.
- `POST /api/auth/register` acepta `ollaId`, lo **exige** cuando el rol es `lideresa_olla` y comprueba que la olla pertenezca a la organización del solicitante.

Lo último cierra un hueco que la corrección abría por sí sola: al fallar cerrado, una lideresa creada sin olla nacía sin acceso a ningún dato, y **no existía ningún endpoint para asignársela**. Sin esto, arreglarlo habría exigido SQL directo contra la base.

**Fallo *fail-open* corregido de paso:** en `GET /beneficiaries/:id` la comparación era `item.ollaId !== olla?.id`. Con la lideresa sin olla y el beneficiario sin olla, `undefined === undefined` **concedía el acceso**.

### Dashboard con conteos de toda la plataforma

En `getAdminDashboard`, dos de las cuatro consultas del mismo `Promise.all` no filtran por `tenantId`:

```ts
prisma.tenant.count({ where: { status: 'active' } }),      // global
prisma.supplyItem.count({ where: { status: 'active' } }),  // global
```

Cada organización ve cuántas organizaciones y cuántos insumos hay en toda la plataforma. **Pendiente** (arreglo de dos líneas).

---

## 4. Etapa 2 — Hallazgos altos y medios

### A-5 · Modelo RBAC

Nuevo [`backend/src/lib/permissions.ts`](./backend/src/lib/permissions.ts) con la matriz rol × recurso × acción como fuente única, aplicada con `requireRole` en `auth`, `organizations`, `mobile` y `notifications`.

**Matiz sobre el diagnóstico:** los seis `if (role === 'lideresa_olla')` de `beneficiaries` **no son condicionales de rol** que `requireRole` pueda sustituir. Son alcance por fila. Reemplazarlos habría *ampliado* el acceso. Se documentó la distinción en el módulo.

### A-6 · Validación de esquema

Middleware genérico [`validate.ts`](./backend/src/lib/middleware/validate.ts) + esquemas Zod `.strict()` para `notifications`, `mobile` y `organizations`. Tres agujeros concretos que cierra:

- `reportDataLoss` insertaba `message` sin filtrar en el cuerpo de un correo a administradores → **inyección de cabeceras**. Ahora se acota y se neutralizan los saltos de línea.
- `uploadDocument` aceptaba `fileName` con `../` y `base64Data` sin límite de tamaño.
- `backupMutation` escribía un `body` de tamaño arbitrario en la base.

**Error evitado:** el enum de estado de alerta iba a ser `['pending', ...]`, pero el esquema Prisma tiene `@default("open")`. Con ese enum, toda alerta recién creada habría sido irrechazable.

### A-2 / A-3 · Sesión en cookie `httpOnly` y guard de servidor

**Bloqueo de arquitectura detectado antes de codificar.** El frontend vive en Vercel y el backend en `onrender.com`: son sitios distintos. Una cookie puesta por el backend sería de terceros —Safari la bloquea por defecto— y el guard de servidor en Vercel **no podría leerla nunca**, por estar asociada al dominio del backend.

Solución: rewrite en [`next.config.ts`](./frontend/next.config.ts) que sirve `/api/:path*` desde el propio origen y lo reenvía a Render. El `Set-Cookie` llega entonces como cookie de origen propio. Sin esto, el cambio habría aparentado funcionar en Chrome y fallado en Safari.

**Segundo hallazgo, consultando los docs de Next 16 en `node_modules`:** `middleware.ts` está **deprecado y renombrado a `proxy.ts`**, con la función exportada como `proxy`. Un `middleware.ts` como pedía la auditoría no se habría ejecutado — sin error ni aviso.

- Cookie emitida en `verify-otp`, refrescada en `/profile`, nuevo endpoint `/logout`.
- El store dejó de persistir el JWT: solo `user` e `isAuthenticated`, que son pistas de UI.
- Eliminados los **cuatro lectores duplicados** de `sessionStorage`, sustituidos por `lib/http.ts` y `lib/session.ts`.

Dos decisiones deliberadas:

- **Se mantiene `Bearer` como alternativa** en el backend. Quitarlo rompía la app móvil nativa y los tests de integración. La cookie tiene prioridad, para que una cabecera manipulada no desplace a una sesión legítima.
- **`SameSite=Lax`, no `Strict`** como pedía la auditoría. Con `Strict`, abrir la app desde un enlace externo muestra el login a un usuario con sesión válida. `Lax` sigue reteniendo la cookie en el vector CSRF real.

### Hallazgos medios

| ID | Cambio |
|----|--------|
| M-2 | `decryptGcm`/`decryptDeterministic` lanzan en vez de devolver el texto cifrado. Los valores en claro heredados siguen pasando; solo falla lo corrupto |
| M-3 | Política de 12 caracteres + complejidad. **No** se aplica a `loginSchema`: bloquearía a usuarios existentes y delataría que su contraseña es corta |
| M-4 | bcrypt a 12 rondas **con rehash progresivo en login**, para que las cuentas antiguas migren sin forzar cambio |
| M-5 | Limitador global (solo `/api/auth` estaba protegido) y límite explícito en `express.json` |
| M-7 | El detalle de error depende de `EXPOSE_ERROR_DETAILS=true`, no de la ausencia de `NODE_ENV=production`. El patrón anterior fallaba abierto |
| B-6 | `allowedDevOrigins` condicionado a desarrollo |
| B-7 | Los health endpoints mandan el detalle al log, no a la respuesta |
| A-4 (parcial) | CSP sin `unsafe-eval`, `connect-src 'self'`, más `frame-ancestors`, `base-uri`, `form-action`, `object-src` |

---

## 5. Pendiente

### En código

| ID | Hallazgo | Nota |
|----|----------|------|
| **A-1** | **RLS habilitado pero inefectivo** | Cero referencias a `current_tenant_id` en el backend. Las 20 políticas no se activan nunca y Prisma se conecta con el rol propietario, que las omite. **Es lo más importante que queda** |
| M-1 | DNI con cifrado determinista | El IV se deriva por HMAC del propio valor. Requiere migración de datos; hacerlo **después** de fijar `DB_ENCRYPTION_KEY` o se recifra dos veces |
| M-6 | `rejectUnauthorized: false` | La conexión a Postgres no valida el certificado TLS |
| M-8 | `findBySlug` en memoria | Las rutas críticas ya usan `findById`; queda en `existsByName` y `findDuplicatesByName` |
| A-4 | `unsafe-inline` en scripts | Necesita nonces de Next |
| — | Dashboard con conteos globales | Ver §3 |
| B-1..B-5 | Esquema Prisma vestigial · 8 artefactos versionados · `ollas-comunes` sin router · 17 `any` · 30 `console.*` | `console.*` subió de 19 porque se añadió logging de errores; refuerza el caso del logger estructurado |

### Recomendaciones de proceso

- **Sin CI, la mitad de las pruebas no se ejecuta nunca.** `integration.test.ts` y `functional.test.ts` necesitan servidor y base de datos vivos, así que solo corren cuando alguien levanta el entorno a mano. Un workflow con Postgres como *service container* es la mejora con mejor relación esfuerzo/beneficio.
- **`handleError` está copiado en cuatro routers**, con el mismo bloque `P2002`/`P2003`/`P2025` y mensajes ligeramente distintos. Un middleware de errores lo unifica.
- **La validación manual de `mobile/service.ts` quedó redundante** tras meter Zod en el router. Se dejó para no romper los tests, pero hay dos definiciones de "movimiento válido" que pueden divergir.

---

## 6. Verificación — y sus límites

**Ejecutado:**

- Backend: typecheck sin errores propios. `prisma generate` resolvió además los errores preexistentes de `failedSyncBackup`. Queda un único error preexistente, `Cannot find module 'nodemailer'`: la dependencia está declarada en `package.json` pero no instalada en este entorno.
- **208 tests unitarios en verde**, incluidos los añadidos para C-1, C-2, C-4, RBAC, validación, política de contraseñas, extracción por cookie, `getUserOlla` y asignación de olla en el alta.
- Frontend: typecheck sin errores. TypeScript localizó los 7 consumidores del token que había que migrar.

**No ejecutado — conviene que se pruebe:**

- `integration.test.ts` y `functional.test.ts`: requieren servidor y base de datos vivos.
- `next build` y los E2E de Playwright: `recharts` y `@playwright/test` están declarados en `package.json` pero **no instalados** en el entorno de trabajo. `proxy.ts` y el rewrite están verificados por tipos y contra la documentación, **no ejecutados**.
- El ciclo completo login → OTP → workspace → recarga → logout, y que `/workspace/home` en ventana privada redirija a `/login` **sin llegar a renderizar**.
- La migración de `olla_id` contra datos reales.

**Nota sobre el alcance de `getUserOlla`:** no hay acceso a los datos de producción, así que **se desconoce si hoy existen tenants con más de una olla activa**. Si todos tienen exactamente una, el fallo está latente y no ha causado daño — pero se activa el día que se cree la segunda. Conviene comprobarlo:

```sql
SELECT t.name, COUNT(*) AS ollas_activas
FROM ollas_comunes o JOIN tenants t ON t.id = o.tenant_id
WHERE o.status = 'active'
GROUP BY t.name HAVING COUNT(*) > 1;
```

---

## 7. Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `backend/src/lib/config/secrets.ts` | Resolución y validación de secretos; falla el arranque |
| `backend/src/lib/permissions.ts` | Matriz RBAC |
| `backend/src/lib/middleware/validate.ts` | Middleware de validación Zod |
| `backend/src/lib/auth-cookie.ts` | Cookie de sesión `httpOnly` |
| `backend/src/lib/debug.ts` | Exposición de errores tras flag explícito |
| `backend/src/modules/{notifications,mobile,organizations}/validators.ts` | Esquemas Zod por módulo |
| `backend/src/test/rbac-validation.test.ts` | 19 tests de RBAC y validación |
| `backend/src/test/user-olla.test.ts` | 5 tests de resolución usuario↔olla |
| `frontend/src/proxy.ts` | Guard de servidor (Next 16) |
| `frontend/src/lib/http.ts` | Cliente HTTP con credenciales |
| `frontend/src/lib/session.ts` | Manejo unificado del 401 |
| `supabase/migrations/20260719120000_add_app_user_olla.sql` | Columna `olla_id` + backfill |
