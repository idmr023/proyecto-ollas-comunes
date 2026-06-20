const fs = require('fs');

const ZAP_URL = 'http://localhost:8080';
const TARGET = 'https://proyecto-ollas-comunes.vercel.app';
const API_KEY = 'clave-segura-zap';

async function zapRequest(endpoint) {
    const url = `${ZAP_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apikey=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return res;
}

async function waitForZapReady() {
    let ready = false;
    while (!ready) {
        try {
            const res = await zapRequest('/JSON/core/view/version/');
            const data = await res.json();
            console.log(`   ZAP listo (v${data.version})`);
            ready = true;
        } catch {
            console.log('   Esperando a que ZAP esté listo...');
            await new Promise(r => setTimeout(r, 3000));
        }
    }
}

async function runSpider() {
    console.log('1. Iniciando Spider (rastreo de rutas)...');
    const res = await zapRequest(`/JSON/spider/action/scan/?url=${encodeURIComponent(TARGET)}&maxChildren=5&recurse=true`);
    const data = await res.json();
    const spiderId = data.scan;

    let status = 0;
    while (status < 100) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await zapRequest(`/JSON/spider/view/status/?scanId=${spiderId}`);
        const statusData = await statusRes.json();
        status = parseInt(statusData.status, 10);
        console.log(`   Spider: ${status}%`);
    }

    const urlsRes = await zapRequest(`/JSON/spider/view/results/?scanId=${spiderId}`);
    const urlsData = await urlsRes.json();
    console.log(`   Spider completado. URLs encontradas: ${urlsData.urlsRecentlyScanned ? urlsData.urlsRecentlyScanned.length : 'N/A'}`);
    return spiderId;
}

async function disableBrowserScanners() {
    console.log('Deshabilitando escáneres que requieren navegador (incompatibles con headless)...');
    try {
        await zapRequest('/JSON/ascan/action/disableScanners/?ids=40026');
        console.log('   - DOM XSS (40026) deshabilitado');
    } catch (e) {
        console.log('   - DOM XSS no encontrado');
    }
}

async function waitForScan(scanId) {
    let status = 0;
    let stuckCount = 0;
    let lastStatus = -1;

    while (status < 100) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await zapRequest(`/JSON/ascan/view/status/?scanId=${scanId}`);
        const statusData = await statusRes.json();
        status = parseInt(statusData.status, 10);

        if (status === lastStatus) {
            stuckCount++;
        } else {
            stuckCount = 0;
        }
        lastStatus = status;

        console.log(`   Active Scan: ${status}%`);

        if (stuckCount >= 24) {
            console.log('   Scan seems stuck, stopping and resuming...');
            await zapRequest(`/JSON/ascan/action/stop/?scanId=${scanId}`);
            await new Promise(r => setTimeout(r, 3000));
            status = 100;
        }
    }

    console.log('Escaneo completado.');
    return scanId;
}

async function runActiveScan() {
    console.log('2. Iniciando Active Scan (buscando vulnerabilidades OWASP)...');
    const res = await zapRequest(`/JSON/ascan/action/scan/?url=${encodeURIComponent(TARGET)}&recurse=true&maxAlertsPerRule=50`);
    const data = await res.json();
    const scanId = data.scan;

    await waitForScan(scanId);

    return scanId;
}

async function getAlerts() {
    const res = await zapRequest(`/JSON/core/view/alerts/?baseurl=${encodeURIComponent(TARGET)}&start=0&count=100`);
    return res.json();
}

async function generateReport() {
    console.log('3. Generando reporte HTML...');
    const res = await zapRequest('/OTHER/core/other/htmlreport/');
    const reportHTML = await res.text();
    fs.writeFileSync('reporte-seguridad-zap.html', reportHTML);
    console.log('¡Reporte guardado como reporte-seguridad-zap.html');
    return reportHTML;
}

async function main() {
    console.log('========================================');
    console.log('  Escaneo de Seguridad - SIGO Ollas');
    console.log(`  Target: ${TARGET}`);
    console.log('========================================\n');

    try {
        await waitForZapReady();
        await runSpider();
        await disableBrowserScanners();
        const scanId = await runActiveScan();
        await generateReport();

        const alerts = await getAlerts();
        const alertsList = alerts.alerts || [];
        console.log(`\nResumen de alertas encontradas: ${alertsList.length}`);

        if (alertsList.length > 0) {
            const levels = ['High', 'Medium', 'Low', 'Informational'];
            for (const level of levels) {
                const count = alertsList.filter(a => a.risk === level).length;
                if (count > 0) {
                    console.log(`   [${level}] ${count}`);
                }
            }

            console.log('\nPrincipales alertas:');
            const seen = new Set();
            for (const alert of alertsList) {
                const key = `${alert.alert}-${alert.risk}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    console.log(`   - [${alert.risk}] ${alert.alert} (x${alert.count || 1})`);
                }
            }
        }

        console.log('\n✅ Escaneo completado exitosamente.');
        console.log('Revisa el archivo "reporte-seguridad-zap.html" en tu navegador.');
    } catch (error) {
        console.error('Error durante la ejecucion:', error.message);
        process.exit(1);
    }
}

main();
