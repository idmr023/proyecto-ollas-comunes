#!/usr/bin/env bash
# ============================================================================
# SIGO-OLLAS — Auditoría de Seguridad con Kali Linux
# ============================================================================
# Ejecutar desde Kali Linux:  sudo bash security-audit.sh
#
# RESTRICCIONES DE SEGURIDAD:
#   - NO modifica .env ni ningún archivo del proyecto
#   - NO crea contenedores Docker
#   - NO envía payloads destructivos
#   - Solo realiza análisis de lectura (reconocimiento + detección)
#   - Todos los resultados se guardan en /tmp/sigo-ollas-security/
#
# Requisitos: nmap, nikto, dirb, hydra, sqlmap, curl, jq
# ============================================================================

set -euo pipefail

# ======================== CONFIGURACIÓN =====================================
TARGET_FRONTEND="https://proyecto-ollas-comunes.vercel.app"
TARGET_BACKEND=""  # Si tienes backend público, ponlo aquí. Si no, se omite.
RESULTS_DIR="/tmp/sigo-ollas-security"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="${RESULTS_DIR}/${TIMESTAMP}"
LOG_FILE="${REPORT_DIR}/execution.log"

# Opcional: backend local (solo si Kali tiene acceso a tu red local)
# TARGET_BACKEND="http://192.168.1.X:4000"

# Credenciales de prueba (cuenta de testing, NO la de admin real)
TEST_EMAIL="test@ollascomunes.pe"
TEST_PASSWORD="test123"

# Límites de seguridad para Hydra (brute force controlado)
HYDRA_ATTEMPTS=5       # Solo 5 intentos
HYDRA_DELAY=2          # 2 segundos entre intentos

# Wordlist para Dirb (usa la default de Kali)
DIRB_WORDLIST="/usr/share/wordlists/dirb/common.txt"

# Archivo de usuarios para Hydra (si no existe, se crea uno mínimo)
HYDRA_USERLIST="${REPORT_DIR}/test-users.txt"
# ======================== FIN CONFIGURACIÓN =================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ======================== FUNCIONES =========================================

log() {
    local msg="[$(date '+%H:%M:%S')] $1"
    echo -e "${CYAN}${msg}${NC}"
    echo "${msg}" >> "${LOG_FILE}"
}

section() {
    echo "" | tee -a "${LOG_FILE}"
    echo -e "${BLUE}================================================================${NC}" | tee -a "${LOG_FILE}"
    echo -e "${BLUE}  $1${NC}" | tee -a "${LOG_FILE}"
    echo -e "${BLUE}================================================================${NC}" | tee -a "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}[✓] $1${NC}" | tee -a "${LOG_FILE}"
}

warn() {
    echo -e "${YELLOW}[!] $1${NC}" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[✗] $1${NC}" | tee -a "${LOG_FILE}"
}

check_tool() {
    if ! command -v "$1" &>/dev/null; then
        error "Herramienta '$1' no encontrada. Instalar con: sudo apt install $2"
        return 1
    fi
    return 0
}

# ======================== INICIO ============================================

clear
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   SIGO-OLLAS — Auditoría de Seguridad con Kali Linux       ║"
echo "║   Solo análisis read-only. No modifica el sistema.         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Crear directorio de resultados
mkdir -p "${REPORT_DIR}"
echo "Auditoría iniciada: $(date)" > "${LOG_FILE}"
echo "Target Frontend: ${TARGET_FRONTEND}" >> "${LOG_FILE}"
echo "Target Backend: ${TARGET_BACKEND:-'(no configurado)'}" >> "${LOG_FILE}"

# Verificar herramientas
section "VERIFICACIÓN DE HERRAMIENTAS"
TOOLS_OK=true
for tool_pair in "nmap:nmap" "nikto:nikto" "dirb:dirb" "hydra:hydra" "sqlmap:sqlmap" "curl:curl" "jq:jq"; do
    tool="${tool_pair%%:*}"
    pkg="${tool_pair##*:}"
    if check_tool "${tool}" "${pkg}"; then
        success "${tool} encontrado: $(command -v ${tool})"
    else
        TOOLS_OK=false
    fi
