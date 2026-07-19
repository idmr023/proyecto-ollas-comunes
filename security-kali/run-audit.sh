#!/bin/bash
set -uo pipefail

RDIR=/audit/results
TARGET="https://proyecto-ollas-comunes.vercel.app"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

mkdir -p "$RDIR"

echo "=========================================="
echo " SIGO-OLLAS Security Audit - Kali Linux"
echo " $(date)"
echo "=========================================="

# --- NMAP ---
echo ""
echo "[1/7] NMAP - Port & Service Scan..."
nmap -sV -sC -T3 -p 80,443 --open proyecto-ollas-comunes.vercel.app > "$RDIR/nmap.txt" 2>&1
cat "$RDIR/nmap.txt"
echo "[OK] Nmap done"

# --- NIKTO ---
echo ""
echo "[2/7] NIKTO - Web Config Audit..."
nikto -h "$TARGET" -Tuning 1234 -nointeractive > "$RDIR/nikto.txt" 2>&1
head -80 "$RDIR/nikto.txt"
echo "[OK] Nikto done"

# --- DIRB ---
echo ""
echo "[3/7] DIRB - Directory Enumeration..."
dirb "$TARGET" /usr/share/dirb/wordlists/common.txt -o "$RDIR/dirb.txt" -S -r 2>&1
echo "[OK] Dirb done"

# --- HEADERS ---
echo ""
echo "[4/7] CURL - Security Headers..."
echo "=== Frontend Headers ===" > "$RDIR/headers.txt"
curl -s -I -A "$UA" "$TARGET" >> "$RDIR/headers.txt" 2>&1
cat "$RDIR/headers.txt"

echo ""
echo "=== Header Analysis ===" > "$RDIR/header-analysis.txt"
for h in "Strict-Transport-Security" "X-Content-Type-Options" "X-Frame-Options" "Content-Security-Policy" "X-XSS-Protection" "Referrer-Policy" "Permissions-Policy"; do
    if grep -qi "$h" "$RDIR/headers.txt" 2>/dev/null; then
        echo "  [PRESENT] $h" | tee -a "$RDIR/header-analysis.txt"
    else
        echo "  [MISSING] $h" | tee -a "$RDIR/header-analysis.txt"
    fi
done

# --- CORS ---
echo ""
echo "[5/7] CURL - CORS Test..."
echo "=== CORS Policy ===" > "$RDIR/cors.txt"
for origin in "https://evil.com" "https://proyecto-ollas-comunes.vercel.app" "null"; do
    RESULT=$(curl -s -I -A "$UA" -X OPTIONS \
        -H "Origin: $origin" \
        -H "Access-Control-Request-Method: POST" \
        "$TARGET/api/auth/login" 2>/dev/null | grep -i "access-control-allow-origin")
    echo "  Origin: $origin -> ${RESULT:-REJECTED}" | tee -a "$RDIR/cors.txt"
done
echo "[OK] CORS done"

# --- SENSITIVE FILES ---
echo ""
echo "[6/7] CURL - Sensitive Files & JWT..."
echo "=== Sensitive Files ===" > "$RDIR/sensitive.txt"
for p in "/.env" "/.git/config" "/.git/HEAD" "/robots.txt" "/sitemap.xml" "/.well-known/security.txt" "/api/docs" "/debug" "/health" "/api/health"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -A "$UA" "${TARGET}${p}" 2>/dev/null)
    echo "  ${p} -> HTTP ${CODE}" | tee -a "$RDIR/sensitive.txt"
done

echo "" >> "$RDIR/sensitive.txt"
echo "=== JWT Test (invalid token) ===" >> "$RDIR/sensitive.txt"
RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" -A "$UA" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InRlc3QiLCJyb2xlIjoiYWRtaW5fbXVuaWNpcGFsIn0.invalid" \
    "$TARGET/api/beneficiaries" 2>/dev/null)
echo "  $RESP" | tee -a "$RDIR/sensitive.txt"

echo "" >> "$RDIR/sensitive.txt"
echo "=== HTTP Methods ===" >> "$RDIR/sensitive.txt"
for m in PUT DELETE PATCH; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -A "$UA" -X "$m" "$TARGET/api/auth/login" 2>/dev/null)
    echo "  $m /api/auth/login -> HTTP $CODE" | tee -a "$RDIR/sensitive.txt"
done

echo "" >> "$RDIR/sensitive.txt"
echo "=== Content-Type Validation ===" >> "$RDIR/sensitive.txt"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -A "$UA" -X POST -H "Content-Type: text/plain" -d '{"email":"test","password":"test"}' "$TARGET/api/auth/login" 2>/dev/null)
echo "  text/plain -> HTTP $CODE" >> "$RDIR/sensitive.txt"

echo "[OK] Sensitive/JWT done"

# --- RATE LIMIT ---
echo ""
echo "[7/7] CURL - Rate Limit Test..."
echo "=== Rate Limit (5 requests) ===" > "$RDIR/ratelimit.txt"
for i in $(seq 1 5); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -A "$UA" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@ollascomunes.pe","password":"wrongpassword123"}' \
        "$TARGET/api/auth/login" 2>/dev/null)
    echo "  Attempt $i: HTTP $CODE" | tee -a "$RDIR/ratelimit.txt"
    sleep 1
done
echo "[OK] Rate limit done"

# --- SQLMAP ---
echo ""
echo "[BONUS] SQLmap - SQL Injection Test (safe level 1)..."
mkdir -p "$RDIR/sqlmap"
sqlmap -u "${TARGET}/api/beneficiaries?nombre=test" --batch --level=1 --risk=1 --timeout=10 --retries=2 --threads=1 --output-dir="$RDIR/sqlmap" > "$RDIR/sqlmap.txt" 2>&1
tail -30 "$RDIR/sqlmap.txt"
echo "[OK] SQLmap done"

# --- SERVER INFO ---
echo ""
echo "=== Server Info ===" > "$RDIR/serverinfo.txt"
curl -s -I -A "$UA" "$TARGET" 2>/dev/null | grep -iE "server:|x-powered-by:|x-vercel" | tee -a "$RDIR/serverinfo.txt"

echo ""
echo "=========================================="
echo " AUDIT COMPLETE - $(date)"
echo " Results saved to: $RDIR"
echo "=========================================="
ls -la "$RDIR/"
