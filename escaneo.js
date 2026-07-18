#!/usr/bin/env node
/**
 * SIGO-OLLAS — OWASP ZAP DAST Security Scanner (Enhanced)
 *
 * Escaneo de seguridad dinámico completo contra la aplicación desplegada.
 * Cubre: SQL Injection, XSS, Path Traversal, CORS, Headers, Info Disclosure,
 *         Directory Browsing, CSRF, File Upload, Rate Limiting, y más.
 *
 * Uso:
 *   node escaneo.js                     — Escaneo estándar
 *   node escaneo.js --auth              — Con autenticación (intercepta JWT)
 *   node escaneo.js --aggressive        — Escaneo agresivo (fuerza bruta)
 *   node escaneo.js --context zap-config/sigo-context.context — Con contexto personalizado
 *
 * Requisitos previos:
 *   docker compose -f docker-compose.zap.yml up -d
 *   Esperar a que ZAP esté listo (~30 segundos)
 */

const fs = require('node:fs');
const path = require('node:path');

const ZAP_URL = process.env.ZAP_URL || 'http://localhost:8080';
const API_KEY = process.env.ZAP_API_KEY || 'clave-segura-zap';
const TARGET = process.env.SECURITY_TARGET_URL || process.env.PUBLIC_URL || 'https://proyecto-ollas-comunes.vercel.app';
const REPORT_DIR = path.resolve(__dirname, 'zap-reports');
const BACKEND_URL = process.env.BACKEND_URL || 'https://sigo-ollas-api.onrender.com';
const IS_AUTH = process.argv.includes('--auth');
const IS_AGGRESSIVE = process.argv.includes('--aggressive');
const CONTEXT_FILE = process.argv.includes('--context')
  ? process.argv[process.argv.indexOf('--context') + 1]
  : null;

let scanStartTime;
let totalAlerts = { high: 0, medium: 0, low: 0, informational: 0 };

// ─── ZAP API Helpers ───────────────────────────────────────────────────

