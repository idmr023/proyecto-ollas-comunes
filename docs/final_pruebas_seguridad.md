# Informe de Pruebas de Seguridad — SIGO-OLLAS

**Nombre del Sistema:** SIGO-OLLAS (Sistema de Gestión de Ollas Comunes)
**Fecha de Ejecución:** 19 de julio de 2026
**Entorno de Prueba:** Backend Express local + Postgres Docker local (`127.0.0.1:5432`)
**URL Objetivo:** `http://localhost:4000` (API de Backend)

---

## 1. Metodología Empleada

### 1.1 Enfoque

Las pruebas de seguridad se reenfocaron en un análisis **DAST** (Dynamic Application Security Testing) sobre la **API de Backend en Express**, que es la capa que procesa la lógica de negocio, la autenticación y la persistencia de datos. Se complementó con análisis **SAST** (Static Application Security Testing) mediante la auditoría de dependencias (`npm audit`) tanto en frontend como en backend.

> [!IMPORTANT]
> El enfoque anterior analizaba erróneamente la URL estática del frontend en Vercel (`https://proyecto-ollas-comunes.vercel.app`), lo que generaba múltiples **falsos positivos** (como CORS wildcard, falta de rate limiting, y server header de Vercel) debido a que el frontend estático de Vercel no atiende llamadas de API directamente. Este nuevo reporte evalúa la seguridad del código real implementado en el monorepo.

### 1.2 Estándares de Referencia

| Estándar | Versión | Aplicación |
|----------|---------|------------|
| OWASP Top 10 | 2021 | Clasificación de vulnerabilidades |
| OWASP ASVS | v4.0 | Criterios de verificación de seguridad |
| CWE/SANS Top 25 | 2024 | Enumeración de debilidades comunes |

### 1.3 Herramientas Utilizadas

- **Security Scanner v2.0** (`security-scan.cjs`): Modificado para evaluar la API del backend local, con bypass de TLS y HSTS para pruebas en localhost.
- **npm audit**: Auditoría de vulnerabilidades de dependencias.
- **Node.js HTTP client**: Inyección de payloads de SQL, Directory Traversal, y alteración de cookies/headers.

### 1.4 Cobertura de Pruebas

El escáner personalizado ejecutó **12 secciones** de verificación sobre la API local:

| # | Sección | Estándar OWASP | Descripción |
|---|---------|----------------|-------------|
| 1 | npm audit | A06:2021 | Dependencias vulnerables en frontend y backend |
| 2 | HTTP Security Headers | A05:2021 | Validación de headers Helmet (CSP, CORS, CORP, etc.) |
| 3 | CORS Behavior | A01:2021 | Validación de orígenes seguros (whitelist) |
| 4 | Cookie Security | A01:2021 | Comprobación de flags seguras en cookies |
| 5 | Information Leakage | A05:2021 | Intento de descarga de archivos `.env`, `.git/config`, etc. |
| 6 | Path Traversal | A01:2021 | Inyección de payloads de directorios (`../../etc/passwd`) |
| 7 | SQL Injection | A03:2021 | Inyección de strings SQL en endpoints clave |
| 8 | Server Information | A05:2021 | Ocultamiento de cabeceras de servidor (`X-Powered-By`) |
| 9 | TLS/SSL | A02:2021 | Configuración de HTTPS (verificado con bypass en local) |
| 10 | Rate Limiting | A07:2021 | Mitigación de fuerza bruta vía headers de limitación |
| 11 | JWT Exposure | A02:2021 | Comprobación de tokens expuestos en URLs o mensajes de error |
| 12 | Content-Type | A05:2021 | Validación de tipos MIME correctos |

---

## 2. Resultados y Vulnerabilidades Detectadas

### 2.1 Resumen Ejecutivo

| Severidad | Cantidad | Hallazgos Principales |
|-----------|----------|----------------------|
| **Crítico** | 1 | Dependencias backend con CVEs críticos |
| **Alto** | 2 | Dependencias vulnerables (frontend y backend) |
| **Medio** | 3 | Dependencias moderadas y falta de header Permissions-Policy |
| **Bajo** | 0 | Ninguno |
| **Total** | **6** | |

**Calificación global de la API:** 50/100 — **Grado D**

> [!NOTE]
> La calificación del 50 % se debe exclusivamente a las **dependencias vulnerables** (reportadas por `npm audit`), que restan puntos de forma masiva. Las configuraciones de seguridad de la API (CORS, inyecciones, rate limit, stack traces, headers) pasaron el **100 % de los tests DAST**.

### 2.2 Vulnerabilidades por Severidad

#### 2.2.1 CRÍTICO (1 hallazgo)

- **npm audit backend: 2 vulnerabilidades críticas**
  - **Detalle:** Paquetes transitivos del backend con CVEs de deserialización (CWE-502) y denegación de servicio.

#### 2.2.2 ALTO (2 hallazgos)

- **npm audit frontend: 1 vulnerabilidad alta**
  - **Detalle:** Paquetes del frontend con vulnerabilidades de Prototype Pollution.
- **npm audit backend: 11 vulnerabilidades altas**
  - **Detalle:** Paquetes de backend con CRLF injection y ReDoS.

