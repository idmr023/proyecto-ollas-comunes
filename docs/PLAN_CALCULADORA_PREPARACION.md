# Plan / Contrato — Calculadora de preparación (endpoint determinista)

> Endpoint **determinista** (sin IA) que calcula cuántos ingredientes se necesitan
> para atender a N personas según una receta, y los compara contra el stock actual
> de la olla. La IA queda **fuera** de este endpoint (ver [análisis de IA pasiva]).
> Solo **simula**: NO descuenta inventario (eso lo hace `POST /mobile/menu-plans/execute`).

---

## 1. Objetivo

Dado una receta y un número de personas, responder:
- Cuánto se necesita de cada ingrediente.
- Cuánto hay en stock y cuánto falta.
- Si alcanza para todos, y para cuántas raciones alcanza el stock actual.

Reutiliza la lógica de escalado que ya existe en
`backend/src/modules/mobile/repository.ts` (`getDailySummary`):
`consumoPorRacion = cantidadReceta / racionesEstimadas`.

## 2. Ubicación (backend Express, módulo `mobile`)

```
backend/src/modules/mobile/
├── router.ts        → + GET /recipes  + POST /preparacion/calcular
├── service.ts       → + getRecipes()  + calcularPreparacion()
├── repository.ts    → + listRecipes() + getRecipeWithIngredients()
│                       + getStockMap() + countActiveBeneficiaries()
└── preparacion.ts   → (nuevo) función pura de cálculo, sin acceso a BD
```

La **función de cálculo** (`calcularRequerimientos`) vive aislada en `preparacion.ts`,
recibe datos ya cargados y no toca la BD → fácil de testear unitariamente.

## 3. Endpoints

### 3.1 `GET /api/mobile/recipes` (auxiliar para el selector)

Lista las recetas activas del tenant para que la app ofrezca un selector.

**Respuesta 200**
```json
{
  "ok": true,
  "items": [
    { "id": "uuid", "nombre": "Lentejas con arroz", "racionesEstimadas": 50, "totalIngredientes": 4 }
  ]
}
```

### 3.2 `POST /api/mobile/preparacion/calcular` (la calculadora)

**Request**
```json
{ "recipeId": "uuid", "personas": 180 }
```

| Campo | Tipo | Obligatorio | Regla |
|-------|------|-------------|-------|
| `recipeId` | string (uuid) | sí | Debe pertenecer al tenant |
| `personas` | entero > 0 | no | Si se omite, se usa el N° de beneficiarios activos de la olla |

**Respuesta 200**
```json
{
  "ok": true,
  "olla": { "id": "uuid", "name": "Olla Común Los Olivos" },
  "receta": { "id": "uuid", "nombre": "Lentejas con arroz", "racionesEstimadas": 50 },
  "personas": 180,
  "fuentePersonas": "manual",
  "racionesPosiblesConStock": 120,
  "alcanzaParaTodos": false,
  "ingredientes": [
    {
      "supplyItemId": "uuid",
      "nombre": "Lentejas",
      "unidad": "kg",
      "consumoPorRacion": 0.08,
      "necesario": 14.4,
      "stockActual": 18,
      "faltante": 0,
      "alcanza": true
    },
    {
      "supplyItemId": "uuid",
      "nombre": "Aceite vegetal",
      "unidad": "L",
      "consumoPorRacion": 0.02,
      "necesario": 3.6,
      "stockActual": 2,
      "faltante": 1.6,
      "alcanza": false
    }
  ],
  "resumen": { "totalIngredientes": 4, "ingredientesFaltantes": 1 }
}
```

- `fuentePersonas`: `"manual"` (vino en el body) o `"padron"` (se usó el conteo de beneficiarios).
- Todos los números se redondean a **2 decimales**.

## 4. Lógica de cálculo (función pura)

```ts
// Entrada: receta {racionesEstimadas, ingredientes:[{supplyItemId,nombre,unidad,quantity}]},
//          stockPorItem: Map<supplyItemId, number>, personas: number
// Salida: { ingredientes[], racionesPosiblesConStock, alcanzaParaTodos }

const base = Math.max(1, receta.racionesEstimadas)        // defensivo
let racionesPosibles = Infinity

const ingredientes = receta.ingredientes.map((ing) => {
  const consumoPorRacion = ing.quantity / base
  const necesario   = redondear2(consumoPorRacion * personas)
  const stockActual = stockPorItem.get(ing.supplyItemId) ?? 0
  const faltante    = redondear2(Math.max(0, necesario - stockActual))
  if (consumoPorRacion > 0) {
    racionesPosibles = Math.min(racionesPosibles, Math.floor(stockActual / consumoPorRacion))
  }
  return { ...ing, consumoPorRacion, necesario, stockActual, faltante, alcanza: stockActual >= necesario }
})

return {
  ingredientes,
  racionesPosiblesConStock: Number.isFinite(racionesPosibles) ? Math.max(0, racionesPosibles) : 0,
  alcanzaParaTodos: ingredientes.every((i) => i.alcanza),
}
```

## 5. Validación y casos borde

| Caso | Respuesta |
|------|-----------|
| `recipeId` ausente o no uuid | 400 (Zod) |
| `personas` presente y ≤ 0 o no entero | 400 |
| La olla del tenant no existe | 404 "No hay una olla activa para tu organización." |
| Receta no existe o no es del tenant | 404 "Receta no encontrada." |
| Receta sin ingredientes | 422 "La receta no tiene ingredientes para calcular." |
| `racionesEstimadas` ≤ 0 | se trata como 1 (defensivo) |
| Sin stock de un ingrediente | `stockActual: 0`, `faltante = necesario` |

- Autenticación: requiere `Authorization: Bearer <jwt>` (igual que el resto de `/mobile`).
- Validación con **Zod** (consistente con el módulo `auth` y el plan de API escalable).

## 6. Punto de enganche con la IA pasiva (futuro, opcional)

El endpoint se mantiene determinista. Más adelante, la respuesta puede **leer** (no calcular)
enriquecimientos ya cacheados por el job de IA, p. ej.:
```json
"sugerencias": { "sustitutos": [ { "faltante": "Aceite vegetal", "alternativa": "..." } ] }
```
Si no hay caché, el campo se omite y el cálculo no se ve afectado (degradación elegante).

## 7. Pruebas (Vitest, módulo backend)

Función pura `calcularRequerimientos`:
1. Stock suficiente en todos → `faltante=0`, `alcanzaParaTodos=true`.
2. Un ingrediente insuficiente → su `faltante>0`, `alcanzaParaTodos=false`, `racionesPosiblesConStock` correcto.
3. Ingrediente sin stock → `stockActual=0`, `faltante=necesario`.
4. `racionesEstimadas=0` → no divide por cero (usa 1).

Servicio `calcularPreparacion`:
5. `personas` omitido → usa conteo del padrón, `fuentePersonas="padron"`.
6. Receta sin ingredientes → 422.

## 8. Orden de implementación

1. `preparacion.ts` (función pura) + sus tests unitarios.
2. `repository.ts`: `getRecipeWithIngredients`, `getStockMap`, `countActiveBeneficiaries`, `listRecipes`.
3. `service.ts`: `calcularPreparacion`, `getRecipes` (con validación Zod).
4. `router.ts`: las dos rutas.
5. (App) feature `calculadora` que consume el contrato — fase aparte.
