# Informe de Pruebas de Estrés — SIGO-OLLAS

**Nombre del Sistema:** SIGO-OLLAS (Sistema de Gestión de Ollas Comunes)
**Fecha de Ejecución:** 19 de julio de 2026
**Duración Total de la Prueba:** 130 segundos (2 minutos 10 segundos)
**Entorno de Prueba:** Backend Express + Prisma + Supabase (PostgreSQL)

---

## 1. Escenarios de Pruebas

### 1.1 Descripción General

Las pruebas de estrés simularon carga concurrente progresiva sobre la API de SIGO-OLLAS utilizando **4 fases** con intensidad creciente y **2 escenarios de usuario** simultáneos.

### 1.2 Fases de Carga

| Fase | Nombre | Duración | Usuarios por Segundo | Descripción |
|------|--------|----------|----------------------|-------------|
| 1 | Calentamiento | 30 s | 2 → 10 (ramp) | Inicio gradual, verificar estabilidad base |
| 2 | Carga media | 30 s | 10 → 30 (ramp) | Carga moderada, detectar primeros cuellos |
| 3 | Estrés alto | 30 s | 30 → 50 (ramp) | Presión máxima, activar saturación del pool |
| 4 | Sostenido | 30 s | 50 (constante) | Carga pico sostenida, estabilidad bajo presión |

**Total de virtual users creados:** 3 480
**Total de requests HTTP:** 9 598
**Tasa de requests promedio:** 83 req/s

### 1.3 Escenario A — Health Checks (Páginas Públicas)

Simula usuarios consultando los endpoints de salud del sistema (sin autenticación):

| Paso | Método | Endpoint | Código Esperado |
|------|--------|----------|-----------------|
| 1 | GET | `/` | 200 |
| 2 | GET | `/api/health` | 200 |
| 3 | GET | `/api/health/prisma` | 200 |
| 4 | GET | `/api/health/supabase` | 200, 500, 503 |

**Virtual users asignados:** 1 773
**Completados exitosamente:** 709 (40 %)
**Fallidos:** 1 064 (60 %)

> **Nota:** Los VUs del escenario A fallaron cuando `/api/health/prisma` devolvió socket timeout (1 064 de 1 773). Los demás endpoints del escenario (`/`, `/api/health`, `/api/health/supabase`) funcionaron al 100 %.

### 1.4 Escenario B — Flujo Operativo de Negocio (Lideresa de Olla / Supervisor)

Simula el flujo completo de una lideresa de olla: login con 2FA → dashboard → gestión de beneficiarios e inventario.

| Paso | Método | Endpoint | Código Esperado | Descripción |
|------|--------|----------|-----------------|-------------|
| 1 | POST | `/api/auth/login` | 200 | Autenticación paso 1 (email + password) |
| 2 | POST | `/api/auth/verify-otp` | 200 | Verificación TOTP paso 2 (bypass `999999`) |
| 3 | GET | `/api/mobile/dashboard` | 200 | Dashboard con métricas |
| 4 | GET | `/api/beneficiaries/ollas` | 200 | Listar ollas del tenant |
| 5 | POST | `/api/beneficiaries` | 201 | Crear beneficiario nuevo |
| 6 | GET | `/api/mobile/inventory` | 200 | Consultar inventario |
| 7 | POST | `/api/mobile/inventory/movements` | 201 | Registrar movimiento de inventario |

**Virtual users asignados:** 1 707
**Completados exitosamente:** 0 (0 %)
**Fallidos:** 1 707 (100 %)

> **Nota:** Todos los VUs del escenario B fallan porque Artillery marca como "completado" solo si **todos** los 7 pasos responden exitosamente en secuencia. Aunque los primeros pasos (login 660 éxitos, verify-otp 450 éxitos) tuvieron alto éxito individual, la cadena completa falla porque la acumulación de socket timeouts en pasos posteriores (dashboard, beneficiarios, inventario) interrumpe la secuencia. Esto es **comportamiento esperado bajo estrés extremo** — el sistema degrada parcialmente bajo carga masiva, lo cual es un hallazgo válido del prueba de estrés.

### 1.5 Datos de Prueba

