#!/bin/bash
# =============================================================
# 06-restore-test.sh
# Restaura un backup en una DB limpia y mide el RTO.
# =============================================================
set -e

EVIDENCE_DIR="/evidence"
mkdir -p ${EVIDENCE_DIR}

# Recibe el archivo de backup como argumento
BACKUP_FILE=${1:-"/tmp/backup_latest.dump"}
RESTORE_LOG="${EVIDENCE_DIR}/restore_log.txt"

echo "================================================"
echo " INICIO RESTORE - $(date '+%Y-%m-%d %H:%M:%S.%3N')"
echo "================================================"
echo "Backup a restaurar: ${BACKUP_FILE}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

START_TS=$(date +%s.%N)

echo ""
echo "[1/5] Creando DB de restauracion limpia"
su - postgres -c "/usr/pgsql-15/bin/psql -c 'DROP DATABASE IF EXISTS sigo_ollas_restored;'"
su - postgres -c "/usr/pgsql-15/bin/psql -c 'CREATE DATABASE sigo_ollas_restored;'"

echo ""
echo "[2/5] Conteo pre-restore (debe ser 0)"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_restored -c 'SELECT count(*) FROM beneficiaries;'"

echo ""
echo "[3/5] Ejecutando pg_restore"
su - postgres -c "/usr/pgsql-15/bin/pg_restore -d sigo_ollas_restored ${BACKUP_FILE}" 2>&1 | tail -5

END_TS=$(date +%s.%N)
RESTORE_TIME=$(echo "${END_TS} - ${START_TS}" | bc)

echo ""
echo "[4/5] Conteo post-restore (debe coincidir con el original)"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_restored -c 'SELECT count(*) AS total_restored FROM beneficiaries;'"

echo ""
echo "[5/5] Verificando integridad de los datos restaurados"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_restored -c 'SELECT id, dni, full_name, priority_level FROM beneficiaries ORDER BY id;'"

cat > ${RESTORE_LOG} <<EOF
=== TEST RESTORE - LOG ===
Fecha inicio:  $(date '+%Y-%m-%d %H:%M:%S.%3N')
Inicio:        ${START_TS}
Fin:           ${END_TS}
Tiempo total:  ${RESTORE_TIME} segundos
Archivo:       ${BACKUP_FILE}
DB destino:    sigo_ollas_restored
EOF

cat ${RESTORE_LOG}
echo ""
echo "Log guardado en: ${RESTORE_LOG}"
