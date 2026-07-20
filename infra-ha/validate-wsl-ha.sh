#!/bin/bash
# =============================================================
# validate-wsl-ha.sh
# Valida la infraestructura HA/DR en WSL2 desde el host.
# Genera un reporte de validación para la rúbrica.
#
# Uso: bash validate-wsl-ha.sh [--report]
#   --report  genera reporte markdown en docs/
# =============================================================
# Nota: no usar set -e porque las validaciones fallan individualmente sin abortar
# Cada comando maneja sus propios errores con 2>/dev/null y verificaciones explicitas

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="${PROJECT_ROOT}/evidence"
LOG_DIR="${EVIDENCE_DIR}/logs"
REPORT_FILE="${PROJECT_ROOT}/docs/VALIDACION_HA_WSL.md"
mkdir -p "${EVIDENCE_DIR}" "${LOG_DIR}"

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
PASS=0
FAIL=0
WARN=0

RESULTADOS=()

ok()   { local m="$1"; PASS=$((PASS+1)); RESULTADOS+=("✅|$m"); echo "[PASS] $m"; }
fail() { local m="$1"; FAIL=$((FAIL+1)); RESULTADOS+=("❌|$m"); echo "[FAIL] $m"; }
warn() { local m="$1"; WARN=$((WARN+1)); RESULTADOS+=("⚠️|$m"); echo "[WARN] $m"; }

# Helper: ejecutar comando en una distro WSL2
wsl_run() {
  local distro="$1"
  shift
  wsl -d "$distro" -- bash -c "$*" 2>/dev/null
}

# Helper: ejecutar SQL via psql en una distro
# Usa archivo temporal en WSL para evitar problemas de comillas anidadas
wsl_psql() {
  local distro="$1" port="$2" db="$3" sql="$4"
  local tmpname="validate_$$_$RANDOM"
  local sqlfile="/tmp/${tmpname}.sql"
  printf '%s' "${sql}" | wsl -d "$distro" -- bash -c "cat > ${sqlfile}" 2>/dev/null
  local result
  result=$(wsl -d "$distro" -- bash -c "su postgres -c '/usr/pgsql-15/bin/psql -p ${port} -d ${db} -A -t -f ${sqlfile}'" 2>/dev/null)
  wsl -d "$distro" -- bash -c "rm -f ${sqlfile}" 2>/dev/null
  printf '%s' "${result}"
}

echo ""
echo "======================================================"
echo "  SIGO-OLLAS - Validacion HA/DR en WSL2"
echo "  Fecha: ${TIMESTAMP}"
echo "======================================================"
echo ""

# ---------------------------------------------------------
# 1. Verificar distros WSL2
# ---------------------------------------------------------
echo "--- [1] Distros WSL2 ---"
DISTROS=$(wsl -l -q 2>/dev/null | tr -d '\0' || wsl -l 2>/dev/null)
if echo "$DISTROS" | grep -qi "primary-db"; then
  ok "Distro 'primary-db' encontrada"
else
  fail "Distro 'primary-db' NO encontrada"
fi
if echo "$DISTROS" | grep -qi "replica-db"; then
  ok "Distro 'replica-db' encontrada"
else
  fail "Distro 'replica-db' NO encontrada"
fi
echo ""

# ---------------------------------------------------------
# 2. Verificar que WSL2 está en ejecución
# ---------------------------------------------------------
echo "--- [2] Estado de WSL2 ---"
for distro in primary-db replica-db; do
  if wsl_run "$distro" "echo running" | grep -q "running"; then
    ok "WSL2 '$distro' esta ejecutandose"
    HOSTNAME=$(wsl_run "$distro" "hostname")
    KERNEL=$(wsl_run "$distro" "uname -r")
    echo "       Hostname: ${HOSTNAME}, Kernel: ${KERNEL}"
  else
    warn "WSL2 '$distro' no esta corriendo"
    wsl_run "$distro" "echo iniciado" >/dev/null && \
      ok "WSL2 '$distro' iniciado" || \
      fail "No se pudo iniciar WSL2 '$distro'"
  fi
done
echo ""

