#!/bin/bash
# =============================================================
# 02-setup-replica.sh
# Configura el nodo REPLICA usando pg_basebackup.
# Argumentos:
#   $1 = IP del primary
# =============================================================
set -e

PRIMARY_IP=${1:-"127.0.0.1"}

echo "================================================"
echo " [REPLICA] Instalando PostgreSQL 15"
echo "================================================"
dnf install -y postgresql15-server postgresql15-contrib 2>&1 | tail -3

echo ""
echo "================================================"
echo " [REPLICA] Deteniendo instancia (si existe)"
echo "================================================"
/usr/pgsql-15/bin/pg_ctl -D /var/lib/pgsql/15/data stop 2>/dev/null || true
rm -rf /var/lib/pgsql/15/data
mkdir -p /var/lib/pgsql/15/data
chown -R postgres:postgres /var/lib/pgsql/15

echo ""
echo "================================================"
echo " [REPLICA] Ejecutando pg_basebackup desde ${PRIMARY_IP}"
echo "================================================"
su - postgres -c "/usr/pgsql-15/bin/pg_basebackup -h ${PRIMARY_IP} -D /var/lib/pgsql/15/data -U replicator -P -Xs -R"

echo ""
echo "================================================"
echo " [REPLICA] Copiando configs y configurando standby"
echo "================================================"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp ${SCRIPT_DIR}/../wsl/replica-pg_hba.conf /var/lib/pgsql/15/data/pg_hba.conf
chown postgres:postgres /var/lib/pgsql/15/data/pg_hba.conf

cat >> /var/lib/pgsql/15/data/postgresql.conf <<'EOF'

# Parametros para streaming replication desde primary
primary_conninfo = 'host=PRIMARY_IP_PLACEHOLDER port=5432 user=replicator password=rep_pass_2026'
restore_command = 'cp /var/lib/pgsql/15/data/archive/%f %p'
recovery_target_timeline = 'latest'
primary_slot_name = 'replica_slot_1'
EOF

sed -i "s/PRIMARY_IP_PLACEHOLDER/${PRIMARY_IP}/g" /var/lib/pgsql/15/data/postgresql.conf
chown postgres:postgres /var/lib/pgsql/15/data/postgresql.conf

mkdir -p /var/lib/pgsql/15/data/archive
chown -R postgres:postgres /var/lib/pgsql/15/data/archive

echo ""
echo "================================================"
echo " [REPLICA] Iniciando como standby"
echo "================================================"
su - postgres -c "/usr/pgsql-15/bin/pg_ctl -D /var/lib/pgsql/15/data -l /var/lib/pgsql/15/data/log_replica.log start"
sleep 3

echo ""
echo "================================================"
echo " [REPLICA] Verificando estado"
echo "================================================"
su - postgres -c "/usr/pgsql-15/bin/psql -c 'SELECT pg_is_in_recovery();'"
echo "IP local: $(hostname -I)"
echo "================================================"
