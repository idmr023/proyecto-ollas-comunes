# Informe de Pruebas de Estrés — Producción — SIGO-OLLAS

**Nombre del Sistema:** SIGO-OLLAS (Sistema de Gestión de Ollas Comunes)
**Fecha de Ejecución:** 19 de julio de 2026
**Duración Total de la Prueba:** 130 segundos (2 minutos 10 segundos)
**Entorno de Prueba:** Producción — Render (free/starter tier) + Supabase PostgreSQL (Transaction Pooler vía PgBouncer)

---

## 1. Escenarios de Pruebas

### 1.1 Descripción General

Las pruebas de estrés simularon carga concurrente progresiva sobre la API de SIGO-OLLAS en **entorno de producción** utilizando **4 fases** con intensidad creciente y **2 escenarios de usuario** simultáneos. El objetivo fue validar el comportamiento del sistema bajo carga real en la infraestructura desplegada (Render + Supabase).

### 1.2 Fases de Carga

| Fase | Nombre | Duración | Usuarios por Segundo | Descripción |
|------|--------|----------|----------------------|-------------|
| 1 | Calentamiento | 30 s | 2 → 10 (ramp) | Inicio gradual, verificar estabilidad base |
| 2 | Carga media | 30 s | 10 → 30 (ramp) | Carga moderada, detectar primeros cuellos |
| 3 | Estrés alto | 30 s | 30 → 50 (ramp) | Presión máxima, activar saturación |
| 4 | Sostenido | 30 s | 50 (constante) | Carga pico sostenida, estabilidad bajo presión |

**Total de virtual users creados:** 3 480
**Total de requests HTTP:** 7 767
**Tasa de requests promedio:** 75 req/s

### 1.3 Escenario A — Health Checks (Páginas Públicas)

Simula usuarios consultando los endpoints de salud del sistema (sin autenticación):

| Paso | Método | Endpoint | Código Esperado |
|------|--------|----------|-----------------|
| 1 | GET | `/` | 200 |
| 2 | GET | `/api/health` | 200 |
| 3 | GET | `/api/health/prisma` | 200 |
| 4 | GET | `/api/health/supabase` | 200, 500, 503 |

**Virtual users asignados:** 1 732
**Completados exitosamente:** 1 161 (67 %)
**Fallidos:** 571 (33 %)

> **Nota:** Los VUs del escenario A fallaron cuando algún endpoint de la cadena devolvió socket timeout (571 de 1 732). A diferencia del entorno de desarrollo donde `/api/health/prisma` era el único punto de fallo (60 % timeout), en producción los timeouts se distribuyen uniformemente (~10 % por cada paso de la cadena), lo que indica que el cuello de botella no es Prisma específicamente sino los recursos limitados del tier gratuito de Render.

### 1.4 Escenario B — Flujo Operativo de Negocio (Lideresa de Olla / Supervisor)

Simula el flujo completo de una lideresa de olla: login con 2FA → dashboard → gestión de beneficiarios e inventario.

| Paso | Método | Endpoint | Código Esperado | Descripción |
|------|--------|----------|-----------------|-------------|
| 1 | POST | `/api/auth/login` | 200 | Autenticación paso 1 (email + password) |
| 2 | POST | `/api/auth/verify-otp` | 200 | Verificación TOTP paso 2 (código de prueba `999999`) |
| 3 | GET | `/api/mobile/dashboard` | 200 | Dashboard con métricas |
| 4 | GET | `/api/beneficiaries/ollas` | 200 | Listar ollas del tenant |
| 5 | POST | `/api/beneficiaries` | 201 | Crear beneficiario nuevo |
| 6 | GET | `/api/mobile/inventory` | 200 | Consultar inventario |
| 7 | POST | `/api/mobile/inventory/movements` | 201 | Registrar movimiento de inventario |

**Virtual users asignados:** 1 748
**Completados exitosamente:** 0 (0 %)
**Fallidos:** 1 748 (100 %)