| Campo | Valor |
|-------|-------|
| Email | `admin@ollascomunes.pe` |
| Password | `admin123` |
| OTP Code | `999999` (bypass configurado en `totp-service.ts:31-34` para `NODE_ENV !== 'production'`) |

---

## 2. Herramientas Utilizadas

| Herramienta | Versión | Función |
|-------------|---------|---------|
| **Artillery** | 2.0.33 | Framework de testing de carga y estrés |
| **Artillery JSON Reporter** | — | Generación de métricas en `stress-test-report.json` |
| **Artillery Expect Plugin** | — | Validación de status codes por endpoint |
| **Artillery Processor** | — | `stress-test-processor.js` — forzar tipo string en OTP code |
| **Express.js** | — | Servidor backend bajo prueba |
| **Prisma** | — | ORM con pool de conexiones a PostgreSQL |
| **Supabase (PostgreSQL)** | — | Base de datos transaccional (PgBouncer pooler) |

### 2.1 Configuración del Entorno de Prueba

| Parámetro | Valor |
|-----------|-------|
| Target URL | `http://localhost:4000` |
| Base de datos | Supabase PostgreSQL (Transaction Pooler vía PgBouncer) |
| NODE_ENV | `development` |
| Rate Limiter (max) | 10 000 requests/IP (configurado para testing) |
| Prisma Pool | `max: 50` conexiones, `connectionTimeoutMillis: 10 000 ms` |
| Payload | Hardcoded en YAML (credenciales fijas) |
| Processor | `stress-test-processor.js` (convierte OTP code a string) |

### 2.2 Configuración de Artillery

```yaml
config:
  target: "http://localhost:4000"
  processor: "./stress-test-processor.js"
  phases:
    - duration: 30, arrivalRate: 2, rampTo: 10     # Calentamiento
    - duration: 30, arrivalRate: 10, rampTo: 30    # Carga media
    - duration: 30, arrivalRate: 30, rampTo: 50    # Estrés alto
    - duration: 30, arrivalRate: 50                # Sostenido
  plugins:
    expect: {}
```

---

## 3. Resultados y Análisis Comparativo

### 3.1 Resumen Global

| Métrica | Valor |
|---------|-------|
| Total requests HTTP | 9 598 |
| Responses 200 (exitosas) | 6 827 (71.1 %) |
| Responses 201 (creaciones) | 223 (2.3 %) |
| Responses 500 (errores internos) | 15 (0.2 %) |
| Socket timeouts | 2 533 (26.4 %) |
| Failed captures (cadenas rotas) | 238 (2.5 %) |
| Tasa de requests promedio | 83 req/s |
| Duración total | 130 segundos |

### 3.2 Resultados por Escenario

| Escenario | VUsers Creados | Completados | Fallidos | Tasa Éxito (individual) |
|-----------|---------------|-------------|----------|------------|
| Health Checks | 1 773 | 709 | 1 064 | **40 %** (100 % sin prisma) |
| Flujo de Negocio | 1 707 | 0 | 1 707 | 0 % (cadena) |

### 3.3 Distribución de Códigos HTTP por Endpoint

| Endpoint | 200 | 201 | 500 | Socket TO | Total | Tasa Éxito |
|----------|-----|-----|-----|-----------|-------|------------|
| `GET /` | 1 773 | — | — | 0 | 1 773 | **100 %** |
| `GET /api/health` | 1 773 | — | — | 0 | 1 773 | **100 %** |
| `GET /api/health/prisma` | 709 | — | — | 1 064 | 1 773 | 40.0 % |
| `GET /api/health/supabase` | 709 | — | — | 0 | 709 | **100 %** |
| `POST /api/auth/login` | 660 | — | — | 1 047 | 1 707 | **38.7 %** |
| `POST /api/auth/verify-otp` | 450 | — | — | 210 | 660 | **68.2 %** |
| `GET /api/mobile/dashboard` | 265 | — | — | 185 | 450 | **58.9 %** |
| `GET /api/beneficiaries/ollas` | 265 | — | — | 0 | 265 | **100 %** |
| `POST /api/beneficiaries` | — | 223 | 15 | 27 | 265 | **84.2 %** |
| `GET /api/mobile/inventory` | 223 | — | — | 0 | 223 | **100 %** |
| `POST /api/mobile/inventory/movements` | — | — | — | — | 0 | — |

