// Service Worker para Plataforma EduSalud
// Versión 1.1 - Con soporte para desarrollo

// ✅ DETECTAR MODO DESARROLLO
// Cambiar a false antes de hacer commit a producción
const IS_DEVELOPMENT = false; // ⚠️ CAMBIAR A false EN PRODUCCIÓN

// ✅ VERSIÓN DINÁMICA EN DESARROLLO
const VERSION = IS_DEVELOPMENT 
  ? `edusalud-dev-${Date.now()}` 
  : 'edusalud-v1';
  
const CACHE_NAME = VERSION;
const RUNTIME_CACHE = IS_DEVELOPMENT 
  ? `edusalud-runtime-${Date.now()}` 
  : 'edusalud-runtime-v1';

// Assets críticos que se cachean inmediatamente
const BASE_PATH = '/edusalud-consultores';

// ✅ EN DESARROLLO: NO PRE-CACHEAR ASSETS
const STATIC_ASSETS = IS_DEVELOPMENT ? [] : [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/assets/js/electric-card.js',
  BASE_PATH + '/assets/js/app.js',
  BASE_PATH + '/assets/logo-edusalud.png',
  BASE_PATH + '/assets/static-assets-amico.png',
  BASE_PATH + '/assets/asset-selection-cuate.png',
  BASE_PATH + '/assets/IMG/D_GASH_B1.jpg',
  BASE_PATH + '/assets/IMG/C_MBF_2026_B1.jpg',
  BASE_PATH + '/assets/IMG/C_CAHGO_2025_B1.jpg'
];

// Evento de instalación - Pre-cachea assets críticos
self.addEventListener('install', (event) => {
  console.log(`[SW] Instalando Service Worker (${IS_DEVELOPMENT ? 'DESARROLLO' : 'PRODUCCIÓN'})...`);
  
  if (IS_DEVELOPMENT) {
    // En desarrollo: instalar inmediatamente sin cachear
    console.log('[SW] Modo desarrollo: saltando pre-cacheo');
    return self.skipWaiting();
  }
  
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
              // En desarrollo: eliminar TODOS los caches viejos
              if (IS_DEVELOPMENT) {
                return name.startsWith('edusalud-');
              }
              // En producción: solo eliminar caches viejos
              return name !== CACHE_NAME && name !== RUNTIME_CACHE;
            })
            .map((name) => {
              console.log('[SW] Eliminando cache:', name);
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

  // ✅ ESTRATEGIA DIFERENTE SEGÚN MODO
  if (IS_DEVELOPMENT) {
    // MODO DESARROLLO: Network-First (siempre busca nueva versión)
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          // NO cachear en desarrollo
          return response;
        })
        .catch(() => {
          // Solo usar cache si falla completamente la red
          return caches.match(request).then(cached => {
            if (cached) return cached;
            if (request.mode === 'navigate') {
              return caches.match(BASE_PATH + '/index.html');
            }
            return new Response('Sin conexión', { status: 503 });
          });
        })
    );
  } else {
    // MODO PRODUCCIÓN: Cache-First (estrategia original)
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
  }
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
    event.ports[0].postMessage({ version: CACHE_NAME, isDev: IS_DEVELOPMENT });
  }
  
  // ✅ NUEVO: Comando para forzar actualización
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    self.skipWaiting();
    self.clients.claim();
  }
});

console.log(`[SW] Service Worker cargado (${IS_DEVELOPMENT ? 'DESARROLLO' : 'PRODUCCIÓN'})`);

