# Evidencia de instalacion y arranque en Android

Fecha de corte: 2026-07-09

Dispositivo detectado:

```text
sdk gphone64 x86 64 (mobile) - emulator-5554 - Android 16 (API 36)
```

## Comandos ejecutados

```bash
flutter devices --device-timeout 30
flutter install -d emulator-5554 --release
adb shell monkey -p com.ollascomunes.sigo_ollas -c android.intent.category.LAUNCHER 1
adb shell pidof com.ollascomunes.sigo_ollas
adb shell dumpsys window
```

Validacion debug contra backend local:

```bash
flutter build apk --debug --dart-define=APP_API_BASE_URL=http://10.0.2.2:4000
adb install -r build/app/outputs/flutter-apk/app-debug.apk
adb shell monkey -p com.ollascomunes.sigo_ollas -c android.intent.category.LAUNCHER 1
```

## Resultado

Instalacion:

```text
Installing app-release.apk to sdk gphone64 x86 64...
Uninstalling old version...
Installing build\app\outputs\flutter-apk\app-release.apk...
```

Arranque:

```text
Events injected: 1
```

Proceso activo:

```text
9970
```

Actividad enfocada:

```text
mCurrentFocus=Window{... com.ollascomunes.sigo_ollas/com.ollascomunes.sigo_ollas.MainActivity}
mFocusedApp=ActivityRecord{... com.ollascomunes.sigo_ollas/.MainActivity ...}
```

Capturas generadas:

- `docs/evidencias/emulador_inicio.png`: pantalla inicial con `SIGO-OLLAS` y
  boton `Comenzar`.
- `docs/evidencias/emulador_login.png`: pantalla de login luego de tocar
  `Comenzar`.
- `docs/evidencias/emulador_login_validacion.png`: validacion de formulario
  vacio con mensajes `Ingresa tu correo.` e `Ingresa tu contrasena.`.
- `docs/evidencias/debug_login_inicio.png`: pantalla de login debug apuntando a
  `http://10.0.2.2:4000`.
- `docs/evidencias/debug_after_login.png`: OTP recibido luego de autenticar con
  `debug.mobile@sigo.local`.
- `docs/evidencias/debug_after_otp.png`: dashboard abierto despues de verificar
  OTP `000000`.

## Conclusion

El APK release generado por `qa-gate.bat` se instala y arranca correctamente en
un emulador Android. Tambien navega desde la pantalla inicial hasta login y
muestra validaciones visuales correctas en el formulario.

El APK debug compilado contra `http://10.0.2.2:4000` valida login + OTP de punta
a punta con credenciales de desarrollo y usuario en memoria del backend. Queda
pendiente validar permisos de camara/galeria y sincronizacion contra backend con
base de datos real.
