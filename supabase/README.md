# Supabase en este repo

Este directorio guarda la configuracion local de Supabase CLI y las migraciones SQL versionadas del proyecto.

## Regla de trabajo

- El backend sigue usando `@supabase/supabase-js` para conectarse a Supabase.
- La estructura de la base de datos se mantiene mediante migraciones en `supabase/migrations/`.
- Evitar crear tablas manualmente en la web de Supabase si el cambio debe quedar versionado.

## Siguiente paso para adoptar el proyecto remoto

1. Usar la migracion inicial oficial en `supabase/migrations/20260424004514_initial_schema.sql`.
2. Vincular este repo con el proyecto remoto usando el `project ref`:

```bash
npx supabase link --project-ref TU_PROJECT_REF
```

3. Aplicar la migracion al proyecto remoto:

```bash
npx supabase db push
```

4. Configurar el backend con:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `SUPABASE_HEALTHCHECK_TABLE=tenants` si quieres validar una tabla real en el health

## Sobre direct session pooler

No se usa como mecanismo principal del runtime del backend actual.

En esta base:

- `supabase-js` resuelve la conexion server-side de la aplicacion.
- Las migraciones y la administracion del esquema se manejan con Supabase CLI y SQL versionado.

Si mas adelante entran ORM, scripts SQL o herramientas que necesiten una URL `postgres://`, recien ahi tendria sentido sumar el pooler como canal adicional.

## Credenciales y datos que si hacen falta

- Para `supabase link`: `project ref`
- Para el backend: `SUPABASE_URL` y `SUPABASE_SECRET_KEY`

No hace falta compartir ni usar `session pooler` para esta fase.
