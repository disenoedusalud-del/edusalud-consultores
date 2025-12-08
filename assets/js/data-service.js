/* ============ MÓDULO DE SERVICIOS DE DATOS ============ */
// ✅ Este módulo contiene funciones para interactuar con Firebase y Google Apps Script
// ✅ Versión: 1.0 - Extraído de app.js para mejor modularidad

/* ===================== CONFIGURACIÓN ===================== */

// URL base del Google Apps Script para manejo de archivos y cursos
const REMOTE_BASE_URL = 'https://script.google.com/macros/s/AKfycbwcpxFztXhNzzSxPKpOcVxHXRBXVAjIT10aHvtIb-AU-sYqQGAowNwyUf0Bd0sm5-8c/exec';

/* ===================== HELPERS ===================== */

/**
 * ✅ Verifica si hay servicio remoto disponible
 */
function hasRemote() {
  return typeof REMOTE_BASE_URL === 'string' && REMOTE_BASE_URL.startsWith('http');
}

/**
 * ✅ Helper global para obtener el ID Token actual de Firebase
 * ⚠️ IMPORTANTE: Si no hay usuario autenticado, usa token secreto compartido
 * Este token debe coincidir con el configurado en Google Apps Script
 */
async function getAuthToken(forceRefresh = true) {
  try {
    const currentUser = window.firebaseAuth?.currentUser;
    if (currentUser) {
      // Si hay usuario autenticado, usar su token de Firebase Auth
      // ✅ Force refresh para obtener claims actualizados (isMaster, etc.)
      const token = await currentUser.getIdToken(forceRefresh);
      if (typeof log === 'function') {
        log('[AUTH] ID Token obtenido (recortado):', token.substring(0, 10) + '...');
      }
      return token;
    }
  } catch (error) {
    if (typeof warn === 'function') {
      warn('[AUTH] Error obteniendo token de Firebase Auth:', error);
    }
  }

  // ⚠️ FALLBACK: Token secreto compartido (debe coincidir con GAS)
  // ✅ Token configurado: GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  const GAS_SECRET_TOKEN = 'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

  if (typeof warn === 'function') {
    warn('[AUTH] No hay usuario autenticado, usando token secreto compartido');
  }
  return GAS_SECRET_TOKEN;
}

/* ===================== FIREBASE DATABASE ===================== */

/**
 * ✅ Función auxiliar para obtener Firebase Realtime Database (alias)
 */
function getFirebaseDB() {
  return window.firebaseDB || null;
}

/**
 * ✅ Función auxiliar para obtener Firebase Realtime Database (alias de getFirebaseDB)
 */
function getFirestoreDB() {
  return window.firebaseDB || null;
}

/* ===================== GOOGLE APPS SCRIPT - ARCHIVOS ===================== */

/**
 * ✅ Obtener archivos de un curso desde Google Apps Script
 * @param {string} hex - Hash del curso
 * @returns {Promise<Array|null>} Array de archivos o null si falla
 */
async function remoteGetFiles(hex) {
  if (!hasRemote()) return null;
  if (typeof log === 'function') {
    log('[GET] Iniciando para hex:', hex.substring(0, 8));
  }

  // Obtener token de autenticación
  const token = await getAuthToken();
  if (!token) {
    if (typeof warn === 'function') {
      warn('[GET] ⚠️ No se pudo obtener token de autenticación. Continuando sin token...');
    }
  }

  // Intentar primero con fetch (puede funcionar si el servidor tiene CORS habilitado)
  try {
    let url = REMOTE_BASE_URL + '?hex=' + encodeURIComponent(hex);
    if (token) {
      url += '&token=' + encodeURIComponent(token);
    }
    if (typeof log === 'function') {
      log('[GET] Intentando fetch directo...');
    }
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors', // Intentar con no-cors primero
      cache: 'no-store'
    });

    // Con no-cors no podemos leer la respuesta, así que seguimos con JSONP
    if (typeof log === 'function') {
      log('[GET] Fetch no-cors enviado, pero no podemos leer respuesta. Intentando JSONP...');
    }
  } catch (e) {
    if (typeof log === 'function') {
      log('[GET] Fetch falló, intentando JSONP...');
    }
  }

  // Usar JSONP como método principal
  try {
    const jsonpResult = await remoteGetFilesJSONP(hex, token);
    if (jsonpResult && Array.isArray(jsonpResult)) {
      if (typeof log === 'function') {
        log('[GET] ✅ JSONP éxito - hex:', hex.substring(0, 8), 'files:', jsonpResult.length);
      }
      return jsonpResult;
    } else {
      if (typeof warn === 'function') {
        warn('[GET] ⚠️ JSONP retornó null o no es array');
      }
      // Intentar verificar qué está devolviendo el servidor
      await testWebAppResponse(hex);
      return null;
    }
  } catch (e) {
    console.error('[GET] ❌ JSONP falló:', e.message);
    await testWebAppResponse(hex);
    return null;
  }
}

