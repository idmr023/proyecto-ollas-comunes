# Informe de Validacion HA/DR - WSL2

**Proyecto:** SIGO-OLLAS
**Fecha:** 2026-07-20 11:34:18
**Herramienta:** `validate-wsl-ha.sh`

## Resumen

| Metrica | Valor |
|---------|-------|
| Pruebas exitosas | 16 |
| Pruebas fallidas | 0 |
| Advertencias | 5 |
| Resultado general | ✅ VALIDACION EXITOSA |

## Detalle de Pruebas

| Resultado | Prueba |
|-----------|--------|
| ✅ | Distro 'primary-db' encontrada |
| ✅ | Distro 'replica-db' encontrada |
| ✅ | WSL2 'primary-db' esta ejecutandose |
| ✅ | WSL2 'replica-db' esta ejecutandose |
| ✅ | IP de 'primary-db': 172.18.128.229 |
| ✅ | IP de 'replica-db': 172.18.128.229 |
| ✅ | PostgreSQL en 'primary-db:5432' acepta conexiones |
| ✅ | PostgreSQL en 'replica-db:5433' acepta conexiones |
| ✅ | replica-db puede alcanzar a primary-db (172.18.128.229) |
| ✅ | primary-db puede alcanzar a replica-db (172.18.128.229) |
| ✅ | 'primary-db' es PRIMARY (no replica datos entrantes) |
| ⚠️ | PRIMARY 'primary-db' no tiene replicas conectadas (esperado post-failover) |
| ✅ | 'replica-db' es PRIMARY (no replica datos entrantes) |
| ⚠️ | PRIMARY 'replica-db' no tiene replicas conectadas (esperado post-failover) |
| ✅ | BD 'sigo_ollas_test' encontrada en 'primary-db' |
| ✅ | BD 'sigo_ollas_test' encontrada en 'replica-db' |
| ⚠️ | No se pudieron obtener recursos de 'primary-db' |
| ⚠️ | No se pudieron obtener recursos de 'replica-db' |
| ⚠️ | API health endpoint no disponible (HTTP 000000) - servidor no corriendo |
| ✅ | Conexion a PostgreSQL en 'replica-db:5433' via WSL exitosa |
| ✅ | Conexion a PostgreSQL en 'primary-db:5432' via WSL exitosa |

## Configuracion del Entorno

| Componente | Detalle |
|-----------|---------|
| Sistema operativo | Windows con WSL2 |
| Distros WSL2 | primary-db, replica-db |
| PostgreSQL | 15.18 (PGDG) |
| Red | Virtual switch WSL2 (172.18.x.x) |
| Autenticacion | scram-sha-256 con contraseña |
| Monitoreo | pg_stat_replication, pg_isready |

## Evidencias

Las evidencias de ejecucion se encuentran en:
- `evidence/logs/` - logs detallados
- `evidence/` - resultados de pruebas HA/DR
- `infra-ha/scripts/` - scripts de prueba

---
*Reporte generado automaticamente por validate-wsl-ha.sh*
