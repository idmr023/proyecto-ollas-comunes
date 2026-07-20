#!/bin/bash
# =============================================================
# 01-setup-primary.sh
# Configura el nodo PRIMARIO de PostgreSQL para streaming
# replication.
# =============================================================
set -e

echo "================================================"
echo " [PRIMARY] Instalando PostgreSQL 15"
echo "================================================"

dnf install -y postgresql15-server postgresql15-contrib 2>&1 | tail -5

echo ""
echo "================================================"
echo " [PRIMARY] Inicializando cluster"
echo "================================================"
/usr/pgsql-15/bin/postgresql-15-setup initdb 2>&1 | tail -3

echo ""
echo "================================================"
echo " [PRIMARY] Copiando configs HA"
echo "================================================"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PGDATA="/var/lib/pgsql/15/data"
mkdir -p ${PGDATA}/archive

cp ${SCRIPT_DIR}/../wsl/primary-postgresql.conf ${PGDATA}/postgresql.conf
cp ${SCRIPT_DIR}/../wsl/primary-pg_hba.conf ${PGDATA}/pg_hba.conf
chown postgres:postgres ${PGDATA}/postgresql.conf ${PGDATA}/pg_hba.conf

echo ""
echo "================================================"
echo " [PRIMARY] Iniciando PostgreSQL"
echo "================================================"
systemctl enable postgresql-15 2>/dev/null || true
/usr/pgsql-15/bin/pg_ctl -D ${PGDATA} -l ${PGDATA}/log_primary.log start
sleep 3

echo ""
echo "================================================"
echo " [PRIMARY] Creando rol de replicacion"
echo "================================================"
su - postgres -c "/usr/pgsql-15/bin/psql -c \"CREATE USER replicator WITH REPLICATION PASSWORD 'rep_pass_2026';\"" 2>&1 | tail -3

echo ""
echo "================================================"
echo " [PRIMARY] Creando DB de prueba y datos"
echo "================================================"
su - postgres -c "/usr/pgsql-15/bin/psql <<'EOF'
CREATE DATABASE sigo_ollas_test;
\c sigo_ollas_test
CREATE TABLE beneficiaries (
  id SERIAL PRIMARY KEY,
  dni VARCHAR(8) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  priority_level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);
INSERT INTO beneficiaries (dni, full_name, priority_level) VALUES
  ('10000001', 'Beneficiario Test 1', 1),
  ('10000002', 'Beneficiario Test 2', 2),
  ('10000003', 'Beneficiario Test 3', 3);
SELECT count(*) AS total_initial FROM beneficiaries;
EOF"

echo ""
echo "================================================"
echo " [PRIMARY] Listo. IP local:"
hostname -I
echo "================================================"
