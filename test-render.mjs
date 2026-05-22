const BASE = 'https://proyecto-ollas-comunes.onrender.com';

async function req(method, path, headers, body) {
  const opts = { method, headers: { ...headers } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function main() {
  console.log('=== Test 1: Health Prisma ===');
  const h = await req('GET', '/api/health/prisma');
  console.log(h.status, JSON.stringify(h.data));

  console.log('\n=== Test 2: Login ===');
  const l = await req('POST', '/api/auth/login', {}, { email: 'admin@ollascomunes.pe', password: 'admin123' });
  console.log(l.status, l.data.ok ? 'OK token=' + l.data.token?.slice(0, 20) + '...' : JSON.stringify(l.data));

  if (!l.data.ok) {
    console.log('LOGIN FAILED - stopping tests');
    return;
  }

  const token = l.data.token;
  const auth = { 'Authorization': 'Bearer ' + token };

  console.log('\n=== Test 3: GET /api/beneficiaries ===');
  const b = await req('GET', '/api/beneficiaries', auth);
  console.log(b.status, JSON.stringify(b.data).slice(0, 200));

  console.log('\n=== Test 4: GET /api/beneficiaries/conditions ===');
  const c = await req('GET', '/api/beneficiaries/conditions', auth);
  console.log(c.status, JSON.stringify(c.data).slice(0, 200));

  console.log('\n=== Test 5: POST /api/beneficiaries (crear) ===');
  const create = await req('POST', '/api/beneficiaries', auth, {
    firstName: 'Test',
    lastName: 'Render',
    dni: '99999999',
    birthDate: '1990-01-15',
    gender: 'male',
    priorityLevel: 'normal',
    healthConditionIds: []
  });
  console.log(create.status, JSON.stringify(create.data).slice(0, 200));
}

main().catch(console.error);
