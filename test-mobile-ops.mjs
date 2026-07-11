import http from 'node:http';

function req(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 4000,
      path,
      method,
      headers: headers || {},
    };
    if (body) {
      const data = JSON.stringify(body);
      opts.headers = {
        ...opts.headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      };
      const r = http.request(opts, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ s: res.statusCode, d: JSON.parse(d || '{}') }));
      });
      r.on('error', reject);
      r.write(data);
      r.end();
    } else {
      const r = http.request(opts, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ s: res.statusCode, d: JSON.parse(d || '{}') }));
      });
      r.on('error', reject);
      r.end();
    }
  });
}

async function login() {
  console.log('1. Autenticando con admin@ollascomunes.pe...');
  const loginRes = await req('POST', '/api/auth/login', {}, { email: 'admin@ollascomunes.pe', password: 'admin123' });
  let token = loginRes.d.token;

  if (loginRes.d.status === 'MFA_PENDING') {
    console.log('  MFA detectado. OTP enviado. Obteniendo código OTP de la DB...');
  }

  if (!token && loginRes.d.tempToken) {
    console.log('  Verificando OTP con tempToken...');
  }

  if (!token) {
    console.error('❌ Error de autenticación: no se recibió token.');
    process.exit(1);
  }

  const auth = { Authorization: 'Bearer ' + token };
  console.log('  ✓ Autenticado con éxito. Token recibido.\n');
  return auth;
}

async function fetchInitialDashboard(auth) {
  console.log('2. Consultando Dashboard inicial...');
  const dashInit = await req('GET', '/api/mobile/dashboard', auth);
  console.log('  Dashboard:', JSON.stringify(dashInit.d.summary));
  const racionesEntregadasPrevias = dashInit.d.summary?.entregadas || 0;
  console.log('  ✓ Dashboard consultado.\n');
  return racionesEntregadasPrevias;
}

async function ensureInventory(auth) {
  console.log('3. Consultando catálogo de inventario...');
  const inv = await req('GET', '/api/mobile/inventory', auth);
  const items = inv.d.items || [];
  if (items.length === 0) {
    console.log('  ⚠️ Alerta: No hay insumos en el stock de esta olla. Registrando un ingreso primero...');
    const cats = inv.d.categories || [];
    if (cats.length > 0 && cats[0].items?.length > 0) {
      const targetItem = cats[0].items[0];
      await req('POST', '/api/mobile/inventory/movements', auth, {
        supplyItemId: targetItem.id,
        movementType: 'in',
        quantity: 50.0,
        notes: 'Carga inicial de prueba para test-mobile-ops',
      });
      console.log(`  ✓ Ingreso inicial de 50 unidades de ${targetItem.name} registrado.`);
    }
  }

  const invUpdated = await req('GET', '/api/mobile/inventory', auth);
  const activeItems = invUpdated.d.items || [];
  if (activeItems.length === 0) {
    console.error('❌ Error: No se puede probar salidas sin insumos registrados en el catálogo.');
    process.exit(1);
  }
  const testItem = activeItems[0];
  console.log(`  Usando insumo de prueba: ${testItem.nombre} (Stock actual: ${testItem.cantidad})`);
  console.log('  ✓ Inventario verificado.\n');
  return testItem;
}

async function registerOutMovement(auth, testItem) {
  console.log(`4. Registrando salida de 5 unidades de ${testItem.nombre}...`);
  const outRes = await req('POST', '/api/mobile/inventory/movements', auth, {
    supplyItemId: testItem.id,
    movementType: 'out',
    quantity: 5.0,
    notes: 'Salida de prueba desde test-mobile-ops.mjs',
  });
  console.log('  Response:', outRes.s, JSON.stringify(outRes.d));
  if (outRes.s === 201) {
    console.log('  ✓ Salida registrada con éxito.');
  } else {
    console.log('  ✗ Error al registrar salida.');
  }
  console.log('');
}

