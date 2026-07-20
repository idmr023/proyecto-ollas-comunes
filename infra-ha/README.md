# SIGO-OLLAS — Pruebas de Alta Disponibilidad y Recuperación ante Desastres

Implementación de pruebas de HA/DR ejecutadas en **2 VMs Alma Linux 9 (WSL2)** con PostgreSQL 15. Cumple los 7 elementos de la sección 20 de la rúbrica del Proyecto Final.

## Resultados de las pruebas

| Métrica | Objetivo | Logrado | Cumplimiento |
|---------|----------|---------|--------------|
| RTO failover | < 30 min | **2.117 s** | 850× mejor |
| RTO restore | < 30 min | **0.053 s** | 34000× mejor |
| RPO backup | < 5 min | **0 s** | Completo |
| Replication lag | < 30 s | **0 bytes** | Sincronizado |

## Estructura

```
infra-ha/
├── wsl/                              # Configuraciones PostgreSQL
│   ├── primary-postgresql.conf       # Primary: WAL level, archiving, slot
│   ├── primary-pg_hba.conf           # Auth del primary
│   ├── replica-postgresql.conf       # Replica: puerto 5433, hot_standby
│   └── replica-pg_hba.conf           # Auth de la replica
├── scripts/                          # Scripts de las pruebas
│   ├── 01-setup-primary.sh           # Bootstrap del primary
│   ├── 02-setup-replica.sh           # Bootstrap de la replica
│   ├── 03-check-replication.sh       # Verificacion de pg_stat_replication
│   ├── 04-failover-test.sh           # Caida simulada del primary
│   ├── 04-failover-test-replica.sh   # Promocion de la replica
│   ├── 05-backup-test.sh             # Ejecucion de pg_dump
│   └── 06-restore-test.sh            # Ejecucion de pg_restore
└── README.md                         # Este archivo
```

## Topología del entorno

```
[primary-db (WSL2)]                            [replica-db (WSL2)]
AlmaLinux 9.8                                   AlmaLinux 9.8
PostgreSQL 15.18                                PostgreSQL 15.18
puerto 5432                                     puerto 5433
  │                                                ▲
  │                                                │
  └──── streaming replication (WAL) ───────────────┘
        slot: replica_slot_1
        primary_conninfo: passfile=.pgpass
```

## Cómo ejecutar las pruebas desde cero

### 1. Levantar las dos distros WSL2 con Alma Linux 9

```powershell
# (Una sola vez) Descargar imagen de Alma Linux 9 desde Docker y exportarla
docker pull almalinux:9
docker create --name alma-export almalinux:9
docker export alma-export -o C:\Users\<usuario>\wsl-dists\almalinux-rootfs.tar

# Importar a WSL2
wsl --import primary-db C:\Users\<usuario>\wsl-dists\primary-db C:\Users\<usuario>\wsl-dists\almalinux-rootfs.tar
wsl --import replica-db  C:\Users\<usuario>\wsl-dists\replica-db  C:\Users\<usuario>\wsl-dists\almalinux-rootfs.tar
```

### 2. Instalar PostgreSQL 15 en ambas VMs

```powershell
wsl -d primary-db -- bash -c "dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm && dnf -y module disable postgresql && dnf install -y postgresql15-server postgresql15-contrib"
wsl -d replica-db  -- bash -c "dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm && dnf -y module disable postgresql && dnf install -y postgresql15-server postgresql15-contrib"
```

### 3. Inicializar y arrancar el primary

```powershell
# Inicializar cluster
wsl -d primary-db -- bash -c "mkdir -p /var/lib/pgsql/15/data && chown -R postgres:postgres /var/lib/pgsql && su postgres -c '/usr/pgsql-15/bin/initdb -D /var/lib/pgsql/15/data --auth=trust --locale=C.utf8 --encoding=UTF8'"

# Copiar configuracion HA
wsl -d primary-db -- bash -c "cp /mnt/c/.../proyecto-ollas-comunes/infra-ha/wsl/primary-postgresql.conf /var/lib/pgsql/15/data/postgresql.conf"
wsl -d primary-db -- bash -c "cp /mnt/c/.../proyecto-ollas-comunes/infra-ha/wsl/primary-pg_hba.conf      /var/lib/pgsql/15/data/pg_hba.conf"
wsl -d primary-db -- bash -c "chown postgres:postgres /var/lib/pgsql/15/data/postgresql.conf /var/lib/pgsql/15/data/pg_hba.conf"
wsl -d primary-db -- bash -c "mkdir -p /var/lib/pgsql/15/data/archive && chown postgres:postgres /var/lib/pgsql/15/data/archive"

# Arrancar
wsl -d primary-db -- bash -c "su postgres -c '/usr/pgsql-15/bin/pg_ctl -D /var/lib/pgsql/15/data -l /var/lib/pgsql/15/data/log_primary.log start'"
```

### 4. Crear usuario de replicacion y DB de prueba