done

if [ "${TOOLS_OK}" = false ]; then
    error "Faltan herramientas. Instalarlas antes de continuar."
    error "sudo apt install nmap nikto dirb hydra sqlmap curl jq"
    exit 1
fi

# ============================================================================
# PRUEBA 1: NMAP — Escaneo de puertos y servicios
# ============================================================================
section "PRUEBA 1: NMAP — Reconocimiento de infraestructura"
log "Objetivo: ${TARGET_FRONTEND}"
log "Tipo: Escaneo de servicios + detección de versiones"

# Extraer dominio del target
DOMAIN=$(echo "${TARGET_FRONTEND}" | sed 's|https\?://||' | sed 's|/.*||')

nmap -sV -sC -T3 -p 80,443,8080,3000,4000 \
    --open \
    -oN "${REPORT_DIR}/nmap-${DOMAIN}.txt" \
    -oX "${REPORT_DIR}/nmap-${DOMAIN}.xml" \
    "${DOMAIN}" 2>&1 | tee -a "${LOG_FILE}"

success "Nmap completado → ${REPORT_DIR}/nmap-${DOMAIN}.txt"

# ============================================================================
# PRUEBA 2: NIKTO — Auditoría de configuración del servidor web
# ============================================================================
section "PRUEBA 2: NIKTO — Auditoría de configuración web"
log "Objetivo: ${TARGET_FRONTEND}"
log "Tipo: Headers de seguridad, configuración, archivos expuestos"

nikto -h "${TARGET_FRONTEND}" \
    -Tuning 1234567890 \
    -Display V \
    -o "${REPORT_DIR}/nikto-${DOMAIN}.txt" \
    -Format txt \
    2>&1 | tee -a "${LOG_FILE}"

success "Nikto completado → ${REPORT_DIR}/nikto-${DOMAIN}.txt"

# ============================================================================
# PRUEBA 3: DIRB — Enumeración de directorios y archivos
# ============================================================================
section "PRUEBA 3: DIRB — Enumeración de rutas"
log "Objetivo: ${TARGET_FRONTEND}"
log "Wordlist: ${DIRB_WORDLIST}"

if [ -f "${DIRB_WORDLIST}" ]; then
    dirb "${TARGET_FRONTEND}" "${DIRB_WORDLIST}" \
        -o "${REPORT_DIR}/dirb-${DOMAIN}.txt" \
        -S -r \
        2>&1 | tee -a "${LOG_FILE}"
    success "Dirb completado → ${REPORT_DIR}/dirb-${DOMAIN}.txt"
else
    warn "Wordlist no encontrada en ${DIRB_WORDLIST}"
    warn "Intentando con wordlist alternativa..."
    ALT_WL="/usr/share/dirb/wordlists/common.txt"
    if [ -f "${ALT_WL}" ]; then
        dirb "${TARGET_FRONTEND}" "${ALT_WL}" \
            -o "${REPORT_DIR}/dirb-${DOMAIN}.txt" \
            -S -r \
            2>&1 | tee -a "${LOG_FILE}"
        success "Dirb completado con wordlist alternativa"
    else
        warn "Omitiendo Dirb — no se encontró wordlist"
    fi
fi

# ============================================================================
# PRUEBA 4: HYDRA — Prueba de fuerza bruta contra login
# ============================================================================
section "PRUEBA 4: HYDRA — Prueba controlada de fuerza bruta"
log "Endpoint: ${TARGET_FRONTEND}/api/auth/login"
log "Intentos: ${HYDRA_ATTEMPTS} | Delay: ${HYDRA_DELAY}s entre intentos"
log "Propósito: Verificar que el rate limiting bloquea intentos repetidos"

# Crear archivo de usuarios mínimo para la prueba
cat > "${HYDRA_USERLIST}" << 'EOF'
admin@ollascomunes.pe
test@ollascomunes.pe
EOF

