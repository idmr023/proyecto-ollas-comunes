# Prueba de Seguridad con OWASP ZAP (DAST)

## Información del Documento

| Campo | Detalle |
|-------|---------|
| Proyecto | SIGO-Ollas - Sistema de Gestión de Ollas Comunes |
| Tipo de Prueba | Dynamic Application Security Testing (DAST) |
| Herramienta | OWASP Zed Attack Proxy (ZAP) v2.17.0 |
| Versión Documento | 1.0 |
| Fecha | Junio 2026 |

---

## 1. Descripción de la Prueba

### 1.1 ¿Qué es OWASP ZAP?

OWASP ZAP (Zed Attack Proxy) es una herramienta de seguridad de código abierto mantenida por la comunidad internacional de voluntarios de ZAP. Permite encontrar automáticamente vulnerabilidades de seguridad en aplicaciones web durante las fases de desarrollo y pruebas.

### 1.2 Tipo de Prueba: DAST (Dynamic Application Security Testing)

A diferencia de un análisis estático de código (SAST) que revisa el código fuente, **DAST** prueba la aplicación en ejecución desde la perspectiva de un atacante externo. ZAP actúa como un proxy de ataque que:

1. **Rastrea (Spider):** Navega automáticamente la aplicación para descubrir todas las rutas, páginas y recursos accesibles.
2. **Escanea Activamente (Active Scan):** Una vez descubiertas las rutas, lanza ataques controlados contra cada endpoint simulando técnicas reales de penetración.

### 1.3 Cobertura de Vulnerabilidades Detectadas

El escaneo activo de ZAP verifica contra las siguientes categorías de vulnerabilidades basadas en el **OWASP Top 10** y **OWASP ASVS**:

| ID | Vulnerabilidad | CWE |
|----|---------------|-----|
| 0 | Directory Browsing | CWE-548 |
| 10021 | X-Content-Type-Options Header Missing | CWE-693 |
| 10045 | Source Code Disclosure - /WEB-INF Folder | CWE-541 |
| 10098 | Cross-Domain Misconfiguration (CORS) | CWE-264 |
| 10104 | User Agent Fuzzer | — |
| 20015 | Heartbleed OpenSSL Vulnerability | CWE-119 |
| 20017 | Source Code Disclosure - CVE-2012-1823 | CWE-20 |
| 20018 | Remote Code Execution - CVE-2012-1823 | CWE-20 |
| 40026 | DOM Cross Site Scripting (deshabilitado en headless) | CWE-79 |
| 40028 | ELMAH Information Leak | CWE-94 |
| 40029 | Trace.axd Information Leak | CWE-215 |
| 40032 | .htaccess Information Leak | CWE-94 |
| 40034 | .env Information Leak | CWE-215 |
| 40035 | Hidden File Finder | CWE-538 |
| 40042 | Spring Actuator Information Leak | CWE-215 |
| 100043 | Swagger UI Secret & Vulnerability Detector | CWE-522 |
| — | Path Traversal | CWE-22 |
| — | Remote File Include (RFI) | CWE-98 |
| — | Shell Shock | CWE-78 |
| — | External Redirect | CWE-601 |
| — | Server Side Include (SSI) | CWE-97 |
| — | Cross Site Scripting (Reflected y Stored) | CWE-79 |
| — | SQL Injection (MySQL, PostgreSQL, Oracle, Hypersonic) | CWE-89 |

