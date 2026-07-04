# Argumentación del Proyecto — SIGO-OLLAS v2

> **Curso Integrador II - Software** | Semana 15
> **Sistema:** SIGO-OLLAS (Sistema de Gestión de Ollas Comunes)
> **Plataforma Cloud:** Backend en Render · Frontend en Vercel · DB en Supabase

---

## 1. Principales Aportes al Proyecto

### 1.1 Arquitectura Multi-Tenant (SaaS)
El sistema está diseñado como una plataforma SaaS multi-inquilino, permitiendo que municipalidades, ONGs y organizaciones sociales gestionen múltiples ollas comunes desde un solo entorno, con aislamiento completo de datos por tenant mediante políticas RLS (Row Level Security) en Supabase.

### 1.2 Autenticación de Dos Factores (MFA)
Se implementó un sistema de autenticación en dos pasos:
- **Administradores municipales:** Correo + contraseña + TOTP (Google Authenticator, Authy)
- **Lideresas de olla:** Correo + contraseña + Captcha (Cloudflare Turnstile) — nuevo en v2

### 1.3 Arquitectura Offline-First (PWA)
La aplicación móvil para lideresas funciona en modo offline utilizando IndexedDB para almacenamiento local y una cola de mutaciones que sincroniza automáticamente al恢复ar la conexión, con manejo de conflictos.

### 1.4 Recomendador Inteligente de Menús
Integración con API de Gemini (IA) para sugerir recetas basadas en el inventario disponible, reduciendo el desperdicio de alimentos y optimizando los recursos.

### 1.5 Patrón Repositorio
Se implementó una capa de abstracción de datos mediante el patrón Repository, con una interfaz genérica `Repository<T, ID>` y una implementación base `SupabaseRepository`, facilitando el mantenimiento y la testabilidad.

### 1.6 Automatización de Pruebas
Tres niveles de pruebas automatizadas:
- **Unitarias/Integración:** Vitest (58 casos)
- **E2E:** Playwright (34 escenarios — workspace, mobile, offline)
- **Usabilidad:** ISO 25010 (15 criterios automatizados)

---

## 2. Orden Lógico de Desarrollo

### Fase 1: Fundamentos (Sprint 1-3)
1. Definición del modelo de datos (20 tablas PostgreSQL)
2. Configuración del proyecto Next.js + Express + Supabase
3. Implementación del esquema de base de datos con migraciones

### Fase 2: Autenticación y Seguridad (Sprint 4-6)
1. Sistema de login con bcrypt + JWT
2. TOTP MFA para administradores
3. Roles y permisos (RBAC)
4. Políticas RLS para aislamiento multi-tenant
5. Auditoría con audit_logs

### Fase 3: Módulos Core (Sprint 7-9)
1. CRUD de beneficiarios con perfil médico
2. Gestión de inventario (ingresos/egresos/alertas)
3. Registro de entregas de raciones
4. Panel de administración (workspace)

### Fase 4: Módulo Móvil (Sprint 10-12)
1. Aplicación PWA para lideresas
2. Modo offline con IndexedDB
3. Recomendador de menús con IA
4. Subida de evidencias (fotos, documentos)

### Fase 5: Calidad y Despliegue (Sprint 13-15)
1. Pruebas automatizadas (Vitest, Playwright)
2. Evaluación de usabilidad ISO 25010
3. Seguridad (OWASP, escaneo de dependencias)
4. Despliegue en cloud (Render + Vercel)
5. **Captcha para lideresas (v2)**

---

## 3. Sustento de los Artefactos Elaborados

### 3.1 Pruebas Funcionales (ISO 25010 — Funcionalidad)

| Artefacto | Descripción | Ubicación |
|-----------|-------------|-----------|
| Framework | Vitest v4 con pool de forks | `backend/package.json` |
| Casos de prueba | 33 casos funcionales + ~25 negativos (F-01 a F-15) | `backend/src/test/functional.test.ts` |
| Capturas | Reporte HTML con resultados visuales | `docs/screenshots/funcionales/ejecucion.html` |
| Cobertura | Statements 43.76%, Branches 35.16%, Functions 47.42%, Lines 44.67% | `backend/coverage/` |
| Métricas | Tasa de éxito, duración, compliance level | `docs/reporte_pruebas_funcionales.html` |

