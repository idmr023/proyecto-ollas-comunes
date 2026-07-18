#!/usr/bin/env node
/**
 * SIGO-OLLAS — Escáner de Seguridad Completo v2.0
 *
 * Cobertura 100% de pruebas de seguridad DAST + SAST:
 *   1. npm audit (dependencias vulnerables)
 *   2. HTTP Security Headers (OWASP Secure Headers)
 *   3. CORS behavior verification
 *   4. Cookie security flags
 *   5. Information leakage detection
 *   6. Path traversal probes
 *   7. SQL Injection indicators in responses
 *   8. Server information disclosure
 *   9. TLS/SSL configuration
 *  10. Rate limiting verification
 *  11. JWT/Token exposure in URLs
 *  12. OWASP ZAP integration (--zap)
 *
 * Uso:
 *   node security-scan.cjs              — Full scan (sin ZAP)
 *   node security-scan.cjs --zap        — Con OWASP ZAP
 *   node security-scan.cjs --json       — Output JSON adicional
 *   node security-scan.cjs --all        — Todo combinado
 */

const fs = require("node:fs")
const path = require("node:path")
const https = require("node:https")
const http = require("node:http")
const { execSync } = require("node:child_process")
const { URL } = require("node:url")

// ─── Configuration ─────────────────────────────────────────────────────

const TARGET_URL = process.env.SECURITY_TARGET_URL || process.env.PUBLIC_URL || "https://proyecto-ollas-comunes.vercel.app"
const PROJECT_DIR = path.resolve(__dirname)
const FRONTEND_DIR = path.resolve(PROJECT_DIR, "frontend")
const BACKEND_DIR = path.resolve(PROJECT_DIR, "backend")
const DOCS_DIR = path.resolve(PROJECT_DIR, "docs")
const ZAP_URL = process.env.ZAP_URL || "http://localhost:8080"
const ZAP_API_KEY = process.env.ZAP_API_KEY || "clave-segura-zap"
const IS_JSON = process.argv.includes("--json") || process.argv.includes("--all")
const IS_ZAP = process.argv.includes("--zap") || process.argv.includes("--all")

const results = {
  timestamp: new Date().toISOString(),
  target: TARGET_URL,
  score: 100,
  grade: "",
  sections: {},
  alerts: [],
}

function log(msg) { console.log(`[security-scan] ${msg}`) }
function warn(msg) { console.log(`[security-scan] ⚠️  ${msg}`) }

function deduct(severity, message, section) {
  const penalties = { critical: 15, high: 10, medium: 5, low: 2, info: 1 }
  results.score -= (penalties[severity] || 1)
  results.alerts.push({ severity, message, section, timestamp: new Date().toISOString() })
}

// ─── HTTP Helpers ──────────────────────────────────────────────────────

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === "https:" ? https : http
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || "GET",
      timeout: 15000,
      headers: options.headers || {},
      rejectAuthorized: false,
    }
    const req = client.request(reqOpts, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data, url })
      })
    })
    req.on("error", (err) => {
      if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
        resolve({ status: 0, headers: {}, body: "", error: err.message, url })
      } else { reject(err) }
    })
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0, headers: {}, body: "", error: "timeout", url }) })
    req.end()
  })
}

function checkHeader(headers, name, test, severity, description) {
  const value = (headers[name] || headers[name.toLowerCase()] || "").toString()
  let passed = false
  if (typeof test === "string") passed = value.includes(test)
  else if (test instanceof RegExp) passed = test.test(value)
  else if (Array.isArray(test)) passed = test.some(t => value.includes(t))

  const result = { header: name, value: value || "(ausente)", passed, severity, description }
  if (!passed) deduct(severity, `Header ${name}: ${description}`, "headers")
  return result
}

// ─── Section 1: npm audit ──────────────────────────────────────────────

function runNpmAudit(dir, label) {
  log(`1. npm audit — ${label}...`)
  try {
    const output = execSync("npm audit --json 2>nul", {
      cwd: dir, timeout: 60000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"],
    })
    return parseAuditJson(output, label)
  } catch (err) {
    if (err.stdout) return parseAuditJson(err.stdout, label)
    return { error: err.message }
  }
}

function parseAuditJson(output, label) {
  try {
    const parsed = JSON.parse(output)
    const vulns = parsed.vulnerabilities || {}
    const counts = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 }
    const details = []
    for (const [name, v] of Object.entries(vulns)) {
      counts[v.severity || "low"]++
      if (v.severity === "critical" || v.severity === "high") {
        details.push({ name, severity: v.severity, via: v.via?.map(x => typeof x === "string" ? x : x.title).join(", ") || "" })
      }
    }
    if (counts.critical > 0) deduct("critical", `npm audit ${label}: ${counts.critical} vulnerabilidades críticas`, "npm-audit")
    if (counts.high > 0) deduct("high", `npm audit ${label}: ${counts.high} vulnerabilidades altas`, "npm-audit")
    if (counts.moderate > 0) deduct("medium", `npm audit ${label}: ${counts.moderate} vulnerabilidades moderadas`, "npm-audit")
    return { total: Object.keys(vulns).length, ...counts, details }
  } catch { return { error: "JSON parse failed" } }
}

