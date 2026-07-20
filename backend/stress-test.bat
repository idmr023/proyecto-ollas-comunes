@echo off
chcp 65001 >nul
echo ============================================
echo  SIGO-OLLAS - Pruebas de Estrés
echo ============================================
echo.
echo Este script ejecuta pruebas de estrés con Artillery,
echo genera un reporte HTML y limpia DNIs inválidos.
echo.
echo Requisitos:
echo   1. El backend debe estar corriendo en http://localhost:4000
echo   2. Las dependencias de backend instaladas (npm install)
echo.
echo Para iniciar el backend en otra terminal:
echo   cd backend ^&^& npm run dev
echo.
echo ============================================
echo.
set /p CONTINUE=Presiona Enter para continuar (o Ctrl+C para cancelar)...

set ARTILLERY_OK=0
echo.
echo [1/3] Ejecutando pruebas de estrés...
call npx artillery run stress-test.yml -o stress-test-report.json
if %ERRORLEVEL% equ 0 (
    set ARTILLERY_OK=1
    echo OK: Pruebas de estrés completadas.
) else (
    echo ADVERTENCIA: Las pruebas de estrés fallaron, pero se continuara con la limpieza.
)

echo.
echo [2/3] Generando reporte HTML...
call npx artillery report stress-test-report.json --output stress-test-report.html 2>nul

echo.
echo [3/3] Limpiando DNIs inválidos generados durante la prueba...
call node scripts/cleanup-invalid-dnis.mjs --apply

echo.
echo ============================================
if "%ARTILLERY_OK%"=="1" (
    echo  PRUEBAS COMPLETADAS
) else (
    echo  PRUEBAS COMPLETADAS CON ERRORES
)
echo ============================================
echo.
echo Reporte HTML: backend\stress-test-report.html
echo Datos JSON:   backend\stress-test-report.json
echo.
echo Abre el HTML en tu navegador para ver los resultados.
echo.
pause