> **Nota:** Todos los VUs del escenario B fallan por dos razones principales: (1) El rate limiter configurado por defecto en Render bloquea el 97 % de los intentos de login (1 553 de 1 748 reciben HTTP 429), y (2) el código OTP de prueba `999999` NO funciona en producción porque el bypass solo está habilitado cuando `NODE_ENV !== 'production'`, por lo que los 6 VUs que logran pasar el login reciben HTTP 401 al verificar OTP. Los 24 VUs restantes que pasan login son bloqueados por el rate limiter en el endpoint verify-otp (HTTP 429). Ningún VU alcanza el dashboard u otros endpoints. Esto es **comportamiento esperado** — la prueba de estrés en producción revela que el rate limiter por IP es el cuello de botella crítico que impide el uso concurrente legítimo del sistema.

### 1.5 Datos de Prueba

| Campo | Valor |
|-------|-------|
| Email | `admin@ollascomunes.pe` |
| Password | `admin123` |
| OTP Code | `999999` — **NO funciona en producción** (el bypass solo está habilitado cuando `NODE_ENV !== 'production'`, ver `totp-service.ts:31-34`) |

---

## 2. Herramientas Utilizadas

| Herramienta | Versión | Función |
|-------------|---------|---------|
| **Artillery** | 2.0.33 | Framework de testing de carga y estrés |
| **Artillery JSON Reporter** | — | Generación de métricas en `stress-test-report.json` |
| **Artillery Expect Plugin** | — | Validación de status codes por endpoint |
| **Artillery Processor** | — | `stress-test-processor.js` — forzar tipo string en OTP code |
| **Express.js** | — | Servidor backend bajo prueba (producción) |
| **Prisma** | — | ORM con pool de conexiones a PostgreSQL |
| **Supabase (PostgreSQL)** | — | Base de datos transaccional (PgBouncer pooler) |
| **Render** | — | Plataforma de hosting (free/starter tier) |

### 2.1 Configuración del Entorno de Prueba

| Parámetro | Valor |
|-----------|-------|
| Target URL | `https://proyecto-ollas-comunes.onrender.com` |
| Base de datos | Supabase PostgreSQL (Transaction Pooler vía PgBouncer) |
| NODE_ENV | `production` |
| Rate Limiter | Configuración por defecto (~100 requests/15 min por IP) |
| Prisma Pool | Configuración de Render (pool de conexiones vía PgBouncer) |
| OTP Bypass | **Deshabilitado** (`NODE_ENV === 'production'`) |
| Payload | Hardcoded en YAML (credenciales fijas) |
| Processor | `stress-test-processor.js` (convierte OTP code a string) |

### 2.2 Configuración de Artillery

