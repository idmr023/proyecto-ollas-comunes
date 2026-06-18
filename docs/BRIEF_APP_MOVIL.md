# Brief — App Móvil SIGO-OLLAS

> Documento de referencia que alinea qué construimos y por qué, antes de tocar código.
> Complementa a [PLAN_APP_MOVIL_FLUTTER.md](PLAN_APP_MOVIL_FLUTTER.md). Idioma: **español**.

---

## 1. Visión
Una app móvil que pone la gestión de la olla común **en el bolsillo de quien la opera en campo**:
registrar inventario, atender el padrón y entregar raciones desde el celular, sin depender de
una computadora ni de papel.

## 2. Problema que resuelve
Las lideresas y supervisores operan la olla **en terreno**, no en escritorio. El mobile web
actual ayuda, pero una app nativa ofrece mejor experiencia táctil, **uso offline parcial**,
acceso a **cámara** para evidencias y notificaciones. Hoy el registro sigue siendo lento y
propenso a errores.

## 3. Objetivo
Digitalizar las operaciones diarias de la olla común en una app fluida, confiable y en español,
conectada a la API de SIGO-OLLAS, con seguridad multi-tenant.

## 4. Usuarios y roles
| Rol | Uso principal en la app |
|-----|-------------------------|
| **Lideresa de olla** | Inventario, padrón, registrar entregas, evidencias — usuario primario en campo |
| **Supervisor** | Consulta de dashboard, alertas y reportes de varias ollas |
| **Admin municipal** | Visión consolidada del tenant (más de gestión que de campo) |

*Contexto real:* usuarios no necesariamente técnicos, dispositivos de gama media/baja,
conectividad intermitente.

## 5. Propuesta de valor (diferenciador)
- **Rápida y táctil**: flujos de 2-3 toques para tareas frecuentes (registrar movimiento, marcar entrega).
- **Cámara integrada** para evidencias (actas, fotos de entrega).
- **Feedback claro** con modales (éxito/error/confirmación), no SnackBars.
- **Segura**: login con TOTP, JWT, aislamiento por organización (RLS/tenant).

## 6. Alcance del MVP (por fases)
**Incluye:**
1. Autenticación (email+contraseña → TOTP → sesión persistente)
2. Dashboard del tenant (KPIs/resumen)
3. Inventario (listar, registrar movimientos, alertas de stock)
4. Padrón de beneficiarios (buscar, ficha con perfil de salud, alta/edición)
5. Fases posteriores: menú-IA, alertas, evidencias (cámara)

**Fuera de alcance (por ahora):**
- Panel administrativo completo (sigue en el web)
- Reportería avanzada / exportaciones
- Pagos, modo offline completo con sincronización compleja, mensajería interna
- iOS pulido para tienda (foco inicial Android; arquitectura multiplataforma desde el día 1)

## 7. Plataforma y stack
- **Flutter** (Android primero, base multiplataforma).
- Clean architecture + Riverpod + freezed + getIt + AutoRoute + Dio.
- Consume la **API REST v1** del backend Express existente (multi-tenant, JWT).
- Todo el código y documentación en **español**.

## 8. Requisitos no funcionales
- **Rendimiento**: arranque y navegación fluidos en gama media; árboles de widgets planos, `const`.
- **Seguridad**: JWT en `secure_storage`, expiración/401 → re-login, sin secretos en el repo.
- **Usabilidad**: español claro, accesible, mínimos toques, estados de carga/error siempre visibles.
- **Resiliencia**: manejo de errores de red sin crashear; mensajes entendibles.
- **Mantenibilidad**: estándares de `global.mdc` (SOLID, clases pequeñas, una exportación por archivo, tests).

## 9. Integraciones
- API SIGO-OLLAS (`/api/v1/...`): auth, dashboard, inventario, beneficiarios, alertas, sugerencias, entregas, documentos.
- Cámara/galería del dispositivo (evidencias).
- Almacenamiento seguro local (sesión).

## 10. Métricas de éxito
- Tiempo para registrar un movimiento de inventario < ~15 s.
- Login + acceso a dashboard sin fricción (< 3 pantallas).
- 0 fugas de datos entre organizaciones (aislamiento tenant verificado).
- Cobertura de tests por módulo (API + Flutter).

## 11. Supuestos y riesgos
- Flutter SDK disponible (verificado: Dart 3.11.1 stable, Windows).
- TOTP requiere app autenticadora externa — confirmar UX móvil en Fase 1.
- Conectividad intermitente: el MVP asume online; offline robusto queda para después.
- Base URL de API configurable por entorno (emulador vs dispositivo físico vs Render).
