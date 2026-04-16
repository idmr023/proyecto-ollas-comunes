# SIGO-OLLAS

Base tecnica inicial del proyecto, pensada para que el equipo construya sobre una estructura estable sin acoplar aun logica de negocio.

Onboarding rapido del equipo: ver [docs/ONBOARDING.md](docs/ONBOARDING.md).

## Objetivo de esta base

- Separar claramente frontend y backend.
- Dejar herramientas modernas ya integradas para acelerar desarrollo.
- Evitar rehacer configuraciones base (routing, estilos, prisma, etc.).
- Permitir iterar por modulos sin romper el arranque del proyecto.

## Estructura actual

```text
proyecto-ollas-comunes/
	frontend/  -> React + Vite + TypeScript + Tailwind v4 + shadcn/ui
	backend/   -> Express + TypeScript + Prisma 7 (PostgreSQL)
	README.md
```

## Cambios implementados

### Frontend

- Proyecto creado con Vite + React + TypeScript.
- Integracion de Tailwind CSS v4 con plugin de Vite.
- Integracion obligatoria de shadcn/ui (inicializado y funcionando).
- Alias de imports `@/*` configurado para usar `src/*`.
- Providers base agregados:
	- React Router (`BrowserRouter`)
	- TanStack Query (`QueryClientProvider`)
	- Sonner (`Toaster`)
- Pagina de bienvenida simple lista en la ruta `/`.
- Librerias utiles instaladas para crecimiento del proyecto:
	- `react-router-dom`
	- `@tanstack/react-query`
	- `react-hook-form`
	- `zod`
	- `sonner`
	- `lucide-react`
	- `class-variance-authority`, `clsx`, `tailwind-merge`

### Backend

- Proyecto Node inicializado en carpeta independiente.
- Servidor Express + TypeScript creado.
- Endpoints base:
	- `GET /`
	- `GET /api/health`
- Prisma 7 configurado para PostgreSQL.
- Cliente Prisma preparado con adapter oficial para Prisma 7:
	- `@prisma/adapter-pg`
	- `pg`
- Archivo de ejemplo de entorno creado: `backend/.env.example`.
- Scripts de trabajo agregados:
	- `dev`, `build`, `start`
	- `prisma:generate`, `prisma:migrate`

### Configuracion de repositorio

- `.gitignore` raiz agregado para no versionar `node_modules`, builds y `.env`.
- README actualizado para onboarding del equipo.

## Archivos clave para entender la base

- Frontend:
	- `frontend/src/App.tsx`: vista de bienvenida.
	- `frontend/src/providers.tsx`: providers globales.
	- `frontend/src/index.css`: tokens/tema base y estilos globales.
	- `frontend/components.json`: configuracion de shadcn/ui.
- Backend:
	- `backend/src/server.ts`: arranque de la API.
	- `backend/src/app.ts`: middlewares y rutas base.
	- `backend/src/lib/prisma.ts`: inicializacion del cliente Prisma.
	- `backend/prisma/schema.prisma`: definicion del datasource/generador.
	- `backend/prisma.config.ts`: config de Prisma CLI.

## Requisitos

- Node.js 22+ recomendado.
- npm 10+.
- PostgreSQL para desarrollo local (o remoto).

## Como levantar el proyecto

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

### 2) Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:generate
npm run dev
```

El backend deberia responder en:

- `GET http://localhost:4000/`
- `GET http://localhost:4000/api/health`

## Variables de entorno backend

Archivo: `backend/.env`

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/sigo_ollas?schema=public"
PORT=4000
```

## Como modificar esta base sin romperla

### Frontend

- Para nuevas vistas, crear paginas y rutas en React Router en lugar de meter todo en `App.tsx`.
- Para componentes UI, priorizar componentes de shadcn/ui y extenderlos.
- Mantener el alias `@/*` para evitar imports relativos largos.
- Si agregan estado de servidor, usar TanStack Query (ya esta listo en providers).

### Backend

- Mantener separacion entre `server.ts` (arranque) y `app.ts` (rutas/middlewares).
- Para nuevas rutas, crear modulos por dominio (ejemplo: usuarios, comedores, turnos).
- Definir modelos de BD en `schema.prisma` y luego ejecutar:

```bash
npm run prisma:migrate
npm run prisma:generate
```

- Reutilizar una instancia unica de Prisma desde `src/lib/prisma.ts`.

## Convenciones recomendadas para el equipo

- No agregar logica de negocio directamente en componentes de UI.
- No versionar archivos `.env`.
- Evitar mezclar cambios de infraestructura con cambios funcionales en un mismo PR.
- Si se actualiza una dependencia base (Prisma, Vite, React), documentar el motivo en este README.

## Notas importantes

- Esta base esta intencionalmente minima en negocio: solo infraestructura inicial.
- Prisma 7 usa adapter para conexion directa a PostgreSQL; eso ya esta resuelto en `backend/src/lib/prisma.ts`.
- En algunos entornos Windows con PowerShell restringido, puede ser necesario ejecutar npm/npx via `cmd /c`.

## Checklist rapido para nuevos integrantes

1. Clonar repo.
2. Instalar dependencias en `frontend` y `backend`.
3. Crear `backend/.env` desde el ejemplo.
4. Ejecutar `npm run prisma:generate` en backend.
5. Levantar backend y frontend.
6. Validar `GET /api/health`.

---

Si esta base necesita cambios estructurales (por ejemplo: monorepo con workspaces, auth centralizada o test setup), hacerlos de forma incremental y actualizar este README en el mismo PR.
