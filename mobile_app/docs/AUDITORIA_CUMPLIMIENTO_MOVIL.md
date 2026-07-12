# Auditoria de cumplimiento movil

Fecha de corte: 2026-07-09

Objetivo evaluado: dejar la app movil usable de punta a punta, con offline,
polish visual, testing, Lighthouse simulado mayor a 90 y pruebas de
confiabilidad ISO/IEC 25010.

## Evidencia automatizada

| Requisito | Evidencia | Estado |
| --- | --- | --- |
| App compila | `flutter build apk --release` genera `build/app/outputs/flutter-apk/app-release.apk` | Cumplido |
| Analisis estatico | `flutter analyze` sin issues | Cumplido |
| Pruebas automatizadas | `flutter test` con 32 tests | Cumplido |
| Gate reproducible | `qa-gate.bat` ejecuta formato, analyze, tests, reporte y build | Cumplido |
| Offline GET | `test/core/red/cliente_http_offline_test.dart` valida cache ante error de red | Cumplido |
| Offline mutaciones | Tests validan cola para endpoints criticos | Cumplido |
| Recoverability | Tests validan `sincronizarPendientes()`, limpieza de cola y autosync oportunista tras recuperar red | Cumplido |
| UX de sincronizacion | `test/features/mas/pagina_mas_test.dart` valida estado sincronizado y contador de pendientes | Cumplido |
| Lighthouse simulado > 90 | `tool/reporte_confiabilidad.dart` reporta 92.1 | Cumplido |
| ISO 25010 Reliability | `docs/REPORTE_LIGHTHOUSE_ISO25010.md` y script reportan madurez, disponibilidad, tolerancia, recoverability, MTBF y MTTR | Cumplido simulado |
| Acta de cierre | `docs/ACTA_CIERRE_MOVIL.md` mapea cada requisito del objetivo con evidencia | Cumplido |
| APK instalable | APK release generado, 50.8 MB aprox. | Cumplido |
| Instalacion en Android | `docs/EVIDENCIA_EMULADOR_ANDROID.md` confirma install release en `emulator-5554` | Cumplido |
| Arranque en Android | `docs/EVIDENCIA_EMULADOR_ANDROID.md` confirma proceso activo y `MainActivity` enfocada | Cumplido |
| Navegacion inicial | `docs/evidencias/emulador_inicio.png` y `docs/evidencias/emulador_login.png` confirman paso de bienvenida a login | Cumplido |
| Validacion de login | `docs/evidencias/emulador_login_validacion.png` confirma errores visibles para formulario vacio | Cumplido |
| Credenciales debug | `docs/CREDENCIALES_DEBUG.md` documenta login dev protegido por `DEBUG_AUTH_ENABLED` y `NODE_ENV !== production`; backend compila | Implementado |
| Login debug en Android | `docs/evidencias/debug_after_otp.png` confirma dashboard luego de login + OTP contra backend local | Cumplido |

## Evidencia funcional implementada

| Flujo | Archivo principal | Estado |
| --- | --- | --- |
| Login + OTP | `features/auth` | Implementado |
| Dashboard | `features/dashboard` | Implementado |
| Inventario + movimientos | `features/inventario` | Implementado |
| Padron + entregas | `features/padron` | Implementado |
| Alertas | `features/alertas` | Implementado |
| Calculadora | `features/calculadora` | Implementado |
| Menu IA + aprobacion | `features/menu_ia` | Implementado |
| Evidencias camara/galeria | `features/evidencias` | Implementado |
| Estado de sincronizacion | `features/mas/presentation/pagina_mas.dart` | Implementado |
| Autosync al volver la red | `core/red/cliente_http.dart` | Implementado |

## Validaciones productivas recomendadas

Estos puntos no bloquean el cierre de desarrollo solicitado; son validaciones
recomendadas antes de operar con usuarios reales, porque dependen de dispositivo,
credenciales productivas y backend con datos reales:

- Confirmar login contra backend local con BD accesible y usuario real; el modo
  debug con usuario en memoria ya fue validado en emulador.
- Confirmar permisos de camara/galeria en dispositivo.
- Confirmar que el backend refleja las mutaciones sincronizadas.
- Medir MTBF/MTTR con cronometraje real de sesion piloto.

## Riesgos residuales

- Alta/edicion de beneficiarios offline no esta encolada porque requiere IDs
  temporales y reconciliacion de conflictos.
- Evidencias offline se preservan como base64 en cola; para produccion conviene
  mover archivos grandes a almacenamiento de archivos.
- La firma release real requiere crear `android/key.properties` con un keystore
  propio; sin ese archivo se usa firma debug para desarrollo.
