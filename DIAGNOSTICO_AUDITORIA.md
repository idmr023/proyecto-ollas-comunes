  # Diagnóstico de Auditoría — SIGO-OLLAS

**Fecha:** 19 de julio de 2026
**Alcance:** `backend/`, `frontend/`, `prisma/`, `supabase/`, scripts raíz, documentación y configuración de repositorio.
**Excluido:** `mobile_app/` (por indicación expresa).

---

## 1. Resumen ejecutivo

El proyecto está bien estructurado a nivel de organización de código: separación clara backend/frontend, patrón repositorio-servicio-router consistente, migraciones SQL versionadas, TypeScript en modo `strict`, y una batería de pruebas notable (236 casos en backend + Playwright + Lighthouse + ZAP). La documentación técnica es abundante y por encima del promedio para un proyecto académico.

Sin embargo, la auditoría encontró **fallos de control de acceso que rompen el aislamiento multi-tenant** — el pilar sobre el que se sostiene toda la propuesta SaaS del sistema. Estos no son fallos teóricos: son explotables con una petición HTTP simple y un token válido de cualquier usuario. Adicionalmente hay un problema de higiene de repositorio que puede haber filtrado el historial de git.

**Veredicto:** arquitectura sólida, ejecución de seguridad insuficiente. No apto para producción con datos reales hasta resolver los 5 hallazgos críticos.

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítico | 5 |
| 🟠 Alto | 6 |
| 🟡 Medio | 8 |
| 🔵 Bajo / mejora | 7 |

---

## 2. Hallazgos críticos

### C-1 — Registro público con escalada de privilegios
**Archivo:** `backend/src/modules/auth/router.ts:64` · `service.ts:126`

```ts
authRouter.post('/register', async (request, response) => { ... })
```

El endpoint `POST /api/auth/register` **no tiene `requireAuth`** y acepta `tenantId` y `role` directamente del cuerpo de la petición:

```ts
data: { email, passwordHash, fullName, tenantId, role: role ?? 'admin_municipal' }
```

Cualquier persona en internet puede crear una cuenta con rol `admin_municipal` dentro de **cualquier organización existente**, solo conociendo su UUID (que se obtiene libremente vía `GET /api/organizations` — ver C-2). El rol por defecto, además, es el de mayor privilegio.

**Impacto:** compromiso total de cualquier tenant. Acceso a padrón de beneficiarios con datos de salud (anemia, diabetes) y DNI.

**Corrección:**
- Proteger la ruta con `requireAuth` + verificación de rol administrador.
- Derivar `tenantId` del token del solicitante, **nunca** del body.
- Restringir qué roles puede asignar cada rol (un `supervisor` no debería poder crear `admin_municipal`).
- Rol por defecto: el de menor privilegio.

---

### C-2 — IDOR cross-tenant en el módulo de organizaciones
**Archivo:** `backend/src/modules/organizations/router.ts:65-190`

Todas estas rutas están tras `requireAuth` pero **ninguna valida que el recurso pertenezca al tenant del usuario**:

| Ruta | Problema |
|------|----------|
| `GET /api/organizations` | `listOrganizations()` sin argumentos → devuelve **todos los tenants** de la plataforma |
| `GET /api/organizations/:slug` | Lee cualquier organización por slug |
| `PATCH /api/organizations/:slug` | **Modifica** cualquier organización |
| `PATCH /api/organizations/:slug/status` | Desactiva cualquier organización |
| `POST /api/organizations` | Crea organizaciones sin control de rol |
| `GET/POST /api/organizations/:slug/ollas` | Lee y **crea ollas** en cualquier organización |

Contrasta con los módulos `beneficiaries`, `mobile` y `organizations/dashboard`, que sí usan `request.user!.tenantId` correctamente. El fallo está aislado al conjunto de rutas por `:slug`.

**Corrección:** resolver el tenant desde el token y comparar contra el recurso antes de responder; devolver `404` (no `403`) ante desajuste para no filtrar existencia. Para el listado global, exigir un rol de superadministrador que hoy no existe en el modelo.

---

### C-3 — `JWT_SECRET` con fallback inseguro en tres archivos
**Archivos:** `lib/middleware/auth.ts:6`, `modules/auth/service.ts:24`, `lib/encryption.ts:5`

```ts
const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret'
```

Si la variable no está presente en el despliegue, la aplicación **arranca igual** y firma tokens con un secreto público conocido. Cualquiera puede forjar un JWT con el `userId`, `tenantId` y `role` que desee.

Agrava el problema que `lib/encryption.ts` **deriva la clave AES-256 de este mismo secreto** cuando `DB_ENCRYPTION_KEY` no está definida — con lo cual el cifrado del DNI y del secreto TOTP también quedaría comprometido, y solo se emite un `console.warn`.