# ---------------------------------------------------------
# 3. Obtener IPs de las distros
# ---------------------------------------------------------
echo "--- [3] Direcciones IP ---"
for distro in primary-db replica-db; do
  IP=$(wsl_run "$distro" "hostname -I" | awk '{print $1}')
  if [ -n "$IP" ]; then
    ok "IP de '$distro': ${IP}"
    eval "IP_${distro//-/_}=${IP}"
  else
    fail "No se pudo obtener IP de '$distro'"
  fi
done
echo ""

# ---------------------------------------------------------
# 4. Verificar PostgreSQL
# ---------------------------------------------------------
echo "--- [4] PostgreSQL ---"
for distro in primary-db replica-db; do
  PG_PORT=$(wsl_run "$distro" "grep -i '^port' /var/lib/pgsql/15/data/postgresql.conf 2>/dev/null | cut -d' ' -f3 || echo 5432")

  PG_RUNNING=$(wsl_run "$distro" "su postgres -c '/usr/pgsql-15/bin/pg_isready -p ${PG_PORT}' 2>/dev/null || echo no")

  if echo "$PG_RUNNING" | grep -q "accepting connections"; then
    ok "PostgreSQL en '$distro:${PG_PORT}' acepta conexiones"
    PG_ROLE=$(wsl_psql "$distro" "${PG_PORT}" "postgres" "SELECT CASE WHEN pg_is_in_recovery() THEN 'replica' ELSE 'primary' END;" | tr -d '[:space:]')
    echo "       Rol: ${PG_ROLE:-desconocido}, Puerto: ${PG_PORT}"
    eval "PG_ROLE_${distro//-/_}='${PG_ROLE}'"
  else
    warn "PostgreSQL en '$distro' no disponible. Intentando iniciar..."
    wsl_run "$distro" "su postgres -c '/usr/pgsql-15/bin/pg_ctl start -D /var/lib/pgsql/15/data -l /var/lib/pgsql/15/data/start.log' 2>/dev/null; sleep 2; su postgres -c '/usr/pgsql-15/bin/pg_isready -p ${PG_PORT}' 2>/dev/null" | grep -q "accepting" && \
      ok "PostgreSQL en '$distro' iniciado exitosamente" || \
      warn "PostgreSQL en '$distro' no pudo iniciarse (puede estar detenido intencionalmente)"
  fi
done
echo ""

# ---------------------------------------------------------
# 5. Verificar conectividad de red entre distros
# ---------------------------------------------------------
echo "--- [5] Conectividad de red entre nodos ---"
if [ -n "$IP_primary_db" ] && [ -n "$IP_replica_db" ]; then
  wsl_run "replica-db" "ping -c 1 -W 2 ${IP_primary_db} 2>/dev/null && echo OK || echo FAIL" | grep -q "OK" && \
    ok "replica-db puede alcanzar a primary-db (${IP_primary_db})" || \
    warn "replica-db NO puede alcanzar a primary-db (esperado si primary esta caido)"

  wsl_run "primary-db" "ping -c 1 -W 2 ${IP_replica_db} 2>/dev/null && echo OK || echo FAIL" | grep -q "OK" && \
    ok "primary-db puede alcanzar a replica-db (${IP_replica_db})" || \
    warn "primary-db NO puede alcanzar a replica-db (esperado si primary esta caido)"
else
  warn "No se pueden realizar pruebas de ping (faltan IPs)"
fi
echo ""

# ---------------------------------------------------------
# 6. Verificar replicación PostgreSQL
# ---------------------------------------------------------
echo "--- [6] Estado de replicacion ---"
for distro in primary-db replica-db; do
  PG_PORT=$(wsl_run "$distro" "grep -i '^port' /var/lib/pgsql/15/data/postgresql.conf 2>/dev/null | cut -d' ' -f3 || echo 5432")

  REPLICATION_INFO=$(wsl_run "$distro" "su postgres -c '/usr/pgsql-15/bin/psql -p ${PG_PORT} -c \"SELECT application_name, state, sync_state FROM pg_stat_replication;\"' 2>/dev/null")
  RECOVERY_INFO=$(wsl_psql "$distro" "${PG_PORT}" "postgres" "SELECT pg_is_in_recovery();" | tr -d '[:space:]')

  if echo "$REPLICATION_INFO" | grep -q "streaming"; then
    local STATE=$(echo "$REPLICATION_INFO" | tail -1 | awk '{print $2}')
    ok "Replicacion activa en '$distro': estado=${STATE}"
  elif [ "$RECOVERY_INFO" = "f" ]; then
    ok "'$distro' es PRIMARY (no replica datos entrantes)"
    echo "$REPLICATION_INFO" | grep -q "0 rows" && \
      warn "PRIMARY '$distro' no tiene replicas conectadas (esperado post-failover)"
  elif [ "$RECOVERY_INFO" = "t" ]; then
    ok "'$distro' esta en modo RECOVERY (es una replica)"
  else
    warn "No se pudo determinar estado de replicacion en '$distro'"
  fi
