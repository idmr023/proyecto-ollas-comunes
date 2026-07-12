#!/usr/bin/env node
/**
 * SIGO-OLLAS — Escaneo de Seguridad Automatizado
 *
 * Realiza:
 * 1. npm audit en frontend y backend
 * 2. Verificación de headers HTTP de seguridad contra URL desplegada
 * 3. Escaneo básico de vulnerabilidades OWASP Top 10 vía headers
 * 4. Genera reporte HTML en docs/reporte_seguridad_web.html
 *
 * Para ejecutar con OWASP ZAP (opcional, recomendado por rúbrica):
 *   docker run -d --name zap -p 8080:8080 -p 8090:8090 owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.addrs.addr.name=.* -config api.addrs.addr.regex=true
 *   Luego ejecutar: node security-scan.mjs --zap
 */

const fs = require("node:fs")
const path = require("node:path")
const https = require("node:https")
const http = require("node:http")
const { execSync } = require("node:child_process")

const TARGET_URL = process.env.SECURITY_TARGET_URL || process.env.PUBLIC_URL || "https://proyecto-ollas-comunes.vercel.app"
const PROJECT_DIR = path.resolve(__dirname)
const FRONTEND_DIR = path.resolve(PROJECT_DIR, "frontend")
const BACKEND_DIR = path.resolve(PROJECT_DIR, "backend")
const DOCS_DIR = path.resolve(PROJECT_DIR, "docs")
const ZAP_URL = process.env.ZAP_URL || "http://localhost:8080"
const ZAP_API_KEY = process.env.ZAP_API_KEY || "clave-segura-zap"

const results = {
  timestamp: new Date().toISOString(),
  target: TARGET_URL,
  npmAudit: { frontend: null, backend: null },
  headers: {},
  owaspChecks: [],
  zapScan: null,
  score: 100,
  deductions: [],
}

function log(msg) {
  console.log(`[security-scan] ${msg}`)
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http
    const req = client.get(url, { timeout: 15000 }, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data })
      })
    })
    req.on("error", (err) => {
      if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
        resolve({ status: 0, headers: {}, body: "", error: err.message })
      } else {
        reject(err)
      }
    })
    req.setTimeout(15000, () => {
      req.destroy()
      resolve({ status: 0, headers: {}, body: "", error: "timeout" })
    })
  })
}

function checkHeader(headers, headerName, expected, severity) {
  const value = (headers[headerName] || headers[headerName.toLowerCase()] || "").toString()
  let passed = false
  let detail = ""

  if (typeof expected === "string") {
    passed = value.includes(expected)
    detail = value || "ausente"
  } else if (expected instanceof RegExp) {
    passed = expected.test(value)
    detail = value || "ausente"
  } else if (Array.isArray(expected)) {
    passed = expected.some((e) => value.includes(e))
    detail = value || "ausente"
  }

  if (!passed) {
    results.deductions.push({
      header: headerName,
      value: detail,
      severity,
      expected: String(expected),
    })
    if (severity === "crítica") results.score -= 15
    else if (severity === "alta") results.score -= 8
    else if (severity === "media") results.score -= 4
    else results.score -= 2
  }

  return { header: headerName, value: detail, passed, severity, expected: String(expected) }
}

function npmAudit(dir, label) {
  log(`Ejecutando npm audit en ${label}...`)
  try {
    const output = execSync("npm audit --json", {
      cwd: dir,
      timeout: 60000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    })
    const parsed = JSON.parse(output)
    const vulns = parsed.vulnerabilities || {}
    const counts = { low: 0, moderate: 0, high: 0, critical: 0 }
    for (const v of Object.values(vulns)) {
      const severity = v.severity || "low"
      counts[severity] = (counts[severity] || 0) + 1
    }

    if (counts.critical > 0) {
      results.deductions.push({ type: `npm audit ${label}`, detail: `${counts.critical} críticas` })
      results.score -= 10
    }
    if (counts.high > 0) {
      results.deductions.push({ type: `npm audit ${label}`, detail: `${counts.high} altas` })
      results.score -= 5
    }

    return { total: Object.keys(vulns).length, ...counts }
  } catch (err) {
    if (err.stdout) {
      try {
        const parsed = JSON.parse(err.stdout)
        const vulns = parsed.vulnerabilities || {}
        const counts = { low: 0, moderate: 0, high: 0, critical: 0 }
        for (const v of Object.values(vulns)) {
          counts[v.severity || "low"] = (counts[v.severity || "low"] || 0) + 1
        }
        return { total: Object.keys(vulns).length, ...counts }
      } catch {
        return { error: err.stdout.substring(0, 500) }
      }
    }
    return { error: err.message }
  }
}

