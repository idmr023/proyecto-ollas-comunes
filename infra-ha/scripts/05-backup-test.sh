#!/bin/bash
# =============================================================
# 05-backup-test.sh
# Ejecuta pg_dump en el primary y mide RPO/RTO de backup.
# =============================================================
set -e

EVIDENCE_DIR="/evidence"
mkdir -p ${EVIDENCE_DIR}

BACKUP_FILE="/tmp/backup_$(date +%Y%m%d_%H%M%S).dump"
BACKUP_LOG="${EVIDENCE_DIR}/backup_log.txt"

echo "================================================"
echo " INICIO BACKUP - $(date '+%Y-%m-%d %H:%M:%S.%3N')"
echo "================================================"

START_TS=$(date +%s.%N)

echo ""
echo "[1/4] Insertando dato de marca temporal pre-backup"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_test -c \"INSERT INTO beneficiaries (dni, full_name, priority_level) VALUES ('30MARK01', 'PRE-BACKUP-$(date +%s)', 2);\"" 2>&1 | tail -2

echo ""
echo "[2/4] Ejecutando pg_dump"
su - postgres -c "/usr/pgsql-15/bin/pg_dump -Fc -d sigo_ollas_test -f ${BACKUP_FILE}" 2>&1 | tail -3

END_TS=$(date +%s.%N)
BACKUP_TIME=$(echo "${END_TS} - ${START_TS}" | bc)
BACKUP_SIZE=$(stat -c %s ${BACKUP_FILE} 2>/dev/null || stat -f %z ${BACKUP_FILE} 2>/dev/null)

echo ""
echo "[3/4] Backup completado en ${BACKUP_TIME}s, tamano: ${BACKUP_SIZE} bytes"

echo ""
echo "[4/4] Listando contenido del backup (verificacion de integridad)"
su - postgres -c "/usr/pgsql-15/bin/pg_restore -l ${BACKUP_FILE} | head -20"

cat > ${BACKUP_LOG} <<EOF
=== TEST BACKUP - LOG ===
Fecha inicio:  $(date '+%Y-%m-%d %H:%M:%S.%3N')
Inicio:        ${START_TS}
Fin:           ${END_TS}
Tiempo total:  ${BACKUP_TIME} segundos
Tamano:        ${BACKUP_SIZE} bytes
Archivo:       ${BACKUP_FILE}
EOF

cat ${BACKUP_LOG}
echo ""
echo "Backup guardado en: ${BACKUP_FILE}"
echo "Log guardado en: ${BACKUP_LOG}"
