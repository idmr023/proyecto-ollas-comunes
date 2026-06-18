# Documentacion del proyecto SIGO-OLLAS

SIGO-OLLAS es una plataforma web para gestionar ollas comunes. El sistema permite administrar organizaciones, ollas, beneficiarios, inventario y flujos de acceso con autenticacion basada en JWT y verificacion OTP.

Este proyecto no depende de Apache ni MySQL de XAMPP para ejecutarse. Aunque este en `C:\xampp\htdocs`, se levanta como una aplicacion Node.js con un frontend Next.js y un backend Express.

## Stack principal

| Capa | Tecnologia |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Sonner |
| Backend | Node.js, Express, TypeScript, Prisma, Supabase JS |
| Base de datos | PostgreSQL en Supabase |
| Autenticacion | Login con password, JWT y OTP |
| ORM | Prisma con adaptador PostgreSQL |
| Despliegue sugerido | Vercel para frontend, Render para backend, Supabase para base de datos |

## Estructura del repositorio

```txt
ollas_comunes/
  backend/             API Express + TypeScript + Prisma
  frontend/            Aplicacion web Next.js
  supabase/            Migraciones SQL y configuracion Supabase
  docs/                Documentacion tecnica del proyecto
  package.json         Dependencias auxiliares de raiz
```

## Requisitos

- Node.js instalado.
- npm disponible. En PowerShell se recomienda usar `npm.cmd` si `npm` esta bloqueado por la politica de ejecucion.
- Credenciales reales de Supabase.
- Conexion a internet para instalar dependencias y, en algunos builds, descargar fuentes de Google usadas por Next.js.

## Instalacion

Ejecutar una vez por carpeta:

```powershell
cd C:\xampp\htdocs\ollas_comunes
npm.cmd ci

cd C:\xampp\htdocs\ollas_comunes\backend
npm.cmd ci

cd C:\xampp\htdocs\ollas_comunes\frontend
npm.cmd ci
```

El backend ejecuta `prisma generate` automaticamente despues de instalar dependencias.

## Configuracion del backend

Crear el archivo `.env` desde el ejemplo:

```powershell
cd C:\xampp\htdocs\ollas_comunes\backend
Copy-Item .env.example .env
notepad .env
```

Variables importantes:

```env
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SECRET_KEY="tu-secret-key"
SUPABASE_HEALTHCHECK_TABLE="tenants"
PORT=4000
HOST=0.0.0.0
ALLOWED_ORIGINS="http://localhost:3000"
JWT_SECRET="cambiar-por-secreto-seguro"
EMAIL_MODE="console"
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Notas:

- `SUPABASE_URL` y `SUPABASE_SECRET_KEY` se obtienen desde Supabase, en Project Settings > API.
- `DATABASE_URL` se obtiene desde Supabase, en Connect > Transaction pooler.
- `EMAIL_MODE="console"` se usa en desarrollo para mostrar el OTP en la terminal y en la pantalla. Asi no es necesario configurar Gmail o SMTP local.
- Para produccion usar `EMAIL_MODE="smtp"` y configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM`.
- Nunca subir `.env` al repositorio.

## Como correr el proyecto

Abrir dos terminales.

Terminal 1, backend:

```powershell
cd C:\xampp\htdocs\ollas_comunes\backend
npm.cmd run dev
```

La API debe quedar en:

```txt
http://localhost:4000
```

Verificaciones utiles:

```txt
http://localhost:4000/api/health
http://localhost:4000/api/health/prisma
http://localhost:4000/api/health/supabase
```

Terminal 2, frontend:

```powershell
cd C:\xampp\htdocs\ollas_comunes\frontend
npm.cmd run dev
```

La aplicacion web debe quedar en:

```txt
http://localhost:3000
```

## Flujo de login en desarrollo

1. Abrir `http://localhost:3000/login`.
2. Ingresar correo y contrasena de un usuario existente en la tabla `app_users`.
3. Si las credenciales son correctas, el backend genera un OTP.
4. Con `EMAIL_MODE="console"`, el OTP aparece:
   - En la terminal del backend.
   - En la pantalla de verificacion como "Codigo de desarrollo".
5. Ingresar exactamente ese codigo.

Importante:

- El OTP es aleatorio, no es fijo.
- Expira en 2 minutos.
- Si se ingresa mal varias veces, se bloquea ese codigo y se debe generar uno nuevo iniciando sesion otra vez.

## Scripts principales

Backend:

| Comando | Descripcion |
| --- | --- |
| `npm.cmd run dev` | Compila TypeScript y levanta `dist/server.js` con `node --watch` |
| `npm.cmd run build` | Compila el backend |
| `npm.cmd start` | Ejecuta el backend compilado |
| `npm.cmd run prisma:generate` | Genera Prisma Client |
| `npm.cmd run prisma:studio` | Abre Prisma Studio |
| `npm.cmd run prisma:migrate:deploy` | Aplica migraciones Prisma en despliegue |

Frontend:

| Comando | Descripcion |
| --- | --- |
| `npm.cmd run dev` | Levanta Next.js en desarrollo |
| `npm.cmd run build` | Compila el frontend |
| `npm.cmd start` | Ejecuta el build de Next.js |
| `npm.cmd run lint` | Ejecuta ESLint |

## Rutas principales del backend

