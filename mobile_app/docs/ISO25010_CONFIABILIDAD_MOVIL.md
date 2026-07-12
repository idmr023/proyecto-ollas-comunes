# SIGO-OLLAS movil - Confiabilidad ISO/IEC 25010

Este documento define el cierre de confiabilidad para la app Flutter
`mobile_app`, con foco en uso de campo: red intermitente, backend lento,
recuperacion de acciones pendientes y validacion operativa antes de release.

## Alcance actual

La app cubre:

- Cache offline para lecturas HTTP `GET`.
- Cola offline para escrituras criticas que no requieren respuesta inmediata:
  - `POST /mobile/inventory/movements`
  - `POST /mobile/deliveries`
  - `POST /mobile/menu-plans/execute`
  - `POST /mobile/documents/upload`
- Sincronizacion manual desde la pestaña `Mas`.
- Pruebas unitarias de almacenamiento offline, serializacion de mutaciones y
  normalizacion de claves de cache.

Queda fuera de este tramo:

- Alta/edicion de beneficiarios offline con identidad temporal y reconciliacion.
- Resolucion automatica de conflictos entre mutaciones concurrentes.
- Persistencia de evidencias grandes fuera de `flutter_secure_storage`.

## Modelo ISO/IEC 25010 - Reliability

| Subcaracteristica | Objetivo | Evidencia esperada |
| --- | --- | --- |
| Maturity | Cero errores de analisis estatico y suite automatizada verde | `flutter analyze`, `flutter test` |
| Availability | La app permite consultar ultimo estado conocido sin red | Cache offline para endpoints `GET` |
| Fault tolerance | Las acciones criticas no se pierden ante caida de red | Cola offline de mutaciones |
| Recoverability | Las acciones pendientes se reintentan y salen de la cola | `ClienteHttp.sincronizarPendientes()` |
| MTBF | Tiempo promedio entre fallos operativos durante prueba de campo | Simulacion de sesiones con red intermitente |
| MTTR | Tiempo promedio de recuperacion luego de volver la red | Medicion de sincronizacion de cola |

## Metricas objetivo

| Metrica | Formula | Meta inicial |
| --- | --- | --- |
| Madurez | `controles de release aprobados / controles definidos` | `100%` en gate local |
| Disponibilidad | `(tiempo usable / tiempo total) * 100` | `>= 99%` en prueba local controlada |
| Fault tolerance | `acciones preservadas / acciones intentadas sin red` | `100%` para endpoints en cola |
| Recoverability | `acciones sincronizadas / acciones pendientes` | `>= 95%` al recuperar red |
| MTBF | `tiempo total de prueba / numero de fallos criticos` | `>= 60 min` en sesion piloto |
| MTTR | `suma tiempos de recuperacion / numero de recuperaciones` | `<= 2 min` con backend disponible |
| Lighthouse movil simulado | Promedio ponderado de performance, accesibilidad, buenas practicas y confiabilidad | `>= 90` |

## Lighthouse movil simulado

Flutter movil no se mide con Lighthouse real como una PWA. Para mantener una
metrica comparable se usa esta matriz:

| Categoria | Peso | Criterio | Puntaje objetivo |
| --- | ---: | --- | ---: |
| Performance percibida | 25% | Arranque, skeletons, navegacion sin bloqueo | 90 |
| Accesibilidad | 20% | Contraste, tamanos tactiles, labels visibles | 90 |
| Buenas practicas | 20% | Manejo de errores, timeouts, permisos, release config | 90 |
| Confiabilidad offline | 25% | Cache GET, cola POST, sincronizacion y mensajes claros | 90 |
| Testing | 10% | Unit/widget tests + flujos manuales documentados | 90 |

Puntaje simulado objetivo: `>= 90`.

## Escenarios de prueba manual

1. Iniciar sesion con backend disponible.
2. Abrir Dashboard, Inventario, Padron, Alertas, Menu IA y Calculadora para
   poblar cache.
3. Desconectar red o apagar backend.
4. Volver a abrir las pantallas ya visitadas; deben mostrar el ultimo estado
   conocido en lugar de bloquearse.
5. Sin red, registrar:
   - una entrega de raciones,
   - un movimiento de inventario,
   - una evidencia,
   - una aprobacion de menu.
6. Ir a `Mas` y verificar que aumenta `Sincronizar pendientes (N)`.
7. Restaurar red/backend.
8. Tocar `Sincronizar pendientes`.
9. Confirmar que la cola disminuye y que el backend refleja las acciones.

## Comandos de verificacion

```bash
cd mobile_app
dart format lib test
flutter analyze
flutter test
```

## Criterios de cierre de desarrollo movil

- `flutter analyze` sin issues.
- `flutter test` verde.
- APK release generado.
- Contrato OpenAPI actualizado para todos los endpoints consumidos.
- Pruebas automatizadas de cache offline, cola de mutaciones y recoverability.
- Reporte simulado Lighthouse/ISO generado por `tool/reporte_confiabilidad.dart`.

## Validaciones productivas recomendadas

- APK/AAB release firmado con keystore propio.
- Permisos Android/iOS validados en dispositivo fisico para camara y galeria.
- Prueba manual offline con backend real y evidencias de acciones encoladas,
  sincronizacion posterior, medicion MTTR y disponibilidad calculada.
