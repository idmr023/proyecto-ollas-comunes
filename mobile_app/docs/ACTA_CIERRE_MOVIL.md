# Acta de cierre movil

Fecha de cierre: 2026-07-09

Objetivo: dejar la app movil usable de punta a punta, con offline, polish
visual, testing, Lighthouse simulado mayor a 90 y pruebas de confiabilidad
ISO/IEC 25010. Para desarrollo se habilitan credenciales debug protegidas por
flags que no funcionan en produccion.

## Resultado de cierre

| Requisito | Evidencia actual | Estado |
| --- | --- | --- |
| App movil usable de punta a punta | Login + OTP validado en emulador; dashboard abre; flujos implementados para dashboard, inventario, padron, alertas, calculadora, menu IA, evidencias y mas | Cumplido |
| Offline para lecturas | `ClienteHttp` guarda cache de `GET` y responde desde cache ante error de red | Cumplido |
| Offline para acciones criticas | Cola offline para movimientos de inventario, entregas, aprobacion de menu y subida de evidencias | Cumplido |
| Sincronizacion | `sincronizarPendientes()` y autosync oportunista tras recuperar red | Cumplido |
| UX offline | Pantalla `Mas` muestra estado sincronizado, pendientes y boton de sincronizacion | Cumplido |
| Polish visual | Tema, estados vacio/error/carga, tarjetas, navegacion inferior y evidencias de pantallas en emulador | Cumplido |
| Testing | `qa-gate.bat` ejecuta formato, analyze, tests, reporte ISO y build release | Cumplido |
| Lighthouse simulado > 90 | `tool/reporte_confiabilidad.dart` reporta 92.1 | Cumplido |
| ISO 25010 - madurez | Gate completo aprobado: formato, analisis estatico y pruebas | Cumplido |
| ISO 25010 - disponibilidad | Simulacion reporta 99.17% | Cumplido |
| ISO 25010 - tolerancia a fallos | Simulacion y tests preservan 4/4 acciones criticas sin red | Cumplido |
| ISO 25010 - recoverability | Simulacion y tests sincronizan 4/4 pendientes | Cumplido |
| ISO 25010 - MTBF | Simulacion reporta 120 min | Cumplido |
| ISO 25010 - MTTR | Simulacion reporta 45 s | Cumplido |
| Credenciales debug | `docs/CREDENCIALES_DEBUG.md` documenta correo, password, OTP y flags seguros | Cumplido |
| APK instalable | `flutter build apk --release` genera `build/app/outputs/flutter-apk/app-release.apk` | Cumplido |

## Comandos de verificacion

Ultima verificacion local:

```text
backend npm run build: OK
mobile qa-gate.bat: OK
flutter analyze: No issues
flutter test: 32 tests passed
Lighthouse movil simulado: 92.1
APK release: build/app/outputs/flutter-apk/app-release.apk
```

## Evidencias

- `docs/evidencias/debug_after_otp.png`: login + OTP y dashboard en emulador.
- `docs/EVIDENCIA_EMULADOR_ANDROID.md`: instalacion, arranque y validacion de
  pantallas.
- `docs/REPORTE_LIGHTHOUSE_ISO25010.md`: reporte simulado Lighthouse/ISO.
- `docs/ISO25010_CONFIABILIDAD_MOVIL.md`: definicion de confiabilidad.
- `docs/CREDENCIALES_DEBUG.md`: credenciales y flags de desarrollo.

## Limites conocidos fuera del cierre

- Para produccion conviene mover evidencias grandes desde JSON/base64 hacia
  almacenamiento de archivos.
- Alta/edicion de beneficiarios offline con IDs temporales queda como mejora
  futura por requerir reconciliacion de conflictos.
- Firma release productiva requiere `android/key.properties` con keystore propio;
  sin ese archivo se usa firma debug para desarrollo.