/**
 * ✅ Obtener archivos usando JSONP (compatible con CORS)
 * @param {string} hex - Hash del curso
 * @param {string|null} token - Token de autenticación (opcional)
 * @returns {Promise<Array|null>} Array de archivos o null si falla
 */
function remoteGetFilesJSONP(hex, token = null) {
  return new Promise(async (resolve) => {
    // Si no se proporcionó token, intentar obtenerlo
    if (!token) {
      token = await getAuthToken();
    }

    const callbackName = '_gas_jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const script = document.createElement('script');
    // 🛡️ Cache-buster para evitar respuestas viejas del navegador/CDN
    let url = REMOTE_BASE_URL
      + '?hex=' + encodeURIComponent(hex)
      + '&callback=' + callbackName
      + '&ts=' + Date.now();

    // Agregar token si está disponible
    if (token) {
      url += '&token=' + encodeURIComponent(token);
    }
    script.src = url;
    script.async = true;

    if (typeof log === 'function') {
      log('[JSONP] Intentando GET para hex:', hex.substring(0, 8));
      log('[JSONP] URL:', url);
      log('[JSONP] Callback name:', callbackName);
    }

    let resolved = false;
    const cleanup = () => {
      try {
        if (script.parentNode) document.body.removeChild(script);
      } catch (e) { }
      try {
        if (window[callbackName]) delete window[callbackName];
      } catch (e) { }
    };

    // Crear callback global ANTES de agregar el script
    window[callbackName] = function (data) {
      if (resolved) {
        if (typeof warn === 'function') {
          warn('[JSONP] Callback llamado pero ya resuelto');
        }
        return;
      }
      resolved = true;
      clearTimeout(timeout);
      if (typeof log === 'function') {
        log('[JSONP] ✅ Callback recibido!', data);
      }

      let files = null;
      if (data && Array.isArray(data.files)) {
        files = data.files;
        if (typeof log === 'function') {
          log('[JSONP] ✅ Archivos encontrados:', files.length);
        }
      } else {
        if (typeof warn === 'function') {
          warn('[JSONP] ⚠️ Respuesta inválida - no hay files array:', data);
        }
      }

      cleanup();
      resolve(files);
    };

    // Verificar que el callback esté registrado
    if (typeof window[callbackName] !== 'function') {
      console.error('[JSONP] ❌ Error: callback no se registró correctamente');
      resolve(null);
      return;
    }

    script.onerror = (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);

      // Solo mostrar error completo la primera vez por hex
      const errorKey = 'jsonp_error_shown_' + hex;
      if (!sessionStorage.getItem(errorKey)) {
        sessionStorage.setItem(errorKey, 'true');
        console.error('[JSONP] ❌ Error: El WebApp no está devolviendo JSONP correctamente.');
        console.error('[JSONP] URL de prueba:', url);
        console.error('[JSONP] ⚠️ SOLUCIÓN: Actualiza doGet en Google Apps Script para soportar JSONP.');
        console.error('[JSONP] Debe devolver:', callbackName + '({"files":[...]});');
      }

      cleanup();
      resolve(null);
    };

    script.onload = () => {
      if (typeof log === 'function') {
        log('[JSONP] Script cargado, esperando callback...');
      }
      // Si después de 2 segundos no se llamó el callback, algo está mal
      setTimeout(() => {
        if (!resolved) {
          if (typeof warn === 'function') {
            warn('[JSONP] ⚠️ Script cargó pero callback no se ejecutó después de 2s');
          }
        }
      }, 2000);
    };

    // Timeout de 10 segundos (Google Apps Script puede ser lento en primera carga)
    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      if (typeof warn === 'function') {
        warn('[JSONP] ⚠️ Timeout después de 10s para hex:', hex.substring(0, 8));
      }
      cleanup();
      resolve(null);
    }, 10000);

    document.body.appendChild(script);
  });
}

