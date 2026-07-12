@echo off
setlocal

echo == SIGO-OLLAS mobile QA gate ==

echo.
echo [1/5] Formato Dart
call dart format --set-exit-if-changed lib test tool
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo [2/5] Analisis estatico
call flutter analyze
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo [3/5] Pruebas automatizadas
call flutter test
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo [4/5] Reporte Lighthouse movil / ISO 25010
call dart run tool\reporte_confiabilidad.dart
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo [5/5] Build APK release
call flutter build apk --release
if %ERRORLEVEL% neq 0 exit /b %ERRORLEVEL%

echo.
echo QA gate OK.
echo APK: build\app\outputs\flutter-apk\app-release.apk
