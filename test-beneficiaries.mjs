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

// Login
const login = await req('POST', '/api/auth/login', {}, { email: 'admin@ollascomunes.pe', password: 'admin123' });
const loginData = JSON.parse(login.d);
const token = loginData.token;
console.log('Login:', login.s, 'OK');

// Test conditions endpoint
const conditions = await req('GET', '/api/beneficiaries/conditions', { 'Authorization': 'Bearer ' + token });
console.log('GET /api/beneficiaries/conditions:', conditions.s);
const conditionsData = JSON.parse(conditions.d);
console.log('Conditions:', JSON.stringify(conditionsData.items?.slice(0, 3) || conditionsData, null, 2));

// Test ollas endpoint
const ollas = await req('GET', '/api/beneficiaries/ollas', { 'Authorization': 'Bearer ' + token });
console.log('GET /api/beneficiaries/ollas:', ollas.s);
console.log('Ollas:', JSON.parse(ollas.d));

// Test list beneficiaries
const list = await req('GET', '/api/beneficiaries', { 'Authorization': 'Bearer ' + token });
console.log('GET /api/beneficiaries:', list.s);
console.log('Beneficiaries count:', JSON.parse(list.d).items?.length || 0);

// Test create beneficiary
const create = await req('POST', '/api/beneficiaries', { 'Authorization': 'Bearer ' + token }, {
  firstName: 'Test',
  lastName: 'User',
  dni: '99999999',
  birthDate: '1990-01-15',
  gender: 'male',
  phone: '999888777',
  address: 'Av Test 123',
  priorityLevel: 'normal',
  healthConditionIds: []
});
console.log('POST /api/beneficiaries:', create.s);
const createData = JSON.parse(create.d);
console.log('Created:', createData.item?.fullName || createData);

const createdId = createData.item?.id;

// Test get by id
if (createdId) {
  const get = await req('GET', '/api/beneficiaries/' + createdId, { 'Authorization': 'Bearer ' + token });
  console.log('GET /api/beneficiaries/' + createdId + ':', get.s);
  console.log('Found:', JSON.parse(get.d).item?.fullName);
}

// Test update
if (createdId) {
  const update = await req('PATCH', '/api/beneficiaries/' + createdId, { 'Authorization': 'Bearer ' + token }, {
    firstName: 'Test Updated',
    lastName: 'User Updated',
    birthDate: '1990-01-15',
    priorityLevel: 'high',
    healthConditionIds: []
  });
  console.log('PATCH /api/beneficiaries/' + createdId + ':', update.s);
  console.log('Updated:', JSON.parse(update.d).item?.fullName);
}

// Test delete
if (createdId) {
  const del = await req('DELETE', '/api/beneficiaries/' + createdId, { 'Authorization': 'Bearer ' + token });
  console.log('DELETE /api/beneficiaries/' + createdId + ':', del.s);
  console.log('Deleted:', JSON.parse(del.d));
}

console.log('\nAll tests completed.');