# Prueba con password wrong — verificar que retorna 401 consistentemente
log "Test 1: Login con credenciales incorrectas (verificar 401)..."
curl -s -o "${REPORT_DIR}/hydra-login-response.json" \
    -w "HTTP_CODE:%{http_code} TIME:%{time_total}s" \
    -X POST "${TARGET_FRONTEND}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@ollascomunes.pe","password":"wrongpassword123"}' \
    2>&1 | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"

# Verificar rate limiting con múltiples intentos
log "Test 2: Enviando ${HYDRA_ATTEMPTS} requests rápidos (verificar rate limit)..."
for i in $(seq 1 ${HYDRA_ATTEMPTS}); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "${TARGET_FRONTEND}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@ollascomunes.pe","password":"wrongpassword123"}' 2>/dev/null)
    log "  Intento ${i}: HTTP ${HTTP_CODE}"
    echo "Attempt ${i}: HTTP ${HTTP_CODE}" >> "${REPORT_DIR}/hydra-rate-limit.txt"
    sleep 1
done

success "Prueba de rate limiting completada → ${REPORT_DIR}/hydra-rate-limit.txt"

# ============================================================================
# PRUEBA 5: SQLMAP — Prueba de inyección SQL
# ============================================================================
section "PRUEBA 5: SQLMAP — Prueba de inyección SQL"
log "Objetivo: Parámetros de búsqueda (busqueda, dni, nombre)"
log "Modo: SAFE — solo testea, NO extrae datos ni modifica BD"

# Test 1: Parámetro de búsqueda por nombre
log "Test 1: Parámetro 'nombre' en listado de beneficiarios..."
sqlmap -u "${TARGET_FRONTEND}/api/beneficiaries?nombre=test" \
    --batch \
    --level=1 \
    --risk=1 \
    --timeout=10 \
    --retries=2 \
    --threads=1 \
    --output-dir="${REPORT_DIR}/sqlmap" \
    --flush-session \
    2>&1 | tee -a "${LOG_FILE}"

# Test 2: Parámetro DNI (si existe query param)
log "Test 2: Parámetro 'dni' en búsqueda..."
sqlmap -u "${TARGET_FRONTEND}/api/beneficiaries?dni=12345678" \
    --batch \
    --level=1 \
    --risk=1 \
    --timeout=10 \
    --retries=2 \
    --threads=1 \
    --output-dir="${REPORT_DIR}/sqlmap" \
    2>&1 | tee -a "${LOG_FILE}"

success "SQLmap completado → ${REPORT_DIR}/sqlmap/"

# ============================================================================
# PRUEBA 6: CURL — Pruebas manuales de seguridad
# ============================================================================
section "PRUEBA 6: CURL — Auditoría de headers y configuración"

# 6a. Headers de seguridad del frontend
log "Test 6a: Headers de seguridad del frontend..."
curl -s -I "${TARGET_FRONTEND}" 2>/dev/null | tee "${REPORT_DIR}/headers-frontend.txt"
echo "" >> "${REPORT_DIR}/headers-frontend.txt"
echo "--- Análisis de Headers ---" >> "${REPORT_DIR}/headers-frontend.txt"

# Verificar headers críticos
for header in "Strict-Transport-Security" "X-Content-Type-Options" "X-Frame-Options" "Content-Security-Policy" "X-XSS-Protection" "Referrer-Policy" "Permissions-Policy"; do
    if grep -qi "${header}" "${REPORT_DIR}/headers-frontend.txt" 2>/dev/null; then
        echo "  [PRESENTE] ${header}" >> "${REPORT_DIR}/headers-analysis.txt"
    else
        echo "  [AUSENTE]  ${header}" >> "${REPORT_DIR}/headers-analysis.txt"
    fi
done
success "Headers analizados → ${REPORT_DIR}/headers-frontend.txt"

