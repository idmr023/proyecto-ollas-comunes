@echo off
cd /d "%~dp0backend"
start /B node node_modules\ts-node\dist\bin.js src\server.ts
ping -n 4 127.0.0.1 >nul
node "%~dp0test-auth2.mjs"
taskkill /F /IM node.exe >nul 2>&1
