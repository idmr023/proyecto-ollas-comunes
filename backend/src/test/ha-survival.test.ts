"use strict";
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { app } from '../app';
import { Server } from 'http';

let server: Server;
const PORT = 4003;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let authToken = '';
let testTenantId = '';

async function getAuthToken(): Promise<{ token: string; tenantId: string }> {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ollascomunes.pe', password: 'admin123' })
  });
  const loginData = (await loginRes.json()) as any;

  if (loginData.token) {
    return { token: loginData.token, tenantId: loginData.user.tenantId };
  }

  if (!loginData.tempToken) {
    throw new Error('No se pudo iniciar sesión: ' + JSON.stringify(loginData));
  }

  const setupRes = await fetch(`${BASE_URL}/api/auth/totp/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken: loginData.tempToken })
  });
  const setupData = (await setupRes.json()) as any;

  const { generate } = await import('otplib');
  const code = await generate({ secret: setupData.secret });

  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ollascomunes.pe',
      tempToken: loginData.tempToken,
      code
    })
  });
  const verifyData = (await verifyRes.json()) as any;
  if (!verifyData.token) {
    throw new Error('Fallo verify-otp: ' + JSON.stringify(verifyData));
  }
  return { token: verifyData.token, tenantId: verifyData.user.tenantId };
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(PORT, '127.0.0.1', () => resolve());
  });

  const auth = await getAuthToken();
  authToken = auth.token;
  testTenantId = auth.tenantId;
}, 30000);

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('HA/DR: Integridad del sistema post-failover', () => {
  it('Comprueba que la API responde contra el nodo promovido tras el failover', async () => {
    const healthRes = await fetch(`${BASE_URL}/api/health/prisma`);
    expect(healthRes.status).toBe(200);

    const beneficiariesRes = await fetch(`${BASE_URL}/api/beneficiaries`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    expect(beneficiariesRes.status).toBe(200);
    const body = (await beneficiariesRes.json()) as any;
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);

    expect(body.items[0]).toHaveProperty('id');
    expect(body.items[0]).toHaveProperty('firstName');
    expect(body.items[0]).toHaveProperty('lastName');
  });
});