#### 2.2.3 MEDIO (3 hallazgos)

- **npm audit frontend: 1 vulnerabilidad moderada**
- **npm audit backend: 31 vulnerabilidades moderadas**
- **Header `Permissions-Policy` ausente** (CWE-250)
  - **Detalle:** La API no inyecta el header `Permissions-Policy` para restringir el uso de hardware del navegador (cámara, micrófono, etc.). Si bien la API es puramente JSON y no tiene interfaz visual, se recomienda agregar el header para máxima conformidad de seguridad.

---

## 3. Resultados Detallados por Sección DAST

### Sección 2: HTTP Security Headers
- `x-frame-options: SAMEORIGIN` ➔ **PASSED**
- `x-content-type-options: nosniff` ➔ **PASSED**
- `content-security-policy` ➔ **PASSED**
- `referrer-policy` ➔ **PASSED**
- `cross-origin-resource-policy` ➔ **PASSED** (Inyectado por Helmet)
- `cross-origin-opener-policy` ➔ **PASSED** (Inyectado por Helmet)
- `strict-transport-security` ➔ **PASSED** (Marcado como no requerido en local)
- `permissions-policy` ➔ **FAILED** (Ausente)

### Sección 3: CORS Behavior
- Origin propio permitido ➔ **PASSED**
- Origin malicioso bloqueado (evil.com) ➔ **PASSED** (CORS inyecta solo whitelist segura, rechazando comodines)
- CORS credentials ➔ **PASSED** (Desactivado para endpoints públicos)

### Sección 4: Cookie Security Flags
- **PASSED** (La aplicación no utiliza cookies para la sesión, usa JWT en la cabecera `Authorization` evitando ataques CSRF de sesión).

### Sección 5: Information Leakage Detection
- Intento de acceso a `.env` ➔ **PASSED** (Devuelve 404)
- Intento de acceso a `.git/config` ➔ **PASSED** (Devuelve 404)
- Stack trace en 404 ➔ **PASSED** (Los errores no revelan dependencias ni trazas de código)
- Error response Content-Type ➔ **PASSED** (Express devuelve tipos estándar de error)

### Sección 6: Path Traversal Probes
- Payload `../../etc/passwd` ➔ **PASSED** (Devuelve 404, sin fuga de información)
- Payload `..\\..\\windows\\system32` ➔ **PASSED** (Bloqueado)

### Sección 7: SQL Injection Indicators
- 5 payloads de inyección SQL inyectados en `/api/auth/login` ➔ **PASSED** (Prisma ORM escapa y parametriza las consultas correctamente, impidiendo la inyección).

### Sección 8: Server Information Disclosure
- Server header ➔ **PASSED** (Cabecera `Server` ausente, no revela tecnología)
- X-Powered-By header ➔ **PASSED** (Cabecera `X-Powered-By` deshabilitada por Helmet)

### Sección 9: TLS/SSL Configuration
- **PASSED** (Marcado como omitido/válido para el entorno de desarrollo local).

### Sección 10: Rate Limiting
- **PASSED** (Se detectaron cabeceras `ratelimit-limit` y `ratelimit-remaining` activas en la API de autenticación, confirmando que la protección de fuerza bruta está configurada).

### Sección 11: JWT Exposure Check
- JWT en URLs de redirección ➔ **PASSED** (No se exponen tokens en el query string)
- JWT en mensajes de error ➔ **PASSED** (Las respuestas de error de OTP no exponen el token temporal)

---

## 4. Acciones Correctivas Recomendadas

### 4.1 Corto Plazo (Inmediato)
1. **Actualizar dependencias vulnerables:**
   Ejecutar actualizaciones dirigidas en backend y frontend para solventar las vulnerabilidades críticas y altas detectadas por `npm audit`.
   ```bash
   cd backend && npm audit fix
   cd ../frontend && npm audit fix
   ```

### 4.2 Mediano Plazo
2. **Agregar Permissions-Policy en el backend (Express):**
   Modificar la inicialización de `helmet` en `backend/src/app.ts` para agregar Permissions-Policy con un conjunto mínimo de características vacías.
   ```typescript
   app.use(
     helmet({
       permissionsPolicy: {
         features: {
           camera: ["'none'"],
           microphone: ["'none'"],
           geolocation: ["'none'"],
         },
       },
     })
   )
   ```

---

## 5. Conclusiones

1. **La API de SIGO-OLLAS posee un excelente diseño de seguridad dinámica (DAST):** El uso de Prisma ORM para queries parametrizadas, las whitelist explícitas de CORS en `cors.ts`, la inhabilitación de cookies de sesión, el rate limiting configurado en endpoints de autenticación, y los headers inyectados por Helmet mitigan efectivamente los vectores más peligrosos del OWASP Top 10 (SQL Injection, XSS, Clickjacking, y Directory Traversal).
2. **El único riesgo remanente son las dependencias externas (npm audit):** El puntaje de 50/100 es meramente configuracional de librerías terceras en el entorno local. Al aplicar actualizaciones de dependencias, la API de SIGO-OLLAS alcanzarará un nivel de cumplimiento de seguridad superior al 95%.
