# Catálogo de Controles de Seguridad - SIGO-Ollas

## Información del Documento

| Campo | Detalle |
|-------|---------|
| Proyecto | SIGO-Ollas - Sistema de Gestión de Ollas Comunes |
| Versión | 1.0 |
| Fecha | Mayo 2026 |
| Clasificación | Confidencial |

---

## 1. Introducción

El presente catálogo define los controles de seguridad implementados y planificados para el sistema SIGO-Ollas, alineados con los estándares **ISO 27001:2022**, **OWASP Top 10 (2021)** y las guías del **NIST SP 800-53**. Su objetivo es garantizar la confidencialidad, integridad y disponibilidad de la información gestionada por la plataforma.

---

## 2. Controles de Seguridad por Dominio

### 2.1 Control de Acceso (ISO 27001 A.9 / OWASP A1, A7)

| ID | Control | Descripción | Estado | Estándar |
|----|---------|-------------|--------|----------|
| CA-01 | Autenticación de usuarios | Inicio de sesión mediante email y contraseña con hash bcrypt | ✅ Implementado | OWASP A7 |
| CA-02 | Autorización basada en roles (RBAC) | Acceso segregado por roles: `admin_municipal`, `lideresa_olla`, `supervisor` | ✅ Implementado | ISO 27001 A.9.2.3 |
| CA-03 | Principio de mínimo privilegio | Cada rol accede únicamente a los recursos necesarios para su función | ✅ Implementado | NIST AC-6 |
| CA-04 | Gestión de sesiones | Tokens JWT con expiración configurable renovados periódicamente | ✅ Implementado | OWASP Session Mgmt |
| CA-05 | Bloqueo de cuenta | Bloqueo temporal tras N intentos fallidos de inicio de sesión | 📋 Planificado | NIST AC-7 |
| CA-06 | Autenticación multifactor (MFA) | Verificación en dos pasos opcional para administradores | 📋 Planificado | ISO 27001 A.9.4.2 |

### 2.2 Cifrado y Protección de Datos (ISO 27001 A.8 / NIST SC)

| ID | Control | Descripción | Estado | Estándar |
|----|---------|-------------|--------|----------|
| CD-01 | Cifrado en tránsito (TLS 1.3) | Todas las comunicaciones cliente-servidor cifradas mediante HTTPS | ✅ Implementado | NIST SC-8 |
| CD-02 | Cifrado de contraseñas | Almacenamiento de contraseñas con bcrypt (cost factor 12) | ✅ Implementado | OWASP A2 |
| CD-03 | Cifrado en reposo (AES-256) | Cifrado de datos sensibles en base de datos mediante pgcrypto | ✅ Implementado | ISO 27001 A.8.2.1 |
| CD-04 | Enmascaramiento de datos | Datos personales (DNI, teléfono) enmascarados en vistas no críticas | 📋 Planificado | NIST SC-13 |
| CD-05 | Gestión segura de claves | Claves API y secretos gestionados mediante variables de entorno | ✅ Implementado | ISO 27001 A.8.2.3 |

### 2.3 Seguridad en la Comunicación (ISO 27001 A.13 / OWASP A4)

| ID | Control | Descripción | Estado | Estándar |
|----|---------|-------------|--------|----------|
| CM-01 | HTTPS forzado | Redirección automática de HTTP a HTTPS | ✅ Implementado | OWASP A4 |
| CM-02 | Cabeceras de seguridad | Implementación de helmet (X-XSS-Protection, X-Frame-Options, CSP) | ✅ Implementado | OWASP Secure Headers |
| CM-03 | CORS restringido | Orígenes permitidos configurados explícitamente en backend | ✅ Implementado | OWASP A5 |
| CM-04 | Rate limiting | Límite de peticiones por IP para prevenir ataques de fuerza bruta | ✅ Implementado | NIST SC-7 |

### 2.4 Seguridad en Base de Datos (ISO 27001 A.14 / OWASP A3)

| ID | Control | Descripción | Estado | Estándar |
|----|---------|-------------|--------|----------|
| BD-01 | Parametrización de consultas | Uso de consultas parametrizadas vía Supabase/PostgreSQL para evitar SQL Injection | ✅ Implementado | OWASP A3 |
| BD-02 | Row Level Security (RLS) | Políticas de seguridad a nivel de fila en Supabase para aislamiento multi-tenants | ✅ Implementado | NIST AC-3 |
| BD-03 | Auditoría de cambios | Tabla `audit_logs` registra todas las operaciones INSERT, UPDATE, DELETE | ✅ Implementado | ISO 27001 A.12.4.1 |
| BD-04 | Respaldo automatizado | Backup diario de la base de datos con retención de 30 días | ✅ Implementado | NIST CP-9 |
| BD-05 | Replicación síncrona | Réplica en caliente para alta disponibilidad | 📋 Planificado | ISO 27001 A.17.2.1 |