async function scanHeaders() {
  log(`Escaneando headers de ${TARGET_URL}...`)
  const response = await fetchUrl(TARGET_URL)

  if (response.status === 0) {
    results.headers = { error: response.error || "No se pudo conectar" }
    results.deductions.push({ type: "Conectividad", detail: `No se pudo acceder a ${TARGET_URL}` })
    results.score -= 50
    return
  }

  results.headers = {
    status: response.status,
    server: response.headers["server"] || "no expuesto",
    poweredBy: response.headers["x-powered-by"] || "no expuesto",
    headers: Object.keys(response.headers).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
  }

  const checks = [
    { header: "x-frame-options", expected: "DENY", severity: "alta" },
    { header: "x-content-type-options", expected: "nosniff", severity: "media" },
    { header: "x-xss-protection", expected: /^0$|^1/, severity: "media" },
    { header: "strict-transport-security", expected: "max-age", severity: "alta" },
    { header: "content-security-policy", expected: /./, severity: "crítica" },
    { header: "referrer-policy", expected: /strict-origin|no-referrer|same-origin/, severity: "media" },
    { header: "permissions-policy", expected: /./, severity: "media" },
    { header: "cross-origin-resource-policy", expected: /same-origin|cross-origin/, severity: "alta" },
    { header: "server", expected: /^$/, severity: "baja" },
  ]

  for (const check of checks) {
    results.owaspChecks.push(checkHeader(response.headers, check.header, check.expected, check.severity))
  }

  // Verificar cookies seguras
  const setCookie = response.headers["set-cookie"] || []
  const cookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie
  if (cookieStr) {
    const hasSecure = cookieStr.includes("Secure")
    const hasHttpOnly = cookieStr.includes("HttpOnly")
    const hasSameSite = cookieStr.includes("SameSite")
    if (!hasSecure) {
      results.deductions.push({ type: "Cookies", detail: "Falta flag Secure en cookies" })
      results.score -= 5
    }
    if (!hasHttpOnly) {
      results.deductions.push({ type: "Cookies", detail: "Falta flag HttpOnly en cookies" })
      results.score -= 5
    }
    if (!hasSameSite) {
      results.deductions.push({ type: "Cookies", detail: "Falta flag SameSite en cookies" })
      results.score -= 3
    }
  }
}

async function isZapAvailable() {
  const zapResp = await fetchUrl(`${ZAP_URL}/JSON/core/view/version/?apikey=${ZAP_API_KEY}`)
  return zapResp.status === 200
}

async function pollUntilDone(statusEndpoint, jsonKey, maxAttempts, intervalMs) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    const status = await fetchUrl(statusEndpoint)
    const body = JSON.parse(status.body)
    if (Number.parseInt(body[jsonKey]) === 100) return true
  }
  return false
}

async function runZapSpider() {
  await fetchUrl(`${ZAP_URL}/JSON/spider/action/scan/?url=${encodeURIComponent(TARGET_URL)}&maxChildren=10&apikey=${ZAP_API_KEY}`)
  return await pollUntilDone(
    `${ZAP_URL}/JSON/spider/view/status/?apikey=${ZAP_API_KEY}`,
    "spider",
    30,
    5000,
  )
}