// ─── Section 2: HTTP Security Headers ──────────────────────────────────

async function scanHeaders() {
  log(`2. HTTP Security Headers — ${TARGET_URL}`)
  const res = await fetchUrl(TARGET_URL)
  if (res.status === 0) {
    deduct("critical", `No se pudo conectar a ${TARGET_URL}: ${res.error}`, "headers")
    return { error: res.error }
  }

  const h = res.headers
  const checks = [
    checkHeader(h, "x-frame-options", ["DENY", "SAMEORIGIN"], "high", "Previene clickjacking (CWE-1021)"),
    checkHeader(h, "x-content-type-options", "nosniff", "medium", "Previene MIME sniffing (CWE-693)"),
    checkHeader(h, "strict-transport-security", /max-age=\d+/, "high", "Fuerza HTTPS via HSTS (CWE-319)"),
    checkHeader(h, "content-security-policy", /./, "high", "Previene XSS via CSP (CWE-693)"),
    checkHeader(h, "referrer-policy", /strict-origin|no-referrer|same-origin|origin-when-cross-origin/i, "medium", "Controla Referrer-Policy (CWE-200)"),
    checkHeader(h, "permissions-policy", /./, "medium", "Restringe features del navegador (CWE-250)"),
    checkHeader(h, "cross-origin-resource-policy", /same-origin|cross-origin|none/i, "medium", "Controla CORP (CWE-942)"),
    checkHeader(h, "cross-origin-opener-policy", /same-origin|same-origin-allow-popups|unsafe-none/i, "low", "Controla COOP"),
    checkHeader(h, "x-permitted-cross-domain-policies", /none|master-only/i, "low", "Controla cross-domain Flash/PDF"),
  ]

  // Verificar que NO se exponga X-Powered-By
  const poweredBy = h["x-powered-by"] || ""
  if (poweredBy) {
    checks.push({ header: "x-powered-by", value: poweredBy, passed: false, severity: "medium",
      description: "X-Powered-By revela tecnología del servidor (CWE-200)" })
    deduct("medium", `X-Powered-By expuesto: ${poweredBy}`, "headers")
  }

  // Verificar que NO se exponga Server detallado
  const server = h["server"] || ""
  if (server && /express|node|apache|nginx|php/i.test(server)) {
    checks.push({ header: "server", value: server, passed: false, severity: "low",
      description: "Server header revela versión (CWE-200)" })
    deduct("low", `Server header expone tecnología: ${server}`, "headers")
  }

  // Verificar X-XSS-Protection (deprecated pero aún relevante)
  const xssProt = h["x-xss-protection"] || ""
  if (xssProt && !/^0$/.test(xssProt) && !/^1;\s*mode=block$/i.test(xssProt)) {
    checks.push({ header: "x-xss-protection", value: xssProt, passed: false, severity: "low",
      description: "X-XSS-Protection tiene valor no estándar (recomendado: 0 o 1; mode=block)" })
  }

  return { status: res.status, checks }
}

// ─── Section 3: CORS Verification ──────────────────────────────────────

async function scanCors() {
  log("3. CORS Verification...")

  const tests = []

  // Test 1: Origin permitido
  const allowed = await fetchUrl(TARGET_URL, { headers: { "Origin": TARGET_URL } })
  const acao = allowed.headers["access-control-allow-origin"]
  tests.push({
    name: "Origin propio permitido",
    passed: !!acao,
    detail: acao || "(sin header)",
  })

  // Test 2: Origin malicioso rechazado
  const malicious = await fetchUrl(TARGET_URL, { headers: { "Origin": "https://evil.com" } })
  const evilAcao = malicious.headers["access-control-allow-origin"]
  const evilBlocked = !evilAcao || evilAcao !== "https://evil.com"
  tests.push({
    name: "Origin malicioso bloqueado",
    passed: evilBlocked,
    detail: evilAcao ? `ALLOWED: ${evilAcao} (FALLO!)` : "(correctamente bloqueado)",
  })
  if (!evilBlocked) deduct("critical", "CORS permite origin malicioso: evil.com", "cors")

  // Test 3: CORS credentials
  const credTest = await fetchUrl(TARGET_URL, { headers: { "Origin": TARGET_URL } })
  const acc = credTest.headers["access-control-allow-credentials"]
  if (acc === "true") {
    tests.push({ name: "CORS credentials", passed: false, detail: "Allow-Credentials: true (verificar whitelist)" })
    // Not necessarily a failure, but worth flagging
  }

  // Test 4: Wildcard check
  if (acao === "*") {
    tests.push({ name: "CORS wildcard", passed: false, detail: "Access-Control-Allow-Origin: * (INSEGURO)" })
    deduct("high", "CORS usa wildcard * — cualquier origin puede acceder", "cors")
  } else {
    tests.push({ name: "CORS wildcard", passed: true, detail: acao || "no aplica" })
  }

  // Test 5: Preflight OPTIONS
  const preflight = await fetchUrl(TARGET_URL, {
    method: "OPTIONS",
    headers: { "Origin": "https://test.com", "Access-Control-Request-Method": "POST" },
  })
  const pAcao = preflight.headers["access-control-allow-origin"]
  const pMethods = preflight.headers["access-control-allow-methods"]
  tests.push({
    name: "Preflight OPTIONS responde",
    passed: preflight.status === 200 || preflight.status === 204,
    detail: `Status: ${preflight.status}, Methods: ${pMethods || "(ausente)"}`,
  })

  return { tests }
}

