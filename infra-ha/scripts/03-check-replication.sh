#!/bin/bash
# =============================================================
# 03-check-replication.sh
# Verifica el estado de la replicacion en el PRIMARY.
# =============================================================
set -e

echo "================================================"
echo " Verificando estado de replicacion"
echo "================================================"

su - postgres -c "/usr/pgsql-15/bin/psql <<'EOF'
\x
SELECT pid, usename, application_name, client_addr, state,
       sync_state, sent_lsn, replay_lsn,
       (sent_lsn - replay_lsn) AS byte_lag
FROM pg_stat_replication;
EOF"

echo ""
echo "================================================"
echo " Slots de replicacion"
echo "================================================"
su - postgres -c "/usr/pgsql-15/bin/psql -c 'SELECT * FROM pg_replication_slots;'"

echo ""
echo "================================================"
echo " Conteo de beneficiarios en PRIMARY"
echo "================================================"
su - postgres -c "/usr/pgsql-15/bin/psql -d sigo_ollas_test -c 'SELECT count(*) FROM beneficiaries;'"
