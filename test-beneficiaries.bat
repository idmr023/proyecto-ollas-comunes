@echo off
cd /d "C:\Users\idmr_\OneDrive\Escritorio\proyecto-ollas-comunes\backend"
start /B node dist\server.js
ping -n 5 127.0.0.1 >nul
cd /d "C:\Users\idmr_\OneDrive\Escritorio\proyecto-ollas-comunes"
echo.
node test-all.mjs
echo.
echo === Test: GET /api/beneficiaries/conditions ===
node -e "fetch('http://localhost:4000/api/beneficiaries/conditions',{headers:{Authorization:'Bearer '+(JSON.parse(localStorage.getItem('auth-storage')||'{}').state?.token||'')}}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d,null,2))).catch(e=>console.error(e))" 2>nul || echo "No browser - testing via curl"
cmd /c "curl -s -X POST http://localhost:4000/api/auth/login -H \"Content-Type: application/json\" -d \"{\\\"email\\\":\\\"admin@ollascomunes.pe\\\",\\\"password\\\":\\\"admin123\\\"}\"" > login.json
type login.json
echo.
cmd /c "curl -s http://localhost:4000/api/beneficiaries/conditions -H \"Authorization: Bearer REPLACE_ME\"" 2>&1
taskkill /F /IM node.exe >nul 2>&1