**Justificación:** Se seleccionó Vitest por su integración nativa con TypeScript, su rapidez (basado en Vite) y su compatibilidad con el ecosistema Node.js del backend. Los casos de prueba cubren todos los módulos críticos: beneficiarios, autenticación, inventario, menús y dashboard.

### 3.2 Pruebas de Integración (Interoperabilidad)

| Artefacto | Descripción | Ubicación |
|-----------|-------------|-----------|
| Sistemas externos | Supabase Auth, PostgreSQL, Storage, Supavisor, Google OAuth, Cloudflare Turnstile | `docs/informe_interoperabilidad.md` |
| Framework | Vitest v4 | `backend/package.json` |
| Casos de prueba | 15 casos de interoperabilidad + ~10 negativos (I-01 a I-15) | `backend/src/test/integration.test.ts` |
| Capturas | Reporte HTML con resultados visuales | `docs/screenshots/integracion/ejecucion.html` |
| Resultados | Reporte de integración con métricas | `docs/reporte_pruebas_integracion.html` |
| Métricas | Tasa de éxito, verificación de cada servicio externo | `docs/informe_interoperabilidad.md` |

**Justificación:** Las pruebas de integración verifican que todos los servicios externos (Supabase, Prisma, base de datos) interoperan correctamente. Se incluyen pruebas de aislamiento multi-tenant, rate limiting, CORS y rollback transaccional.

### 3.3 Evaluación de Usabilidad (ISO/IEC 25010)

| Artefacto | Descripción | Ubicación |
|-----------|-------------|-----------|
| Informe de usabilidad | Evaluación completa con 15 criterios ISO 25010 | `docs/reporte_pruebas_usabilidad.html` |
| Framework | Análisis estático automatizado + Lighthouse | `run-usability-tests.mjs` |
| Casos de prueba | 15 criterios: Learnability, Operability, Error Protection, Aesthetics, Accessibility | U-01 a U-15 |
| Capturas | Captura de ejecución de usabilidad | `docs/screenshots/usabilidad/ejecucion.html` |
| Resultados | Reporte con puntajes por categoría | `docs/reporte_usabilidad_lighthouse.html` |
| Métricas | Accesibilidad 96%, Prácticas 100%, Performance 98%, SEO 100% | — |

**Justificación:** La evaluación sigue los lineamientos de la ISO/IEC 25010 para la subcaracterística de Usabilidad. Se analizaron 5 dimensiones: Learnability (facilidad de aprendizaje), Operability (operabilidad), User Error Protection (protección contra errores), Aesthetics (estética de la interfaz) y Accessibility (accesibilidad WCAG 2.1 AA).

### 3.4 Seguridad (ISO 27001 / OWASP)

| Artefacto | Descripción | Ubicación |
|-----------|-------------|-----------|
| Catálogo de controles | 24 controles mapeados a ISO 27001, OWASP, NIST | `docs/CATALOGO_CONTROLES_SEGURIDAD.md` |
| Informe de seguridad | TLS, bcrypt, AES-256, JWT, RLS, auditoría | `docs/INFORME_SEGURIDAD_CIFRADO.md` |
| Escaneo automático | npm audit + cabeceras HTTP + ZAP opcional | `security-scan.cjs` |
| Reporte de seguridad | HTML con resultados del escaneo | `docs/reporte_seguridad_web.html` |

---

## 4. Funcionamiento del Sistema en Plataforma Cloud (v2)

### 4.1 Arquitectura de Despliegue

```
[Usuario] → [Vercel - Frontend Next.js 16]
                ↓ API REST
           [Render - Backend Express 5]
                ↓ Prisma ORM
           [Supabase - PostgreSQL + Storage]
                ↓
           [Cloudflare Turnstile] (nuevo en v2)
```

### 4.2 URLs de Producción

