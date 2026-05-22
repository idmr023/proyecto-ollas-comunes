@echo off
cd /d "C:\Users\idmr_\OneDrive\Escritorio\proyecto-ollas-comunes\backend"
echo Starting server...
start /B node dist\server.js
ping -n 5 127.0.0.1 >nul
cd /d "C:\Users\idmr_\OneDrive\Escritorio\proyecto-ollas-comunes"
echo.
node test-beneficiaries.mjs
taskkill /F /IM node.exe >nul 2>&1
echo Done.
