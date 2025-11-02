// Service Worker para Plataforma EduSalud
// Versión 1.0 - Caché estratégico de assets

const CACHE_NAME = 'edusalud-v1';
const RUNTIME_CACHE = 'edusalud-runtime-v1';

// Assets críticos que se cachean inmediatamente
const BASE_PATH = '/edusalud-consultores';
const STATIC_ASSETS = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/assets/js/app.js?v=7',
  BASE_PATH + '/assets/js/electric-card.js?v=3',
  BASE_PATH + '/assets/logo-edusalud.png',
  BASE_PATH + '/assets/static-assets-amico.png',
  BASE_PATH + '/assets/asset-selection-cuate.png',
  BASE_PATH + '/assets/IMG/D_GASH_B1.jpg',
  BASE_PATH + '/assets/IMG/C_MBF_2026_B1.jpg',
  BASE_PATH + '/assets/IMG/C_CAHGO_2025_B1.jpg'
];

// Evento de instalación - Pre-cachea assets críticos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-cacheando assets críticos...');
        // Cachea assets críticos pero NO falla si alguno no existe
        return Promise.allSettled(
          STATIC_ASSETS.map((url) => 
            cache.add(url).catch(err => 
              console.log(`[SW] No se pudo cachear: ${url}`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('[SW] ✅ Instalación completada');
        // Activa inmediatamente sin esperar
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] ❌ Error en instalación:', err);
      })
  );
});

// Evento de activación - Limpia caches viejos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Elimina caches que no sean el actual
              return name !== CACHE_NAME && name !== RUNTIME_CACHE;
            })
            .map((name) => {
              console.log('[SW] Eliminando cache viejo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] ✅ Activación completada');
        // Toma control de todas las páginas inmediatamente
        return self.clients.claim();
      })
      .catch((err) => {
        console.error('[SW] ❌ Error en activación:', err);
      })
  );
});

// Evento de fetch - Estrategia de caché
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachea requests del mismo origen
  if (url.origin !== location.origin) {
    console.log('[SW] Request externo, sin cache:', url.hostname);
    return; // No procesar requests externos
  }

  // Estrategia diferente según tipo de archivo
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Si está en caché, devolverlo
        if (cachedResponse) {
          console.log('[SW] ✅ Cache HIT:', url.pathname);
          return cachedResponse;
        }

        // No está en caché, intentar fetch
        console.log('[SW] Cache MISS, fetch:', url.pathname);
        
        return fetch(request)
          .then((response) => {
            // Solo cachear respuestas exitosas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar respuesta para cache
            const responseToCache = response.clone();

            // Estrategia basada en tipo de archivo
            if (isImage(url) || isFont(url)) {
              // Imágenes y fuentes: Cache-First (cache por mucho tiempo)
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('[SW] Cacheando imagen/font:', url.pathname);
                  cache.put(request, responseToCache);
                });
            } else if (isJS(url) || isCSS(url)) {
              // JS y CSS: Cache-First moderado
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  console.log('[SW] Cacheando JS/CSS:', url.pathname);
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch((err) => {
            console.error('[SW] ❌ Error en fetch:', url.pathname, err);
            // Si falla y está disponible offline, devolver offline fallback
            if (request.mode === 'navigate') {
              return caches.match(BASE_PATH + '/index.html');
            }
            return new Response('Sin conexión', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Funciones auxiliares para detectar tipo de archivo
function isImage(url) {
  const ext = url.pathname.toLowerCase();
  return ext.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/);
}

function isJS(url) {
  return url.pathname.toLowerCase().endsWith('.js');
}

function isCSS(url) {
  return url.pathname.toLowerCase().endsWith('.css');
}

function isFont(url) {
  const ext = url.pathname.toLowerCase();
  return ext.match(/\.(woff|woff2|ttf|eot|otf)$/);
}

// Mensaje para debugging
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker cargado');


