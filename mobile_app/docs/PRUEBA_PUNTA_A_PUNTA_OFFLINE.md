# Prueba punta a punta offline

Objetivo: validar que la app movil de SIGO-OLLAS es usable en campo con red
intermitente y que cumple los criterios de confiabilidad ISO/IEC 25010 definidos
para el proyecto.

## Preparacion

1. Levantar backend local o usar Render.
2. Instalar la app en emulador/dispositivo.
3. Iniciar sesion con un usuario valido.
4. Confirmar que la pantalla `Mas` muestra `Datos sincronizados`.

Para compilar contra backend local:

```bash
build-apk.bat http://10.0.2.2:4000
```

Para dispositivo fisico en LAN, reemplazar por la IP del PC:

```bash
build-apk.bat http://192.168.x.x:4000
```

## Flujo online inicial

Marcar cada punto como OK/FAIL:

- [ ] Login + verificacion OTP.
- [ ] Dashboard carga resumen.
- [ ] Inventario lista insumos.
- [ ] Padron lista beneficiarios.
- [ ] Alertas carga items o estado vacio.
- [ ] Calculadora lista recetas y calcula preparacion.
- [ ] Menu IA muestra sugerencias.
- [ ] Evidencias abre camara o galeria.

## Simulacion sin red

Apagar Wi-Fi/datos del dispositivo o detener temporalmente el backend.

- [ ] Dashboard muestra ultimo estado conocido.
- [ ] Inventario muestra ultimo estado conocido.
- [ ] Padron muestra ultimo estado conocido.
- [ ] Alertas muestra ultimo estado conocido.
- [ ] Registrar movimiento de inventario queda en cola.
- [ ] Registrar entrega de raciones queda en cola.
- [ ] Aprobar menu del dia queda en cola.
- [ ] Subir evidencia queda en cola.
- [ ] La pantalla `Mas` incrementa `Sincronizar pendientes (N)`.

## Recuperacion

Restaurar Wi-Fi/datos o levantar nuevamente el backend.

- [ ] Tocar `Sincronizar pendientes (N)`.
- [ ] La app muestra modal de exito.
- [ ] El contador vuelve a cero.
- [ ] El backend refleja las acciones sincronizadas.
- [ ] No se duplica una entrega ya sincronizada.

Prueba adicional de autosync:

- [ ] Volver a dejar una accion pendiente sin red.
- [ ] Restaurar red.
- [ ] Abrir una pantalla que haga una lectura exitosa, por ejemplo Dashboard.
- [ ] Confirmar que la cola se sincroniza sin usar el boton manual.

## Metricas ISO/IEC 25010

Completar luego de la prueba:

| Metrica | Valor medido | Meta | Resultado |
| --- | ---: | ---: | --- |
| Disponibilidad | ____% | >= 99% | ____ |
| Tolerancia a fallos | ____% | 100% | ____ |
| Recoverability | ____% | >= 95% | ____ |
| MTBF | ____ min | >= 60 min | ____ |
| MTTR | ____ s | <= 120 s | ____ |

## Evidencia esperada

- Captura de `Mas` con pendientes acumulados.
- Captura de `Mas` luego de sincronizar en cero.
- Salida de `flutter analyze`.
- Salida de `flutter test`.
- Salida de `dart run tool/reporte_confiabilidad.dart`.
- Salida de `qa-gate.bat` cuando aplique.
- APK generado en `build/app/outputs/flutter-apk/app-release.apk`.