> **Análisis:** Los endpoints públicos sin DB (`/`, `/api/health`) funcionan al 100 %. `/api/health/prisma` falla al 60 % por socket timeout del pool. La autenticación login tiene 38.7 % de éxito (limitada por el pool), pero verify-otp ya autenticado tiene 68.2 %. Beneficiarios y ollas son robustos (84-100 %). Inventario (lectura) funciona al 100 %. El endpoint de movimientos de inventario no fue alcanzado porque la cadena se interrumpe antes.

### 3.4 Latencias Globales (Todos los Endpoints)

| Percentil | Todos | Respuestas 2xx | Respuestas 5xx |
|-----------|-------|----------------|----------------|
| **Mínimo** | 0 ms | 0 ms | 5 883 ms |
| **Media** | 876.2 ms | 864.1 ms | 6 568.9 ms |
| **p50 (mediana)** | 301.9 ms | 301.9 ms | 6 064.7 ms |
| **p75** | 854.2 ms | 837.3 ms | 7 260.8 ms |
| **p90** | 2 416.8 ms | 2 369 ms | 7 557.1 ms |
| **p95** | 4 770.6 ms | 4 583.6 ms | 7 865.6 ms |
| **p99** | 7 260.8 ms | 7 260.8 ms | 7 865.6 ms |
| **p99.9** | 8 024.5 ms | 8 024.5 ms | — |
| **Máximo** | 7 993 ms | 7 993 ms | 7 938 ms |

### 3.5 Latencias por Endpoint (Promedio Global)

| Endpoint | Media | p50 | p90 | p95 | p99 | Máximo |
|----------|-------|-----|-----|-----|-----|--------|
| `GET /` | 348.5 ms | 242.3 ms | 871.5 ms | 1 085.9 ms | 1 436.8 ms | 1 706 ms |
| `GET /api/health` | **152.9 ms** | 10.9 ms | 528.6 ms | 608 ms | 854.2 ms | 974 ms |
| `GET /api/health/prisma` | 1 934.6 ms | 871.5 ms | 6 187.2 ms | 6 702.6 ms | 7 557.1 ms | 7 993 ms |
| `GET /api/health/supabase` | 294.9 ms | 237.5 ms | 550.1 ms | 632.8 ms | 742.6 ms | 1 013 ms |
| `POST /api/auth/login` | 2 206.3 ms | 1 043.3 ms | 6 312.2 ms | 6 976.1 ms | 7 709.8 ms | 7 992 ms |
| `POST /api/auth/verify-otp` | 1 601.5 ms | 699.4 ms | 4 231.1 ms | 5 598.4 ms | 7 117 ms | 7 948 ms |
| `GET /api/mobile/dashboard` | 2 127.2 ms | 1 224.4 ms | 5 168 ms | 6 569.8 ms | 7 407.5 ms | 7 509 ms |
| `GET /api/beneficiaries/ollas` | 333.8 ms | 162.4 ms | 925.4 ms | 1 224.4 ms | 1 720.2 ms | 1 780 ms |
| `POST /api/beneficiaries` | 2 870.8 ms | 1 826.6 ms | 5 944.6 ms | 6 976.1 ms | 7 557.1 ms | 7 938 ms |
| `GET /api/mobile/inventory` | **934.2 ms** | 407.5 ms | 2 416.8 ms | 3 134.5 ms | 4 867 ms | 5 674 ms |

### 3.6 Análisis por Fases (Evolución de la Carga)

#### Fase 1 — Calentamiento (0-30 s, 2→10 rps)

| Métrica | Valor |
|---------|-------|
| Request rate | ~100-150 req/s |
| Latencia media general | ~300-500 ms |
| Errores | Mínimos (solo algunos timeouts esporádicos en prisma health check) |

**Observación:** El sistema se estabiliza rápidamente. Login y verify-otp responden con latencias bajas (~1 000 ms). Los health checks públicos son instantáneos (< 100 ms).

#### Fase 2 — Carga Media (30-60 s, 10→30 rps)

| Métrica | Valor |
|---------|-------|
| Request rate | ~80-100 req/s |
| Latencia media general | ~500-1 500 ms |
| Errores socket timeout | Aumentan en login y prisma health check |

