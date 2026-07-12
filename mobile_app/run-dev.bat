@echo off
REM Desarrollo local: backend en localhost:4000 visto desde el emulador Android.
REM Requiere tener el backend corriendo: cd ..\backend && npm run dev

flutter run --dart-define=APP_API_BASE_URL=http://10.0.2.2:4000 %*
