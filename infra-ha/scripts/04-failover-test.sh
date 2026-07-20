#!/bin/bash
# =============================================================
# 04-failover-test.sh
# Simula la caida del PRIMARY y promueve la REPLICA.
# Mide el RTO (Recovery Time Objective).
# =============================================================
set -e

REPLICA_PG_PASS="rep_pass_2026"
EVIDENCE_DIR="/evidence"

echo "================================================"
echo " INICIO TEST FAILOVER - $(date '+%Y-%m-%d %H:%M:%S.%3N')"
echo "================================================"

START_TS=$(date +%s.%N)

echo ""
echo "[1/6] Insertando dato de pre-failover"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_test -c \"INSERT INTO beneficiaries (dni, full_name, priority_level) VALUES ('20000001', 'PRE-FAILOVER-$(date +%s)', 1);\"" 2>&1 | tail -2

echo ""
echo "[2/6] Datos antes del failover"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_test -c 'SELECT count(*) AS total_pre FROM beneficiaries;'"

echo ""
echo "[3/6] SIMULANDO CAIDA DEL PRIMARY: pg_ctl stop -m immediate"
/usr/pgsql-15/bin/pg_ctl -D /var/lib/pgsql/15/data -m immediate stop 2>&1 | tail -3
sleep 2

echo ""
echo "[4/6] Estado post-caida (debe fallar)"
su - postgres -c "/usr/pgsql-15/bin/psql -c 'SELECT 1' 2>&1 | head -3" || true

echo ""
echo "================================================"
echo " ACCION SOBRE LA REPLICA: ejecutar"
echo " wsl -d replica-db bash /scripts/04-failover-test.sh replica"
echo "================================================"