/**
 * ✅ Función de diagnóstico para ver qué devuelve el WebApp
 * @param {string} hex - Hash del curso
 */
async function testWebAppResponse(hex) {
  if (typeof log === 'function') {
    log('[DIAG] Probando respuesta del WebApp...');
  }
  // Obtener token de autenticación
  const token = await getAuthToken();
  // 🛡️ Cache-buster
  let testUrl = REMOTE_BASE_URL
    + '?hex=' + encodeURIComponent(hex)
    + '&callback=test_callback'
    + '&ts=' + Date.now();

  // Agregar token si está disponible
  if (token) {
    testUrl += '&token=' + encodeURIComponent(token);
  }

  // Intentar cargar como imagen para ver si hay redirección
  const img = new Image();
  img.onerror = () => {
    if (typeof log === 'function') {
      log('[DIAG] La URL no se puede cargar como imagen (esperado para script)');
    }
  };
  img.src = testUrl;

  // También mostrar la URL completa para copiar y probar manualmente
  if (typeof log === 'function') {
    log('[DIAG] URL completa para probar manualmente:', testUrl);
    log('[DIAG] Abre esta URL en tu navegador para ver qué devuelve:', testUrl);
  }
}

/* ===================== GOOGLE APPS SCRIPT - CURSOS ===================== */

/**
 * ✅ Obtener cursos personalizados desde Google Apps Script
 * @returns {Promise<Object>} Objeto con cursos (hex -> courseData)
 */
async function remoteGetCourses() {
  if (!hasRemote()) return {};
  try {
    if (typeof log === 'function') {
      log('[COURSE GET] Obteniendo cursos remotos...');
    }

    // ✅ Obtener token de autenticación
    const token = await getAuthToken();
    if (!token) {
      if (typeof warn === 'function') {
        warn('[COURSE GET] ⚠️ No se pudo obtener token de autenticación. Continuando sin token...');
      }
    } else {
      if (typeof log === 'function') {
        log('[COURSE GET] ✅ Token obtenido (primeros 20 chars):', token.substring(0, 20) + '...');
      }
    }

    // ✅ NUEVO ENFOQUE: Usar fetch en lugar de JSONP para evitar script.onerror
    let url = REMOTE_BASE_URL
      + '?action=get_courses'
      + '&ts=' + Date.now();

    if (token) {
      url += '&token=' + encodeURIComponent(token);
      if (typeof log === 'function') {
        log('[COURSE GET] ✅ Token agregado a la URL');
      }
    } else {
      if (typeof warn === 'function') {
        warn('[COURSE GET] ⚠️ URL sin token - puede ser rechazado por GAS');
      }
    }

    if (typeof log === 'function') {
      log('[COURSE GET] URL completa (primeros 250 chars):', url.substring(0, 250));
    }

    try {
      // Intentar con fetch primero (sin callback, para obtener JSON puro)
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors', // Intentar CORS primero
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (typeof log === 'function') {
        log('[COURSE GET] ✅ Respuesta recibida vía fetch');
      }

      if (data && data.error === 'Unauthorized') {
        console.error('[COURSE GET] ❌ Error de autenticación:', data.message);
        return {};
      }

      let courses = {};
      if (data && typeof data.courses === 'object') {
        courses = data.courses;
        if (typeof log === 'function') {
          log('[COURSE GET] ✅ Cursos remotos obtenidos:', Object.keys(courses).length);
        }
      }

      return courses;
    } catch (fetchError) {
      // Si fetch falla (probablemente por CORS), intentar con JSONP como fallback
      if (typeof log === 'function') {
        log('[COURSE GET] ⚠️ Fetch falló, intentando con JSONP:', fetchError.message);
      }

      return new Promise((resolve) => {
        const callbackName = '_gas_jsonp_courses_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const script = document.createElement('script');
        const jsonpUrl = url + '&callback=' + callbackName;

        script.src = jsonpUrl;
        script.async = true;

        let resolved = false;
        const cleanup = () => {
          try {
            if (script.parentNode) document.body.removeChild(script);
          } catch (e) { }
          try {
            if (window[callbackName]) delete window[callbackName];
          } catch (e) { }
        };

        window[callbackName] = function (data) {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          if (typeof log === 'function') {
            log('[COURSE GET] ✅ Callback ejecutado (JSONP fallback)');
          }

          if (data && data.error === 'Unauthorized') {
            console.error('[COURSE GET] ❌ Error de autenticación:', data.message);
            cleanup();
            resolve({});
            return;
          }

          let courses = {};
          if (data && typeof data.courses === 'object') {
            courses = data.courses;
            if (typeof log === 'function') {
              log('[COURSE GET] ✅ Cursos remotos obtenidos (JSONP):', Object.keys(courses).length);
            }
          }

          cleanup();
          resolve(courses);
        };

        script.onerror = () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          if (typeof warn === 'function') {
            warn('[COURSE GET] ❌ Error cargando script JSONP');
          }
          cleanup();
          resolve({});
        };

        const timeout = setTimeout(() => {
          if (resolved) return;
          resolved = true;
          if (typeof warn === 'function') {
            warn('[COURSE GET] ⚠️ Timeout después de 10s');
          }
          cleanup();
          resolve({});
        }, 10000);

        document.body.appendChild(script);
      });
    }
  } catch (e) {
    console.error('[COURSE GET] ❌ Error obteniendo cursos remotos:', e);
    return {};
  }
}

