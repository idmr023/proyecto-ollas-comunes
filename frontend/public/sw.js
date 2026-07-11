const CACHE_NAME = 'ollas-comunes-cache-v1';
const PRECACHE_ASSETS = [
  '/login',
  '/login/otp',
  '/file.svg',
  '/globe.svg',
  '/next.svg',
  '/vercel.svg',
  '/window.svg'
];

// Instalar el Service Worker y almacenar en caché recursos estáticos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching critical assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-caching failed (some assets might not be available yet):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activar el Service Worker y limpiar cachés obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
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

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la petición es exitosa y es de nuestro origen, clonar y guardar en caché para actualizaciones silenciosas
        if (response.status === 200 && url.origin === self.location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red (offline), intentar responder con la caché
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si es una navegación de página y no se encuentra en caché, devolvemos el cascarón del Login
          if (request.mode === 'navigate') {
            return caches.match('/login');
          }
        });
      })
  );
});