**Corrección:** fallar el arranque (`throw`) si `JWT_SECRET` o `DB_ENCRYPTION_KEY` faltan. Validar longitud mínima (32 bytes). Separar por completo la clave de firma de la clave de cifrado — reutilizarla es una mala práctica criptográfica incluso con las variables bien configuradas.

---

### C-4 — Inyección SQL en el extension de Prisma
**Archivo:** `backend/src/lib/prisma.ts:66`

```ts
await tx.$executeRawUnsafe(
  `SELECT set_config('app.current_user_id', '${userId}', true)`,
)
```

Interpolación directa de string en SQL crudo. Hoy `userId` proviene del payload del JWT, así que la explotación requiere forjar un token — pero eso es exactamente lo que C-3 permite. Encadenados, C-3 + C-4 dan ejecución SQL arbitraria en la base de datos.

**Corrección:** usar parámetros: `` prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)` ``. Además, validar en el middleware que `userId` sea un UUID válido antes de propagarlo.

---

### C-5 — Directorio `.git-rewrite/` versionado en el repositorio
**Ubicación:** raíz del proyecto — 113 archivos rastreados por git

`.git-rewrite/` es un directorio temporal que `git filter-branch` deja al reescribir el historial. Su presencia indica que se ejecutó una limpieza de historial (probablemente para eliminar credenciales — el commit `bf30dcf "Fix: eliminacion copia supabase"` es sugerente), y que **el directorio de trabajo de esa limpieza terminó commiteado**.

Contiene `backup-refs` y el mapeo completo de commits antiguos → nuevos, que puede permitir recuperar objetos supuestamente purgados. El repositorio `.git` pesa **648 MB**, lo que sugiere que los objetos originales siguen presentes.

**Corrección inmediata:**
1. `git rm -r --cached .git-rewrite && echo ".git-rewrite/" >> .gitignore`
2. **Rotar todas las credenciales** que pudieran haber estado en el historial: `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `JWT_SECRET`, `SMTP_PASS`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`. Asumir compromiso es más barato que verificarlo.
3. `git reflog expire --expire=now --all && git gc --prune=now --aggressive` para purgar objetos huérfanos.

> ✅ Nota positiva: `backend/.env` **no** está rastreado y los `.gitignore` están correctamente configurados. El problema es histórico, no actual.

---

## 3. Hallazgos altos

### A-1 — RLS habilitado pero inefectivo por diseño
`supabase/migrations/003_enable_rls.sql` activa RLS en 19 tablas con 20 políticas basadas en `app.current_tenant_id` / claims JWT. Pero el backend se conecta vía Prisma con `DATABASE_URL` (rol propietario) y vía Supabase con `SUPABASE_SECRET_KEY` (service role) — **ambos omiten RLS por completo**. Y el extension de Prisma solo establece `app.current_user_id`, nunca `app.current_tenant_id`.

El README afirma "aislamiento de datos garantizado por Row Level Security". En la práctica el aislamiento depende al 100% del código de aplicación, que es precisamente donde falla (C-2). RLS es hoy una red de seguridad desconectada.

**Corrección:** establecer `app.current_tenant_id` en la misma transacción que `current_user_id`, y conectar Prisma con un rol no propietario sujeto a RLS. Alternativamente, ser honesto en la documentación sobre que RLS solo protege el acceso directo vía API de Supabase.

### A-2 — Sin protección de rutas del lado del servidor
No existe `frontend/src/middleware.ts`. Toda la autorización vive en `AuthGuard`, un componente cliente. Las páginas de `/workspace` y `/mobile` se sirven al navegador antes de cualquier verificación; el guard solo redirige después de hidratar. Cualquier contenido renderizado en servidor queda expuesto.

**Corrección:** añadir un `middleware.ts` de Next.js que valide la sesión antes del render. Requiere mover el token a cookie `httpOnly` (ver A-3).

### A-3 — JWT en `sessionStorage`
`frontend/src/store/auth-store.ts` persiste el token en `sessionStorage`, accesible desde JavaScript. Combinado con la CSP permisiva (A-4), un XSS extrae la sesión completa.

**Corrección:** cookie `httpOnly` + `Secure` + `SameSite=Strict`. `cookies-next` ya está en las dependencias.

### A-4 — CSP con `unsafe-inline` y `unsafe-eval`
`frontend/vercel.json` define `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, lo que anula buena parte del valor de la política. Además hay un `dangerouslySetInnerHTML` en `src/app/layout.tsx:31` que conviene revisar.

**Corrección:** migrar a CSP basada en nonce (soportada nativamente por Next.js 16). Eliminar `unsafe-eval`, que ninguna dependencia del proyecto parece requerir en producción.

