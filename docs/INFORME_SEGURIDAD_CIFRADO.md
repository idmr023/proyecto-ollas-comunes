# Informe Técnico de Seguridad y Cifrado de Datos

## Información del Documento

| Campo | Detalle |
|-------|---------|
| Proyecto | SIGO-Ollas - Sistema de Gestión de Ollas Comunes |
| Versión | 1.0 |
| Fecha | Mayo 2026 |
| Clasificación | Confidencial |

---

## 1. Introducción

Este informe detalla las medidas de seguridad implementadas en el proyecto SIGO-Ollas, enfocándose en los mecanismos de cifrado, confidencialidad y trazabilidad de la información. El sistema gestiona datos sensibles de beneficiarios de ollas comunes, por lo que la protección de datos es un requisito crítico.

---

## 2. Mecanismos de Cifrado

### 2.1 Cifrado en Tránsito (TLS 1.3)

Todo el tráfico entre el cliente (navegador) y el servidor se cifra mediante **TLS 1.3**, el protocolo criptográfico más reciente y seguro disponible.

| Propiedad | Configuración |
|-----------|---------------|
| Protocolo | TLS 1.3 |
| Certificado | Automático vía Vercel (Let's Encrypt) |
| Cifrado simétrico | AES-256-GCM |
| Intercambio de claves | ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) |
| Perfect Forward Secrecy | ✅ Habilitado |

**Implementación**: Vercel gestiona automáticamente los certificados TLS para el frontend. El backend también se despliega forzando HTTPS.

### 2.2 Cifrado de Contraseñas (bcrypt)

Las contraseñas de los usuarios se almacenan utilizando **bcrypt** con un factor de costo de 12.

```
Hash = bcrypt(password, cost = 12, salt = random 16 bytes)
```

| Propiedad | Valor |
|-----------|-------|
| Algoritmo | bcrypt (Blowfish) |
| Cost factor | 12 (~250ms por hash) |
| Salt | 16 bytes aleatorios por contraseña |
| Output | 60 caracteres en formato Modular Crypt Format |

**Justificación**: bcrypt es un algoritmo de hashing adaptativo que incluye un salt automático y permite ajustar el factor de costo para mantenerse seguro frente al aumento de potencia computacional.

**Código de referencia**: `backend/src/lib/auth.ts`

### 2.3 Cifrado en Reposo (AES-256 via pgcrypto)

Los datos sensibles almacenados en PostgreSQL se cifran utilizando la extensión **pgcrypto** con **AES-256**.

| Propiedad | Configuración |
|-----------|---------------|
| Algoritmo | AES-256 |
| Modo de operación | GCM (Galois/Counter Mode) |
| Gestión de claves | Variable de entorno `DB_ENCRYPTION_KEY` |
| Datos cifrados | Información de salud, DNI (futuro) |

```sql
-- Ejemplo de cifrado con pgcrypto
INSERT INTO beneficiaries (dni_encrypted)
VALUES (pgp_sym_encrypt('12345678', current_setting('app.encryption_key')));
```

### 2.4 Cifrado de Tokens JWT

Los tokens de autenticación utilizan **JWT (JSON Web Tokens)** firmados con **HS256**.

| Propiedad | Configuración |
|-----------|---------------|
| Algoritmo de firma | HS256 (HMAC-SHA256) |
| Clave secreta | `SUPABASE_JWT_SECRET` (512 bits) |
| Expiración | 24 horas (sesión), 7 días (refresh token) |
| Contenido | `sub`, `role`, `tenant_id`, `iat`, `exp` |

**Payload del JWT**:
```json
{
  "sub": "uuid-del-usuario",
  "role": "admin_municipal",
  "tenant_id": "uuid-del-tenant",
  "iat": 1715000000,
  "exp": 1715086400
}
```

---

## 3. Confidencialidad de la Información

### 3.1 Row Level Security (RLS)

Supabase implementa **Row Level Security** para garantizar el aislamiento entre tenants (organizaciones). Cada usuario solo puede acceder a los datos de su propia organización.

```sql
-- Política RLS para la tabla beneficiaries
CREATE POLICY tenant_isolation ON beneficiaries
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### 3.2 Control de Acceso Basado en Roles (RBAC)

El sistema implementa tres roles con distintos niveles de acceso:

| Rol | Permisos | Acceso a Datos |
|-----|----------|----------------|
| `admin_municipal` | CRUD completo, reportes, configuración | Todos los módulos del tenant |
| `lideresa_olla` | Gestión de beneficiarios, inventario, menús | Solo su olla común |
| `supervisor` | Vista de reportes, alertas | Solo lectura en todos los módulos |

### 3.3 Principio de Mínimo Privilegio

Cada endpoint valida que el usuario autenticado tenga el rol adecuado antes de procesar la solicitud:

```typescript
// Middleware de autorización
function authorize(...roles: string[]) {
  return (req, res, next) => {
    const userRole = req.user?.role
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    next()
  }
}
```

---

## 4. Trazabilidad

### 4.1 Sistema de Auditoría (Tabla `audit_logs`)

Todas las operaciones críticas sobre la base de datos quedan registradas en la tabla `audit_logs`:

```sql
CREATE TABLE audit_logs (
    id bigserial PRIMARY KEY,
    table_name varchar(100) NOT NULL,
    record_id uuid NOT NULL,
    action_type varchar(20) NOT NULL CHECK (action_type IN ('insert', 'update', 'delete')),
    changed_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);