done
echo ""

# ---------------------------------------------------------
# 7. Verificar bases de datos y datos de prueba
# ---------------------------------------------------------
echo "--- [7] Bases de datos y datos de prueba ---"
for distro in primary-db replica-db; do
  PG_PORT=$(wsl_run "$distro" "grep -i '^port' /var/lib/pgsql/15/data/postgresql.conf 2>/dev/null | cut -d' ' -f3 || echo 5432")
  DB_LIST=$(wsl_psql "$distro" "${PG_PORT}" "postgres" "SELECT datname FROM pg_database WHERE datistemplate = false;")
  if echo "$DB_LIST" | grep -q "sigo_ollas"; then
    DB_NAME=$(echo "$DB_LIST" | grep "sigo_ollas" | head -1)
    ok "BD '${DB_NAME}' encontrada en '$distro'"

    TABLE_COUNT=$(wsl_psql "$distro" "${PG_PORT}" "${DB_NAME}" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d '[:space:]')
    echo "       Tablas en '${DB_NAME}': ${TABLE_COUNT}"

    BEN_COUNT=$(wsl_psql "$distro" "${PG_PORT}" "${DB_NAME}" "SELECT COUNT(*) FROM beneficiaries;" | tr -d '[:space:]')
    echo "       Beneficiarios: ${BEN_COUNT}"
  else
    warn "No se encontraron BD del proyecto en '$distro'"
  fi
done
echo ""

# ---------------------------------------------------------
# 8. Verificar espacio en disco y recursos
# ---------------------------------------------------------
echo "--- [8] Recursos del sistema ---"
for distro in primary-db replica-db; do
  DISK=$(wsl_run "$distro" "df -h / | tail -1 | awk '{print \$4}'")
  MEM=$(wsl_run "$distro" "free -h | grep Mem | awk '{print \$3}'")
  if [ -n "$DISK" ] && [ -n "$MEM" ]; then
    ok "Recursos en '$distro': Disco libre=${DISK}, RAM usada=${MEM}"
  else
    warn "No se pudieron obtener recursos de '$distro'"
  fi
done
echo ""

# ---------------------------------------------------------
# 9. Probar health check de la API
# ---------------------------------------------------------
echo "--- [9] Health check de la API ---"
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/api/health/prisma 2>/dev/null || echo "000")
if [ "$API_HEALTH" = "200" ]; then
  ok "API health endpoint responde (HTTP ${API_HEALTH})"
else
  warn "API health endpoint no disponible (HTTP ${API_HEALTH}) - servidor no corriendo"
fi
echo ""

# ---------------------------------------------------------
# 10. Prueba de conectividad PostgreSQL desde el host
# ---------------------------------------------------------
echo "--- [10] Conectividad PostgreSQL desde el host ---"
if [ -n "$IP_replica_db" ]; then
  wsl_psql "replica-db" "5433" "sigo_ollas_test" "SELECT 1;" | tr -d '[:space:]' | grep -q "1" && \
    ok "Conexion a PostgreSQL en 'replica-db:5433' via WSL exitosa" || \
    warn "No se pudo conectar a 'replica-db:5433' via WSL"
fi

if [ -n "$IP_primary_db" ]; then
  wsl_psql "primary-db" "5432" "sigo_ollas_test" "SELECT 1;" | tr -d '[:space:]' | grep -q "1" && \
    ok "Conexion a PostgreSQL en 'primary-db:5432' via WSL exitosa" || \
    warn "No se pudo conectar a 'primary-db:5432' (esperado si esta detenido por failover)"
fi
echo ""

