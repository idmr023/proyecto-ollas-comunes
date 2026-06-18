# Informe de Pruebas de Interoperabilidad (Integration Test Suite)

Este documento detalla la identificación de los sistemas externos, servicios e interfaces con los que interactúa el sistema **SIGO-OLLAS**, así como las métricas evaluadas, niveles de cumplimiento y observaciones técnicas de la suite de pruebas.

---

## 1. Identificación de Sistemas y Servicios Externos

El sistema **SIGO-OLLAS** está diseñado bajo una arquitectura de microservicios e integraciones serverless:

| Servicio Externo | Protocolo / Interfaz | Descripción / Uso |
|------------------|----------------------|-------------------|
| **Supabase Auth (GoTrue)** | REST HTTPS / JWT | Gestión segura de identidad de usuarios, sesiones y flujo multifactor (MFA/OTP). |
| **Supabase PostgreSQL** | TCP (Puerto 6543 via Prisma) | Almacenamiento de base de datos relacional para el padrón, inventario, menús y auditorías. |
| **Prisma ORM** | Capa lógica nativa (TypeScript) | Mapeo objeto-relacional y ejecución de consultas relacionales optimizadas. |
| **Google OAuth 2.0 API** | REST HTTPS | Autenticación federada (inicio de sesión mediante cuenta de Google). |
| **Criptografía (bcryptjs)** | Hashing local (JS) | Generación y comparación segura de hashes de contraseñas para evitar almacenamiento plano. |
| **Supabase Storage** | REST HTTPS (API Buckets) | Almacenamiento y recuperación de documentos de evidencia (actas, fotos de guías de remisión). |
| **Supavisor (Pool de Conexión)** | Proxy TCP PostgreSQL | Balanceador para evitar agotar las conexiones concurrentes hacia el motor de base de datos. |

---

## 2. Métricas Evaluadas y Niveles de Cumplimiento

Las pruebas de interoperabilidad automatizadas midieron los siguientes aspectos técnicos:

| Caso de Prueba | Métrica Evaluada | Criterio de Éxito | Nivel de Cumplimiento |
|----------------|------------------|-------------------|----------------------|
| **I-01: Prisma connection** | Tiempo de conexión | `< 100ms` (Healthcheck OK) | **100% (Exitoso)** |
| **I-02: Supabase SDK connection**| Disponibilidad de la API | HTTP Status `200` | **100% (Exitoso)** |
| **I-03: Google OAuth Endpoint** | Formato de URL de redirección | Contiene `accounts.google.com` | **100% (Exitoso)** |
| **I-04: Google OAuth Callback** | Captura de tokens falsos | Retorna HTTP `400` controlado | **100% (Exitoso)** |
| **I-05: Aislamiento RLS** | Filtrado de datos (Multi-tenant) | Petición cruzada retorna vacío | **100% (Exitoso)** |
| **I-06: Rate Limiting** | Bloqueo por fuerza bruta | Retorna HTTP `429` tras 5 peticiones | **100% (Exitoso)** |
| **I-07: CORS Headers** | Orígenes permitidos | Header `Access-Control-Allow-Origin` | **100% (Exitoso)** |
| **I-08: Rollback transaccional** | Consistencia de inventario | Stock previo === Stock posterior al fallo | **100% (Exitoso)** |
| **I-09: Audit Logs (Trigger)** | Trazabilidad forense | Inserción en `audit_logs` tras insert | **100% (Exitoso)** |
| **I-10: Cifrado bcrypt** | Hash seguro de contraseñas | Hash cumple prefijo de bcrypt (`$2a$`/`$2b$`) | **100% (Exitoso)** |
| **I-11: TOTP en Base de Datos** | Persistencia de Secreto | `totpSecret` presente e inicializado en BD | **100% (Exitoso)** |
| **I-12: Upload Storage** | CDN CDN Caching | HTTP Status `201` con URL pública | **100% (Exitoso)** |
| **I-13: Reglas Stock Bajo** | Cruce relacional de almacenes | Retorna JSON con lista de alertas | **100% (Exitoso)** |
| **I-14: Recomendación IA** | Match de insumos con menú | Retorna listado de ingredientes | **100% (Exitoso)** |
| **I-15: Supavisor Pooling** | Ejecución en paralelo | 5 consultas simultáneas sin Timeout | **100% (Exitoso)** |

---

## 3. Observaciones y Recomendaciones Técnicas

1. **Aislamiento Multi-Tenant (RLS):** Las políticas de seguridad a nivel de fila (*Row Level Security*) de Supabase están correctamente aplicadas en las tablas críticas. Los tests demostraron que ningún Tenant puede leer ni modificar beneficiarios o inventarios de otro Tenant, garantizando la seguridad en la nube (SaaS).
2. **Supavisor (PgBouncer):** Se recomienda usar la cadena de conexión con el parámetro `?pgbouncer=true` en ambientes de producción (Render / Vercel) para prevenir bloqueos de sockets cuando el frontend haga consultas altamente concurrentes.
3. **MFA y OTP:** El sistema WORM (Write-Once-Read-Many) para la tabla de códigos temporales de acceso asegura que un código sólo pueda usarse una vez y expire exactamente a los 2 minutos, previniendo ataques de repetición.
4. **Resiliencia ante Fallos e Interoperabilidad:** Se expandieron los escenarios de prueba para incluir múltiples aserciones negativas (tokens de seguridad incorrectos/expirados, cargas de archivos maliciosos en Storage, e inyecciones de datos corruptos). Los endpoints responden de manera segura con códigos de estado HTTP del estándar REST (400, 401, 403, 404, 409 y 429), evitando fugas de información interna en los mensajes de error.

