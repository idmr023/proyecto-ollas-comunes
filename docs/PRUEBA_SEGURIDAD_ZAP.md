# Prueba de Seguridad con OWASP ZAP (DAST) — v2.0

## Información del Documento

| Campo | Detalle |
|-------|---------|
| Proyecto | SIGO-Ollas - Sistema de Gestión de Ollas Comunes |
| Tipo de Prueba | Dynamic Application Security Testing (DAST) |
| Herramienta | OWASP Zed Attack Proxy (ZAP) v2.17.0 + Security Scanner v2.0 |
| Versión Documento | 2.0 |
| Fecha | Julio 2026 |

---

## 1. Descripción de la Prueba

### 1.1 ¿Qué es OWASP ZAP?

OWASP ZAP (Zed Attack Proxy) es una herramienta de seguridad de código abierto mantenida por la comunidad internacional de voluntarios de ZAP. Permite encontrar automáticamente vulnerabilidades de seguridad en aplicaciones web durante las fases de desarrollo y pruebas.

### 1.2 Tipo de Prueba: DAST (Dynamic Application Security Testing)

A diferencia de un análisis estático de código (SAST) que revisa el código fuente, **DAST** prueba la aplicación en ejecución desde la perspectiva de un atacante externo. ZAP actúa como un proxy de ataque que:

1. **Rastrea (Spider):** Navega automáticamente la aplicación para descubrir todas las rutas, páginas y recursos accesibles.
2. **Escanea Activamente (Active Scan):** Una vez descubiertas las rutas, lanza ataques controlados contra cada endpoint simulando técnicas reales de penetración.
3. **Escaneo Pasivo:** Analiza cada respuesta HTTP en busca de headers faltantes, cookies inseguras, y información expuesta.

### 1.3 Cobertura de Vulnerabilidades Detectadas

#### Active Scan (Ataques ofensivos)

| ID | Vulnerabilidad | CWE | OWASP |
|----|---------------|-----|-------|
| 40018-40022 | SQL Injection (MySQL, PostgreSQL, Oracle, Hypersonic) | CWE-89 | A03 |
| 40012 | Cross Site Scripting (Reflected) | CWE-79 | A03 |
| 40016 | Cross Site Scripting (Stored) | CWE-79 | A03 |
| 6 | Path Traversal | CWE-22 | A01 |
| 90020 | Remote OS Command Injection | CWE-78 | A03 |
| 10102 | Server Side Code Injection | CWE-94 | A10 |
| 90023 | XML External Entity Attack (XXE) | CWE-611 | A05 |
| 90021 | LDAP Injection | CWE-90 | A03 |
| 7 | Remote File Inclusion (RFI) | CWE-98 | A10 |
| 10048 | Shell Shock | CWE-78 | A03 |
| 20019 | External Redirect | CWE-601 | A01 |
| 0 | Directory Browsing | CWE-548 | A05 |
| 40034 | .env Information Leak | CWE-215 | A05 |
| 40035 | Hidden File Finder | CWE-538 | A05 |
| 40032 | .htaccess Information Leak | CWE-94 | A05 |
| 10045 | Source Code Disclosure | CWE-541 | A05 |
| 20015 | Heartbleed OpenSSL | CWE-119 | A02 |
| 10098 | Cross-Domain Misconfiguration (CORS) | CWE-264 | A05 |
| 40013 | Anti-CSRF Tokens Check | CWE-352 | A01 |
| 100043 | Swagger/OpenAPI Detector | CWE-522 | A05 |
| 10104 | User Agent Fuzzer | — | — |

#### Passive Scan (Análisis de respuestas)

| Categoría | Qué verifica |
|-----------|-------------|
| Security Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Server Info Leakage | X-Powered-By, Server header, X-AspNet-Version |
| Cookie Flags | Secure, HttpOnly, SameSite |
| JavaScript | Retire.js (librerías con CVEs conocidas) |
| Information Disclosure | Debug messages, sensitive info in URLs/headers |

### 1.4 Security Scanner v2.0 — Cobertura Adicional

El script `security-scan.cjs` extiende la cobertura con 12 secciones de verificación:

| # | Sección | Qué verifica | Estándar OWASP |
|---|---------|-------------|----------------|
| 1 | npm audit | Dependencias con CVEs en frontend y backend | A06 |
| 2 | HTTP Security Headers | 9 headers de seguridad (CSP, HSTS, X-Frame, etc.) | A05 |
| 3 | CORS Behavior | Whitelist, wildcards, preflight, credentials | A05/A01 |
| 4 | Cookie Security | Secure, HttpOnly, SameSite flags | A01 |
| 5 | Information Leakage | .env, .git, stack traces, archivos sensibles | A05 |
| 6 | Path Traversal | 7 payloads de directory traversal | A01 |
| 7 | SQL Injection Indicators | 5 payloads SQLi + detección de errores SQL | A03 |
| 8 | Server Information | X-Powered-By, Server, version disclosure | A05 |
| 9 | TLS/SSL | HTTPS, redirect HTTP→HTTPS | A02 |
| 10 | Rate Limiting | Brute force protection en auth endpoints | A07 |
| 11 | JWT Exposure | Tokens en URLs y errores | A02 |
| 12 | Content-Type | MIME type verification | A05 |

### 1.5 Arquitectura de la Prueba

```
+-------------------+        +-------------------+        +-------------------+
|   Script Node.js  | -----> |   ZAP API REST    | -----> |   App Desplegada  |
|  (escaneo.js)     | HTTP   |  localhost:8080    | HTTP   |  Vercel .app      |
+-------------------+        +-------------------+        +-------------------+
         |                            |                            |
         |                            |                            v
         v                     Reporte HTML                 Vulnerabilidades
   security-scan.cjs          + JSON data                   detectadas
   (12 secciones)
```

---

## 2. Requisitos para Ejecutar

| Requisito | Versión Mínima | Propósito |
|-----------|---------------|-----------|
| Docker Desktop | 24+ | Ejecutar el contenedor de ZAP |
| Node.js | 18+ | Ejecutar scripts de automatización |
| Conexión a Internet | — | Escanear app desplegada y descargar imágenes Docker |

---

## 3. Instrucciones de Ejecución

### 3.1 Escaneo Rápido (sin Docker, ~30 segundos)

Ejecuta el security scanner que verifica headers, CORS, cookies, leakage, path traversal, SQLi indicators, TLS, rate limiting, y más:

```bash
npm run security:scan
```

Esto genera el reporte en `docs/reporte_seguridad_completo.html`.

### 3.2 Escaneo Completo con OWASP ZAP (~15-30 minutos)

**Paso 1: Levantar ZAP en Docker**

```bash
npm run security:zap:start
```

Equivalente a:
```bash
docker compose -f docker-compose.zap.yml up -d
```

**Paso 2: Esperar a que ZAP esté listo (~30 segundos)**

```bash
curl http://localhost:8080/JSON/core/view/version/?apikey=clave-segura-zap
```

Debes ver algo como: `{"version":"2.17.0"}`

**Paso 3: Ejecutar el escaneo ZAP**

```bash
npm run security:zap:scan
```

Equivalente a:
```bash
node escaneo.js
```

**Paso 4: Revisar los reportes**

- Reporte HTML de ZAP: `zap-reports/zap-report-YYYY-MM-DD.html`
- Reporte JSON de ZAP: `zap-reports/zap-report-YYYY-MM-DD.json`

**Paso 5: Detener ZAP (opcional)**

```bash
npm run security:zap:stop
```

### 3.3 Escaneo Total (Scanner + ZAP, ~30 minutos)

```bash
npm run security:scan:full
```

Esto ejecuta `security-scan.cjs --all` que incluye las 12 secciones del scanner Y el escaneo activo de ZAP.

### 3.4 Escaneo con Autenticación JWT

Si necesitas que ZAP escanee endpoints protegidos:

```bash
set ZAP_AUTH_TOKEN=Bearer eyJ...
node escaneo.js --auth
```

### 3.5 Output JSON (para procesamiento programático)

```bash
npm run security:scan:json
```

Genera `docs/security-scan-YYYY-MM-DD.json` con todos los resultados en formato estructurado.

---

## 4. Flujo de Ejecución del Script `escaneo.js`

### Fase 1: Verificación de ZAP
Se consulta `/JSON/core/view/version/` para confirmar que el daemon esté operativo. Espera hasta 120 segundos.