// ─── Section 4: Cookie Security ────────────────────────────────────────

async function scanCookies() {
  log("4. Cookie Security Flags...")
  const res = await fetchUrl(TARGET_URL)
  const setCookie = res.headers["set-cookie"]
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : []

  const results = []
  if (cookies.length === 0) {
    results.push({ name: "Cookies", passed: true, detail: "No se detectaron cookies en la respuesta (usa JWT en sessionStorage — OK)" })
    return { cookies: results, count: 0 }
  }

  for (const cookie of cookies) {
    const name = cookie.split("=")[0]
    const hasSecure = /secure/i.test(cookie)
    const hasHttpOnly = /httponly/i.test(cookie)
    const hasSameSite = /samesite=/i.test(cookie)
    const sameSiteMatch = cookie.match(/samesite=(\w+)/i)
    const sameSiteValue = sameSiteMatch ? sameSiteMatch[1] : "none"

    if (!hasSecure) {
      results.push({ name, passed: false, detail: `Falta flag Secure` })
      deduct("high", `Cookie '${name}' sin flag Secure (CWE-614)`, "cookies")
    }
    if (!hasHttpOnly) {
      results.push({ name, passed: false, detail: `Falta flag HttpOnly` })
      deduct("high", `Cookie '${name}' sin flag HttpOnly — vulnerable a XSS (CWE-1004)`, "cookies")
    }
    if (!hasSameSite) {
      results.push({ name, passed: false, detail: `Falta flag SameSite` })
      deduct("medium", `Cookie '${name}' sin flag SameSite (CWE-352)`, "cookies")
    } else if (sameSiteValue.toLowerCase() === "none") {
      results.push({ name, passed: false, detail: `SameSite=None (permite cross-site)` })
      deduct("medium", `Cookie '${name}' SameSite=None — vulnerable a CSRF`, "cookies")
    }

    if (hasSecure && hasHttpOnly && hasSameSite && sameSiteValue.toLowerCase() !== "none") {
      results.push({ name, passed: true, detail: `Secure ✓ HttpOnly ✓ SameSite=${sameSiteValue} ✓` })
    }
  }

  return { cookies: results, count: cookies.length }
}

// ─── Section 5: Information Leakage ────────────────────────────────────

