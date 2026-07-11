import http from 'node:http';

function request(method, path, headers) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 4000, path, method, headers: headers || {} };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

// First login to get a token
const loginRes = await request('POST', '/api/auth/login', { 'Content-Type': 'application/json' });
// Actually need to write body differently for login
// Let me just parse the response from test-auth2

// Simpler approach: login, get token, then call /me
const loginBody = JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' });
const loginResult = await new Promise((resolve, reject) => {
  const opts = {
    hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  };
  const req = http.request(opts, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => resolve({ status: res.statusCode, data }));
  });
  req.on('error', reject);
  req.write(loginBody);
  req.end();
});

console.log('Login:', loginResult.status);
const loginData = JSON.parse(loginResult.data);
const token = loginData.token;

// Now test /me with the token
const meResult = await request('GET', '/api/auth/me', { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' });
console.log('GET /api/auth/me:', meResult.status);
const meData = JSON.parse(meResult.body);
console.log(JSON.stringify(meData, null, 2));