```powershell
wsl -d primary-db -- bash -c "su postgres -c \"/usr/pgsql-15/bin/psql -c \\\"CREATE USER replicator WITH REPLICATION PASSWORD 'rep_pass_2026';\\\"\""
wsl -d primary-db -- bash -c "su postgres -c \"/usr/pgsql-15/bin/psql -c \\\"CREATE DATABASE sigo_ollas_test;\\\"\""
wsl -d primary-db -- bash -c "su postgres -c \"/usr/pgsql-15/bin/psql -d sigo_ollas_test -c \\\"CREATE TABLE beneficiaries (id SERIAL PRIMARY KEY, dni VARCHAR(8) UNIQUE NOT NULL, full_name VARCHAR(200) NOT NULL, priority_level INT DEFAULT 1, created_at TIMESTAMP DEFAULT now());\\\"\""
wsl -d primary-db -- bash -c "su postgres -c \"/usr/pgsql-15/bin/psql -c \\\"SELECT * FROM pg_create_physical_replication_slot('replica_slot_1');\\\"\""
```

### 5. Configurar la replica

```powershell
# Configurar pgpass para autenticacion automatica
wsl -d replica-db -- bash -c "echo '172.18.128.229:5432:*:replicator:rep_pass_2026' > /var/lib/pgsql/.pgpass && chmod 600 /var/lib/pgsql/.pgpass && chown postgres:postgres /var/lib/pgsql/.pgpass"

# Inicializar cluster en puerto 5433
wsl -d replica-db -- bash -c "mkdir -p /var/lib/pgsql/15/data && chown -R postgres:postgres /var/lib/pgsql && su postgres -c '/usr/pgsql-15/bin/initdb -D /var/lib/pgsql/15/data --auth=trust --locale=C.utf8 --encoding=UTF8'"
wsl -d replica-db -- bash -c "sed -i 's/^port = 5432/port = 5433/' /var/lib/pgsql/15/data/postgresql.conf"

# Realizar basebackup desde primary (genera standby.signal automaticamente con -R)
wsl -d replica-db -- bash -c "su postgres -c '/usr/pgsql-15/bin/pg_basebackup -h 172.18.128.229 -p 5432 -D /var/lib/pgsql/15/data -U replicator -P -Xs -R'"

# Sobrescribir config de replica (puerto 5433)
wsl -d replica-db -- bash -c "cp /mnt/c/.../proyecto-ollas-comunes/infra-ha/wsl/replica-postgresql.conf /var/lib/pgsql/15/data/postgresql.conf"
wsl -d replica-db -- bash -c "cp /mnt/c/.../proyecto-ollas-comunes/infra-ha/wsl/replica-pg_hba.conf      /var/lib/pgsql/15/data/pg_hba.conf"
wsl -d replica-db -- bash -c "chown postgres:postgres /var/lib/pgsql/15/data/postgresql.conf /var/lib/pgsql/15/data/pg_hba.conf"
wsl -d replica-db -- bash -c "chmod 700 /var/lib/pgsql/15/data"

# Arrancar replica como standby
wsl -d replica-db -- bash -c "su postgres -c '/usr/pgsql-15/bin/pg_ctl -D /var/lib/pgsql/15/data -l /var/lib/pgsql/15/data/log_replica.log start'"
```

### 6. Ejecutar las pruebas

```powershell
# 6.1 Verificar que la replicacion funciona
wsl -d primary-db -- bash /mnt/c/.../proyecto-ollas-comunes/infra-ha/scripts/03-check-replication.sh

# 6.2 Test de failover
# Paso 1: caer el primary
wsl -d primary-db -- bash /mnt/c/.../proyecto-ollas-comunes/infra-ha/scripts/04-failover-test.sh
# Paso 2: promover la replica (en otra terminal)
wsl -d replica-db -- bash /mnt/c/.../proyecto-ollas-comunes/infra-ha/scripts/04-failover-test-replica.sh

# 6.3 Test de backup (en la nueva primary, puerto 5433)
wsl -d replica-db -- bash /mnt/c/.../proyecto-ollas-comunes/infra-ha/scripts/05-backup-test.sh 5433

# 6.4 Test de restore
wsl -d replica-db -- bash /mnt/c/.../proyecto-ollas-comunes/infra-ha/scripts/06-restore-test.sh /tmp/sigo_ollas_backup_*.dump 5433
```

## Evidencias generadas

Las ejecuciones reales (julio 2026) generaron los siguientes archivos en `evidence/`:

| Archivo | Contenido |
|---------|-----------|
| `replication_status.txt` | `pg_stat_replication`, slots, conteos antes/después |
| `replica_state.txt` | `pg_is_in_recovery`, datos replicados, `primary_conninfo` |
| `failover_log.txt` | Caída del primary + promoción de la replica + RTO medido |
| `backup_log.txt` | `pg_dump -Fc` con tiempo y tamaño |
| `restore_log.txt` | `pg_restore` con tiempo e integridad verificada |
| `last_backup.dump` | Backup binario (3.4 KB) usado en el restore |

## Troubleshooting

- **"data directory has invalid permissions"**: ejecutar `chmod 700 /var/lib/pgsql/15/data` antes de arrancar.
- **"could not bind IPv4 address"**: otro postgres ya escucha en ese puerto. Verificar con `ps auxf | grep postgres`.
- **bc: command not found**: usar `awk "BEGIN {printf \"%.3f\", ${T_END} - ${T_START}}"` en lugar de `bc`.
- **pg_basebackup pide password infinitamente**: crear `/var/lib/pgsql/.pgpass` con permisos 600.