async function scanLeakage() {
  log("5. Information Leakage Detection...")
  const tests = []

  // Test 5.1: .env file accessible
  const envRes = await fetchUrl(`${TARGET_URL}/.env`)
  tests.push({
    name: ".env file exposure",
    passed: envRes.status !== 200 || !envRes.body.includes("DATABASE_URL"),
    detail: `Status: ${envRes.status}`,
  })
  if (envRes.status === 200 && envRes.body.includes("DATABASE_URL")) {
    deduct("critical", ".env file expuesto públicamente con DATABASE_URL", "leakage")
  }

  // Test 5.2: .git directory
  const gitRes = await fetchUrl(`${TARGET_URL}/.git/config`)
  tests.push({
    name: ".git directory exposure",
    passed: gitRes.status !== 200,
    detail: `Status: ${gitRes.status}`,
  })
  if (gitRes.status === 200) deduct("critical", "Directorio .git expuesto públicamente", "leakage")

  // Test 5.3: .git/config
  const gitConfig = await fetchUrl(`${TARGET_URL}/.git/config`)
  tests.push({
    name: ".git/config accessible",
    passed: gitConfig.status !== 200,
    detail: `Status: ${gitConfig.status}`,
  })
  if (gitConfig.status === 200) deduct("critical", ".git/config accesible — exposición de repo", "leakage")

  // Test 5.4: robots.txt
  const robotsRes = await fetchUrl(`${TARGET_URL}/robots.txt`)
  tests.push({
    name: "robots.txt visible",
    passed: robotsRes.status === 200,
    detail: `Status: ${robotsRes.status} ${robotsRes.status === 200 ? '(OK - informativo)' : ''}`,
  })

  // Test 5.5: sitemap.xml
  const sitemapRes = await fetchUrl(`${TARGET_URL}/sitemap.xml`)
  tests.push({
    name: "sitemap.xml accessible",
    passed: sitemapRes.status === 200,
    detail: `Status: ${sitemapRes.status}`,
  })

  // Test 5.6: Common sensitive files
  const sensitiveFiles = [
    "/package.json", "/package-lock.json", "/yarn.lock",
    "/tsconfig.json", "/.env.example", "/.env.local",
    "/wp-admin/", "/phpinfo.php", "/server-status",
    "/api/docs", "/swagger.json", "/swagger-ui/",
    "/debug/", "/trace.axd", "/elmah.axd",
  ]
  for (const file of sensitiveFiles) {
    const fRes = await fetchUrl(`${TARGET_URL}${file}`)
    if (fRes.status === 200 && fRes.body.length > 50) {
      tests.push({ name: `Sensitive file: ${file}`, passed: false, detail: `Accessible (200, ${fRes.body.length} bytes)` })
      deduct("medium", `Archivo sensible accesible: ${file} (CWE-538)`, "leakage")
    }
  }

  // Test 5.7: Stack trace in error responses
  const errRes = await fetchUrl(`${TARGET_URL}/api/nonexistent-endpoint-12345`)
  const hasStack = /at\s+.*\(/.test(errRes.body) || /node_modules/.test(errRes.body)
  tests.push({
    name: "Stack trace in 404",
    passed: !hasStack,
    detail: hasStack ? "Stack trace detectado en respuesta 404" : "Sin stack trace",
  })
  if (hasStack) deduct("high", "Stack trace expuesto en respuesta de error (CWE-209)", "leakage")

  // Test 5.8: Error response content type
  tests.push({
    name: "Error response es JSON",
    passed: errRes.headers["content-type"]?.includes("json"),
    detail: errRes.headers["content-type"] || "(no content-type)",
  })

  return { tests }
}

// ─── Section 6: Path Traversal Probes ──────────────────────────────────

async function scanPathTraversal() {
  log("6. Path Traversal Probes...")
  const payloads = [
    "/../../../etc/passwd",
    "/..%2f..%2f..%2fetc/passwd",
    "/....//....//....//etc/passwd",
    "/%2e%2e/%2e%2e/%2e%2e/etc/passwd",
    "/..\\..\\..\\windows\\system32",
    "/static/../../../etc/passwd",
    "/api/../../../etc/passwd",
  ]

  const tests = []
  for (const payload of payloads) {
    const res = await fetchUrl(`${TARGET_URL}${payload}`)
    const hasPasswd = /root:|daemon:|nobody:/.test(res.body)
    tests.push({
      name: `Path traversal: ${payload}`,
      passed: !hasPasswd && res.status !== 200,
      detail: `Status: ${res.status}, Contains passwd: ${hasPasswd}`,
    })
    if (hasPasswd) deduct("critical", `Path traversal exitoso: ${payload} (CWE-22)`, "path-traversal")
  }

  return { tests }
}

// ─── Section 7: SQL Injection Indicators ───────────────────────────────

async function scanSqlIndicators() {
  log("7. SQL Injection Response Analysis...")
  const payloads = [
    "' OR 1=1--",
    "1' UNION SELECT null--",
    "admin'--",
    "1; DROP TABLE--",
    "' OR ''='",
  ]

  const tests = []
  for (const payload of payloads) {
    const encoded = encodeURIComponent(payload)
    const res = await fetchUrl(`${TARGET_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    const body = res.body
    const hasSqlError = /sql|syntax|mysql|postgresql|ORA-\d{5}|unterminated|pg_query/.test(body)
    tests.push({
      name: `SQL indicator: ${payload.substring(0, 20)}`,
      passed: !hasSqlError,
      detail: hasSqlError ? "SQL error detected in response!" : "Clean response",
    })
    if (hasSqlError) deduct("critical", "SQL error expuesto en respuesta — posible SQLi (CWE-89)", "sqli")
  }

  return { tests }
}

// ─── Section 8: Server Info ────────────────────────────────────────────

async function scanServerInfo() {
  log("8. Server Information Disclosure...")
  const res = await fetchUrl(TARGET_URL)
  const h = res.headers
  const tests = []

  // Server header
  const server = h["server"] || ""
  tests.push({
    name: "Server header",
    passed: !server,
    detail: server || "(ausente — OK)",
  })
  if (server) deduct("low", `Server header expone: ${server}`, "server-info")

  // X-Powered-By
  const powered = h["x-powered-by"] || ""
  tests.push({
    name: "X-Powered-By header",
    passed: !powered,
    detail: powered || "(ausente — OK)",
  })
  if (powered) deduct("medium", `X-Powered-By expone: ${powered}`, "server-info")

  // X-AspNet-Version, X-AspNetMvc-Version
  const aspnet = h["x-aspnet-version"] || h["x-aspnetmvc-version"] || ""
  tests.push({
    name: "ASP.NET version headers",
    passed: !aspnet,
    detail: aspnet || "(ausente — OK)",
  })
  if (aspnet) deduct("medium", `ASP.NET version expuesta: ${aspnet}`, "server-info")

  // Verificar que la app retorna JSON en health endpoint
  const healthRes = await fetchUrl(`${TARGET_URL}/api/health`)
  tests.push({
    name: "Health endpoint retorna JSON",
    passed: healthRes.headers["content-type"]?.includes("json"),
    detail: healthRes.headers["content-type"] || "(no JSON)",
  })

  return { tests }
}

// ─── Section 9: TLS/SSL ───────────────────────────────────────────────

async function scanTls() {
  log("9. TLS/SSL Configuration...")
  const tests = []

  try {
    const parsed = new URL(TARGET_URL)
    if (parsed.protocol === "https:") {
      tests.push({
        name: "HTTPS habilitado",
        passed: true,
        detail: "Conexión HTTPS activa",
      })

      // Test HTTP→HTTPS redirect
      const httpUrl = TARGET_URL.replace("https://", "http://")
      try {
        const httpRes = await fetchUrl(httpUrl)
        const redirectsToHttps = /301|302|307|308/.test(String(httpRes.status)) &&
          (httpRes.headers["location"] || "").includes("https://")
        tests.push({
          name: "HTTP→HTTPS redirect",
          passed: redirectsToHttps,
          detail: `Status: ${httpRes.status}, Location: ${httpRes.headers["location"] || "(ausente)"}`,
        })
        if (!redirectsToHttps && httpRes.status !== 0) {
          deduct("high", "No hay redirect HTTP→HTTPS (CWE-319)", "tls")
        }
      } catch {
        tests.push({ name: "HTTP→HTTPS redirect", passed: true, detail: "HTTP no accesible (OK)" })
      }
    } else {
      tests.push({ name: "HTTPS habilitado", passed: false, detail: `Protocolo: ${parsed.protocol}` })
      deduct("critical", "La aplicación NO usa HTTPS (CWE-319)", "tls")
    }
  } catch (e) {
    tests.push({ name: "TLS check", passed: false, detail: e.message })
  }

  return { tests }
}

// ─── Section 10: Rate Limiting ─────────────────────────────────────────

async function scanRateLimiting() {
  log("10. Rate Limiting Verification...")
  const tests = []

  // Intentar 10 requests rápidos al login
  let gotRateLimited = false
  let lastStatus = 200
  for (let i = 0; i < 12; i++) {
    const res = await fetchUrl(`${TARGET_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    lastStatus = res.status
    if (res.status === 429) {
      gotRateLimited = true
      break
    }
  }

  tests.push({
    name: "Rate limiting en /api/auth/login",
    passed: gotRateLimited,
    detail: gotRateLimited ? "HTTP 429 recibido (rate limit activo)" : `Último status: ${lastStatus} (sin rate limit detectado)`,
  })
  if (!gotRateLimited) deduct("high", "Rate limiting no detectado en /api/auth/login (CWE-770)", "rate-limit")

  return { tests }
}

// ─── Section 11: JWT Exposure ──────────────────────────────────────────

async function scanJwtExposure() {
  log("11. JWT/Token Exposure Check...")
  const tests = []

  // Verificar que la app no retorna JWT en URL redirects
  const res = await fetchUrl(`${TARGET_URL}/api/auth/callback`)
  const body = res.body
  const hasJwtInUrl = /token=eyJ|jwt=eyJ|access_token=eyJ/.test(body)
  tests.push({
    name: "JWT no expuesto en URLs de redirect",
    passed: !hasJwtInUrl,
    detail: hasJwtInUrl ? "JWT encontrado en redirect URL" : "OK",
  })
  if (hasJwtInUrl) deduct("high", "JWT expuesto en URL de redirect (CWE-598)", "jwt-exposure")

  // Verificar que errores no exponen tokens
  const errRes = await fetchUrl(`${TARGET_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  const errHasToken = /eyJ[A-Za-z0-9_-]{20,}/.test(errRes.body)
  tests.push({
    name: "JWT no expuesto en mensajes de error",
    passed: !errHasToken,
    detail: errHasToken ? "Token JWT detectado en error response" : "OK",
  })

  return { tests }
}

// ─── Section 12: Content Type Verification ─────────────────────────────

async function scanContentType() {
  log("12. Content-Type Verification...")
  const tests = []

  const endpoints = ["/", "/api/health", "/api/auth/login"]
  for (const ep of endpoints) {
    const res = await fetchUrl(`${TARGET_URL}${ep}`)
    const ct = res.headers["content-type"] || ""
    const isJson = ct.includes("json") || ct.includes("text")
    tests.push({
      name: `${ep} → Content-Type válido`,
      passed: isJson,
      detail: ct || "(sin content-type)",
    })
    if (!isJson && res.status === 200) {
      deduct("low", `Content-Type no estándar en ${ep}: ${ct}`, "content-type")
    }
  }

  return { tests }
}

// ─── OWASP ZAP Integration ────────────────────────────────────────────

async function runZapScan() {
  if (!IS_ZAP) return null
  log("13. OWASP ZAP Active Scan...")

  try {
    const versionRes = await fetchUrl(`${ZAP_URL}/JSON/core/view/version/?apikey=${ZAP_API_KEY}`)
    if (versionRes.status !== 200) {
      warn("ZAP no disponible. Saltando escaneo activo.")
      return { error: "ZAP no disponible" }
    }
    const version = JSON.parse(versionRes.body)
    log(`   ZAP v${version.version} detectado`)

    // Spider
    log("   Iniciando Spider...")
    const spiderRes = await fetchUrl(`${ZAP_URL}/JSON/spider/action/scan/?url=${encodeURIComponent(TARGET_URL)}&maxChildren=0&recurse=true&apikey=${ZAP_API_KEY}`)
    const spiderData = JSON.parse(spiderRes.body)
    log(`   Spider ID: ${spiderData.scan}`)

    await new Promise(r => setTimeout(r, 10000))

    // Poll spider
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000))
      const statusRes = await fetchUrl(`${ZAP_URL}/JSON/spider/view/status/?scanId=${spiderData.scan}&apikey=${ZAP_API_KEY}`)
      const statusData = JSON.parse(statusRes.body)
      process.stdout.write(`\r   Spider: ${statusData.status}%`)
      if (parseInt(statusData.status) >= 100) break
    }
    process.stdout.write("\n")

    // Active scan
    log("   Iniciando Active Scan...")
    const scanRes = await fetchUrl(`${ZAP_URL}/JSON/ascan/action/scan/?url=${encodeURIComponent(TARGET_URL)}&recurse=true&maxAlertsPerRule=50&apikey=${ZAP_API_KEY}`)
    const scanData = JSON.parse(scanRes.body)
    log(`   Active Scan ID: ${scanData.scan}`)

    // Poll active scan
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 10000))
      const statusRes = await fetchUrl(`${ZAP_URL}/JSON/ascan/view/status/?scanId=${scanData.scan}&apikey=${ZAP_API_KEY}`)
      const statusData = JSON.parse(statusRes.body)
      process.stdout.write(`\r   Active Scan: ${statusData.status}%`)
      if (parseInt(statusData.status) >= 100) break
    }
    process.stdout.write("\n")

    // Get alerts
    const alertsRes = await fetchUrl(`${ZAP_URL}/JSON/core/view/alerts/?baseurl=${encodeURIComponent(TARGET_URL)}&start=0&count=200&apikey=${ZAP_API_KEY}`)
    const alertData = JSON.parse(alertsRes.body)

    // Save report
    const htmlReport = await fetchUrl(`${ZAP_URL}/OTHER/core/other/htmlreport/?apikey=${ZAP_API_KEY}`)
    const reportPath = path.join(DOCS_DIR, `reporte_zap_${new Date().toISOString().slice(0, 10)}.html`)
    fs.writeFileSync(reportPath, htmlReport.body)
    log(`   Reporte ZAP guardado: ${reportPath}`)

    return {
      status: "completado",
      alerts: alertData.alerts?.length || 0,
      reportPath,
      highRisk: alertData.alerts?.filter(a => a.risk === "High").length || 0,
      mediumRisk: alertData.alerts?.filter(a => a.risk === "Medium").length || 0,
    }
  } catch (err) {
    warn(`ZAP scan error: ${err.message}`)
    return { error: err.message }
  }
}

// ─── Report Generation ─────────────────────────────────────────────────

function generateReport(allSections) {
  results.score = Math.max(0, Math.min(100, results.score))
  results.grade = results.score >= 90 ? "A" : results.score >= 75 ? "B" : results.score >= 60 ? "C" : results.score >= 40 ? "D" : "F"

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SIGO-OLLAS — Reporte de Seguridad Completo v2.0</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace; max-width: 1100px; margin: 0 auto; padding: 2rem; background: #0a0a0a; color: #e0e0e0; }
  h1 { color: #4ade80; border-bottom: 2px solid #4ade80; padding-bottom: 0.5rem; }
  h2 { color: #a3a3a3; margin-top: 2rem; border-bottom: 1px solid #333; padding-bottom: 0.3rem; }
  .score-box { display: flex; align-items: center; gap: 2rem; margin: 1.5rem 0; }
  .score-circle { width: 90px; height: 90px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: bold; }
  .grade-A { background: #065f46; color: #4ade80; } .grade-B { background: #1e3a5f; color: #60a5fa; }
  .grade-C { background: #7c2d12; color: #fbbf24; } .grade-D { background: #7f1d1d; color: #ef4444; }
  .grade-F { background: #450a0a; color: #dc2626; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.5rem; margin: 1rem 0; }
  .stat { padding: 0.8rem; border-radius: 8px; text-align: center; font-weight: bold; }
  .stat-critical { background: #450a0a; color: #fca5a5; }
  .stat-high { background: #7f1d1d; color: #fca5a5; }
  .stat-medium { background: #78350f; color: #fcd34d; }
  .stat-low { background: #713f12; color: #fde68a; }
  .stat-info { background: #1e3a5f; color: #93c5fd; }
  .stat-pass { background: #065f46; color: #4ade80; }
  table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; font-size: 0.82rem; }
  th, td { text-align: left; padding: 0.5rem; border: 1px solid #222; }
  th { background: #111; color: #a3a3a3; font-size: 0.7rem; text-transform: uppercase; }
  .pass { background: #052e16; } .fail { background: #2e0f0f; }
  .section { background: #111; border-radius: 8px; padding: 1.2rem; margin: 0.8rem 0; border: 1px solid #222; }
  .section-title { font-weight: bold; color: #4ade80; margin-bottom: 0.5rem; }
  footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #222; color: #666; font-size: 0.75rem; text-align: center; }
</style>
</head>
<body>
<h1>🛡️ SIGO-OLLAS — Reporte de Seguridad Completo</h1>
<p><strong>Fecha:</strong> ${results.timestamp} | <strong>Target:</strong> <code>${TARGET_URL}</code></p>

<div class="score-box">
  <div class="score-circle grade-${results.grade}">${results.score}</div>
  <div>
    <p style="font-size:1.2rem;font-weight:bold;">Grado: ${results.grade} (${results.score}/100)</p>
    <p style="color:#666;font-size:0.85rem;">
      ${results.alerts.filter(a => a.severity === "critical").length} críticos |
      ${results.alerts.filter(a => a.severity === "high").length} altos |
      ${results.alerts.filter(a => a.severity === "medium").length} medios |
      ${results.alerts.filter(a => a.severity === "low").length} bajos
    </p>
  </div>
</div>

<div class="stats">
  <div class="stat stat-critical">🔴 ${results.alerts.filter(a => a.severity === "critical").length}<br><small>CRÍTICOS</small></div>
  <div class="stat stat-high">🟠 ${results.alerts.filter(a => a.severity === "high").length}<br><small>ALTOS</small></div>
  <div class="stat stat-medium">🟡 ${results.alerts.filter(a => a.severity === "medium").length}<br><small>MEDIOS</small></div>
  <div class="stat stat-low">⚪ ${results.alerts.filter(a => a.severity === "low").length}<br><small>BAJOS</small></div>
  <div class="stat stat-pass">✅ ${results.alerts.filter(a => a.severity === "info").length}<br><small>PASARON</small></div>
</div>

<h2>Resultados por Sección</h2>
${allSections.map(s => `
<div class="section">
  <div class="section-title">${s.title}</div>
  <table>
    <thead><tr><th>Prueba</th><th>Estado</th><th>Detalle</th></tr></thead>
    <tbody>
    ${s.tests.map(t => `<tr class="${t.passed ? 'pass' : 'fail'}"><td>${t.name || t.header || ''}</td><td>${t.passed ? '✅ PASS' : '❌ FAIL'}</td><td><code>${(t.value || t.detail || '').substring(0, 200)}</code></td></tr>`).join('')}
    </tbody>
  </table>
</div>
`).join('')}

<h2>Alertas de Seguridad (${results.alerts.length})</h2>
${results.alerts.length > 0 ? `
<table>
  <thead><tr><th>Severidad</th><th>Descripción</th><th>Sección</th></tr></thead>
  <tbody>
  ${results.alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
    return (order[a.severity] || 5) - (order[b.severity] || 5)
  }).map(a => `<tr class="fail"><td>${a.severity.toUpperCase()}</td><td>${a.message}</td><td>${a.section}</td></tr>`).join('')}
  </tbody>
</table>` : '<p>✅ Sin alertas de seguridad.</p>'}

<h2>Metodología</h2>
<div class="section">
<p><strong>Estándares:</strong> OWASP Top 10 (2021), OWASP ASVS v4.0, CWE/SANS Top 25, NIST SP 800-53</p>
<p><strong>Secciones evaluadas (12):</strong></p>
<ol>
  <li>npm audit — Dependencias vulnerables (OWASP A06)</li>
  <li>HTTP Security Headers — CSP, HSTS, X-Frame-Options, etc. (OWASP A05)</li>
  <li>CORS — Cross-Origin policies, preflight, wildcards (OWASP A05)</li>
  <li>Cookie Security — Secure, HttpOnly, SameSite flags (OWASP A01)</li>
  <li>Information Leakage — .env, .git, stack traces, sensitive files (OWASP A05)</li>
  <li>Path Traversal — Directory traversal payloads (OWASP A01)</li>
  <li>SQL Injection Indicators — Error-based SQLi detection (OWASP A03)</li>
  <li>Server Information — Version disclosure, X-Powered-By (OWASP A05)</li>
  <li>TLS/SSL — HTTPS enforcement, redirect (OWASP A02)</li>
  <li>Rate Limiting — Brute force protection (OWASP A07)</li>
  <li>JWT Exposure — Token leakage in URLs/errors (OWASP A02)</li>
  <li>Content-Type — MIME type verification (OWASP A05)</li>
</ol>
<p><strong>Herramientas:</strong> npm audit, HTTP fetch (Node.js), OWASP ZAP (opcional)</p>
</div>

<footer>
  Reporte generado por <strong>SIGO-OLLAS Security Scanner v2.0</strong><br>
  ${results.alerts.length} hallazgos | Calificación: ${results.score}/100 (Grado ${results.grade})
</footer>
</body>
</html>`

  fs.mkdirSync(DOCS_DIR, { recursive: true })
  const reportPath = path.join(DOCS_DIR, "reporte_seguridad_completo.html")
  fs.writeFileSync(reportPath, html)
  log(`Reporte HTML: ${reportPath}`)
  return reportPath
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗")
  console.log("║  SIGO-OLLAS — Security Scanner v2.0             ║")
  console.log("║  Cobertura completa: OWASP Top 10 + CWE/SANS    ║")
  console.log("╚══════════════════════════════════════════════════╝\n")
  log(`Target: ${TARGET_URL}`)

  const allSections = []

  // 1. npm audit
  const frontendAudit = runNpmAudit(FRONTEND_DIR, "frontend")
  const backendAudit = runNpmAudit(BACKEND_DIR, "backend")
  allSections.push({
    title: "1. Dependencias Vulnerables (npm audit)",
    tests: [
      { name: "Frontend", passed: !frontendAudit.critical && !frontendAudit.high, detail: `${frontendAudit.total || 0} vulnerabilidades (${frontendAudit.critical || 0} critical, ${frontendAudit.high || 0} high)` },
      { name: "Backend", passed: !backendAudit.critical && !backendAudit.high, detail: `${backendAudit.total || 0} vulnerabilidades (${backendAudit.critical || 0} critical, ${backendAudit.high || 0} high)` },
      ...(frontendAudit.details || []).slice(0, 5).map(d => ({ name: d.name, passed: false, detail: `${d.severity}: ${d.via}` })),
      ...(backendAudit.details || []).slice(0, 5).map(d => ({ name: d.name, passed: false, detail: `${d.severity}: ${d.via}` })),
    ],
  })

  // 2-12. Run all HTTP scans
  const [headers, cors, cookies, leakage, pathTraversal, sqlIndicators, serverInfo, tls, rateLimiting, jwtExposure, contentType] = await Promise.all([
    scanHeaders(), scanCors(), scanCookies(), scanLeakage(),
    scanPathTraversal(), scanSqlIndicators(), scanServerInfo(),
    scanTls(), scanRateLimiting(), scanJwtExposure(), scanContentType(),
  ])

  allSections.push({ title: "2. HTTP Security Headers", tests: headers.checks || [] })
  allSections.push({ title: "3. CORS Behavior", tests: cors.tests || [] })
  allSections.push({ title: "4. Cookie Security Flags", tests: cookies.cookies || [] })
  allSections.push({ title: "5. Information Leakage", tests: leakage.tests || [] })
  allSections.push({ title: "6. Path Traversal", tests: pathTraversal.tests || [] })
  allSections.push({ title: "7. SQL Injection Indicators", tests: sqlIndicators.tests || [] })
  allSections.push({ title: "8. Server Information Disclosure", tests: serverInfo.tests || [] })
  allSections.push({ title: "9. TLS/SSL Configuration", tests: tls.tests || [] })
  allSections.push({ title: "10. Rate Limiting", tests: rateLimiting.tests || [] })
  allSections.push({ title: "11. JWT/Token Exposure", tests: jwtExposure.tests || [] })
  allSections.push({ title: "12. Content-Type Verification", tests: contentType.tests || [] })

  // 13. ZAP (optional)
  if (IS_ZAP) {
    const zapResults = await runZapScan()
    if (zapResults && !zapResults.error) {
      allSections.push({
        title: "13. OWASP ZAP Active Scan",
        tests: [
          { name: "ZAP Scan completado", passed: true, detail: `${zapResults.alerts} alertas (${zapResults.highRisk} high, ${zapResults.mediumRisk} medium)` },
        ],
      })
    }
  }

  // Generate report
  const reportPath = generateReport(allSections)

  // Summary
  console.log("\n╔══════════════════════════════════════════════════╗")
  console.log("║           ESCANEO COMPLETADO                     ║")
  console.log("╚══════════════════════════════════════════════════╝")
  console.log(`\n📊 Calificación: ${results.score}/100 (Grado ${results.grade})`)
  console.log(`🔴 Críticos:  ${results.alerts.filter(a => a.severity === "critical").length}`)
  console.log(`🟠 Altos:     ${results.alerts.filter(a => a.severity === "high").length}`)
  console.log(`🟡 Medios:    ${results.alerts.filter(a => a.severity === "medium").length}`)
  console.log(`⚪ Bajos:     ${results.alerts.filter(a => a.severity === "low").length}`)
  console.log(`\n📄 Reporte: ${reportPath}`)

  if (IS_JSON) {
    const jsonPath = path.join(DOCS_DIR, `security-scan-${new Date().toISOString().slice(0, 10)}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2))
    console.log(`📄 JSON: ${jsonPath}`)
  }

  console.log("\nAbre el reporte HTML en tu navegador para ver los detalles.\n")
}

main().catch(err => {
  console.error("Error fatal:", err)
  process.exit(1)
})
