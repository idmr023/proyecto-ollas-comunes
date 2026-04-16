# Onboarding SIGO-OLLAS

Guia corta para que cualquier integrante del equipo entienda rapidamente que incluye esta base y como empezar a trabajar sobre ella.

## Que es esta base

Esta base no contiene aun logica de negocio del proyecto.

Su objetivo es dejar listo el entorno tecnico para construir SIGO-OLLAS sin perder tiempo configurando desde cero frontend, backend, estilos y conexion a base de datos.

## Que ya viene listo

### Frontend

- React + Vite + TypeScript.
- Tailwind CSS v4.
- shadcn/ui inicializado y usable.
- React Router listo.
- TanStack Query listo.
- Sonner para notificaciones.
- Pagina de bienvenida simple en la ruta `/`.

### Backend

- Express + TypeScript.
- Prisma 7 configurado para PostgreSQL.
- Conexion preparada con `@prisma/adapter-pg`.
- Endpoint base `GET /api/health`.

## Estructura rapida

```text
frontend/   interfaz React
backend/    API Express + Prisma
README.md   documentacion tecnica completa
docs/       documentacion corta para el equipo
```

## Archivos importantes

- `frontend/src/App.tsx`: pantalla inicial.
- `frontend/src/providers.tsx`: providers globales del frontend.
- `frontend/src/index.css`: tema y estilos globales.
- `backend/src/server.ts`: arranque del backend.
- `backend/src/app.ts`: rutas y middlewares base.
- `backend/src/lib/prisma.ts`: cliente Prisma.
- `backend/prisma/schema.prisma`: configuracion del datasource.

## Como levantar el proyecto

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:generate
npm run dev
```

## Variables necesarias

En `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/sigo_ollas?schema=public"
PORT=4000
```

## Como trabajar sobre esta base

### Si vas a tocar frontend

- Crear nuevas paginas y rutas, no meter todo en `App.tsx`.
- Reutilizar shadcn/ui para componentes base.
- Mantener imports con alias `@/`.
- Para llamadas al backend, usar TanStack Query cuando tenga sentido.

### Si vas a tocar backend

- Mantener `server.ts` solo para arranque.
- Agregar rutas/controladores por modulo o dominio.
- Si cambias el modelo de datos, editar `schema.prisma` y luego correr:

```bash
npm run prisma:migrate
npm run prisma:generate
```

## Cuando modificar esta base

Modificar la base si:

- Hace falta una nueva dependencia transversal.
- Cambia la estructura general del proyecto.
- Se agrega infraestructura compartida para todo el equipo.

No modificar la base solo para meter logica puntual de una pantalla o modulo si eso puede resolverse dentro del dominio correspondiente.

## Buenas practicas para el equipo

- No subir `.env` al repositorio.
- No mezclar infraestructura y funcionalidad en el mismo PR si se puede evitar.
- Si cambias algo estructural, actualizar tambien el README principal.
- Si actualizas Prisma, React, Vite o shadcn/ui, dejar documentado el motivo.

## Verificacion minima

Antes de empezar a desarrollar, comprobar:

1. Que el frontend levanta.
2. Que el backend levanta.
3. Que `GET /api/health` responde.
4. Que `npm run prisma:generate` funciona.

## Donde seguir leyendo

- Documentacion completa: [README.md](../README.md)
