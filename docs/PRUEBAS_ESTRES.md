# Pruebas de Estrés — SIGO-OLLAS

## Objetivo

Verificar el comportamiento del backend bajo carga simulada, identificando:

- Tiempos de respuesta bajo presión
- Tasas de error en endpoints críticos
- Cuellos de botella en la base de datos (Prisma/Supabase)
- Comportamiento del rate limiter en auth

## Herramienta

[Artillery](https://www.artillery.io/) v2 — herramienta de pruebas de carga basada en Node.js.

## Escenarios

| # | Escenario | Endpoint | Auth | Tipo |
|---|---|---|---|---|
| 1 | Health raíz | `GET /` | No | Health check |
| 2 | API health | `GET /api/health` | No | Health check |
| 3 | Prisma health | `GET /api/health/prisma` | No | Health check BD |
| 4 | Supabase health | `GET /api/health/supabase` | No | Health check Supabase |
| 5 | Login inválido | `POST /api/auth/login` | No | Carga en auth |
| 6 | Registro inválido | `POST /api/auth/register` | No | Validación |
| 7 | Mixto | Health + login | No | Tráfico realista |

## Fases de carga

| Fase | Duración | Usuarios/seg | Descripción |
|---|---|---|---|
| 1 | 30s | 2 → 10 | Calentamiento |
| 2 | 30s | 10 → 30 | Carga media |
| 3 | 30s | 30 → 50 | Estrés alto |
| 4 | 30s | 50 | Sostenido |

**Duración total:** ~2 minutos

## Requisitos

- Node.js v18+
- Backend corriendo en `http://localhost:4000`
- Dependencias instaladas: `cd backend && npm install`

## Ejecución

### 1. Iniciar el backend

```bash
cd backend
npm run dev
```

### 2. Ejecutar pruebas de estrés

```bash
cd backend

# Pruebas + reporte (todo en uno)
npm run stress:run

# O por separado:
npm run stress:test       # Solo ejecuta pruebas
npm run stress:report     # Genera HTML desde JSON existente
```

### 3. Batch file (Windows)

Ejecutar `backend/stress-test.bat` con doble clic.

## Resultados

- **JSON:** `backend/stress-test-report.json`
- **HTML:** `backend/stress-test-report.html`

### Métricas evaluadas

| Métrica | Descripción |
|---|---|
| `http.codes.200` | Respuestas exitosas |
| `http.codes.401` | Login inválido (esperado) |
| `http.codes.400` | Datos inválidos (esperado) |
| `http.codes.500` | Errores internos (no esperado) |
| `http.request_rate` | Solicitudes por segundo |
| `http.response_time.min` | Tiempo mínimo de respuesta |
| `http.response_time.max` | Tiempo máximo de respuesta |
| `http.response_time.median` | Tiempo mediano de respuesta |
| `http.response_time.p95` | Percentil 95 de respuesta |
| `http.response_time.p99` | Percentil 99 de respuesta |
| `errors` | Errores de conexión/tiempo |

## Interpretación

- **p95 < 500ms** → rendimiento excelente
- **p95 500ms–2s** → rendimiento aceptable
- **p95 > 2s** → posible cuello de botella
- **Errores 0%** → sistema estable bajo carga
- **Errores > 1%** → revisar capacidad del servidor/BD

## Notas

- Los endpoints de auth tienen rate limiter (1000 req/min en dev, 5 en prod)
- Las health checks de Prisma y Supabase dependen de conectividad externa
- Para pruebas contra producción, ajustar target y usar credenciales válidas
