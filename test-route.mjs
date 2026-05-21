import http from 'http';

function request(method, path) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: 'localhost', port: 4000, path, method }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.end();
  });
}

// List all routes by trying them
const paths = [
  ['GET', '/'],
  ['GET', '/api/auth'],
  ['GET', '/api/health'],
  ['POST', '/api/auth/login'],
  ['POST', '/api/auth/register'],
  ['GET', '/api/auth/me'],
];
for (const [method, path] of paths) {
  const r = await request(method, path);
  console.log(`${method} ${path}: ${r.status}`);
}