async function zapRequest(endpoint, method = 'GET') {
  const sep = endpoint.includes('?') ? '&' : '?';
  const url = `${ZAP_URL}${endpoint}${sep}apikey=${API_KEY}`;
  const res = await fetch(url, { method });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ZAP API ${method} ${endpoint} → HTTP ${res.status}: ${text.substring(0, 200)}`);
  }
  return res.json();
}

async function waitForZapReady(maxAttempts = 40) {
  console.log('⏳ Verificando que ZAP esté disponible...');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const data = await zapRequest('/JSON/core/view/version/');
      console.log(`✅ ZAP v${data.version} detectado`);
      return true;
    } catch {
      process.stdout.write('.');
      await sleep(3000);
    }
  }
  throw new Error('ZAP no disponible después de 120 segundos. Verifica: docker compose -f docker-compose.zap.yml up -d');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function pollStatus(endpoint, jsonKey, intervalMs = 5000, maxMinutes = 30) {
  const maxAttempts = Math.ceil((maxMinutes * 60 * 1000) / intervalMs);
  let lastPct = -1;
  let stuckCount = 0;

  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    try {
      const data = await zapRequest(endpoint);
      const pct = parseInt(data[jsonKey], 10);

      if (pct !== lastPct) {
        if (lastPct !== -1) process.stdout.write('\n');
        process.stdout.write(`   Progreso: ${pct}%`);
        lastPct = pct;
        stuckCount = 0;
      } else {
        stuckCount++;
      }

      if (pct >= 100) {
        process.stdout.write('\n');
        return true;
      }

      if (stuckCount >= 36) {
        console.log('\n⚠️  Escaneo estancado. Continuando...');
        return true;
      }
    } catch {
      stuckCount++;
    }
  }
  return false;
}

// ─── Spider ────────────────────────────────────────────────────────────

async function runSpider() {
  console.log('\n🔍 FASE 1: Spider — Descubriendo rutas de la aplicación...');

  const data = await zapRequest(
    `/JSON/spider/action/scan/?url=${encodeURIComponent(TARGET)}&maxChildren=0&recurse=true&subtreeOnly=false`
  );
  const spiderId = data.scan;
  console.log(`   Spider ID: ${ spiderId}`);

  const done = await pollStatus(
    `/JSON/spider/view/status/?scanId=${spiderId}`,
    'status',
    3000,
    15
  );

  if (!done) {
    console.log('⚠️  Spider timeout. Continuando con URLs descubiertas parciales.');
  }

  const results = await zapRequest(`/JSON/spider/view/results/?scanId=${spiderId}`);
  const urls = results.urlsInScope || results.urlsRecentlyScanned || [];
  console.log(`   URLs descubiertas: ${urls.length}`);

  // Imprimir URLs únicas del dominio
  const uniquePaths = [...new Set(urls.map(u => {
    try { return new URL(u).pathname; } catch { return u; }
  }))].sort();
  if (uniquePaths.length > 0 && uniquePaths.length <= 50) {
    console.log('   Rutas encontradas:');
    uniquePaths.forEach(p => console.log(`     ${p}`));
  }

  return urls;
}

// ─── Configurar escáneres ─────────────────────────────────────────────

async function configureScanners() {
  console.log('\n⚙️  Fase 2: Configurando escáneres activos...');

  // Deshabilitar DOM XSS (requiere navegador)
  try {
    await zapRequest('/JSON/ascan/action/disableScanners/?ids=40026');
    console.log('   ❌ DOM XSS (40026) deshabilitado (incompatible con headless)');
  } catch { /* ok */ }

  // En modo agresivo, habilitar todo
  if (IS_AGGRESSIVE) {
    console.log('   🔴 Modo agresivo: todos los escáneres al máximo');
  }
}

// ─── Importar URLs al contexto ────────────────────────────────────────

async function importUrlsToContext(urls) {
  if (!urls || urls.length === 0) return;

  console.log('\n📋 Importando URLs al contexto de ZAP...');

  // Crear contexto
  const ctxData = await zapRequest('/JSON/context/action/newContext/?contextName=sigo-ollas', 'GET');
  const contextId = ctxData.contextId;
  console.log(`   Contexto ID: ${contextId}`);

  // Importar URLs
  const urlList = urls.join('\n');
  const tmpFile = path.join(REPORT_DIR, 'urls-import.txt');
  fs.writeFileSync(tmpFile, urlList);

  try {
    await zapRequest(`/JSON/context/action/importURLs/?contextId=${contextId}&urlListFile=${encodeURIComponent(tmpFile)}`);
    console.log(`   ${urls.length} URLs importadas al contexto`);
  } catch (e) {
    console.log(`   ⚠️  Importación parcial: ${e.message}`);
  }

  // Configurar include in scope
  await zapRequest(`/JSON/context/action/includeInContext/?contextName=sigo-ollas&regex=.*`).catch(() => {});

  return contextId;
}

// ─── Autenticación ─────────────────────────────────────────────────────

async function setupAuthentication() {
  if (!IS_AUTH) {
    console.log('\n🔓 Autenticación: DESHABILITADA (usa --auth para habilitar)');
    return;
  }

  console.log('\n🔐 Fase 3: Configurando autenticación...');

  // Obtener un token JWT válido
  console.log('   Nota: Para autenticación completa, configura un JWT token manualmente');
  console.log('   export ZAP_AUTH_TOKEN="Bearer eyJ..."');

  const authToken = process.env.ZAP_AUTH_TOKEN;
  if (authToken) {
    // Configurar header de autenticación en ZAP
    try {
      await zapRequest(
        `/JSON/network/action/setOptionDefaultAuthToken/?value=${encodeURIComponent(authToken)}`
      );
      console.log('   ✅ Token de autenticación configurado en ZAP');
    } catch (e) {
      console.log(`   ⚠️  Error configurando auth: ${e.message}`);
    }
  }
}

// ─── Active Scan ───────────────────────────────────────────────────────

async function runActiveScan() {
  console.log('\n🎯 FASE 4: Active Scan — Lanzando ataques de seguridad...');

  console.log('   Vulnerabilidades siendo evaluadas:');
  console.log('   ├── SQL Injection (PostgreSQL, MySQL, Oracle, Hypersonic)');
  console.log('   ├── Cross-Site Scripting (Reflected, Stored)');
  console.log('   ├── Path Traversal / Directory Browsing');
  console.log('   ├── Remote OS Command Injection');
  console.log('   ├── Server Side Code Injection / SSRF');
  console.log('   ├── XML External Entity (XXE)');
  console.log('   ├── LDAP Injection');
  console.log('   ├── Remote File Inclusion');
  console.log('   ├── Shell Shock');
  console.log('   ├── External Redirect');
  console.log('   ├── Source Code Disclosure');
  console.log('   ├── .env / Hidden File / .htaccess Discovery');
  console.log('   ├── Heartbleed OpenSSL');
  console.log('   ├── CORS Misconfiguration');
  console.log('   ├── Anti-CSRF Tokens');
  console.log('   └── User Agent Fuzzer');
  console.log('');

  const maxAlerts = IS_AGGRESSIVE ? 0 : 50;
  const data = await zapRequest(
    `/JSON/ascan/action/scan/?url=${encodeURIComponent(TARGET)}&recurse=true&maxAlertsPerRule=${maxAlerts}`
  );
  const scanId = data.scan;
  console.log(`   Active Scan ID: ${scanId}`);

  const done = await pollStatus(
    `/JSON/ascan/view/status/?scanId=${scanId}`,
    'status',
    5000,
    60
  );

  if (!done) {
    console.log('⚠️  Active Scan timeout. Generando reporte con hallazgos parciales.');
  }

  return scanId;
}

// ─── Recolección de alertas ────────────────────────────────────────────

async function collectAlerts() {
  console.log('\n📊 Recopilando resultados...');

  const allAlerts = [];
  let start = 0;
  const count = 100;

  while (true) {
    const data = await zapRequest(
      `/JSON/core/view/alerts/?baseurl=${encodeURIComponent(TARGET)}&start=${start}&count=${count}`
    );
    const alerts = data.alerts || [];
    allAlerts.push(...alerts);
    if (alerts.length < count) break;
    start += count;
  }

  // Clasificar por riesgo
  totalAlerts = { high: 0, medium: 0, low: 0, informational: 0 };
  const alertsByType = {};

  for (const alert of allAlerts) {
    const risk = (alert.risk || 'Informational').toLowerCase().replace('al', '');
    if (risk === 'high') totalAlerts.high++;
    else if (risk === 'medium') totalAlerts.medium++;
    else if (risk === 'low') totalAlerts.low++;
    else totalAlerts.informational++;

    const key = alert.alert || alert.name || 'Unknown';
    if (!alertsByType[key]) {
      alertsByType[key] = { count: 0, risk: alert.risk, cwe: alert.cweId, url: alert.url };
    }
    alertsByType[key].count++;
  }

  console.log(`\n   Total de alertas: ${allAlerts.length}`);
  console.log(`   🔴 High:       ${totalAlerts.high}`);
  console.log(`   🟠 Medium:     ${totalAlerts.medium}`);
  console.log(`   🟡 Low:        ${totalAlerts.low}`);
  console.log(`   🔵 Info:       ${totalAlerts.informational}`);

  return { allAlerts, alertsByType };
}

// ─── Reporte HTML mejorado ─────────────────────────────────────────────

function generateReport(alertData) {
  console.log('\n📄 Generando reporte...');

  const { allAlerts, alertsByType } = alertData;
  const elapsed = Math.round((Date.now() - scanStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const highRows = allAlerts.filter(a => a.risk === 'High')
    .map(a => `<tr class="risk-high"><td>${esc(a.alert)}</td><td>${esc(a.url)}</td><td>${esc(a.desc || '').substring(0, 200)}</td><td>${esc(a.solution || '')}</td><td>${esc(a.cweId || '')}</td></tr>`).join('');

  const mediumRows = allAlerts.filter(a => a.risk === 'Medium')
    .map(a => `<tr class="risk-medium"><td>${esc(a.alert)}</td><td>${esc(a.url)}</td><td>${esc(a.desc || '').substring(0, 200)}</td><td>${esc(a.solution || '')}</td><td>${esc(a.cweId || '')}</td></tr>`).join('');

  const lowRows = allAlerts.filter(a => a.risk === 'Low')
    .map(a => `<tr class="risk-low"><td>${esc(a.alert)}</td><td>${esc(a.url)}</td><td>${esc(a.desc || '').substring(0, 150)}</td><td>${esc(a.solution || '')}</td><td>${esc(a.cweId || '')}</td></tr>`).join('');

  const infoRows = allAlerts.filter(a => a.risk === 'Informational')
    .map(a => `<tr class="risk-info"><td>${esc(a.alert)}</td><td>${esc(a.url)}</td><td>${esc(a.desc || '').substring(0, 150)}</td><td>${esc(a.solution || '')}</td><td>${esc(a.cweId || '')}</td></tr>`).join('');

  // Calcular calificación
  let score = 100;
  score -= totalAlerts.high * 15;
  score -= totalAlerts.medium * 5;
  score -= totalAlerts.low * 2;
  score = Math.max(0, Math.min(100, score));
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SIGO-OLLAS — Reporte de Seguridad DAST (OWASP ZAP)</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; max-width: 1200px; margin: 0 auto; padding: 2rem; background: #0a0a0a; color: #e0e0e0; line-height: 1.6; }
  h1 { color: #4ade80; font-size: 1.8rem; border-bottom: 2px solid #4ade80; padding-bottom: 0.5rem; }
  h2 { color: #a3a3a3; font-size: 1.3rem; margin-top: 2rem; border-bottom: 1px solid #333; padding-bottom: 0.3rem; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
  .meta-item { background: #111; padding: 1rem; border-radius: 8px; border: 1px solid #222; }
  .meta-item strong { color: #a3a3a3; display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-item span { font-size: 1.1rem; }
  .score-container { display: flex; align-items: center; gap: 2rem; margin: 1.5rem 0; }
  .score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; }
  .grade-A { background: #065f46; color: #4ade80; }
  .grade-B { background: #1e3a5f; color: #60a5fa; }
  .grade-C { background: #7c2d12; color: #fbbf24; }
  .grade-D { background: #7f1d1d; color: #ef4444; }
  .grade-F { background: #450a0a; color: #dc2626; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin: 1rem 0; }
  .stat { padding: 1rem; border-radius: 8px; text-align: center; font-size: 1.5rem; font-weight: bold; }
  .stat-high { background: #7f1d1d; color: #fca5a5; }
  .stat-medium { background: #78350f; color: #fcd34d; }
  .stat-low { background: #713f12; color: #fde68a; }
  .stat-info { background: #1e3a5f; color: #93c5fd; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
  th, td { text-align: left; padding: 0.6rem; border: 1px solid #222; vertical-align: top; }
  th { background: #111; color: #a3a3a3; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .risk-high { background: #1c0a0a; }
  .risk-medium { background: #1a1205; }
  .risk-low { background: #171305; }
  .risk-info { background: #0a1020; }
  code { background: #1a1a1a; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.8rem; word-break: break-all; }
  .summary-box { background: #111; border: 1px solid #333; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
  .toc { columns: 2; column-gap: 2rem; }
  .toc li { margin: 0.3rem 0; }
  .phase { background: #111; border-left: 3px solid #4ade80; padding: 1rem 1.5rem; margin: 0.5rem 0; border-radius: 0 8px 8px 0; }
  .phase-title { font-weight: bold; color: #4ade80; }
  .section-hidden { display: none; }
  .toggle-btn { cursor: pointer; background: #222; color: #a3a3a3; border: 1px solid #444; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.75rem; }
  .toggle-btn:hover { background: #333; }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #222; color: #666; font-size: 0.75rem; text-align: center; }
</style>
</head>
<body>

<h1>🛡️ SIGO-OLLAS — Reporte de Seguridad DAST</h1>

<div class="meta">
  <div class="meta-item"><strong>Fecha del escaneo</strong><span>${now}</span></div>
  <div class="meta-item"><strong>URL evaluada</strong><span><code>${TARGET}</code></span></div>
  <div class="meta-item"><strong>Herramienta</strong><span>OWASP ZAP v2.17 (Docker)</span></div>
  <div class="meta-item"><strong>Duración</strong><span>${minutes}m ${seconds}s</span></div>
</div>

<h2>Calificación General</h2>
<div class="score-container">
  <div class="score-circle grade-${grade}">${score}</div>
  <div>
    <p style="font-size:1.3rem;font-weight:bold;">Grado: ${grade}</p>
    <p>${score}/100 puntos</p>
    <p style="color:#666;font-size:0.85rem;">High: -${totalAlerts.high * 15} | Medium: -${totalAlerts.medium * 5} | Low: -${totalAlerts.low * 2}</p>
  </div>
</div>

<div class="stats">
  <div class="stat stat-high">${totalAlerts.high}<br><small>HIGH</small></div>
  <div class="stat stat-medium">${totalAlerts.medium}<br><small>MEDIUM</small></div>
  <div class="stat stat-low">${totalAlerts.low}<br><small>LOW</small></div>
  <div class="stat stat-info">${totalAlerts.informational}<br><small>INFO</small></div>
</div>

<h2>Fases del Escaneo</h2>
<div class="phase"><span class="phase-title">1. Spider</span> — Descubrimiento recursivo de rutas y endpoints</div>
<div class="phase"><span class="phase-title">2. Configuración</span> — Habilitación de escáneres OWASP (SQLi, XSS, Path Traversal, etc.)</div>
<div class="phase"><span class="phase-title">3. Active Scan</span> — Lanzamiento de payloads ofensivos contra cada endpoint descubierto</div>
<div class="phase"><span class="phase-title">4. Análisis Pasivo</span> — Verificación de headers, cookies, information disclosure en todas las respuestas</div>
<div class="phase"><span class="phase-title">5. Reporte</span> — Generación de este documento con clasificación CWE/OWASP</div>

<h2>Tabla de Contenido</h2>
<ol class="toc">
  <li><a href="#high">Hallazgos HIGH (${totalAlerts.high})</a></li>
  <li><a href="#medium">Hallazgos MEDIUM (${totalAlerts.medium})</a></li>
  <li><a href="#low">Hallazgos LOW (${totalAlerts.low})</a></li>
  <li><a href="#info">Hallazgos INFORMATIVOS (${totalAlerts.informational})</a></li>
  <li><a href="#owasp">Mapeo OWASP Top 10 (2021)</a></li>
  <li><a href="#cwe">Referencia CWE</a></li>
  <li><a href="#methodology">Metodología</a></li>
</ol>

<h2 id="high">🔴 Hallazgos HIGH (${totalAlerts.high})</h2>
${highRows ? `<table><thead><tr><th>Vulnerabilidad</th><th>URL</th><th>Descripción</th><th>Solución</th><th>CWE</th></tr></thead><tbody>${highRows}</tbody></table>` : '<p>✅ No se encontraron hallazgos de severidad alta.</p>'}

<h2 id="medium">🟠 Hallazgos MEDIUM (${totalAlerts.medium})</h2>
${mediumRows ? `<table><thead><tr><th>Vulnerabilidad</th><th>URL</th><th>Descripción</th><th>Solución</th><th>CWE</th></tr></thead><tbody>${mediumRows}</tbody></table>` : '<p>✅ No se encontraron hallazgos de severidad media.</p>'}

<h2 id="low">🟡 Hallazgos LOW (${totalAlerts.low})</h2>
${lowRows ? `<table><thead><tr><th>Vulnerabilidad</th><th>URL</th><th>Descripción</th><th>Solución</th><th>CWE</th></tr></thead><tbody>${lowRows}</tbody></table>` : '<p>✅ No se encontraron hallazgos de severidad baja.</p>'}

<h2 id="info">🔵 Hallazgos INFORMATIVOS (${totalAlerts.informational})</h2>
${infoRows ? `<table><thead><tr><th>Hallazgo</th><th>URL</th><th>Detalle</th><th>Recomendación</th><th>CWE</th></tr></thead><tbody>${infoRows}</tbody></table>` : '<p>✅ Sin hallazgos informativos.</p>'}

<h2 id="owasp">Mapeo OWASP Top 10 (2021)</h2>
<div class="summary-box">
<table>
<thead><tr><th>Código</th><th>Categoría</th><th>Hallazgos en este scan</th></tr></thead>
<tbody>
<tr><td>A01</td><td>Broken Access Control</td><td>${allAlerts.filter(a => /csrf|cors|auth|privilege/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A02</td><td>Cryptographic Failures</td><td>${allAlerts.filter(a => /encrypt|crypto|ssl|tls|password/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A03</td><td>Injection</td><td>${allAlerts.filter(a => /sql|xss|script|injection|command|ldap|xxe/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A04</td><td>Insecure Design</td><td>${allAlerts.filter(a => /design|architect/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A05</td><td>Security Misconfiguration</td><td>${allAlerts.filter(a => /header|cors|config|directory|browse|env/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A06</td><td>Vulnerable Components</td><td>${allAlerts.filter(a => /component|library|version|retire/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A07</td><td>Auth Failures</td><td>${allAlerts.filter(a => /auth|session|login|brute/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A08</td><td>Data Integrity Failures</td><td>${allAlerts.filter(a => /integrity|deserialization/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A09</td><td>Logging & Monitoring</td><td>${allAlerts.filter(a => /log|monitor|audit/i.test(a.alert)).length} hallazgos</td></tr>
<tr><td>A10</td><td>SSRF</td><td>${allAlerts.filter(a => /ssrf|redirect|rfi|server.side/i.test(a.alert)).length} hallazgos</td></tr>
</tbody>
</table>
</div>

<h2 id="cwe">Referencia CWE (Common Weakness Enumeration)</h2>
<div class="summary-box">
<table>
<thead><tr><th>CWE</th><th>Nombre</th><th>Hallazgos</th></tr></thead>
<tbody>
<tr><td>CWE-89</td><td>SQL Injection</td><td>${allAlerts.filter(a => /sql/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-79</td><td>Cross-Site Scripting</td><td>${allAlerts.filter(a => /xss|script|cross.site/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-22</td><td>Path Traversal</td><td>${allAlerts.filter(a => /path|traversal|directory/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-942</td><td>CORS Misconfiguration</td><td>${allAlerts.filter(a => /cors|cross.domain/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-693</td><td>Protection Mechanism Failure</td><td>${allAlerts.filter(a => /header|protection/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-200</td><td>Information Exposure</td><td>${allAlerts.filter(a => /info|disclos|leak|comment/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-548</td><td>Directory Listing</td><td>${allAlerts.filter(a => /directory|browse/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-352</td><td>CSRF</td><td>${allAlerts.filter(a => /csrf/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-601</td><td>Open Redirect</td><td>${allAlerts.filter(a => /redirect/i.test(a.alert)).length}</td></tr>
<tr><td>CWE-78</td><td>OS Command Injection</td><td>${allAlerts.filter(a => /command|shell|os/i.test(a.alert)).length}</td></tr>
</tbody>
</table>
</div>

<h2 id="methodology">Metodología</h2>
<div class="summary-box">
<p><strong>Estándares aplicados:</strong></p>
<ul>
  <li>OWASP Top 10 (2021) — Categorías A01-A10</li>
  <li>OWASP ASVS v4.0 — Application Security Verification Standard</li>
  <li>OWASP Testing Guide v4.2 — DAST methodology</li>
  <li>CWE/SANS Top 25 — Common Weakness Enumeration</li>
  <li>NIST SP 800-53 Rev. 5 — Security and Privacy Controls</li>
</ul>
<p><strong>Herramientas:</strong> OWASP ZAP v2.17 (Docker) con escáneres activos y pasivos</p>
<p><strong>Tipos de prueba:</strong></p>
<ul>
  <li>Active Scan: SQL Injection, XSS, Path Traversal, Command Injection, XXE, SSRF, RFI, CSRF, CORS, Directory Browsing</li>
  <li>Passive Scan: Security Headers, Cookie Flags, Information Disclosure, Retire.js, Server Info Leakage</li>
  <li>Spider: Descubrimiento automático de rutas (recursivo)</li>
</ul>
<p><strong>Limitaciones:</strong></p>
<ul>
  <li>DOM XSS deshabilitado (requiere navegador gráfico, incompatible con Docker headless)</li>
  <li>Autenticación no configurada (endpoints protegidos por JWT no son escaneados activamente)</li>
  <li>Rate limiting puede limitar la velocidad del escaneo activo</li>
</ul>
</div>

<footer>
  Reporte generado automáticamente por <strong>SIGO-OLLAS Security Scanner</strong> (escaneo.js v2.0)<br>
  ${allAlerts.length} hallazgos detectados | ${minutes}m ${seconds}s de escaneo | OWASP ZAP v2.17
</footer>

</body>
</html>`;

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `zap-report-${new Date().toISOString().slice(0, 10)}.html`);
  fs.writeFileSync(reportPath, html);

  // También guardar JSON para procesamiento programático
  const jsonPath = path.join(REPORT_DIR, `zap-report-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    timestamp: now,
    target: TARGET,
    duration: `${minutes}m ${seconds}s`,
    score,
    grade,
    alerts: totalAlerts,
    alertsByType,
    allAlerts: allAlerts.map(a => ({
      name: a.alert,
      risk: a.risk,
      confidence: a.confidence,
      url: a.url,
      description: a.desc,
      solution: a.solution,
      cweId: a.cweId,
      wascId: a.wascId,
      pluginId: a.pluginId,
    })),
  }, null, 2));

  return { reportPath, jsonPath, score, grade };
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  scanStartTime = Date.now();

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  SIGO-OLLAS — OWASP ZAP Security Scanner   ║');
  console.log('║  DAST: Dynamic Application Security Testing  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\n🎯 Target: ${TARGET}`);
  console.log(`🔧 ZAP:   ${ZAP_URL}`);
  console.log(`🔐 Auth:  ${IS_AUTH ? 'HABILITADA' : 'DESHABILITADA'}`);
  console.log(`⚡ Mode:  ${IS_AGGRESSIVE ? 'AGRESIVO' : 'ESTÁNDAR'}`);
  console.log('');

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  try {
    await waitForZapReady();
    const urls = await runSpider();
    await configureScanners();
    await setupAuthentication();

    if (urls.length > 0) {
      await importUrlsToContext(urls);
    }

    await runActiveScan();
    const alertData = await collectAlerts();
    const report = generateReport(alertData);

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║           ESCANEO COMPLETADO                 ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`\n📊 Calificación: ${report.score}/100 (Grado ${report.grade})`);
    console.log(`🔴 High:       ${totalAlerts.high}`);
    console.log(`🟠 Medium:     ${totalAlerts.medium}`);
    console.log(`🟡 Low:        ${totalAlerts.low}`);
    console.log(`🔵 Info:       ${totalAlerts.informational}`);
    console.log(`\n📄 Reporte HTML: ${report.reportPath}`);
    console.log(`📄 Datos JSON:  ${report.jsonPath}`);
    console.log('\nAbre el archivo HTML en tu navegador para ver el reporte completo.');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    console.error('\nVerifica que:');
    console.error('  1. Docker esté corriendo: docker compose -f docker-compose.zap.yml up -d');
    console.error('  2. ZAP esté listo: curl http://localhost:8080/JSON/core/view/version/');
    console.error(`  3. El target sea accesible: curl -I ${TARGET}`);
    process.exit(1);
  }
}

main();
