@echo off
REM APK release contra el backend en Render (valor por defecto en lib/config/entorno/entorno.dart).
REM Para backend local en emulador: build-apk.bat http://10.0.2.2:4000

set "API_URL=%~1"
if "%API_URL%"=="" (
  flutter build apk --release
) else (
  flutter build apk --release --dart-define=APP_API_BASE_URL=%API_URL%
)

if %ERRORLEVEL% equ 0 (
  echo.
  echo APK generado en: build\app\outputs\flutter-apk\app-release.apk
)
