# SIGO-OLLAS

Base tecnica inicial del proyecto, pensada para que el equipo construya sobre una estructura estable sin acoplar aun logica de negocio.

Onboarding rapido del equipo: ver [docs/ONBOARDING.md](docs/ONBOARDING.md).

## Estructura actual

```text
proyecto-ollas-comunes/
  frontend/  -> React + Vite + TypeScript + Tailwind v4 + shadcn/ui
  backend/   -> Express + TypeScript + Supabase
  README.md
```

## Backend actual (sin Prisma)

- Se elimino Prisma por completo del backend.
- La conexion de datos ahora se realiza mediante Supabase.
- Dependencia principal agregada: `@supabase/supabase-js`.
- Endpoints activos:
  - `GET /`
  - `GET /api/health`
  - `GET /api/health/supabase`

## Variables de entorno backend

Archivo: `backend/.env`

```env
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
PORT=4000
```

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

## Archivos clave del backend

- `backend/src/server.ts`: arranque.
- `backend/src/app.ts`: rutas y middlewares.
- `backend/src/lib/supabase.ts`: cliente Supabase.

## Notas

- Mantener la `SUPABASE_SERVICE_ROLE_KEY` fuera del frontend y fuera de control de versiones.
- En algunos entornos Windows con PowerShell restringido, puede ser necesario ejecutar npm/npx via `cmd /c`.