| Componente | URL | Tecnología |
|------------|-----|------------|
| Frontend (Web) | `https://proyecto-ollas-comunes.vercel.app` | Next.js 16 + Tailwind v4 |
| Backend (API) | `https://proyecto-ollas-comunes.onrender.com` | Express 5 + TypeScript |
| Base de Datos | `burroaetobafbtgaxjrf.supabase.co` | PostgreSQL 15 + PgBouncer |
| Captcha | Cloudflare Turnstile (nuevo v2) | API key configurable |

### 4.3 Funcionalidades Verificadas en Cloud

- ✅ Autenticación con MFA (TOTP para admin, captcha para lideresas)
- ✅ CRUD de beneficiarios con validación de DNI único
- ✅ Gestión multi-tenant con aislamiento RLS
- ✅ Inventario con alertas de stock bajo
- ✅ Recomendaciones de menú con IA
- ✅ Registro de entregas de raciones
- ✅ Subida de documentos a Supabase Storage
- ✅ Dashboard con métricas consolidadas
- ✅ PWA offline-first para lideresas
- ✅ Modo oscuro y diseño responsive

### 4.4 Novedades de la Versión 2

1. **Captcha Turnstile para lideresas:** Reemplaza la verificación TOTP para el rol `lideresa_olla`, simplificando el acceso desde dispositivos móviles sin necesidad de app de autenticación
2. **Evaluación de usabilidad ISO 25010:** Suite automatizada de 15 criterios de usabilidad
3. **Reportes formalizados:** Todos los reportes incluyen los 6 artefactos requeridos por la rúbrica
4. **Pruebas en cloud:** Script `test-cloud.mjs` para validación contra el entorno de producción

---

## 5. Stack Tecnológico y Decisiones Técnicas

| Decisión | Opción | Alternativa | Justificación |
|----------|--------|-------------|---------------|
| Frontend | Next.js 16 | React SPA, Vue | SSR/SSG, SEO, App Router moderno |
| Backend | Express 5 | Fastify, NestJS | Madurez, ecosistema, simplicidad |
| ORM | Prisma + Supabase SDK | Drizzle, Knex | Type-safe, migraciones, PgBouncer |
| Autenticación | JWT + TOTP | Supabase Auth solo | Control total sobre el flujo MFA |
| Captcha | Cloudflare Turnstile | reCAPTCHA, hCaptcha | Gratuito, sin tracking, invisible |
| Base de datos | PostgreSQL (Supabase) | MySQL, MongoDB | Relacional, RLS, funciones nativas |
| Estilos | Tailwind CSS v4 | CSS Modules, Styled Components | Utilidades, consistencia, performance |
| Pruebas | Vitest + Playwright | Jest + Cypress | Rapidez, integración TypeScript |
| Despliegue | Vercel + Render | AWS, GCP, Firebase | Simplicidad, capa gratuita |

---

## 6. Cumplimiento de la Rúbrica

### 6.1 Pruebas Funcionales (4 pts) ✅
- Framework: Vitest v4
- 33 casos funcionales + ~25 negativos
- Capturas de ejecución generadas automáticamente
- Cobertura: 43.76% statements
- Métricas y compliance level documentados

### 6.2 Pruebas de Integración (4 pts) ✅
- 8 sistemas externos identificados y probados
- Framework: Vitest
- 15 casos de interoperabilidad + ~10 negativos
- Capturas de ejecución generadas
- Reporte de resultados con métricas

### 6.3 Evaluación de Usabilidad (4 pts) ✅
- Informe de usabilidad ISO/IEC 25010
- 15 criterios evaluados en 5 dimensiones
- Capturas de ejecución
- Reporte con puntajes y observaciones

### 6.4 Validación en Cloud ✅
- Script `test-cloud.mjs` contra Render
- Health checks de servicios
- Pruebas funcionales en entorno cloud
- Verificación de seguridad (CORS, helmet)

### 6.5 Argumentación del Proyecto ✅
- Aportes principales documentados
- Orden lógico de desarrollo
- Sustento técnico de cada artefacto
- Demo v2 en cloud con URLs funcionales

---

*Documento generado para la sustentación del Curso Integrador II - Software*
*Semana 15 — Plataforma Cloud: Render + Vercel + Supabase*
