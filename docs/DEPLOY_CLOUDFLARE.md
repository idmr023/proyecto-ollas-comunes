# Deploy a Cloudflare Pages

Este proyecto está configurado para hacer **static export** y desplegarse a Cloudflare Pages sin necesidad del adapter oficial (`@cloudflare/next-on-pages`), que aún no soporta Next.js 16.

## Configuración en el dashboard de Cloudflare Pages

| Campo | Valor |
|---|---|
| **Framework preset** | None |
| **Build command** | `npm run build:cloudflare` |
| **Build output directory** | `frontend/out` |
| **Root directory** | (dejar vacío = raíz del repo) |
| **Deploy command** | **DEJAR VACÍO** — Cloudflare auto-despliega `frontend/out` después del build |
| **Non-production branch deploy command** | **DEJAR VACÍO** — mismo comportamiento para preview branches |
| **Environment variables** | (ninguna requerida para el build; las del runtime como `NEXT_PUBLIC_API_URL` se configuran aparte si hace falta) |

## Por qué "Deploy command" debe quedar vacío

El error original que viste era:

```
Executing user deploy command: npx wrangler deploy
✘ [ERROR] Could not detect a directory containing static files
```

`wrangler deploy` es para **Cloudflare Workers**, no para Pages. Pages tiene su propio flujo:
- Después del build, Cloudflare Pages **automáticamente** toma el contenido de `frontend/out` y lo publica
- Si pones un deploy command custom, ese flujo se rompe

Si por algún motivo necesitas control explícito vía CLI:
- Comando correcto: `npx wrangler pages deploy frontend/out --project-name=proyecto-ollas-comunes`
- Pero esto es redundante con el auto-deploy de Pages

## Cómo funciona el routing dinámico con static export

`next.config.ts` tiene `output: "export"`, lo que produce un sitio 100% estático. Las rutas dinámicas `[slug]` se manejan así:

1. **Build:** Next.js pre-renderiza solo el shell HTML para el placeholder `_`:
   - `frontend/out/workspace/organizaciones/_/index.html`
   - `frontend/out/workspace/organizaciones/_/propiedades/index.html`
2. **Deploy:** esos HTML se suben a Cloudflare Pages
3. **Request real:** cuando un usuario navega a `/workspace/organizaciones/mi-ong/`:
   - Cloudflare busca `frontend/out/workspace/organizaciones/mi-ong/index.html` → no existe
   - Matchea el wildcard en `_redirects`:
     ```
     /workspace/organizaciones/*    /workspace/organizaciones/_    200
     ```
   - Sirve el HTML del placeholder `_`
4. **Hidratación cliente:** React arranca, `useParams()` lee el slug real `mi-ong` de la URL, la página renderiza con los datos correctos

## Archivos clave

- `next.config.ts` → `output: "export"`, `trailingSlash: true`, `images.unoptimized: true`
- `wrangler.toml` → `pages_build_output_dir = "frontend/out"`
- `frontend/public/_redirects` → redirects de raíz + wildcard para `[slug]`
- `frontend/src/app/workspace/organizaciones/[slug]/page.tsx` → server component con `generateStaticParams`
- `frontend/src/app/workspace/organizaciones/[slug]/client-page.tsx` → `'use client'` con la lógica original

## Verificación local

```bash
npm run build:cloudflare
ls frontend/out/workspace/organizaciones/_/index.html  # debe existir
```

## Si Cloudflare sigue fallando

1. Verifica en el dashboard que el build command es exactamente `npm run build:cloudflare` (sin `cd` manual, el script ya lo hace)
2. Verifica que "Deploy command" y "Non-production branch deploy command" están **ambos vacíos**
3. Revisa los logs del build en Cloudflare → "Functions" no debería aparecer (es static, no SSR)
4. Si ves "No packages" en los logs, el "Root directory" no está bien configurado