Adicionalmente, ZAP ejecuta reglas de **escaneo pasivo** sobre cada respuesta HTTP para detectar:
- Cabeceras de seguridad faltantes (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Información de servidor expuesta (Server leaks, X-Powered-By)
- Cookies sin flags Secure/HttpOnly
- Vulnerabilidades en librerías JavaScript (Retire.js)

### 1.4 Arquitectura de la Prueba

```
+-------------------+        +-------------------+        +-------------------+
|   Script Node.js  | -----> |   ZAP API REST    | -----> |   App Desplegada  |
|  (escaneo.js)     | HTTP   |  localhost:8080    | HTTP   |  Vercel .app      |
+-------------------+        +-------------------+        +-------------------+
         |                            |
         |                            |
         v                            v
  Consola (logs)            Reporte HTML
  Progreso en           (reporte-seguridad-zap.html)
  tiempo real
```

---

## 2. Requisitos para Ejecutar la Prueba

| Requisito | Versión Mínima | Propósito |
|-----------|---------------|-----------|
| Docker Desktop | 24+ | Ejecutar el contenedor de ZAP |
| Node.js | 18+ | Ejecutar el script de automatización |
| Conexión a Internet | — | Escanear la app desplegada y descargar imágenes Docker |

---

## 3. Instrucciones de Ejecución

### 3.1 Levantar ZAP en Docker

```bash
docker run -d --name zap -p 8080:8080 -p 8090:8090 ^
  zaproxy/zap-stable zap.sh -daemon -host 0.0.0.0 -port 8080 ^
  -config api.addrs.addr.name=.* ^
  -config api.addrs.addr.regex=true ^
  -config api.key=clave-segura-zap
```

### 3.2 Ejecutar el Script de Escaneo

```bash
node escaneo.js
```

### 3.3 Revisar el Reporte

Abrir el archivo generado `reporte-seguridad-zap.html` en cualquier navegador web.

### 3.4 Limpiar el Contenedor (Opcional)

```bash
docker stop zap
docker rm zap
```

---

## 4. Flujo de Ejecución del Script (`escaneo.js`)

### Fase 1: Verificación de ZAP
Se consulta el endpoint `/JSON/core/view/version/` de la API REST de ZAP para confirmar que el daemon esté operativo.

### Fase 2: Spider (Rastreo)
Se invoca `/JSON/spider/action/scan/` con los parámetros:
- `url`: URL objetivo
- `maxChildren=5`: Profundidad máxima de rastreo
- `recurse=true`: Sigue enlaces descubiertos recursivamente

El script realiza **polling** cada 3 segundos consultando `/JSON/spider/view/status/` hasta alcanzar 100%.

### Fase 3: Deshabilitación de Escáneres Incompatibles
Se deshabilita el escáner **DOM XSS (ID 40026)** que requiere un navegador gráfico, inexistente en el entorno Docker headless.

### Fase 4: Active Scan (Escaneo Activo)
Se invoca `/JSON/ascan/action/scan/` con los parámetros:
- `url`: URL objetivo
- `recurse=true`: Escanea recursivamente todos los nodos descubiertos
- `maxAlertsPerRule=50`: Límite de alertas por regla para evitar saturación

El script realiza **polling** cada 5 segundos consultando `/JSON/ascan/view/status/` hasta alcanzar 100%. Incluye un mecanismo anti-bloqueo: si el progreso no avanza durante 2 minutos consecutivos (24 iteraciones), detiene el escaneo y lo da por completado para evitar bucles infinitos.

### Fase 5: Generación de Reporte
Se obtiene el reporte HTML completo desde `/OTHER/core/other/htmlreport/` y se guarda como `reporte-seguridad-zap.html`.

### Fase 6: Resumen en Consola
Se consultan las alertas desde `/JSON/core/view/alerts/` y se imprime un resumen clasificado por nivel de riesgo (High, Medium, Low, Informational).

---

## 5. Interpretación de Resultados

### 5.1 Clasificación de Riesgos

| Nivel | Color | Significado |
|-------|-------|-------------|
| **High** | Rojo | Vulnerabilidad crítica que requiere acción inmediata |
| **Medium** | Naranja | Vulnerabilidad importante que debe corregirse en el corto plazo |
| **Low** | Amarillo | Deficiencia de seguridad menor o configuraciones subóptimas |
| **Informational** | Azul | Hallazgo informativo sin impacto directo en seguridad |

### 5.2 Alertas Detectadas en SIGO-Ollas (Ejemplo)

| Riesgo | Alerta | Acción Correctiva |
|--------|--------|-------------------|
| Medium | Content Security Policy (CSP) Header Not Set | Agregar cabecera `Content-Security-Policy` en la configuración de Vercel (`vercel.json`) o en el servidor Next.js |
| Medium | Cross-Domain Misconfiguration (CORS: `*`) | Restringir `Access-Control-Allow-Origin` a dominios específicos en la configuración del backend |
| Informational | Retrieved from Cache | Revisar cabeceras de caché (`Cache-Control`, `Pragma`) en recursos estáticos |
| Informational | User Agent Fuzzer | Hallazgo generado por el propio escaneo; no representa riesgo |

---

## 6. Solución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| `docker: command not found` | Docker no instalado o no en PATH | Instalar Docker Desktop y reiniciar terminal |
| `port 8080 already in use` | Otro proceso usando el puerto | Cambiar puerto o detener el proceso: `netstat -ano \| findstr :8080` |
| Escaneo se detiene en X% | Escáner DOM XSS bloqueado (sin navegador) | El script ya lo maneja automáticamente deshabilitando el scanner ID 40026 |
| `pull access denied` | Imagen Docker incorrecta | Usar `zaproxy/zap-stable` en lugar de `owasp/zap2docker-stable` |
| Reporte sin alertas | Spider no descubrió rutas | Verificar que la URL sea accesible públicamente |

---

## 7. Notas Técnicas

- **API Key:** Se utiliza `clave-segura-zap` como clave de autenticación para la API de ZAP. Esta clave puede cambiarse según la política de seguridad del proyecto.
- **Puertos:** ZAP expone su API en el puerto `8080` y un proxy adicional en el puerto `8090`.
- **Headless Mode:** ZAP se ejecuta en modo daemon sin interfaz gráfica (`-daemon`), optimizado para automatización y entornos CI/CD.
- **Persistencia:** El reporte HTML se genera en el directorio de trabajo actual. No hay almacenamiento persistente de resultados en el contenedor.
