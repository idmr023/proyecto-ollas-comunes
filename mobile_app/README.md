# SIGO-OLLAS — App Móvil (Flutter)

App móvil de **SIGO-OLLAS** para operar la olla común en campo: inventario, padrón
de beneficiarios, entregas y evidencias, conectada a la API REST del backend.

Todo el código y la documentación están en **español**, siguiendo los estándares de
`awtu/.cursor/rules/global.mdc` (clean architecture, SOLID, funciones cortas).

---

## Stack

| Área | Tecnología |
|------|------------|
| Framework | Flutter (Android primero, base multiplataforma) |
| Estado | Riverpod + estados inmutables con `freezed` |
| Inyección de dependencias | `get_it` |
| Navegación | `auto_route` |
| Red | `dio` (cliente HTTP con JWT) |
| Sesión | `flutter_secure_storage` |
| Tipografía | Inter (`google_fonts`) |
| Cámara/galería | `image_picker` |

## Arquitectura (clean, *feature-first*)

```
lib/
├── main.dart                 → arranque: DI + tema + router
├── config/
│   ├── entorno/              → URL base de la API (configurable)
│   ├── inyeccion/            → registro de dependencias (getIt)
│   └── router/               → rutas (AutoRoute)
├── core/
│   ├── tema/                 → paleta, tipografía y ThemeData
│   ├── constantes/           → espaciados, radios, duraciones
│   ├── red/                  → ClienteHttp (Dio) y tipo Resultado
│   ├── errores/              → excepciones de dominio
│   └── sesion/               → almacén seguro del JWT
├── shared/widgets/           → widgets reutilizables (modales, estados, nav)
└── features/                 → un módulo por funcionalidad
    ├── auth/                 → login + verificación TOTP
    ├── dashboard/            → inicio (resumen del día)
    ├── inventario/           → lista, detalle y movimientos
    ├── padron/               → beneficiarios (CRUD)
    ├── alertas/              → alertas operativas
    ├── menu_ia/              → sugerencias de menú
    ├── evidencias/           → subida de fotos
    ├── mas/                  → perfil y cierre de sesión
    └── home/                 → shell con la barra de navegación
```

Cada feature se divide en `data/` (API + repositorio), `domain/` (entidades y
contratos) y `presentation/` (controllers Riverpod, estados freezed y pantallas).

## Requisitos

- Flutter SDK (Dart >= 3.11).
- Un emulador Android o dispositivo físico.
- El backend de SIGO-OLLAS accesible (local en `:4000` o el desplegado en Render).

## Cómo ejecutar

```bash
cd mobile_app
flutter pub get
dart run build_runner build --delete-conflicting-outputs   # genera freezed + auto_route
flutter run
```

### URL de la API por entorno

La URL base se define en compilación con `--dart-define`. Por defecto apunta al
backend desplegado en Render (`https://proyecto-ollas-comunes.onrender.com`).

```bash
# Emulador Android contra el backend local
flutter run --dart-define=APP_API_BASE_URL=http://10.0.2.2:4000

# Dispositivo físico en la misma red que el PC
flutter run --dart-define=APP_API_BASE_URL=http://192.168.x.x:4000

# Producción (valor por defecto, no requiere flag)
flutter run
```

> El prefijo `/api` lo agrega el cliente HTTP automáticamente.

## Flujo de autenticación

1. **Login** (`POST /api/auth/login`): correo + contraseña.
2. **Verificación TOTP** (`POST /api/auth/verify-otp`): código de 6 dígitos de la app
   autenticadora → devuelve el JWT, que se guarda cifrado en el dispositivo.
3. Las siguientes peticiones envían `Authorization: Bearer <jwt>`. Un `401` cierra la
   sesión y regresa al login automáticamente.

## Generación de código

Tras editar entidades `freezed` o agregar pantallas con `@RoutePage`, regenera:

```bash
dart run build_runner build --delete-conflicting-outputs
```

## Pruebas

```bash
flutter analyze   # análisis estático (sin issues)
flutter test      # pruebas unitarias y de widgets
dart run tool/reporte_confiabilidad.dart
```

En Windows puedes ejecutar todo el gate de calidad con:

```bash
qa-gate.bat
```

Ese comando verifica formato, analisis, pruebas, reporte Lighthouse movil/ISO
25010 y build APK release.

## Offline y sincronizacion

La app conserva el ultimo resultado exitoso de las lecturas `GET` y encola
acciones criticas cuando no hay red:

- movimientos de inventario,
- entrega de raciones,
- aprobacion de menu del dia,
- subida de evidencias.

En la pestana **Mas** aparece el estado de sincronizacion y el boton
`Sincronizar pendientes (N)`. Al recuperar conexion, ese boton reintenta la cola
y limpia las acciones confirmadas por el backend.

## Reporte Lighthouse movil / ISO 25010

Flutter movil no usa Lighthouse real de navegador. Para este proyecto se deja un
reporte simulado reproducible con ISO/IEC 25010 Reliability:

```bash
dart run tool/reporte_confiabilidad.dart
```

El reporte documentado vive en
[`docs/REPORTE_LIGHTHOUSE_ISO25010.md`](docs/REPORTE_LIGHTHOUSE_ISO25010.md).

## Build APK

Para generar APK release usando el backend por defecto:

```bash
build-apk.bat
```

Para apuntar a un backend local desde emulador:

```bash
build-apk.bat http://10.0.2.2:4000
```

Para dispositivo fisico en la misma red usa la IP LAN del PC:

```bash
build-apk.bat http://192.168.x.x:4000
```

Android permite trafico HTTP claro para desarrollo local. El backend por defecto
de produccion sigue usando HTTPS.

### Firma release real

Si existe `android/key.properties`, Gradle firma con keystore real. Si no existe,
usa firma debug como fallback de desarrollo.

Ejemplo de `android/key.properties`:

```properties
storeFile=C:\\ruta\\sigo-ollas-release.jks
storePassword=********
keyAlias=sigo-ollas
keyPassword=********
```

`android/key.properties` esta ignorado por git para no filtrar credenciales.

## Contrato de la API

Los endpoints que consume la app están documentados en
[`../docs/openapi-mobile.yaml`](../docs/openapi-mobile.yaml) (OpenAPI 3.0).