# 6b. CORS — Verificar política de dominios permitidos
log "Test 6b: CORS — testeo de dominios cruzados..."
for origin in "https://evil.com" "https://proyecto-ollas-comunes.vercel.app" "null" "https://vercel.app"; do
    CORS_HEADER=$(curl -s -I -X OPTIONS \
        -H "Origin: ${origin}" \
        -H "Access-Control-Request-Method: POST" \
        "${TARGET_FRONTEND}/api/auth/login" 2>/dev/null | grep -i "access-control-allow-origin")
    if [ -n "${CORS_HEADER}" ]; then
        echo "  Origin: ${origin} → ${CORS_HEADER}" >> "${REPORT_DIR}/cors-test.txt"
    else
        echo "  Origin: ${origin} → RECHAZADO (no header)" >> "${REPORT_DIR}/cors-test.txt"
    fi
done
success "CORS test completado → ${REPORT_DIR}/cors-test.txt"

# 6c. Información del servidor
log "Test 6c: Exposición de información del servidor..."
curl -s -I "${TARGET_FRONTEND}" 2>/dev/null | grep -iE "server:|x-powered-by:|x-aspnet|x-runtime" | tee "${REPORT_DIR}/server-info.txt"
success "Server info → ${REPORT_DIR}/server-info.txt"

# 6d. Acceso a archivos sensibles
log "Test 6d: Intento de acceso a archivos sensibles..."
for path in "/.env" "/.git/config" "/.git/HEAD" "/robots.txt" "/sitemap.xml" "/.well-known/security.txt" "/api/docs" "/swagger" "/debug" "/actuator" "/health"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${TARGET_FRONTEND}${path}" 2>/dev/null)
    echo "  ${path} → HTTP ${HTTP_CODE}" >> "${REPORT_DIR}/sensitive-files.txt"
    log "  ${path} → HTTP ${HTTP_CODE}"
done
success "Archivos sensibles verificados → ${REPORT_DIR}/sensitive-files.txt"

# 6e. JWT — Verificar que tokens expirados son rechazados
log "Test 6e: JWT — test de token inválido..."
curl -s -o "${REPORT_DIR}/jwt-test-invalid.json" \
    -w "HTTP_CODE:%{http_code}" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InRlc3QiLCJyb2xlIjoiYWRtaW5fbXVuaWNpcGFsIiwicHVycG9zZSI6Im1mYSJ9.invalid" \
    "${TARGET_FRONTEND}/api/beneficiaries" 2>/dev/null | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"
success "JWT test completado → ${REPORT_DIR}/jwt-test-invalid.json"

# 6f. Method not allowed
log "Test 6f: Métodos HTTP no permitidos..."
for method in "PUT" "DELETE" "PATCH"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "${method}" "${TARGET_FRONTEND}/api/auth/login" 2>/dev/null)
    echo "  ${method} /api/auth/login → HTTP ${HTTP_CODE}" >> "${REPORT_DIR}/method-not-allowed.txt"
done
success "Method test completado → ${REPORT_DIR}/method-not-allowed.txt"

# 6g. Content-Type validation
log "Test 6g: Envío con Content-Type inválido..."
curl -s -o "${REPORT_DIR}/content-type-test.json" \
    -w "HTTP_CODE:%{http_code}" \
    -X POST "${TARGET_FRONTEND}/api/auth/login" \
    -H "Content-Type: text/plain" \
    -d '{"email":"test","password":"test"}' 2>/dev/null | tee -a "${LOG_FILE}"
echo "" | tee -a "${LOG_FILE}"
success "Content-Type test → ${REPORT_DIR}/content-type-test.json"