### A-5 — Ausencia de un modelo RBAC coherente
Solo existen 6 comprobaciones de rol en todo el backend, todas en `beneficiaries/router.ts` y todas del mismo tipo (`if (role === 'lideresa_olla')`). Los módulos `organizations`, `mobile` y `notifications` no verifican rol en absoluto. Los tres roles definidos (`admin_municipal`, `lideresa_olla`, `supervisor`) no tienen permisos formalizados en ningún lugar.

**Corrección:** definir una matriz rol × recurso × acción y aplicarla mediante middleware (`requireRole('admin_municipal')`), no con condicionales dispersos.

### A-6 — Sin validación de esquema en varios endpoints
Zod se usa correctamente en `auth` (`validators.ts`), pero `notifications/router.ts` pasa `request.body` sin validar a `backupMutation()` y `reportDataLoss()`. `organizations` valida solo `status` de forma manual (`typeof status !== 'string'`). `mobile/router.ts` pasa el body crudo a los servicios.

**Corrección:** un `validators.ts` con esquemas Zod por módulo y un middleware `validate(schema)` genérico.

---

## 4. Hallazgos medios

| # | Hallazgo | Ubicación | Corrección |
|---|----------|-----------|------------|
| M-1 | **Cifrado determinista con IV derivado del texto** — `encryptDeterministic` deriva el IV vía HMAC del propio valor. Permite detectar DNIs iguales entre registros y habilita ataques de diccionario (el espacio de DNIs peruanos es de 10⁸, enumerable). | `lib/encryption.ts:75` | Usar índice ciego: guardar `HMAC(dni)` para búsqueda y `encryptGcm(dni)` para el valor. |
| M-2 | **Descifrado que falla en silencio** — `decryptGcm`/`decryptDeterministic` devuelven el texto original en el `catch`. Un dato corrupto se propaga como si fuera válido. | `lib/encryption.ts:47,105` | Lanzar excepción y registrar el error. |
| M-3 | **Contraseña mínima de 6 caracteres** sin requisitos de complejidad. | `auth/validators.ts:27` | Mínimo 12 caracteres + comprobación contra listas de contraseñas filtradas. |
| M-4 | **`bcrypt` con 10 rondas** — por debajo de la recomendación actual (≥12). | `auth/service.ts:26` | Subir a 12 y planificar rehash progresivo en login. |
| M-5 | **Rate limiting solo en `/api/auth`** — el resto de la API no tiene límite. `POST /api/auth/register`, además, comparte el límite de 5/min con login, lo que no impide enumeración lenta. | `app.ts:64` | Limitador global + límites específicos por endpoint sensible. |
| M-6 | **`rejectUnauthorized: false` en el pool de PostgreSQL** — desactiva la validación del certificado TLS, abriendo la puerta a MITM. | `lib/prisma.ts:23` | Incluir el certificado CA de Supabase y validar. |
| M-7 | **Detalles de error expuestos fuera de producción** — `handleError` devuelve `String(error)` cuando `NODE_ENV !== 'production'`. Si una variable de entorno se pierde en el despliegue, se filtran trazas internas. | `auth/router.ts:29` | Invertir la condición: exponer solo con un flag explícito de depuración. |
| M-8 | **Búsqueda por slug en memoria** — `findBySlug` carga **todos** los tenants y filtra en Node (`repository.ts:19`). `findDuplicatesByName` y `existsByName` hacen lo mismo. Degradación O(n) y consultas repetidas. | `organizations/repository.ts` | Persistir el `slug` como columna indexada y consultar en base de datos. |

---

## 5. Hallazgos bajos y mejoras

- **B-1 — Esquemas Prisma duplicados:** `prisma/schema.prisma` (13 líneas) y `backend/prisma/schema.prisma` (586 líneas, 22 modelos). El de la raíz parece un vestigio. Eliminar para evitar que alguien genere el cliente equivocado.
- **B-2 — Artefactos de ejecución versionados:** 4 logs `isolate-*.log` de V8, `stress-test-report.html/json`, `profiling.txt`, `profiling-bajo-carga.txt` y ~15 reportes HTML en `docs/`. Contribuyen al tamaño del repo y no aportan valor en control de versiones. Mover a releases o a un directorio ignorado.
- **B-3 — Módulo `ollas-comunes` sin router propio:** sus servicios se exponen desde `organizations/router.ts`, rompiendo la simetría del resto de módulos y dificultando aplicar middleware específico.
- **B-4 — 21 usos de `any` / `@ts-ignore`** en código de producción (p. ej. `updateProfile` construye `const updateData: any = {}`), anulando localmente el modo `strict`.
- **B-5 — 19 `console.*` en código de producción** en lugar de un logger estructurado con niveles. Dificulta el diagnóstico en Render y puede filtrar datos a logs de plataforma.
- **B-6 — `next.config.ts` enumera IPs de red local** vía `os.networkInterfaces()` en `allowedDevOrigins`. Es una comodidad de desarrollo que no debería ejecutarse en el build de producción. Condicionar a `NODE_ENV !== 'production'`.
- **B-7 — Endpoints de health verbosos:** `/api/health/prisma` y `/api/health/supabase` devuelven `error.message` sin autenticación, filtrando detalles de infraestructura (host, nombres de tablas, versiones). Devolver solo `ok: true/false` públicamente.

