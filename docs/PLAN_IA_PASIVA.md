# Plan — Capa de IA pasiva (job + caché de recomendaciones)

> La IA corre **en segundo plano en el backend** y guarda sus resultados en una
> tabla de caché. La app y la calculadora **solo leen** lo precalculado: sin
> esperas, sin costo por uso, y con **degradación elegante** si la IA falla.
> El cálculo determinista de preparación NO depende de la IA (ver
> [PLAN_CALCULADORA_PREPARACION.md](PLAN_CALCULADORA_PREPARACION.md)).

---

## 1. Principio de diseño

```
Usuario/App ─────────────► lee caché (rápido, offline-friendly)
                               ▲
                               │ escribe (asíncrono)
Disparador (cron/evento) ──► Job IA (Gemini) ──► tabla recommendations
```

- La IA **nunca** está en el camino crítico de una petición del usuario.
- Si Gemini falla o no hay `GEMINI_API_KEY`: el job no escribe, la lectura
  devuelve lo último que haya (o vacío), y todo lo determinista sigue igual.

## 2. Tabla de caché: reutilizar `recommendations`

Ya existe (`model Recommendation`) y encaja: `tenantId`, `ollaId`,
`recommendationType`, `targetDate`, `relatedRecipeId`, `title`, `description`,
`generatedByType` (`ia`), `status` (`pending`/`approved`), `approvedBy/At`.

**Migración propuesta (pequeña):**
```sql
ALTER TABLE recommendations ADD COLUMN payload JSONB;        -- datos estructurados
ALTER TABLE recommendations ADD COLUMN expires_at TIMESTAMP; -- TTL del cacheo
-- Una recomendación vigente por (olla, tipo, fecha):
CREATE UNIQUE INDEX uq_reco_olla_tipo_fecha
  ON recommendations (olla_id, recommendation_type, target_date);
```
- `payload` (JSONB) guarda lo estructurado que consume la app; `title`/`description`
  quedan legibles para humanos.
- El índice único hace el job **idempotente** (upsert por olla/tipo/fecha).

## 3. Tipos de recomendación que genera el job

| `recommendationType` | Para qué | `payload` (ejemplo) |
|----------------------|----------|---------------------|
| `menu_sugerido` | Sugerencias de menú del día (hoy en `getSuggestions` en vivo) | `{ "platos": [ { "nombre", "puntaje", "ingredientes": [] } ] }` |
| `pronostico_demanda` | Estima cuántas personas vendrán (alimenta `personas` de la calculadora) | `{ "personas": 168, "basadoEn": "entregas 14 días" }` |
| `sustitucion` | Alternativas cuando un insumo está bajo/agotado | `{ "items": [ { "faltante": "Aceite", "alternativa": "..." } ] }` |

## 4. El job (función única, idempotente)

`backend/src/jobs/generar_recomendaciones.ts`

```
generarRecomendacionesPorOlla(tenantId, ollaId):
  1. Reúne contexto: inventario, demografía/salud del padrón, historial de entregas.
  2. Llama a Gemini (reutiliza el prompt de getSuggestions) → menú + sustitutos.
  3. Calcula el pronóstico de demanda (puede ser heurístico: promedio de raciones
     entregadas en los últimos 14 días; la IA solo lo ajusta/explica).
  4. UPSERT en recommendations por (ollaId, tipo, targetDate=hoy):
     status='pending', generatedByType='ia', expiresAt=fin del día.
  5. Si Gemini falla: registra el error y NO toca el caché (degradación elegante).

generarRecomendaciones():  // batch
  for cada olla activa de cada tenant → generarRecomendacionesPorOlla(...)
```

- **Idempotente**: re-ejecutar el mismo día actualiza, no duplica.
- **Batch por olla**: N llamadas controladas, no una por usuario.

## 5. Disparadores

### 5.1 Cron (primario)
Una vez al día (ej. **05:00 hora Perú**, antes de la operación).
- **Render Cron Job** (servicio aparte) que ejecuta `npm run job:recomendaciones`,
  o llama a un endpoint interno protegido. Recomendado en Render porque el web
  service del plan free **se duerme**; un Cron Job es independiente.
- Alternativa local/simple: `node-cron` dentro del proceso del API (solo sirve si
  el proceso está siempre activo).

### 5.2 Eventos (secundario, con *debounce*)
Recalcular cuando el contexto cambia de forma relevante:
- Tras `createMovement` (cambió el stock) → marcar la olla como "sucia".
- Tras crear/ejecutar un menú del día.
- Un *worker* procesa las ollas "sucias" cada X minutos (debounce) para no
  llamar a Gemini en cada movimiento.

> MVP recomendado: **solo cron diario**. Los eventos se agregan después si se
> necesita más frescura.

## 6. Camino de lectura (lo que cambia en los endpoints)

| Endpoint | Antes | Después |
|----------|-------|---------|
| `GET /mobile/suggestions` | Llama a Gemini en vivo | Lee `recommendations` tipo `menu_sugerido` (rápido). Fallback al cálculo si no hay caché. |
| `POST /mobile/preparacion/calcular` | `personas` = conteo del padrón | Si no envían `personas`, usa `pronostico_demanda` cacheado; si no existe, cae al conteo del padrón. |
| (futuro) respuesta de la calculadora | — | Adjunta `sustitucion` cacheada para los insumos faltantes, si existe. |

El contrato público no cambia de forma incompatible: solo se enriquece y se
vuelve más rápido.

## 7. Degradación elegante (reglas)

- Sin `GEMINI_API_KEY` → el job no corre / no escribe; las lecturas devuelven
  caché previo o vacío. (Ya existe un fallback informativo en `getSuggestions`.)
- Caché vencido (`expires_at` pasado) → se trata como inexistente.
- La calculadora determinista **siempre** funciona, haya o no recomendaciones.

## 8. Costos, límites y concurrencia

- Llamadas a Gemini = (N ollas activas) × (1 por día). Controlado y predecible.
- Procesar ollas en serie o en lotes pequeños para respetar *rate limits*.
- Evitar ejecuciones solapadas: lock simple (fila de control o bandera por olla)
  o confiar en la idempotencia del upsert.

## 9. Seguridad

- Si el cron dispara vía HTTP, usar un endpoint **interno**
  (`POST /internal/jobs/recomendaciones`) protegido por un secreto
  (`JOB_SECRET` en cabecera), nunca expuesto al público ni a la app.
- El job corre con acceso de servidor (clave secreta de Supabase), no con JWT de
  usuario.

## 10. Plan de implementación

1. **Migración**: `payload JSONB`, `expires_at`, índice único (Prisma migrate).
2. **Servicio de contexto**: extraer a funciones el armado de inventario/padrón/
   historial (parte ya está en `mobile/repository.ts`).
3. **`jobs/generar_recomendaciones.ts`**: lógica del job + upsert idempotente.
4. **Script**: `npm run job:recomendaciones` (CLI) para el cron de Render.
5. **Endpoint interno** (opcional) `POST /internal/jobs/recomendaciones` con `JOB_SECRET`.
6. **Lecturas**: refactor de `getSuggestions` para leer caché; `calcularPreparacion`
   usa `pronostico_demanda` cacheado como fuente de `personas`.
7. **Tests**: del armado de payload y del pronóstico heurístico (funciones puras);
   del upsert idempotente.
8. **Configurar el Cron Job en Render** (05:00 America/Lima).
