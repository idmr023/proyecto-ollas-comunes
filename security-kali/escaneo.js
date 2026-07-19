const fs = require('fs');

const ZAP_URL = 'http://localhost:8080';
const TARGET = 'https://proyecto-ollas-comunes.vercel.app';
const API_KEY = 'clave-segura-zap';

async function ejecutarPruebaSeguridad() {
    console.log(`Iniciando prueba de seguridad contra: ${TARGET}`);

    try {
        console.log('1. Iniciando rastreo (Spider)...');
        await fetch(`${ZAP_URL}/JSON/spider/action/scan/?url=${TARGET}&apikey=${API_KEY}`);
        
        await new Promise(r => setTimeout(r, 5000));

        console.log('2. Iniciando Active Scan (Buscando vulnerabilidades OWASP)...');
        const excludeRules = '40012';
        const scanResponse = await fetch(`${ZAP_URL}/JSON/ascan/action/scan/?url=${TARGET}&apikey=${API_KEY}&excludeScanRule=${excludeRules}`);
        const scanData = await scanResponse.json();
        const scanId = scanData.scan;

        let status = 0;
        while (status < 100) {
            await new Promise(r => setTimeout(r, 5000));
            const statusResponse = await fetch(`${ZAP_URL}/JSON/ascan/view/status/?scanId=${scanId}&apikey=${API_KEY}`);
            const statusData = await statusResponse.json();
            status = parseInt(statusData.status, 10);
            console.log(`   Progreso del Active Scan: ${status}%`);
        }

        console.log('Escaneo completado. Generando reporte...');

        const reportResponse = await fetch(`${ZAP_URL}/OTHER/core/other/htmlreport/?apikey=${API_KEY}`);
        const reportHTML = await reportResponse.text();

        fs.writeFileSync('reporte-seguridad-zap.html', reportHTML);
        console.log('¡Reporte generado exitosamente! Revisa "reporte-seguridad-zap.html"');

    } catch (error) {
        console.error('Error durante la ejecución:', error.message);
    }
}

ejecutarPruebaSeguridad();
