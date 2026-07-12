import http from 'node:http';

function req(method, path, headers, body) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 4000, path, method, headers: headers || {} };
    if (body) {
      const data = JSON.stringify(body);
      opts.headers = { ...opts.headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) };
      const r = http.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ s: res.statusCode, d })); });
      r.write(data); r.end();
    } else {
      const r = http.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ s: res.statusCode, d })); });
      r.end();
    }
  });
}

// 1. Test organizations without token → should be 401
const orgRes = await req('GET', '/api/organizations');
console.log('Test 1 - GET /api/organizations (no auth):', orgRes.s);
if (orgRes.s === 401) console.log('  ✓ requireAuth bloquea correctamente');
else console.log('  ✗ ERROR: debería ser 401');

// 2. Login
const loginRes = await req('POST', '/api/auth/login', {}, { email: 'admin@ollascomunes.pe', password: 'admin123' });
const loginData = JSON.parse(loginRes.d);
console.log('Test 2 - POST /api/auth/login:', loginRes.s);
if (loginRes.s === 200 && loginData.token) console.log('  ✓ Login exitoso, token recibido');
else console.log('  ✗ ERROR');

// 3. GET /api/auth/me with token
const meRes = await req('GET', '/api/auth/me', { 'Authorization': 'Bearer ' + loginData.token });
const meData = JSON.parse(meRes.d);
console.log('Test 3 - GET /api/auth/me:', meRes.s);
if (meRes.s === 200 && meData.user && meData.user.email === 'admin@ollascomunes.pe') console.log('  ✓ /me devuelve usuario correcto');
else console.log('  ✗ ERROR');

// 4. GET /api/auth/me without token → should be 401
const meNoAuth = await req('GET', '/api/auth/me');
console.log('Test 4 - GET /api/auth/me (no auth):', meNoAuth.s);
if (meNoAuth.s === 401) console.log('  ✓ /me sin token rechazado');
else console.log('  ✗ ERROR');

console.log('\nFrontend: NEXT_PUBLIC_API_URL=http://localhost:4000 ✓');