### 2.5 Seguridad en la Aplicación (OWASP Top 10)

| ID | Control | Descripción | Estado | Estándar |
|----|---------|-------------|--------|----------|
| SA-01 | Validación de entrada | Sanitización de campos de texto (longitud, caracteres permitidos) | ✅ Implementado | OWASP A3 |
| SA-02 | Protección CSRF | Tokens anti-CSRF en formularios y peticiones state-changing | ✅ Implementado | OWASP A1 |
| SA-03 | Content Security Policy (CSP) | Cabecera CSP para prevenir XSS | ✅ Implementado | OWASP A7 |
| SA-04 | Escape de salida | Renderizado seguro de datos de usuario en el frontend (React/Next.js) | ✅ Implementado | OWASP A7 |
| SA-05 | Dependencias seguras | Escaneo periódico de vulnerabilidades en dependencias (npm audit) | 📋 Planificado | OWASP A6 |

### 2.6 Monitoreo y Trazabilidad (ISO 27001 A.12 / NIST AU)

| ID | Control | Descripción | Estado | Estándar |
|----|---------|-------------|--------|----------|
| MT-01 | Registro de auditoría | Logs estructurados de todas las operaciones críticas del sistema | ✅ Implementado | NIST AU-3 |
| MT-02 | Monitoreo de actividad | Supervisión de accesos y patrones anómalos en tiempo real | 📋 Planificado | ISO 27001 A.12.4.1 |
| MT-03 | Trazabilidad de usuarios | Cada operación registra el ID del usuario que la realizó | ✅ Implementado | NIST AU-10 |
| MT-04 | Alertas de seguridad | Notificaciones ante eventos de seguridad críticos (múltiples intentos fallidos) | 📋 Planificado | NIST AU-6 |

---

## 3. Mapeo contra OWASP Top 10 (2021)

| OWASP Top 10 | Controles Relacionados | Estado |
|-------------|----------------------|--------|
| A1: Broken Access Control | CA-01, CA-02, CA-03, BD-02 | ✅ |
| A2: Cryptographic Failures | CD-01, CD-02, CD-03 | ✅ |
| A3: Injection | BD-01, SA-01 | ✅ |
| A4: Insecure Design | CM-01, CM-02, CM-03 | ✅ |
| A5: Security Misconfiguration | CM-03, SA-05 | ✅ |
| A6: Vulnerable Components | SA-05 | 📋 |
| A7: Auth Failures | CA-01, CA-04, CA-05, CA-06 | ✅ |
| A8: Data Integrity Failures | BD-03, MT-01 | ✅ |
| A9: Logging & Monitoring | MT-01, MT-02, MT-03, MT-04 | ✅ |
| A10: SSRF | CM-04 | 📋 |

---

## 4. Mapeo contra ISO 27001:2022 Anexo A

| ISO 27001 Control | Controles SIGO-Ollas |
|-------------------|---------------------|
| A.8.2.1 - Clasificación de información | CD-03 |
| A.8.2.3 - Manejo de activos | CD-05 |
| A.9.2.3 - Gestión de derechos de acceso | CA-02 |
| A.9.4.2 - Autenticación de usuarios | CA-06 |
| A.12.4.1 - Registro de eventos | BD-03, MT-01 |
| A.13.1.1 - Controles de red | CM-01, CM-02, CM-03 |
| A.14.2.1 - Desarrollo seguro | SA-01, SA-02, SA-03, SA-04 |
| A.17.2.1 - Disponibilidad | BD-04, BD-05 |

---

## 5. Plan de Implementación de Controles Pendientes

| Control | Prioridad | Estimación | Responsable |
|---------|-----------|------------|-------------|
| CA-05 - Bloqueo de cuenta | Alta | 2 días | Backend |
| CA-06 - MFA | Media | 4 días | Backend + Frontend |
| CD-04 - Enmascaramiento de datos | Media | 2 días | Frontend |
| BD-05 - Replicación síncrona | Alta | 3 días | Infraestructura |
| SA-05 - Escaneo de dependencias | Alta | 1 día | DevOps |
| MT-02 - Monitoreo en tiempo real | Media | 5 días | Backend + DevOps |
| MT-04 - Alertas de seguridad | Media | 3 días | Backend |

---

## 6. Referencias

- ISO/IEC 27001:2022 - Information Security Management Systems
- OWASP Top 10 (2021) - https://owasp.org/www-project-top-ten/
- NIST SP 800-53 Rev. 5 - Security and Privacy Controls
- Supabase Row Level Security - https://supabase.com/docs/guides/auth/row-level-security
- OWASP Cheat Sheet Series - https://cheatsheetseries.owasp.org/
