#!/usr/bin/env node
/**
 * SIGO-OLLAS — Security Scan Todo-En-Uno
 *
 * Un solo comando que:
 *   1. Verifica si Docker está corriendo
 *   2. Levanta ZAP en Docker
 *   3. Espera a que ZAP esté listo
 *   4. Ejecuta el security scanner (12 secciones)
 *   5. Ejecuta el ZAP active scan
 *   6. Genera reportes HTML + JSON
 *
 * Uso:
 *   npm run security:all
 */

const { execSync, spawn } = require("node:child_process")
const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")

const COMPOSE_FILE = path.resolve(__dirname, "docker-compose.zap.yml")
const ZAP_URL = "http://localhost:8080"
const ZAP_API_KEY = "clave-segura-zap"

function log(msg) { console.log(`[security-all] ${msg}`) }
function warn(msg) { console.log(`[security-all] ⚠️  ${msg}`) }
function err(msg) { console.error(`[security-all] ❌ ${msg}`) }

function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = ""
      res.on("data", (c) => data += c)
      res.on("end", () => resolve({ status: res.statusCode, body: data }))
    })
    req.on("error", () => resolve({ status: 0, body: "" }))
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, body: "" }) })
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function isDockerRunning() {
  try {
    execSync("docker info", { stdio: "pipe", timeout: 10000 })
    return true
  } catch {
    return false
  }
}

async function isZapReady() {
  const res = await fetchUrl(`${ZAP_URL}/JSON/core/view/version/?apikey=${ZAP_API_KEY}`)
  return res.status === 200
}

async function main() {
  console.log("╔══════════════════════════════════════════════════╗")
  console.log("║  SIGO-OLLAS — Security Scan Completo            ║")
  console.log("║  Todo-en-un: Docker + Scanner + ZAP             ║")
  console.log("╚══════════════════════════════════════════════════╝\n")

  // ── Paso 1: Verificar Docker ──
  log("Paso 1/5: Verificando Docker...")
  const dockerRunning = await isDockerRunning()

  if (!dockerRunning) {
    err("Docker Desktop NO está corriendo.")
    console.log("")
    console.log("  Necesitas abrir Docker Desktop primero:")
    console.log("  1. Abre Docker Desktop desde el menú Inicio")
    console.log("  2. Espera a que el icono de la barra de tareas se quede verde")
    console.log("  3. Vuelve a ejecutar: npm run security:all")
    console.log("")
    console.log("  Si Docker Desktop está abierto y no funciona, ejecuta:")
    console.log("    docker info")
    console.log("  para ver el error exacto.")
    process.exit(1)
  }
  log("  ✅ Docker está corriendo")

  // ── Paso 2: Verificar si ZAP ya está corriendo ──
  log("Paso 2/5: Verificando ZAP...")
  const zapAlreadyRunning = await isZapReady()

  if (zapAlreadyRunning) {
    log("  ✅ ZAP ya está corriendo (reutilizando contenedor existente)")
  } else {
    // ── Paso 3: Levantar ZAP ──
    log("Paso 3/5: Levantando ZAP en Docker...")
    try {
      // Primero intentar levantar
      execSync(`docker compose -f "${COMPOSE_FILE}" up -d`, {
        stdio: "pipe",
        timeout: 120000,
      })
      log("  Contenedor ZAP iniciado")
    } catch (e) {
      // Si falla, puede ser que el contenedor ya exista
      const output = e.stderr ? e.stderr.toString() : ""
      if (output.includes("already exists")) {
        log("  Contenedor ya existe, reiniciando...")
        execSync(`docker compose -f "${COMPOSE_FILE}" down`, { stdio: "pipe", timeout: 30000 })
        execSync(`docker compose -f "${COMPOSE_FILE}" up -d`, { stdio: "pipe", timeout: 120000 })
      } else {
        err(`Error al levantar Docker: ${output.substring(0, 300)}`)
        process.exit(1)
      }
    }

    // ── Paso 4: Esperar a que ZAP esté listo ──
    log("Paso 4/5: Esperando a que ZAP esté listo...")
    let zapReady = false
    for (let i = 0; i < 40; i++) {
      await sleep(3000)
      zapReady = await isZapReady()
      if (zapReady) break
      process.stdout.write(".")
    }
    process.stdout.write("\n")

    if (!zapReady) {
      err("ZAP no se pudo iniciar en 120 segundos.")
      console.log("  Verifica el contenedor: docker logs sigo-zap")
      process.exit(1)
    }
    log("  ✅ ZAP está listo")
  }

  // ── Paso 5: Ejecutar security scan + ZAP ──
  log("Paso 5/5: Ejecutando escaneo completo...")
  console.log("")

  try {
    execSync("node security-scan.cjs --all", {
      stdio: "inherit",
      timeout: 3600000, // 1 hora max
      cwd: __dirname,
    })
  } catch (e) {
    warn("El escaneo terminó con errores (puede ser normal si algunos endpoints fallaron)")
  }

  console.log("")
  log("═══════════════════════════════════════════════")
  log("  ESCANEO COMPLETADO")
  log("═══════════════════════════════════════════════")
  console.log("")
  log("Reportes generados:")
  log("  docs/reporte_seguridad_completo.html   ← Security Scanner (12 secciones)")
  log("  zap-reports/zap-report-*.html          ← OWASP ZAP (active scan)")
  log("")
  log("Para detener ZAP después de revisar:")
  log("  npm run security:zap:stop")
  console.log("")
}

main().catch((e) => {
  err(`Error inesperado: ${e.message}`)
  process.exit(1)
})