```yaml
config:
  target: "https://proyecto-ollas-comunes.onrender.com"
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
| Total requests HTTP | 7 767 |
| Responses 200 (exitosas) | 5 448 (70.1 %) |
| Responses 429 (rate limited) | 1 577 (20.3 %) |
| Responses 401 (no autenticado) | 6 (0.1 %) |
| Socket timeouts (sin response) | 736 (9.5 %) |
| Failed captures (cadenas rotas) | 1 583 (20.4 %) |
| Tasa de requests promedio | 75 req/s |
| Duración total | 130 segundos |

> **Nota:** Las "failed captures" (1 583) corresponden exactamente a las requests que recibieron 429 o 401 y no pudieron capturar variables (tokens JWT/tempToken) para los pasos siguientes de la cadena.

### 3.2 Resultados por Escenario

| Escenario | VUsers Creados | Completados | Fallidos | Tasa Éxito (individual) |
|-----------|---------------|-------------|----------|------------|
| Health Checks | 1 732 | 1 161 | 571 | **67 %** (90 % por endpoint) |
| Flujo de Negocio | 1 748 | 0 | 1 748 | 0 % (cadena) |

### 3.3 Distribución de Códigos HTTP por Endpoint

| Endpoint | 200 | 429 | 401 | Socket TO | Total | Tasa Éxito |
|----------|-----|-----|-----|-----------|-------|------------|
| `GET /` | 1 562 | — | — | 170 | 1 732 | **90.2 %** |
| `GET /api/health` | 1 399 | — | — | 163 | 1 562 | **89.6 %** |
| `GET /api/health/prisma` | 1 296 | — | — | 103 | 1 399 | **92.6 %** |
| `GET /api/health/supabase` | 1 161 | — | — | 135 | 1 296 | **89.6 %** |
| `POST /api/auth/login` | 30 | 1 553 | — | 165 | 1 748 | **1.7 %** |
| `POST /api/auth/verify-otp` | — | 24 | 6 | — | 30 | **0 %** |

> **Análisis:** Los endpoints públicos sin DB (`/`, `/api/health`) alcanzan ~90 % de éxito individual, con timeouts distribuidos uniformemente (~10 % por endpoint). Los health checks dependientes de Prisma y Supabase son significativamente más estables en producción (89-93 %) que en desarrollo (40 %), porque la conexión a Supabase vía PgBouncer pooler es más eficiente que el pool local de Prisma. Sin embargo, el endpoint de login tiene solo 1.7 % de éxito porque el rate limiter por IP bloquea el 97 % de las requests (1 553 de 1 748). El verify-otp no registra éxitos porque el código de prueba `999999` es rechazado en producción (NODE_ENV=production) y los VUs restantes reciben 429.

### 3.4 Latencias Globales (Todos los Endpoints)

| Percentil | Todos | Respuestas 2xx |
|-----------|-------|----------------|
| **Mínimo** | 140 ms | 140 ms |
| **Media** | 1 864.6 ms | 1 943.2 ms |
| **p50 (mediana)** | 699.4 ms | 907 ms |
| **p75** | 3 395.5 ms | 3 464.1 ms |
| **p90** | 4 770.6 ms | 4 867 ms |
| **p95** | 5 711.5 ms | 5 711.5 ms |
| **p99** | 6 569.8 ms | 6 702.6 ms |
| **p99.9** | 7 865.6 ms | — |
| **Máximo** | 8 011 ms | 8 011 ms |

> **Nota:** No hubo respuestas 5xx en producción. La latencia media general (1 864.6 ms) es significativamente más alta que en desarrollo (876.2 ms), lo cual es esperado dado que Render free/starter tier tiene recursos de CPU y memoria limitados comparados con un entorno local.

### 3.5 Latencias por Endpoint (Promedio Global)

| Endpoint | Media | p50 | p90 | p95 | p99 | Máximo |
|----------|-------|-----|-----|-----|-----|--------|
| `GET /` | 1 602.6 ms | 314.2 ms | 4 403.8 ms | 5 487.5 ms | 6 439.7 ms | 7 740 ms |
| `GET /api/health` | **1 943.5 ms** | 1 002.4 ms | 4 770.6 ms | 5 598.4 ms | 6 702.6 ms | 7 897 ms |
| `GET /api/health/prisma` | 2 110.7 ms | 1 587.9 ms | 5 065.6 ms | 5 711.5 ms | 6 702.6 ms | 8 011 ms |
| `GET /api/health/supabase` | 2 197 ms | 1 495.5 ms | 4 965.3 ms | 5 944.6 ms | 6 569.8 ms | 7 795 ms |
| `POST /api/auth/login` | 1 609 ms | 320.6 ms | 4 403.8 ms | 5 487.5 ms | 6 439.7 ms | 7 870 ms |
| `POST /api/auth/verify-otp` | 1 822.4 ms | 699.4 ms | 3 905.8 ms | 4 316.6 ms | 6 187.2 ms | 6 197 ms |

> **Análisis comparativo con desarrollo:** Las latencias en producción son uniformemente más altas que en desarrollo. En desarrollo, los endpoints sin DB (`/`, `/api/health`) respondían en < 100 ms; en producción, su p50 supera los 300-1 000 ms. Esto se debe a la latencia de red adicional (cliente → Render → Supabase), los cold starts de Render free tier, y los recursos de CPU limitados. El endpoint más rápido sigue siendo `GET /` (p50 = 314 ms), mientras que los health checks dependientes de DB (`prisma`, `supabase`) tienen las latencias más altas (p50 > 1 400 ms).

### 3.6 Análisis por Fases (Evolución de la Carga)

#### Fase 1 — Calentamiento (0-30 s, 2→10 rps)

| Métrica | Valor |
|---------|-------|
| Request rate promedio | ~14 req/s |
| Latencia media general | ~372 ms |
| Errores | Mínimos (algunos 429 esporádicos en login) |

**Observación:** El sistema responde con latencias bajas durante el calentamiento. Los endpoints públicos (`/`, `/api/health`) responden rápidamente. Los primeros intentos de login son aceptados por el rate limiter porque la ventana de 15 minutos aún está vacía.

#### Fase 2 — Carga Media (30-60 s, 10→30 rps)

| Métrica | Valor |
|---------|-------|
| Request rate promedio | ~41 req/s |
| Latencia media general | ~255 ms |
| Errores 429 | Aumentan progresivamente en login |

**Observación:** El rate limiter comienza a activarse. Los intentos de login acumulados desde la fase anterior agotan la ventana de rate limiting. Los health checks continúan funcionando con alta tasa de éxito. Las latencias se mantienen bajas para endpoints que no están rate-limitados.

#### Fase 3 — Estrés Alto (60-90 s, 30→50 rps)

| Métrica | Valor |
|---------|-------|
| Request rate promedio | ~79 req/s |
| Latencia media general | ~1 175 ms |
| Errores 429 | Dominantes en login |
| Socket timeouts | Comienzan a aparecer |

**Observación:** Esta fase marca el punto de inflexión. La mayoría de intentos de login son bloqueados por el rate limiter. Las latencias escalan significativamente a medida que Render intenta manejar la carga concurrente con recursos limitados. Los socket timeouts comienzan a aparecer en endpoints de health check.

#### Fase 4 — Sostenido (90-130 s, 50 rps)

| Métrica | Valor |
|---------|-------|
| Request rate promedio | ~107 req/s |
| Latencia media general | ~2 551 ms |
| Errores 429 | Sostenidos en login |
| Socket timeouts | Pico de 523 en el último período |

**Observación:** Bajo carga sostenida de 50 VUs/seg, el sistema opera en un equilibrio inestable. El rate limiter bloquea la mayoría de requests de login, lo que paradójicamente reduce la presión sobre la base de datos. Sin embargo, las latencias de los endpoints de health check escalan a > 2 000 ms. En el último período (period 12), se observa un pico de 523 socket timeouts, lo que indica que los recursos de Render están temporalmente saturados. El sistema **no colapsa** — los health checks públicos continúan respondiendo, aunque con latencias elevadas.

### 3.7 Errores Clave Identificados

| Error | Cantidad | Endpoint(s) | Causa |
|-------|----------|-------------|-------|
| HTTP 429 (Too Many Requests) | 1 577 | login (1 553), verify-otp (24) | Rate limiter por IP bloquea el 97 % de intentos de login |
| `ERR_SOCKET_TIMEOUT` | 736 | / (170), health (163), prisma (103), supabase (135), login (165) | Recursos limitados de Render free tier, cold starts |
| HTTP 401 (Unauthorized) | 6 | verify-otp (6) | Código OTP `999999` rechazado en producción (NODE_ENV=production) |
| `Failed capture or match` | 1 583 | Cadena del escenario B | Responses 429/401 no contienen tokens para capturar |

---

## 4. Identificación de Cuellos de Botella

### 4.1 Cuello de Botella #1 — Rate Limiter por IP en Login

**Severidad:** Crítica

**Evidencia:**
- 1 553 respuestas HTTP 429 en `/api/auth/login` (97 % de las requests a ese endpoint).
- 24 respuestas HTTP 429 en `/api/auth/verify-otp`.
- Solo 30 de 1 748 VUs logran pasar el login (1.7 % de éxito).

**Causa raíz:** El rate limiter está configurado con los valores por defecto de Express Rate Limit (~100 requests cada 15 minutos por IP). Como todas las requests de prueba provienen de la misma IP del cliente Artillery, el rate limiter aplica el límite acumulativamente a todos los VUs. Después de los primeros ~100 requests exitosos de login, todas las requests restantes reciben 429.

**Impacto:** Este es el cuello de botella **más crítico** en producción. Hace que el sistema sea inutilizable bajo carga concurrente desde una misma IP, lo cual bloquea escenarios de uso real donde múltiples usuarios comparten la misma red (ejemplo: una institución con IP pública compartida).

### 4.2 Cuello de Botella #2 — Recursos Limitados de Render (Free/Starter Tier)

**Severidad:** Alta

**Evidencia:**
- 736 socket timeouts distribuidos uniformemente across todos los endpoints (~10 % por endpoint).
- Latencias p90 > 4 500 ms para todos los endpoints (vs < 2 500 ms en desarrollo).
- Cold starts observables en los primeros 30 segundos de la prueba.

**Causa raíz:** Render free/starter tier proporciona recursos de CPU y memoria muy limitados. Bajo carga concurrente, el servidor no puede manejar todas las conexiones simultáneas, lo que resulta en timeouts distribuidos. A diferencia de desarrollo donde el pool de Prisma era el cuello de botella específico, en producción el bottleneck es la capacidad general del servidor.

**Impacto:** Todos los endpoints experimentan degradación. Los endpoints de health check, que en desarrollo funcionaban al 100 % sin DB, ahora tienen ~10 % de timeout cada uno. La experiencia de usuario bajo carga real sería lenta y poco confiable.

### 4.3 Cuello de Botella #3 — Latencia de Red y Cold Starts

**Severidad:** Media-Alta

**Evidencia:**
- Latencia mínima de 140 ms (vs 0 ms en desarrollo local).
- p50 de `/api/health` = 1 002.4 ms (vs 10.9 ms en desarrollo).
- El endpoint más rápido (`GET /`) tiene p50 = 314.2 ms (vs 242.3 ms en desarrollo).

**Causa raíz:** La cadena completa de requests en producción es: Cliente → Render → Supabase (vía internet). Cada salto agrega latencia de red. Render free tier additionally experimenta cold starts cuando el servicio ha estado inactivo, lo que puede agregar varios segundos de latencia al primer request.

**Impacto:** Incluso bajo carga cero, cada request tiene una latencia base de ~140-314 ms solo por la red. Esto se multiplica bajo carga concurrente cuando el servidor de Render compite por recursos.

### 4.4 Cuello de Botella #4 — OTP Bypass Inhabilitado en Producción

**Severidad:** Baja (limitación de testing, no un bug de producción)

**Evidencia:**
- 6 respuestas HTTP 401 en `/api/auth/verify-otp` (código `999999` rechazado).
- 0 VUs completan el flujo de autenticación completo.

**Causa raíz:** El bypass de OTP (`999999`) solo está habilitado cuando `NODE_ENV !== 'production'` (ver `totp-service.ts:31-34`). En producción, el código es validado contra el TOTP real, por lo que `999999` siempre falla.

**Impacto:** Esto no es un bug de producción — es una limitación del diseño de la prueba. El bypass de OTP es correcto y seguro. Para pruebas de estrés del flujo completo en producción, se necesita crear credenciales de prueba con TOTP real o implementar un mecanismo de test seguro que no comprometa la seguridad.

### 4.5 Cuello de Botella #5 — Compresión de Respuestas

**Severidad:** Baja

**Evidencia:**
- Las respuestas JSON se transfieren sin comprimir, lo que incrementa el tiempo de transferencia bajo carga alta.

**Causa raíz:** No se habilitó compresión gzip/deflate en Express para el entorno de producción.

**Impacto:** Bajo carga alta, el ancho de banda se convierte en un factor marginal. La compresión reduciría el tamaño de transferencia en 30-50 % y podría mejorar las latencias percibidas por el cliente.

---

## 5. Propuestas de Mejora

### 5.1 Rate Limiting Inteligente (por Tenant, no por IP) — CRITICO

**Prioridad:** Crítica
**Impacto estimado:** Eliminación del 97 % de errores 429 en login

**Acciones:**
- Cambiar la clave del rate limiter de IP a `tenantId + userId` extraído del JWT para endpoints autenticados.
- Para endpoints públicos (login, health checks), implementar rate limiting por tenant o por credenciales, no por IP.
- Implementar rate limits diferenciados: más permisivos para endpoints de lectura, más estrictos para escritura.
- Agregar `X-RateLimit-*` headers para transparencia al cliente.
- Considerar un rate limiter distribuido (Redis) si se escalan a múltiples instancias.

### 5.2 Warm-up y Keep-Alive para Render

**Prioridad:** Alta
**Impacto estimado:** Reducción de cold starts y timeouts distribuidos

**Acciones:**
- Configurar un health check externo (ej: UptimeRobot, cron job) que haga ping a `/api/health` cada 5 minutos para mantener el servicio activo en Render free tier.
- Implementar un endpoint de warm-up que pre-cargue las conexiones a Prisma y Supabase al iniciar el servidor.
- Evaluar upgrade del plan de Render a Starter o Standard para eliminar las limitaciones de recursos.

### 5.3 Optimización del Pool de Conexiones y PgBouncer

**Prioridad:** Alta
**Impacto estimado:** Reducción de socket timeouts en endpoints dependientes de BD

**Acciones:**
- Evaluar el tamaño actual del pool de conexiones de Prisma en Render y ajustarlo según la disponibilidad del plan.
- Implementar retry con backoff exponencial en queries que fallen por timeout.
- Considerar read replicas de Supabase para endpoints de solo lectura (dashboard, inventario).
- Monitorear métricas de PgBouncer para detectar saturación del pool.

### 5.4 Cache de Autenticación y Sesiones

**Prioridad:** Media-Alta
**Impacto estimado:** Reducción de 50-70 % en latencia de login

**Acciones:**
- Almacenar JWTs validados en Redis con TTL para evitar query a BD por cada request autenticado.
- Cache de bcrypt hash en memoria para usuarios frecuentes (el hash no cambia entre logins).
- Implementar refresh tokens para evitar re-autenticación completa cada 24h.

### 5.5 Upgrade del Plan de Render

**Prioridad:** Media
**Impacto estimado:** Eliminación de cold starts y mejora de recursos CPU/RAM

**Acciones:**
- Evaluar upgrade a Render Starter ($7/mes) o Standard ($25/mes) para obtener recursos dedicados.
- Configurar auto-scaling si se anticipa carga concurrente real > 50 usuarios.
- Considerar migración a un proveedor con mejor rendimiento para APIs (ej: Railway, Fly.io).

### 5.6 Estrategia de Pruebas en Producción

**Prioridad:** Media
**Impacto estimado:** Capacidad de testing end-to-end en producción

**Acciones:**
- Crear cuentas de prueba dedicadas con TOTP real configurado para testing en producción.
- Implementar un flag de seguridad (ej: header secreto o IP whitelist) que permita el bypass de OTP solo desde IPs de testing.
- Documentar el proceso de testing en producción en `docs/ONBOARDING.md`.

### 5.7 Compresión y Optimización de Respuestas

**Prioridad:** Media
**Impacto estimado:** Reducción de 30-50 % en bytes transferidos

**Acciones:**
- Habilitar `compression` middleware de Express (gzip/deflate).
- Paginación agresiva en endpoints de listado (ollas, beneficiarios, inventario).
- Implementar `ETag` / `If-None-Match` para endpoints de solo lectura.

---

## 6. Evidencia Visual de la Ejecución

A continuación se presentan las capturas de pantalla de la ejecución de las pruebas de estrés en producción con Artillery.

### 6.1 Terminal — Inicio de Artillery y Fases de Carga

**Captura requerida:** Abrir la terminal (PowerShell), ejecutar `cd backend && npm run stress:run` y capturar pantalla mientras Artillery ejecuta las 4 fases contra producción. Debe verse el progreso de las fases (Calentamiento → Carga media → Estrés alto → Sostenido) y el target `https://proyecto-ollas-comunes.onrender.com`.

