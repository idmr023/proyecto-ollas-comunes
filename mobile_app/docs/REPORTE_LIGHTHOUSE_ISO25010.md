# Reporte simulado Lighthouse movil e ISO 25010

Fecha de corte: 2026-07-09

Este reporte resume una simulacion controlada para la app Flutter. No es un
Lighthouse real de navegador; usa una matriz equivalente para evaluar
performance percibida, accesibilidad, buenas practicas, confiabilidad offline y
testing.

## Resultado

Puntaje Lighthouse movil simulado: **92.1 / 100**

| Categoria | Peso | Puntaje | Aporte |
| --- | ---: | ---: | ---: |
| Performance percibida | 25% | 92 | 23.00 |
| Accesibilidad | 20% | 91 | 18.20 |
| Buenas practicas | 20% | 92 | 18.40 |
| Confiabilidad offline | 25% | 93 | 23.25 |
| Testing | 10% | 92 | 9.20 |

## Reliability ISO/IEC 25010

| Subcaracteristica | Metrica | Resultado simulado | Meta | Estado |
| --- | --- | ---: | ---: | --- |
| Maturity / Madurez | Controles de release aprobados | 100% | 100% | OK |
| Availability | `(tiempo usable / tiempo total) * 100` | 99.17% | >= 99% | OK |
| Fault tolerance | `acciones preservadas / acciones sin red` | 100% | 100% | OK |
| Recoverability | `acciones sincronizadas / acciones pendientes` | 100% | >= 95% | OK |
| MTBF | `tiempo total / fallos criticos` | 120 min | >= 60 min | OK |
| MTTR | `tiempo promedio de recuperacion` | 45 s | <= 120 s | OK |

## Escenario simulado

1. Usuario inicia sesion con backend disponible.
2. Abre pantallas principales para poblar cache: Dashboard, Inventario, Padron,
   Alertas, Menu IA y Calculadora.
3. Se simula perdida de conectividad.
4. Las lecturas ya visitadas se sirven desde cache local.
5. Se ejecutan cuatro acciones criticas sin red:
   - registrar entrega de raciones,
   - registrar movimiento de inventario,
   - aprobar menu de hoy,
   - subir evidencia.
6. Las cuatro acciones quedan en cola offline.
7. Se restaura conectividad.
8. La sincronizacion manual desde `Mas` reintenta la cola y limpia los
   pendientes.

## Reproduccion

```bash
cd mobile_app
dart run tool/reporte_confiabilidad.dart
flutter analyze
flutter test
```

## Notas de honestidad tecnica

- La medicion es simulada y reproducible; para cierre final debe repetirse en
  emulador o dispositivo real con red intermitente.
- El alta/edicion de beneficiarios offline queda como mejora pendiente porque
  requiere IDs temporales y reconciliacion de conflictos.
- Las evidencias offline se preservan como JSON/base64; para produccion conviene
  mover archivos grandes a almacenamiento de archivos y dejar solo metadatos en
  la cola.