---

## 6. Lo que está bien hecho

Vale la pena señalarlo, porque es la base sobre la que se corrige lo demás:

- **Arquitectura modular consistente** — `router → service → repository → types → errors` replicado en cada módulo. Fácil de navegar y de extender.
- **MFA con TOTP correctamente implementado** — flujo de dos pasos con token temporal de 2 minutos, secreto persistido de forma idempotente y solo cuando el usuario está listo para escanear el QR. El comentario en `service.ts:79` explicando por qué no hay efecto secundario en `/login` refleja buen criterio de diseño.
- **Cobertura de pruebas real** — 236 casos en backend (unitarias, funcionales, integración), E2E con Playwright, pruebas de carga con Artillery, escaneo ZAP y auditoría Lighthouse. Muy por encima de lo habitual.
- **Migraciones SQL versionadas** con trigger de auditoría (`audit_logs`) y política de no usar el dashboard de Supabase como fuente de verdad.
- **Helmet, rate limiting y CORS con whitelist explícita** — el arranque falla si `ALLOWED_ORIGINS` no está en producción (`app.ts:47`), que es exactamente el patrón que falta en `JWT_SECRET` (C-3).
- **Cifrado en reposo de datos sensibles** (DNI, secreto TOTP) — la intención es correcta, aunque la implementación necesita ajustes (M-1, M-2).
- **PWA con soporte offline** — IndexedDB, service worker y cola de sincronización con reporte de pérdida de datos.

---

## 7. Plan de acción priorizado

### Inmediato — antes de cualquier despliegue

1. **Rotar todas las credenciales** listadas en C-5. Sin excepciones.
2. Añadir `requireAuth` + control de rol a `POST /api/auth/register`; derivar `tenantId` del token (C-1).
3. Aplicar filtro por tenant a las rutas `:slug` de `organizations` (C-2).
4. Eliminar los fallbacks de `JWT_SECRET`; fallar el arranque si falta (C-3).
5. Parametrizar el `$executeRawUnsafe` de `prisma.ts` (C-4).
6. `git rm -r --cached .git-rewrite` + purga de objetos (C-5).

### Corto plazo — 1 a 2 semanas

7. Definir la matriz RBAC y aplicarla vía middleware (A-5).
8. Migrar el token a cookie `httpOnly` y añadir `middleware.ts` en Next.js (A-2, A-3).
9. Validación Zod en `notifications`, `mobile` y `organizations` (A-6).
10. Corregir el esquema de cifrado del DNI a índice ciego (M-1, M-2).
11. Subir bcrypt a 12 rondas y endurecer la política de contraseñas (M-3, M-4).

### Medio plazo

12. Conectar RLS de verdad o corregir la documentación (A-1).
13. CSP con nonce, sin `unsafe-eval` (A-4).
14. Validar TLS contra la CA de Supabase (M-6).
15. Slug como columna indexada (M-8).
16. Logger estructurado, limpieza de `any`, limpieza de artefactos del repo (B-2, B-4, B-5).

---

## 8. Notas de verificación

Los hallazgos se obtuvieron por lectura directa del código fuente, no por explotación activa. Antes de dar por cerrada cada corrección conviene:

- Escribir una prueba de integración por cada hallazgo crítico que **falle hoy** (p. ej. usuario del tenant A intentando `PATCH /api/organizations/{slug-de-B}` debe recibir 404). El proyecto ya tiene la infraestructura de pruebas para hacerlo.
- Re-ejecutar `npm run security:all` y comparar contra el baseline de `docs/security-scan-2026-07-19.json`.
- Confirmar mediante `git log --all --diff-filter=D -- "**/.env*"` y revisión de packfiles si alguna credencial llegó efectivamente al historial, aunque la rotación debe hacerse igualmente.

El informe ZAP existente (`reporte-seguridad-zap.html`) reporta 1 alerta High, 5 Medium y 5 Low, pero al ser un escaneo dinámico sin autenticación completa no detecta ninguno de los fallos de control de acceso descritos aquí — que son los de mayor impacto real.