# ============================================================================
# PRUEBA 7: BACKEND DIRECTO (si está configurado)
# ============================================================================
if [ -n "${TARGET_BACKEND}" ]; then
    section "PRUEBA 7: BACKEND DIRECTO — Headers y configuración"
    log "Objetivo: ${TARGET_BACKEND}"

    log "Test 7a: Headers del backend..."
    curl -s -I "${TARGET_BACKEND}/api/auth/login" 2>/dev/null | tee "${REPORT_DIR}/headers-backend.txt"
    success "Backend headers → ${REPORT_DIR}/headers-backend.txt"

    log "Test 7b: CORS backend..."
    for origin in "https://evil.com" "https://proyecto-ollas-comunes.vercel.app" "null"; do
        CORS_HEADER=$(curl -s -I -X OPTIONS \
            -H "Origin: ${origin}" \
            -H "Access-Control-Request-Method: POST" \
            "${TARGET_BACKEND}/api/auth/login" 2>/dev/null | grep -i "access-control-allow-origin")
        echo "  Origin: ${origin} → ${CORS_HEADER:-RECHAZADO}" >> "${REPORT_DIR}/cors-backend-test.txt"
    done
    success "Backend CORS → ${REPORT_DIR}/cors-backend-test.txt"

    log "Test 7c: Archivos sensibles en backend..."
    for path in "/.env" "/.git/config" "/api/debug" "/api/health"; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${TARGET_BACKEND}${path}" 2>/dev/null)
        echo "  ${path} → HTTP ${HTTP_CODE}" >> "${REPORT_DIR}/sensitive-files-backend.txt"
    done
    success "Backend sensitive files → ${REPORT_DIR}/sensitive-files-backend.txt"
fi

# ============================================================================
# GENERACIÓN DE REPORTE HTML
# ============================================================================
section "GENERANDO REPORTE HTML"