async function runZapActiveScan() {
  await fetchUrl(`${ZAP_URL}/JSON/ascan/action/scan/?url=${encodeURIComponent(TARGET_URL)}&recurse=true&apikey=${ZAP_API_KEY}`)
  return await pollUntilDone(
    `${ZAP_URL}/JSON/ascan/view/status/?apikey=${ZAP_API_KEY}`,
    "status",
    60,
    10000,
  )
}

async function saveZapReport() {
  const alertsResp = await fetchUrl(`${ZAP_URL}/JSON/core/view/alerts/?apikey=${ZAP_API_KEY}`)
  const alertData = JSON.parse(alertsResp.body)
  const htmlReport = await fetchUrl(`${ZAP_URL}/OTHER/core/other/htmlreport/?apikey=${ZAP_API_KEY}`)
  const reportPath = path.join(DOCS_DIR, "reporte_zap_seguridad.html")
  fs.writeFileSync(reportPath, htmlReport.body)
  log(`Reporte ZAP guardado en: ${reportPath}`)
  return {
    status: "completado",
    alerts: alertData.alerts ? alertData.alerts.length : 0,
    reportPath: "docs/reporte_zap_seguridad.html",
  }
}

async function zapActiveScan() {
  log("Iniciando escaneo activo con OWASP ZAP...")

  try {
    if (!(await isZapAvailable())) {
      results.zapScan = { error: "ZAP no accesible. ¿Está corriendo el contenedor Docker?" }
      return
    }

    log("ZAP detectado. Iniciando spider...")
    const spiderDone = await runZapSpider()

    if (!spiderDone) {
      results.zapScan = { status: "timeout_spider" }
      return
    }

    log("Spider completado. Iniciando escaneo activo...")
    const scanDone = await runZapActiveScan()

    if (!scanDone) {
      results.zapScan = { status: "timeout_active_scan" }
      return
    }

    results.zapScan = await saveZapReport()
  } catch (err) {
    results.zapScan = { error: err.message }
  }
}

