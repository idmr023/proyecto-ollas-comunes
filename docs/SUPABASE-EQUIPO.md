# Supabase para el equipo

Guia breve para que cualquier integrante del proyecto pueda levantar el backend usando la configuracion actual de Supabase sin exponer credenciales en el repositorio.

## Que necesita cada integrante

- Acceso al repositorio
- Node.js y npm instalados
- Credenciales de Supabase compartidas por canal privado

## Credenciales que deben pedir

Solicitar al responsable del proyecto, por un canal privado, estos datos:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

No pedir ni pegar estas claves en:

- commits
- pull requests
- issues
- archivos versionados del repo

## Como configurar el backend

1. Entrar a `backend`
2. Copiar `.env.example` a `.env`
3. Completar estas variables:

```env
SUPABASE_URL="https://tu-proyecto.supabase.co"
SUPABASE_SECRET_KEY="tu-secret-key"
SUPABASE_HEALTHCHECK_TABLE="tenants"
PORT=4000
```

## Como levantar y verificar

Desde `backend`:

```bash
npm install
npm run dev
```

Verificar en navegador o terminal:

- `http://localhost:4000/api/health`
- `http://localhost:4000/api/health/supabase`

## Regla del equipo

- El esquema de base de datos se cambia mediante `supabase/migrations/`
- No usar la web de Supabase como fuente principal del esquema
- No subir `.env` ni claves al repositorio
- Si alguien necesita acceso, las credenciales se comparten fuera del repo