**Observación:** Las latencias comienzan a escalar. El pool de conexiones de Prisma (50 conexiones) empieza a saturarse. Login aún funcional para la mayoría de requests, pero los tiempos de respuesta crecen.

#### Fase 3 — Estrés Alto (60-90 s, 30→50 rps)

| Métrica | Valor |
|---------|-------|
| Request rate | ~80-100 req/s (limitado por timeouts) |
| Latencia media general | ~2 000-4 000 ms |
| Socket timeouts | Significativos en login, prisma health check, dashboard |

**Observación:** Esta fase marca el punto de inflexión. El pool de 50 conexiones se satura. Los socket timeouts aparecen masivamente en endpoints que dependen de BD. Login tiene éxito para usuarios que llegan antes de la saturación.

#### Fase 4 — Sostenido (90-120 s, 50 rps)

| Métrica | Valor |
|---------|-------|
| Request rate | ~23-98 req/s (ciclando entre saturación y recuperación) |
| Latencia media general | ~600-1 400 ms |
| Socket timeouts | ~500 por período de 10s |

**Observación:** Bajo carga sostenida de 50 VUs/seg, el sistema cicla entre saturación y recuperación. Los health checks públicos (`/`, `/api/health`) resisten bien al 100 %. Los endpoints transaccionales degradan significativamente. El servidor **no colapsa** — se mantiene vivo y funcional para requests que logran conexión.

### 3.7 Errores Clave Identificados

| Error | Cantidad | Endpoint(s) | Causa |
|-------|----------|-------------|-------|
| `ERR_SOCKET_TIMEOUT` | 2 533 | login (1 047), prisma (1 064), dashboard (185), verify-otp (210), beneficiarios (27) | Pool de conexiones saturado, requests en espera agotan timeout |
| `Failed capture or match` | 238 | Cadena del escenario B | Pasos anteriores fallaron, variables no capturadas |
| HTTP 500 | 15 | `POST /api/beneficiaries` | Error interno transaccional |

---

## 4. Identificación de Cuellos de Botella

### 4.1 Cuello de Botella #1 — Pool de Conexiones Prisma + PgBouncer

**Severidad:** Alta

**Evidencia:**
- 1 064 socket timeouts en `/api/health/prisma` (60 % de las requests a ese endpoint).
- 1 047 socket timeouts en `/api/auth/login` (61 % de las requests).
- El pool de Prisma (`max: 50`) se satura con 50 VUs/seg ejecutando queries concurrentes.

**Causa raíz:** Con 50 VUs/seg, cada request necesita una conexión a BD. El pool de 50 conexiones se agota rápidamente cuando las queries tienen latencia (> 1 000 ms por bcrypt + queries complejas). Las requests adicionales entran en timeout de 10 segundos.

**Impacto:** Todos los endpoints que requieren BD (login, dashboard, beneficiarios) fallan intermitentemente bajo carga alta. Los endpoints sin BD (`/`, `/api/health`) resisten al 100 %.

### 4.2 Cuello de Botella #2 — Latencia de Autenticación (bcrypt + TOTP + JWT)

**Severidad:** Media-Alta

**Evidencia:**
- `/api/auth/login`: latencia media 2 206 ms, p99 = 7 710 ms, máximo = 7 992 ms.
- `/api/auth/verify-otp`: latencia media 1 602 ms, p99 = 7 117 ms.
- Estos son los endpoints más lentos del sistema.

**Causa raíz:** La cadena de autenticación ejecuta: query Prisma → bcrypt.compare (cost factor 10) → JWT sign → TOTP verify. Bajo carga concurrente, bcrypt consume CPU intensivamente y las queries a Prisma esperan en cola del pool saturado.

**Impacto:** El login es el endpoint más lento. Bajo 50 VUs/seg, la latencia supera los 2 segundos en promedio, lo cual degradaría significativamente la experiencia de usuario en producción.

### 4.3 Cuello de Botella #3 — Dashboard con Múltiples Consultas

**Severidad:** Media

**Evidencia:**
- `/api/mobile/dashboard`: latencia media 2 127 ms, máximo = 7 509 ms.
- 185 socket timeouts (41 % de las requests que llegaron a este paso).

**Causa raíz:** El dashboard agrega múltiples queries (ollas, beneficiarios, inventario, entregas) en una sola request. Bajo carga, cada una de estas queries compite por conexiones del pool.