/**
 * ✅ Refrescar cursos personalizados desde el servidor remoto
 * @returns {Promise<boolean>} true si hubo cambios, false si no
 */
async function refreshCustomCourses() {
  // ✅ Iniciar medición de sincronización (si existe)
  const syncStart = typeof startPerformanceMeasure === 'function' 
    ? startPerformanceMeasure('Sincronización') 
    : null;

  if (getFirestoreDB()) {
    if (typeof log === 'function') {
      log('[REFRESH] Firebase maneja cursos personalizados en tiempo real, sin usar JSONP');
    }
    if (syncStart && typeof endPerformanceMeasure === 'function') {
      endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Firebase' });
    }
    return false;
  }
  if (!hasRemote()) {
    if (typeof log === 'function') {
      log('[REFRESH] Sin remoto, saltando...');
    }
    if (syncStart && typeof endPerformanceMeasure === 'function') {
      endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Sin remoto' });
    }
    return false;
  }
  try {
    if (typeof log === 'function') {
      log('[REFRESH] Obteniendo cursos personalizados remotos...');
    }

    // ✅ Timeout de 10 segundos (Google Apps Script puede ser lento en primera carga)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        if (typeof warn === 'function') {
          warn('[REFRESH] ⚠️ Timeout obteniendo cursos remotos después de 10s (continuando con cursos base)');
        }
        resolve({});
      }, 10000); // 10 segundos para dar tiempo a Google Apps Script
    });

    const remoteCoursesPromise = remoteGetCourses();
    const remoteCourses = await Promise.race([remoteCoursesPromise, timeoutPromise]);

    if (typeof log === 'function') {
      log('[REFRESH] Cursos remotos obtenidos:', Object.keys(remoteCourses || {}).length);
    }

    // ✅ Remoto es la fuente de verdad - sobrescribir completamente
    let localCourses = {};
    try {
      // Usar función global si existe
      if (typeof loadCustomCourses === 'function') {
        localCourses = loadCustomCourses();
      }
    } catch (e) {
      if (typeof warn === 'function') {
        warn('[REFRESH] Error cargando cursos locales (modo incógnito?):', e);
      }
      localCourses = {};
    }

    const remoteKeys = Object.keys(remoteCourses || {});

    if (typeof log === 'function') {
      log('[REFRESH] Comparación - Remoto:', remoteKeys.length, 'Local:', Object.keys(localCourses).length);
    }

    // Detectar cambios antes de guardar
    const hadChanges = JSON.stringify(localCourses) !== JSON.stringify(remoteCourses || {});

    // Guardar solo los cursos remotos (remoto es la fuente de verdad)
    // ✅ Manejar error de localStorage silenciosamente
    try {
      // Usar función global si existe
      if (typeof saveCustomCourses === 'function') {
        saveCustomCourses(remoteCourses || {});
        if (typeof log === 'function') {
          log('[REFRESH] ✅ Cursos sincronizados');
        }
      }
    } catch (e) {
      if (typeof warn === 'function') {
        warn('[REFRESH] ⚠️ No se pudieron guardar cursos (modo incógnito?), continuando...', e);
      }
    }

    // ✅ IMPORTANTE: Refrescar archivos SOLO del curso actual si es personalizado
    // No refrescar todos los cursos personalizados para evitar lentitud
    // El refresh periódico se encargará de refrescar todos cada 3 segundos
    const currentKeyHex = window.currentCourseHex;
    if (currentKeyHex && remoteCourses && remoteCourses[currentKeyHex]) {
      if (typeof log === 'function') {
        log('[REFRESH] Curso actual es personalizado, refrescando sus archivos...');
      }
      // Usar función global si existe
      if (typeof refreshFromRemoteSilent === 'function') {
        refreshFromRemoteSilent(currentKeyHex).then(updated => {
          if (updated) {
            if (typeof log === 'function') {
              log('[REFRESH] ✅ Archivos del curso actual actualizados');
            }
            // Solo actualizar vista si estamos viendo ese curso
            if (document.getElementById('content') && !document.getElementById('content').classList.contains('hidden')) {
              // Usar función global si existe
              if (typeof renderCourse === 'function') {
                renderCourse(currentKeyHex);
              }
            }
          }
        }).catch(e => {
          if (typeof warn === 'function') {
            warn('[REFRESH] Error refrescando archivos del curso actual:', e);
          }
        });
      }
    }

    // Si estamos en vista master, reconstruir SOLO si hubo cambios
    const masterEl = document.getElementById('master');
    const isMasterAuthenticated = window.isMasterAuthenticated;
    if (hadChanges && masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated) {
      if (typeof log === 'function') {
        log('[REFRESH] ✅ Cambios detectados, reconstruyendo Vista Maestra...');
      }
      // Usar función global si existe
      if (typeof buildMasterGrid === 'function') {
        buildMasterGrid();
      }
    }

    // ✅ Finalizar medición de sincronización
    const coursesCount = Object.keys(remoteCourses || {}).length;
    if (syncStart && typeof endPerformanceMeasure === 'function') {
      endPerformanceMeasure('Sincronización', syncStart, {
        metodo: 'Google Sheets',
        cursos: coursesCount,
        cambios: hadChanges ? 'Sí' : 'No'
      });
    }

    return hadChanges;
  } catch (e) {
    if (typeof trackError === 'function') {
      trackError(e, {
        operation: 'refreshCustomCourses',
        view: typeof getCurrentView === 'function' ? getCurrentView() : 'unknown'
      });
    }
    // ✅ Finalizar medición con error
    if (syncStart && typeof endPerformanceMeasure === 'function') {
      endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Error' });
    }
    // ✅ No fallar completamente, siempre devolver false para continuar
    return false;
  }
}

