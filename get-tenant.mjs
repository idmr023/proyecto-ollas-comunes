async function main() {
  const BASE = 'https://proyecto-ollas-comunes.onrender.com';
  const l = await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' }) });
  const login = await l.json();
  console.log('Tenant ID:', login.user?.tenantId);
}
main().catch(console.error);