**Archivo sugerido:** `docs/assets/estres/produccion_01_artillery_fases.png`

### 6.2 Terminal — Resultado Final de Artillery (Summary Report)

**Captura requerida:** Al finalizar Artillery, capturar la pantalla que muestra el resumen aggregate: total requests, códigos HTTP (200, 429, 401), latencias (min, max, p50, p95, p99), y Virtual Users. Debe verse el bloque `Summary report` impreso en terminal.

**Archivo sugerido:** `docs/assets/estres/produccion_02_artillery_summary.png`

### 6.3 Terminal — Errores Durante la Ejecución

**Captura requerida:** Durante la fase de estrés o sostenido, capturar pantalla donde se vean errores HTTP 429 (Too Many Requests) y/o socket timeouts apareciendo en tiempo real en la terminal. Debe verse la cantidad de errores y el tipo (429, timeout).

**Archivo sugerido:** `docs/assets/estres/produccion_03_artillery_errors.png`

### 6.4 Backend — Logs del Servidor Bajo Carga

**Captura requerida:** Abrir la consola de Render (Dashboard → Logs) y capturar pantalla mostrando los logs del backend durante la ejecución de la prueba de estrés. Deben verse requests entrantes, posibles errores 429, y métricas de performance si están disponibles.

**Archivo sugerido:** `docs/assets/estres/produccion_04_render_logs.png`

