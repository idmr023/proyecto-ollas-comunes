const CACHE_NAME = 'ollas-comunes-cache-v1';
const PRECACHE_ASSETS = [
  '/login',
  '/login/otp',
];

// Instalar el Service Worker y almacenar en caché recursos estáticos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching critical assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-caching failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activar el Service Worker y limpiar cachés obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones para manejo offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Omitir peticiones de API, HMR de Turbopack/Next.js y métodos que no sean GET
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.includes('/_next/webpack-hmr') || 
    url.pathname.includes('webpack') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Fallback HTML mínimo para mostrar cuando no hay conexión ni caché
  const OFFLINE_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f0eb;color:#0F3821;text-align:center;padding:1rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#666;margin-bottom:2rem}.btn{background:#0F3821;color:#fff;border:none;padding:.75rem 2rem;border-radius:.5rem;font-size:1rem;cursor:pointer;text-decoration:none}</style></head><body><div><h1>Sin conexión</h1><p>No hay conexión a Internet.<br>Vuelve a intentarlo cuando tengas señal.</p><a class="btn" href="/login">Reintentar</a></div></body></html>`;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.status === 200 && url.origin === self.location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone)).catch(() => {});
        }
        return response;
      } catch {
        try {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            const loginPage = await caches.match('/login');
            if (loginPage) return loginPage;
          }
        } catch {
          // cache.match también falló
        }
        return new Response(OFFLINE_HTML, {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' }),
        });
      }
    })()
  );
});