Rutas publicas:

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/` | Estado basico de la API |
| `GET` | `/api/health` | Healthcheck general |
| `GET` | `/api/health/prisma` | Verifica conexion Prisma/PostgreSQL |
| `GET` | `/api/health/supabase` | Verifica conexion Supabase |
| `POST` | `/api/auth/login` | Login inicial con email y password |
| `POST` | `/api/auth/verify-otp` | Verifica OTP y entrega JWT |
| `POST` | `/api/auth/register` | Crea usuario |
| `GET` | `/api/auth/google/url` | URL OAuth Google |
| `POST` | `/api/auth/google` | Login con credencial Google |
| `POST` | `/api/auth/google/callback` | Callback OAuth Google/Supabase |

Rutas protegidas con JWT:

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/api/auth/me` | Usuario actual |
| `GET` | `/api/organizations` | Lista organizaciones |
| `GET` | `/api/organizations/:slug` | Obtiene una organizacion |
| `POST` | `/api/organizations` | Crea organizacion |
| `PATCH` | `/api/organizations/:slug` | Actualiza organizacion |
| `PATCH` | `/api/organizations/:slug/status` | Cambia estado |
| `GET` | `/api/organizations/:slug/ollas` | Lista ollas de una organizacion |
| `POST` | `/api/organizations/:slug/ollas` | Crea olla comun |
| `GET` | `/api/beneficiaries` | Lista beneficiarios |
| `GET` | `/api/beneficiaries/conditions` | Lista condiciones de salud |
| `GET` | `/api/beneficiaries/ollas` | Lista ollas para beneficiarios |
| `GET` | `/api/beneficiaries/:id` | Obtiene beneficiario |
| `POST` | `/api/beneficiaries` | Crea beneficiario |
| `PATCH` | `/api/beneficiaries/:id` | Actualiza beneficiario |
| `DELETE` | `/api/beneficiaries/:id` | Elimina beneficiario |
| `GET` | `/api/mobile/*` | Endpoints para vistas moviles |

## Paginas principales del frontend

| Ruta | Descripcion |
| --- | --- |
| `/login` | Inicio de sesion |
| `/login/otp` | Verificacion OTP |
| `/workspace/home` | Inicio del panel web |
| `/workspace/organizaciones` | Gestion de organizaciones |
| `/workspace/beneficiarios` | Gestion de beneficiarios |
| `/workspace/inventario` | Inventario |
| `/workspace/reportes` | Reportes |
| `/mobile/inicio` | Inicio movil |
| `/mobile/padron` | Padron movil |
| `/mobile/inventario` | Inventario movil |
| `/mobile/menu-ia` | Menu IA |
| `/mobile/alertas` | Alertas |

## Base de datos y migraciones

Hay dos zonas relevantes:

- `supabase/migrations/`: migraciones SQL versionadas del esquema Supabase.
- `backend/prisma/schema.prisma`: modelo Prisma usado por el backend.

Reglas recomendadas:

- No crear tablas manualmente como unica fuente de verdad.
- Versionar cambios de esquema en migraciones.
- Mantener `schema.prisma` sincronizado con la base real.
- Usar el pooler de Supabase para `DATABASE_URL` cuando el backend corre con Prisma.

## Seguridad

El backend aplica:

- `helmet` para cabeceras HTTP seguras.
- CORS configurable mediante `ALLOWED_ORIGINS`.
- Rate limit para `/api/auth`.
- Hash de passwords con `bcryptjs`.
- JWT para autenticar rutas protegidas.
- Middleware `requireAuth` en modulos protegidos.

Las credenciales sensibles deben vivir solo en `.env` o en variables de entorno del proveedor de despliegue.

## Problemas comunes

### `Missing script: dev`

Se ejecuto `npm.cmd run dev` en la raiz del repo. Debe ejecutarse dentro de `backend` o `frontend`.

### `Sin conexion al servidor`

El frontend no puede conectar con `http://localhost:4000`. Revisar:

- Que el backend este corriendo.
- Que `PORT=4000`.
- Que `ALLOWED_ORIGINS` incluya `http://localhost:3000`.
- Que `/api/health` responda.

### `DATABASE_URL no esta configurada`

Falta `backend/.env` o la variable `DATABASE_URL`. Copiar `.env.example` y completar la conexion del pooler de Supabase.

### Error SMTP de Gmail `535 Username and Password not accepted`

En desarrollo usar:

```env
EMAIL_MODE="console"
```

Asi no se necesita Gmail. Para produccion, Gmail requiere contrasena de aplicacion, no la contrasena normal.

### Codigo OTP incorrecto

Usar el codigo mostrado como "Codigo de desarrollo" o el que aparece en la terminal del backend. No usar codigos de ejemplo. Si expiro o se bloqueo, volver a iniciar sesion.

### `next/font` no puede descargar Google Fonts

El build del frontend necesita red para descargar fuentes. Reintentar con conexion a internet.

## Documentacion relacionada

- `docs/ONBOARDING.md`
- `docs/SUPABASE-EQUIPO.md`
- `docs/DISENO_FISICO_BD.md`
- `docs/DIAGRAMA_REPOSITORY_PATTERN.md`
- `docs/INFORME_SEGURIDAD_CIFRADO.md`
- `docs/INFORME_ADMINISTRACION_REPLICACION.md`
- `docs/CATALOGO_CONTROLES_SEGURIDAD.md`
- `supabase/README.md`