function generateHtmlReport() {
  results.score = Math.max(0, Math.min(100, results.score))
  const grade = results.score >= 90 ? "A" : results.score >= 75 ? "B" : results.score >= 60 ? "C" : results.score >= 40 ? "D" : "F"

  const headerRows = results.owaspChecks
    .map(
      (c) => `<tr class="${c.passed ? "pass" : "fail"}">
    <td>${c.header}</td>
    <td><code>${c.value}</code></td>
    <td>${c.passed ? "✅" : "❌"}</td>
    <td>${c.severity}</td>
    <td><code>${c.expected}</code></td>
  </tr>`,
    )
    .join("")

  const deductionsHtml = results.deductions
    .map((d) => `<tr><td>${d.type || d.header || ""}</td><td>${d.detail || d.value || ""}</td><td>${d.severity || ""}</td></tr>`)
    .join("")

  const auditHtml = `
    <h3>npm audit - Frontend</h3>
    <pre>${JSON.stringify(results.npmAudit.frontend, null, 2)}</pre>
    <h3>npm audit - Backend</h3>
    <pre>${JSON.stringify(results.npmAudit.backend, null, 2)}</pre>
  `

  const zapHtml = results.zapScan
    ? `<h3>OWASP ZAP Scan</h3><pre>${JSON.stringify(results.zapScan, null, 2)}</pre>`
    : "<p>Escaneo ZAP no ejecutado. Usa <code>--zap</code> para incluirlo.</p>"

  const recommendationsHtml = []
  if (!results.owaspChecks.find((c) => c.header === "content-security-policy" && c.passed)) {
    recommendationsHtml.push("<li>Implementar Content-Security-Policy (CSP) para prevenir XSS</li>")
  }
  if (!results.owaspChecks.find((c) => c.header === "x-frame-options" && c.passed)) {
    recommendationsHtml.push("<li>Agregar X-Frame-Options: DENY para prevenir clickjacking</li>")
  }
  if (!results.owaspChecks.find((c) => c.header === "strict-transport-security" && c.passed)) {
    recommendationsHtml.push("<li>Agregar HSTS (Strict-Transport-Security) para forzar HTTPS</li>")
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SIGO-Ollas — Reporte de Seguridad Web</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem; background: #0f0f0f; color: #e0e0e0; }
    h1 { color: #4ade80; }
    h2 { border-bottom: 1px solid #333; padding-bottom: 0.5rem; margin-top: 2rem; color: #a3a3a3; }
    .score-circle { width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; margin: 1rem 0; }
    .grade-A { background: #065f46; color: #4ade80; }
    .grade-B { background: #1e3a5f; color: #60a5fa; }
    .grade-C { background: #7c2d12; color: #fbbf24; }
    .grade-D, .grade-F { background: #7f1d1d; color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { text-align: left; padding: 0.5rem 0.75rem; border: 1px solid #333; }
    th { background: #1a1a1a; color: #a3a3a3; font-size: 0.85rem; }
    .pass { background: #052e16; }
    .fail { background: #2e0f0f; }
    code { background: #1a1a1a; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
    pre { background: #1a1a1a; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.8rem; }
    ul { padding-left: 1.5rem; }
    li { margin: 0.5rem 0; }
  </style>
</head>
<body>
  <h1>SIGO-Ollas — Reporte de Seguridad Web</h1>
  <p><strong>Fecha:</strong> ${results.timestamp}</p>
  <p><strong>URL evaluada:</strong> <code>${TARGET_URL}</code></p>

  <h2>Puntuación General</h2>
  <div class="score-circle grade-${grade}">${results.score}</div>
  <p>Calificación: <strong>${grade}</strong> (${results.score}/100)</p>

  <h2>Headers de Seguridad HTTP</h2>
  <table>
    <thead><tr><th>Header</th><th>Valor</th><th>OK</th><th>Severidad</th><th>Esperado</th></tr></thead>
    <tbody>${headerRows}</tbody>
  </table>

  <h2>Deducciones / Hallazgos</h2>
  ${deductionsHtml ? `<table><thead><tr><th>Elemento</th><th>Detalle</th><th>Severidad</th></tr></thead><tbody>${deductionsHtml}</tbody></table>` : "<p>✅ Sin deducciones.</p>"}

  <h2>Vulnerabilidades en Dependencias</h2>
  ${auditHtml}

  <h2>OWASP ZAP</h2>
  ${zapHtml}

  <h2>Recomendaciones</h2>
  <ul>${recommendationsHtml.join("") || "<li>✅ No se requieren acciones inmediatas.</li>"}</ul>

  <h2>Metodología</h2>
  <p>Este reporte evalúa la seguridad siguiendo OWASP Top 10, ISO 27001 (A.14 — Adquisición, desarrollo y mantenimiento de sistemas), y buenas prácticas de hardening HTTP.</p>
  <p>Herramientas: inspección manual de headers + npm audit + OWASP ZAP (si disponible).</p>
  <p>Generado automáticamente por <code>security-scan.mjs</code></p>
</body>
</html>`

  const reportPath = path.join(DOCS_DIR, "reporte_seguridad_web.html")
  fs.writeFileSync(reportPath, html)
  log(`Reporte HTML generado: ${reportPath}`)

  return { path: reportPath, score: results.score, grade }
}

async function main() {
  log("=== SIGO-OLLAS — Escaneo de Seguridad Automatizado ===")
  log(`Objetivo: ${TARGET_URL}`)

  results.npmAudit.frontend = npmAudit(FRONTEND_DIR, "frontend")
  results.npmAudit.backend = npmAudit(BACKEND_DIR, "backend")

  await scanHeaders()

  if (process.argv.includes("--zap")) {
    await zapActiveScan()
  } else {
    log("Omitiendo ZAP. Usa --zap para incluir escaneo con OWASP ZAP.")
  }

  const report = generateHtmlReport()
  log(`=== Escaneo completado ===`)
  log(`Puntuación: ${report.score}/100 (${report.grade})`)
  log(`Reporte: ${report.path}`)
}

main().catch((err) => {
  console.error("Error fatal:", err)
  process.exit(1)
})