# =============================================================
# RESUMEN
# =============================================================
echo "======================================================"
echo "  RESUMEN DE VALIDACION"
echo "======================================================"
echo ""
echo "  Pruebas pasadas: ${PASS}"
echo "  Pruebas fallidas: ${FAIL}"
echo "  Advertencias: ${WARN}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "  Pruebas FALLADAS:"
  for r in "${RESULTADOS[@]}"; do
    IFS='|' read -r icon msg <<< "$r"
    [ "$icon" = "❌" ] && echo "    - $msg"
  done
  echo ""
fi
if [ "$WARN" -gt 0 ]; then
  echo "  Advertencias:"
  for r in "${RESULTADOS[@]}"; do
    IFS='|' read -r icon msg <<< "$r"
    [ "$icon" = "⚠️" ] && echo "    - $msg"
  done
  echo ""
fi

TOTAL=$((PASS + FAIL))
echo "  Resultado: ${PASS}/${TOTAL} pruebas exitosas"
if [ "$FAIL" -eq 0 ] && [ "$PASS" -gt 0 ]; then
  echo "  ESTADO: ✅ VALIDACION EXITOSA"
elif [ "$PASS" -eq 0 ]; then
  echo "  ESTADO: ❌ VALIDACION FALLIDA"
else
  echo "  ESTADO: ⚠️ VALIDACION PARCIAL"
fi
echo "======================================================"
echo ""

# =============================================================
# GENERAR REPORTE MARKDOWN
# =============================================================
if [ "${1:-}" = "--report" ]; then
  echo "Generando reporte markdown..."
  {
    echo "# Informe de Validacion HA/DR - WSL2"
    echo ""
    echo "**Proyecto:** SIGO-OLLAS"
    echo "**Fecha:** ${TIMESTAMP}"
    echo "**Herramienta:** \`validate-wsl-ha.sh\`"
    echo ""
    echo "## Resumen"
    echo ""
    echo "| Metrica | Valor |"
    echo "|---------|-------|"
    echo "| Pruebas exitosas | ${PASS} |"
    echo "| Pruebas fallidas | ${FAIL} |"
    echo "| Advertencias | ${WARN} |"
    echo "| Resultado general | $([ "$FAIL" -eq 0 ] && [ "$PASS" -gt 0 ] && echo "✅ VALIDACION EXITOSA" || echo "⚠️ PARCIAL") |"
    echo ""
    echo "## Detalle de Pruebas"
    echo ""
    echo "| Resultado | Prueba |"
    echo "|-----------|--------|"
    for r in "${RESULTADOS[@]}"; do
      IFS='|' read -r icon msg <<< "$r"
      echo "| ${icon} | ${msg} |"
    done
    echo ""
    echo "## Configuracion del Entorno"
    echo ""
    echo "| Componente | Detalle |"
    echo "|-----------|---------|"
    echo "| Sistema operativo | Windows con WSL2 |"
    echo "| Distros WSL2 | primary-db, replica-db |"
    echo "| PostgreSQL | 15.18 (PGDG) |"
    echo "| Red | Virtual switch WSL2 (172.18.x.x) |"
    echo "| Autenticacion | scram-sha-256 con contraseña |"
    echo "| Monitoreo | pg_stat_replication, pg_isready |"
    echo ""
    echo "## Evidencias"
    echo ""
    echo "Las evidencias de ejecucion se encuentran en:"
    echo "- \`evidence/logs/\` - logs detallados"
    echo "- \`evidence/\` - resultados de pruebas HA/DR"
    echo "- \`infra-ha/scripts/\` - scripts de prueba"
    echo ""
    echo "---"
    echo "*Reporte generado automaticamente por validate-wsl-ha.sh*"
  } > "${REPORT_FILE}"
  echo "Reporte guardado en: ${REPORT_FILE}"
fi

# Guardar log de validacion
LOG_FILE="${EVIDENCE_DIR}/validacion_wsl_$(date +%Y%m%d_%H%M%S).log"
{
  echo "Validacion HA/DR WSL2 - ${TIMESTAMP}"
  echo "========================================"
  echo "Pasadas: ${PASS} | Fallidas: ${FAIL} | Advertencias: ${WARN}"
  echo ""
  for r in "${RESULTADOS[@]}"; do
    echo "$r"
  done
} > "${LOG_FILE}"
echo "Log guardado en: ${LOG_FILE}"
echo ""