cat > "${REPORT_DIR}/reporte-seguridad.html" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIGO-OLLAS — Informe de Seguridad (Kali Linux)</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0a0a0a; color: #e0e0e0; line-height: 1.6; }
        .container { max-width: 1100px; margin: 0 auto; padding: 20px; }
        header { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #2a2a4a; }
        h1 { color: #00d4ff; font-size: 1.8em; margin-bottom: 5px; }
        .subtitle { color: #888; font-size: 0.95em; }
        .meta { display: flex; gap: 20px; margin-top: 15px; flex-wrap: wrap; }
        .meta-item { background: #1a1a2e; padding: 8px 16px; border-radius: 8px; border: 1px solid #333; font-size: 0.85em; }
        .meta-label { color: #888; }
        .meta-value { color: #00d4ff; font-weight: 600; }
        .section { background: #111; border-radius: 12px; padding: 25px; margin-bottom: 20px; border: 1px solid #222; }
        .section h2 { color: #00d4ff; font-size: 1.3em; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #333; }
        .section h3 { color: #aaa; font-size: 1em; margin: 15px 0 8px 0; }
        .tool-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.75em; font-weight: 600; margin-right: 8px; }
        .badge-nmap { background: #1a3a1a; color: #4caf50; border: 1px solid #4caf50; }
        .badge-nikto { background: #3a2a1a; color: #ff9800; border: 1px solid #ff9800; }
        .badge-dirb { background: #1a2a3a; color: #2196f3; border: 1px solid #2196f3; }
        .badge-hydra { background: #3a1a1a; color: #f44336; border: 1px solid #f44336; }
        .badge-sqlmap { background: #2a1a3a; color: #9c27b0; border: 1px solid #9c27b0; }
        .badge-curl { background: #2a3a2a; color: #8bc34a; border: 1px solid #8bc34a; }
        pre { background: #0d1117; border: 1px solid #333; border-radius: 8px; padding: 15px; overflow-x: auto; font-size: 0.82em; color: #c9d1d9; margin: 10px 0; }
        .finding { background: #1a1a1a; border-left: 4px solid #333; padding: 12px 16px; margin: 8px 0; border-radius: 0 8px 8px 0; }
        .finding-high { border-left-color: #f44336; background: #1a0a0a; }
        .finding-medium { border-left-color: #ff9800; background: #1a150a; }
        .finding-low { border-left-color: #4caf50; background: #0a1a0a; }
        .finding-info { border-left-color: #2196f3; background: #0a0a1a; }
        .risk-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600; }
        .risk-alto { background: #f44336; color: white; }
        .risk-medio { background: #ff9800; color: black; }
        .risk-bajo { background: #4caf50; color: white; }
        .risk-info { background: #2196f3; color: white; }
        .risk-informativo { background: #666; color: white; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #222; font-size: 0.9em; }
        th { background: #1a1a2e; color: #00d4ff; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
        .summary-card { background: #1a1a2e; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #333; }
        .summary-number { font-size: 2.5em; font-weight: 700; }
        .summary-label { color: #888; font-size: 0.85em; margin-top: 5px; }
        .conclusion { background: linear-gradient(135deg, #0a1a0a, #0a0a1a); border: 1px solid #4caf50; border-radius: 12px; padding: 25px; margin-top: 20px; }
        .conclusion h2 { color: #4caf50; }
    </style>
</head>
<body>
<div class="container">
    <header>
        <h1>SIGO-OLLAS — Informe de Seguridad</h1>
        <p class="subtitle">Auditoría de Seguridad con Herramientas Kali Linux</p>
        <div class="meta">
            <div class="meta-item"><span class="meta-label">Fecha:</span> <span class="meta-value">REPORT_DATE</span></div>
            <div class="meta-item"><span class="meta-label">Target:</span> <span class="meta-value">REPORT_TARGET</span></div>
            <div class="meta-item"><span class="meta-label">Herramientas:</span> <span class="meta-value">Nmap, Nikto, Dirb, Hydra, SQLmap, Curl</span></div>
            <div class="meta-item"><span class="meta-label">Tipo:</span> <span class="meta-value">DAST + Reconocimiento</span></div>
        </div>
    </header>

    <!-- RESUMEN EJECUTIVO -->
    <div class="section">
        <h2>1. Resumen Ejecutivo</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-number" style="color:#4caf50">N</div>
                <div class="summary-label">Hallazgos Alto</div>
            </div>
            <div class="summary-card">
                <div class="summary-number" style="color:#ff9800">N</div>
                <div class="summary-label">Hallazgos Medio</div>
            </div>
            <div class="summary-card">
                <div class="summary-number" style="color:#4caf50">N</div>
                <div class="summary-label">Hallazgos Bajo</div>
            </div>
            <div class="summary-card">
                <div class="summary-number" style="color:#2196f3">N</div>
                <div class="summary-label">Informativos</div>
            </div>
        </div>
    </div>

    <!-- HALLAZGOS -->
    <div class="section">
        <h2>2. Hallazgos de Seguridad</h2>
        FINDINGS_PLACEHOLDER
    </div>

    <!-- RESULTADOS POR HERRAMIENTA -->
    <div class="section">
        <h2>3. Resultados Detallados por Herramienta</h2>
        TOOL_RESULTS_PLACEHOLDER
    </div>

    <!-- ACCIONES CORRECTIVAS -->
    <div class="section">
        <h2>4. Acciones Correctivas</h2>
        CORRECTIVE_ACTIONS_PLACEHOLDER
    </div>

    <!-- CONCLUSIÓN -->
    <div class="conclusion">
        <h2>5. Conclusión</h2>
        CONCLUSION_PLACEHOLDER
    </div>
</div>
</body>
</html>
HTMLEOF

# Reemplazar fecha y target
sed -i "s|REPORT_DATE|$(date '+%d de %B de %Y')|g" "${REPORT_DIR}/reporte-seguridad.html"
sed -i "s|REPORT_TARGET|${TARGET_FRONTEND}|g" "${REPORT_DIR}/reporte-seguridad.html"

success "Reporte HTML generado → ${REPORT_DIR}/reporte-seguridad.html"

# ============================================================================
# RESUMEN FINAL
# ============================================================================
section "RESUMEN DE LA AUDITORÍA"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  AUDITORÍA COMPLETADA                                       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Resultados guardados en: ${CYAN}${REPORT_DIR}/${NC}"
echo ""
echo "  Archivos generados:"
ls -la "${REPORT_DIR}/" | grep -v "^total" | grep -v "^d" | awk '{print "    " $NF}'
echo ""
echo -e "  ${YELLOW}Siguiente paso: Revisar los resultados y generar el informe HTML final${NC}"
echo -e "  ${YELLOW}Ejecutar: sudo bash generate-report.sh ${REPORT_DIR}${NC}"
echo ""

log "Auditoría completada: $(date)"