/**
 * ✅ Cargar cursos remotos al inicio de la aplicación
 */
async function loadRemoteCoursesOnInit() {
  // Cargar cursos remotos sin sessionStorage para que siempre cargue
  try {
    await refreshCustomCourses();
  } catch (e) {
    if (typeof warn === 'function') {
      warn('[INIT] Error cargando cursos remotos al inicio (continuando):', e);
    }
    // No bloquear la carga si falla
  }
}

/* ===================== EXPOSICIÓN GLOBAL ===================== */
// ✅ Exponer funciones globalmente para compatibilidad con código existente
window.DataService = {
  // Firebase
  getFirebaseDB: getFirebaseDB,
  getFirestoreDB: getFirestoreDB,
  // GAS - Archivos
  remoteGetFiles: remoteGetFiles,
  remoteGetFilesJSONP: remoteGetFilesJSONP,
  testWebAppResponse: testWebAppResponse,
  // GAS - Cursos
  remoteGetCourses: remoteGetCourses,
  refreshCustomCourses: refreshCustomCourses,
  loadRemoteCoursesOnInit: loadRemoteCoursesOnInit,
  // Helpers
  hasRemote: hasRemote,
  getAuthToken: getAuthToken,
  REMOTE_BASE_URL: REMOTE_BASE_URL
};

// ✅ También exponer funciones directamente en window para compatibilidad
window.getFirebaseDB = getFirebaseDB;
window.getFirestoreDB = getFirestoreDB;
window.remoteGetFiles = remoteGetFiles;
window.remoteGetFilesJSONP = remoteGetFilesJSONP;
window.testWebAppResponse = testWebAppResponse;
window.remoteGetCourses = remoteGetCourses;
window.refreshCustomCourses = refreshCustomCourses;
window.loadRemoteCoursesOnInit = loadRemoteCoursesOnInit;
window.hasRemote = hasRemote;
window.getAuthToken = getAuthToken;
// REMOTE_BASE_URL se expone a través del namespace, no directamente para evitar conflictos

