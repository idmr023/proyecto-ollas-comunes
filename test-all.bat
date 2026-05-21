@echo off
cd /d "%~dp0backend"
start /B node dist\server.js
ping -n 5 127.0.0.1 >nul
echo ========================================
echo Test 1: requireAuth - no token = 401?
echo ========================================
curl -s -o nul -w "HTTP %%{http_code}\n" http://localhost:4000/api/organizations
echo.
echo ========================================
echo Test 2: Login + GET /api/auth/me
echo ========================================
node "%~dp0test-auth2.mjs"
echo.
echo ========================================
echo Test 3: GET /api/auth/me with token
echo ========================================
node "%~dp0test-me.mjs"
taskkill /F /IM node.exe >nul 2>&1
