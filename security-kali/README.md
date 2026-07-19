# SIGO-OLLAS — Pruebas de Seguridad con Kali Linux

## Qué es esto

Suite de auditoría de seguridad que ejecuta herramientas ofensivas de Kali Linux contra la aplicación desplegada. **100% read-only** — no modifica archivos del proyecto ni altera el sistema.

## Herramientas que usa

| Herramienta | Qué prueba |
|---|---|
| **Nmap** | Puertos abiertos, servicios, versiones |
| **Nikto** | Headers de seguridad, configuración del servidor |
| **Dirb** | Directorios y archivos ocultos |
| **Hydra** | Rate limiting contra login |
| **SQLmap** | Inyección SQL en parámetros de búsqueda |
| **cURL** | CORS, JWT, archivos sensibles, métodos HTTP |

## Requisitos

- Kali Linux (máquina virtual, Docker, o instalación nativa)
- Herramientas: `nmap`, `nikto`, `dirb`, `hydra`, `sqlmap`, `curl`, `jq`
- Acceso a internet (target: `https://proyecto-ollas-comunes.vercel.app`)

## Instalación de herramientas (si faltan)

```bash
sudo apt update
sudo apt install nmap nikto dirb hydra sqlmap curl jq
```

## Ejecución

### Paso 1: Copiar los scripts a Kali

Si estás en Windows, copia la carpeta `security-kali/` a tu máquina Kali.

```bash
# Desde Windows (PowerShell)
scp -r security-kali/ kali@192.168.x.x:/home/kali/
```

O comparte la carpeta y accede desde Kali.

### Paso 2: Ejecutar la auditoría

```bash
cd /home/kali/security-kali
sudo bash security-audit.sh
```

La auditoría tarda ~10-15 minutos. Los resultados se guardan en `/tmp/sigo-ollas-security/`.

### Paso 3: Generar el informe

```bash
sudo bash generate-report.sh
```

Esto procesa los resultados crudos y genera `final_seguridad_kali.md`.

### Paso 4: Revisar resultados

```bash
ls -la /tmp/sigo-ollas-security/
```

## Archivos generados

```
/tmp/sigo-ollas-security/YYYYMMDD_HHMMSS/
├── nmap-proyecto-ollas-comunes.vercel.app.txt    # Resultados Nmap
├── nikto-proyecto-ollas-comunes.vercel.app.txt   # Resultados Nikto
├── dirb-proyecto-ollas-comunes.vercel.app.txt    # Resultados Dirb
├── hydra-rate-limit.txt                          # Test de rate limiting
├── sqlmap/                                       # Resultados SQLmap
├── headers-frontend.txt                          # Headers HTTP
├── headers-analysis.txt                          # Análisis de headers
├── cors-test.txt                                 # Test CORS
├── sensitive-files.txt                           # Test archivos sensibles
├── jwt-test-invalid.json                         # Test JWT
├── method-not-allowed.txt                        # Test métodos HTTP
├── server-info.txt                               # Info del servidor
├── hydra-login-response.json                     # Respuesta login
├── content-type-test.json                        # Test Content-Type
├── execution.log                                 # Log completo
├── reporte-seguridad.html                        # Reporte HTML
└── final_seguridad_kali.md                       # Reporte Markdown
```

## Seguridad de la ejecución

- **NO** se modifica `.env`
- **NO** se crean contenedores Docker
- **NO** se envían payloads destructivos
- **NO** se altera el estado del proyecto
- Hydra usa solo 5 intentos (rate limiting controlado)
- SQLmap usa nivel 1, riesgo 1 (solo detección)
- Todos los resultados van a `/tmp/`, no al proyecto

## Configuración

Edita las variables al inicio de `security-audit.sh`:

```bash
TARGET_FRONTEND="https://proyecto-ollas-comunes.vercel.app"
TARGET_BACKEND=""  # Agregar si el backend es público
TEST_EMAIL="test@ollascomunes.pe"
TEST_PASSWORD="test123"
HYDRA_ATTEMPTS=5   # Máximo intentos de brute force
```

## Limpiar resultados

```bash
sudo rm -rf /tmp/sigo-ollas-security/
```