```

| Campo | Descripción |
|-------|-------------|
| `table_name` | Nombre de la tabla afectada |
| `record_id` | ID del registro modificado |
| `action_type` | Tipo de operación (insert/update/delete) |
| `changed_by` | ID del usuario que realizó la operación |
| `changed_at` | Marca de tiempo de la operación |

### 4.2 Logs del Backend

El backend implementa logs estructurados con los siguientes niveles:

| Nivel | Uso | Ejemplo |
|-------|-----|---------|
| `ERROR` | Errores críticos del sistema | Fallo de conexión a BD |
| `WARN` | Eventos anómalos no críticos | Intento de acceso no autorizado |
| `INFO` | Operaciones exitosas importantes | Creación de usuario, login exitoso |
| `DEBUG` | Información detallada (solo desarrollo) | Consultas SQL ejecutadas |

### 4.3 Seguimiento de Sesiones

Cada sesión de usuario se registra con:

- Dirección IP del cliente
- User-Agent del navegador
- Timestamp de inicio y fin de sesión
- Acciones realizadas durante la sesión

### 4.4 Trazabilidad en la Aplicación

En el frontend, todas las operaciones que modifican datos registran:

1. **Quién**: ID del usuario autenticado vía JWT
2. **Qué**: Tipo de operación y entidad afectada
3. **Cuándo**: Timestamp preciso de la operación
4. **Dónde**: Endpoint o módulo desde el que se ejecutó

---

## 5. Estándares y Buenas Prácticas Aplicadas

| Estándar | Práctica Aplicada | Evidencia |
|----------|------------------|-----------|
| OWASP A2 (Broken Authentication) | bcrypt + JWT + sesiones | Repositorio `/backend/src/modules/auth/` |
| OWASP A3 (Injection) | Consultas parametrizadas | Supabase client con query builders |
| OWASP A7 (XSS) | CSP + escape automático | Next.js rendering + helmet headers |
| OWASP A1 (Broken Access Control) | RBAC + RLS | Políticas en BD + middleware de autorización |
| ISO 27001 A.12.4.1 | Logging y auditoría | Tabla `audit_logs` + console.error |
| ISO 27001 A.8.2.1 | Cifrado de datos | AES-256 + bcrypt |
| NIST SP 800-53 AC-6 | Mínimo privilegio | Roles con permisos específicos |
| NIST SP 800-53 AU-3 | Registro de auditoría | Logs estructurados |

---

## 6. Justificación Técnica

### 6.1 Elección de TLS 1.3 sobre TLS 1.2

TLS 1.3 ofrece:
- Reducción del handshake (1 RTT vs 2 RTT)
- Eliminación de algoritmos inseguros (RC4, 3DES)
- Perfect Forward Secrecy obligatorio
- Mejor rendimiento general

### 6.2 Elección de bcrypt sobre SHA-256

| Algoritmo | Ventaja | Desventaja |
|-----------|---------|------------|
| SHA-256 | Rápido, ampliamente disponible | Vulnerable a ataques de fuerza bruta con GPU |
| bcrypt | Costo ajustable, salt incorporado | Más lento (deliberadamente) |
| **Decisión**: bcrypt | Seguridad a futuro | Costo computacional aceptable |

### 6.3 Elección de JWT vs Sesiones Tradicionales

| Aspecto | JWT | Sesiones |
|---------|-----|----------|
| Escalabilidad | Sin estado (stateless) | Requiere almacenamiento |
| Multi-tenant | Fácil (claims en payload) | Complejo |
| Revocación | Compleja (requiere blacklist) | Inmediata |
| **Decisión**: JWT | Escalabilidad + integración con Supabase | Refresh tokens para mitigar revocación |

### 6.4 Arquitectura de Seguridad General

```
[Cliente] <-- TLS 1.3 --> [Vercel (Frontend)] <-- TLS 1.3 --> [Backend API] <-- TLS 1.3 --> [Supabase/PostgreSQL]
     |                          |                           |                        |
     | JWT + RBAC               | CSP + Helmet              | Auth middleware         | RLS + AES-256
     |                          |                           | Rate limiting           | Auditoría
```

---

## 7. Referencias

- OWASP Top 10 (2021): https://owasp.org/www-project-top-ten/
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- NIST SP 800-53 Rev. 5: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- ISO/IEC 27001:2022
- Supabase Auth & RLS: https://supabase.com/docs/guides/auth
- bcrypt paper (Provos & Mazières, 1999)
- RFC 8446 - TLS 1.3: https://datatracker.ietf.org/doc/html/rfc8446