### 6.5 Artillery Report HTML (Opcional)

**Captura requerida:** Ejecutar `npx artillery report stress-test-report.json --output stress-test-report.html` y abrir el HTML en el navegador. Capturar pantalla del reporte gráfico mostrando las gráficas de latencia, throughput y códigos HTTP por endpoint.

**Archivo sugerido:** `docs/assets/estres/produccion_05_artillery_html_report.png`

> **Instrucciones:** Crear la carpeta `docs/assets/estres/` si no existe. Guardar las capturas con los nombres indicados. Cada captura debe mostrar la terminal/navegador con evidencia clara de la ejecución en producción.

---

## 7. Conclusión

| Aspecto | Resultado |
|---------|-----------|
| **Endpoints públicos** | Estables con timeouts distribuidos (~10 % por endpoint). `/` y `/api/health` alcanzan ~90 % de éxito individual. |
| **Health check Prisma** | Más estable que en desarrollo (92.6 % éxito vs 40 % en dev). La conexión vía PgBouncer pooler es más eficiente. |
| **Health check Supabase** | Estable (89.6 % éxito). Sin errores de conexión a la base de datos. |
| **Autenticación (login)** | Críticamente degradada. Solo 1.7 % de éxito (30 de 1 748) debido al rate limiter por IP que bloquea el 97 % de las requests. |
| **Verificación OTP** | No funcional en pruebas. El bypass `999999` está deshabilitado en producción (correcto por seguridad). |
| **Dashboard** | No alcanzado por ningún VU del escenario B (cadena interrumpida en login). |
| **Rate Limiter** | Cuello de botella principal. Configuración por defecto inadecuada para uso concurrente desde la misma IP. |
| **Recursos de Render** | Limitaciones claras del free/starter tier. Latencias 2-3x más altas que en desarrollo. |
| **Estabilidad general** | El servidor **no colapsa** bajo carga extrema — mantiene vivo y funcional para requests de health check que logran conexión. |

