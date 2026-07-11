import http from 'node:http';

const body = JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' });
const req = http.request({
  hostname: 'localhost', port: 4000, path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try { console.log('Response:', JSON.stringify(JSON.parse(data), null, 2)); }
    catch { console.log('Raw:', data); }
  });
});
req.write(body);
req.end();
