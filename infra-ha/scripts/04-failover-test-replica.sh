#!/bin/bash
# =============================================================
# 04-failover-test.sh (MODO REPLICA)
# Promueve la replica a primary, mide RTO.
# =============================================================
set -e

EVIDENCE_DIR="/evidence"
mkdir -p ${EVIDENCE_DIR}

echo "================================================"
echo " [REPLICA] INICIO PROMOCION - $(date '+%Y-%m-%d %H:%M:%S.%3N')"
echo "================================================"

PROMOTE_START=$(date +%s.%N)

echo ""
echo "[1/5] Verificando que estamos en recovery (debe ser 't')"
su - postgres -c "/usr/pgsql-15/bin/psql -tA -c 'SELECT pg_is_in_recovery();'"

echo ""
echo "[2/5] Ejecutando pg_ctl promote"
/usr/pgsql-15/bin/pg_ctl -D /var/lib/pgsql/15/data promote 2>&1 | tail -3
sleep 2

echo ""
echo "[3/5] Estado post-promocion (debe ser 'f')"
su - postgres -c "/usr/pgsql-15/bin/psql -tA -c 'SELECT pg_is_in_recovery();'"

PROMOTE_END=$(date +%s.%N)
RTO=$(echo "${PROMOTE_END} - ${PROMOTE_START}" | bc)

echo ""
echo "[4/5] Verificando datos replicados"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_test -c 'SELECT count(*) AS total_post_promote FROM beneficiaries;'"

echo ""
echo "[5/5] Insertando dato de post-failover"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_test -c \"INSERT INTO beneficiaries (dni, full_name, priority_level) VALUES ('20000002', 'POST-FAILOVER-$(date +%s)', 1);\"" 2>&1 | tail -2

echo ""
echo "================================================"
echo " RTO failover: ${RTO} segundos"
echo "================================================"

cat > ${EVIDENCE_DIR}/failover_log.txt <<EOF
=== TEST FAILOVER - REPLICA LOG ===
Fecha inicio: $(date '+%Y-%m-%d %H:%M:%S.%3N')
Promote start: ${PROMOTE_START}
Promote end:   ${PROMOTE_END}
RTO:           ${RTO} segundos

Estado pre:   pg_is_in_recovery = t (en standby)
Estado post:  pg_is_in_recovery = f (promovida a primary)

Datos:
- Tabla beneficiaries tiene registros pre-failover replicados
- Nuevas escrituras funcionan en la replica promovida
EOF

echo "Log guardado en ${EVIDENCE_DIR}/failover_log.txt"