### Fase 2: Spider (Rastreo)
Se invoca `/JSON/spider/action/scan/` con parámetros:
- `url`: URL objetivo
- `maxChildren=0`: Sin límite de hijos
- `recurse=true`: Sigue enlaces recursivamente

**Polling** cada 3 segundos hasta 100%. Timeout: 15 minutos.

### Fase 3: Configuración de Escáneres
Se deshabilita DOM XSS (40026) que requiere navegador gráfico. En modo agresivo, todos los escáneres al máximo.

### Fase 4: Importación de URLs al Contexto
Las URLs descubiertas por el Spider se importan a un contexto ZAP dedicado para scope control.

### Fase 5: Active Scan (Escaneo Activo)
Se invoca `/JSON/ascan/action/scan/` con parámetros:
- `url`: URL objetivo
- `recurse=true`: Escanea recursivamente
- `maxAlertsPerRule=50` (o 0 en modo agresivo)

**Polling** cada 5 segundos. Timeout: 60 minutos. Anti-stuck: 36 iteraciones sin cambio → continúa.

### Fase 6: Recolección de Alertas
Se consultan todas las alertas desde `/JSON/core/view/alerts/` con paginación.

### Fase 7: Generación de Reportes
- **HTML** con calificación, mapeo OWASP Top 10, CWE, y tablas de hallazgos por severidad
- **JSON** con datos estructurados para procesamiento programático

---

## 5. Flujo de Ejecución de `security-scan.cjs`

El scanner ejecuta 12 secciones de verificación de forma paralela:

```
1. npm audit (frontend + backend)
2. HTTP Security Headers (9 checks)
3. CORS Behavior (5 tests)
4. Cookie Security Flags
5. Information Leakage (13+ probes)
6. Path Traversal (7 payloads)
7. SQL Injection Indicators (5 payloads)
8. Server Information Disclosure
9. TLS/SSL Configuration
10. Rate Limiting Verification
11. JWT/Token Exposure
12. Content-Type Verification
13. [Opcional] OWASP ZAP Active Scan
```

Cada prueba genera un resultado PASS/FAIL y deduce puntos de la calificación:
- Crítico: -15 puntos
- Alto: -10 puntos
- Medio: -5 puntos
- Bajo: -2 puntos

---

## 6. Interpretación de Resultados

### 6.1 Calificación

| Grado | Puntuación | Significado |
|-------|-----------|-------------|
| **A** | 90-100 | Excelente — seguridad sólida |
| **B** | 75-89 | Bueno — mejoras menores necesarias |
| **C** | 60-74 | Aceptable — mejoras importantes requeridas |
| **D** | 40-59 | Deficiente — vulnerabilidades significativas |
| **F** | 0-39 | Crítico — requiere acción inmediata |

### 6.2 Clasificación de Riesgos

| Nivel | Color | Significado | Acción requerida |
|-------|-------|-------------|-----------------|
| **Critical** | Rojo oscuro | Vulnerabilidad que permite compromiso total | Corregir ANTES de deploy |
| **High** | Rojo | Vulnerabilidad con impacto significativo | Corregir en el corto plazo |
| **Medium** | Naranja | Debilidad de seguridad moderada | Planificar corrección |
| **Low** | Amarillo | Configuración subóptima | Mejorar cuando sea posible |
| **Informational** | Azul | Hallazgo informativo | Documentar, sin acción urgente |

### 6.3 Mapeo CWE

Cada hallazgo incluye un ID CWE (Common Weakness Enumeration) que puedes buscar en:
- https://cwe.mitre.org/data/descriptions/20.0.html (CWE Top 25)
- https://cwe.mitre.org/data/definitions/[N].html (descripción específica)

### 6.4 Mapeo OWASP Top 10 (2021)