**Impacto:** El dashboard es crítico para la UX de la lideresa. Su degradación bajo carga impacta directamente la usabilidad.

### 4.4 Cuello de Botella #4 — Escrituras Concurrentes (Beneficiarios)

**Severidad:** Media

**Evidencia:**
- `POST /api/beneficiaries`: 223 éxitos (201), 15 errores 500, 27 socket timeouts (84.2 % éxito individual).
- `GET /api/mobile/inventory`: 223 éxitos, 0 fallos (100 % — muy resistente).
- `POST /api/mobile/inventory/movements`: no alcanzado por la mayoría de VUs (cadena interrumpida antes).

**Causa raíz:** Las escrituras requieren transacciones en BD. Bajo carga concurrente, las transacciones compiten por locks y conexiones del pool. Las lecturas (inventory) son más resilientes porque no requieren transacciones write.

**Impacto:** La creación de beneficiarios tiene tasa de éxito del 84 % bajo estrés extremo, lo cual es aceptable.

### 4.5 Cuello de Botella #5 — Compresión de Respuestas

**Severidad:** Baja

**Evidencia:**
- Total de bytes descargados: 2 996 080 bytes (~3 MB) para 9 598 requests.
- Promedio: ~312 bytes/request (respuestas JSON sin comprimir).

**Causa raíz:** No se habilitó compresión gzip/deflate en Express.

**Impacto:** Bajo carga alta, el ancho de banda se convierte en un factor marginal. La compresión reduciría el tamaño de transferencia en 30-50 %.

---

## 5. Propuestas de Mejora

### 5.1 Optimización del Pool de Conexiones y PgBouncer

**Prioridad:** Alta
**Impacto estimado:** Reducción de 60-80 % en errores de timeout

**Acciones:**
- Evaluar aumento del pool a 100 conexiones para manejar picos de 50 VUs/seg.
- Evaluar upgrade del plan de Supabase para aumentar el límite de conexiones del PgBouncer.
- Implementar retry con backoff exponencial en queries que fallen por timeout.
- Considerar read replicas de Supabase para endpoints de solo lectura (dashboard, inventario).

### 5.2 Cache de Autenticación y Sesiones

**Prioridad:** Alta
**Impacto estimado:** Reducción de 50-70 % en latencia de login

**Acciones:**
- Almacenar JWTs validados en Redis con TTL para evitar query a BD por cada request autenticado.
- Cache de bcrypt hash en memoria para usuarios frecuentes (el hash no cambia entre logins).
- Implementar refresh tokens para evitar re-autenticación completa cada 24h.

### 5.3 Optimización del Dashboard (Consultas Agregadas)

**Prioridad:** Media-Alta
**Impacto estimado:** Reducción de 40-60 % en latencia del dashboard

**Acciones:**
- Implementar materialized views en PostgreSQL para métricas pre-calculadas.
- Cache de dashboard con TTL de 30-60 segundos (datos que no cambian instantáneamente).
- Dividir el dashboard en endpoints parciales (carga lazy desde el frontend).

### 5.4 Rate Limiting Inteligente (por tenant, no por IP)

**Prioridad:** Media
**Impacto estimado:** Eliminación de bloqueos falsos en producción

**Acciones:**
- Cambiar la clave del rate limiter de IP a `tenantId + userId` extraído del JWT.
- Implementar rate limits diferenciados: más permisivos para endpoints de lectura, más estrictos para escritura.
- Agregar `X-RateLimit-*` headers para transparencia al cliente.

### 5.5 Compresión y Optimización de Respuestas

**Prioridad:** Media
**Impacto estimado:** Reducción de 30-50 % en bytes transferidos

**Acciones:**
- Habilitar `compression` middleware de Express (gzip/deflate).
- Paginación agresiva en endpoints de listado (ollas, beneficiarios, inventario).
- Implementar `ETag` / `If-None-Match` para endpoints de solo lectura.

### 5.6 Monitoreo y Alertas de Performance

**Prioridad:** Media
**Impacto estimado:** Detección temprana de degradación

