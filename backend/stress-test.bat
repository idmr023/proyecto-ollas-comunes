@echo off
chcp 65001 >nul
echo ============================================
echo  SIGO-OLLAS - Pruebas de Estrés
echo ============================================
echo.
echo Este script ejecuta pruebas de estrés con Artillery
echo y genera un reporte HTML.
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

echo.
echo [1/2] Ejecutando pruebas de estrés...
call npx artillery run stress-test.yml -o stress-test-report.json
if %ERRORLEVEL% neq 0 (
    echo ERROR: Fallaron las pruebas de estrés.
    exit /b 1
)

echo.
echo [2/2] Generando reporte HTML...
call npx artillery report stress-test-report.json --output stress-test-report.html

echo.
echo ============================================
echo  PRUEBAS COMPLETADAS
echo ============================================
echo.
echo Reporte HTML: backend\stress-test-report.html
echo Datos JSON:   backend\stress-test-report.json
echo.
echo Abre el HTML en tu navegador para ver los resultados.
echo.
pause