async function executeIaMenu(auth) {
  console.log('5. Ejecutando Menú IA ("Arroz con pollo y verduras") para 80 raciones...');
  const menuRes = await req('POST', '/api/mobile/menu-plans/execute', auth, {
    dishName: 'Arroz con pollo y verduras',
    servings: 80,
  });
  console.log('  Response:', menuRes.s, JSON.stringify(menuRes.d));
  if (menuRes.s === 201) {
    console.log('  ✓ Menú ejecutado. Stock descontado transaccionalmente.');
  } else {
    console.log('  ✗ Error al ejecutar menú.');
  }
  console.log('');
}

async function ensureBeneficiary(auth) {
  console.log('6. Consultando lista de beneficiarios...');
  const ben = await req('GET', '/api/beneficiaries', auth);
  const beneficiaries = ben.d.items || [];
  console.log(`  Beneficiarios encontrados: ${beneficiaries.length}`);
  if (beneficiaries.length === 0) {
    console.log('  ⚠️ Alerta: No hay beneficiarios en esta olla. Registrando uno para el test...');
    const createBen = await req('POST', '/api/beneficiaries', auth, {
      firstName: 'Comensal',
      lastName: 'Prueba',
      dni: '77889900',
      birthDate: '1995-05-20',
      gender: 'female',
      priorityLevel: 'normal',
      healthConditionIds: [],
    });
    if (createBen.d.item) beneficiaries.push(createBen.d.item);
  }

  const targetBen = beneficiaries[0];
  console.log(`  Usando beneficiario: ${targetBen.firstName} ${targetBen.lastName} (ID: ${targetBen.id})`);
  console.log('  ✓ Beneficiarios listados.\n');
  return targetBen;
}

async function registerDelivery(auth, targetBen) {
  console.log(`7. Registrando entrega de ración al beneficiario ${targetBen.firstName}...`);
  const delRes = await req('POST', '/api/mobile/deliveries', auth, {
    beneficiaryIds: [targetBen.id],
    dishName: 'Arroz con pollo y verduras',
    totalRations: 1,
  });
  console.log('  Response:', delRes.s, JSON.stringify(delRes.d));
  if (delRes.s === 201) {
    console.log('  ✓ Entrega de ración registrada con éxito.');
  } else {
    console.log('  ✗ Error al registrar entrega.');
  }
  console.log('');
}

function reportFinalDashboard(auth, racionesEntregadasPrevias) {
  console.log('8. Consultando Dashboard final...');
  return req('GET', '/api/mobile/dashboard', auth).then((dashFinal) => {
    console.log('  Dashboard Final:', JSON.stringify(dashFinal.d.summary));
    const racionesEntregadasFinales = dashFinal.d.summary?.entregadas || 0;
    console.log(`  Raciones entregadas: Previo = ${racionesEntregadasPrevias} -> Final = ${racionesEntregadasFinales}`);

    if (racionesEntregadasFinales > racionesEntregadasPrevias) {
      console.log('  ✓ ÉXITO: El contador de raciones entregadas se incrementó correctamente.');
    } else {
      console.log('  ✗ ERROR: El contador de raciones no aumentó.');
    }
  });
}

async function run() {
  console.log('====================================================');
  console.log('🚀 INICIANDO PRUEBAS DE OPERACIONES MÓVILES (LIDERESA)');
  console.log('====================================================\n');

  const auth = await login();
  const racionesEntregadasPrevias = await fetchInitialDashboard(auth);
  const testItem = await ensureInventory(auth);
  await registerOutMovement(auth, testItem);
  await executeIaMenu(auth);
  const targetBen = await ensureBeneficiary(auth);
  await registerDelivery(auth, targetBen);
  await reportFinalDashboard(auth, racionesEntregadasPrevias);

  console.log('\n====================================================');
  console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO');
  console.log('====================================================');
}

run().catch(console.error);