| OWASP | Categoría | Herramientas que lo detectan |
|-------|-----------|------------------------------|
| A01 | Broken Access Control | ZAP (CSRF, CORS), Security Scanner (Path Traversal, CORS) |
| A02 | Cryptographic Failures | Security Scanner (TLS), ZAP (Heartbleed) |
| A03 | Injection | ZAP (SQLi, XSS, Command Injection, LDAP, XXE) |
| A04 | Insecure Design | Análisis manual |
| A05 | Security Misconfiguration | Security Scanner (Headers, Server Info, Leakage), ZAP (Directory Browsing, .env, CORS) |
| A06 | Vulnerable Components | npm audit, ZAP (Retire.js) |
| A07 | Auth Failures | Security Scanner (Rate Limiting), ZAP (Session) |
| A08 | Data Integrity Failures | ZAP (Deserialization) |
| A09 | Logging & Monitoring | Análisis manual |
| A10 | SSRF | ZAP (Server Side Code Injection, RFI) |

---

## 7. Estructura de Archivos

```
proyecto-ollas-comunes/
├── docker-compose.zap.yml          ← Configuración Docker para ZAP
├── escaneo.js                      ← Script principal ZAP (Active Scan)
├── security-scan.cjs               ← Scanner completo 12 secciones + ZAP
├── zap-config/
│   ├── zap-config.properties       ← Configuración del daemon ZAP
│   ├── scan-policy.yaml            ← Política de escaneo personalizada
│   └── custom-rules.js             ← Reglas customizadas para SIGO-OLLAS
├── zap-reports/                    ← Reportes generados (HTML + JSON)
│   ├── zap-report-YYYY-MM-DD.html  ← Reporte ZAP
│   └── zap-report-YYYY-MM-DD.json  ← Datos ZAP
├── docs/
│   ├── reporte_seguridad_completo.html  ← Reporte del security-scan
│   └── PRUEBA_SEGURIDAD_ZAP.md         ← Este documento
└── package.json                    ← Scripts npm
```

---

## 8. Comandos npm Disponibles

| Comando | Descripción | Duración estimada |
|---------|-------------|-------------------|
| `npm run security:scan` | Scanner 12 secciones (sin ZAP) | ~30 segundos |
| `npm run security:scan:json` | Scanner + output JSON | ~30 segundos |
| `npm run security:scan:zap` | Scanner + ZAP active scan | ~15-30 minutos |
| `npm run security:scan:full` | Todo: scanner + ZAP + JSON | ~15-30 minutos |
| `npm run security:zap:start` | Levantar ZAP en Docker | ~30 segundos |
| `npm run security:zap:stop` | Detener ZAP | ~5 segundos |
| `npm run security:zap:scan` | Solo ZAP active scan | ~15-25 minutos |
| `npm run security:zap:auth` | ZAP con autenticación JWT | ~15-25 minutos |
| `npm run security:all` | Docker + Scanner + ZAP completo | ~20-30 minutos |

---

## 9. Solución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| `docker: command not found` | Docker no instalado | Instalar Docker Desktop y reiniciar terminal |
| `port 8080 already in use` | Otro proceso usando el puerto | `netstat -ano \| findstr :8080` y matar el proceso |
| ZAP no disponible | Contenedor no arrancó | `docker compose -f docker-compose.zap.yml up -d` y esperar 30s |
| `pull access denied` | Imagen Docker incorrecta | Verificar `zaproxy/zap-stable` en docker-compose |
| Escaneo estancado en X% | Límite de tiempo o recursos | El script maneja automáticamente el timeout |
| Reporte sin alertas | Spider no descubrió rutas | Verificar URL accesible públicamente |
| npm audit falla | Node_modules no instalados | `cd frontend && npm install && cd ../backend && npm install` |
| CORS error en scan | App no accessible | Verificar que la app esté desplegada y respondiendo |

---

## 10. Notas Técnicas

- **API Key:** `clave-segura-zap` — puede cambiarse en `docker-compose.zap.yml` y `escaneo.js`
- **Puertos:** ZAP API en `8080`, proxy en `8090`
- **Headless Mode:** ZAP en daemon (`-daemon`), optimizado para CI/CD
- **DOM XSS deshabilitado:** Requiere navegador gráfico, incompatible con Docker headless
- **Persistencia:** Reportes se guardan en `zap-reports/` y `docs/`
- **Rate Limiting:** ZAP respeta el rate limiting del backend (5 req/min en auth)
- **Custom Rules:** `zap-config/custom-rules.js` agrega checks específicos para SIGO-OLLAS (JWT en URLs, TOTP secrets, password hashes en responses, stack traces)
