async function main() {
  const BASE = 'https://proyecto-ollas-comunes.onrender.com';
  const l = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' }) });
  const login = await l.json();
  const auth = { Authorization: 'Bearer ' + login.token };
  const r = await fetch(BASE + '/api/beneficiaries/ollas', { headers: auth });
  const data = await r.json();
  console.log('Ollas disponibles:', JSON.stringify(data, null, 2));
}
main().catch(console.error);