**Veredicto:** SIGO-OLLAS en producción muestra un comportamiento significativamente diferente al entorno de desarrollo. Mientras que en desarrollo el cuello de botella principal era el pool de conexiones de Prisma (afectando endpoints de BD), en producción el cuello de botella dominante es el **rate limiter por IP** (bloqueando el 97 % de los intentos de login). Los health checks son más estables en producción que en desarrollo (67 % vs 40 % de completación), lo que indica que la infraestructura de Supabase vía PgBouncer es robusta. Sin embargo, las latencias generales son 2-3x más altas debido a los recursos limitados de Render free tier. Las optimizaciones prioritarias son: (1) rediseñar el rate limiter para que funcione por tenant en lugar de por IP, (2) implementar warm-up para evitar cold starts de Render, y (3) evaluar upgrade del plan de Render para obtener recursos dedicados. Sin estas mejoras, el sistema es funcional para uso individual pero no soporta carga concurrente real desde una misma red.

---

*Documento generado a partir de los resultados de Artillery (`stress-test-report.json`).*
*Herramienta: Artillery 2.0.33 | Fecha: 19 de julio de 2026 | Entorno: Producción (Render + Supabase)*

> **Nota para el estudiante:** Agregar las capturas de pantalla en la sección 6 antes de entregar el documento. Crear la carpeta `docs/assets/estres/` (si no existe) y colocar las imágenes con los nombres indicados.
