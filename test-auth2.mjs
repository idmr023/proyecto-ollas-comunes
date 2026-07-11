import http from 'node:http';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 4000, path, method, headers: {} };
    if (body) {
      const data = JSON.stringify(body);
      opts.headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) };
      const req = http.request(opts, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.write(data);
      req.end();
    } else {
      const req = http.request(opts, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.end();
    }
  });
}

// Test root
const root = await request('GET', '/');
console.log('GET /:', root.status, root.body);

// Test auth login
const login = await request('POST', '/api/auth/login', { email: 'admin@ollascomunes.pe', password: 'admin123' });
console.log('POST /api/auth/login:', login.status, login.body);