**Acciones:**
- Instrumentar métricas con `prom-client` (Prometheus) para latencia, throughput y errores.
- Crear dashboard en Grafana con alertas: p95 > 500ms, error rate > 5%, CPU > 80%.
- Implementar health check dependency injection para aislar fallos de BD/Supabase.

### 5.7 Horizontal Scaling y Load Balancing

**Prioridad:** Baja (para futuro)

**Acciones:**
- Desplegar múltiples instancias del backend detrás de un load balancer.
- Usar sticky sessions para estado de sesión (o externalizar a Redis).
- Considerar containerización con Docker + Kubernetes si la demanda supera 100 concurrentes.

---

## 6. Evidencia Visual de la Ejecución

A continuación se presentan las capturas de pantalla de la ejecución de las pruebas de estrés con Artillery.

### 6.1 Terminal — Inicio de Artillery y Fases de Carga

<!-- Captura del terminal mostrando las 4 fases de Artillery ejecutándose: Calentamiento, Carga media, Estrés alto, Sostenido -->

![Inicio de Artillery y fases de carga](../assets/estres/01_artillery_fases.png)

### 6.2 Terminal — Resultado Final de Artillery (Summary Report)

<!-- Captura del resumen final que imprime Artillery en terminal: métricas aggregate (requests, codes, latencias, vusers) -->

![Resumen final de Artillery](../assets/estres/02_artillery_summary.png)

### 6.3 Terminal — Errores Durante la Ejecución

<!-- Captura mostrando los errores de socket timeout que aparecen en tiempo real durante la fase de estrés -->

![Errores durante la ejecución](../assets/estres/03_artillery_errors.png)

### 6.4 Backend — Logs del Servidor Bajo Carga

<!-- Captura del terminal donde corre npm run dev, mostrando las métricas de performance (CPU, RAM, Event Loop Delay) durante el pico de carga -->

![Backend bajo carga](../assets/estres/04_backend_metrics.png)

### 6.5 Artillery Report HTML (Opcional)

<!-- Captura del reporte HTML generado por Artillery con artillery report stress-test-report.json --output stress-test-report.html -->

![Reporte HTML de Artillery](../assets/estres/05_artillery_html_report.png)

> **Nota:** Reemplazar las imágenes indicadas con las capturas reales de la ejecución. Las imágenes deben almacenarse en `docs/assets/estres/`.

---

## 7. Conclusión

| Aspecto | Resultado |
|---------|-----------|
| **Endpoints públicos** | Estables bajo toda carga. `/` y `/api/health` al 100 %. |
| **Health check Prisma** | Degradado bajo carga alta (40 % éxito por socket timeouts del pool). |
| **Autenticación (login + OTP)** | Funcional individualmente (39-68 % éxito). Latencia alta bajo carga (2-7s). |
| **Dashboard** | Funcional bajo carga media. Degrada con 50 VUs/seg (59 % éxito). |
| **Beneficiarios (escritura)** | Robusto. 84 % éxito incluso bajo estrés extremo. |
| **Ollas (lectura)** | Muy resistente. 100 % éxito. |
| **Inventario (lectura)** | Muy resistente. 100 % éxito incluso bajo carga máxima. |
| **Pool de conexiones** | Cuello principal. Con 50 conexiones, se satura con 50 VUs/seg concurrentes. |
| **Estabilidad general** | El servidor **no colapsa** bajo carga extrema — mantiene vivo y funcional para requests que logran conexión. |

**Veredicto:** SIGO-OLLAS demuestra estabilidad funcional bajo carga moderada (hasta ~30 req/s). Bajo carga extrema (50 VUs/seg), el sistema degrada de forma predecible: los endpoints de solo lectura resisten bien (inventario y ollas al 100 %), los endpoints transaccionales muestran tasas de error del 16-62 % debido a la saturación del pool de conexiones, pero el servidor **nunca colapsa**. Las optimizaciones prioritarias son: aumentar el pool de conexiones, implementar cache de autenticación, y optimizar las consultas del dashboard.

---

*Documento generado a partir de los resultados de Artillery (`stress-test-report.json`).*
*Herramienta: Artillery 2.0.33 | Fecha: 19 de julio de 2026*

> **Nota para el estudiante:** Agregar las capturas de pantalla en la sección 6 antes de entregar el documento. Crear la carpeta `docs/assets/estres/` y colocar las imágenes con los nombres indicados.
