/* ===================== OPTIMIZACIÓN: LOGGING CONDICIONAL ===================== */
// ✅ Sistema de logging optimizado: desactiva logs en producción para mejor rendimiento
const IS_PRODUCTION = true; // Cambiar a false para ver logs en desarrollo
const Logger = {
  log: IS_PRODUCTION ? () => { } : (...args) => console.log(...args),
  warn: IS_PRODUCTION ? () => { } : (...args) => console.warn(...args),
  error: (...args) => console.error(...args), // Errores siempre se muestran
  info: IS_PRODUCTION ? () => { } : (...args) => console.info(...args)
};
// Alias para compatibilidad
const log = Logger.log;
const warn = Logger.warn;
const error = Logger.error;

/* ===================== FIREBASE FIRESTORE - TIEMPO REAL ===================== */
// ✅ Firebase se carga dinámicamente desde /src/firebase.js
// ✅ Compatible con GitHub Pages (sin módulos ES6)
// ✅ Acceso a Firestore mediante window.firebaseDB

// Variable global para suscripción activa
let firestoreUnsubscribe = null;

// ✅ Bandera para evitar re-renders durante operaciones del usuario
let userInteracting = false;

// Función auxiliar para obtener Firestore
function getFirestoreDB() {
  return window.firebaseDB || null;
}

// ✅ Función auxiliar para obtener Firebase Realtime Database (alias)
function getFirebaseDB() {
  return window.firebaseDB || null;
}

// Verificar si Firebase ya está listo o esperar a que cargue
function checkFirebaseStatus() {
  if (window.firebaseDB) {
    log('[APP] ✅ Firebase disponible y listo para usar');
    return true;
  } else if (typeof firebase !== 'undefined') {
    log('[APP] ⏳ Firebase cargando, esperando Firestore...');
    return false;
  } else {
    log('[APP] ℹ️ Modo sin Firebase (usando solo Google Sheets)');
    return false;
  }
}

// Escuchar evento cuando Firebase esté listo
window.addEventListener('firebaseReady', (e) => {
  log('[APP] 🔥 Firebase conectado y listo para sincronización en tiempo real');
  log('[APP] 📊 Base de datos:', e.detail.db ? 'Firestore activo' : 'No disponible');
  initFirebaseCustomCoursesRealtime();
});

// Escuchar evento de error de Firebase
window.addEventListener('firebaseError', (e) => {
  log('[APP] ⚠️ Firebase no disponible, usando Google Sheets como backend');
});

// Verificación inicial
setTimeout(() => {
  checkFirebaseStatus();
}, 1500);

log('[APP] Iniciando aplicación con soporte Firebase...');

/* ===================== SEGURIDAD: SANITIZACIÓN XSS ===================== */

/**
 * ✅ Escapa HTML para prevenir XSS
 * Convierte caracteres especiales en entidades HTML
 */
function escapeHTML(str) {
  if (typeof str !== 'string') {
    if (str == null) return '';
    return String(str);
  }
  try {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  } catch (e) {
    // Fallback si document.createElement falla (no debería pasar)
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * ✅ Sanitiza texto para usar en innerHTML de forma segura
 * Solo permite texto plano, sin etiquetas HTML
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return escapeHTML(str);
}

/**
 * ✅ Sanitiza y permite solo etiquetas seguras (para markdown básico)
 * Por ahora solo escapa todo, pero se puede extender
 */
function sanitizeRichText(str) {
  return sanitizeHTML(str);
}

/* ===================== HELPER DE SANITIZACIÓN ===================== */

/**
 * ✅ Función helper para sanitizar inputs según su tipo
 * @param {string} value - Valor a sanitizar
 * @param {string} type - Tipo de input: 'text', 'url', 'email', 'code', 'tag', 'color'
 * @returns {string|object} Valor sanitizado o objeto con validación
 */
function safeInput(value, type = 'text') {
  if (value == null) value = '';
  if (typeof value !== 'string') value = String(value);

  const trimmed = value.trim();

  switch (type) {
    case 'text':
    case 'title':
    case 'meta':
      return sanitizeHTML(trimmed);

    case 'url':
      const urlValidation = validateURL(trimmed);
      if (urlValidation.valid) {
        return sanitizeHTML(urlValidation.url);
      }
      return sanitizeHTML(trimmed); // Sanitizar aunque sea inválido

    case 'email':
      const emailValidation = validateEmail(trimmed);
      if (emailValidation.valid) {
        return trimmed.toLowerCase(); // Emails se normalizan a lowercase
      }
      return sanitizeHTML(trimmed);

    case 'code':
    case 'tag':
      // Solo letras, números, guiones y guiones bajos
      return sanitizeHTML(trimmed.replace(/[^a-zA-Z0-9_-]/g, ''));

    case 'color':
      // Validar formato hexadecimal
      if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
        return trimmed.toUpperCase();
      }
      return '#5aa9ff'; // Color por defecto si es inválido

    case 'password':
      // Las contraseñas NO se sanitizan (se mantienen como están)
      return value; // No trim ni sanitize para passwords

    default:
      return sanitizeHTML(trimmed);
  }
}

/**
 * ✅ Obtener y sanitizar valor de un input de forma segura
 * @param {string|HTMLElement} selector - Selector CSS o elemento DOM
 * @param {string} type - Tipo de input (ver safeInput)
 * @returns {string} Valor sanitizado
 */
function getSafeInputValue(selector, type = 'text') {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (!element) return '';
  return safeInput(element.value, type);
}

/* ===================== RATE LIMITING MEJORADO ===================== */

/**
 * ✅ Sistema de rate limiting mejorado con ventanas de tiempo y límites específicos
 */

// Configuración de límites por tipo de acción
const RATE_LIMIT_CONFIG = {
  // Acciones críticas (autenticación)
  'login': { windowMs: 60000, maxAttempts: 5 }, // 5 intentos por minuto
  'register': { windowMs: 300000, maxAttempts: 3 }, // 3 intentos por 5 minutos
  'password_reset': { windowMs: 300000, maxAttempts: 3 }, // 3 intentos por 5 minutos
  'resend_code': { windowMs: 60000, maxAttempts: 3 }, // 3 intentos por minuto
  'verify_code': { windowMs: 60000, maxAttempts: 10 }, // 10 intentos por minuto

  // Acciones de gestión de cursos
  'crear curso': { windowMs: 10000, maxAttempts: 3 }, // 3 intentos por 10 segundos
  'editar curso': { windowMs: 5000, maxAttempts: 5 }, // 5 intentos por 5 segundos
  'eliminar curso': { windowMs: 10000, maxAttempts: 2 }, // 2 intentos por 10 segundos

  // Acciones de gestión de emails
  'agregar email': { windowMs: 5000, maxAttempts: 5 }, // 5 intentos por 5 segundos
  'agregar admin': { windowMs: 10000, maxAttempts: 3 }, // 3 intentos por 10 segundos

  // Acciones generales (fallback)
  'default': { windowMs: 2000, maxAttempts: 1 } // 1 intento por 2 segundos
};

// Almacenamiento de intentos por acción (sliding window)
const rateLimitStore = {};

/**
 * ✅ Limpiar intentos antiguos de una acción
 * @param {string} action - Nombre de la acción
 */
function cleanOldAttempts(action) {
  const config = RATE_LIMIT_CONFIG[action] || RATE_LIMIT_CONFIG.default;
  const windowMs = config.windowMs;
  const now = Date.now();

  if (!rateLimitStore[action]) {
    rateLimitStore[action] = [];
    return;
  }

  // Eliminar intentos fuera de la ventana de tiempo
  rateLimitStore[action] = rateLimitStore[action].filter(
    timestamp => now - timestamp < windowMs
  );
}

/**
 * ✅ Verificar rate limit mejorado con ventana de tiempo
 * @param {string} action - Nombre de la acción
 * @param {Object} customConfig - Configuración personalizada opcional { windowMs, maxAttempts }
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
function checkRateLimit(action, customConfig = null) {
  const config = customConfig || RATE_LIMIT_CONFIG[action] || RATE_LIMIT_CONFIG.default;
  const { windowMs, maxAttempts } = config;
  const now = Date.now();

  // Limpiar intentos antiguos
  cleanOldAttempts(action);

  // Inicializar si no existe
  if (!rateLimitStore[action]) {
    rateLimitStore[action] = [];
  }

  // Contar intentos en la ventana actual
  const attemptsInWindow = rateLimitStore[action].length;

  if (attemptsInWindow >= maxAttempts) {
    // Calcular tiempo hasta el siguiente intento permitido
    const oldestAttempt = rateLimitStore[action][0];
    const resetAt = oldestAttempt + windowMs;
    const remaining = Math.ceil((resetAt - now) / 1000);

    // Mostrar mensaje de error
    const actionName = action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const message = attemptsInWindow >= maxAttempts * 2
      ? `Demasiados intentos. Por favor espera ${remaining} segundo(s) antes de intentar ${actionName} nuevamente.`
      : `Has alcanzado el límite de intentos (${maxAttempts}). Espera ${remaining} segundo(s) antes de intentar ${actionName} nuevamente.`;

    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'Límite de intentos alcanzado', message);
    } else if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal('Espera un momento', message);
    } else {
      alert(message);
    }

    return { allowed: false, remaining, resetAt };
  }

  // Registrar intento actual
  rateLimitStore[action].push(now);

  return { allowed: true, remaining: 0, resetAt: now + windowMs };
}

/**
 * ✅ Helper simplificado para compatibilidad con código existente
 * @param {string} action - Nombre de la acción
 * @param {number} customLimitMs - Límite personalizado en ms (deprecated, usar customConfig)
 * @returns {boolean} true si está permitido, false si no
 */
function checkRateLimitSimple(action, customLimitMs = null) {
  let customConfig = null;

  // Compatibilidad con código antiguo que usa customLimitMs
  if (customLimitMs) {
    customConfig = { windowMs: customLimitMs, maxAttempts: 1 };
  }

  const result = checkRateLimit(action, customConfig);
  return result.allowed;
}

// ✅ Mantener función antigua para compatibilidad
const checkRateLimitLegacy = checkRateLimitSimple;

/* ===================== SISTEMA DE LOGS DE AUDITORÍA ===================== */

/**
 * ✅ Sistema de logs de auditoría para rastrear acciones importantes
 */

const AUDIT_LOG_KEY = 'edusalud_audit_log';
const AUDIT_LOG_MAX_SIZE = 500; // Máximo de logs a mantener
const AUDIT_LOG_FIREBASE_PATH = 'auditLogs'; // Ruta en Firebase (opcional)

// Tipos de acciones auditables
const AUDIT_ACTION_TYPES = {
  // Cursos
  COURSE_CREATED: 'course_created',
  COURSE_EDITED: 'course_edited',
  COURSE_DELETED: 'course_deleted',

  // Emails
  EMAIL_ADDED: 'email_added',
  EMAIL_REMOVED: 'email_removed',

  // Administradores
  ADMIN_ADDED: 'admin_added',
  ADMIN_REMOVED: 'admin_removed',

  // Autenticación
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  REGISTER_SUCCESS: 'register_success',
  PASSWORD_RESET: 'password_reset',

  // Acciones generales
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  BACKUP_EXPORTED: 'backup_exported',
  BACKUP_IMPORTED: 'backup_imported',
  CONFIG_CHANGED: 'config_changed'
};

/**
 * ✅ Obtener logs de auditoría almacenados
 * @returns {Array} Array de logs
 */
function getAuditLogs() {
  try {
    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    return Array.isArray(logs) ? logs : [];
  } catch (e) {
    warn('[AUDIT] Error obteniendo logs:', e);
    return [];
  }
}

/**
 * ✅ Guardar logs de auditoría
 * @param {Array} logs - Array de logs a guardar
 */
function saveAuditLogs(logs) {
  try {
    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
      warn('[AUDIT] localStorage no disponible');
      return;
    }

    // Limitar tamaño del log
    const limitedLogs = logs.slice(-AUDIT_LOG_MAX_SIZE);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(limitedLogs));
  } catch (e) {
    warn('[AUDIT] Error guardando logs:', e);
  }
}

/**
 * ✅ Registrar acción en log de auditoría
 * @param {string} action - Tipo de acción (AUDIT_ACTION_TYPES)
 * @param {Object} details - Detalles de la acción
 * @param {string} userId - ID del usuario que realizó la acción (opcional)
 * @param {boolean} sendToFirebase - Si enviar a Firebase (opcional, default: false)
 */
async function auditLog(action, details = {}, userId = null, sendToFirebase = false) {
  try {
    const timestamp = Date.now();
    const userEmail = userId || window.currentUserEmail || 'anonymous';
    const userAgent = navigator.userAgent || 'unknown';
    const url = window.location.href || 'unknown';

    const logEntry = {
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      details: {
        ...details,
        // Sanitizar detalles para evitar XSS
        ...Object.keys(details).reduce((acc, key) => {
          if (typeof details[key] === 'string') {
            acc[key] = sanitizeHTML(details[key]);
          } else {
            acc[key] = details[key];
          }
          return acc;
        }, {})
      },
      userId: sanitizeHTML(userEmail),
      timestamp,
      userAgent: sanitizeHTML(userAgent.substring(0, 200)), // Limitar tamaño
      url: sanitizeHTML(url.substring(0, 200)),
      view: getCurrentView()
    };

    // Agregar a logs locales
    const logs = getAuditLogs();
    logs.push(logEntry);
    saveAuditLogs(logs);

    // Log en consola (solo en desarrollo)
    if (!IS_PRODUCTION) {
      log('[AUDIT]', logEntry);
    }

    // Enviar a Firebase si está disponible y se solicita
    if (sendToFirebase && hasRemote() && db) {
      try {
        await db.ref(`${AUDIT_LOG_FIREBASE_PATH}/${logEntry.id}`).set({
          ...logEntry,
          syncedAt: firebase.database.ServerValue.TIMESTAMP
        });
        log('[AUDIT] ✅ Log enviado a Firebase');
      } catch (firebaseError) {
        warn('[AUDIT] ⚠️ Error enviando log a Firebase:', firebaseError);
      }
    }

    // Enviar a Google Analytics (eventos importantes)
    if (typeof gtag !== 'undefined' && IS_PRODUCTION) {
      try {
        gtag('event', 'audit_action', {
          event_category: 'audit',
          event_label: action,
          value: 1,
          user_id: userEmail.substring(0, 100) // Limitar tamaño
        });
      } catch (analyticsError) {
        warn('[AUDIT] Error enviando a Analytics:', analyticsError);
      }
    }

  } catch (error) {
    // No fallar si el logging falla
    warn('[AUDIT] Error crítico en auditLog:', error);
  }
}

/**
 * ✅ Obtener logs de auditoría filtrados
 * @param {Object} filters - Filtros opcionales { action, userId, startDate, endDate }
 * @returns {Array} Array de logs filtrados
 */
function getFilteredAuditLogs(filters = {}) {
  const logs = getAuditLogs();

  return logs.filter(log => {
    if (filters.action && log.action !== filters.action) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.startDate && log.timestamp < filters.startDate) return false;
    if (filters.endDate && log.timestamp > filters.endDate) return false;
    return true;
  }).sort((a, b) => b.timestamp - a.timestamp); // Más recientes primero
}

/**
 * ✅ Limpiar logs de auditoría antiguos
 * @param {number} daysToKeep - Días de logs a mantener (default: 30)
 */
function cleanOldAuditLogs(daysToKeep = 30) {
  try {
    const logs = getAuditLogs();
    const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const filteredLogs = logs.filter(log => log.timestamp >= cutoffDate);

    if (filteredLogs.length < logs.length) {
      saveAuditLogs(filteredLogs);
      log(`[AUDIT] 🧹 Limpiados ${logs.length - filteredLogs.length} logs antiguos`);
    }
  } catch (e) {
    warn('[AUDIT] Error limpiando logs:', e);
  }
}

// ✅ Exponer funciones globalmente para debugging
window.auditLog = auditLog;
window.getAuditLogs = getAuditLogs;
window.getFilteredAuditLogs = getFilteredAuditLogs;
window.cleanOldAuditLogs = cleanOldAuditLogs;

// ✅ Limpiar logs antiguos al iniciar (mantener últimos 30 días)
if (typeof window !== 'undefined') {
  setTimeout(() => cleanOldAuditLogs(30), 5000); // Ejecutar después de 5 segundos
}

log('[AUDIT] ✅ Sistema de logs de auditoría inicializado');

/* ===================== OPTIMIZACIÓN: DEBOUNCE ===================== */

/**
 * ✅ Debounce helper para optimizar búsquedas y eventos frecuentes
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @param {boolean} immediate - Ejecutar inmediatamente en la primera llamada
 */
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/* ===================== SISTEMA DE RETRY AUTOMÁTICO ===================== */

/**
 * ✅ Retry automático con backoff exponencial
 * @param {Function} fn - Función a ejecutar (debe retornar Promise)
 * @param {Object} options - Opciones de retry
 * @param {number} options.maxRetries - Número máximo de reintentos (default: 3)
 * @param {number} options.initialDelay - Delay inicial en ms (default: 1000)
 * @param {number} options.maxDelay - Delay máximo en ms (default: 10000)
 * @param {Function} options.shouldRetry - Función que determina si se debe reintentar (default: siempre true)
 * @param {Function} options.onRetry - Callback cuando se hace un retry
 * @returns {Promise} Promise que se resuelve con el resultado o rechaza después de todos los intentos
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      // ✅ Si es el primer intento, no loguear
      if (attempt > 0) {
        log(`[RETRY] ✅ Éxito después de ${attempt} reintento(s)`);
      }
      return result;
    } catch (error) {
      lastError = error;

      // ✅ Verificar si se debe reintentar
      if (attempt < maxRetries && shouldRetry(error)) {
        // Calcular delay con backoff exponencial
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

        if (onRetry) {
          onRetry(attempt + 1, maxRetries, delay, error);
        } else {
          warn(`[RETRY] ⚠️ Intento ${attempt + 1}/${maxRetries} falló, reintentando en ${delay}ms...`, error.message);
        }

        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // No más reintentos o no se debe reintentar
        if (attempt >= maxRetries) {
          error('[RETRY] ❌ Todos los intentos fallaron después de', maxRetries, 'reintentos');
        }
        throw lastError;
      }
    }
  }

  throw lastError;
}

/**
 * ✅ Determina si un error de red debe ser reintentado
 */
function shouldRetryNetworkError(error) {
  // Reintentar errores de red, timeout, o errores 5xx
  if (!error) return false;

  const errorMessage = error.message || String(error);
  const errorCode = error.code || error.status;

  // Errores de red
  if (errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND')) {
    return true;
  }

  // Errores HTTP 5xx (errores del servidor)
  if (errorCode >= 500 && errorCode < 600) {
    return true;
  }

  // Errores específicos de Firebase
  if (errorMessage.includes('permission-denied') ||
    errorMessage.includes('unavailable') ||
    errorMessage.includes('deadline-exceeded')) {
    return true;
  }

  return false;
}

/**
 * ✅ Wrapper para operaciones de Firebase con retry
 */
async function firebaseOperationWithRetry(operation, options = {}) {
  return retryWithBackoff(
    () => operation(),
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      shouldRetry: shouldRetryNetworkError,
      onRetry: (attempt, maxRetries, delay) => {
        log(`[FIREBASE RETRY] Reintento ${attempt}/${maxRetries} en ${delay}ms...`);
      },
      ...options
    }
  );
}

/**
 * ✅ Wrapper para operaciones de red con retry
 */
async function networkOperationWithRetry(operation, options = {}) {
  return retryWithBackoff(
    () => operation(),
    {
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 10000,
      shouldRetry: shouldRetryNetworkError,
      onRetry: (attempt, maxRetries, delay) => {
        log(`[NETWORK RETRY] Reintento ${attempt}/${maxRetries} en ${delay}ms...`);
      },
      ...options
    }
  );
}

/* ===================== MEMOIZACIÓN Y OPTIMIZACIÓN DE RE-RENDERS ===================== */

/**
 * ✅ Sistema de memoización para evitar re-renders innecesarios
 */
const renderCache = new Map();

/**
 * ✅ Genera un hash simple de los datos para comparación rápida
 */
function generateDataHash(data) {
  try {
    return JSON.stringify(data);
  } catch (e) {
    return String(data);
  }
}

/**
 * ✅ Verifica si los datos han cambiado desde el último render
 * @param {string} cacheKey - Clave única para este render
 * @param {any} newData - Nuevos datos a comparar
 * @returns {boolean} true si los datos cambiaron
 */
function hasDataChanged(cacheKey, newData) {
  const newHash = generateDataHash(newData);
  const cachedHash = renderCache.get(cacheKey);

  if (cachedHash === newHash) {
    return false; // No hay cambios
  }

  // Actualizar caché
  renderCache.set(cacheKey, newHash);
  return true; // Hay cambios
}

/**
 * ✅ Limpia el caché de renders
 */
function clearRenderCache() {
  renderCache.clear();
  log('[RENDER CACHE] ✅ Caché de renders limpiado');
}

/**
 * ✅ Limpia el caché de un render específico
 */
function clearRenderCacheFor(key) {
  renderCache.delete(key);
}

/**
 * ✅ Wrapper para renderCourse con memoización
 */
let lastRenderCourseData = null;
let lastRenderCourseHex = null;

function shouldRenderCourse(hex, data) {
  const cacheKey = `course_${hex}`;
  // ✅ CRÍTICO: Usar getFilesForHex() para obtener el conteo REAL de archivos
  // No usar data?.files porque los archivos se guardan en localStorage
  const realFiles = getFilesForHex(hex);
  const dataToCompare = {
    title: data?.title,
    meta: data?.meta,
    filesCount: (realFiles || []).length, // ✅ Usar archivos reales de localStorage
    type: data?.type,
    card: data?.card
  };

  // Si es el mismo curso y los datos no cambiaron, no renderizar
  if (hex === lastRenderCourseHex && !hasDataChanged(cacheKey, dataToCompare)) {
    log('[RENDER] ⏸️ Datos del curso no cambiaron, omitiendo re-render');
    return false;
  }

  lastRenderCourseHex = hex;
  lastRenderCourseData = dataToCompare;
  return true;
}

/**
 * ✅ Wrapper para buildMasterGrid con memoización
 */
let lastMasterGridData = null;

function shouldBuildMasterGrid(coursesData) {
  const cacheKey = 'master_grid';
  const dataToCompare = {
    coursesCount: Object.keys(coursesData || {}).length,
    courses: Object.entries(coursesData || {}).map(([hex, data]) => {
      // ✅ CRÍTICO: Usar getFilesForHex() para obtener el conteo REAL de archivos
      // No usar data?.files porque los archivos se guardan en localStorage
      const realFiles = getFilesForHex(hex);
      return {
        hex: hex.substring(0, 8),
        title: data?.title,
        type: data?.type,
        filesCount: (realFiles || []).length // ✅ Usar archivos reales de localStorage
      };
    })
  };

  // Si los datos no cambiaron, no renderizar
  if (!hasDataChanged(cacheKey, dataToCompare)) {
    log('[RENDER] ⏸️ Datos del grid no cambiaron, omitiendo re-render');
    return false;
  }

  lastMasterGridData = dataToCompare;
  return true;
}

/* ===================== CACHÉ DE BÚSQUEDAS ===================== */

/**
 * ✅ Sistema de caché para resultados de búsqueda
 * Almacena resultados para evitar recalcular filtros
 */
const searchCache = new Map();
const SEARCH_CACHE_MAX_SIZE = 50; // Máximo de entradas en caché
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * ✅ Genera una clave única para la búsqueda
 */
function getSearchCacheKey(query, filters) {
  return JSON.stringify({
    q: (query || '').toLowerCase().trim(),
    type: filters?.type || '',
    tag: filters?.tag || '',
    sort: filters?.sort || 'title-asc'
  });
}

/**
 * ✅ Obtiene resultado de búsqueda del caché
 */
function getCachedSearchResult(key) {
  const cached = searchCache.get(key);
  if (!cached) return null;

  // Verificar si el caché expiró
  if (Date.now() - cached.timestamp > SEARCH_CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }

  return cached.result;
}

/**
 * ✅ Guarda resultado de búsqueda en caché
 */
function setCachedSearchResult(key, result) {
  // Limpiar caché si está lleno
  if (searchCache.size >= SEARCH_CACHE_MAX_SIZE) {
    // Eliminar la entrada más antigua
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }

  searchCache.set(key, {
    result: result,
    timestamp: Date.now()
  });
}

/**
 * ✅ Limpia el caché de búsquedas
 */
function clearSearchCache() {
  searchCache.clear();
  log('[SEARCH CACHE] ✅ Caché limpiado');
}

/**
 * ✅ Debounce mejorado con cancelación inteligente
 * Permite cancelar la ejecución si hay una nueva llamada
 */
function smartDebounce(func, wait, options = {}) {
  let timeout;
  let lastArgs;
  let lastContext;
  const { immediate = false, maxWait = null } = options;
  let maxTimeout;

  const later = () => {
    timeout = null;
    if (maxTimeout) {
      clearTimeout(maxTimeout);
      maxTimeout = null;
    }
    if (!immediate) func.apply(lastContext, lastArgs);
  };

  const debounced = function (...args) {
    lastArgs = args;
    lastContext = this;

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    // Max wait: forzar ejecución después de un tiempo máximo
    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        func.apply(lastContext, lastArgs);
        maxTimeout = null;
      }, maxWait);
    }

    if (callNow) {
      func.apply(lastContext, lastArgs);
    }
  };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    if (maxTimeout) {
      clearTimeout(maxTimeout);
      maxTimeout = null;
    }
  };

  return debounced;
}

/* ===================== SKELETON SCREENS Y LAZY LOADING ===================== */

/**
 * ✅ Crea un skeleton screen para una tarjeta de curso
 */
function createSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'skeleton-master-card';
  card.innerHTML = `
    <div class="skeleton skeleton-image"></div>
    <div class="skeleton skeleton-title"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text-short"></div>
  `;
  return card;
}

/**
 * ✅ Crea un skeleton screen para un archivo
 */
function createSkeletonFile() {
  const file = document.createElement('div');
  file.className = 'skeleton-file';
  file.innerHTML = `
    <div class="skeleton skeleton-file-icon"></div>
    <div class="skeleton-file-content">
      <div class="skeleton skeleton-file-title"></div>
      <div class="skeleton skeleton-file-meta"></div>
    </div>
  `;
  return file;
}

/**
 * ✅ Muestra skeleton screens en el grid maestro
 * @param {HTMLElement} grid - Contenedor del grid
 * @param {number} count - Número de skeletons a mostrar
 */
function showMasterSkeletons(grid, count = 6) {
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    grid.appendChild(createSkeletonCard());
  }
}

/**
 * ✅ Muestra skeleton screens en la lista de archivos
 * @param {HTMLElement} filelist - Contenedor de archivos
 * @param {number} count - Número de skeletons a mostrar
 */
function showFilesSkeletons(filelist, count = 3) {
  if (!filelist) return;
  filelist.innerHTML = '';
  for (let i = 0; i < count; i++) {
    filelist.appendChild(createSkeletonFile());
  }
}

/**
 * ✅ Lazy loading para imágenes
 * @param {HTMLImageElement} img - Elemento imagen
 */
function setupLazyImage(img) {
  if (!img || !('loading' in HTMLImageElement.prototype)) {
    return; // Navegador no soporta lazy loading nativo
  }

  img.loading = 'lazy';

  // Agregar clase cuando la imagen carga
  if (img.complete) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
    img.addEventListener('error', () => {
      img.classList.add('loaded'); // Mostrar aunque haya error
    });
  }
}

/**
 * ✅ Aplicar lazy loading a todas las imágenes de un contenedor
 * @param {HTMLElement} container - Contenedor con imágenes
 */
function setupLazyImages(container) {
  if (!container) return;
  const images = container.querySelectorAll('img:not([loading])');
  images.forEach(img => setupLazyImage(img));
}

/**
 * ✅ Mostrar overlay de carga
 * @param {string} message - Mensaje a mostrar
 */
function showLoadingOverlay(message = 'Cargando...') {
  // Remover overlay existente si hay
  const existing = document.getElementById('loading-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-overlay-content">
      <div class="loading-spinner"></div>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

/**
 * ✅ Ocultar overlay de carga
 */
function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => overlay.remove(), 300);
  }
}

/* ===================== NOTIFICACIONES TOAST ===================== */

/**
 * ✅ Sistema de notificaciones toast
 */
function showToast(type, title, message, duration = 3000) {
  // Crear contenedor si no existe
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  // Crear toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: var(--bg);
    border: 1px solid rgba(90,169,255,0.3);
    border-left: 4px solid ${getToastColor(type)};
    border-radius: 8px;
    padding: 14px 18px;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: auto;
    animation: slideInRight 0.3s ease-out;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  `;

  // Icono
  const icon = document.createElement('div');
  icon.innerHTML = getToastIcon(type);
  icon.style.cssText = `
    font-size: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Contenido
  const content = document.createElement('div');
  content.style.cssText = `flex: 1;`;

  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    margin-bottom: 4px;
  `;

  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  messageEl.style.cssText = `
    font-size: 13px;
    color: var(--muted);
    line-height: 1.4;
  `;

  content.appendChild(titleEl);
  content.appendChild(messageEl);

  // Botón cerrar
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: var(--muted);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.2s;
  `;
  closeBtn.addEventListener('click', () => removeToast(toast));
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.color = 'var(--text)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.color = 'var(--muted)';
  });

  toast.appendChild(icon);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  toastContainer.appendChild(toast);

  // Auto-remover después de duration
  setTimeout(() => removeToast(toast), duration);

  // Agregar animación CSS si no existe
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

function getToastColor(type) {
  const colors = {
    success: '#4ade80',
    error: '#ff5555',
    warning: '#fbbf24',
    info: '#5aa9ff'
  };
  return colors[type] || colors.info;
}

function getToastIcon(type) {
  const icons = {
    success: '<i class="ph ph-check-circle" style="font-size: 20px;"></i>',
    error: '<i class="ph ph-x-circle" style="font-size: 20px;"></i>',
    warning: '<i class="ph ph-warning-circle" style="font-size: 20px;"></i>',
    info: '<i class="ph ph-info" style="font-size: 20px;"></i>'
  };
  return icons[type] || icons.info;
}

function removeToast(toast) {
  toast.style.animation = 'slideOutRight 0.3s ease-out';
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 300);
}

// ✅ Sistema de Notificaciones Persistente
const NOTIFICATIONS_STORAGE_KEY = 'edusalud_notifications';
const MAX_NOTIFICATIONS = 50;

function saveNotification(type, title, message, action = null) {
  try {
    const notifications = getNotifications();
    const notification = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      action,
      timestamp: Date.now(),
      read: false
    };

    notifications.unshift(notification);
    const limited = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(limited));

    // Actualizar badge
    updateNotificationsBadge();

    return notification;
  } catch (e) {
    warn('[NOTIFICATIONS] Error guardando notificación:', e);
    return null;
  }
}

function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    warn('[NOTIFICATIONS] Error obteniendo notificaciones:', e);
    return [];
  }
}

function markNotificationAsRead(id) {
  try {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      updateNotificationsBadge();
    }
  } catch (e) {
    warn('[NOTIFICATIONS] Error marcando notificación como leída:', e);
  }
}

function updateNotificationsBadge() {
  const badge = $('#notifications-badge');
  if (badge) {
    const notifications = getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ✅ Mejorar showToast para guardar notificaciones importantes
const originalShowToast = showToast;
window.showToast = function (type, title, message, duration = 3000, saveToHistory = false) {
  // Mostrar toast normal
  originalShowToast(type, title, message, duration);

  // Guardar notificaciones importantes
  if (saveToHistory || type === 'error' || type === 'warning') {
    saveNotification(type, title, message);
  }
};

// ✅ Configurar panel de notificaciones - VERSIÓN ULTRA SIMPLIFICADA
function setupNotificationsPanel() {
  console.log('[NOTIFICATIONS] 🔄 Iniciando configuración...');

  const btnNotifications = document.getElementById('btn-notifications');
  const panel = document.getElementById('notificationsPanel');

  // ✅ Si el botón o panel no existen, simplemente retornar sin intentar de nuevo
  if (!btnNotifications || !panel) {
    console.log('[NOTIFICATIONS] ℹ️ Botón o panel no encontrado, omitiendo configuración');
    return; // ✅ NO hacer setTimeout, simplemente retornar
  }

  console.log('[NOTIFICATIONS] ✅ Elementos encontrados');

  // ✅ REMOVER TODOS LOS LISTENERS ANTERIORES - Clonar el botón
  const newBtn = btnNotifications.cloneNode(true);
  btnNotifications.parentNode.replaceChild(newBtn, btnNotifications);
  const btn = document.getElementById('btn-notifications');
  const panelEl = document.getElementById('notificationsPanel');

  let isOpen = false;
  let escapeHandler = null;

  // ✅ Click handler ULTRA SIMPLE
  btn.onclick = function (e) {
    console.log('[NOTIFICATIONS] 🖱️ CLICK DETECTADO!');
    e.preventDefault();
    e.stopPropagation();

    isOpen = !isOpen;

    if (isOpen) {
      console.log('[NOTIFICATIONS] ➕ Abriendo panel...');
      panelEl.classList.add('show'); // ✅ Agregar clase .show para activar animación CSS
      panelEl.style.display = 'flex';
      panelEl.style.visibility = 'visible';
      panelEl.style.opacity = '1';
      panelEl.style.zIndex = '10000';
      btn.setAttribute('aria-expanded', 'true');

      // ✅ Verificar que el panel se abrió
      setTimeout(() => {
        const computedStyle = window.getComputedStyle(panelEl);
        console.log('[NOTIFICATIONS] 📊 Estado del panel:', {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          zIndex: computedStyle.zIndex,
          width: computedStyle.width,
          height: computedStyle.height
        });
      }, 50);

      // Mostrar vacío primero
      const list = document.getElementById('notifications-list');
      const empty = document.getElementById('notifications-empty');
      if (list && empty) {
        list.style.display = 'none';
        empty.style.display = 'block';
      }

      const activityList = document.getElementById('activity-list');
      const activityEmpty = document.getElementById('activity-empty');
      if (activityList && activityEmpty) {
        activityList.style.display = 'none';
        activityEmpty.style.display = 'block';
      }

      // Renderizar después (MUY ASÍNCRONO para no bloquear)
      console.log('[NOTIFICATIONS] ⏳ Programando renderizado asíncrono...');

      // ✅ Renderizar notificaciones primero (más rápido)
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            console.log('[NOTIFICATIONS] 🎨 Renderizando notificaciones...');
            if (typeof renderNotifications === 'function') {
              renderNotifications();
              console.log('[NOTIFICATIONS] ✅ Notificaciones renderizadas');
            }
          } catch (e) {
            console.error('[NOTIFICATIONS] ❌ Error renderizando notificaciones:', e);
          }
        }, 50);
      });

      // ✅ Renderizar actividad después (más pesado)
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            console.log('[ACTIVITY] 🎨 Renderizando actividad...');
            if (typeof renderActivity === 'function') {
              renderActivity();
              console.log('[ACTIVITY] ✅ Actividad renderizada');
            }
          } catch (e) {
            console.error('[ACTIVITY] ❌ Error renderizando actividad:', e);
          }
        }, 200);
      });

      // Escape
      if (!escapeHandler) {
        escapeHandler = function (e) {
          if (e.key === 'Escape' && isOpen) {
            isOpen = false;
            panelEl.classList.remove('show'); // ✅ Remover clase .show
            panelEl.style.display = 'none';
            btn.setAttribute('aria-expanded', 'false');
            document.removeEventListener('keydown', escapeHandler);
            escapeHandler = null;
          }
        };
        document.addEventListener('keydown', escapeHandler);
      }

    } else {
      console.log('[NOTIFICATIONS] ➖ Cerrando panel...');
      isOpen = false;
      panelEl.classList.remove('show'); // ✅ Remover clase .show
      panelEl.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
      if (escapeHandler) {
        document.removeEventListener('keydown', escapeHandler);
        escapeHandler = null;
      }
    }
  };

  // ✅ Botón cerrar
  const btnClose = document.getElementById('btn-close-notifications');
  if (btnClose) {
    btnClose.onclick = function () {
      isOpen = false;
      panelEl.classList.remove('show'); // ✅ Remover clase .show
      panelEl.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
      if (escapeHandler) {
        document.removeEventListener('keydown', escapeHandler);
        escapeHandler = null;
      }
    };
  }

  // ✅ Pestañas
  const tabNotif = document.getElementById('tab-notifications');
  const tabAct = document.getElementById('tab-activity');
  const contentNotif = document.getElementById('notifications-content');
  const contentAct = document.getElementById('activity-content');

  if (tabNotif) {
    tabNotif.onclick = function () {
      if (tabNotif) tabNotif.classList.add('active');
      if (tabAct) tabAct.classList.remove('active');
      if (contentNotif) contentNotif.style.display = 'block';
      if (contentAct) contentAct.style.display = 'none';
      if (tabNotif) tabNotif.style.borderBottomColor = 'var(--accent)';
      if (tabAct) tabAct.style.borderBottomColor = 'transparent';
    };
  }

  if (tabAct) {
    tabAct.onclick = function () {
      if (tabAct) tabAct.classList.add('active');
      if (tabNotif) tabNotif.classList.remove('active');
      if (contentNotif) contentNotif.style.display = 'none';
      if (contentAct) contentAct.style.display = 'block';
      if (tabAct) tabAct.style.borderBottomColor = 'var(--accent)';
      if (tabNotif) tabNotif.style.borderBottomColor = 'transparent';
      setTimeout(() => {
        try {
          if (typeof renderActivity === 'function') renderActivity();
        } catch (e) { console.error(e); }
      }, 50);
    };
  }

  // ✅ Filtro
  const filter = document.getElementById('filter-activity');
  if (filter) {
    filter.onchange = function () {
      try {
        if (typeof renderActivity === 'function') renderActivity(this.value);
      } catch (e) { console.error(e); }
    };
  }

  // ✅ Inicializar badge
  if (typeof updateNotificationsBadge === 'function') {
    updateNotificationsBadge();
  }

  console.log('[NOTIFICATIONS] ✅✅✅ CONFIGURACIÓN COMPLETA - BOTÓN LISTO');

  // ✅ Forzar prueba inmediata
  setTimeout(() => {
    if (btn.onclick) {
      console.log('[NOTIFICATIONS] ✅ Handler existe y está configurado');
    } else {
      console.error('[NOTIFICATIONS] ❌ Handler NO existe!');
    }
  }, 100);

  // ✅ Exponer función global para debug
  window.reconfigureNotificationsPanel = () => {
    setupNotificationsPanel();
    console.log('[NOTIFICATIONS] 🔄 Panel reconfigurado manualmente');
  };
}

// ✅ Renderizar notificaciones (con límite y protección)
function renderNotifications() {
  console.log('[NOTIFICATIONS] 🎨 Iniciando renderNotifications...');
  try {
    const list = document.getElementById('notifications-list');
    const empty = document.getElementById('notifications-empty');
    if (!list || !empty) {
      console.warn('[NOTIFICATIONS] Elementos no encontrados');
      return;
    }

    console.log('[NOTIFICATIONS] Obteniendo notificaciones...');
    const notifications = getNotifications();
    if (!Array.isArray(notifications)) {
      list.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    // ✅ Limitar cantidad de notificaciones para evitar bloqueo
    const limitedNotifications = notifications.slice(0, 50);

    if (limitedNotifications.length === 0) {
      console.log('[NOTIFICATIONS] No hay notificaciones');
      list.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    console.log('[NOTIFICATIONS] Renderizando', limitedNotifications.length, 'notificaciones...');
    list.style.display = 'flex';
    empty.style.display = 'none';
    list.innerHTML = '';

    // ✅ Renderizar en lotes pequeños para no bloquear
    let rendered = 0;
    const batchSize = 10;

    const renderBatch = () => {
      const batch = limitedNotifications.slice(rendered, rendered + batchSize);

      batch.forEach((notification, index) => {
        try {
          // ✅ Validar datos de notificación
          if (!notification || !notification.id) {
            return;
          }

          const item = document.createElement('div');
          item.style.cssText = `
            padding: 12px;
            background: ${notification.read ? 'rgba(90,169,255,0.05)' : 'rgba(90,169,255,0.1)'};
            border-left: 3px solid ${getToastColor(notification.type || 'info')};
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
          `;

          if (!notification.read) {
            item.style.fontWeight = '500';
          }

          item.addEventListener('click', () => {
            try {
              markNotificationAsRead(notification.id);
              item.style.background = 'rgba(90,169,255,0.05)';
              item.style.fontWeight = 'normal';
              updateNotificationsBadge();
            } catch (e) {
              console.error('[NOTIFICATIONS] Error marcando como leída:', e);
            }
          });

          const time = new Date(notification.timestamp || Date.now());
          const timeStr = time.toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });

          const title = escapeHTML(String(notification.title || 'Sin título'));
          const message = escapeHTML(String(notification.message || ''));

          item.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
              <div style="font-size: 20px; flex-shrink: 0;">${getToastIcon(notification.type || 'info')}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px;">${title}</div>
                <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">${message}</div>
                <div style="font-size: 11px; color: var(--muted); opacity: 0.7;">${timeStr}</div>
              </div>
              ${!notification.read ? '<div style="width: 8px; height: 8px; background: var(--accent); border-radius: 50%; flex-shrink: 0; margin-top: 4px;"></div>' : ''}
            </div>
          `;

          list.appendChild(item);
        } catch (error) {
          console.error(`[NOTIFICATIONS] Error renderizando notificación ${rendered + index}:`, error);
        }
      });

      rendered += batch.length;

      // ✅ Continuar con siguiente lote si hay más
      if (rendered < limitedNotifications.length) {
        setTimeout(renderBatch, 10); // Delay muy corto entre lotes
      } else {
        console.log('[NOTIFICATIONS] ✅ Todas las notificaciones renderizadas');
      }
    };

    // ✅ Iniciar renderizado por lotes
    renderBatch();
  } catch (error) {
    console.error('[NOTIFICATIONS] Error crítico en renderNotifications:', error);
    const list = $('#notifications-list');
    const empty = $('#notifications-empty');
    if (list) list.style.display = 'none';
    if (empty) empty.style.display = 'block';
  }
}

// ✅ Renderizar actividad (con protección máxima contra errores)
function renderActivity(filter = 'all') {
  try {
    const list = $('#activity-list');
    const empty = $('#activity-empty');
    if (!list || !empty) {
      console.warn('[ACTIVITY] Elementos no encontrados');
      return;
    }

    // ✅ Limpiar primero
    list.innerHTML = '';
    list.style.display = 'none';
    empty.style.display = 'block';

    // ✅ Obtener logs con timeout para evitar bloqueo
    let logs = [];
    try {
      logs = getAuditLogs();
    } catch (error) {
      console.error('[ACTIVITY] Error obteniendo logs:', error);
      return;
    }

    if (!Array.isArray(logs)) {
      console.warn('[ACTIVITY] Logs no es un array válido');
      return;
    }

    // ✅ Limitar cantidad máxima para evitar bloqueo
    if (logs.length > 100) {
      logs = logs.slice(-100); // Solo los últimos 100
    }

    let filteredLogs = logs;

    if (filter !== 'all') {
      filteredLogs = logs.filter(log => log && log.action === filter);
    }

    // Ordenar por fecha (más recientes primero) y limitar a 30 (reducido)
    filteredLogs = filteredLogs
      .filter(log => log && log.timestamp && log.action) // ✅ Filtrar logs inválidos
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 30); // ✅ Reducido a 30 para evitar bloqueo

    if (filteredLogs.length === 0) {
      return;
    }

    list.style.display = 'flex';
    empty.style.display = 'none';

    const actionLabels = {
      'course_created': { icon: '<i class="ph ph-check-circle" style="font-size: 20px;"></i>', label: 'Curso creado', color: '#4ade80' },
      'course_edited': { icon: '<i class="ph ph-pencil" style="font-size: 20px;"></i>', label: 'Curso editado', color: '#5aa9ff' },
      'course_deleted': { icon: '<i class="ph ph-trash" style="font-size: 20px;"></i>', label: 'Curso eliminado', color: '#ff5555' },
      'email_added': { icon: '<i class="ph ph-envelope" style="font-size: 20px;"></i>', label: 'Email agregado', color: '#fbbf24' },
      'email_removed': { icon: '<i class="ph ph-envelope" style="font-size: 20px;"></i>', label: 'Email eliminado', color: '#ff5555' },
      'admin_added': { icon: '<i class="ph ph-user" style="font-size: 20px;"></i>', label: 'Admin agregado', color: '#a855f7' },
      'admin_removed': { icon: '<i class="ph ph-user" style="font-size: 20px;"></i>', label: 'Admin eliminado', color: '#ff5555' },
      'backup_exported': { icon: '<i class="ph ph-floppy-disk" style="font-size: 20px;"></i>', label: 'Backup exportado', color: '#4ade80' },
      'backup_imported': { icon: '<i class="ph ph-download" style="font-size: 20px;"></i>', label: 'Backup importado', color: '#5aa9ff' }
    };

    // ✅ Renderizar en lotes más pequeños con delay
    let rendered = 0;
    const batchSize = 5; // ✅ Reducido a 5

    const renderBatch = () => {
      try {
        const batch = filteredLogs.slice(rendered, rendered + batchSize);

        batch.forEach(log => {
          try {
            if (!log || !log.action) return;

            const action = actionLabels[log.action] || { icon: '<i class="ph ph-info" style="font-size: 20px;"></i>', label: log.action || 'Acción', color: '#5aa9ff' };
            const time = new Date(log.timestamp || Date.now());
            const timeStr = time.toLocaleString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            const item = document.createElement('div');
            item.style.cssText = `
              padding: 12px;
              background: rgba(90,169,255,0.05);
              border-left: 3px solid ${action.color};
              border-radius: 4px;
            `;

            let detailsHtml = '';
            try {
              if (log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0) {
                const details = Object.entries(log.details).slice(0, 2).map(([key, value]) =>
                  escapeHTML(String(value || ''))
                ).join(' • ');
                if (details) {
                  detailsHtml = `<div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">${details}</div>`;
                }
              }
            } catch (e) {
              // Ignorar errores en details
            }

            item.innerHTML = `
              <div style="display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 20px; flex-shrink: 0;">${action.icon}</div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 500; font-size: 13px; color: var(--text); margin-bottom: 4px;">${escapeHTML(action.label)}</div>
                  ${detailsHtml}
                  <div style="font-size: 11px; color: var(--muted); opacity: 0.7;">${timeStr}</div>
                </div>
              </div>
            `;

            list.appendChild(item);
          } catch (error) {
            console.error('[ACTIVITY] Error renderizando log individual:', error);
          }
        });

        rendered += batch.length;

        // ✅ Continuar con el siguiente lote si hay más (con delay)
        if (rendered < filteredLogs.length) {
          setTimeout(renderBatch, 50); // ✅ Delay de 50ms entre lotes
        }
      } catch (error) {
        console.error('[ACTIVITY] Error en renderBatch:', error);
      }
    };

    // ✅ Iniciar renderizado por lotes con delay inicial
    setTimeout(renderBatch, 0);
  } catch (error) {
    console.error('[ACTIVITY] Error crítico en renderActivity:', error);
    const list = $('#activity-list');
    const empty = $('#activity-empty');
    if (list) {
      list.style.display = 'none';
      list.innerHTML = '';
    }
    if (empty) empty.style.display = 'block';
  }
}

// ✅ Configurar búsqueda de archivos
function setupFilesSearch(hex, filelist) {
  const searchInput = $('#search-files');
  if (!searchInput || !filelist) return;

  // ✅ Función para filtrar archivos
  function filterFiles() {
    const query = (searchInput.value || '').trim().toLowerCase();
    const fileRows = filelist.querySelectorAll('.file');

    if (!query) {
      fileRows.forEach(row => {
        row.style.display = '';
      });
      return;
    }

    let visibleCount = 0;
    fileRows.forEach(row => {
      const label = row.dataset.fileLabel || '';
      const host = row.dataset.fileHost || '';
      const match = label.includes(query) || host.includes(query);
      row.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    // ✅ Actualizar contador de resultados
    const filesCountEl = $('#files-count');
    if (filesCountEl) {
      const total = fileRows.length;
      if (visibleCount < total) {
        filesCountEl.textContent = `${visibleCount} de ${total} archivo(s)`;
      } else {
        filesCountEl.textContent = `${total} archivo(s)`;
      }
    }
  }

  // ✅ Event listener con debounce
  const debouncedFilter = debounce(filterFiles, 300);
  searchInput.addEventListener('input', debouncedFilter);

  // ✅ Limpiar búsqueda con Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterFiles();
      searchInput.blur();
    }
  });
}

// Exponer globalmente
window.showToast = showToast;

/* ===================== VALIDACIONES MEJORADAS ===================== */

/**
 * ✅ Valida formato de URL con protocolos permitidos
 */
function validateURL(url, allowedProtocols = ['http:', 'https:']) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL no puede estar vacía' };
  }

  url = url.trim();

  // Verificar protocolo
  try {
    const urlObj = new URL(url);
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return {
        valid: false,
        error: `Protocolo no permitido. Use: ${allowedProtocols.join(' o ')}`
      };
    }

    // Verificar que tenga hostname
    if (!urlObj.hostname) {
      return { valid: false, error: 'URL debe tener un dominio válido' };
    }

    return { valid: true, url: urlObj.href };
  } catch (e) {
    // Si no es URL absoluta, verificar si es relativa válida
    if (url.startsWith('/') || url.startsWith('assets/') || url.startsWith('./')) {
      return { valid: true, url: url };
    }
    return { valid: false, error: 'Formato de URL inválido' };
  }
}

/**
 * ✅ Verifica si una imagen existe (sin bloquear la UI)
 */
async function verifyImageExists(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve({ exists: false, error: 'URL vacía' });
      return;
    }

    const img = new Image();
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ exists: false, error: 'Timeout: La imagen no respondió' });
      }
    }, 5000); // 5 segundos timeout

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ exists: true, width: img.width, height: img.height });
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve({ exists: false, error: 'La imagen no se pudo cargar' });
      }
    };

    // Intentar cargar la imagen
    img.src = imageUrl;
  });
}

/**
 * ✅ Agrega parámetro de caché a una URL (maneja URLs con parámetros existentes)
 * @param {string} url - URL de la imagen
 * @param {string|number} version - Versión del caché (default: '2')
 * @returns {string} URL con parámetro de caché agregado
 */
function addCacheBuster(url, version = '2') {
  if (!url) return url;

  // ✅ Convertir URLs de GitHub blob a raw si es necesario
  // De: https://github.com/user/repo/blob/branch/path?raw=true
  // A: https://raw.githubusercontent.com/user/repo/branch/path
  if (url.includes('github.com') && url.includes('/blob/')) {
    try {
      // Remover parámetros de consulta primero
      const urlWithoutParams = url.split('?')[0];

      // Extraer la parte antes de /blob/
      const blobIndex = urlWithoutParams.indexOf('/blob/');
      if (blobIndex !== -1) {
        const beforeBlob = urlWithoutParams.substring(0, blobIndex);
        const afterBlob = urlWithoutParams.substring(blobIndex + 6); // +6 para saltar '/blob/'

        // Construir URL raw de GitHub
        const githubPath = beforeBlob.replace('https://github.com', '');
        url = `https://raw.githubusercontent.com${githubPath}/${afterBlob}`;
        console.log('[IMAGE] 🔄 URL de GitHub convertida:', url);
      }
    } catch (e) {
      console.error('[IMAGE] ❌ Error convirtiendo URL de GitHub:', e);
    }
  }

  // Si la URL ya tiene parámetros de consulta, usar '&', si no, usar '?'
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

/**
 * ✅ Genera sugerencias de código basadas en el título
 */
function generateCodeSuggestions(title) {
  if (!title) return [];

  const suggestions = [];

  // Sugerencia 1: Iniciales + año
  const words = title.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    const initials = words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
    suggestions.push(`${initials}${new Date().getFullYear()}`);
  }

  // Sugerencia 2: Primeras letras + número
  const firstLetters = words.slice(0, 4).map(w => w.substring(0, 2).toUpperCase()).join('');
  suggestions.push(`${firstLetters}${Math.floor(Math.random() * 1000)}`);

  // Sugerencia 3: Acrónimo corto
  if (words.length >= 2) {
    const acronym = words.map(w => w[0].toUpperCase()).join('').substring(0, 6);
    suggestions.push(`${acronym}-${new Date().getFullYear()}`);
  }

  return suggestions.filter((v, i, a) => a.indexOf(v) === i).slice(0, 3); // Únicos, máximo 3
}

/* ===================== SISTEMA DE VALIDACIÓN EN TIEMPO REAL ===================== */

/**
 * ✅ Valida título de curso
 * @param {string} title - Título a validar
 * @param {number} minLength - Longitud mínima (default: 5)
 * @param {number} maxLength - Longitud máxima (default: 100)
 * @returns {object} {valid: boolean, error: string}
 */
function validateTitle(title, minLength = 5, maxLength = 100) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'El título es requerido' };
  }

  const trimmed = title.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `El título debe tener al menos ${minLength} caracteres` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `El título no puede tener más de ${maxLength} caracteres` };
  }

  // Validar caracteres especiales peligrosos
  if (/<script|javascript:|onerror=/i.test(trimmed)) {
    return { valid: false, error: 'El título contiene caracteres no permitidos' };
  }

  return { valid: true };
}

/**
 * ✅ Valida descripción/meta
 * @param {string} meta - Descripción a validar
 * @param {number} minLength - Longitud mínima (default: 10)
 * @param {number} maxLength - Longitud máxima (default: 200)
 * @returns {object} {valid: boolean, error: string}
 */
function validateMeta(meta, minLength = 10, maxLength = 200) {
  if (!meta || typeof meta !== 'string') {
    return { valid: false, error: 'La descripción es requerida' };
  }

  const trimmed = meta.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `La descripción debe tener al menos ${minLength} caracteres` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `La descripción no puede tener más de ${maxLength} caracteres` };
  }

  return { valid: true };
}

/**
 * ✅ Valida código secreto
 * @param {string} code - Código a validar
 * @param {number} minLength - Longitud mínima (default: 5)
 * @param {number} maxLength - Longitud máxima (default: 50)
 * @returns {object} {valid: boolean, error: string}
 */
function validateCode(code, minLength = 5, maxLength = 50) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'El código es requerido' };
  }

  const trimmed = code.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `El código debe tener al menos ${minLength} caracteres` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `El código no puede tener más de ${maxLength} caracteres` };
  }

  // Validar formato: solo letras, números, guiones y guiones bajos
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'El código solo puede contener letras, números, guiones (-) y guiones bajos (_)' };
  }

  return { valid: true };
}

/**
 * ✅ Valida tag del curso
 * @param {string} tag - Tag a validar
 * @param {number} minLength - Longitud mínima (default: 2)
 * @param {number} maxLength - Longitud máxima (default: 10)
 * @returns {object} {valid: boolean, error: string}
 */
function validateTag(tag, minLength = 2, maxLength = 10) {
  if (!tag || typeof tag !== 'string') {
    return { valid: false, error: 'El tag es requerido' };
  }

  const trimmed = tag.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `El tag debe tener al menos ${minLength} caracteres` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `El tag no puede tener más de ${maxLength} caracteres` };
  }

  // Validar formato: solo letras y números
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'El tag solo puede contener letras y números' };
  }

  return { valid: true };
}

/**
 * ✅ Valida email
 * @param {string} email - Email a validar
 * @returns {object} {valid: boolean, error: string}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'El correo electrónico es requerido' };
  }

  const trimmed = email.trim().toLowerCase();

  // Expresión regular mejorada para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Formato de correo electrónico inválido' };
  }

  // Validar longitud máxima
  if (trimmed.length > 254) {
    return { valid: false, error: 'El correo electrónico es demasiado largo' };
  }

  return { valid: true };
}

/**
 * ✅ Valida contraseña
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (default: 6)
 * @returns {object} {valid: boolean, error: string}
 */
function validatePassword(password, minLength = 6) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `La contraseña debe tener al menos ${minLength} caracteres` };
  }

  return { valid: true };
}

/**
 * ✅ Valida código de verificación (6 dígitos)
 * @param {string} code - Código a validar
 * @returns {object} {valid: boolean, error: string}
 */
function validateVerificationCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'El código de verificación es requerido' };
  }

  const trimmed = code.trim();

  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, error: 'El código debe tener 6 dígitos numéricos' };
  }

  return { valid: true };
}

/**
 * ✅ Valida color hexadecimal
 * @param {string} color - Color a validar
 * @returns {object} {valid: boolean, error: string}
 */
function validateHexColor(color) {
  if (!color || typeof color !== 'string') {
    return { valid: false, error: 'El color es requerido' };
  }

  const trimmed = color.trim();

  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return { valid: false, error: 'El color debe ser un código hexadecimal válido (ej: #5aa9ff)' };
  }

  return { valid: true };
}

/**
 * ✅ Sistema de validación en tiempo real para inputs
 * @param {HTMLElement} input - Input a validar
 * @param {function} validator - Función validadora
 * @param {object} options - Opciones adicionales
 */
function setupRealTimeValidation(input, validator, options = {}) {
  if (!input || !validator) return;

  const {
    minLength = 0,
    maxLength = Infinity,
    debounceMs = 300,
    showIndicator = true,
    showMessage = true
  } = options;

  // Crear contenedor para mensaje de error si no existe
  let errorContainer = input.parentElement.querySelector('.validation-error');
  if (!errorContainer && showMessage) {
    errorContainer = document.createElement('div');
    errorContainer.className = 'validation-error';
    errorContainer.setAttribute('role', 'alert');
    errorContainer.setAttribute('aria-live', 'polite');
    input.parentElement.appendChild(errorContainer);
  }

  // Agregar indicador visual si no existe
  let indicator = input.parentElement.querySelector('.validation-indicator');
  if (!indicator && showIndicator) {
    indicator = document.createElement('span');
    indicator.className = 'validation-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(indicator);
  }

  // Función de validación con debounce
  let timeoutId;
  const validate = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const value = input.value;
      const result = validator(value, minLength, maxLength);

      // Actualizar estado visual
      if (indicator) {
        if (value.length === 0) {
          indicator.className = 'validation-indicator';
          input.classList.remove('input-valid', 'input-invalid');
        } else if (result.valid) {
          indicator.className = 'validation-indicator validation-indicator-valid';
          input.classList.add('input-valid');
          input.classList.remove('input-invalid');
          input.setAttribute('aria-invalid', 'false');
        } else {
          indicator.className = 'validation-indicator validation-indicator-invalid';
          input.classList.add('input-invalid');
          input.classList.remove('input-valid');
          input.setAttribute('aria-invalid', 'true');
        }
      }

      // Mostrar mensaje de error
      if (errorContainer) {
        if (!result.valid && value.length > 0) {
          errorContainer.textContent = result.error;
          errorContainer.style.display = 'block';
          input.setAttribute('aria-describedby', errorContainer.id || 'validation-error');
        } else {
          errorContainer.textContent = '';
          errorContainer.style.display = 'none';
          input.removeAttribute('aria-describedby');
        }
      }

      // Guardar estado en el input
      input.dataset.valid = result.valid ? 'true' : 'false';
    }, debounceMs);
  };

  // Event listeners
  input.addEventListener('input', validate);
  input.addEventListener('blur', validate);

  // Validación inicial si hay valor
  if (input.value) {
    validate();
  }
}

/**
 * ✅ Valida todo un formulario
 * @param {HTMLFormElement} form - Formulario a validar
 * @returns {boolean} true si el formulario es válido
 */
function validateForm(form) {
  if (!form) return false;

  const inputs = form.querySelectorAll('input[data-valid], select[data-valid]');
  let isValid = true;

  inputs.forEach(input => {
    if (input.dataset.valid === 'false') {
      isValid = false;
      // Enfocar el primer input inválido
      if (isValid === false) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

  return isValid;
}

/**
 * ✅ Valida límites de caracteres y muestra contador
 */
function setupCharacterCounter(input, maxLength, minLength = 0) {
  if (!input) return;

  // Crear contador si no existe
  let counter = input.parentElement.querySelector('.char-counter');
  if (!counter) {
    counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.style.cssText = `
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
      text-align: right;
      transition: color 0.2s;
    `;
    input.parentElement.appendChild(counter);
  }

  function updateCounter() {
    const length = input.value.length;
    const remaining = maxLength - length;

    counter.textContent = `${length}/${maxLength} caracteres`;

    if (length < minLength) {
      counter.style.color = '#ff5555';
      counter.textContent += ` (mínimo ${minLength})`;
    } else if (remaining < 10) {
      counter.style.color = remaining < 0 ? '#ff5555' : '#fbbf24';
    } else {
      counter.style.color = 'var(--muted)';
    }
  }

  input.addEventListener('input', updateCounter);
  input.addEventListener('blur', updateCounter);
  updateCounter();
}

/* ===================== util ===================== */
const $ = (s) => document.querySelector(s);
const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text).trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}
function setQueryParam(key, value) {
  const url = new URL(window.location.href);
  if (value == null) url.searchParams.delete(key); else url.searchParams.set(key, value);
  history.replaceState({}, '', url);
}
function downloadFile(url, label = '') {
  window.open(url, '_blank', 'noopener');

  // ✅ Google Analytics: Tracking de descarga
  if (typeof gtag !== 'undefined') {
    try {
      const hostname = new URL(url).hostname;
      gtag('event', 'file_download', {
        'event_category': 'download',
        'event_label': label || hostname,
        'value': 1
      });
    } catch (e) {
      gtag('event', 'file_download', {
        'event_category': 'download',
        'event_label': 'unknown'
      });
    }
  }
}

/* ============ base de cursos (hash -> data) ============ */
const MASTER_HASH = "7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8";

// ✅ CURSOS BASE ELIMINADOS - Todos los cursos ahora vienen de Firebase (customCourses)
const ACCESS_HASH_MAP = {};

/* ============ persistencia de cursos personalizados ============ */
const CUSTOM_COURSES_KEY = 'edusalud_custom_courses';
function loadCustomCourses() {
  try {
    // ✅ Verificar que localStorage está disponible (importante para modo incógnito)
    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
      warn('[STORAGE] localStorage no disponible (modo incógnito?)');
      return {};
    }
    const raw = localStorage.getItem(CUSTOM_COURSES_KEY);
    const obj = raw ? JSON.parse(raw) : null;
    return typeof obj === 'object' && obj !== null ? obj : {};
  } catch (e) {
    trackError(e, {
      operation: 'loadCustomCourses',
      source: 'localStorage'
    });
    return {};
  }
}
function saveCustomCourses(courses) {
  try {
    // ✅ Verificar que localStorage está disponible
    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
      warn('[STORAGE] localStorage no disponible, no se pueden guardar cursos');
      return;
    }
    localStorage.setItem(CUSTOM_COURSES_KEY, JSON.stringify(courses || {}));
  } catch (e) {
    trackError(e, {
      operation: 'saveCustomCourses',
      source: 'localStorage',
      coursesCount: Object.keys(courses || {}).length
    });
  }
}
function getMergedAccessHashMap() {
  // ✅ CURSOS BASE ELIMINADOS - Solo usar cursos de Firebase (customCourses)
  const base = ACCESS_HASH_MAP || {};

  let custom = {};
  try {
    custom = loadCustomCourses();
  } catch (e) {
    warn('[HASHMAP] Error cargando cursos custom:', e);
  }

  // ✅ Combinar base (vacío) con custom - Ahora solo custom tiene cursos
  const merged = Object.assign({}, base, custom);
  log('[HASHMAP] Cursos base:', Object.keys(base).length, 'Custom:', Object.keys(custom).length, 'Total:', Object.keys(merged).length);

  return merged;
}

// Cargar cursos remotos al inicio
async function loadRemoteCoursesOnInit() {
  // Cargar cursos remotos sin sessionStorage para que siempre cargue
  try {
    await refreshCustomCourses();
  } catch (e) {
    warn('[INIT] Error cargando cursos remotos al inicio (continuando):', e);
    // No bloquear la carga si falla
  }
}
async function addCustomCourse(hex, courseData) {
  const normalizedCourse = {
    title: courseData?.title || '',
    meta: courseData?.meta || '',
    files: Array.isArray(courseData?.files) ? courseData.files : [],
    code: courseData?.code || '', // ✅ Guardar código secreto
    type: courseData?.type || 'curso', // ✅ Guardar clasificación
    card: courseData?.card || {},
    createdAt: courseData?.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  const custom = loadCustomCourses();
  custom[hex] = normalizedCourse;
  saveCustomCourses(custom);

  // ✅ Limpiar localStorage de links para este curso (por si hay datos residuales)
  clearFilesOverride(hex);
  log('[ADD COURSE] 🧹 localStorage de links limpiado para curso nuevo');

  const db = getFirestoreDB();
  if (db) {
    try {
      // ✅ LIMPIAR DATOS RESIDUALES: Si existe un curso anterior con este hash, eliminar sus links primero
      try {
        const linksRef = db.ref(`courses/${hex}/links`);
        const linksSnapshot = await linksRef.once('value');
        if (linksSnapshot.exists()) {
          log('[ADD COURSE] 🧹 Eliminando links residuales de Firebase para este hash');
          await linksRef.remove();
        }
      } catch (cleanupError) {
        warn('[ADD COURSE] ⚠️ Error limpiando links residuales (continuando):', cleanupError);
      }

      const firebasePayload = {
        ...normalizedCourse,
        createdAt: normalizedCourse.createdAt || firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      await db.ref(`customCourses/${hex}`).set(firebasePayload);
      log('[ADD COURSE] ✅ Curso guardado en Firebase Realtime Database');
      if (typeof window.showToast === 'function') {
        window.showToast('success', 'Curso creado', `"${courseData.card?.tag || 'Curso'}" creado exitosamente`);
      }
    } catch (error) {
      trackError(error, {
        operation: 'addCourse',
        source: 'Firebase',
        courseHex: hex
      });
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Error', 'Error guardando curso en Firebase. El curso quedó solo localmente.');
      } else {
        alert('⚠️ Error guardando curso en Firebase. El curso quedó solo localmente.');
      }
    }
  } else {
    warn('[ADD COURSE] ⚠️ Firebase no disponible, usando solo almacenamiento local');
  }

  const saveResult = await remoteSaveCourse(hex, normalizedCourse).catch(e => {
    trackError(e, {
      operation: 'addCourse',
      source: 'Google Sheets',
      courseHex: hex
    });
    return false;
  });

  if (saveResult) {
    log('[ADD COURSE] ✅ Curso guardado en Google Sheets como respaldo');
  }

  // ✅ Historial de cambios: registrar creación de curso
  logChangeHistory('course_created', {
    hex: hex.substring(0, 8),
    title: normalizedCourse.title,
    code: normalizedCourse.code
  });

  // ✅ Log de auditoría
  await auditLog(AUDIT_ACTION_TYPES.COURSE_CREATED, {
    courseHex: hex.substring(0, 8),
    courseTitle: normalizedCourse.title,
    courseTag: normalizedCourse.card?.tag || '',
    courseType: normalizedCourse.type || 'curso',
    courseCode: normalizedCourse.code ? '***' : '' // No exponer código completo
  }, null, true); // Enviar a Firebase
}

// ✅ Hacer exportOverrides() global para acceso desde el menú
window.exportOverrides = exportOverrides;
async function updateCustomCourse(hex, courseData) {
  const custom = loadCustomCourses();
  const existingCourse = custom[hex];

  if (!existingCourse) {
    console.error('[UPDATE COURSE] ❌ Curso no encontrado:', hex);
    throw new Error('Curso no encontrado');
  }

  const normalizedCourse = {
    title: courseData?.title || existingCourse.title || '',
    meta: courseData?.meta || existingCourse.meta || '',
    files: Array.isArray(courseData?.files) ? courseData.files : (existingCourse.files || []),
    code: existingCourse.code || '', // ✅ Preservar código secreto (no se puede cambiar)
    type: courseData?.type || existingCourse.type || 'curso', // ✅ Actualizar clasificación
    card: courseData?.card || existingCourse.card || {},
    createdAt: existingCourse.createdAt || Date.now(), // Mantener fecha de creación original
    updatedAt: Date.now() // Actualizar fecha de modificación
  };

  custom[hex] = normalizedCourse;
  saveCustomCourses(custom);

  const db = getFirestoreDB();
  if (db) {
    try {
      const firebasePayload = {
        ...normalizedCourse,
        createdAt: existingCourse.createdAt || firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };

      // ✅ Usar retry automático para operaciones de Firebase
      await firebaseOperationWithRetry(
        () => db.ref(`customCourses/${hex}`).set(firebasePayload)
      );

      log('[UPDATE COURSE] ✅ Curso actualizado en Firebase Realtime Database');
      if (typeof window.showToast === 'function') {
        window.showToast('success', 'Curso actualizado', `"${courseData.card?.tag || 'Curso'}" actualizado exitosamente`);
      }
    } catch (error) {
      trackError(error, {
        operation: 'updateCourse',
        source: 'Firebase',
        courseHex: hex
      });
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Error', 'Error actualizando curso en Firebase. El curso quedó solo localmente.');
      } else {
        alert('⚠️ Error actualizando curso en Firebase. El curso quedó solo localmente.');
      }
    }
  } else {
    warn('[UPDATE COURSE] ⚠️ Firebase no disponible, usando solo almacenamiento local');
  }

  const saveResult = await remoteSaveCourse(hex, normalizedCourse).catch(e => {
    console.error('[UPDATE COURSE] ❌ Error actualizando curso en remoto (Sheets):', e);
    return false;
  });

  if (saveResult) {
    log('[UPDATE COURSE] ✅ Curso actualizado en Google Sheets como respaldo');
  }

  // ✅ Historial de cambios: registrar actualización de curso
  logChangeHistory('course_updated', {
    hex: hex.substring(0, 8),
    title: normalizedCourse.title,
    changes: Object.keys(courseData)
  });

  // ✅ Log de auditoría
  await auditLog(AUDIT_ACTION_TYPES.COURSE_EDITED, {
    courseHex: hex.substring(0, 8),
    courseTitle: normalizedCourse.title,
    courseTag: normalizedCourse.card?.tag || '',
    courseType: normalizedCourse.type || 'curso',
    changes: Object.keys(courseData).join(', ')
  }, null, true); // Enviar a Firebase
}

async function removeCustomCourse(hex) {
  const custom = loadCustomCourses();
  // ✅ Guardar información del curso antes de eliminarlo (para historial)
  const deletedCourse = custom[hex] || {};

  // ✅ Log de auditoría ANTES de eliminar
  await auditLog(AUDIT_ACTION_TYPES.COURSE_DELETED, {
    courseHex: hex.substring(0, 8),
    courseTitle: deletedCourse.title || '',
    courseTag: deletedCourse.card?.tag || '',
    courseType: deletedCourse.type || 'curso'
  }, null, true); // Enviar a Firebase

  delete custom[hex];
  saveCustomCourses(custom);

  const db = getFirestoreDB();
  if (db) {
    try {
      // ✅ Eliminar el curso de customCourses
      await db.ref(`customCourses/${hex}`).remove();
      log('[DELETE COURSE] ✅ Curso eliminado de Firebase');

      // ✅ Eliminar también todos los links asociados al curso
      await db.ref(`courses/${hex}/links`).remove();
      log('[DELETE COURSE] ✅ Links del curso eliminados de Firebase');

      // ✅ Limpiar también localStorage de los links
      clearFilesOverride(hex);
      log('[DELETE COURSE] ✅ Links eliminados de localStorage');

      // ✅ Notificación de eliminación
      if (typeof window.showToast === 'function') {
        window.showToast('info', 'Curso eliminado', `"${deletedCourse.title || 'Curso'}" ha sido eliminado`);
      }
    } catch (error) {
      console.error('[DELETE COURSE] ❌ Error eliminando curso en Firebase:', error);
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Error', 'Error al eliminar curso en Firebase');
      }
    }
  } else {
    // Si no hay Firebase, limpiar localStorage de todas formas
    clearFilesOverride(hex);
  }

  // ✅ Eliminar curso de Google Sheets
  await remoteDeleteCourse(hex).catch(e => {
    warn('[DELETE COURSE] ⚠️ Error eliminando curso en Google Sheets:', e);
  });

  // ✅ Eliminar también los links de la hoja de overrides en Google Sheets
  await remoteDeleteFiles(hex).catch(e => {
    warn('[DELETE COURSE] ⚠️ Error eliminando links de Google Sheets:', e);
  });

  // ✅ Historial de cambios: registrar eliminación de curso
  logChangeHistory('course_deleted', {
    hex: hex.substring(0, 8),
    title: deletedCourse.title || 'Desconocido',
    code: deletedCourse.code || ''
  });
}
function isCustomCourse(hex) {
  const custom = loadCustomCourses();
  return hex in custom;
}

/* ============ persistencia de enlaces por curso ============ */
const FILES_STORAGE_PREFIX = 'edusalud_files_';
const CACHE_VERSION_KEY = 'edusalud_cache_version';
const CURRENT_CACHE_VERSION = '1.2'; // Incrementar para forzar limpieza

function storageKeyFor(hex) { return FILES_STORAGE_PREFIX + hex; }

// ✅ Verificar versión de caché (YA NO limpia automáticamente)
function checkAndCleanOldCache() {
  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== CURRENT_CACHE_VERSION) {
      log('[CACHE] ℹ️ Nueva versión detectada:', CURRENT_CACHE_VERSION);
      // SOLO actualizar versión, NO limpiar datos
      // Los datos se sincronizarán con remoto automáticamente
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
      log('[CACHE] ✅ Versión actualizada, datos se sincronizarán automáticamente');
      return true;
    }
    return false;
  } catch (e) {
    warn('[CACHE] Error verificando versión:', e);
    return false;
  }
}

function loadFilesOverride(hex) {
  try {
    const raw = localStorage.getItem(storageKeyFor(hex));
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : null;
  } catch (e) { return null; }
}
function saveFilesOverride(hex, files) {
  try {
    const key = storageKeyFor(hex);
    const value = JSON.stringify(files || []);
    localStorage.setItem(key, value);
    log('[STORAGE] 💾 Guardados', files.length, 'archivos para hex:', hex.substring(0, 8));
  } catch (e) {
    console.error('[STORAGE] ❌ Error guardando archivos:', e);
  }
}
function clearFilesOverride(hex) {
  try { localStorage.removeItem(storageKeyFor(hex)); } catch (e) { }
}
// ✅ Limpiar TODOS los overrides de archivos
function clearAllFilesOverrides() {
  try {
    const keys = Object.keys(localStorage);
    let count = 0;
    keys.forEach(key => {
      if (key.startsWith(FILES_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
        count++;
      }
    });
    log('[CACHE] 🧹 Limpiados', count, 'archivos de localStorage');
    return count;
  } catch (e) {
    warn('[CACHE] Error limpiando archivos:', e);
    return 0;
  }
}
function getBaseFilesForHex(hex) {
  // ✅ Links base eliminados - Firebase es la única fuente de verdad
  // Esta función siempre devuelve array vacío porque los links base ya no existen
  return [];
}
function getFilesForHex(hex) {
  const override = loadFilesOverride(hex);
  if (override) {
    // log('[FILES] Usando override para', hex.substring(0,8), ':', override.length, 'archivos');
    return override;
  }
  const base = getBaseFilesForHex(hex);
  // log('[FILES] Usando base para', hex.substring(0,8), ':', base.length, 'archivos');
  return base;
}

/* ===================== FIREBASE FIRESTORE - FUNCIONES EN TIEMPO REAL ===================== */

// ✅ Almacenar listeners activos por curso (para Master)
const activeListeners = new Map();
let customCoursesListener = null;
let customCoursesRef = null;

function initFirebaseCustomCoursesRealtime() {
  const db = getFirestoreDB();

  if (!db) {
    log('[FIREBASE COURSES] Firebase no configurado, no se inicia listener de cursos');
    return;
  }

  if (customCoursesListener) {
    return; // Listener ya activo
  }

  try {
    customCoursesRef = db.ref('customCourses');
    customCoursesListener = customCoursesRef.on('value', (snapshot) => {
      const rawCourses = snapshot.exists() ? snapshot.val() : {};
      log('[FIREBASE COURSES] 📥 Snapshot recibido - Cursos totales:', Object.keys(rawCourses).length);

      // ✅ Preservar códigos locales si Firebase no los tiene
      const localCourses = loadCustomCourses();
      const mergedCourses = {};

      // ✅ CRÍTICO: Firebase es la fuente de verdad para existencia de cursos
      // Solo procesar cursos que están en Firebase (si Firebase dice que no existe, no existe)
      Object.keys(rawCourses || {}).forEach(hex => {
        const firebaseCourse = rawCourses[hex];
        const localCourse = localCourses[hex];

        // Priorizar código de Firebase si existe, sino usar el local
        const codeToUse = firebaseCourse?.code || localCourse?.code || '';

        mergedCourses[hex] = {
          ...firebaseCourse,
          code: codeToUse // Asegurar que siempre tenga el código (de Firebase o local)
        };

        if (codeToUse && !firebaseCourse?.code) {
          log('[FIREBASE COURSES] 🔑 Usando código local para:', hex.substring(0, 8), 'Código:', codeToUse);
        } else if (codeToUse) {
          log('[FIREBASE COURSES] 🔑 Usando código de Firebase para:', hex.substring(0, 8), 'Código:', codeToUse);
        }
      });

      // ✅ NO preservar cursos locales que no están en Firebase
      // Si Firebase no tiene el curso, significa que fue eliminado y debe desaparecer
      // (Esto asegura sincronización en tiempo real entre dispositivos)

      // ✅ CRÍTICO: Siempre actualizar localStorage con SOLO los cursos de Firebase
      // Si un curso fue eliminado en Firebase, también debe eliminarse del localStorage
      const previousCount = Object.keys(localCourses).length;
      const currentCount = Object.keys(mergedCourses).length;

      if (previousCount !== currentCount) {
        log('[FIREBASE COURSES] 🔄 Cambio detectado: cursos locales:', previousCount, '→ Firebase:', currentCount);
        if (currentCount < previousCount) {
          log('[FIREBASE COURSES] 🗑️ Curso(s) eliminado(s) - se actualizará localStorage');
        }
      }

      try {
        saveCustomCourses(mergedCourses);
        log('[FIREBASE COURSES] ✅ localStorage actualizado con', currentCount, 'cursos (Firebase es la fuente de verdad)');
      } catch (e) {
        warn('[FIREBASE COURSES] ⚠️ No se pudieron guardar cursos en localStorage:', e);
      }

      if (userInteracting) {
        log('[FIREBASE COURSES] ⏸️ Usuario interactuando, actualizará después');
        // ✅ Aún así actualizar localStorage para mantener sincronización
        return;
      }

      const masterEl = document.getElementById('master');
      const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;
      const isContentView = document.getElementById('content') && !document.getElementById('content').classList.contains('hidden');

      if (isMasterView) {
        log('[FIREBASE COURSES] ♻️ Re-renderizando grid Master (cursos eliminados se quitarán automáticamente)');
        buildMasterGrid();
        // ✅ Actualizar estadísticas después de re-renderizar (buildMasterGrid ya lo hace, pero por si acaso)
        setTimeout(() => updateMasterStats(mergedCourses).catch(e => warn('[STATS] Error actualizando estadísticas:', e)), 100);
      }

      if (isContentView && currentKeyHex && rawCourses[currentKeyHex]) {
        log('[FIREBASE COURSES] ♻️ Re-renderizando curso personalizado en vista individual');
        renderCourse(currentKeyHex);
      }
    });

    log('[FIREBASE COURSES] ✅ Listener de cursos personalizados activo');
  } catch (error) {
    console.error('[FIREBASE COURSES] ❌ Error iniciando listener de cursos:', error);
  }
}

function teardownFirebaseCustomCoursesRealtime() {
  if (customCoursesRef && customCoursesListener) {
    try {
      customCoursesRef.off('value', customCoursesListener);
      log('[FIREBASE COURSES] 🔕 Listener de cursos desactivado');
    } catch (error) {
      warn('[FIREBASE COURSES] ⚠️ Error al desactivar listener de cursos:', error);
    }
  }
  customCoursesListener = null;
  customCoursesRef = null;
}

/**
 * ✅ FUNCIÓN: Inicializar listeners para TODOS los cursos en Master
 */
function initFirestoreRealtimeMaster(courseHexes) {
  const db = getFirestoreDB();

  if (!db) {
    log('[FIRESTORE] Firebase no configurado para Master');
    return;
  }

  log('[FIRESTORE] 🔥 Iniciando listeners para', courseHexes.length, 'cursos en Master');

  // Limpiar listeners antiguos que ya no están en la lista
  activeListeners.forEach((unsubscribe, hex) => {
    if (!courseHexes.includes(hex)) {
      log('[FIRESTORE] Desuscribiendo listener obsoleto:', hex.substring(0, 10));
      unsubscribe();
      activeListeners.delete(hex);
    }
  });

  // Crear listeners para cursos nuevos
  courseHexes.forEach(courseHex => {
    if (activeListeners.has(courseHex)) {
      return; // Ya tiene listener
    }

    try {
      const linksRef = db.ref(`courses/${courseHex}/links`);

      const unsubscribe = linksRef.on('value', (snapshot) => {
        const firebaseLinks = [];

        if (snapshot.exists()) {
          const data = snapshot.val();
          Object.keys(data).forEach((key) => {
            firebaseLinks.push({
              id: key,
              ...data[key]
            });
          });

          firebaseLinks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          log('[FIREBASE] 📥 Cambio detectado en', courseHex.substring(0, 10), ':', firebaseLinks.length, 'links');
        }

        mergeFirestoreLinks(courseHex, firebaseLinks);
      });

      activeListeners.set(courseHex, () => linksRef.off('value', unsubscribe));
      log('[FIRESTORE] ✅ Listener activo para:', courseHex.substring(0, 10));

    } catch (error) {
      console.error('[FIRESTORE] ❌ Error iniciando listener para', courseHex.substring(0, 10), ':', error);
    }
  });
}

/**
 * ✅ FUNCIÓN: Inicializar listeners de Firestore en tiempo real
 * Se ejecuta cuando se renderiza un curso para escuchar cambios en tiempo real
 */
function initFirestoreRealtime(courseHex) {
  const db = getFirestoreDB();

  // Verificar que Firebase esté disponible
  if (!db) {
    log('[FIRESTORE] Firebase no configurado, continuando sin tiempo real');
    return;
  }

  // ✅ Evitar múltiples listeners para el mismo curso
  if (firestoreUnsubscribe && window.currentFirestoreCourseHex === courseHex) {
    log('[FIRESTORE] ⚠️ Listener ya activo para este curso, omitiendo');
    return;
  }

  // Desuscribir listeners anteriores si existen
  if (firestoreUnsubscribe) {
    log('[FIRESTORE] Desuscribiendo listener anterior');
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }

  if (!courseHex || courseHex === MASTER_HASH) {
    log('[FIRESTORE] No iniciar listener en vista master');
    return;
  }

  // ✅ Guardar el curso actual para evitar duplicados
  window.currentFirestoreCourseHex = courseHex;

  log('[FIRESTORE] 🔥 Iniciando listener en tiempo real para curso:', courseHex.substring(0, 10) + '...');

  try {
    // Referencia a la ruta de links de este curso (Realtime Database)
    const linksRef = db.ref(`courses/${courseHex}/links`);

    // ✅ SUSCRIBIRSE a cambios en tiempo real
    firestoreUnsubscribe = linksRef.on('value', (snapshot) => {
      // ✅ Evitar re-renderizado si el usuario está interactuando
      if (userInteracting) {
        log('[FIRESTORE] ⏸️ Usuario interactuando, omitiendo actualización');
        return;
      }

      // ✅ Evitar re-renderizado si no estamos en la vista de contenido de este curso
      const isContentView = document.getElementById('content') &&
        !document.getElementById('content').classList.contains('hidden');
      if (!isContentView || window.currentCourseHex !== courseHex) {
        log('[FIRESTORE] ⏸️ No estamos en la vista de este curso, omitiendo actualización');
        return;
      }

      log('[FIREBASE] 📥 Evento disparado - Snapshot existe:', snapshot.exists());

      const firebaseLinks = [];

      if (snapshot.exists()) {
        const data = snapshot.val();
        const linkCount = Object.keys(data).length;
        log('[FIREBASE] 📥 Links en Firebase:', linkCount);

        // Convertir objeto a array
        Object.keys(data).forEach((key) => {
          firebaseLinks.push({
            id: key,
            ...data[key]
          });
        });

        // Ordenar por createdAt descendente
        firebaseLinks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        log('[FIREBASE] 📥 Cambios detectados - Total de links:', linkCount);
        log('[FIREBASE] 📝 Links:', firebaseLinks.map(l => l.label).join(', '));
      } else {
        log('[FIREBASE] ℹ️ Sin datos en Firebase (primera carga o curso vacío)');
      }

      // ✅ Combinar links de Firebase con los de localStorage
      mergeFirestoreLinks(courseHex, firebaseLinks);

    }, (error) => {
      console.error('[FIREBASE] ❌ Error en listener:', error);
      console.error('[FIREBASE] ❌ Código de error:', error.code);
      console.error('[FIREBASE] ❌ Mensaje:', error.message);
    });

    // Función para desuscribirse (actualizada para Realtime Database)
    const originalUnsubscribe = firestoreUnsubscribe;
    firestoreUnsubscribe = () => {
      if (originalUnsubscribe) {
        linksRef.off('value', originalUnsubscribe);
      }
    };

  } catch (error) {
    console.error('[FIREBASE] ❌ Error iniciando listener:', error);
  }
}

/**
 * ✅ FUNCIÓN: Combinar links de Firestore con localStorage y actualizar vista
 */
function mergeFirestoreLinks(courseHex, firestoreLinks) {
  log('[FIRESTORE] 🔥 Firebase es la ÚNICA FUENTE DE VERDAD - Total:', firestoreLinks.length, 'links');

  // ✅ FIREBASE ES LA ÚNICA FUENTE: Solo usar links de Firebase, ignorar ACCESS_HASH_MAP
  const firebaseFormatted = firestoreLinks.map(link => ({
    label: link.label || '',
    url: link.url || '',
    firebaseId: link.id,
    createdAt: link.createdAt
  }));

  // ✅ PREVENIR DUPLICADOS dentro de Firebase (por si hay duplicados en la BD)
  const seen = new Set();
  const uniqueFirebaseLinks = firebaseFormatted.filter(link => {
    const key = link.firebaseId || `${link.url}|||${link.label}`;
    if (seen.has(key)) {
      log('[MERGE] ⚠️ Duplicado en Firebase detectado y filtrado:', link.label);
      return false;
    }
    seen.add(key);
    return true;
  });

  // ✅ SOLO LINKS DE FIREBASE - No incluir links base de ACCESS_HASH_MAP
  const merged = uniqueFirebaseLinks;

  saveFilesOverride(courseHex, merged);

  // ✅ NO re-renderizar si el usuario está interactuando
  if (userInteracting) {
    log('[FIRESTORE] ⏸️ Usuario interactuando, posponer re-render');
    return;
  }

  // ✅ RE-RENDERIZAR vista actual solo si es necesario
  const isContentView = document.getElementById('content') &&
    !document.getElementById('content').classList.contains('hidden');
  const masterEl = document.getElementById('master');
  const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;

  if (isContentView && window.currentCourseHex === courseHex) {
    // ✅ Evitar re-renderizado si ya se está renderizando
    if (window.isRenderingCourse === courseHex) {
      log('[FIRESTORE] ⏸️ Ya se está renderizando este curso, omitiendo');
      return;
    }

    window.isRenderingCourse = courseHex;
    log('[FIRESTORE] ♻️ Re-renderizando curso (vista individual)');
    renderCourse(courseHex);

    // ✅ Limpiar flag después de un breve delay
    setTimeout(() => {
      if (window.isRenderingCourse === courseHex) {
        window.isRenderingCourse = null;
      }
    }, 1000);
  } else if (isMasterView) {
    log('[FIRESTORE] ♻️ Re-renderizando Master grid con nuevos datos');
    buildMasterGrid();
  }
}

/**
 * ✅ FUNCIÓN GLOBAL: Agregar link a Firebase Firestore
 * Se puede llamar desde cualquier parte del código
 */
window.agregarLinkFirebase = async function (courseHex, label, url) {
  const db = getFirestoreDB();

  if (!db) {
    throw new Error('Firebase no está configurado');
  }

  try {
    // Validaciones
    if (!label || !url) {
      throw new Error('Etiqueta y URL son requeridos');
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      throw new Error('URL inválida. Debe empezar con http:// o https://');
    }

    log('[FIRESTORE] ➕ Agregando link a Firebase:', label);
    log('[FIRESTORE] 📍 Curso:', courseHex.substring(0, 10) + '...');

    // Referencia a la ruta del curso (Realtime Database)
    const linksRef = db.ref(`courses/${courseHex}/links`);

    log('[FIRESTORE] 📤 Enviando datos a Realtime Database...');

    // Generar nuevo ID y agregar link con retry
    const newLinkRef = linksRef.push();
    await firebaseOperationWithRetry(
      () => newLinkRef.set({
        label: label.trim(),
        url: url.trim(),
        createdAt: firebase.database.ServerValue.TIMESTAMP
      })
    );

    log('[FIRESTORE] ✅ Link agregado con ID:', newLinkRef.key);
    log('[FIRESTORE] ⏳ El cambio se detectará automáticamente en todos los dispositivos...');

    // Mostrar modal de éxito
    if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal(
        '¡Link Agregado!',
        'El enlace se ha sincronizado y aparecerá en todos los dispositivos al instante.'
      );
    }

    return newLinkRef.key;

  } catch (error) {
    console.error('[FIRESTORE] ❌ Error agregando link:', error);
    if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal(
        'Error',
        error.message || 'No se pudo agregar el enlace'
      );
    }
    throw error;
  }
};

/**
 * ✅ FUNCIÓN GLOBAL: Eliminar link de Firebase Realtime Database
 */
window.eliminarLinkFirebase = async function (courseHex, firebaseId) {
  const db = getFirestoreDB();

  if (!db) {
    warn('[FIRESTORE] Firebase no configurado');
    return;
  }

  try {
    if (!firebaseId) {
      throw new Error('No se puede eliminar: link no tiene ID de Firebase');
    }

    log('[FIRESTORE] 🗑️ Eliminando link de Firebase:', firebaseId);

    // Referencia al link específico (Realtime Database)
    const linkRef = db.ref(`courses/${courseHex}/links/${firebaseId}`);

    // ✅ Usar retry automático para operaciones de Firebase
    await firebaseOperationWithRetry(
      () => linkRef.remove()
    );

    log('[FIRESTORE] ✅ Link eliminado de Firebase');

  } catch (error) {
    console.error('[FIRESTORE] ❌ Error eliminando link:', error);
    throw error;
  }
};

log('[FIRESTORE] ✅ Funciones Firebase registradas globalmente');

/* ============ sincronización remota (opcional) ============ */
const REMOTE_BASE_URL = 'https://script.google.com/macros/s/AKfycbztpMUW7wlF_Ikum-sIwGHEVCKblcsGiQhmBaeB-_vJ-uhtSuH9ipd0PjRiBagq8jmM/exec';
function hasRemote() { return typeof REMOTE_BASE_URL === 'string' && REMOTE_BASE_URL.startsWith('http'); }
function stableStringify(obj) { try { return JSON.stringify(obj || []); } catch { return '[]'; } }
async function remoteGetFiles(hex) {
  if (!hasRemote()) return null;
  log('[GET] Iniciando para hex:', hex.substring(0, 8));

  // Intentar primero con fetch (puede funcionar si el servidor tiene CORS habilitado)
  try {
    const url = REMOTE_BASE_URL + '?hex=' + encodeURIComponent(hex);
    log('[GET] Intentando fetch directo...');
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors', // Intentar con no-cors primero
      cache: 'no-store'
    });

    // Con no-cors no podemos leer la respuesta, así que seguimos con JSONP
    log('[GET] Fetch no-cors enviado, pero no podemos leer respuesta. Intentando JSONP...');
  } catch (e) {
    log('[GET] Fetch falló, intentando JSONP...');
  }

  // Usar JSONP como método principal
  try {
    const jsonpResult = await remoteGetFilesJSONP(hex);
    if (jsonpResult && Array.isArray(jsonpResult)) {
      log('[GET] ✅ JSONP éxito - hex:', hex.substring(0, 8), 'files:', jsonpResult.length);
      return jsonpResult;
    } else {
      warn('[GET] ⚠️ JSONP retornó null o no es array');
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

// Función de diagnóstico para ver qué devuelve el WebApp
async function testWebAppResponse(hex) {
  log('[DIAG] Probando respuesta del WebApp...');
  // 🛡️ Cache-buster
  const testUrl = REMOTE_BASE_URL
    + '?hex=' + encodeURIComponent(hex)
    + '&callback=test_callback'
    + '&ts=' + Date.now();

  // Intentar cargar como imagen para ver si hay redirección
  const img = new Image();
  img.onerror = () => {
    log('[DIAG] La URL no se puede cargar como imagen (esperado para script)');
  };
  img.src = testUrl;

  // También mostrar la URL completa para copiar y probar manualmente
  log('[DIAG] URL completa para probar manualmente:', testUrl);
  log('[DIAG] Abre esta URL en tu navegador para ver qué devuelve:', testUrl);
}

function remoteGetFilesJSONP(hex) {
  return new Promise((resolve) => {
    const callbackName = '_gas_jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const script = document.createElement('script');
    // 🛡️ Cache-buster para evitar respuestas viejas del navegador/CDN
    const url = REMOTE_BASE_URL
      + '?hex=' + encodeURIComponent(hex)
      + '&callback=' + callbackName
      + '&ts=' + Date.now();
    script.src = url;
    script.async = true;

    log('[JSONP] Intentando GET para hex:', hex.substring(0, 8));
    log('[JSONP] URL:', url);
    log('[JSONP] Callback name:', callbackName);

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
        warn('[JSONP] Callback llamado pero ya resuelto');
        return;
      }
      resolved = true;
      clearTimeout(timeout);
      log('[JSONP] ✅ Callback recibido!', data);

      let files = null;
      if (data && Array.isArray(data.files)) {
        files = data.files;
        log('[JSONP] ✅ Archivos encontrados:', files.length);
      } else {
        warn('[JSONP] ⚠️ Respuesta inválida - no hay files array:', data);
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
      log('[JSONP] Script cargado, esperando callback...');
      // Si después de 2 segundos no se llamó el callback, algo está mal
      setTimeout(() => {
        if (!resolved) {
          warn('[JSONP] ⚠️ Script cargó pero callback no se ejecutó después de 2s');
        }
      }, 2000);
    };

    // Timeout de 10 segundos (Google Apps Script puede ser lento en primera carga)
    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      warn('[JSONP] ⚠️ Timeout después de 10s para hex:', hex.substring(0, 8));
      cleanup();
      resolve(null);
    }, 10000);

    try {
      document.body.appendChild(script);
      log('[JSONP] Script agregado al DOM');
    } catch (e) {
      console.error('[JSONP] Error agregando script:', e);
      cleanup();
      resolve(null);
    }
  });
}
async function remoteSaveFiles(hex, files) {
  if (!hasRemote()) {
    warn('[SAVE] ⚠️ No hay remoto configurado');
    return false;
  }
  try {
    const filesJson = JSON.stringify(Array.isArray(files) ? files : []);
    log('[SAVE] Enviando a remoto - hex:', hex.substring(0, 8), 'archivos:', files.length);
    log('[SAVE] Datos a guardar:', filesJson.substring(0, 100) + '...');
    log('[SAVE] URL remoto:', REMOTE_BASE_URL);

    // ✅ Validar que tenemos los datos necesarios
    if (!hex || !filesJson) {
      console.error('[SAVE] ❌ Datos inválidos: hex o files vacíos');
      return false;
    }

    // Google Apps Script funciona mejor con formularios HTML que con fetch
    const iframe = document.createElement('iframe');
    iframe.name = 'hiddenFrame_' + Date.now();
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = REMOTE_BASE_URL;
    form.target = iframe.name;
    form.enctype = 'application/x-www-form-urlencoded';

    const hexInput = document.createElement('input');
    hexInput.type = 'hidden';
    hexInput.name = 'hex';
    hexInput.value = hex;

    const filesInput = document.createElement('input');
    filesInput.type = 'hidden';
    filesInput.name = 'files';
    filesInput.value = filesJson;

    form.appendChild(hexInput);
    form.appendChild(filesInput);
    document.body.appendChild(form);

    log('[SAVE] Formulario creado, enviando...');
    form.submit();
    log('[SAVE] ✅ Formulario enviado a:', REMOTE_BASE_URL);

    // Limpiar después de un breve delay
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (e) {
        warn('[SAVE] Error limpiando:', e);
      }
    }, 2000);

    // ✅ Devolver true inmediatamente ya que el formulario se envió
    // El envío es asíncrono pero la función necesita retornar
    return true;
  } catch (e) {
    console.error('Error en remoteSaveFiles:', e);
    return false;
  }
}
async function refreshFromRemote(hex, context) {
  try {
    // ✅ Usar retry automático para operaciones de red
    const remote = await networkOperationWithRetry(
      () => remoteGetFiles(hex),
      { maxRetries: 2, initialDelay: 1500 }
    );

    if (!remote || !Array.isArray(remote)) return false;
    const current = getFilesForHex(hex);
    if (stableStringify(remote) !== stableStringify(current)) {
      saveFilesOverride(hex, remote);
      if (context === 'course') {
        if (currentKeyHex === hex) {
          renderCourse(hex);
        }
      } else {
        // En master, reconstruir todo el grid (solo si está autenticado)
        const masterEl = document.getElementById('master');
        if (masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated) {
          buildMasterGrid();
        }
      }
      return true;
    }
    return false;
  } catch (e) {
    warn('Error en refreshFromRemote después de reintentos:', e);
    return false;
  }
}

// ===== Sincronización remota de cursos personalizados =====
async function remoteSaveCourse(hex, courseData) {
  if (!hasRemote()) {
    warn('[COURSE SAVE] ⚠️ No hay remoto configurado');
    return false;
  }
  try {
    const courseJson = JSON.stringify(courseData);
    log('[COURSE SAVE] Enviando curso a remoto - hex:', hex.substring(0, 8));
    log('[COURSE SAVE] Datos del curso:', courseJson.substring(0, 100) + '...');
    log('[COURSE SAVE] URL remoto:', REMOTE_BASE_URL);

    // ✅ Validar que tenemos los datos necesarios
    if (!hex || !courseJson || courseJson === '{}') {
      console.error('[COURSE SAVE] ❌ Datos inválidos: hex o courseData vacíos');
      return false;
    }

    const iframe = document.createElement('iframe');
    iframe.name = 'hiddenFrameCourse_' + Date.now();
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = REMOTE_BASE_URL;
    form.target = iframe.name;
    form.enctype = 'application/x-www-form-urlencoded'; // ✅ Agregar enctype

    const hexInput = document.createElement('input');
    hexInput.type = 'hidden';
    hexInput.name = 'hex';
    hexInput.value = hex;

    const courseInput = document.createElement('input');
    courseInput.type = 'hidden';
    courseInput.name = 'course';
    courseInput.value = courseJson;

    form.appendChild(hexInput);
    form.appendChild(courseInput);
    document.body.appendChild(form);

    log('[COURSE SAVE] Formulario creado, enviando...');
    log('[COURSE SAVE] Hex:', hex);
    log('[COURSE SAVE] Course JSON length:', courseJson.length);

    // ✅ Enviar formulario
    form.submit();
    log('[COURSE SAVE] ✅ Formulario enviado a:', REMOTE_BASE_URL);

    // ✅ Esperar más tiempo para asegurar que el servidor procesó el envío
    // No limpiar inmediatamente para no interrumpir el envío
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos

    // Limpiar formulario después de enviar (iframe se mantiene un poco más)
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        log('[COURSE SAVE] Formulario limpiado');
      } catch (e) {
        warn('[COURSE SAVE] Error limpiando formulario:', e);
      }
    }, 500);

    // Limpiar iframe después de más tiempo
    setTimeout(() => {
      try {
        if (iframe.parentNode) document.body.removeChild(iframe);
        log('[COURSE SAVE] Iframe limpiado');
      } catch (e) {
        warn('[COURSE SAVE] Error limpiando iframe:', e);
      }
    }, 3000); // 3 segundos total

    return true;
  } catch (e) {
    console.error('[COURSE SAVE] ❌ Error en remoteSaveCourse:', e);
    return false;
  }
}

async function remoteDeleteCourse(hex) {
  if (!hasRemote()) return false;
  try {
    log('[COURSE DELETE] Eliminando curso remoto - hex:', hex.substring(0, 8));

    const iframe = document.createElement('iframe');
    iframe.name = 'hiddenFrameCourseDel';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = REMOTE_BASE_URL;
    form.target = 'hiddenFrameCourseDel';

    const hexInput = document.createElement('input');
    hexInput.type = 'hidden';
    hexInput.name = 'hex';
    hexInput.value = hex;

    const deleteInput = document.createElement('input');
    deleteInput.type = 'hidden';
    deleteInput.name = 'action';
    deleteInput.value = 'delete_course';

    form.appendChild(hexInput);
    form.appendChild(deleteInput);
    document.body.appendChild(form);

    form.submit();
    log('[COURSE DELETE] ✅ Formulario de eliminación enviado a:', REMOTE_BASE_URL);

    // ✅ Limpiar formulario después de enviar
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (e) {
        warn('[COURSE DELETE] Error limpiando formulario:', e);
      }

      // ✅ Forzar refresh inmediato para que otros dispositivos vean el cambio
      log('[COURSE DELETE] Iniciando refresh para sincronizar eliminación...');
      const refreshAttempts = [500, 1000, 2000, 4000];
      refreshAttempts.forEach((delay, index) => {
        setTimeout(async () => {
          log(`[COURSE DELETE] Refrescando después de eliminar (intento ${index + 1}/${refreshAttempts.length} - ${delay}ms)...`);
          try {
            await refreshCustomCourses();
            log('[COURSE DELETE] ✅ Refresh completado');
          } catch (e) {
            warn('[COURSE DELETE] Error en refresh:', e);
          }
        }, delay);
      });
    }, 2000);

    return true;
  } catch (e) {
    console.error('Error en remoteDeleteCourse:', e);
    return false;
  }
}

async function remoteDeleteFiles(hex) {
  if (!hasRemote()) return false;
  try {
    log('[FILES DELETE] Eliminando links de la hoja de overrides - hex:', hex.substring(0, 8));

    const iframe = document.createElement('iframe');
    iframe.name = 'hiddenFrameFilesDel_' + Date.now();
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = REMOTE_BASE_URL;
    form.target = iframe.name;

    const hexInput = document.createElement('input');
    hexInput.type = 'hidden';
    hexInput.name = 'hex';
    hexInput.value = hex;

    const deleteInput = document.createElement('input');
    deleteInput.type = 'hidden';
    deleteInput.name = 'action';
    deleteInput.value = 'delete_files';

    form.appendChild(hexInput);
    form.appendChild(deleteInput);
    document.body.appendChild(form);

    form.submit();
    log('[FILES DELETE] ✅ Formulario de eliminación de links enviado a:', REMOTE_BASE_URL);

    // ✅ Limpiar formulario después de enviar
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (e) {
        warn('[FILES DELETE] Error limpiando formulario:', e);
      }
    }, 2000);

    return true;
  } catch (e) {
    console.error('Error en remoteDeleteFiles:', e);
    return false;
  }
}

async function remoteGetCourses() {
  if (!hasRemote()) return {};
  try {
    log('[COURSE GET] Obteniendo cursos remotos...');

    return new Promise((resolve) => {
      const callbackName = '_gas_jsonp_courses_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const script = document.createElement('script');
      // 🛡️ Cache-buster para evitar respuestas viejas
      script.src = REMOTE_BASE_URL
        + '?action=get_courses'
        + '&callback=' + callbackName
        + '&ts=' + Date.now();
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

      // ✅ CRÍTICO: Registrar callback ANTES de agregar script al DOM
      window[callbackName] = function (data) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);

        let courses = {};
        if (data && typeof data.courses === 'object') {
          courses = data.courses;
          log('[COURSE GET] ✅ Cursos remotos obtenidos:', Object.keys(courses).length);
        } else {
          warn('[COURSE GET] ⚠️ Datos recibidos no tienen formato esperado:', data);
        }

        cleanup();
        resolve(courses);
      };

      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        warn('[COURSE GET] ⚠️ Timeout después de 10s');
        cleanup();
        resolve({});
      }, 10000);

      script.onerror = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        console.error('[COURSE GET] ❌ Error cargando cursos remotos');
        cleanup();
        resolve({});
      };

      // ✅ Agregar script DESPUÉS de registrar callback
      log('[COURSE GET] Callback registrado:', callbackName);
      log('[COURSE GET] URL completa:', script.src);
      document.body.appendChild(script);
    });
  } catch (e) {
    console.error('Error en remoteGetCourses:', e);
    return {};
  }
}

async function refreshCustomCourses() {
  // ✅ Iniciar medición de sincronización
  const syncStart = startPerformanceMeasure('Sincronización');

  if (getFirestoreDB()) {
    log('[REFRESH] Firebase maneja cursos personalizados en tiempo real, sin usar JSONP');
    endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Firebase' });
    return false;
  }
  if (!hasRemote()) {
    log('[REFRESH] Sin remoto, saltando...');
    endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Sin remoto' });
    return false;
  }
  try {
    log('[REFRESH] Obteniendo cursos personalizados remotos...');

    // ✅ Timeout de 10 segundos (Google Apps Script puede ser lento en primera carga)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        warn('[REFRESH] ⚠️ Timeout obteniendo cursos remotos después de 10s (continuando con cursos base)');
        resolve({});
      }, 10000); // 10 segundos para dar tiempo a Google Apps Script
    });

    const remoteCoursesPromise = remoteGetCourses();
    const remoteCourses = await Promise.race([remoteCoursesPromise, timeoutPromise]);

    log('[REFRESH] Cursos remotos obtenidos:', Object.keys(remoteCourses || {}).length);

    // ✅ Remoto es la fuente de verdad - sobrescribir completamente
    let localCourses = {};
    try {
      localCourses = loadCustomCourses();
    } catch (e) {
      warn('[REFRESH] Error cargando cursos locales (modo incógnito?):', e);
      localCourses = {};
    }

    const remoteKeys = Object.keys(remoteCourses || {});

    log('[REFRESH] Comparación - Remoto:', remoteKeys.length, 'Local:', Object.keys(localCourses).length);

    // Detectar cambios antes de guardar
    const hadChanges = JSON.stringify(localCourses) !== JSON.stringify(remoteCourses || {});

    // Guardar solo los cursos remotos (remoto es la fuente de verdad)
    // ✅ Manejar error de localStorage silenciosamente
    try {
      saveCustomCourses(remoteCourses || {});
      log('[REFRESH] ✅ Cursos sincronizados');
    } catch (e) {
      warn('[REFRESH] ⚠️ No se pudieron guardar cursos (modo incógnito?), continuando...', e);
    }

    // ✅ IMPORTANTE: Refrescar archivos SOLO del curso actual si es personalizado
    // No refrescar todos los cursos personalizados para evitar lentitud
    // El refresh periódico se encargará de refrescar todos cada 3 segundos
    if (currentKeyHex && remoteCourses && remoteCourses[currentKeyHex]) {
      log('[REFRESH] Curso actual es personalizado, refrescando sus archivos...');
      refreshFromRemoteSilent(currentKeyHex).then(updated => {
        if (updated) {
          log('[REFRESH] ✅ Archivos del curso actual actualizados');
          // Solo actualizar vista si estamos viendo ese curso
          if (document.getElementById('content') && !document.getElementById('content').classList.contains('hidden')) {
            renderCourse(currentKeyHex);
          }
        }
      }).catch(e => {
        warn('[REFRESH] Error refrescando archivos del curso actual:', e);
      });
    }

    // Si estamos en vista master, reconstruir SOLO si hubo cambios
    const masterEl = document.getElementById('master');
    if (hadChanges && masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated) {
      log('[REFRESH] ✅ Cambios detectados, reconstruyendo Vista Maestra...');
      buildMasterGrid();
    }

    // ✅ Finalizar medición de sincronización
    const coursesCount = Object.keys(remoteCourses || {}).length;
    endPerformanceMeasure('Sincronización', syncStart, {
      metodo: 'Google Sheets',
      cursos: coursesCount,
      cambios: hadChanges ? 'Sí' : 'No'
    });

    return hadChanges;
  } catch (e) {
    trackError(e, {
      operation: 'refreshCustomCourses',
      view: getCurrentView()
    });
    // ✅ Finalizar medición con error
    endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Error' });
    // ✅ No fallar completamente, siempre devolver false para continuar
    return false;
  }
}

// ===== Exportar / Importar overrides (todas los cursos) =====
// ✅ Exportar backup completo (cursos + overrides)
// ✅ Función auxiliar para calcular checksum simple
function calculateChecksum(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// ✅ Validar estructura de datos de backup
function validateBackupStructure(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('El archivo no contiene un objeto JSON válido');
    return { valid: false, errors };
  }

  // Validar versión
  if (data.version && typeof data.version !== 'number') {
    errors.push('La versión debe ser un número');
  }

  // Validar cursos
  if (data.courses) {
    if (typeof data.courses !== 'object' || Array.isArray(data.courses)) {
      errors.push('El campo "courses" debe ser un objeto');
    } else {
      Object.entries(data.courses).forEach(([hex, courseData]) => {
        if (!hex || typeof hex !== 'string' || hex.length !== 64) {
          errors.push(`Hex inválido en curso: ${hex?.substring(0, 8) || 'desconocido'}`);
        }
        if (!courseData || typeof courseData !== 'object') {
          errors.push(`Datos de curso inválidos para hex: ${hex?.substring(0, 8) || 'desconocido'}`);
        } else {
          // Validar campos requeridos del curso
          if (!courseData.title || typeof courseData.title !== 'string') {
            errors.push(`Título faltante o inválido en curso: ${hex.substring(0, 8)}`);
          }
        }
      });
    }
  }

  // Validar overrides
  if (data.overrides) {
    if (typeof data.overrides !== 'object' || Array.isArray(data.overrides)) {
      errors.push('El campo "overrides" debe ser un objeto');
    } else {
      Object.entries(data.overrides).forEach(([hex, arr]) => {
        if (!Array.isArray(arr)) {
          errors.push(`Override inválido para hex: ${hex?.substring(0, 8) || 'desconocido'} (debe ser un array)`);
        }
      });
    }
  }

  // Validar emails (si existen)
  if (data.emails) {
    if (typeof data.emails !== 'object' || Array.isArray(data.emails)) {
      errors.push('El campo "emails" debe ser un objeto');
    }
  }

  // Validar admins (si existen)
  if (data.admins) {
    if (!Array.isArray(data.admins)) {
      errors.push('El campo "admins" debe ser un array');
    } else {
      data.admins.forEach((admin, index) => {
        if (!admin || typeof admin !== 'object') {
          errors.push(`Admin inválido en índice ${index}`);
        } else if (!admin.email || typeof admin.email !== 'string' || !admin.email.includes('@')) {
          errors.push(`Email inválido en admin índice ${index}`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ✅ Generar preview de datos a importar
function generateImportPreview(data) {
  const preview = {
    version: data.version || 'No especificada',
    exportedAt: data.exportedAt || 'No especificada',
    courses: data.courses ? Object.keys(data.courses).length : 0,
    overrides: data.overrides ? Object.keys(data.overrides).length : 0,
    emails: data.emails ? Object.keys(data.emails).length : 0,
    admins: data.admins ? data.admins.length : 0,
    checksum: data.checksum || 'No disponible'
  };

  return preview;
}

async function exportOverrides() {
  // ✅ PREVENIR MÚLTIPLES EJECUCIONES: Verificar si ya se está exportando
  if (window._isExporting) {
    warn('[EXPORT] Ya hay una exportación en curso, ignorando...');
    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'Exportación en curso', 'Por favor espera a que termine la exportación actual.');
    }
    return;
  }

  // ✅ Marcar como exportando
  window._isExporting = true;

  try {
    const payload = {
      version: 3, // ✅ Versión 3: Incluye emails y admins
      exportedAt: new Date().toISOString(),
      overrides: {},
      courses: {},
      emails: {},
      admins: []
    };

    // Exportar overrides (links personalizados)
    Object.keys(ACCESS_HASH_MAP).forEach(hex => {
      const arr = loadFilesOverride(hex);
      if (Array.isArray(arr)) payload.overrides[hex] = arr;
    });

    // ✅ Exportar cursos personalizados completos
    const customCourses = loadCustomCourses();
    Object.keys(customCourses).forEach(hex => {
      payload.courses[hex] = customCourses[hex];
    });

    // ✅ Exportar emails de cursos desde Firebase
    try {
      const db = getFirebaseDB();
      if (db) {
        const courseEmailsRef = db.ref(COURSE_EMAILS_PATH);
        const snapshot = await courseEmailsRef.once('value');
        if (snapshot.exists()) {
          snapshot.forEach((courseSnapshot) => {
            const courseHex = courseSnapshot.key;
            const emails = {};
            courseSnapshot.forEach((emailSnapshot) => {
              const emailData = emailSnapshot.val();
              if (emailData && emailData.active !== false) {
                emails[emailSnapshot.key] = emailData;
              }
            });
            if (Object.keys(emails).length > 0) {
              payload.emails[courseHex] = emails;
            }
          });
        }
        log('[EXPORT] ✅ Emails exportados desde Firebase');
      }
    } catch (e) {
      warn('[EXPORT] ⚠️ No se pudieron exportar emails:', e.message);
    }

    // ✅ Exportar administradores desde Firebase
    try {
      const admins = await getAdmins();
      if (admins && admins.length > 0) {
        payload.admins = admins.map(admin => ({
          email: admin.email,
          role: admin.role,
          addedBy: admin.addedBy,
          addedAt: admin.addedAt
        }));
        log('[EXPORT] ✅ Administradores exportados desde Firebase');
      }
    } catch (e) {
      warn('[EXPORT] ⚠️ No se pudieron exportar administradores:', e.message);
    }

    // ✅ Calcular checksum para validación de integridad
    const checksum = calculateChecksum(payload);
    payload.checksum = checksum;

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edusalud_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // ✅ Registrar en historial
    logBackupHistory('export', 'all', Object.keys(payload.courses).length);

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.BACKUP_EXPORTED, {
      courses: Object.keys(payload.courses).length,
      overrides: Object.keys(payload.overrides).length,
      emails: Object.keys(payload.emails).length,
      admins: payload.admins.length,
      checksum: checksum.substring(0, 16)
    }, null, true);

    const summary = [
      `${Object.keys(payload.courses).length} cursos`,
      `${Object.keys(payload.overrides).length} sets de links`,
      `${Object.keys(payload.emails).length} cursos con emails`,
      `${payload.admins.length} administradores`
    ].filter(s => !s.startsWith('0')).join(', ');

    if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal(
        'Backup Exportado',
        `Se exportaron:\n${summary}\n\nChecksum: ${checksum.substring(0, 8)}...`
      );
    } else if (typeof window.showToast === 'function') {
      window.showToast('success', 'Backup Exportado',
        `Se exportaron ${Object.keys(payload.courses).length} cursos.`);
    }
  } finally {
    // ✅ Desbloquear después de un pequeño delay
    setTimeout(() => {
      window._isExporting = false;
    }, 1000);
  }
}
// ✅ Mostrar modal de preview antes de importar
function showImportPreviewModal(data, file) {
  const preview = generateImportPreview(data);
  const validation = validateBackupStructure(data);

  // Crear contenido del modal
  const modalContent = `
    <div style="max-width: 600px; padding: 24px;">
      <h2 style="margin-bottom: 16px;">Vista Previa de Importación</h2>
      
      ${!validation.valid ? `
        <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="color: #dc2626; margin-bottom: 8px;">⚠️ Errores de Validación</h3>
          <ul style="margin: 0; padding-left: 20px; color: #dc2626;">
            ${validation.errors.map(err => `<li>${err}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="margin-bottom: 12px;"><i class="ph ph-chart-bar"></i> Resumen del Backup</h3>
        <div style="display: grid; gap: 8px;">
          <div><strong>Versión:</strong> ${preview.version}</div>
          <div><strong>Fecha de exportación:</strong> ${preview.exportedAt ? new Date(preview.exportedAt).toLocaleString('es-ES') : 'No disponible'}</div>
          <div><strong>Cursos:</strong> ${preview.courses}</div>
          <div><strong>Sets de links:</strong> ${preview.overrides}</div>
          ${preview.emails > 0 ? `<div><strong>Emails de cursos:</strong> ${preview.emails}</div>` : ''}
          ${preview.admins > 0 ? `<div><strong>Administradores:</strong> ${preview.admins}</div>` : ''}
          ${preview.checksum !== 'No disponible' ? `<div><strong>Checksum:</strong> <code style="font-size: 12px;">${preview.checksum.substring(0, 16)}...</code></div>` : ''}
        </div>
      </div>
      
      ${validation.valid ? `
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: #22c55e;">✅ El archivo es válido y está listo para importar.</p>
        </div>
      ` : `
        <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0; color: #dc2626;">❌ El archivo contiene errores. Se recomienda no importar.</p>
        </div>
      `}
      
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
        <button id="btn-preview-cancel" class="btn secondary" type="button">Cancelar</button>
        <button id="btn-preview-import" class="btn" type="button" ${!validation.valid ? 'disabled' : ''}>
          ${validation.valid ? '✅ Importar' : '❌ No se puede importar'}
        </button>
      </div>
    </div>
  `;

  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modal-import-preview';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      ${modalContent}
    </div>
  `;

  document.body.appendChild(modal);

  // Event listeners
  $('#btn-preview-cancel')?.addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  $('#btn-preview-import')?.addEventListener('click', async () => {
    if (!validation.valid) return;
    document.body.removeChild(modal);
    await performImport(data);
  });

  // Cerrar con Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape' && modal.parentNode) {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// ✅ Realizar la importación después del preview
async function performImport(data) {
  try {
    // ✅ Validar checksum si está disponible
    if (data.checksum) {
      const currentChecksum = calculateChecksum({ ...data, checksum: null });
      if (currentChecksum !== data.checksum) {
        const proceed = confirm('⚠️ El checksum no coincide. El archivo podría estar corrupto.\n\n¿Desea continuar de todas formas?');
        if (!proceed) {
          if (typeof window.showToast === 'function') {
            window.showToast('warning', 'Importación cancelada', 'El checksum no coincide.');
          }
          return;
        }
      }
    }

    let coursesCount = 0;
    let overridesCount = 0;
    let emailsCount = 0;
    let adminsCount = 0;
    const errors = [];

    // ✅ Importar cursos personalizados
    if (data.courses && typeof data.courses === 'object') {
      const custom = loadCustomCourses();
      Object.entries(data.courses).forEach(([hex, courseData]) => {
        try {
          if (courseData && typeof courseData === 'object' && hex && hex.length === 64) {
            custom[hex] = courseData;
            coursesCount++;
          }
        } catch (e) {
          errors.push(`Error importando curso ${hex?.substring(0, 8) || 'desconocido'}: ${e.message}`);
        }
      });
      saveCustomCourses(custom);
      log('[IMPORT] ✅ Cursos importados:', coursesCount);
    }

    // ✅ Importar overrides (links personalizados)
    if (data.overrides && typeof data.overrides === 'object') {
      Object.entries(data.overrides).forEach(([hex, arr]) => {
        try {
          if (Array.isArray(arr) && hex && hex.length === 64) {
            saveFilesOverride(hex, arr);
            overridesCount++;
          }
        } catch (e) {
          errors.push(`Error importando overrides ${hex?.substring(0, 8) || 'desconocido'}: ${e.message}`);
        }
      });
      log('[IMPORT] ✅ Overrides importados:', overridesCount);
    }

    // ✅ Importar emails de cursos a Firebase
    if (data.emails && typeof data.emails === 'object') {
      try {
        const db = getFirebaseDB();
        if (db) {
          for (const [courseHex, emails] of Object.entries(data.emails)) {
            if (courseHex && courseHex.length === 64 && emails && typeof emails === 'object') {
              for (const [emailKey, emailData] of Object.entries(emails)) {
                try {
                  if (emailData && emailData.email && emailData.email.includes('@')) {
                    await addEmailToCourse(emailData.email, courseHex);
                    emailsCount++;
                  }
                } catch (e) {
                  errors.push(`Error importando email ${emailData.email} al curso ${courseHex.substring(0, 8)}: ${e.message}`);
                }
              }
            }
          }
          log('[IMPORT] ✅ Emails importados:', emailsCount);
        } else {
          warn('[IMPORT] ⚠️ Firebase no disponible, emails no se importaron');
        }
      } catch (e) {
        errors.push(`Error importando emails: ${e.message}`);
      }
    }

    // ✅ Importar administradores a Firebase
    if (data.admins && Array.isArray(data.admins)) {
      try {
        const db = getFirebaseDB();
        if (db) {
          for (const admin of data.admins) {
            try {
              if (admin && admin.email && admin.email.includes('@')) {
                // Verificar si ya existe
                const isAdmin = await checkIsAdmin(admin.email);
                if (!isAdmin) {
                  await addAdmin(admin.email);
                  adminsCount++;
                }
              }
            } catch (e) {
              errors.push(`Error importando admin ${admin.email}: ${e.message}`);
            }
          }
          log('[IMPORT] ✅ Administradores importados:', adminsCount);
        } else {
          warn('[IMPORT] ⚠️ Firebase no disponible, administradores no se importaron');
        }
      } catch (e) {
        errors.push(`Error importando administradores: ${e.message}`);
      }
    }

    // Reconstruir grid
    buildMasterGrid();

    // Mostrar resultado
    const summary = [
      `${coursesCount} cursos`,
      `${overridesCount} sets de links`,
      emailsCount > 0 ? `${emailsCount} emails` : '',
      adminsCount > 0 ? `${adminsCount} administradores` : ''
    ].filter(s => s).join(', ');

    const message = errors.length > 0
      ? `Importado con advertencias:\n${summary}\n\nErrores: ${errors.length}`
      : `Importado correctamente:\n${summary}`;

    if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal('Backup Importado', message);
    } else {
      alert(message);
    }

    if (errors.length > 0) {
      console.warn('[IMPORT] Errores durante la importación:', errors);
    }

    // Sincronizar con Firebase si está disponible
    if (getFirestoreDB()) {
      log('[IMPORT] 🔄 Sincronizando cursos importados con Firebase...');
    }

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.BACKUP_IMPORTED, {
      courses: coursesCount,
      overrides: overridesCount,
      emails: emailsCount,
      admins: adminsCount,
      errors: errors.length
    }, null, true);

  } catch (e) {
    trackError(e, {
      operation: 'performImport',
      fileType: 'json'
    });
    const errorMsg = 'No se pudo importar el archivo: ' + (e.message || 'Error desconocido');
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error de Importación', errorMsg);
    } else {
      alert(errorMsg);
    }
  }
}

// ✅ Importar backup completo (cursos + overrides) con preview
async function importOverridesFromFile(file) {
  try {
    // Validar tipo de archivo
    if (!file || !file.name.endsWith('.json')) {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Archivo inválido', 'Por favor seleccione un archivo JSON.');
      } else {
        alert('Por favor seleccione un archivo JSON.');
      }
      return;
    }

    const text = await file.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'JSON inválido', 'El archivo no contiene JSON válido.');
      } else {
        alert('El archivo no contiene JSON válido: ' + parseError.message);
      }
      return;
    }

    if (!data || typeof data !== 'object') {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Archivo inválido', 'El archivo seleccionado no es válido.');
      } else {
        alert('Archivo inválido');
      }
      return;
    }

    // ✅ Mostrar preview antes de importar
    showImportPreviewModal(data, file);

  } catch (e) {
    trackError(e, {
      operation: 'importOverridesFromFile',
      fileType: file?.type || 'unknown'
    });
    const errorMsg = 'No se pudo leer el archivo: ' + (e.message || 'Error desconocido');
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', errorMsg);
    } else {
      alert(errorMsg);
    }
  }
}
function ensureMasterTools() {
  // ✅ Ya no crear botones visibles, solo configurar el menú de ajustes
  setupSettingsMenu();
}

/* ===================== MÉTRICAS DE RENDIMIENTO ===================== */

/**
 * ✅ Sistema de métricas de rendimiento
 * Registra tiempos de operaciones importantes para debugging y optimización
 */

// Almacenar tiempos de inicio
const performanceMetrics = {
  pageLoadStart: performance.now(),
  initStart: null,
  syncStart: null,
  gridRenderStart: null
};

/**
 * ✅ Iniciar medición de una operación
 * @param {string} operation - Nombre de la operación
 * @returns {number} Timestamp de inicio
 */
function startPerformanceMeasure(operation) {
  const start = performance.now();
  performanceMetrics[operation] = start;
  return start;
}

/**
 * ✅ Finalizar medición y registrar en consola
 * @param {string} operation - Nombre de la operación
 * @param {number} startTime - Timestamp de inicio (opcional, si no se proporciona usa el almacenado)
 * @param {object} extraData - Datos adicionales a mostrar (opcional)
 */
function endPerformanceMeasure(operation, startTime = null, extraData = {}) {
  const start = startTime || performanceMetrics[operation];
  if (!start) {
    warn(`[PERFORMANCE] ⚠️ No se encontró tiempo de inicio para: ${operation}`);
    return;
  }

  const duration = performance.now() - start;
  const icon = duration < 100 ? '⚡' : duration < 500 ? '✅' : duration < 1000 ? '⏱️' : '🐌';

  let message = `[PERFORMANCE] ${icon} ${operation}: ${duration.toFixed(0)}ms`;

  // Agregar datos adicionales si existen
  if (Object.keys(extraData).length > 0) {
    const extra = Object.entries(extraData)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    message += ` (${extra})`;
  }

  log(message);

  // Limpiar el tiempo almacenado
  delete performanceMetrics[operation];

  return duration;
}

/**
 * ✅ Registrar métrica simple
 * @param {string} label - Etiqueta de la métrica
 * @param {*} value - Valor a registrar
 */
function logPerformanceMetric(label, value) {
  log(`[PERFORMANCE] 📊 ${label}: ${value}`);
}

// ✅ Exponer funciones globalmente para debugging
window.startPerformanceMeasure = startPerformanceMeasure;
window.endPerformanceMeasure = endPerformanceMeasure;
window.logPerformanceMetric = logPerformanceMetric;

/* ===================== TRACKING DE ERRORES MEJORADO ===================== */

/**
 * ✅ Sistema centralizado de tracking de errores
 * Captura, registra y envía errores a Google Analytics con contexto completo
 */

// Almacenar errores localmente para estadísticas
const errorLog = [];
const errorStats = {};

// Configuración
const ERROR_LOG_MAX_SIZE = 100; // Máximo de errores a guardar en memoria

/**
 * ✅ Función centralizada para trackear errores
 * @param {Error|string} error - El error a trackear (puede ser Error object o string)
 * @param {object} context - Contexto adicional del error (opcional)
 * @param {boolean} fatal - Si el error es fatal (default: false)
 */
function trackError(error, context = {}, fatal = false) {
  try {
    // Normalizar el error
    const errorObj = error instanceof Error
      ? error
      : new Error(String(error));

    const errorType = errorObj.name || 'UnknownError';
    const errorMessage = errorObj.message || String(error);
    const errorStack = errorObj.stack || '';

    // Agregar contexto adicional
    const fullContext = {
      ...context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      view: getCurrentView(),
      userId: currentKeyHex || 'anonymous'
    };

    // 1. Registrar en consola con formato mejorado
    console.error('[ERROR TRACKER]', {
      type: errorType,
      message: errorMessage,
      context: fullContext,
      stack: errorStack,
      fatal: fatal
    });

    // 2. Agregar a estadísticas
    if (!errorStats[errorType]) {
      errorStats[errorType] = 0;
    }
    errorStats[errorType]++;

    // 3. Agregar a log local (limitado a ERROR_LOG_MAX_SIZE)
    errorLog.push({
      type: errorType,
      message: errorMessage,
      context: fullContext,
      stack: errorStack,
      fatal: fatal,
      timestamp: Date.now()
    });

    // Limitar tamaño del log
    if (errorLog.length > ERROR_LOG_MAX_SIZE) {
      errorLog.shift(); // Eliminar el más antiguo
    }

    // 4. Enviar a Google Analytics
    if (typeof gtag !== 'undefined') {
      try {
        gtag('event', 'exception', {
          description: errorMessage,
          fatal: fatal,
          error_type: errorType,
          error_context: JSON.stringify(fullContext).substring(0, 500) // Limitar tamaño
        });
      } catch (analyticsError) {
        warn('[ERROR TRACKER] No se pudo enviar a Analytics:', analyticsError);
      }
    }

    // 5. Log adicional para debugging
    log(`[ERROR TRACKER] 📊 Total de errores ${errorType}: ${errorStats[errorType]}`);

  } catch (trackingError) {
    // Fallback si el tracking mismo falla
    console.error('[ERROR TRACKER] Error crítico en tracking:', trackingError);
    console.error('[ERROR TRACKER] Error original:', error);
  }
}

/**
 * ✅ Obtener la vista actual
 * @returns {string} Nombre de la vista actual
 */
function getCurrentView() {
  if (document.getElementById('access') && !document.getElementById('access').classList.contains('hidden')) {
    return 'access';
  }
  if (document.getElementById('content') && !document.getElementById('content').classList.contains('hidden')) {
    return 'content';
  }
  if (document.getElementById('master') && !document.getElementById('master').classList.contains('hidden')) {
    return 'master';
  }
  return 'unknown';
}

/**
 * ✅ Obtener estadísticas de errores
 * @returns {object} Estadísticas de errores
 */
function getErrorStats() {
  const stats = {
    total: errorLog.length,
    byType: { ...errorStats },
    recent: errorLog.slice(-10), // Últimos 10 errores
    fatal: errorLog.filter(e => e.fatal).length
  };

  log('[ERROR STATS] 📊 Estadísticas de errores:', stats);
  return stats;
}

/**
 * ✅ Limpiar log de errores
 */
function clearErrorLog() {
  errorLog.length = 0;
  Object.keys(errorStats).forEach(key => delete errorStats[key]);
  log('[ERROR TRACKER] ✅ Log de errores limpiado');
}

// ✅ Captura global de errores no manejados
window.addEventListener('error', (event) => {
  trackError(event.error || new Error(event.message), {
    source: 'unhandled_error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  }, true); // Errores no manejados son considerados fatales
});

// ✅ Captura de promesas rechazadas no manejadas
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));

  trackError(error, {
    source: 'unhandled_promise_rejection',
    reason: String(event.reason)
  }, false);
});

// ✅ Exponer funciones globalmente para debugging
window.trackError = trackError;
window.getErrorStats = getErrorStats;
window.clearErrorLog = clearErrorLog;

log('[ERROR TRACKER] ✅ Sistema de tracking de errores inicializado');

/* ===================== INDICADORES DE CARGA EN BOTONES ===================== */

/**
 * ✅ Helper para mostrar indicador de carga en un botón
 * @param {HTMLElement} button - El botón a modificar
 * @param {string} loadingText - Texto a mostrar durante la carga (ej: "Guardando...")
 * @param {string} successText - Texto a mostrar al completar (ej: "Guardado")
 * @param {string} errorText - Texto a mostrar si hay error (ej: "Error")
 * @returns {Function} Función para restaurar el botón a su estado original
 */
function setButtonLoading(button, loadingText = 'Procesando...', successText = null, errorText = 'Error') {
  if (!button) return () => { };

  // Guardar estado original
  const originalHTML = button.innerHTML;
  const originalDisabled = button.disabled;
  const originalText = button.textContent || button.innerText;

  // Aplicar estado de carga
  button.disabled = true;
  button.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 8px;">
    <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>
    ${loadingText}
  </span>`;

  // Función para restaurar
  return (success = true, customText = null) => {
    button.disabled = originalDisabled;

    if (success && successText) {
      // ✅ Sanitizar texto dinámico
      const safeText = sanitizeHTML(customText || successText);
      button.innerHTML = `<i class="ph ph-check-circle" style="font-size: 14px; vertical-align: middle;"></i> ${safeText}`;
      setTimeout(() => {
        button.innerHTML = originalHTML;
      }, 2000);
    } else if (!success) {
      // ✅ Sanitizar texto dinámico
      const safeText = sanitizeHTML(customText || errorText);
      button.innerHTML = `<i class="ph ph-x-circle" style="font-size: 14px; vertical-align: middle;"></i> ${safeText}`;
      setTimeout(() => {
        button.innerHTML = originalHTML;
      }, 3000);
    } else {
      button.innerHTML = originalHTML;
    }
  };
}

/**
 * ✅ Helper para crear un spinner CSS inline
 */
function createSpinnerHTML() {
  return `<span style="display: inline-block; width: 14px; height: 14px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></span>`;
}

// ✅ Exponer función globalmente
window.setButtonLoading = setButtonLoading;

/* ===================== GESTIÓN DE TEMA (CLARO/OSCURO) ===================== */

/**
 * ✅ Obtiene el tema actual guardado en localStorage
 * @returns {string} 'light' o 'dark' (por defecto 'dark')
 */
function getTheme() {
  try {
    const saved = localStorage.getItem('edusalud-theme');
    return saved === 'light' ? 'light' : 'dark';
  } catch (e) {
    warn('[THEME] Error obteniendo tema:', e);
    return 'dark';
  }
}

/**
 * ✅ Guarda la preferencia de tema en localStorage
 * @param {string} theme - 'light' o 'dark'
 */
function saveTheme(theme) {
  try {
    localStorage.setItem('edusalud-theme', theme);
    log('[THEME] ✅ Tema guardado:', theme);
  } catch (e) {
    warn('[THEME] Error guardando tema:', e);
  }
}

/**
 * ✅ Aplica el tema al documento
 * @param {string} theme - 'light' o 'dark'
 */
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
  log('[THEME] ✅ Tema aplicado:', theme);
}

/**
 * ✅ Cambia el tema (toggle entre claro y oscuro)
 * @returns {string} El nuevo tema aplicado
 */
function toggleTheme() {
  const current = getTheme();
  const newTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  saveTheme(newTheme);
  updateThemeToggleUI(newTheme);

  // Mostrar notificación toast
  if (typeof window.showToast === 'function') {
    window.showToast(
      'success',
      'Tema cambiado',
      `Modo ${newTheme === 'light' ? 'Claro' : 'Oscuro'} activado`
    );
  }

  return newTheme;
}

/**
 * ✅ Actualiza el texto e icono del toggle en el menú
 * @param {string} theme - 'light' o 'dark'
 */
function updateThemeToggleUI(theme, customIconId, customTextId) {
  // Si se pasan IDs personalizados, actualizar solo esos
  if (customIconId && customTextId) {
    const customIcon = document.getElementById(customIconId);
    const customText = document.getElementById(customTextId);
    
    if (customIcon && customText) {
      if (theme === 'light') {
        customIcon.className = 'ph ph-moon';
        customText.textContent = 'Cambiar a Modo Oscuro';
      } else {
        customIcon.className = 'ph ph-sun';
        customText.textContent = 'Cambiar a Modo Claro';
      }
    }
    return;
  }

  // ✅ Actualizar toggle de la vista maestra
  const icon = document.getElementById('theme-toggle-icon');
  const text = document.getElementById('theme-toggle-text');

  if (icon && text) {
    // ✅ El texto indica qué modo se activará al hacer clic (no el modo actual)
    if (theme === 'light') {
      // Si está en modo claro, el botón debe permitir cambiar a oscuro
      icon.className = 'ph ph-moon';
      text.textContent = 'Cambiar a Modo Oscuro';
    } else {
      // Si está en modo oscuro (default), el botón debe permitir cambiar a claro
      icon.className = 'ph ph-sun';
      text.textContent = 'Cambiar a Modo Claro';
    }
  }

  // ✅ Actualizar toggle de la vista de consultores
  const iconContent = document.getElementById('theme-toggle-icon-content');
  const textContent = document.getElementById('theme-toggle-text-content');

  if (iconContent && textContent) {
    if (theme === 'light') {
      iconContent.className = 'ph ph-moon';
      textContent.textContent = 'Cambiar a Modo Oscuro';
    } else {
      iconContent.className = 'ph ph-sun';
      textContent.textContent = 'Cambiar a Modo Claro';
    }
  }

  // ✅ Actualizar toggle de la vista de certificados
  const iconCert = document.getElementById('theme-toggle-icon-cert');
  const textCert = document.getElementById('theme-toggle-text-cert');

  if (iconCert && textCert) {
    if (theme === 'light') {
      iconCert.className = 'ph ph-moon';
      textCert.textContent = 'Cambiar a Modo Oscuro';
    } else {
      iconCert.className = 'ph ph-sun';
      textCert.textContent = 'Cambiar a Modo Claro';
    }
  }

  // ✅ Actualizar toggle del header (disponible en todas las vistas)
  const iconHeader = document.getElementById('theme-toggle-icon-header');
  const btnHeader = document.getElementById('btn-theme-toggle-header');

  if (iconHeader) {
    if (theme === 'light') {
      iconHeader.className = 'ph ph-moon';
      if (btnHeader) btnHeader.title = 'Cambiar a Modo Oscuro';
    } else {
      iconHeader.className = 'ph ph-sun';
      if (btnHeader) btnHeader.title = 'Cambiar a Modo Claro';
    }
  }
}

/**
 * ✅ Inicializa el tema al cargar la página
 */
function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
  updateThemeToggleUI(theme);
  setupHeaderThemeToggle();
  log('[THEME] ✅ Tema inicializado:', theme);
}

/**
 * ✅ Configurar toggle de tema en header (disponible en todas las vistas)
 */
function setupHeaderThemeToggle() {
  const btnThemeHeader = document.getElementById('btn-theme-toggle-header');
  if (btnThemeHeader) {
    btnThemeHeader.addEventListener('click', () => {
      toggleTheme();
    });
    log('[THEME] ✅ Toggle del header configurado');
  }
}

// ✅ Exponer funciones globalmente para debugging
window.getTheme = getTheme;
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;

// ✅ Nueva función para configurar el menú de ajustes
function setupSettingsMenu() {
  const btnSettings = document.getElementById('btn-settings');
  const dropdown = document.getElementById('settingsDropdown');

  if (!btnSettings || !dropdown) {
    warn('[SETTINGS] Botón de ajustes o dropdown no encontrado');
    return;
  }

  // ✅ PREVENIR MÚLTIPLES REGISTROS: Verificar si ya está configurado
  if (btnSettings.dataset.settingsConfigured === 'true') {
    log('[SETTINGS] Menú ya configurado, saltando...');
    return;
  }

  // ✅ Marcar como configurado
  btnSettings.dataset.settingsConfigured = 'true';

  // ✅ Obtener todas las categorías
  const categories = dropdown.querySelectorAll('.settings-category');

  // ✅ Función para colapsar todas las categorías
  function collapseAllCategories() {
    categories.forEach((category) => {
      const categoryName = category.dataset.category;
      const submenu = dropdown.querySelector(`[data-submenu="${categoryName}"]`);
      if (submenu) {
        category.setAttribute('aria-expanded', 'false');
        submenu.classList.remove('expanded');
        setTimeout(() => {
          if (!submenu.classList.contains('expanded')) {
            submenu.style.display = 'none';
          }
        }, 100);
      }
    });
  }

  // Toggle del menú al hacer click
  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display !== 'none';
    if (isVisible) {
      // Cerrar: colapsar todas las categorías
      collapseAllCategories();
    }
    dropdown.style.display = isVisible ? 'none' : 'block';
    // ✅ Actualizar aria-expanded para accesibilidad
    btnSettings.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!btnSettings.contains(e.target) && !dropdown.contains(e.target)) {
      collapseAllCategories();
      dropdown.style.display = 'none';
      // ✅ Actualizar aria-expanded cuando se cierra
      btnSettings.setAttribute('aria-expanded', 'false');
    }
  });

  // ✅ Función para expandir/colapsar categorías
  function toggleCategory(categoryElement) {
    const categoryName = categoryElement.dataset.category;
    const submenu = dropdown.querySelector(`[data-submenu="${categoryName}"]`);

    if (!submenu) return;

    const isExpanded = categoryElement.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      // Colapsar
      categoryElement.setAttribute('aria-expanded', 'false');
      submenu.classList.remove('expanded');
      // Esperar a que termine la animación antes de ocultar
      setTimeout(() => {
        if (!submenu.classList.contains('expanded')) {
          submenu.style.display = 'none';
        }
      }, 300);
    } else {
      // Expandir
      submenu.style.display = 'block';
      // Pequeño delay para que el navegador calcule el max-height
      setTimeout(() => {
        categoryElement.setAttribute('aria-expanded', 'true');
        submenu.classList.add('expanded');
      }, 10);
    }
  }

  // ✅ Configurar categorías (expandir/colapsar)
  categories.forEach((category) => {
    category.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCategory(category);
    });

    category.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCategory(category);
      }
    });
  });

  // ✅ Navegación por teclado en el menú (solo para items de acción, no categorías)
  const menuItems = dropdown.querySelectorAll('.settings-menu-item[role="menuitem"]');
  menuItems.forEach((item, index) => {
    // Click - cerrar menú solo si es una acción real
    item.addEventListener('click', (e) => {
      // No cerrar si el clic viene de un elemento dentro del item (como un span)
      if (e.target === item || item.contains(e.target)) {
        // Solo cerrar si tiene una acción definida
        if (item.dataset.action) {
          dropdown.style.display = 'none';
          btnSettings.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Navegación con teclado
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const allItems = Array.from(dropdown.querySelectorAll('.settings-menu-item[role="menuitem"], .settings-category'));
        const currentIndex = allItems.indexOf(item);
        const next = allItems[currentIndex + 1] || allItems[0];
        next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const allItems = Array.from(dropdown.querySelectorAll('.settings-menu-item[role="menuitem"], .settings-category'));
        const currentIndex = allItems.indexOf(item);
        const prev = allItems[currentIndex - 1] || allItems[allItems.length - 1];
        prev.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dropdown.style.display = 'none';
        btnSettings.setAttribute('aria-expanded', 'false');
        btnSettings.focus();
      }
    });
  });

  // ✅ Navegación desde el botón de ajustes
  btnSettings.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && dropdown.style.display !== 'none') {
      e.preventDefault();
      const firstCategory = categories[0] || menuItems[0];
      if (firstCategory) firstCategory.focus();
    }
  });

  // ✅ Exportar Backup Completo
  dropdown.querySelector('[data-action="export-all"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    exportOverrides();
  });

  // ✅ Exportar por Tipo (con modal de selección)
  dropdown.querySelector('[data-action="export-filtered"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    showExportFilterModal();
  });

  // ✅ Importar Backup (con vista previa)
  dropdown.querySelector('[data-action="import"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        showImportPreview(fileInput.files[0]);
      }
    });
    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => {
      if (fileInput.parentElement) {
        document.body.removeChild(fileInput);
      }
    }, 100);
  });

  // ✅ Historial de Backups
  dropdown.querySelector('[data-action="backup-history"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    showBackupHistory();
  });

  // ✅ Toggle de Tema (Claro/Oscuro)
  dropdown.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    // NO cerrar el menú aquí, solo cambiar el tema
    toggleTheme();
  });

  // ✅ Gestión General de Correos
  dropdown.querySelector('[data-action="manage-emails"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    showGeneralEmailsModal();
  });

  // ✅ Gestión de Administradores
  dropdown.querySelector('[data-action="manage-admins"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    showAdminsModal();
  });

  // ✅ Actualizar UI del toggle según el tema actual
  const currentTheme = getTheme();
  updateThemeToggleUI(currentTheme);

  log('[SETTINGS] ✅ Menú de ajustes configurado correctamente');
}

// ✅ Función para configurar el menú de ajustes en la vista de consultores
function setupSettingsMenuContent() {
  const btnSettings = document.getElementById('btn-settings-content');
  const dropdown = document.getElementById('settingsDropdownContent');

  if (!btnSettings || !dropdown) {
    warn('[SETTINGS CONTENT] Botón de ajustes o dropdown no encontrado');
    return;
  }

  // ✅ PREVENIR MÚLTIPLES REGISTROS: Verificar si ya está configurado
  if (btnSettings.dataset.settingsConfigured === 'true') {
    log('[SETTINGS CONTENT] Menú ya configurado, saltando...');
    return;
  }

  // ✅ Marcar como configurado
  btnSettings.dataset.settingsConfigured = 'true';

  // ✅ Obtener todas las categorías
  const categories = dropdown.querySelectorAll('.settings-category');

  // ✅ Función para colapsar todas las categorías
  function collapseAllCategories() {
    categories.forEach((category) => {
      const categoryName = category.dataset.category;
      const submenu = dropdown.querySelector(`[data-submenu="${categoryName}"]`);
      if (submenu) {
        category.setAttribute('aria-expanded', 'false');
        submenu.classList.remove('expanded');
        setTimeout(() => {
          if (!submenu.classList.contains('expanded')) {
            submenu.style.display = 'none';
          }
        }, 100);
      }
    });
  }

  // Toggle del menú al hacer click
  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display !== 'none';
    if (isVisible) {
      // Cerrar: colapsar todas las categorías
      collapseAllCategories();
    }
    dropdown.style.display = isVisible ? 'none' : 'block';
    // ✅ Actualizar aria-expanded para accesibilidad
    btnSettings.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!btnSettings.contains(e.target) && !dropdown.contains(e.target)) {
      collapseAllCategories();
      dropdown.style.display = 'none';
      // ✅ Actualizar aria-expanded cuando se cierra
      btnSettings.setAttribute('aria-expanded', 'false');
    }
  });

  // ✅ Función para expandir/colapsar categorías
  function toggleCategory(categoryElement) {
    const categoryName = categoryElement.dataset.category;
    const submenu = dropdown.querySelector(`[data-submenu="${categoryName}"]`);

    if (!submenu) return;

    const isExpanded = categoryElement.getAttribute('aria-expanded') === 'true';

    if (isExpanded) {
      // Colapsar
      categoryElement.setAttribute('aria-expanded', 'false');
      submenu.classList.remove('expanded');
      // Esperar a que termine la animación antes de ocultar
      setTimeout(() => {
        if (!submenu.classList.contains('expanded')) {
          submenu.style.display = 'none';
        }
      }, 300);
    } else {
      // Expandir
      submenu.style.display = 'block';
      // Pequeño delay para que el navegador calcule el max-height
      setTimeout(() => {
        categoryElement.setAttribute('aria-expanded', 'true');
        submenu.classList.add('expanded');
      }, 10);
    }
  }

  // ✅ Configurar categorías (expandir/colapsar)
  categories.forEach((category) => {
    category.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCategory(category);
    });

    category.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCategory(category);
      }
    });
  });

  // ✅ Toggle de Tema (Claro/Oscuro) - NO cerrar el menú, solo cambiar el tema
  dropdown.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTheme();
  });

  // ✅ Actualizar UI del toggle según el tema actual
  const currentTheme = getTheme();
  updateThemeToggleUI(currentTheme);

  log('[SETTINGS CONTENT] ✅ Menú de ajustes de consultores configurado correctamente');
}

// ✅ Función para configurar el menú de ajustes del Generador de Certificados
function setupSettingsMenuCertificates() {
  const btnSettings = document.getElementById('btn-settings-certificates');
  const dropdown = document.getElementById('settingsDropdownCertificates');

  if (!btnSettings || !dropdown) {
    warn('[SETTINGS CERT] Botón de ajustes de certificados o dropdown no encontrado');
    return;
  }

  // ✅ PREVENIR MÚLTIPLES REGISTROS
  if (btnSettings.dataset.settingsConfigured === 'true') {
    log('[SETTINGS CERT] Menú ya configurado, saltando...');
    return;
  }

  btnSettings.dataset.settingsConfigured = 'true';

  const categories = dropdown.querySelectorAll('.settings-category');

  function collapseAllCategories() {
    categories.forEach((category) => {
      const categoryName = category.dataset.category;
      const submenu = dropdown.querySelector(`[data-submenu="${categoryName}"]`);
      if (submenu) {
        category.setAttribute('aria-expanded', 'false');
        submenu.classList.remove('expanded');
        setTimeout(() => {
          if (!submenu.classList.contains('expanded')) {
            submenu.style.display = 'none';
          }
        }, 100);
      }
    });
  }

  // Toggle del menú
  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display !== 'none';
    if (isVisible) {
      collapseAllCategories();
    }
    dropdown.style.display = isVisible ? 'none' : 'block';
    btnSettings.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
  });

  // Cerrar menú al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!btnSettings.contains(e.target) && !dropdown.contains(e.target)) {
      collapseAllCategories();
      dropdown.style.display = 'none';
      btnSettings.setAttribute('aria-expanded', 'false');
    }
  });

  // Expandir/colapsar categorías
  function toggleCategory(categoryElement) {
    const categoryName = categoryElement.dataset.category;
    const submenu = dropdown.querySelector(`[data-submenu="${categoryName}"]`);
    if (!submenu) return;

    const isExpanded = categoryElement.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      categoryElement.setAttribute('aria-expanded', 'false');
      submenu.classList.remove('expanded');
      setTimeout(() => {
        if (!submenu.classList.contains('expanded')) {
          submenu.style.display = 'none';
        }
      }, 300);
    } else {
      submenu.style.display = 'block';
      setTimeout(() => {
        categoryElement.setAttribute('aria-expanded', 'true');
        submenu.classList.add('expanded');
      }, 10);
    }
  }

  categories.forEach((category) => {
    category.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCategory(category);
    });

    category.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCategory(category);
      }
    });
  });

  // ===== ACCIONES DEL MENÚ =====

  // Toggle de Tema
  dropdown.querySelector('[data-action="toggle-theme-cert"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTheme();
  });

  // Abrir Manual
  dropdown.querySelector('[data-action="open-manual"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    window.open('https://drive.google.com/file/d/1DpnuJx6TIn1DA98IjkU1z0hpvpC4k8tg/view?usp=sharing', '_blank');
  });

  // Guía Rápida
  dropdown.querySelector('[data-action="quick-guide"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    showQuickGuideModal();
  });

  // Atajos de Teclado
  dropdown.querySelector('[data-action="keyboard-shortcuts-cert"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    showKeyboardShortcutsModal();
  });

  // Verificar Conexión
  dropdown.querySelector('[data-action="test-connection"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    testScriptConnection();
  });

  // Actualizar Listas
  dropdown.querySelector('[data-action="refresh-lists"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    refreshAllLists();
  });

  // Limpiar Caché
  dropdown.querySelector('[data-action="clear-cache"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    clearBrowserCache();
  });

  // Crear Hoja de Ejemplo
  dropdown.querySelector('[data-action="create-demo-sheet"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    createDemoSheet();
  });

  // Crear Estructura de Carpetas
  dropdown.querySelector('[data-action="create-folder-structure"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = 'none';
    btnSettings.setAttribute('aria-expanded', 'false');
    createFolderStructure();
  });

  // Actualizar UI del toggle según el tema actual
  const currentTheme = getTheme();
  updateThemeToggleUI(currentTheme, 'theme-toggle-icon-cert', 'theme-toggle-text-cert');

  log('[SETTINGS CERT] ✅ Menú de ajustes de certificados configurado correctamente');
}

// ===== FUNCIONES DE ACCIONES DEL MENÚ DE CERTIFICADOS =====

// Guía Rápida
function showQuickGuideModal() {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h2><i class="ph ph-lightbulb"></i> Guía Rápida - Generador de Certificados</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div style="padding: 20px;">
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--accent);">
            <i class="ph ph-number-circle-one"></i> Paso 1: Preparación
          </h3>
          <ul style="margin-left: 20px; color: var(--muted); line-height: 1.8;">
            <li>Crea tu plantilla en Google Slides con variables <code>{{NOMBRE}}</code></li>
            <li>Si usas código de validación, añade <code>{{CODIGO_VALIDACION}}</code></li>
            <li>Crea o selecciona tu hoja de Google Sheets</li>
            <li>Crea carpetas para PDFs originales y protegidos</li>
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--accent);">
            <i class="ph ph-number-circle-two"></i> Paso 2: Generar PDFs
          </h3>
          <ul style="margin-left: 20px; color: var(--muted); line-height: 1.8;">
            <li>Selecciona plantilla, hoja y carpeta</li>
            <li>Haz clic en "Generar PDFs desde Plantilla"</li>
            <li>Espera a que termine el proceso</li>
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--accent);">
            <i class="ph ph-number-circle-three"></i> Paso 3: Proteger PDFs
          </h3>
          <ul style="margin-left: 20px; color: var(--muted); line-height: 1.8;">
            <li>Descarga los PDFs de Drive</li>
            <li>Protégelos con PDF24 u otra herramienta</li>
            <li>Sube los PDFs protegidos a Drive</li>
          </ul>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; margin-bottom: 12px; color: var(--accent);">
            <i class="ph ph-number-circle-four"></i> Paso 4: Generar Enlaces
          </h3>
          <ul style="margin-left: 20px; color: var(--muted); line-height: 1.8;">
            <li>Selecciona carpeta de PDFs protegidos</li>
            <li>Completa título y fecha del evento</li>
            <li>Haz clic en "Generar Enlaces"</li>
            <li>Usa los enlaces en tu Google Sheet para enviar</li>
          </ul>
        </div>

        <div style="padding: 16px; background: rgba(90,169,255,0.1); border-radius: 8px; margin-top: 20px;">
          <strong><i class="ph ph-info"></i> Tip:</strong> Para más detalles, consulta el 
          <a href="https://drive.google.com/file/d/1DpnuJx6TIn1DA98IjkU1z0hpvpC4k8tg/view?usp=sharing" 
             target="_blank" style="color: var(--accent); text-decoration: underline;">
            Manual Completo en PDF
          </a>
        </div>

        <div style="text-align: right; margin-top: 20px;">
          <button class="btn" onclick="this.closest('.modal').remove()">Entendido</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Mostrar Atajos de Teclado
function showKeyboardShortcutsModal() {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2><i class="ph ph-keyboard"></i> Atajos de Teclado</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div style="padding: 20px;">
        <p style="color: var(--muted); margin-bottom: 20px;">
          Usa estos atajos para navegar más rápido en el generador de certificados:
        </p>

        <div style="display: grid; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(90,169,255,0.05); border-radius: 6px;">
            <span style="color: var(--muted);">Cambiar tema</span>
            <kbd style="padding: 4px 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; font-family: monospace; font-size: 12px;">Ctrl + K</kbd>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(90,169,255,0.05); border-radius: 6px;">
            <span style="color: var(--muted);">Abrir manual</span>
            <kbd style="padding: 4px 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; font-family: monospace; font-size: 12px;">Ctrl + H</kbd>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(90,169,255,0.05); border-radius: 6px;">
            <span style="color: var(--muted);">Verificar conexión</span>
            <kbd style="padding: 4px 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; font-family: monospace; font-size: 12px;">Ctrl + T</kbd>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(90,169,255,0.05); border-radius: 6px;">
            <span style="color: var(--muted);">Actualizar listas</span>
            <kbd style="padding: 4px 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; font-family: monospace; font-size: 12px;">Ctrl + R</kbd>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(90,169,255,0.05); border-radius: 6px;">
            <span style="color: var(--muted);">Abrir ajustes</span>
            <kbd style="padding: 4px 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; font-family: monospace; font-size: 12px;">Ctrl + ,</kbd>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(90,169,255,0.05); border-radius: 6px;">
            <span style="color: var(--muted);">Cerrar ventanas</span>
            <kbd style="padding: 4px 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; font-family: monospace; font-size: 12px;">Esc</kbd>
          </div>
        </div>

        <div style="padding: 16px; background: rgba(90,169,255,0.1); border-radius: 8px; margin-top: 20px;">
          <strong><i class="ph ph-info"></i> Nota:</strong> Los atajos funcionan solo en la vista de certificados.
        </div>

        <div style="text-align: right; margin-top: 20px;">
          <button class="btn" onclick="this.closest('.modal').remove()">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Verificar Conexión con Script
async function testScriptConnection() {
  const scriptUrl = $('#input-script-url')?.value;
  if (!scriptUrl) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', 'Debes configurar la URL del script primero');
    }
    return;
  }

  if (typeof window.showToast === 'function') {
    window.showToast('info', 'Verificando...', 'Probando conexión con Google Apps Script');
  }

  try {
    const response = await fetch(`${scriptUrl}?action=test`);
    const data = await response.json();
    
    if (data.success) {
      if (typeof window.showToast === 'function') {
        window.showToast('success', '✅ Conexión Exitosa', 'El script está funcionando correctamente');
      }
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', '❌ Error de Conexión', error.message);
    }
  }
}

// Actualizar todas las listas
function refreshAllLists() {
  if (typeof window.showToast === 'function') {
    window.showToast('info', 'Actualizando...', 'Actualizando todas las listas');
  }

  // Refrescar plantillas
  $('#btn-refresh-templates')?.click();
  
  // Refrescar hojas
  setTimeout(() => $('#btn-refresh-sheets')?.click(), 500);
  
  // Refrescar carpetas
  setTimeout(() => $('#btn-refresh-folders')?.click(), 1000);
  setTimeout(() => $('#btn-refresh-folders-prot')?.click(), 1500);

  setTimeout(() => {
    if (typeof window.showToast === 'function') {
      window.showToast('success', '✅ Actualizado', 'Listas actualizadas correctamente');
    }
  }, 2000);
}

// Limpiar Caché del navegador
function clearBrowserCache() {
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2><i class="ph ph-trash"></i> Limpiar Caché</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div style="padding: 20px;">
        <p style="color: var(--muted); margin-bottom: 16px;">
          ¿Deseas limpiar la caché del generador de certificados?
        </p>
        <p style="color: var(--muted); margin-bottom: 16px; font-size: 14px;">
          <i class="ph ph-warning"></i> Esto eliminará las listas guardadas y tendrás que actualizarlas nuevamente.
        </p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
          <button class="btn" onclick="localStorage.removeItem('certificates_cache'); this.closest('.modal').remove(); if(typeof window.showToast === 'function') window.showToast('success', 'Caché Limpiada', 'La caché se ha eliminado correctamente');">
            Limpiar Caché
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Crear Hoja de Ejemplo
async function createDemoSheet() {
  const scriptUrl = $('#input-script-url')?.value;
  const mode = $('#select-cert-mode')?.value || 'webinar';
  
  if (!scriptUrl) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', 'Configura la URL del script primero');
    }
    return;
  }

  if (typeof window.showToast === 'function') {
    window.showToast('info', 'Creando...', 'Creando hoja de ejemplo');
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createSheet',
        params: {
          name: `Ejemplo Certificados - ${new Date().toLocaleDateString()}`,
          mode: mode
        }
      })
    });

    const data = await response.json();
    if (data.success) {
      if (typeof window.showToast === 'function') {
        window.showToast('success', '✅ Hoja Creada', 'Hoja de ejemplo creada correctamente');
      }
      // Refrescar lista de hojas
      setTimeout(() => $('#btn-refresh-sheets')?.click(), 500);
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', error.message);
    }
  }
}

// Crear Estructura de Carpetas
async function createFolderStructure() {
  const scriptUrl = $('#input-script-url')?.value;
  
  if (!scriptUrl) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', 'Configura la URL del script primero');
    }
    return;
  }

  const eventName = prompt('Nombre del evento:', 'Webinar - ' + new Date().toLocaleDateString());
  if (!eventName) return;

  if (typeof window.showToast === 'function') {
    window.showToast('info', 'Creando...', 'Creando estructura de carpetas');
  }

  try {
    // Crear carpeta principal
    const mainFolder = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createFolder',
        params: { name: `Certificados - ${eventName}` }
      })
    });
    
    const mainData = await mainFolder.json();
    if (!mainData.success) throw new Error(mainData.error);

    // Crear subcarpetas
    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createFolder',
        params: { name: `Certificados - ${eventName}/Originales` }
      })
    });

    await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createFolder',
        params: { name: `Certificados - ${eventName}/Protegidos` }
      })
    });

    if (typeof window.showToast === 'function') {
      window.showToast('success', '✅ Carpetas Creadas', 'Estructura creada correctamente');
    }

    // Refrescar listas de carpetas
    setTimeout(() => {
      $('#btn-refresh-folders')?.click();
      $('#btn-refresh-folders-prot')?.click();
    }, 1000);
  } catch (error) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', error.message);
    }
  }
}

// ===== FIN DE FUNCIONES DE CERTIFICADOS =====

// ✅ Función para crear custom select con iconos Phosphor
function createCustomSelect(options, defaultValue = 'all') {
  const selectId = 'customSelect_' + Date.now();
  let selectedValue = defaultValue;
  
  const optionsData = options.map(opt => ({
    value: opt.value,
    icon: opt.icon,
    label: opt.label
  }));
  
  const selectedOption = optionsData.find(opt => opt.value === selectedValue) || optionsData[0];
  
  const html = `
    <div class="custom-select" id="${selectId}" data-value="${selectedValue}">
      <div class="custom-select-trigger">
        <i class="${selectedOption.icon}"></i>
        <span class="custom-select-label">${selectedOption.label}</span>
        <i class="ph ph-caret-down custom-select-arrow"></i>
      </div>
      <div class="custom-select-options">
        ${optionsData.map(opt => `
          <div class="custom-select-option ${opt.value === selectedValue ? 'selected' : ''}" data-value="${opt.value}">
            <i class="${opt.icon}"></i>
            <span>${opt.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // Retornar objeto con HTML y función para inicializar eventos
  return {
    html,
    init: function(container) {
      const customSelect = container.querySelector(`#${selectId}`);
      const trigger = customSelect.querySelector('.custom-select-trigger');
      const options = customSelect.querySelectorAll('.custom-select-option');
      const label = customSelect.querySelector('.custom-select-label');
      const icon = trigger.querySelector('i:first-child');
      
      // Toggle dropdown
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customSelect.classList.toggle('open');
      });
      
      // Cerrar al hacer clic fuera
      document.addEventListener('click', () => {
        customSelect.classList.remove('open');
      });
      
      // Seleccionar opción
      options.forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Remover selected de todas
          options.forEach(opt => opt.classList.remove('selected'));
          
          // Marcar como selected
          option.classList.add('selected');
          
          // Actualizar valor
          selectedValue = option.dataset.value;
          customSelect.dataset.value = selectedValue;
          
          // Actualizar trigger
          const optIcon = option.querySelector('i').className;
          const optLabel = option.querySelector('span').textContent;
          icon.className = optIcon;
          label.textContent = optLabel;
          
          // Cerrar dropdown
          customSelect.classList.remove('open');
        });
      });
    },
    getValue: function() {
      const customSelect = document.querySelector(`#${selectId}`);
      return customSelect ? customSelect.dataset.value : selectedValue;
    }
  };
}

// ✅ Función para exportar filtrado por tipo
function showExportFilterModal() {
  // ✅ PREVENIR MÚLTIPLES MODALES: Verificar si ya hay un modal abierto
  const existingModal = document.getElementById('exportFilterModal');
  if (existingModal) {
    warn('[EXPORT FILTER] Ya hay un modal de exportación abierto');
    return;
  }

  // Crear modal temporal para seleccionar tipo
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.id = 'exportFilterModal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h2><i class="ph ph-upload"></i> Exportar por Tipo</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div style="padding: 20px;">
        <p style="color: var(--muted); margin-bottom: 16px;">
          Selecciona qué tipo de cursos deseas exportar:
        </p>
        <div id="exportTypeSelectContainer" style="margin-bottom: 16px;"></div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
          <button class="btn" onclick="exportFilteredByType()">Exportar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Crear custom select con iconos Phosphor
  const customSelect = createCustomSelect([
    { value: 'all', icon: 'ph ph-books', label: 'Todos los cursos' },
    { value: 'curso', icon: 'ph ph-book-open', label: 'Solo Cursos' },
    { value: 'diplomado', icon: 'ph ph-graduation-cap', label: 'Solo Diplomados' },
    { value: 'webinar', icon: 'ph ph-monitor', label: 'Solo Webinars' },
    { value: 'seminario', icon: 'ph ph-note', label: 'Solo Seminarios' },
    { value: 'taller', icon: 'ph ph-wrench', label: 'Solo Talleres' }
  ], 'all');
  
  // Insertar HTML del custom select
  const container = modal.querySelector('#exportTypeSelectContainer');
  container.innerHTML = customSelect.html;
  
  // Inicializar eventos
  customSelect.init(container);
  
  // Guardar referencia para exportFilteredByType
  window.currentExportSelect = customSelect;
}

// ✅ Función para exportar filtrado
function exportFilteredByType() {
  // ✅ PREVENIR MÚLTIPLES EJECUCIONES
  if (window._isExporting) {
    warn('[EXPORT FILTER] Ya hay una exportación en curso, ignorando...');
    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'Exportación en curso', 'Por favor espera a que termine la exportación actual.');
    }
    return;
  }

  const filterType = window.currentExportSelect ? window.currentExportSelect.getValue() : 'all';
  const mergedMap = getMergedAccessHashMap();

  // ✅ Marcar como exportando
  window._isExporting = true;

  try {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      filterType: filterType,
      overrides: {},
      courses: {}
    };

    // Filtrar cursos por tipo
    Object.entries(mergedMap).forEach(([hex, data]) => {
      if (hex === MASTER_HASH) return;

      if (filterType === 'all' || (data.type || 'curso') === filterType) {
        // Exportar links del curso
        const arr = loadFilesOverride(hex);
        if (Array.isArray(arr)) payload.overrides[hex] = arr;

        // Exportar curso completo
        const customCourses = loadCustomCourses();
        if (customCourses[hex]) {
          payload.courses[hex] = customCourses[hex];
        }
      }
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edusalud_backup_${filterType}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    // Cerrar modal
    const modal = document.getElementById('exportFilterModal');
    if (modal) modal.remove();

    // Registrar en historial
    logBackupHistory('export', filterType, Object.keys(payload.courses).length);

    if (typeof window.showToast === 'function') {
      window.showToast('success', 'Backup Exportado',
        `Se exportaron ${Object.keys(payload.courses).length} cursos (${filterType === 'all' ? 'todos' : filterType}).`);
    }
  } finally {
    // ✅ Desbloquear después de un pequeño delay
    setTimeout(() => {
      window._isExporting = false;
    }, 1000);
  }
}

// ✅ Función para mostrar vista previa antes de importar
async function showImportPreview(file) {
  // ✅ PREVENIR MÚLTIPLES MODALES: Verificar si ya hay un modal de preview abierto
  const existingModal = document.getElementById('importPreviewModal');
  if (existingModal) {
    warn('[IMPORT] Ya hay un modal de preview abierto, cerrando el anterior...');
    existingModal.remove();
  }

  // ✅ Verificar si ya se está procesando una importación
  if (window._isImporting) {
    warn('[IMPORT] Ya hay una importación en curso, ignorando...');
    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'Importación en curso', 'Por favor espera a que termine la importación actual.');
    }
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data || typeof data !== 'object') {
      throw new Error('Archivo inválido');
    }

    const coursesCount = data.courses ? Object.keys(data.courses).length : 0;
    const overridesCount = data.overrides ? Object.keys(data.overrides).length : 0;
    const exportDate = data.exportedAt ? new Date(data.exportedAt).toLocaleString('es-ES') : 'Desconocida';
    const filterType = data.filterType || 'all';

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'importPreviewModal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h2>📥 Vista Previa de Importación</h2>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div style="padding: 20px;">
          <div style="background: rgba(90,169,255,0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px;"><i class="ph ph-clipboard"></i> Contenido del Backup</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
              <div><i class="ph ph-book"></i> Cursos: <strong>${sanitizeHTML(String(coursesCount))}</strong></div>
              <div><i class="ph ph-link"></i> Sets de links: <strong>${sanitizeHTML(String(overridesCount))}</strong></div>
              <div><i class="ph ph-calendar"></i> Fecha de exportación: <strong>${sanitizeHTML(exportDate)}</strong></div>
              <div><i class="ph ph-tag"></i> Filtro aplicado: <strong>${sanitizeHTML(filterType === 'all' ? 'Todos' : filterType)}</strong></div>
            </div>
          </div>
          <p style="color: var(--muted); margin-bottom: 16px; font-size: 13px;">
            <i class="ph ph-warning"></i> Esta acción importará los cursos y links del backup. Los cursos existentes con el mismo código serán sobrescritos.
          </p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
            <button class="btn" onclick="confirmImportBackup()">Importar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Guardar datos en el modal para acceso posterior
    modal.dataset.importData = JSON.stringify(data);
  } catch (e) {
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', 'No se pudo leer el archivo: ' + (e.message || 'Formato inválido'));
    } else {
      alert('Error: ' + (e.message || 'Formato inválido'));
    }
  }
}

// ✅ Función para confirmar importación
function confirmImportBackup() {
  // ✅ PREVENIR MÚLTIPLES EJECUCIONES
  if (window._isImporting) {
    warn('[IMPORT] Ya hay una importación en curso, ignorando...');
    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'Importación en curso', 'Por favor espera a que termine la importación actual.');
    }
    return;
  }

  // Obtener datos del modal
  const modal = document.getElementById('importPreviewModal');
  if (!modal) {
    console.error('[IMPORT] Modal de preview no encontrado');
    return;
  }

  // Obtener datos del dataset
  const modalData = modal.dataset.importData;
  if (!modalData) {
    console.error('[IMPORT] No se encontraron datos en el modal');
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', 'No se pudieron leer los datos del backup');
    }
    return;
  }

  // Parsear datos
  let data;
  try {
    data = JSON.parse(modalData);
  } catch (e) {
    console.error('[IMPORT] Error parseando datos:', e);
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', 'No se pudieron leer los datos del backup');
    }
    return;
  }

  // ✅ Marcar como importando
  window._isImporting = true;

  // Cerrar modal de preview
  modal.remove();

  // ✅ Mostrar indicador de carga
  if (typeof window.showLoading === 'function') {
    window.showLoading('Importando backup...');
  }

  // Ejecutar importación
  importOverridesFromFileData(data).finally(() => {
    // ✅ Ocultar indicador de carga
    if (typeof window.hideLoading === 'function') {
      window.hideLoading();
    }

    // ✅ Desbloquear después de completar
    setTimeout(() => {
      window._isImporting = false;
    }, 1000);
  });

  // Registrar en historial
  logBackupHistory('import', data.filterType || 'all', Object.keys(data.courses || {}).length);
}

// ✅ Hacer función global para acceso desde onclick
window.confirmImportBackup = confirmImportBackup;

// ✅ Función auxiliar para importar desde datos (no desde archivo)
async function importOverridesFromFileData(data) {
  try {
    let coursesCount = 0;
    let overridesCount = 0;

    // Importar cursos personalizados
    if (data.courses && typeof data.courses === 'object') {
      const custom = loadCustomCourses();
      const coursesToProcess = [];

      // Primero, guardar en localStorage
      Object.entries(data.courses).forEach(([hex, courseData]) => {
        if (courseData && typeof courseData === 'object') {
          custom[hex] = courseData;
          coursesToProcess.push({ hex, courseData });
          coursesCount++;
        }
      });
      saveCustomCourses(custom);

      // ✅ Luego, guardar cada curso en Firebase y Google Sheets
      const db = getFirestoreDB();
      for (const { hex, courseData } of coursesToProcess) {
        try {
          // Normalizar datos del curso (igual que en addCustomCourse, incluyendo TODOS los campos)
          const normalizedCourse = {
            title: courseData?.title || '',
            meta: courseData?.meta || '',
            files: Array.isArray(courseData?.files) ? courseData.files : [],
            code: courseData?.code || '',
            type: courseData?.type || 'curso',
            image: courseData?.image || '', // ✅ Incluir image
            tag: courseData?.tag || '', // ✅ Incluir tag
            card: courseData?.card || {},
            createdAt: courseData?.createdAt || Date.now(),
            updatedAt: Date.now()
          };

          log('[IMPORT] 📤 Guardando curso:', hex.substring(0, 8), '- Título:', normalizedCourse.title);

          // ✅ Guardar en Firebase
          if (db) {
            try {
              const firebasePayload = {
                ...normalizedCourse,
                createdAt: normalizedCourse.createdAt || firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
              };
              await db.ref(`customCourses/${hex}`).set(firebasePayload);
              log('[IMPORT] ✅ Curso guardado en Firebase:', hex.substring(0, 8));
            } catch (firebaseError) {
              console.error('[IMPORT] ❌ Error guardando curso en Firebase:', hex.substring(0, 8), firebaseError);
            }
          }

          // ✅ Guardar en Google Sheets (esperar a que termine antes de continuar)
          log('[IMPORT] 📤 Enviando curso a Google Sheets:', hex.substring(0, 8));
          const saveResult = await remoteSaveCourse(hex, normalizedCourse);
          if (saveResult) {
            log('[IMPORT] ✅ Curso guardado en Google Sheets:', hex.substring(0, 8));
          } else {
            warn('[IMPORT] ⚠️ No se pudo guardar curso en Google Sheets:', hex.substring(0, 8));
          }

          // ✅ Esperar un poco entre cada curso para no saturar el servidor
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (courseError) {
          console.error('[IMPORT] ❌ Error procesando curso:', hex.substring(0, 8), courseError);
        }
      }
    }

    // Importar overrides (links)
    if (data.overrides && typeof data.overrides === 'object') {
      Object.entries(data.overrides).forEach(([hex, arr]) => {
        if (Array.isArray(arr)) {
          saveFilesOverride(hex, arr);

          // ✅ También guardar links en Google Sheets como respaldo
          remoteSaveFiles(hex, arr).catch(e => {
            console.error('[IMPORT] ❌ Error guardando links en remoto (Sheets):', hex.substring(0, 8), e);
          });

          overridesCount++;
        }
      });
    }

    buildMasterGrid();

    const message = `Importado correctamente:\n- ${coursesCount} cursos\n- ${overridesCount} sets de links`;
    if (typeof window.showToast === 'function') {
      window.showToast('success', 'Backup Importado', message);
    } else {
      alert(message);
    }
  } catch (e) {
    console.error('[IMPORT] Error:', e);
    if (typeof window.showToast === 'function') {
      window.showToast('error', 'Error', 'No se pudo importar: ' + (e.message || 'Error desconocido'));
    } else {
      alert('Error: ' + (e.message || 'Error desconocido'));
    }
  }
}

// ✅ Función para mostrar historial de backups
function showBackupHistory() {
  // ✅ PREVENIR MÚLTIPLES MODALES: Verificar si ya hay un modal de historial abierto
  const existingModal = document.getElementById('backupHistoryModal');
  if (existingModal) {
    warn('[BACKUP HISTORY] Ya hay un modal de historial abierto');
    return;
  }

  const history = getBackupHistory();

  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.id = 'backupHistoryModal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
      <div class="modal-header">
        <h2>📋 Historial de Backups</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div style="padding: 20px;">
        ${history.length === 0
      ? '<p style="color: var(--muted); text-align: center; padding: 40px;">No hay backups registrados aún.</p>'
      : history.map(entry => {
        const date = new Date(entry.timestamp);
        const dateStr = date.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        return `
                <div style="background: rgba(90,169,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid var(--accent);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>${entry.action === 'export' ? '📤 Exportación' : '📥 Importación'}</strong>
                    <span style="font-size: 12px; color: var(--muted);">${dateStr}</span>
                  </div>
                  <div style="font-size: 13px; color: var(--muted);">
                    Tipo: ${entry.filterType === 'all' ? 'Todos' : entry.filterType} | 
                    Cursos: ${entry.coursesCount}
                  </div>
                </div>
              `;
      }).join('')
    }
      </div>
      <div style="padding: 0 20px 20px; display: flex; justify-content: flex-end;">
        <button class="btn secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ✅ Funciones para gestionar historial de backups
function logBackupHistory(action, filterType, coursesCount) {
  try {
    let history = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    history.unshift({
      action: action,
      filterType: filterType,
      coursesCount: coursesCount,
      timestamp: new Date().toISOString()
    });
    history = history.slice(0, 50); // Mantener solo los últimos 50
    localStorage.setItem('backupHistory', JSON.stringify(history));
    log('[BACKUP HISTORY] ✅ Registrado:', action, filterType, coursesCount, 'cursos');
  } catch (e) {
    warn('[BACKUP HISTORY] ⚠️ Error guardando historial:', e);
  }
}

function getBackupHistory() {
  try {
    return JSON.parse(localStorage.getItem('backupHistory') || '[]');
  } catch (e) {
    warn('[BACKUP HISTORY] ⚠️ Error leyendo historial:', e);
    return [];
  }
}

/* ============ estado & helpers ============ */
let currentKeyHex = null;
// ✅ Variable global para identificar si el usuario es master autenticado
let isMasterAuthenticated = false;
const ATTEMPT_KEY = 'edusalud_attempts_session';

function recordAttempt() {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_KEY);
    const n = raw ? Number(raw) : 0;
    const next = n + 1;
    sessionStorage.setItem(ATTEMPT_KEY, String(next));
    return next;
  } catch (e) { return 0; }
}
function clearAttempts() { try { sessionStorage.removeItem(ATTEMPT_KEY); } catch (e) { } }
function getAttemptsCount() { try { return Number(sessionStorage.getItem(ATTEMPT_KEY) || 0); } catch (e) { return 0; } }
function maybeShowAttemptsWarning() {
  const attempts = getAttemptsCount();
  const msg = $('#msg');
  if (!msg) return;
  if (attempts === 0) return;
  if (attempts >= 8 && attempts < 15) {
    msg.textContent = `Ha intentado ${attempts} veces. Verifique que el código esté correcto antes de seguir intentando.`;
    msg.classList.add('error');
  } else if (attempts >= 15) {
    msg.textContent = `Ha realizado muchos intentos (${attempts}). Si el problema persiste, solicite el código a comunicaciones.`;
    msg.classList.add('error');
  }
}

/* ============ vistas ============ */
function showAccess() {
  // ✅ Limpiar flags de autenticación al mostrar acceso
  isMasterAuthenticated = false;
  currentKeyHex = null;
  window.currentUserEmail = null;
  window.allowedCoursesForUser = null;
  window.isFromUserView = false;

  // ✅ Quitar clase master-view para mostrar header principal
  document.body.classList.remove('master-view');

  // ✅ Transición suave: ocultar otras vistas primero
  $('#content').classList.add('hidden');
  $('#master').classList.add('hidden');
  $('#user-view').classList.add('hidden');

  // ✅ Mostrar access con transición
  const accessEl = $('#access');
  accessEl.classList.remove('hidden');
  // ✅ Forzar reflow para que la transición se active
  void accessEl.offsetWidth;

  $('#code').focus();
  // Detener refresh periódico cuando vuelves al acceso
  stopPeriodicRefresh();
  // ✅ Ocultar botón flotante en pantalla de login
  const fabBtn = document.getElementById('btn-speed-refresh');
  if (fabBtn) fabBtn.classList.remove('visible');
}
// Sistema de refresh periódico para sincronización en tiempo real
let periodicRefreshInterval = null;
const PERIODIC_REFRESH_INTERVAL_MS = 1200; // 1.2 segundos (sincronización ultra rápida)

function startPeriodicRefresh(currentHex = null) {
  stopPeriodicRefresh();

  // ✅ Debug: verificar hasRemote
  const remoteAvailable = hasRemote();
  log('[PERIODIC] hasRemote():', remoteAvailable);
  log('[PERIODIC] REMOTE_BASE_URL:', typeof REMOTE_BASE_URL !== 'undefined' ? REMOTE_BASE_URL : 'UNDEFINED');

  if (!remoteAvailable) {
    warn('[PERIODIC] ⚠️ No se puede iniciar: REMOTE_BASE_URL no disponible');
    return;
  }

  log('[PERIODIC] 🔄 Iniciando refresh AUTOMÁTICO cada', PERIODIC_REFRESH_INTERVAL_MS / 1000, 'segundos');
  log('[PERIODIC] 💡 Los cambios aparecerán AUTOMÁTICAMENTE sin refrescar');

  const runRefresh = async () => {
    try {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );

      // ✅ CORREGIDO: Solo bloquear si hay un input/textarea enfocado dentro de un form de edición
      // No bloquear solo porque exista el formulario de "agregar link"
      const hasEditFormOpen = isInputFocused && activeElement.closest('[data-edit-form]') !== null;

      if (isInputFocused && hasEditFormOpen) {
        log('[PERIODIC] ⏸️ Pausado: usuario escribiendo en formulario');
        return;
      }

      // ✅ CORREGIDO: Si currentHex es null o MASTER_HASH, refrescar todos los cursos
      if (!currentHex || currentHex === MASTER_HASH) {
        const mergedMap = getMergedAccessHashMap();
        const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
        log('[PERIODIC] Total cursos a refrescar (base + personalizados):', hexes.length);

        const results = await Promise.allSettled(
          hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
            warn('[PERIODIC] Error refrescando', h.substring(0, 8), ':', e);
            return false;
          }))
        );
        const anyUpdated = results.some(r => r.status === 'fulfilled' && r.value === true);

        await refreshCustomCourses();

        // ✅ NO actualizar la vista automáticamente para no interrumpir al usuario
        // El botón amarillo le avisará que hay cambios, y puede sincronizar manualmente
        if (anyUpdated) {
          log('[PERIODIC] ✅ Cambios detectados (botón se pondrá amarillo)');
        }

        // ✅ Actualizar botón flotante (siempre, incluso cuando NO hay cambios)
        if (typeof window.updateSyncButtonState === 'function') {
          log('[PERIODIC-MASTER] 🔔 Actualizando botón:', anyUpdated ? 'AMARILLO (cambios)' : 'AZUL (sin cambios)');
          window.updateSyncButtonState(anyUpdated);
        } else {
          warn('[PERIODIC-MASTER] ⚠️ updateSyncButtonState no disponible');
        }
      } else if (currentHex) {
        const mergedMap = getMergedAccessHashMap();
        if (mergedMap[currentHex]) {
          const updated = await refreshFromRemoteSilent(currentHex).catch(e => {
            warn('[PERIODIC] Error refrescando archivos:', e);
            return false;
          });

          // ✅ NO actualizar la vista automáticamente para no interrumpir al usuario
          // El botón amarillo le avisará que hay cambios, y puede sincronizar manualmente
          if (updated) {
            log('[PERIODIC] ✅ Cambios detectados (botón se pondrá amarillo)');
          }

          // ✅ Actualizar botón flotante
          if (typeof window.updateSyncButtonState === 'function') {
            log('[PERIODIC-CURSO] 🔔 Actualizando botón:', updated ? 'AMARILLO (cambios)' : 'AZUL (sin cambios)');
            window.updateSyncButtonState(updated);
          } else {
            warn('[PERIODIC-CURSO] ⚠️ updateSyncButtonState no disponible');
          }
        } else {
          warn('[PERIODIC] ⚠️ Hex no encontrado en mergedMap:', currentHex.substring(0, 8));
        }
      }
    } catch (e) {
      console.error('[PERIODIC] ❌ Error en refresh:', e);
    }
  };

  runRefresh();
  periodicRefreshInterval = setInterval(runRefresh, PERIODIC_REFRESH_INTERVAL_MS);
}

function stopPeriodicRefresh() {
  if (periodicRefreshInterval) {
    log('[PERIODIC] Deteniendo refresh periódico');
    clearInterval(periodicRefreshInterval);
    periodicRefreshInterval = null;
  }
}

function showContent() {
  // ✅ Quitar clase master-view para mostrar header principal
  document.body.classList.remove('master-view');

  // ✅ Transición suave: ocultar otras vistas primero
  $('#access').classList.add('hidden');
  $('#master').classList.add('hidden');
  $('#user-view').classList.add('hidden');

  // ✅ Mostrar content con transición
  const contentEl = $('#content');
  contentEl.classList.remove('hidden');
  // ✅ Forzar reflow para que la transición se active
  void contentEl.offsetWidth;

  // ✅ Mostrar/ocultar botones "Volver" según el origen
  const btnBackToUser = $('#btn-back-to-user');
  const btnBackToMaster = $('#btn-back-to-master');

  // ✅ Viene de vista de usuario si tiene email, cursos permitidos y el flag está activo
  const isFromUserView = window.currentUserEmail && window.allowedCoursesForUser && window.isFromUserView;

  // ✅ Viene de vista maestra si NO viene de usuario y hay un curso abierto (y es master autenticado)
  const isFromMasterView = !isFromUserView && currentKeyHex && currentKeyHex !== MASTER_HASH && isMasterAuthenticated;

  if (btnBackToUser) {
    if (isFromUserView) {
      btnBackToUser.classList.remove('hidden');
    } else {
      btnBackToUser.classList.add('hidden');
    }
  }

  if (btnBackToMaster) {
    if (isFromMasterView) {
      btnBackToMaster.classList.remove('hidden');
    } else {
      btnBackToMaster.classList.add('hidden');
    }
  }

  // No iniciar refresh periódico aquí, se inicia cuando se renderiza el curso
  // ✅ Mostrar botón flotante cuando está autenticado
  const fabBtn = document.getElementById('btn-speed-refresh');
  if (fabBtn) fabBtn.classList.add('visible');
  // ✅ Configurar menú de ajustes para consultores
  setupSettingsMenuContent();
}
// ✅ Mostrar vista de usuario (diferente a vista master)
function showUserView() {
  // ✅ Quitar clase master-view para mostrar header principal
  document.body.classList.remove('master-view');

  // ✅ Transición suave: ocultar otras vistas primero
  $('#access').classList.add('hidden');
  $('#content').classList.add('hidden');
  $('#master').classList.add('hidden');

  // ✅ Mostrar vista de usuario con transición
  const userViewEl = $('#user-view');
  userViewEl.classList.remove('hidden');
  void userViewEl.offsetWidth;

  // ✅ Mostrar email del usuario
  const userEmailDisplay = $('#userEmailDisplay');
  if (userEmailDisplay && window.currentUserEmail) {
    userEmailDisplay.textContent = window.currentUserEmail;
  }

  // ✅ Construir grid de cursos permitidos
  buildUserGrid();
}

function showMaster() {
  // ✅ VALIDACIÓN DE SEGURIDAD: Solo permitir acceso si el usuario es master autenticado
  if (!isMasterAuthenticated && currentKeyHex !== MASTER_HASH) {
    console.error('[SECURITY] ❌ Intento de acceso no autorizado a vista maestra');
    // Redirigir a vista de acceso
    showAccess();
    if (typeof window.showToast === 'function') {
      window.showToast('Acceso denegado', 'No tienes permiso para acceder a la vista maestra', 'error');
    }
    return;
  }

  // ✅ Transición suave: ocultar otras vistas primero
  $('#access').classList.add('hidden');
  $('#content').classList.add('hidden');
  $('#user-view').classList.add('hidden');

  // ✅ Limpiar flag cuando se muestra la vista master
  window.isFromUserView = false;

  // ✅ Ocultar header principal cuando se muestra vista maestra
  document.body.classList.add('master-view');

  // ✅ Mostrar master con transición
  const masterEl = $('#master');
  masterEl.classList.remove('hidden');
  // ✅ Forzar reflow para que la transición se active
  void masterEl.offsetWidth;
  // ❌ NO iniciar polling automático (el usuario sincroniza manualmente con el botón)
  // startPeriodicRefresh(MASTER_HASH);

  // ✅ Configurar navegación entre pestañas
  setupMasterNavigation();

  // ✅ Mostrar botón flotante cuando está autenticado
  const fabBtn = document.getElementById('btn-speed-refresh');
  if (fabBtn) fabBtn.classList.add('visible');

  // ✅ Lista de correos autorizados eliminada (ahora se gestiona por curso)

  // Refresh inmediato adicional para limpiar datos obsoletos al abrir
  if (hasRemote()) {
    setTimeout(async () => {
      // ✅ Verificar si hay un input enfocado O un formulario de edición abierto
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
      const hasEditFormOpen = document.querySelector('[data-edit-form]') !== null;

      if (isInputFocused || hasEditFormOpen) {
        log('[SYNC] ⏭️ Saltando refresh inmediato: usuario escribiendo o editando');
        return;
      }

      log('[SYNC] Refresh inmediato adicional al mostrar master...');
      const hexes = Object.keys(ACCESS_HASH_MAP).filter(h => h !== MASTER_HASH);
      const results = await Promise.allSettled(
        hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
          warn('[SYNC] Error en refresh inmediato:', e);
          return false;
        }))
      );
      const anyUpdated = results.some(r =>
        r.status === 'fulfilled' && r.value === true
      );

      // ✅ NUEVO: También refrescar cursos personalizados
      await refreshCustomCourses();

      if (anyUpdated) {
        log('[SYNC] ✅ Cambios detectados en refresh inmediato, actualizando...');
        buildMasterGrid();
      }
    }, 500); // Esperar 500ms después de mostrar para no bloquear
  }
}

// ✅ Navegación entre pestañas en vista maestra
function setupMasterNavigation() {
  const navTabCourses = $('#nav-tab-courses');
  const navTabCertificates = $('#nav-tab-certificates');
  const coursesView = $('#master-courses-view');
  const certificatesView = $('#master-certificates-view');

  if (navTabCourses && navTabCertificates) {
    // Navegar a Cursos
    navTabCourses.addEventListener('click', () => {
      navTabCourses.classList.add('active');
      navTabCertificates.classList.remove('active');
      if (coursesView) coursesView.classList.remove('hidden');
      if (certificatesView) certificatesView.classList.add('hidden');
    });

    // Navegar a Certificados
    navTabCertificates.addEventListener('click', () => {
      navTabCertificates.classList.add('active');
      navTabCourses.classList.remove('active');
      if (certificatesView) certificatesView.classList.remove('hidden');
      if (coursesView) coursesView.classList.add('hidden');
      // Configurar menú de ajustes de certificados
      setupSettingsMenuCertificates();
    });
  }

  // Botón salir desde vista de certificados
  const btnMasterExitCert = $('#btn-master-exit-cert');
  if (btnMasterExitCert) {
    btnMasterExitCert.addEventListener('click', () => {
      // Usar la misma función de salir que el botón principal
      const btnMasterExit = $('#btn-master-exit');
      if (btnMasterExit) btnMasterExit.click();
    });
  }
}

/* ============ loader ============ */
const loaderEl = document.getElementById('eduLoader');
// ✅ Referencias a elementos antiguos del loader eliminadas (nuevo loader tiene animación automática)
function showLoader() { if (!loaderEl) return; loaderEl.classList.remove('hidden'); loaderEl.setAttribute('aria-hidden', 'false'); }
function hideLoader() { if (!loaderEl) return; loaderEl.classList.add('hidden'); loaderEl.setAttribute('aria-hidden', 'true'); }
const LOAD_DURATION_MS = 1600;
function runLoader(durationMs = LOAD_DURATION_MS) {
  return new Promise((resolve) => {
    if (!loaderEl) { resolve(); return; }
    showLoader();

    // ✅ Obtener el elemento de la barra de progreso
    const liquidFill = loaderEl.querySelector('.liquid-fill');
    if (!liquidFill) {
      setTimeout(() => { hideLoader(); resolve(); }, durationMs);
      return;
    }

    // ✅ Iniciar la barra en 4px (mínimo)
    liquidFill.style.width = '4px';

    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);

      // ✅ Función de easing para animación suave
      const ease = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

      // ✅ Calcular ancho (de 4px a 100% - 4px)
      const trackWidth = 180; // Ancho del track
      const padding = 4; // Padding total (2px cada lado)
      const maxWidth = trackWidth - padding;
      const currentWidth = 4 + (ease * (maxWidth - 4));
      const percentWidth = (currentWidth / trackWidth) * 100;

      liquidFill.style.width = percentWidth + '%';

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        // ✅ Asegurar que se llene completamente al final
        liquidFill.style.width = 'calc(100% - 4px)';
        setTimeout(() => { hideLoader(); resolve(); }, 200);
      }
    }

    requestAnimationFrame(frame);
  });
}

/* ============ render curso (1) ============ */
function renderCourse(keyHex) {
  const mergedMap = getMergedAccessHashMap();
  const data = mergedMap[keyHex];
  if (!data) return;

  // ✅ Verificar si es necesario renderizar (memoización)
  // ✅ PERO: Si lastRenderCourseHex fue invalidado (null), forzar renderizado
  const shouldForceRender = lastRenderCourseHex === null;

  if (!shouldForceRender && !shouldRenderCourse(keyHex, data)) {
    // ✅ CRÍTICO: Aunque no se renderice todo, SIEMPRE actualizar la lista de archivos
    // porque los archivos pueden haber cambiado en localStorage
    const list = $('#filelist');
    if (list) {
      list.innerHTML = '';
      const files = getFilesForHex(keyHex);

      // ✅ PREVENIR DUPLICADOS
      const seen = new Set();
      const uniqueFiles = (files || []).filter(item => {
        const key = item.firebaseId || `${item.url}|||${item.label}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      uniqueFiles.forEach(item => {
        const row = document.createElement('div');
        row.className = 'file';
        let host = '';
        try { host = new URL(item.url).hostname; } catch { host = ''; }

        row.dataset.fileLabel = (item.label || '').toLowerCase();
        row.dataset.fileHost = (host || '').toLowerCase();

        const safeLabel = escapeHTML(item.label || '');
        const safeHost = escapeHTML(host);
        row.innerHTML = `<div><strong>${safeLabel}</strong><div class="meta">${safeHost}</div></div>`;
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.type = 'button';
        btn.textContent = 'Ver más';
        btn.setAttribute('aria-label', `Ver o descargar archivo: ${item.label || 'Archivo'}`);
        btn.addEventListener('click', () => downloadFile(item.url, item.label));
        row.appendChild(btn);
        list.appendChild(row);
      });

      // ✅ Actualizar contador de archivos
      const filesCountEl = $('#files-count');
      if (filesCountEl) {
        filesCountEl.textContent = (uniqueFiles || []).length;
      }
    }
    return;
  }

  // ✅ Guardar hex globalmente para el botón de sincronización forzada
  window.currentCourseHex = keyHex;

  // ✅ FIREBASE: Inicializar listener en tiempo real (solo si no está activo)
  if (typeof initFirestoreRealtime === 'function') {
    // Limpiar flag de renderizado antes de inicializar
    window.isRenderingCourse = null;
    initFirestoreRealtime(keyHex);
  }

  // ✅ Mostrar clasificación del curso (badge en la parte superior)
  const courseType = data.type || 'curso';
  const typeLabels = {
    'curso': '<i class="ph ph-book-open"></i> Curso',
    'diplomado': '<i class="ph ph-graduation-cap"></i> Diplomado',
    'webinar': '<i class="ph ph-monitor"></i> Webinar',
    'seminario': '<i class="ph ph-note"></i> Seminario',
    'taller': '<i class="ph ph-wrench"></i> Taller'
  };
  const typeLabel = typeLabels[courseType] || '<i class="ph ph-book-open"></i> Curso';

  // ✅ Obtener el contenedor del título (el div que contiene courseTitle y courseMeta)
  const titleContainer = $('#courseTitle')?.parentElement;
  if (titleContainer) {
    // Verificar si ya existe un badge de clasificación y eliminarlo
    const existingBadge = titleContainer.querySelector('.course-type-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    // Crear y agregar badge de clasificación ANTES del título
    const typeBadge = document.createElement('div');
    typeBadge.className = 'course-type-badge';
    typeBadge.style.cssText = 'font-size: 11px; font-weight: 600; color: var(--accent); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; display: block; line-height: 1.4;';
    typeBadge.innerHTML = typeLabel;

    // Insertar antes del título (h3)
    const titleElement = $('#courseTitle');
    if (titleElement && titleElement.parentElement === titleContainer) {
      titleContainer.insertBefore(typeBadge, titleElement);
    } else {
      // Si no se puede insertar antes del título, agregarlo al inicio del contenedor
      if (titleContainer.firstChild) {
        titleContainer.insertBefore(typeBadge, titleContainer.firstChild);
      } else {
        titleContainer.appendChild(typeBadge);
      }
    }

    log('[RENDER COURSE] ✅ Badge de clasificación agregado:', typeLabel);
  } else {
    warn('[RENDER COURSE] ⚠️ No se encontró el contenedor del título');
  }

  // ✅ Actualizar título y meta
  const titleEl = $('#courseTitle');
  if (titleEl) {
    titleEl.textContent = data.title;
  }
  const metaEl = $('#courseMeta');
  if (metaEl) {
    metaEl.textContent = data.meta || '';
  }

  const list = $('#filelist');
  list.innerHTML = '';
  const files = getFilesForHex(keyHex);

  // ✅ Configurar búsqueda de archivos
  setupFilesSearch(keyHex, list);

  // ✅ Actualizar contador de archivos
  const filesCountEl = $('#files-count');
  if (filesCountEl) {
    filesCountEl.textContent = (files || []).length;
  }

  // ✅ PREVENIR DUPLICADOS al renderizar: usar Set para identificar únicos por firebaseId o URL+Label
  const seen = new Set();
  const uniqueFiles = (files || []).filter(item => {
    const key = item.firebaseId || `${item.url}|||${item.label}`;
    if (seen.has(key)) {
      log('[RENDER] ⚠️ Duplicado filtrado al renderizar:', item.label);
      return false;
    }
    seen.add(key);
    return true;
  });

  uniqueFiles.forEach(item => {
    const row = document.createElement('div');
    row.className = 'file';
    let host = '';
    try { host = new URL(item.url).hostname; } catch { host = ''; }

    // ✅ Agregar atributos para búsqueda
    row.dataset.fileLabel = (item.label || '').toLowerCase();
    row.dataset.fileHost = host.toLowerCase();

    // ✅ Sanitizar para prevenir XSS
    const safeLabel = escapeHTML(item.label || '');
    const safeHost = escapeHTML(host);
    row.innerHTML = `<div><strong>${safeLabel}</strong><div class="meta">${safeHost}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = 'Ver más';
    btn.setAttribute('aria-label', `Ver o descargar archivo: ${item.label || 'Archivo'}`);
    btn.addEventListener('click', () => downloadFile(item.url, item.label));
    row.appendChild(btn);
    list.appendChild(row);
  });

  // ✅ Aplicar lazy loading a imágenes si las hay
  setupLazyImages(list);

  // Tarjeta imagen - ✅ Con estilos variant y accent
  try {
    const left = document.querySelector('#courseCard .card-left-wrapper');
    if (left) {
      left.innerHTML = '';
      let wrapper = null;
      if (window.insertElectricCard) {
        // ✅ Pasar variant y accent al crear la tarjeta
        const variant = data.card?.variant || 'dramatic';
        const accent = data.card?.accent || '#5aa9ff';
        wrapper = window.insertElectricCard(left, variant, accent);
      }
      if (wrapper && data.card?.img && window.setCardImage) {
        window.setCardImage(wrapper, addCacheBuster(data.card.img));
      }
    }
  } catch (e) { warn('No se pudo insertar la tarjeta:', e); }

  // ❌ NO iniciar polling automático (el usuario sincroniza manualmente con el botón)
  // startPeriodicRefresh(keyHex);
}

/**
 * ✅ FUNCIÓN: Actualizar SOLO la lista de archivos sin pasar por memoización
 * Usar cuando se agrega/elimina un enlace para actualización inmediata
 */
function updateFileListOnly(keyHex) {
  const list = $('#filelist');
  if (!list) {
    log('[UPDATE FILE LIST] ⚠️ Lista de archivos no encontrada');
    return;
  }

  log('[UPDATE FILE LIST] 🔄 Actualizando lista de archivos para:', keyHex.substring(0, 8));

  list.innerHTML = '';
  const files = getFilesForHex(keyHex);

  // ✅ PREVENIR DUPLICADOS
  const seen = new Set();
  const uniqueFiles = (files || []).filter(item => {
    const key = item.firebaseId || `${item.url}|||${item.label}`;
    if (seen.has(key)) {
      log('[UPDATE FILE LIST] ⚠️ Duplicado filtrado:', item.label);
      return false;
    }
    seen.add(key);
    return true;
  });

  uniqueFiles.forEach(item => {
    const row = document.createElement('div');
    row.className = 'file';
    let host = '';
    try { host = new URL(item.url).hostname; } catch { host = ''; }

    row.dataset.fileLabel = (item.label || '').toLowerCase();
    row.dataset.fileHost = host.toLowerCase();

    const safeLabel = escapeHTML(item.label || '');
    const safeHost = escapeHTML(host);
    row.innerHTML = `<div><strong>${safeLabel}</strong><div class="meta">${safeHost}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = 'Ver más';
    btn.setAttribute('aria-label', `Ver o descargar archivo: ${item.label || 'Archivo'}`);
    btn.addEventListener('click', () => downloadFile(item.url, item.label));
    row.appendChild(btn);
    list.appendChild(row);
  });

  // ✅ Actualizar contador de archivos
  const filesCountEl = $('#files-count');
  if (filesCountEl) {
    filesCountEl.textContent = (uniqueFiles || []).length;
  }

  // ✅ Reconfigurar búsqueda de archivos
  setupFilesSearch(keyHex, list);

  log('[UPDATE FILE LIST] ✅ Lista actualizada:', uniqueFiles.length, 'archivos');
}

/* ============ render user view ============ */
function buildUserGrid() {
  const grid = $('#userGrid');
  const emptyState = $('#userEmptyState');
  if (!grid) return;

  grid.innerHTML = '';

  const mergedMap = getMergedAccessHashMap();
  const allowedCourses = window.allowedCoursesForUser || [];

  if (allowedCourses.length === 0) {
    grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  grid.style.display = 'grid';

  // Filtrar solo cursos permitidos
  const coursesToShow = allowedCourses
    .map(hex => {
      const data = mergedMap[hex];
      return data ? [hex, data] : null;
    })
    .filter(Boolean);

  // Ordenar por título (A-Z)
  coursesToShow.sort(([hexA, dataA], [hexB, dataB]) => {
    return (dataA.title || '').localeCompare(dataB.title || '');
  });

  coursesToShow.forEach(([hex, data]) => {
    if (hex === MASTER_HASH) return;

    const cardEl = document.createElement('div');
    cardEl.className = 'master-card';
    cardEl.style.cssText = 'position:relative; overflow:hidden; width:100%; display:flex; flex-direction:column;';

    // ✅ Contenedor para imagen
    const cardContent = document.createElement('div');
    cardContent.style.cssText = 'position:relative; width:100%; flex-shrink:0;';

    // ✅ Badge de tipo en la parte superior izquierda
    const courseType = data.type || 'curso';
    const typeLabels = {
      'curso': '<i class="ph ph-book-open"></i> Curso',
      'diplomado': '<i class="ph ph-graduation-cap"></i> Diplomado',
      'webinar': '<i class="ph ph-monitor"></i> Webinar',
      'seminario': '<i class="ph ph-note"></i> Seminario',
      'taller': '<i class="ph ph-wrench"></i> Taller'
    };
    const typeLabel = typeLabels[courseType] || '<i class="ph ph-book-open"></i> Curso';

    const typeBadge = document.createElement('div');
    typeBadge.style.cssText = 'position:absolute; top:12px; left:12px; z-index:10; padding:6px 12px; background:rgba(0,0,0,0.7); backdrop-filter:blur(8px); border-radius:20px; font-size:11px; font-weight:600; color:#ffffff; text-transform:uppercase; letter-spacing:0.5px; pointer-events:none;';
    typeBadge.innerHTML = typeLabel;
    cardContent.appendChild(typeBadge);

    // ✅ Imagen del curso
    if (data.card?.img) {
      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = 'position:relative; width:100%; height:220px; border-radius:12px 12px 0 0; overflow:hidden;';

      // ✅ Placeholder de carga (skeleton)
      const loadingPlaceholder = document.createElement('div');
      loadingPlaceholder.className = 'image-loading-placeholder';
      loadingPlaceholder.style.cssText = 'position:absolute; inset:0; background:linear-gradient(90deg, rgba(90,169,255,0.1) 0%, rgba(90,169,255,0.2) 50%, rgba(90,169,255,0.1) 100%); background-size:200% 100%; animation:shimmer 1.5s infinite; display:flex; align-items:center; justify-content:center;';
      loadingPlaceholder.innerHTML = '<div style="font-size:24px; opacity:0.5; display:flex; align-items:center; justify-content:center;"><i class="ph ph-image" style="font-size:24px;"></i></div>';
      imgContainer.appendChild(loadingPlaceholder);

      const img = document.createElement('img');
      const imgUrl = addCacheBuster(data.card.img);
      img.style.cssText = 'width:100%; height:100%; object-fit:cover; display:block; opacity:0; transition:opacity 0.3s ease;';
      img.alt = data.title || 'Curso';
      img.loading = 'lazy';

      // ✅ Manejador de carga exitosa
      img.onload = function () {
        console.log('[IMAGE] ✅ Imagen cargada correctamente:', imgUrl);
        // Ocultar placeholder y mostrar imagen
        if (loadingPlaceholder.parentNode) {
          loadingPlaceholder.style.opacity = '0';
          setTimeout(() => {
            if (loadingPlaceholder.parentNode) {
              loadingPlaceholder.remove();
            }
          }, 300);
        }
        img.style.opacity = '1';
      };

      // ✅ Manejador de errores para imágenes rotas
      img.onerror = function () {
        console.error('[IMAGE] ❌ Error cargando imagen:', imgUrl);
        // Ocultar placeholder
        if (loadingPlaceholder.parentNode) {
          loadingPlaceholder.remove();
        }
        // Reemplazar con placeholder de error
        img.style.display = 'none';
        const errorPlaceholder = document.createElement('div');
        errorPlaceholder.style.cssText = 'width:100%; height:100%; background:linear-gradient(135deg, rgba(255,122,122,0.2), rgba(255,122,122,0.05)); display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--danger); gap:8px;';
        errorPlaceholder.innerHTML = '<span style="font-size:32px; display:flex; align-items:center; justify-content:center;"><i class="ph ph-image" style="font-size:32px;"></i></span><span style="font-size:12px; text-align:center; padding:0 12px;">Imagen no disponible</span>';
        imgContainer.appendChild(errorPlaceholder);
      };

      img.src = imgUrl;
      imgContainer.appendChild(img);
      cardContent.appendChild(imgContainer);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width:100%; height:220px; background:linear-gradient(135deg, rgba(90,169,255,0.2), rgba(90,169,255,0.05)); display:flex; align-items:center; justify-content:center; color:var(--muted); border-radius:12px 12px 0 0;';
      placeholder.textContent = 'Sin imagen';
      cardContent.appendChild(placeholder);
    }

    // ✅ Botón "Abrir" fuera de la imagen, debajo
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'padding:16px; background:var(--card-bg, rgba(255,255,255,0.02)); border:1px solid rgba(255,255,255,0.06); border-top:none; border-radius:0 0 12px 12px; flex-shrink:0;';

    const openBtn = document.createElement('button');
    openBtn.className = 'btn';
    openBtn.type = 'button';
    openBtn.textContent = 'Abrir';
    openBtn.style.cssText = 'width:100%;';
    openBtn.setAttribute('aria-label', `Abrir curso: ${data.title || 'Curso'}`);
    openBtn.setAttribute('title', `Abrir el curso "${data.title || 'Curso'}"`);

    // ✅ Función para abrir el curso (reutilizable)
    const openCourse = async (e) => {
      if (e) {
        e.stopPropagation();
      }

      // Verificar acceso
      if (window.currentUserEmail) {
        const hasAccess = await checkEmailAllowedForCourse(window.currentUserEmail, hex);
        if (!hasAccess) {
          if (typeof window.showToast === 'function') {
            window.showToast('Acceso denegado', 'No tienes permiso para acceder a este curso', 'error');
          } else {
            alert('No tienes permiso para acceder a este curso.');
          }
          return;
        }
      }

      showLoader();

      if (hasRemote()) {
        await refreshFromRemoteSilent(hex).catch(e => {
          warn('[SYNC] Error en refresh:', e);
          return false;
        });
      }

      await runLoader();

      // ✅ Marcar que estamos en un curso desde vista de usuario
      window.isFromUserView = true;
      currentKeyHex = hex;
      renderCourse(hex);
      showContent();
    };

    // ✅ Event listener en el botón
    openBtn.addEventListener('click', openCourse);

    // ✅ Event listener en toda la tarjeta
    cardEl.style.cursor = 'pointer';
    cardEl.addEventListener('click', openCourse);

    buttonContainer.appendChild(openBtn);
    cardEl.appendChild(cardContent);
    cardEl.appendChild(buttonContainer);
    grid.appendChild(cardEl);
  });

  // ✅ Finalizar medición de renderizado
  endPerformanceMeasure('Renderizado del grid', gridStart, {
    cursos: coursesArray.length,
    paginado: coursesArray.length > COURSES_PER_PAGE
  });

  // ✅ Aplicar lazy loading a todas las imágenes del grid
  setupLazyImages(grid);
}

/* ============ render master ============ */
function buildMasterGrid() {
  // ✅ VALIDACIÓN: Si no es master, redirigir
  if (!isMasterAuthenticated && currentKeyHex !== MASTER_HASH) {
    console.error('[SECURITY] ❌ Intento de construir grid master sin autorización');
    // Si el usuario está autenticado con email, redirigir a vista de usuario
    if (window.currentUserEmail && window.allowedCoursesForUser) {
      showUserView();
    } else {
      showAccess();
    }
    return;
  }

  // ✅ Limpiar cachés cuando se reconstruye el grid
  clearSearchCache();
  if (typeof window.invalidateSuggestionsCache === 'function') {
    window.invalidateSuggestionsCache();
  }

  // ✅ Iniciar medición de renderizado del grid
  const gridStart = startPerformanceMeasure('Renderizado del grid');

  const mergedMap = getMergedAccessHashMap();

  // ✅ Verificar si es necesario renderizar (memoización)
  if (!shouldBuildMasterGrid(mergedMap)) {
    log('[RENDER] ⏸️ Grid no necesita re-render, datos sin cambios');
    return;
  }

  const grid = $('#masterGrid');
  grid.innerHTML = '';

  initFirebaseCustomCoursesRealtime();

  // ✅ Actualizar estadísticas (después de inicializar Firebase)
  updateMasterStats(mergedMap).catch(e => warn('[STATS] Error actualizando estadísticas:', e));

  // ✅ Paginación: solo si hay muchos cursos (más de 12)
  let coursesArray = Object.entries(mergedMap).filter(([hex]) => hex !== MASTER_HASH);

  // ✅ Si el usuario está autenticado con email, filtrar solo cursos permitidos
  // Si está autenticado con código master, mostrar todos los cursos
  const isEmailAuth = window.currentUserEmail && !currentKeyHex;
  if (isEmailAuth && window.allowedCoursesForUser) {
    coursesArray = coursesArray.filter(([hex]) => {
      return window.allowedCoursesForUser.includes(hex);
    });
    log('[MASTER] Filtrando cursos para email:', window.currentUserEmail, '- Cursos permitidos:', coursesArray.length);
  }

  // ✅ Aplicar filtros avanzados (si están activos)
  if (advancedFiltersState && advancedFiltersState.active) {
    // Filtro por tipo
    if (advancedFiltersState.type) {
      coursesArray = coursesArray.filter(([hex, data]) => {
        const courseType = (data?.type || 'curso').toLowerCase();
        return courseType === advancedFiltersState.type.toLowerCase();
      });
    }

    // Filtro por tag
    if (advancedFiltersState.tag) {
      const tagFilter = advancedFiltersState.tag.trim().toLowerCase();
      coursesArray = coursesArray.filter(([hex, data]) => {
        const tag = (data?.card?.tag || '').toLowerCase();
        return tag.includes(tagFilter);
      });
    }

    // Aplicar ordenamiento
    const sortBy = advancedFiltersState.sort || 'title-asc';
    coursesArray.sort(([hexA, dataA], [hexB, dataB]) => {
      if (sortBy === 'title-asc') {
        return (dataA.title || '').localeCompare(dataB.title || '');
      } else if (sortBy === 'title-desc') {
        return (dataB.title || '').localeCompare(dataA.title || '');
      } else if (sortBy === 'tag-asc') {
        const tagA = (dataA.card?.tag || '').toLowerCase();
        const tagB = (dataB.card?.tag || '').toLowerCase();
        return tagA.localeCompare(tagB);
      } else if (sortBy === 'date-desc') {
        const dateA = dataA.createdAt || dataA.updatedAt || 0;
        const dateB = dataB.createdAt || dataB.updatedAt || 0;
        return dateB - dateA; // Más recientes primero
      } else if (sortBy === 'date-asc') {
        const dateA = dataA.createdAt || dataA.updatedAt || 0;
        const dateB = dataB.createdAt || dataB.updatedAt || 0;
        return dateA - dateB; // Más antiguos primero
      }
      return 0;
    });
  } else {
    // ✅ Si no hay filtros avanzados activos, ordenar por defecto (título A-Z)
    coursesArray.sort(([hexA, dataA], [hexB, dataB]) => {
      return (dataA.title || '').localeCompare(dataB.title || '');
    });
  }

  const COURSES_PER_PAGE = 12;
  const totalPages = Math.ceil(coursesArray.length / COURSES_PER_PAGE);

  let currentPage = 1;
  const pageKey = 'masterGridCurrentPage';
  try {
    const savedPage = sessionStorage.getItem(pageKey);
    if (savedPage) currentPage = parseInt(savedPage, 10) || 1;
  } catch (e) { }

  // ✅ Si hay más de 12 cursos, implementar paginación
  const coursesToRender = coursesArray.length > COURSES_PER_PAGE
    ? coursesArray.slice((currentPage - 1) * COURSES_PER_PAGE, currentPage * COURSES_PER_PAGE)
    : coursesArray;

  coursesToRender.forEach(([hex, data]) => {
    // excluir el master si algún día lo metes en el mismo objeto
    if (hex === MASTER_HASH) return;

    const cardEl = document.createElement('div');
    cardEl.className = 'master-card';
    cardEl.dataset.title = (data.title || '').toLowerCase();
    cardEl.dataset.tag = (data.card?.tag || '').toLowerCase();
    cardEl.dataset.type = (data.type || 'curso').toLowerCase(); // ✅ Para búsqueda por tipo

    const left = document.createElement('div');
    left.className = 'left';
    const right = document.createElement('div');
    right.className = 'right';

    // cabecera derecha (clasificación + título + meta + código secreto + botón abrir curso)
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;';
    const t = document.createElement('div');

    // ✅ Mostrar clasificación del curso (badge en la parte superior)
    const courseType = data.type || 'curso';
    const typeLabels = {
      'curso': '<i class="ph ph-book-open"></i> Curso',
      'diplomado': '<i class="ph ph-graduation-cap"></i> Diplomado',
      'webinar': '<i class="ph ph-monitor"></i> Webinar',
      'seminario': '<i class="ph ph-note"></i> Seminario',
      'taller': '<i class="ph ph-wrench"></i> Taller'
    };
    const typeLabel = typeLabels[courseType] || '<i class="ph ph-book-open"></i> Curso';

    const typeBadge = document.createElement('div');
    typeBadge.style.cssText = 'font-size: 11px; font-weight: 600; color: var(--accent); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;';
    typeBadge.innerHTML = typeLabel;
    t.appendChild(typeBadge);

    // ✅ Crear título y meta
    const titleDiv = document.createElement('div');
    titleDiv.style.fontWeight = '700';
    titleDiv.textContent = data.title;
    t.appendChild(titleDiv);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'meta';
    metaDiv.textContent = data.meta || '';
    t.appendChild(metaDiv);

    // ✅ Mostrar código secreto solo en la vista maestra y solo si existe
    if (isCustomCourse(hex)) {
      const customCourses = loadCustomCourses();
      const courseData = customCourses[hex];
      const codeToShow = courseData?.code || data.code || '';

      // Crear elemento clickeable para el código
      if (codeToShow) {
        const codeDiv = document.createElement('div');
        codeDiv.style.cssText = 'font-size: 11px; color: var(--accent); margin-top: 4px; font-family: monospace; background: rgba(90,169,255,0.1); padding: 4px 8px; border-radius: 4px; display: inline-block; cursor: pointer; transition: all 0.2s;';
        codeDiv.title = 'Click para copiar código';
        // ✅ Sanitizar código antes de usar en innerHTML
        const safeCode = sanitizeHTML(codeToShow);
        codeDiv.innerHTML = `<i class="ph ph-key"></i> Código: ${safeCode} <i class="ph ph-clipboard"></i>`;
        codeDiv.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(codeToShow);
            codeDiv.style.background = 'rgba(90,169,255,0.3)';
            setTimeout(() => {
              codeDiv.style.background = 'rgba(90,169,255,0.1)';
            }, 300);
            if (typeof window.showSuccessModal === 'function') {
              window.showSuccessModal('Código copiado', `El código "${codeToShow}" ha sido copiado al portapapeles`);
            } else {
              alert(`Código copiado: ${codeToShow}`);
            }
          } catch (err) {
            console.error('Error copiando código:', err);
            alert('Error al copiar código');
          }
        });
        t.appendChild(codeDiv);
      }
    }

    const headerActions = document.createElement('div');
    headerActions.style.cssText = 'display:flex; gap:8px;';

    const open = document.createElement('button');
    open.className = 'btn secondary';
    open.type = 'button';
    open.textContent = 'Abrir curso';
    open.setAttribute('aria-label', `Abrir curso: ${data.title || 'Curso'}`);
    open.setAttribute('title', `Abrir el curso "${data.title || 'Curso'}"`);
    open.addEventListener('click', async () => {
      // ✅ Verificar acceso por email si el usuario está autenticado con email
      const isEmailAuth = window.currentUserEmail && !currentKeyHex;
      if (isEmailAuth) {
        const hasAccess = await checkEmailAllowedForCourse(window.currentUserEmail, hex);
        if (!hasAccess) {
          if (typeof window.showToast === 'function') {
            window.showToast('Acceso denegado', 'No tienes permiso para acceder a este curso', 'error');
          } else {
            alert('No tienes permiso para acceder a este curso.');
          }
          return;
        }
      }

      // Mostrar loader inmediatamente
      showLoader();

      // ✅ NUEVO: Esperar a que termine el refresh ANTES de cerrar el loader
      if (hasRemote()) {
        log('[SYNC] Iniciando refresh antes del loader...');
        await refreshFromRemoteSilent(hex).catch(e => {
          warn('[SYNC] Error en refresh:', e);
          return false;
        });
        log('[SYNC] ✅ Refresh completado, cerrando loader...');
      }

      // Ejecutar animación de loader ahora que ya tenemos los datos
      await runLoader();

      // ✅ Limpiar flag cuando se abre desde master (no desde vista de usuario)
      window.isFromUserView = false;
      currentKeyHex = hex;
      renderCourse(hex);
      showContent();
    });
    headerActions.appendChild(open);

    // ✅ Botón para gestionar correos permitidos (solo visible para master con código)
    // No mostrar si el usuario está autenticado con email
    const isEmailAuth = window.currentUserEmail && !currentKeyHex;
    if (!isEmailAuth) {
      const btnEmails = document.createElement('button');
      btnEmails.className = 'btn secondary';
      btnEmails.type = 'button';
      btnEmails.innerHTML = '<i class="ph ph-envelope"></i> Correos';
      btnEmails.setAttribute('aria-label', `Gestionar correos permitidos para: ${data.title || 'Curso'}`);
      btnEmails.setAttribute('title', `Gestionar qué correos pueden acceder a "${data.title || 'Curso'}"`);
      btnEmails.addEventListener('click', () => {
        showCourseEmailsModal(hex, data.title || 'Curso');
      });
      headerActions.appendChild(btnEmails);
    }

    // Botones de editar y eliminar solo para cursos personalizados
    if (isCustomCourse(hex)) {
      // Botón editar curso
      const btnEditCourse = document.createElement('button');
      btnEditCourse.className = 'btn secondary';
      btnEditCourse.type = 'button';
      btnEditCourse.innerHTML = '<i class="ph ph-pencil"></i> Editar';
      btnEditCourse.setAttribute('aria-label', `Editar curso: ${data.title || 'Curso'}`);
      btnEditCourse.setAttribute('title', `Editar el curso "${data.title || 'Curso'}"`);
      btnEditCourse.addEventListener('click', () => {
        // Abrir modal de edición con datos del curso
        if (typeof window.openEditCourseModal === 'function') {
          window.openEditCourseModal(hex, data);
        }
      });
      headerActions.appendChild(btnEditCourse);

      // Botón duplicar curso
      const btnDuplicate = document.createElement('button');
      btnDuplicate.className = 'btn secondary';
      btnDuplicate.type = 'button';
      btnDuplicate.innerHTML = '<i class="ph ph-copy"></i> Duplicar';
      btnDuplicate.setAttribute('aria-label', `Duplicar curso: ${data.title || 'Curso'}`);
      btnDuplicate.setAttribute('title', `Duplicar el curso "${data.title || 'Curso'}" con un nuevo código`);
      btnDuplicate.addEventListener('click', async () => {
        // Generar código sugerido
        const suggestedCode = `${data.card?.tag || 'CURSO'}_${Date.now()}`;

        // ✅ Usar modal elegante en lugar de prompt
        if (typeof window.showDuplicateCodeModal === 'function') {
          window.showDuplicateCodeModal(suggestedCode, async (newCode) => {
            if (!newCode || !newCode.trim()) {
              return;
            }

            try {
              // Generar nuevo hex del código
              const newHex = await sha256Hex(newCode.trim());

              // Verificar que el código no exista
              const existingCourses = getMergedAccessHashMap();
              if (existingCourses[newHex]) {
                if (typeof window.showSuccessModal === 'function') {
                  window.showSuccessModal('Error', 'Este código ya existe. Use otro.');
                } else {
                  alert('Este código ya existe. Use otro.');
                }
                return;
              }

              // Crear copia del curso con nuevo código
              const duplicatedCourse = {
                title: `${data.title} (Copia)`,
                meta: data.meta || '',
                files: [...(data.files || [])], // Copiar array de archivos
                code: newCode.trim(),
                card: {
                  ...data.card,
                  tag: `${data.card?.tag || 'TAG'}_COPY`,
                  seed: Math.floor(Math.random() * 100) // Nuevo seed para variación visual
                }
              };

              // Guardar curso duplicado
              await addCustomCourse(newHex, duplicatedCourse);

              // Reconstruir grid
              buildMasterGrid();

              // Mostrar éxito
              if (typeof window.showSuccessModal === 'function') {
                window.showSuccessModal(
                  '¡Curso Duplicado!',
                  `El curso ha sido duplicado con el código: ${newCode.trim()}`
                );
              } else {
                alert(`Curso duplicado con código: ${newCode.trim()}`);
              }

              // Analytics tracking
              if (typeof gtag !== 'undefined') {
                gtag('event', 'course_duplicated', {
                  'event_category': 'management',
                  'event_label': data.card?.tag || 'unknown'
                });
              }
            } catch (error) {
              console.error('[DUPLICATE] Error:', error);
              if (typeof window.showSuccessModal === 'function') {
                window.showSuccessModal('Error', 'Error al duplicar el curso: ' + (error.message || 'Error desconocido'));
              } else {
                alert('Error al duplicar el curso: ' + (error.message || 'Error desconocido'));
              }
            }
          });
        } else {
          // Fallback a prompt si el modal no está disponible
          const newCode = prompt('Ingresa un nuevo código secreto para el curso duplicado:', suggestedCode);
          if (!newCode || !newCode.trim()) {
            return;
          }

          try {
            // Generar nuevo hex del código
            const newHex = await sha256Hex(newCode.trim());

            // Verificar que el código no exista
            const existingCourses = getMergedAccessHashMap();
            if (existingCourses[newHex]) {
              alert('Este código ya existe. Use otro.');
              return;
            }

            // Crear copia del curso con nuevo código
            const duplicatedCourse = {
              title: `${data.title} (Copia)`,
              meta: data.meta || '',
              files: [...(data.files || [])],
              code: newCode.trim(),
              card: {
                ...data.card,
                tag: `${data.card?.tag || 'TAG'}_COPY`,
                seed: Math.floor(Math.random() * 100)
              }
            };

            await addCustomCourse(newHex, duplicatedCourse);
            buildMasterGrid();

            if (typeof window.showSuccessModal === 'function') {
              window.showSuccessModal('¡Curso Duplicado!', `El curso ha sido duplicado con el código: ${newCode.trim()}`);
            } else {
              alert(`Curso duplicado con código: ${newCode.trim()}`);
            }

            if (typeof gtag !== 'undefined') {
              gtag('event', 'course_duplicated', {
                'event_category': 'management',
                'event_label': data.card?.tag || 'unknown'
              });
            }
          } catch (error) {
            console.error('[DUPLICATE] Error:', error);
            alert('Error al duplicar el curso: ' + (error.message || 'Error desconocido'));
          }
        }
      });
      headerActions.appendChild(btnDuplicate);

      // Botón eliminar curso
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn';
      btnDelete.type = 'button';
      btnDelete.innerHTML = '<i class="ph ph-trash"></i> Eliminar';
      btnDelete.setAttribute('aria-label', `Eliminar curso: ${data.title || 'Curso'}`);
      btnDelete.setAttribute('title', `Eliminar el curso "${data.title || 'Curso'}" (acción irreversible)`);
      btnDelete.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
      btnDelete.addEventListener('click', async () => {
        // ✅ Mostrar modal de confirmación elegante
        window.showDeleteConfirmModal(data.title, async () => {
          // ✅ Rate limiting: prevenir eliminaciones repetidas
          if (!checkRateLimitSimple('eliminar curso')) {
            return;
          }

          // ✅ Obtener botón de confirmación y activar indicador de carga
          const confirmBtn = document.getElementById('deleteConfirmYes');
          let restoreButton = null;
          if (confirmBtn) {
            restoreButton = setButtonLoading(confirmBtn, 'Eliminando curso...', 'Curso eliminado');
          }

          log('[DELETE] Eliminando curso:', data.title);

          // ✅ Bloquear re-renders durante la eliminación
          userInteracting = true;

          try {
            // ✅ Eliminar curso (local, Firebase y respaldo)
            await removeCustomCourse(hex);

            // ✅ NO hacer refreshCustomCourses porque Firebase ya sincroniza en tiempo real
            // El listener de Firebase actualizará automáticamente la vista en todos los dispositivos
            // Solo hacer refresh si Firebase no está disponible
            const db = getFirestoreDB();
            if (!db) {
              log('[DELETE] Firebase no disponible, usando refresh manual');
              await refreshCustomCourses().catch(e => {
                warn('[DELETE] Error refrescando cursos después de eliminar (fallback):', e);
              });
            }

            // ✅ Restaurar botón con éxito
            if (restoreButton) {
              restoreButton(true, 'Curso eliminado');
            }

            // ✅ Desbloquear y re-renderizar inmediatamente
            userInteracting = false;
            buildMasterGrid();
            // ✅ Actualizar estadísticas después de eliminar
            setTimeout(() => updateMasterStats().catch(e => warn('[STATS] Error actualizando estadísticas:', e)), 100);
            log('[DELETE] ✅ Curso eliminado exitosamente');

            // Cerrar modal
            const deleteModal = document.getElementById('deleteConfirmModal');
            if (deleteModal) {
              deleteModal.classList.remove('show');
            }

            // Analytics tracking
            if (typeof gtag !== 'undefined') {
              gtag('event', 'course_deleted', {
                'event_category': 'management',
                'event_label': data.card?.tag || 'unknown'
              });
            }
          } catch (error) {
            console.error('[DELETE] Error eliminando curso:', error);
            // ✅ Restaurar botón con error
            if (restoreButton) {
              restoreButton(false, 'Error al eliminar');
            }
            userInteracting = false;
            alert('Error al eliminar el curso. Por favor, intente nuevamente.');
          }
        });
      });
      headerActions.appendChild(btnDelete);
    }

    header.appendChild(t);
    header.appendChild(headerActions);
    right.appendChild(header);

    // ✅ Actualizar estadísticas de archivos
    const files = getFilesForHex(hex);
    const filesCountEl = $('#files-count');
    if (filesCountEl) {
      filesCountEl.textContent = (files || []).length;
    }

    // lista de archivos (editable con DnD)
    const list = document.createElement('div');
    list.className = 'filelist';
    list.id = 'filelist';

    // ✅ Configurar búsqueda de archivos
    setupFilesSearch(hex, list);

    (files || []).forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'file';
      row.draggable = true;
      row.dataset.index = String(idx);
      let host = '';
      let fileType = 'file';
      try {
        const url = new URL(item.url);
        host = url.hostname;
        // Detectar tipo de archivo por extensión o dominio
        const path = url.pathname.toLowerCase();
        if (path.includes('.pdf')) fileType = 'pdf';
        else if (path.includes('.doc') || path.includes('.docx')) fileType = 'doc';
        else if (path.includes('.xls') || path.includes('.xlsx')) fileType = 'sheet';
        else if (path.includes('.ppt') || path.includes('.pptx')) fileType = 'presentation';
        else if (path.includes('.zip') || path.includes('.rar')) fileType = 'archive';
        else if (path.includes('.jpg') || path.includes('.png') || path.includes('.gif')) fileType = 'image';
        else if (host.includes('drive.google.com')) fileType = 'drive';
        else if (host.includes('youtube.com') || host.includes('youtu.be')) fileType = 'video';
      } catch { host = ''; }

      const leftInfo = document.createElement('div');
      leftInfo.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;';

      // ✅ Icono según tipo de archivo
      const icon = document.createElement('div');
      icon.style.cssText = 'font-size: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;';
      const icons = {
        'pdf': 'ph-file-pdf',
        'doc': 'ph-file-text',
        'sheet': 'ph-table',
        'presentation': 'ph-presentation',
        'archive': 'ph-package',
        'image': 'ph-image',
        'drive': 'ph-cloud',
        'video': 'ph-video',
        'file': 'ph-paperclip'
      };
      const iconClass = icons[fileType] || icons.file;
      const iconElement = document.createElement('i');
      iconElement.className = `ph ${iconClass}`;
      iconElement.style.cssText = 'font-size: 24px;';
      icon.appendChild(iconElement);

      const info = document.createElement('div');
      info.style.cssText = 'flex: 1; min-width: 0;';
      // ✅ Sanitizar para prevenir XSS
      const safeLabel = escapeHTML(item.label || '');
      const safeHost = escapeHTML(host);
      info.innerHTML = `<strong style="display: block; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeLabel}</strong><div class="meta" style="font-size: 12px; color: var(--muted);">${safeHost}</div>`;

      leftInfo.appendChild(icon);
      leftInfo.appendChild(info);

      // ✅ Agregar atributos para búsqueda
      row.dataset.fileLabel = (item.label || '').toLowerCase();
      row.dataset.fileHost = host.toLowerCase();

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';

      const btnOpen = document.createElement('button');
      btnOpen.className = 'btn';
      btnOpen.type = 'button';
      btnOpen.textContent = 'Descargar';
      btnOpen.setAttribute('aria-label', `Descargar archivo: ${item.label || 'Archivo'}`);
      btnOpen.addEventListener('click', () => downloadFile(item.url, item.label));

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn secondary';
      btnEdit.type = 'button';
      btnEdit.textContent = 'Editar';
      btnEdit.setAttribute('aria-label', `Editar archivo: ${item.label || 'Archivo'}`);
      btnEdit.addEventListener('click', () => {
        // ✅ Deshabilitar los 3 botones principales
        btnOpen.disabled = true;
        btnEdit.disabled = true;
        btnRemove.disabled = true;
        btnOpen.style.opacity = '0.5';
        btnEdit.style.opacity = '0.5';
        btnRemove.style.opacity = '0.5';
        btnOpen.style.cursor = 'not-allowed';
        btnEdit.style.cursor = 'not-allowed';
        btnRemove.style.cursor = 'not-allowed';

        // Crear inputs temporales para editar
        const editWrap = document.createElement('div');
        editWrap.dataset.editForm = 'true'; // Marcar para evitar refreshes
        editWrap.style.cssText = 'display:flex; flex-direction:column; gap:8px; margin-top:8px; padding:12px; background:#0e1630; border:1px solid rgba(255,255,255,.1); border-radius:8px;';

        const editLabel = document.createElement('input');
        editLabel.type = 'text';
        editLabel.value = item.label;
        editLabel.className = 'input';
        editLabel.placeholder = 'Etiqueta';

        const editUrl = document.createElement('input');
        editUrl.type = 'url';
        editUrl.value = item.url;
        editUrl.className = 'input';
        editUrl.placeholder = 'URL';

        const editActions = document.createElement('div');
        editActions.style.cssText = 'display:flex; gap:8px;';

        const btnSave = document.createElement('button');
        btnSave.className = 'btn';
        btnSave.textContent = 'Guardar';
        btnSave.addEventListener('click', async () => {
          // ✅ Sanitizar inputs
          const newLabel = safeInput(editLabel.value, 'text');
          const newUrl = safeInput(editUrl.value, 'url');
          if (!newLabel || !newUrl) {
            alert('Complete etiqueta y URL');
            return;
          }
          try {
            new URL(newUrl);
          } catch {
            alert('URL inválida');
            return;
          }

          const next = files.slice();
          next[idx] = { label: newLabel, url: newUrl };
          saveFilesOverride(hex, next);

          // ✅ ACTUALIZAR VISTA INMEDIATAMENTE (sin esperar nada)
          log('[EDIT] ✏️ Actualizando vista inmediatamente');
          const masterEl = document.getElementById('master');
          const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;
          if (isMasterView) {
            buildMasterGrid();
          } else {
            renderCourse(hex);
            // ✅ Actualizar contador de archivos
            const filesCountEl = $('#files-count');
            if (filesCountEl) {
              const updatedFiles = getFilesForHex(hex);
              filesCountEl.textContent = (updatedFiles || []).length;
            }
          }

          // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
          remoteSaveFiles(hex, next).then(editOk => {
            if (editOk) {
              log('[EDIT] ✅ Guardado en remoto exitoso');
              // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
              refreshFromRemoteSilent(hex).catch(() => { });
            } else {
              warn('[EDIT] ⚠️ Error guardando en remoto');
            }
          }).catch(e => {
            console.error('[EDIT] ❌ Error guardando en remoto:', e);
          });
        });

        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn secondary';
        btnCancel.textContent = 'Cancelar';
        btnCancel.addEventListener('click', () => {
          // ✅ Restaurar los 3 botones principales
          btnOpen.disabled = false;
          btnEdit.disabled = false;
          btnRemove.disabled = false;
          btnOpen.style.opacity = '';
          btnEdit.style.opacity = '';
          btnRemove.style.opacity = '';
          btnOpen.style.cursor = '';
          btnEdit.style.cursor = '';
          btnRemove.style.cursor = '';

          row.removeChild(editWrap);
        });

        editActions.appendChild(btnSave);
        editActions.appendChild(btnCancel);
        editWrap.appendChild(editLabel);
        editWrap.appendChild(editUrl);
        editWrap.appendChild(editActions);
        row.appendChild(editWrap);

        // Enfocar el primer input
        setTimeout(() => editLabel.focus(), 100);
      });

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn secondary';
      btnRemove.type = 'button';
      btnRemove.textContent = 'Quitar';
      btnRemove.setAttribute('aria-label', `Eliminar archivo: ${item.label || 'Archivo'}`);
      btnRemove.addEventListener('click', async () => {
        // ✅ ADVERTENCIA: Usar modal de confirmación elegante (igual que al eliminar curso)
        // Siempre usar el modal, nunca el confirm nativo del navegador
        // Pasar 'enlace' como tercer parámetro para que muestre el mensaje correcto
        window.showDeleteConfirmModal(`Enlace: ${item.label}`, async () => {
          // ✅ FIREBASE: Eliminar de Firebase primero si tiene firebaseId
          if (item.firebaseId && typeof window.eliminarLinkFirebase === 'function') {
            try {
              // ✅ Bloquear re-renders durante la eliminación
              userInteracting = true;

              log('[REMOVE] 🔥 Eliminando de Firebase:', item.firebaseId);
              await window.eliminarLinkFirebase(hex, item.firebaseId);
              log('[REMOVE] ✅ Eliminado de Firebase');

              // ✅ CRÍTICO: Actualizar localStorage INMEDIATAMENTE
              const currentFiles = getFilesForHex(hex);
              const updatedFiles = currentFiles.filter(f => f.firebaseId !== item.firebaseId);
              saveFilesOverride(hex, updatedFiles);
              log('[REMOVE] 💾 localStorage actualizado:', currentFiles.length, '→', updatedFiles.length);

              // ✅ Actualizar Google Sheets (sincronización)
              // Si no quedan más links, eliminar el hex completamente de la hoja de overrides
              if (updatedFiles.length === 0) {
                log('[REMOVE] 🧹 No quedan más links, eliminando hex de la hoja de overrides');
                remoteDeleteFiles(hex).catch(e => {
                  warn('[REMOVE] ⚠️ Error eliminando hex de Google Sheets:', e);
                });
              } else {
                remoteSaveFiles(hex, updatedFiles).catch(e => {
                  warn('[REMOVE] ⚠️ Error actualizando Google Sheets:', e);
                });
              }

              // ✅ Desbloquear y re-renderizar inmediatamente
              userInteracting = false;

              // ✅ CRÍTICO: Invalidar caché de memoización para forzar re-render
              lastMasterGridData = null;
              lastRenderCourseHex = null; // ✅ Invalidar también el caché del curso
              lastRenderCourseData = null;

              // ✅ Verificar si estamos en vista master Y autenticados
              const masterEl = document.getElementById('master');
              const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;
              if (isMasterView) {
                log('[REMOVE] ♻️ Re-renderizando Master');
                buildMasterGrid();
              } else {
                log('[REMOVE] ♻️ Actualizando lista de archivos inmediatamente');
                // ✅ ACTUALIZAR LISTA DE ARCHIVOS DIRECTAMENTE (sin memoización)
                updateFileListOnly(hex);
              }

              return;
            } catch (error) {
              console.error('[REMOVE] ❌ Error eliminando de Firebase, usando método local:', error);
              userInteracting = false;
              // Continuar con método local si Firebase falla
            }
          }

          // ✅ FALLBACK: Método local si no tiene firebaseId o Firebase falló
          // ✅ CRÍTICO: Identificar el elemento por url+label en lugar de índice
          const currentFiles = getFilesForHex(hex);
          const itemKey = item.firebaseId || `${item.url}|||${item.label}`;
          const updatedFiles = currentFiles.filter(f => {
            const fKey = f.firebaseId || `${f.url}|||${f.label}`;
            return fKey !== itemKey;
          });

          if (updatedFiles.length === currentFiles.length) {
            warn('[REMOVE] ⚠️ No se encontró el enlace a eliminar');
            return;
          }

          saveFilesOverride(hex, updatedFiles);
          log('[REMOVE] 💾 localStorage actualizado (método local):', currentFiles.length, '→', updatedFiles.length);

          // ✅ ACTUALIZAR VISTA INMEDIATAMENTE (sin esperar nada)
          log('[REMOVE] 🗑️ Eliminando archivo inmediatamente de la vista');

          // ✅ CRÍTICO: Invalidar caché de memoización para forzar re-render
          lastMasterGridData = null;
          lastRenderCourseHex = null; // ✅ Invalidar también el caché del curso
          lastRenderCourseData = null;

          // ✅ Verificar si estamos en vista master Y autenticados
          const masterEl = document.getElementById('master');
          const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;
          if (isMasterView) {
            buildMasterGrid();
          } else {
            log('[REMOVE] ♻️ Actualizando lista de archivos inmediatamente');
            // ✅ ACTUALIZAR LISTA DE ARCHIVOS DIRECTAMENTE (sin memoización)
            updateFileListOnly(hex);
          }

          // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
          // Si no quedan más links, eliminar el hex completamente de la hoja de overrides
          if (updatedFiles.length === 0) {
            log('[REMOVE] 🧹 No quedan más links, eliminando hex de la hoja de overrides');
            remoteDeleteFiles(hex).then(removeOk => {
              if (removeOk) {
                log('[REMOVE] ✅ Hex eliminado de la hoja de overrides');
              } else {
                warn('[REMOVE] ⚠️ Error eliminando hex de la hoja de overrides');
              }
            }).catch(e => {
              console.error('[REMOVE] ❌ Error eliminando hex de la hoja de overrides:', e);
            });
          } else {
            remoteSaveFiles(hex, updatedFiles).then(removeOk => {
              if (removeOk) {
                log('[REMOVE] ✅ Guardado en remoto exitoso');
                // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
                refreshFromRemoteSilent(hex).catch(() => { });
              } else {
                warn('[REMOVE] ⚠️ Error guardando en remoto');
              }
            }).catch(e => {
              console.error('[REMOVE] ❌ Error guardando en remoto:', e);
            });
          }
        }, 'enlace'); // ✅ Tercer parámetro para que muestre "eliminar enlace" en lugar de "eliminar curso"
      });

      actions.appendChild(btnOpen);
      actions.appendChild(btnEdit);
      actions.appendChild(btnRemove);

      row.appendChild(leftInfo);
      row.appendChild(actions);
      list.appendChild(row);
    });
    right.appendChild(list);

    // ✅ Drag & Drop con feedback visual mejorado
    let draggedElement = null;
    let dragOverElement = null;
    let dragOverPosition = null; // 'top' o 'bottom'

    list.addEventListener('dragstart', (e) => {
      const el = e.target instanceof HTMLElement ? e.target.closest('.file') : null;
      if (!el) return;

      draggedElement = el;
      const idx = el.dataset.index;
      if (idx != null) {
        e.dataTransfer?.setData('text/plain', idx);
        e.dataTransfer.effectAllowed = 'move';

        // ✅ Agregar clase de arrastre
        el.classList.add('dragging');
        list.classList.add('drag-active');

        // ✅ Feedback visual: opacidad reducida y cursor
        el.style.cursor = 'grabbing';

        // ✅ Crear imagen de arrastre personalizada (opcional)
        const dragImage = el.cloneNode(true);
        dragImage.style.opacity = '0.8';
        dragImage.style.transform = 'rotate(2deg)';
        document.body.appendChild(dragImage);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);
        setTimeout(() => document.body.removeChild(dragImage), 0);
      }
    });

    list.addEventListener('dragend', (e) => {
      // ✅ Limpiar clases y estilos
      if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement.style.cursor = '';
        draggedElement = null;
      }

      // ✅ Limpiar indicadores de drop
      list.querySelectorAll('.file').forEach(file => {
        file.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
      });

      // ✅ Remover indicadores de posición
      list.querySelectorAll('.file-drop-indicator').forEach(indicator => {
        indicator.remove();
      });

      list.classList.remove('drag-active');
      dragOverElement = null;
      dragOverPosition = null;
    });

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const targetFile = e.target instanceof HTMLElement ? e.target.closest('.file') : null;

      if (!targetFile || targetFile === draggedElement) {
        // ✅ Limpiar indicadores si no hay target válido
        if (dragOverElement) {
          dragOverElement.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
          dragOverElement.querySelectorAll('.file-drop-indicator').forEach(ind => ind.remove());
        }
        dragOverElement = null;
        dragOverPosition = null;
        return;
      }

      // ✅ Calcular posición (arriba o abajo del elemento)
      const rect = targetFile.getBoundingClientRect();
      const mouseY = e.clientY;
      const middleY = rect.top + rect.height / 2;
      const position = mouseY < middleY ? 'top' : 'bottom';

      // ✅ Actualizar indicadores visuales
      if (dragOverElement !== targetFile || dragOverPosition !== position) {
        // Limpiar indicadores anteriores
        if (dragOverElement && dragOverElement !== targetFile) {
          dragOverElement.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
          dragOverElement.querySelectorAll('.file-drop-indicator').forEach(ind => ind.remove());
        }

        // Aplicar nuevos indicadores
        targetFile.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        targetFile.classList.add('drag-over', `drag-over-${position}`);

        // ✅ Agregar indicador de línea de drop
        const existingIndicator = targetFile.querySelector('.file-drop-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.className = 'file-drop-indicator active';
        if (position === 'top') {
          targetFile.insertBefore(indicator, targetFile.firstChild);
        } else {
          targetFile.appendChild(indicator);
        }

        dragOverElement = targetFile;
        dragOverPosition = position;
      }
    });

    list.addEventListener('dragleave', (e) => {
      // ✅ Solo limpiar si realmente salimos del área de drop
      if (!list.contains(e.relatedTarget)) {
        if (dragOverElement) {
          dragOverElement.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
          dragOverElement.querySelectorAll('.file-drop-indicator').forEach(ind => ind.remove());
        }
        dragOverElement = null;
        dragOverPosition = null;
      }
    });

    list.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const fromStr = e.dataTransfer?.getData('text/plain');
      const toEl = e.target instanceof HTMLElement ? e.target.closest('.file') : null;

      if (!fromStr || !toEl) {
        // ✅ Limpiar indicadores si el drop no es válido
        list.querySelectorAll('.file').forEach(file => {
          file.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        });
        list.querySelectorAll('.file-drop-indicator').forEach(ind => ind.remove());
        return;
      }

      const from = Number(fromStr);
      let to = Number(toEl.dataset.index || 0);

      // ✅ Ajustar posición según dragOverPosition
      if (dragOverPosition === 'bottom' && from < to) {
        to = to + 1;
      } else if (dragOverPosition === 'top' && from > to) {
        // Ya está en la posición correcta
      }

      if (Number.isNaN(from) || Number.isNaN(to) || from === to) {
        // ✅ Limpiar indicadores
        list.querySelectorAll('.file').forEach(file => {
          file.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        });
        list.querySelectorAll('.file-drop-indicator').forEach(ind => ind.remove());
        return;
      }

      // ✅ Animación de reordenamiento
      const next = files.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      // ✅ Guardar nuevo orden inmediatamente
      saveFilesOverride(hex, next);

      // ✅ CRÍTICO: Reordenar elementos DOM manualmente ANTES de cualquier otra cosa
      log('[REORDER] ♻️ Reordenando elementos DOM manualmente en tiempo real');

      // Obtener todos los elementos .file actuales en el orden del DOM
      const fileElements = Array.from(list.querySelectorAll('.file'));
      
      // Crear un mapa de elementos por su índice original en el array files
      const elementMap = new Map();
      fileElements.forEach((el) => {
        const idx = Number(el.dataset.index);
        if (!Number.isNaN(idx)) {
          elementMap.set(idx, el);
        }
      });

      // ✅ Reordenar físicamente los elementos en el DOM según el nuevo orden
      // Primero, guardar referencias a todos los elementos
      const elementsToReorder = [];
      next.forEach((item, newIndex) => {
        // Buscar el elemento correspondiente en el mapa usando el índice original
        const oldIndex = files.findIndex(f => {
          const fKey = f.firebaseId || `${f.url}|||${f.label}`;
          const itemKey = item.firebaseId || `${item.url}|||${item.label}`;
          return fKey === itemKey;
        });

        if (oldIndex !== -1 && elementMap.has(oldIndex)) {
          const element = elementMap.get(oldIndex);
          // Actualizar data-index al nuevo índice
          element.dataset.index = String(newIndex);
          elementsToReorder.push(element);
        }
      });

      // Limpiar la lista y reconstruir en el nuevo orden
      list.innerHTML = '';
      elementsToReorder.forEach(element => {
        list.appendChild(element);
      });

      // ✅ Feedback visual: mostrar animación de éxito en el elemento movido
      const movedElement = list.querySelector(`[data-index="${to}"]`);
      if (movedElement) {
        movedElement.style.transition = 'all 0.3s ease';
        movedElement.style.transform = 'scale(1.02)';
        movedElement.style.boxShadow = '0 4px 16px rgba(90, 169, 255, 0.4)';

        setTimeout(() => {
          if (movedElement) {
            movedElement.style.transform = '';
            movedElement.style.boxShadow = '';
          }
        }, 300);
      }

      // Actualizar contador de archivos
      const filesCountEl = $('#files-count');
      if (filesCountEl) {
        filesCountEl.textContent = next.length;
      }

      // ✅ Invalidar caché de memoización para forzar re-render si es necesario
      lastRenderCourseHex = null;
      lastRenderCourseData = null;

      // ✅ Mostrar toast de confirmación
      if (typeof window.showToast === 'function') {
        window.showToast('success', 'Archivo reordenado', 'El orden se ha actualizado correctamente', 2000);
      }

      // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
      remoteSaveFiles(hex, next).then(reorderOk => {
        if (reorderOk) {
          log('[REORDER] ✅ Guardado en remoto exitoso');
          // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
          refreshFromRemoteSilent(hex).catch(() => { });
        } else {
          warn('[REORDER] ⚠️ Error guardando en remoto');
        }
      }).catch(e => {
        console.error('[REORDER] ❌ Error guardando en remoto:', e);
      });
    });

    // formulario para agregar nuevo link
    const addWrap = document.createElement('div');
    addWrap.style.marginTop = '12px';
    addWrap.setAttribute('data-edit-form', 'add-link'); // ✅ Marcar para que el refresh no interfiera
    const addLabel = document.createElement('label');
    addLabel.textContent = 'Agregar nuevo enlace';
    addLabel.style.display = 'block';
    addLabel.style.fontWeight = '600';
    addLabel.style.marginBottom = '8px';

    const addRow = document.createElement('div');
    addRow.className = 'row';

    const inputLabel = document.createElement('input');
    inputLabel.className = 'input';
    inputLabel.type = 'text';
    inputLabel.placeholder = 'Etiqueta (ej. Manual de Marca)';
    inputLabel.setAttribute('data-edit-form', 'add-link'); // ✅ Marcar también los inputs

    const inputUrl = document.createElement('input');
    inputUrl.className = 'input';
    inputUrl.type = 'url';
    inputUrl.placeholder = 'URL (https://...)';
    inputUrl.setAttribute('data-edit-form', 'add-link'); // ✅ Marcar también los inputs

    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn';
    btnAdd.type = 'button';
    btnAdd.textContent = 'Agregar link';
    btnAdd.addEventListener('click', async () => {
      // ✅ Sanitizar inputs
      const labelVal = safeInput(inputLabel.value, 'text');
      const urlVal = safeInput(inputUrl.value, 'url');

      if (!labelVal || !urlVal) {
        if (typeof window.showSuccessModal === 'function') {
          window.showSuccessModal('Error', 'Complete etiqueta y URL');
        } else {
          alert('Complete etiqueta y URL');
        }
        return;
      }

      // ✅ Validación mejorada de URL
      const urlValidation = validateURL(urlVal);
      if (!urlValidation.valid) {
        if (typeof window.showToast === 'function') {
          window.showToast('error', 'URL inválida', urlValidation.error);
        } else if (typeof window.showSuccessModal === 'function') {
          window.showSuccessModal('Error', urlValidation.error);
        } else {
          alert(urlValidation.error);
        }
        inputUrl.focus();
        inputUrl.style.borderColor = '#ff5555';
        return;
      }

      // Restaurar borde normal
      inputUrl.style.borderColor = '';

      // ✅ FIREBASE: Intentar agregar a Firestore primero (sincronización en tiempo real)
      const db = getFirestoreDB();
      if (db && typeof window.agregarLinkFirebase === 'function') {
        try {
          // ✅ Bloquear re-renders durante la adición
          userInteracting = true;

          await window.agregarLinkFirebase(hex, labelVal, urlVal);

          // Limpiar inputs
          inputLabel.value = '';
          inputUrl.value = '';

          log('[ADD] ✅ Link agregado a Firebase');

          // ✅ CRÍTICO: Actualizar localStorage INMEDIATAMENTE con el nuevo link
          // Obtener los archivos actuales y agregar el nuevo link
          const currentFiles = getFilesForHex(hex);

          // ✅ PREVENIR DUPLICADOS: Verificar si el link ya existe
          const itemKey = `${urlVal}|||${labelVal}`;
          const exists = currentFiles.some(f => {
            const fKey = f.firebaseId ? `${f.url}|||${f.label}` : `${f.url}|||${f.label}`;
            return fKey === itemKey;
          });

          if (exists) {
            warn('[ADD] ⚠️ El enlace ya existe, omitiendo duplicado');
            userInteracting = false;

            // ✅ FIX: Force render even if it exists, because the listener might have skipped it
            // due to userInteracting=true
            const masterEl = document.getElementById('master');
            const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;
            if (isMasterView) {
              log('[ADD] ♻️ Re-renderizando Master (duplicate path)');
              buildMasterGrid();
            } else {
              log('[ADD] ♻️ Actualizando lista de archivos inmediatamente (duplicate path)');
              updateFileListOnly(hex);
            }

            return;
          }

          // ✅ Agregar el nuevo link temporalmente (Firebase lo actualizará con el ID correcto)
          const newLink = { label: labelVal, url: urlVal };
          const next = currentFiles.concat(newLink);
          saveFilesOverride(hex, next);
          log('[ADD] 💾 localStorage actualizado temporalmente:', next.length, 'links');

          // ✅ Desbloquear y ACTUALIZAR VISTA INMEDIATAMENTE
          userInteracting = false;

          // ✅ CRÍTICO: Invalidar caché de memoización para forzar re-render
          lastMasterGridData = null;
          lastRenderCourseHex = null; // ✅ Invalidar también el caché del curso
          lastRenderCourseData = null;

          // ✅ Verificar si estamos en vista master Y autenticados
          const masterEl = document.getElementById('master');
          const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;
          if (isMasterView) {
            log('[ADD] ♻️ Re-renderizando Master');
            buildMasterGrid();
          } else {
            log('[ADD] ♻️ Actualizando lista de archivos inmediatamente');
            // ✅ ACTUALIZAR LISTA DE ARCHIVOS DIRECTAMENTE (sin memoización)
            updateFileListOnly(hex);
          }

          // ✅ Guardar en Google Sheets como backup (sin duplicar)
          remoteSaveFiles(hex, next).catch(e => {
            warn('[ADD] ⚠️ No se pudo guardar en Google Sheets (backup):', e);
          });

          // ✅ Firebase actualizará la vista automáticamente con el ID correcto cuando el listener se active
          // Pero ya actualizamos la vista manualmente para feedback inmediato
          return;

        } catch (error) {
          console.error('[ADD] ❌ Error con Firebase, usando método local:', error);
          userInteracting = false;
          // Continuar con método local si Firebase falla
        }
      }

      // ✅ FALLBACK: Método local si Firebase no está disponible
      log('[ADD] Usando método local (Firebase no disponible)');
      const current = getFilesForHex(hex);
      log('[ADD] Links actuales:', current.length);

      // ✅ PREVENIR DUPLICADOS: Verificar si el link ya existe
      const itemKey = `${urlVal}|||${labelVal}`;
      const exists = current.some(f => {
        const fKey = f.firebaseId ? `${f.url}|||${f.label}` : `${f.url}|||${f.label}`;
        return fKey === itemKey;
      });

      if (exists) {
        if (typeof window.showSuccessModal === 'function') {
          window.showSuccessModal('Error', 'Este enlace ya existe');
        } else {
          alert('Este enlace ya existe');
        }
        return;
      }

      const next = current.concat({ label: labelVal, url: urlVal });
      log('[ADD] Links después de agregar:', next.length);

      // Limpiar inputs
      inputLabel.value = '';
      inputUrl.value = '';

      saveFilesOverride(hex, next);

      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE
      log('[ADD] ➕ Agregando link inmediatamente a la vista');

      // ✅ CRÍTICO: Invalidar caché de memoización para forzar re-render
      lastMasterGridData = null;
      lastRenderCourseHex = null; // ✅ Invalidar también el caché del curso
      lastRenderCourseData = null;

      // ✅ Verificar si estamos en vista master Y autenticados
      const masterEl = document.getElementById('master');
      const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;

      if (isMasterView) {
        buildMasterGrid();
        log('[ADD] ✅ Vista master actualizada');
      } else {
        log('[ADD] ♻️ Actualizando lista de archivos inmediatamente');
        // ✅ ACTUALIZAR LISTA DE ARCHIVOS DIRECTAMENTE (sin memoización)
        updateFileListOnly(hex);
        log('[ADD] ✅ Vista de curso actualizada');
      }

      // ✅ GUARDAR EN REMOTO (Google Sheets)
      remoteSaveFiles(hex, next).then(saveResult => {
        if (saveResult) {
          log('[ADD] ✅ Guardado en remoto - POST exitoso');
          setTimeout(() => {
            refreshFromRemoteSilent(hex).then(() => {
              log('[ADD] ✅ SINCRONIZACIÓN CONFIRMADA');
            }).catch(() => {
              log('[ADD] ⚠️ Error en sincronización post-guardado');
            });
          }, 500);
        } else {
          warn('[ADD] ⚠️ No se pudo guardar en remoto');
        }
      }).catch(e => {
        console.error('[ADD] ❌ Error guardando en remoto:', e);
      });
    });

    addRow.appendChild(inputLabel);
    addRow.appendChild(inputUrl);
    addRow.appendChild(btnAdd);
    addWrap.appendChild(addLabel);
    addWrap.appendChild(addRow);
    right.appendChild(addWrap);

    // restaurar originales
    const btnRestore = document.createElement('button');
    btnRestore.className = 'btn secondary';
    btnRestore.type = 'button';
    btnRestore.textContent = 'Restaurar enlaces originales';
    btnRestore.style.marginTop = '10px';
    btnRestore.addEventListener('click', async () => {
      if (!confirm('¿Restaurar la lista original de enlaces? Se perderán los cambios locales.')) return;
      clearFilesOverride(hex);

      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE (sin esperar nada)
      log('[RESTORE] ♻️ Restaurando vista inmediatamente');
      // ✅ Verificar si estamos en vista master Y autenticados
      const masterEl = document.getElementById('master');
      const isMasterView = masterEl && !masterEl.classList.contains('hidden') && isMasterAuthenticated;
      if (isMasterView) {
        buildMasterGrid();
      } else {
        // ✅ FORZAR renderizado completo ignorando memoización
        lastRenderCourseHex = null;
        lastRenderCourseData = null;
        renderCourse(hex);
      }

      // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
      remoteSaveFiles(hex, getFilesForHex(hex)).then(restoreOk => {
        if (restoreOk) {
          log('[RESTORE] ✅ Guardado en remoto exitoso');
          // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
          refreshFromRemoteSilent(hex).catch(() => { });
        } else {
          warn('[RESTORE] ⚠️ Error guardando en remoto');
        }
      }).catch(e => {
        console.error('[RESTORE] ❌ Error guardando en remoto:', e);
      });
    });
    right.appendChild(btnRestore);

    // tarjeta izquierda (solo imagen) - ✅ Lazy loading con estilos variant y accent
    let wrapper = null;
    if (window.insertElectricCard) {
      // ✅ Pasar variant y accent al crear la tarjeta
      const variant = data.card?.variant || 'dramatic';
      const accent = data.card?.accent || '#5aa9ff';
      wrapper = window.insertElectricCard(left, variant, accent);
    }
    if (wrapper && data.card?.img && window.setCardImage) {
      // ✅ Lazy loading: usar data-src y cargar solo cuando es visible
      const imgUrl = addCacheBuster(data.card.img);
      const imgElement = wrapper.querySelector('img');
      if (imgElement) {
        imgElement.setAttribute('data-src', imgUrl);
        imgElement.setAttribute('loading', 'lazy');
        imgElement.style.opacity = '0.5'; // Placeholder mientras carga

        // ✅ Intersection Observer para cargar imagen cuando es visible
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              const src = img.getAttribute('data-src');
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                img.style.opacity = '1';
                img.style.transition = 'opacity 0.3s';
                observer.unobserve(img);
              }
            }
          });
        }, { rootMargin: '50px' }); // Cargar 50px antes de que sea visible

        imageObserver.observe(imgElement);
      } else {
        // Fallback: cargar inmediatamente si no hay img element
        window.setCardImage(wrapper, imgUrl);
      }
    }

    cardEl.appendChild(left);
    cardEl.appendChild(right);
    grid.appendChild(cardEl);
  });

  // ✅ Finalizar medición de renderizado del grid
  const coursesCount = Object.keys(mergedMap).filter(h => h !== MASTER_HASH).length;
  endPerformanceMeasure('Renderizado del grid', gridStart, { cursos: coursesCount });

  // ✅ Agregar controles de paginación si hay más de 12 cursos
  const existingPagination = $('#masterPagination');
  if (existingPagination) existingPagination.remove();

  if (coursesArray.length > COURSES_PER_PAGE) {
    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'masterPagination';
    paginationDiv.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 24px; padding: 16px;';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn secondary';
    prevBtn.textContent = '◀ Anterior';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        try { sessionStorage.setItem(pageKey, String(currentPage)); } catch (e) { }
        buildMasterGrid();
      }
    });

    const pageInfo = document.createElement('span');
    pageInfo.style.cssText = 'color: var(--text); font-size: 14px;';
    pageInfo.textContent = `Página ${currentPage} de ${totalPages} (${coursesArray.length} cursos)`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn secondary';
    nextBtn.textContent = 'Siguiente ▶';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        try { sessionStorage.setItem(pageKey, String(currentPage)); } catch (e) { }
        buildMasterGrid();
      }
    });

    paginationDiv.appendChild(prevBtn);
    paginationDiv.appendChild(pageInfo);
    paginationDiv.appendChild(nextBtn);
    grid.parentNode.insertBefore(paginationDiv, grid.nextSibling);
  }

  // ✅ FIREBASE: Iniciar listeners para todos los cursos en Master
  const courseHexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
  initFirestoreRealtimeMaster(courseHexes);

  // herramientas exportar/importar
  try { ensureMasterTools(); } catch (e) { }
}

// ✅ Función para actualizar estadísticas en la vista maestra
async function updateMasterStats(mergedMap) {
  if (!mergedMap) {
    mergedMap = getMergedAccessHashMap();
  }

  const coursesCount = Object.keys(mergedMap).filter(h => h !== MASTER_HASH).length;

  // ✅ Contar por tipo de clasificación
  const typeCounts = {
    curso: 0,
    diplomado: 0,
    webinar: 0,
    seminario: 0,
    taller: 0
  };

  // ✅ Contar archivos totales y preparar datos para cursos recientes
  let totalFiles = 0;
  const coursesWithData = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  Object.keys(mergedMap).forEach(hex => {
    if (hex !== MASTER_HASH) {
      const course = mergedMap[hex];
      const type = course?.type || 'curso';
      if (typeCounts.hasOwnProperty(type)) {
        typeCounts[type]++;
      } else {
        typeCounts.curso++;
      }

      // Contar archivos
      const files = getFilesForHex(hex);
      if (Array.isArray(files)) {
        totalFiles += files.length;
      }

      // Preparar datos para cursos recientes
      coursesWithData.push({
        hex,
        title: course?.title || 'Sin título',
        type: type,
        createdAt: course?.createdAt || course?.updatedAt || 0,
        filesCount: Array.isArray(files) ? files.length : 0
      });
    }
  });

  // ✅ Actualizar total de cursos
  const statsCourses = $('#statsCoursesCount');
  if (statsCourses) {
    statsCourses.textContent = coursesCount;
  }

  // ✅ Actualizar total de archivos
  const statsTotalFiles = $('#statsTotalFiles');
  if (statsTotalFiles) {
    statsTotalFiles.textContent = totalFiles;
  }

  // ✅ Contar cursos con emails (desde Firebase)
  let coursesWithEmailsCount = 0;
  try {
    const db = getFirebaseDB();
    if (db) {
      const courseEmailsRef = db.ref(COURSE_EMAILS_PATH);
      const snapshot = await courseEmailsRef.once('value');
      if (snapshot.exists()) {
        snapshot.forEach(() => {
          coursesWithEmailsCount++;
        });
      }
    }
  } catch (e) {
    warn('[STATS] Error contando cursos con emails:', e);
  }

  const statsCoursesWithEmails = $('#statsCoursesWithEmails');
  if (statsCoursesWithEmails) {
    statsCoursesWithEmails.textContent = coursesWithEmailsCount;
  }

  // ✅ Contar acciones de hoy (desde logs de auditoría)
  const auditLogs = getAuditLogs();
  const todayActions = auditLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === todayTimestamp;
  }).length;

  const statsTodayActions = $('#statsTodayActions');
  if (statsTodayActions) {
    statsTodayActions.textContent = todayActions;
  }

  // ✅ Actualizar contadores por tipo
  const statsTypeCurso = $('#statsTypeCurso');
  const statsTypeDiplomado = $('#statsTypeDiplomado');
  const statsTypeWebinar = $('#statsTypeWebinar');
  const statsTypeSeminario = $('#statsTypeSeminario');
  const statsTypeTaller = $('#statsTypeTaller');

  if (statsTypeCurso) statsTypeCurso.textContent = typeCounts.curso;
  if (statsTypeDiplomado) statsTypeDiplomado.textContent = typeCounts.diplomado;
  if (statsTypeWebinar) statsTypeWebinar.textContent = typeCounts.webinar;
  if (statsTypeSeminario) statsTypeSeminario.textContent = typeCounts.seminario;
  if (statsTypeTaller) statsTypeTaller.textContent = typeCounts.taller;

  // ✅ Mostrar últimos cursos creados (top 5 más recientes)
  updateRecentCourses(coursesWithData);

  log('[STATS] 📊 Total:', coursesCount, '| Archivos:', totalFiles, '| Por tipo:', typeCounts);
}

// ✅ Actualizar lista de cursos recientes
function updateRecentCourses(coursesWithData) {
  const recentCoursesContainer = $('#statsRecentCourses');
  const recentCoursesList = $('#recentCoursesList');

  if (!recentCoursesContainer || !recentCoursesList) return;

  // Ordenar por fecha de creación (más recientes primero)
  const sortedCourses = coursesWithData
    .filter(c => c.createdAt > 0)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  if (sortedCourses.length === 0) {
    recentCoursesContainer.style.display = 'none';
    return;
  }

  recentCoursesContainer.style.display = 'block';

  // Crear lista de cursos recientes
  recentCoursesList.innerHTML = '';
  sortedCourses.forEach((course, index) => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 10px 12px;
      margin-bottom: 8px;
      background: rgba(90,169,255,0.05);
      border-left: 3px solid var(--accent);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    `;

    const left = document.createElement('div');
    left.style.cssText = 'flex: 1; min-width: 0;';

    const title = document.createElement('div');
    title.textContent = course.title;
    title.style.cssText = 'font-weight: 500; font-size: 13px; color: var(--text); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size: 11px; color: var(--muted); display: flex; gap: 8px; align-items: center;';

    const typeIcon = {
      'curso': '<i class="ph ph-book-open"></i>',
      'diplomado': '<i class="ph ph-graduation-cap"></i>',
      'webinar': '<i class="ph ph-monitor"></i>',
      'seminario': '<i class="ph ph-note"></i>',
      'taller': '<i class="ph ph-wrench"></i>'
    }[course.type] || '<i class="ph ph-books"></i>';

    const date = new Date(course.createdAt);
    const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    meta.innerHTML = `
      <span>${typeIcon} ${course.type}</span>
      <span>•</span>
      <span><i class="ph ph-file"></i> ${course.filesCount} archivos</span>
      <span>•</span>
      <span><i class="ph ph-calendar"></i> ${dateStr}</span>
    `;

    left.appendChild(title);
    left.appendChild(meta);
    item.appendChild(left);

    recentCoursesList.appendChild(item);
  });

  // ✅ Configurar toggle para mostrar/ocultar
  const btnToggle = $('#btn-toggle-recent-courses');
  if (btnToggle && !btnToggle.dataset.configured) {
    btnToggle.dataset.configured = 'true';
    btnToggle.addEventListener('click', () => {
      const isVisible = recentCoursesList.style.display !== 'none';
      recentCoursesList.style.display = isVisible ? 'none' : 'block';
      btnToggle.innerHTML = isVisible
        ? '<i class="ph ph-caret-down"></i>'
        : '<i class="ph ph-caret-up"></i>';
    });
  }
}

// ✅ Historial de cambios: registrar cambios importantes
function logChangeHistory(action, data) {
  try {
    let history = JSON.parse(localStorage.getItem('changeHistory') || '[]');
    const entry = {
      action: action,
      data: data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50)
    };

    history.unshift(entry); // Agregar al inicio
    history = history.slice(0, 100); // Mantener solo los últimos 100 cambios

    localStorage.setItem('changeHistory', JSON.stringify(history));
    log('[HISTORY] 📝 Registrado:', action, data);
  } catch (e) {
    warn('[HISTORY] ⚠️ Error guardando historial:', e);
  }
}

// ✅ Función para obtener historial de cambios (últimos N cambios)
function getChangeHistory(limit = 20) {
  try {
    const history = JSON.parse(localStorage.getItem('changeHistory') || '[]');
    return history.slice(0, limit);
  } catch (e) {
    warn('[HISTORY] ⚠️ Error leyendo historial:', e);
    return [];
  }
}

async function refreshFromRemoteSilent(hex) {
  try {
    // ✅ FIREBASE ES LA ÚNICA FUENTE DE VERDAD - No consultar Google Sheets si Firebase está disponible
    const db = getFirestoreDB();
    if (db) {
      log('[REFRESH] Firebase maneja links en tiempo real, sin usar Google Sheets');
      // Firebase ya tiene listeners activos que actualizan automáticamente
      // No necesitamos consultar Google Sheets
      return false;
    }

    log('[REFRESH] 🔄 Consultando remoto para hex:', hex.substring(0, 8));
    // ✅ Usar JSONP directamente (no fetch que puede fallar)
    const remote = await remoteGetFilesJSONP(hex);

    if (!remote) {
      log('[REFRESH] ⚠️ Sin respuesta del remoto');
      return false;
    }

    if (!Array.isArray(remote)) {
      warn('[REFRESH] Datos remotos no son un array:', remote);
      return false;
    }

    log('[REFRESH] 📥 Remoto respondió:', remote.length, 'archivos');

    const current = getFilesForHex(hex);
    const base = getBaseFilesForHex(hex);

    // ✅ ESTRATEGIA PROFESIONAL: El remoto SIEMPRE es la verdad
    // Si hay datos remotos, SIEMPRE los aplicamos (sin comparar)
    // Esto asegura sincronización perfecta en todos los dispositivos

    if (remote.length > 0) {
      // Comparar para detectar cambios REALES
      const currentStr = stableStringify(current);
      const remoteStr = stableStringify(remote);
      const hasChanges = remoteStr !== currentStr || remote.length !== current.length;

      if (hasChanges) {
        log('[REFRESH] 🔄 CAMBIOS DETECTADOS');
        log('[REFRESH] Remoto:', remote.length, 'archivos | Local:', current.length, 'archivos');
        log('[REFRESH] 📥 Aplicando', remote.length, 'archivos desde remoto');
        saveFilesOverride(hex, remote);
        log('[REFRESH] ✅ Sincronización completada con cambios');

        // ✅ Notificación de sincronización
        const mergedMap = getMergedAccessHashMap();
        const courseData = mergedMap[hex];
        if (typeof window.showToast === 'function' && courseData) {
          window.showToast('success', 'Sincronizado', `"${courseData.title}" actualizado (${remote.length} archivos)`);
        }
        return true;
      } else {
        // log('[REFRESH] ✅ Sin cambios (datos idénticos)');
        return false;
      }
    }

    // ✅ Remoto vacío → Verificar si debe usar base o limpiar
    if (remote.length === 0 && current.length > 0) {
      if (base.length === 0) {
        log('[REFRESH] 🧹 Remoto vacío y sin base, limpiando local');
        clearFilesOverride(hex);
        return true;
      }
      log('[REFRESH] 🔄 Usando datos base (', base.length, 'archivos)');
      clearFilesOverride(hex);
      return true;
    }

    // log('[REFRESH] ✅ Sin datos remotos ni locales');
    return false;
  } catch (e) {
    console.error('[REFRESH] Error en refresh silencioso:', e);
    return false;
  }
}

// ✅ Estado global de filtros avanzados
let advancedFiltersState = {
  type: '',
  sort: 'title-asc',
  tag: '',
  active: false
};

function setupMasterSearch() {
  const input = $('#masterSearch');
  const clear = $('#masterSearchClear');
  const grid = $('#masterGrid');
  if (!input || !grid) return;

  // ✅ Configurar filtros avanzados (se llama después de definir applyFilter)
  // setupAdvancedFilters se llama más tarde en el código

  // ✅ Contenedor para autocompletado
  const autocompleteContainer = document.createElement('div');
  autocompleteContainer.id = 'searchAutocomplete';
  autocompleteContainer.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-top: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;

  // ✅ Posicionar el contenedor relativo al input
  const searchContainer = input.parentElement;
  if (searchContainer) {
    searchContainer.style.position = 'relative';
    if (!searchContainer.querySelector('#searchAutocomplete')) {
      searchContainer.appendChild(autocompleteContainer);
    }
  }

  // ✅ Función para obtener todas las sugerencias disponibles (con caché)
  let suggestionsCache = null;
  let suggestionsCacheTimestamp = 0;
  const SUGGESTIONS_CACHE_TTL = 2 * 60 * 1000; // 2 minutos

  function getSuggestions() {
    // ✅ Usar caché si está disponible y no ha expirado
    const now = Date.now();
    if (suggestionsCache && (now - suggestionsCacheTimestamp) < SUGGESTIONS_CACHE_TTL) {
      return suggestionsCache;
    }

    // ✅ Recalcular sugerencias
    const mergedMap = getMergedAccessHashMap();
    const suggestions = new Set();

    Object.entries(mergedMap).forEach(([hex, data]) => {
      if (hex === MASTER_HASH) return;

      // Agregar título
      if (data.title) {
        suggestions.add(data.title.toLowerCase());
      }

      // Agregar tag
      if (data.card?.tag) {
        suggestions.add(data.card.tag.toLowerCase());
      }

      // Agregar tipo
      const type = data.type || 'curso';
      const typeLabels = {
        'curso': 'curso',
        'diplomado': 'diplomado',
        'webinar': 'webinar',
        'seminario': 'seminario',
        'taller': 'taller'
      };
      suggestions.add(typeLabels[type] || 'curso');
    });

    const result = Array.from(suggestions);

    // ✅ Guardar en caché
    suggestionsCache = result;
    suggestionsCacheTimestamp = now;

    return result;
  }

  // ✅ Limpiar caché de sugerencias cuando se reconstruye el grid
  function invalidateSuggestionsCache() {
    suggestionsCache = null;
    suggestionsCacheTimestamp = 0;
  }

  // ✅ Exponer función para limpiar caché desde fuera
  window.invalidateSuggestionsCache = invalidateSuggestionsCache;

  // ✅ Función para mostrar autocompletado
  function showAutocomplete(query) {
    if (!query || query.length < 2) {
      autocompleteContainer.style.display = 'none';
      return;
    }

    const suggestions = getSuggestions();
    const filtered = suggestions.filter(s => s.includes(query.toLowerCase()));

    if (filtered.length === 0) {
      autocompleteContainer.style.display = 'none';
      return;
    }

    // Limitar a 5 sugerencias
    const limited = filtered.slice(0, 5);

    autocompleteContainer.innerHTML = '';
    limited.forEach(suggestion => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 10px 14px;
        cursor: pointer;
        border-bottom: 1px solid var(--border);
        transition: background 0.2s;
      `;

      // ✅ Resaltar parte coincidente (sanitizado)
      // IMPORTANTE: No escapar el query para el regex, solo para mostrar
      const escapedSuggestion = escapeHTML(suggestion);
      const regexQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapar solo para regex
      const regex = new RegExp(`(${regexQuery})`, 'gi');

      // Crear mark de forma segura usando DOM
      // Usar el texto original para el split, pero mostrar solo texto escapado
      const originalSuggestion = suggestion; // Texto original sin escapar
      const parts = originalSuggestion.split(regex);
      parts.forEach((part, index) => {
        if (index % 2 === 1) {
          // Es la parte coincidente
          const mark = document.createElement('mark');
          mark.style.cssText = 'background: var(--accent); color: white; padding: 2px 4px; border-radius: 3px;';
          mark.textContent = part;
          item.appendChild(mark);
        } else if (part) {
          // Es texto normal
          item.appendChild(document.createTextNode(part));
        }
      });

      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(90,169,255,0.1)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
      });

      item.addEventListener('click', () => {
        input.value = suggestion;
        autocompleteContainer.style.display = 'none';
        applyFilter();
        input.focus();
      });

      autocompleteContainer.appendChild(item);
    });

    autocompleteContainer.style.display = 'block';
  }

  // ✅ Función para resaltar texto en elementos
  function highlightTextInElement(element, query) {
    if (!element || !query || query.length < 2) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim() && node.parentNode && !node.parentNode.classList.contains('search-highlight')) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');

      if (regex.test(text)) {
        // ✅ Crear resaltado de forma segura sin innerHTML
        const wrapper = document.createElement('span');
        const parts = text.split(regex);
        parts.forEach((part, index) => {
          if (index % 2 === 1) {
            // Es la parte coincidente
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.style.cssText = 'background: var(--accent); color: white; padding: 2px 4px; border-radius: 3px; font-weight: 600;';
            mark.textContent = part;
            wrapper.appendChild(mark);
          } else if (part) {
            // Es texto normal
            wrapper.appendChild(document.createTextNode(part));
          }
        });
        textNode.parentNode.replaceChild(wrapper, textNode);
      }
    });
  }

  // ✅ Función para remover resaltados
  function removeHighlights() {
    const highlights = grid.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
      }
    });
  }

  function applyFilter() {
    const q = (input.value || '').trim().toLowerCase();
    const cards = Array.from(grid.querySelectorAll('.master-card'));

    // ✅ Verificar que advancedFiltersState existe
    if (!advancedFiltersState) {
      advancedFiltersState = {
        type: '',
        sort: 'title-asc',
        tag: '',
        active: false
      };
    }

    // ✅ Generar clave de caché
    const cacheKey = getSearchCacheKey(q, advancedFiltersState);

    // ✅ Intentar obtener del caché
    let filteredCards = getCachedSearchResult(cacheKey);

    if (!filteredCards) {
      // ✅ Si no está en caché, calcular resultado
      filteredCards = cards;

      // Filtro por búsqueda de texto
      if (q) {
        filteredCards = filteredCards.filter(c => {
          const t = ((c.dataset && c.dataset.title) || '').toLowerCase();
          const tg = ((c.dataset && c.dataset.tag) || '').toLowerCase();
          const type = ((c.dataset && c.dataset.type) || '').toLowerCase();
          return t.includes(q) || tg.includes(q) || type.includes(q);
        });
      }

      // Filtro por tipo
      if (advancedFiltersState.type) {
        filteredCards = filteredCards.filter(c => {
          const type = ((c.dataset && c.dataset.type) || 'curso').toLowerCase();
          const filterType = advancedFiltersState.type ? String(advancedFiltersState.type).toLowerCase() : '';
          return type === filterType;
        });
      }

      // Filtro por tag
      if (advancedFiltersState.tag) {
        const tagFilter = String(advancedFiltersState.tag || '').trim().toLowerCase();
        filteredCards = filteredCards.filter(c => {
          const tg = (String(c.dataset.tag) || '').toLowerCase();
          return tg.includes(tagFilter);
        });
      }

      // ✅ Aplicar ordenamiento
      filteredCards = sortCards(filteredCards, advancedFiltersState.sort);

      // ✅ Guardar en caché (solo si hay filtros activos o búsqueda)
      if (q || advancedFiltersState.type || advancedFiltersState.tag) {
        setCachedSearchResult(cacheKey, filteredCards);
      }
    }

    // ✅ Mostrar/ocultar tarjetas
    cards.forEach(c => {
      const isVisible = filteredCards.includes(c);
      c.style.display = isVisible ? '' : 'none';

      // ✅ Resaltar texto coincidente en tarjetas visibles
      if (isVisible && q) {
        const rightSection = c.querySelector('.right');
        if (rightSection) {
          const titleElements = rightSection.querySelectorAll('div > div:first-child');
          titleElements.forEach(el => {
            if (el.textContent && !el.querySelector('.search-highlight')) {
              highlightTextInElement(el, q);
            }
          });

          const metaElements = rightSection.querySelectorAll('.meta');
          metaElements.forEach(el => {
            if (el.textContent && !el.querySelector('.search-highlight')) {
              highlightTextInElement(el, q);
            }
          });
        }
      }
    });

    // ✅ Actualizar contador de resultados
    updateFilterResultsCount(filteredCards.length, cards.length);

    // Si no hay búsqueda ni filtros, remover highlights
    if (!q && !(advancedFiltersState && advancedFiltersState.type) && !(advancedFiltersState && advancedFiltersState.tag)) {
      removeHighlights();
    }
  }

  // ✅ Función para ordenar tarjetas
  function sortCards(cards, sortType) {
    const sorted = [...cards];

    sorted.sort((a, b) => {
      switch (sortType) {
        case 'title-asc':
          return (a.dataset.title || '').localeCompare(b.dataset.title || '');
        case 'title-desc':
          return (b.dataset.title || '').localeCompare(a.dataset.title || '');
        case 'tag-asc':
          return (a.dataset.tag || '').localeCompare(b.dataset.tag || '');
        case 'date-desc':
          // Ordenar por fecha de creación (más recientes primero)
          const dateA = parseInt(a.dataset.createdAt || '0');
          const dateB = parseInt(b.dataset.createdAt || '0');
          return dateB - dateA;
        case 'date-asc':
          const dateA2 = parseInt(a.dataset.createdAt || '0');
          const dateB2 = parseInt(b.dataset.createdAt || '0');
          return dateA2 - dateB2;
        default:
          return 0;
      }
    });

    return sorted;
  }

  // ✅ Actualizar contador de resultados
  function updateFilterResultsCount(filtered, total) {
    const countEl = $('#filterResultsCount');
    if (countEl) {
      if (filtered < total) {
        countEl.textContent = `Mostrando ${filtered} de ${total} cursos`;
        countEl.style.display = 'block';
      } else {
        countEl.style.display = 'none';
      }
    }
  }

  // ✅ Event listeners
  let selectedIndex = -1;

  // ✅ Debounce mejorado para optimizar búsqueda (250ms con maxWait de 1s)
  const debouncedFilter = smartDebounce(() => {
    applyFilter();
  }, 250, { maxWait: 1000 });

  // Mostrar autocompletado inmediatamente, filtrar con delay
  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    selectedIndex = -1;
    showAutocomplete(query); // Mostrar sugerencias inmediatamente
    debouncedFilter(); // Filtrar con delay para mejor rendimiento
  });

  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      showAutocomplete(input.value.trim());
    }
  });

  // ✅ Navegación con teclado en autocompletado
  input.addEventListener('keydown', (e) => {
    const items = autocompleteContainer.querySelectorAll('div');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        items.forEach((item, i) => {
          item.style.background = i === selectedIndex ? 'rgba(90,169,255,0.2)' : '';
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = Math.max(selectedIndex - 1, -1);
        items.forEach((item, i) => {
          item.style.background = i === selectedIndex ? 'rgba(90,169,255,0.2)' : '';
        });
      }
    } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      items[selectedIndex].click();
    } else if (e.key === 'Escape') {
      autocompleteContainer.style.display = 'none';
      selectedIndex = -1;
    }
  });

  // ✅ Cerrar autocompletado al hacer click fuera
  document.addEventListener('click', (e) => {
    if (searchContainer && !searchContainer.contains(e.target)) {
      autocompleteContainer.style.display = 'none';
      selectedIndex = -1;
    }
  });

  clear?.addEventListener('click', () => {
    input.value = '';
    autocompleteContainer.style.display = 'none';
    applyFilter();
    input.focus();
  });
}

// ✅ Configurar filtros avanzados
function setupAdvancedFilters() {
  const filtersPanel = $('#advancedFilters');
  const btnShowFilters = $('#btn-show-filters');
  const btnCloseFilters = $('#btn-close-filters');
  const btnApplyFilters = $('#btn-apply-filters');
  const btnResetFilters = $('#btn-reset-filters');
  const filterType = $('#filterType');
  const filterSort = $('#filterSort');
  const filterTag = $('#filterTag');
  const activeFiltersCount = $('#activeFiltersCount');
  const filtersCount = $('#filtersCount');

  // ✅ Verificar que los elementos existan, si no, intentar más tarde
  if (!filtersPanel || !btnShowFilters) {
    warn('[FILTERS] Elementos no encontrados, reintentando en 100ms...');
    setTimeout(() => setupAdvancedFilters(), 100);
    return;
  }

  // ✅ Verificar si ya se configuraron los listeners (evitar duplicados)
  if (btnShowFilters.dataset.configured === 'true') {
    log('[FILTERS] Los filtros ya están configurados, omitiendo...');
    return;
  }
  btnShowFilters.dataset.configured = 'true';
  log('[FILTERS] ✅ Configurando filtros avanzados...');

  // ✅ Función para aplicar filtros (accesible desde setupMasterSearch)
  window.applyAdvancedFilter = function () {
    const input = $('#masterSearch');
    const grid = $('#masterGrid');
    if (!input || !grid) return;

    const q = (input.value || '').trim().toLowerCase();
    const cards = Array.from(grid.querySelectorAll('.master-card'));

    // ✅ Aplicar filtros avanzados
    let filteredCards = cards;

    // Filtro por búsqueda de texto
    if (q) {
      filteredCards = filteredCards.filter(c => {
        const t = ((c.dataset && c.dataset.title) || '').toLowerCase();
        const tg = ((c.dataset && c.dataset.tag) || '').toLowerCase();
        const type = ((c.dataset && c.dataset.type) || '').toLowerCase();
        return t.includes(q) || tg.includes(q) || type.includes(q);
      });
    }

    // Filtro por tipo
    if (advancedFiltersState.type) {
      filteredCards = filteredCards.filter(c => {
        const type = ((c.dataset && c.dataset.type) || 'curso').toLowerCase();
        return type === advancedFiltersState.type.toLowerCase();
      });
    }

    // Filtro por tag
    if (advancedFiltersState.tag) {
      const tagFilter = advancedFiltersState.tag.trim().toLowerCase();
      filteredCards = filteredCards.filter(c => {
        const tg = ((c.dataset && c.dataset.tag) || '').toLowerCase();
        return tg.includes(tagFilter);
      });
    }

    // ✅ Aplicar ordenamiento
    filteredCards = sortCards(filteredCards, advancedFiltersState.sort);

    // ✅ Mostrar/ocultar tarjetas
    cards.forEach(c => {
      const isVisible = filteredCards.includes(c);
      c.style.display = isVisible ? '' : 'none';
    });

    // ✅ Actualizar contador de resultados
    updateFilterResultsCount(filteredCards.length, cards.length);
  };

  // ✅ Función para ordenar tarjetas
  function sortCards(cards, sortType) {
    const sorted = [...cards];

    sorted.sort((a, b) => {
      switch (sortType) {
        case 'title-asc':
          return (a.dataset.title || '').localeCompare(b.dataset.title || '');
        case 'title-desc':
          return (b.dataset.title || '').localeCompare(a.dataset.title || '');
        case 'tag-asc':
          return (a.dataset.tag || '').localeCompare(b.dataset.tag || '');
        case 'date-desc':
          const dateA = parseInt(a.dataset.createdAt || '0');
          const dateB = parseInt(b.dataset.createdAt || '0');
          return dateB - dateA;
        case 'date-asc':
          const dateA2 = parseInt(a.dataset.createdAt || '0');
          const dateB2 = parseInt(b.dataset.createdAt || '0');
          return dateA2 - dateB2;
        default:
          return 0;
      }
    });

    return sorted;
  }

  // ✅ Actualizar contador de resultados
  function updateFilterResultsCount(filtered, total) {
    const countEl = $('#filterResultsCount');
    if (countEl) {
      if (filtered < total) {
        countEl.textContent = `Mostrando ${filtered} de ${total} cursos`;
        countEl.style.display = 'block';
      } else {
        countEl.style.display = 'none';
      }
    }
  }

  // ✅ Mostrar/ocultar panel de filtros
  btnShowFilters.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isVisible = filtersPanel.style.display !== 'none';
    filtersPanel.style.display = isVisible ? 'none' : 'block';
    btnShowFilters.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
    btnShowFilters.innerHTML = isVisible
      ? '<i class="ph ph-funnel"></i> Filtros Avanzados'
      : '<i class="ph ph-funnel-simple"></i> Ocultar Filtros';
    log('[FILTERS] Panel de filtros:', isVisible ? 'ocultado' : 'mostrado');
  });

  btnCloseFilters?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    filtersPanel.style.display = 'none';
    btnShowFilters.setAttribute('aria-expanded', 'false');
    btnShowFilters.innerHTML = '<i class="ph ph-funnel"></i> Filtros Avanzados';
    log('[FILTERS] Panel de filtros cerrado');
  });

  // ✅ Aplicar filtros
  btnApplyFilters?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    advancedFiltersState.type = filterType?.value || '';
    advancedFiltersState.sort = filterSort?.value || 'title-asc';
    advancedFiltersState.tag = filterTag?.value || '';
    advancedFiltersState.active = true;

    updateActiveFiltersCount();
    if (window.applyAdvancedFilter) window.applyAdvancedFilter();
    if (window.applyFilter) window.applyFilter();

    // Cerrar panel después de aplicar
    filtersPanel.style.display = 'none';
    btnShowFilters.setAttribute('aria-expanded', 'false');
    btnShowFilters.innerHTML = '<i class="ph ph-funnel"></i> Filtros Avanzados';
  });

  // ✅ Restablecer filtros
  btnResetFilters?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    filterType.value = '';
    filterSort.value = 'title-asc';
    filterTag.value = '';

    advancedFiltersState = {
      type: '',
      sort: 'title-asc',
      tag: '',
      active: false
    };

    updateActiveFiltersCount();
    if (window.applyAdvancedFilter) window.applyAdvancedFilter();
    if (window.applyFilter) window.applyFilter();
  });

  // ✅ Aplicar filtros automáticamente al cambiar valores (con debounce)
  const debouncedApply = debounce(() => {
    advancedFiltersState.type = filterType?.value || '';
    advancedFiltersState.sort = filterSort?.value || 'title-asc';
    advancedFiltersState.tag = filterTag?.value || '';
    advancedFiltersState.active = true;
    updateActiveFiltersCount();
    if (window.applyAdvancedFilter) window.applyAdvancedFilter();
    if (window.applyFilter) window.applyFilter();
  }, 500);

  filterType?.addEventListener('change', debouncedApply);
  filterSort?.addEventListener('change', debouncedApply);
  filterTag?.addEventListener('input', debouncedApply);

  // ✅ Actualizar contador de filtros activos
  function updateActiveFiltersCount() {
    let count = 0;
    if (advancedFiltersState.type) count++;
    if (advancedFiltersState.tag) count++;
    if (advancedFiltersState.sort !== 'title-asc') count++;

    if (count > 0) {
      filtersCount.textContent = count;
      activeFiltersCount.style.display = 'inline';
    } else {
      activeFiltersCount.style.display = 'none';
      advancedFiltersState.active = false;
    }
  }

  // ✅ Cargar filtros guardados del localStorage
  try {
    const savedFilters = localStorage.getItem('edusalud_advanced_filters');
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      if (parsed.type) filterType.value = parsed.type;
      if (parsed.sort) filterSort.value = parsed.sort;
      if (parsed.tag) filterTag.value = parsed.tag;

      advancedFiltersState = {
        type: parsed.type || '',
        sort: parsed.sort || 'title-asc',
        tag: parsed.tag || '',
        active: !!(parsed.type || parsed.tag || parsed.sort !== 'title-asc')
      };

      updateActiveFiltersCount();
    }
  } catch (e) {
    warn('[FILTERS] Error cargando filtros guardados:', e);
  }

  // ✅ Guardar filtros en localStorage cuando cambien
  const saveFilters = debounce(() => {
    try {
      localStorage.setItem('edusalud_advanced_filters', JSON.stringify({
        type: advancedFiltersState.type,
        sort: advancedFiltersState.sort,
        tag: advancedFiltersState.tag
      }));
    } catch (e) {
      warn('[FILTERS] Error guardando filtros:', e);
    }
  }, 1000);

  // Guardar cuando se aplican filtros
  btnApplyFilters?.addEventListener('click', saveFilters);
}

/* ===================== ATAJOS DE TECLADO ===================== */

/**
 * ✅ Configurar atajos de teclado globales
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // ✅ Prevenir atajos si el usuario está escribiendo en un input/textarea
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    );

    // Solo si estamos en Vista Master
    const masterView = $('#master');
    if (masterView && !masterView.classList.contains('hidden') && !isInputFocused) {
      // Ctrl+N (Windows/Linux) o Cmd+N (Mac): Nuevo curso
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const btnAddCourse = $('#btn-add-course');
        if (btnAddCourse && !btnAddCourse.disabled) {
          btnAddCourse.click();
          if (typeof window.showToast === 'function') {
            window.showToast('info', 'Atajo de teclado', 'Formulario de nuevo curso abierto');
          }
        }
        return;
      }

      // Ctrl+F o Cmd+F: Buscar
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = $('#masterSearch');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          if (typeof window.showToast === 'function') {
            window.showToast('info', 'Atajo de teclado', 'Campo de búsqueda activado');
          }
        }
        return;
      }

      // Ctrl+S o Cmd+S: Guardar (si hay un formulario abierto)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const modalAddCourse = $('#modalAddCourse');
        const modalEditCourse = $('#modalEditCourse');
        if (modalAddCourse && modalAddCourse.classList.contains('show')) {
          const form = $('#formAddCourse');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
          return;
        }
        if (modalEditCourse && modalEditCourse.classList.contains('show')) {
          const form = $('#formEditCourse');
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
          return;
        }
      }
    }

    // Escape: Cerrar modales (funciona en cualquier vista, excepto si hay un input enfocado)
    if (e.key === 'Escape' && !isInputFocused) {
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        const closeBtn = openModal.querySelector('.modal-close');
        if (closeBtn) {
          closeBtn.click();
        } else {
          openModal.classList.remove('show');
        }
        // Enfocar el elemento que abrió el modal si es posible
        const lastFocused = document.querySelector('[data-last-focused]');
        if (lastFocused) {
          lastFocused.focus();
          lastFocused.removeAttribute('data-last-focused');
        }
      }
      return;
    }

    // Enter: Enviar formularios (solo si no es textarea)
    if (e.key === 'Enter' && !e.shiftKey && activeElement && activeElement.tagName === 'INPUT' && activeElement.type !== 'textarea') {
      const form = activeElement.closest('form');
      if (form && !form.querySelector('textarea:focus')) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
          e.preventDefault();
          submitBtn.click();
        }
      }
    }
  });

  log('[SHORTCUTS] ✅ Atajos de teclado configurados');
}

/* ===================== NAVEGACIÓN POR TECLADO MEJORADA ===================== */

/**
 * ✅ Mejorar navegación con Tab: asegurar orden lógico y focus visible
 */
function setupKeyboardNavigation() {
  // ✅ Guardar elemento enfocado antes de abrir modal
  document.addEventListener('click', (e) => {
    if (e.target.matches('.modal-close, [data-modal-trigger]')) {
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== document.body) {
        activeElement.setAttribute('data-last-focused', 'true');
      }
    }
  });

  // ✅ Enfocar primer elemento interactivo al abrir modal
  document.addEventListener('click', (e) => {
    if (e.target.matches('#btn-add-course, [data-open-modal]')) {
      setTimeout(() => {
        const modal = document.querySelector('.modal.show');
        if (modal) {
          const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select, button:not(.modal-close)');
          if (firstInput) {
            firstInput.focus();
          }
        }
      }, 100);
    }
  });

  // ✅ Atrapa Tab dentro de modales (trap focus)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const modal = document.querySelector('.modal.show');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'input:not([disabled]):not([type="hidden"]), ' +
      'textarea:not([disabled]), ' +
      'select:not([disabled]), ' +
      'button:not([disabled]), ' +
      'a[href], ' +
      '[tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Si Tab desde el último elemento, ir al primero
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // Si Tab desde el último elemento, ir al primero
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  });

  // ✅ Mejorar navegación en listas con teclado
  document.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;

    // Navegación con flechas en listas
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      const list = activeElement.closest('[role="list"], [role="menu"], .filelist, .master-grid');
      if (list && activeElement.matches('[role="listitem"], [role="menuitem"], .file, .master-card')) {
        e.preventDefault();

        const items = Array.from(list.querySelectorAll('[role="listitem"], [role="menuitem"], .file, .master-card'));
        const currentIndex = items.indexOf(activeElement);

        if (e.key === 'ArrowDown' && currentIndex < items.length - 1) {
          items[currentIndex + 1].focus();
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          items[currentIndex - 1].focus();
        } else if (e.key === 'Home') {
          items[0].focus();
        } else if (e.key === 'End') {
          items[items.length - 1].focus();
        }
      }
    }
  });

  log('[KEYBOARD NAV] ✅ Navegación por teclado mejorada');
}

// ✅ Inicializar navegación por teclado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupKeyboardNavigation);
} else {
  setupKeyboardNavigation();
}

// Llamar después de que la página cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupKeyboardShortcuts);
} else {
  setupKeyboardShortcuts();
}

/* ===================== SISTEMA DE SHORTCUTS DE TECLADO ===================== */

/**
 * ✅ Configura todos los shortcuts de teclado de la aplicación
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // ✅ Ignorar si el usuario está escribiendo en un input/textarea
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    );

    // ✅ Detectar si es Ctrl/Cmd
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = (e.key || '').toLowerCase();

    // ✅ Shortcuts globales (funcionan en cualquier vista)

    // Ctrl/Cmd + K: Búsqueda rápida (solo si no hay input enfocado)
    if (isCtrl && key === 'k' && !isInputFocused) {
      e.preventDefault();
      const masterSearch = $('#masterSearch');
      const searchFiles = $('#search-files');

      if (masterSearch && document.getElementById('master') && !document.getElementById('master').classList.contains('hidden')) {
        masterSearch.focus();
        masterSearch.select();
      } else if (searchFiles && document.getElementById('content') && !document.getElementById('content').classList.contains('hidden')) {
        searchFiles.focus();
        searchFiles.select();
      }
      return;
    }

    // ✅ Shortcuts solo en vista maestra
    const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');

    if (isMasterView && !isInputFocused) {
      // Ctrl/Cmd + N: Agregar nuevo curso
      if (isCtrl && key === 'n') {
        e.preventDefault();
        const btnAddCourse = $('#btn-add-course');
        if (btnAddCourse) {
          btnAddCourse.click();
        }
        return;
      }

      // Ctrl/Cmd + F: Enfocar búsqueda
      if (isCtrl && key === 'f') {
        e.preventDefault();
        const masterSearch = $('#masterSearch');
        if (masterSearch) {
          masterSearch.focus();
          masterSearch.select();
        }
        return;
      }

      // Ctrl/Cmd + E: Exportar backup
      if (isCtrl && key === 'e') {
        e.preventDefault();
        const exportBtn = document.querySelector('[data-action="export-all"]');
        if (exportBtn) {
          exportBtn.click();
        }
        return;
      }

      // Ctrl/Cmd + I: Importar backup
      if (isCtrl && key === 'i') {
        e.preventDefault();
        const importBtn = document.querySelector('[data-action="import"]');
        if (importBtn) {
          importBtn.click();
        }
        return;
      }

      // Ctrl/Cmd + , (coma): Abrir ajustes
      if (isCtrl && key === ',') {
        e.preventDefault();
        const btnSettings = $('#btn-settings');
        if (btnSettings) {
          btnSettings.click();
        }
        return;
      }

      // Ctrl/Cmd + B: Abrir notificaciones
      if (isCtrl && key === 'b') {
        e.preventDefault();
        const btnNotifications = $('#btn-notifications');
        if (btnNotifications) {
          btnNotifications.click();
        }
        return;
      }
    }

    // ✅ Shortcuts en vista de contenido (curso individual)
    const isContentView = document.getElementById('content') && !document.getElementById('content').classList.contains('hidden');

    if (isContentView && !isInputFocused) {
      // Ctrl/Cmd + F: Buscar archivos
      if (isCtrl && key === 'f') {
        e.preventDefault();
        const searchFiles = $('#search-files');
        if (searchFiles) {
          searchFiles.focus();
          searchFiles.select();
        }
        return;
      }

      // Escape: Volver a vista maestra o usuario
      if (key === 'escape') {
        const btnBackToMaster = $('#btn-back-to-master');
        const btnBackToUser = $('#btn-back-to-user');

        if (btnBackToMaster && !btnBackToMaster.classList.contains('hidden')) {
          btnBackToMaster.click();
        } else if (btnBackToUser && !btnBackToUser.classList.contains('hidden')) {
          btnBackToUser.click();
        }
        return;
      }
    }

    // ✅ Shortcuts globales para modales
    if (key === 'escape') {
      // Cerrar modales abiertos
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        const closeBtn = openModal.querySelector('.modal-close');
        if (closeBtn) {
          closeBtn.click();
        }
      }

      // Cerrar paneles abiertos
      const notificationsPanel = $('#notifications-panel');
      if (notificationsPanel && notificationsPanel.style.display !== 'none') {
        const btnClose = $('#btn-close-notifications');
        if (btnClose) btnClose.click();
      }

      const settingsDropdown = $('#settingsDropdown');
      if (settingsDropdown && settingsDropdown.style.display !== 'none') {
        settingsDropdown.style.display = 'none';
        const btnSettings = $('#btn-settings');
        if (btnSettings) btnSettings.setAttribute('aria-expanded', 'false');
      }

      const settingsDropdownContent = $('#settingsDropdownContent');
      if (settingsDropdownContent && settingsDropdownContent.style.display !== 'none') {
        settingsDropdownContent.style.display = 'none';
        const btnSettingsContent = $('#btn-settings-content');
        if (btnSettingsContent) btnSettingsContent.setAttribute('aria-expanded', 'false');
      }

      // Cerrar autocompletado de búsqueda
      const autocomplete = $('#searchAutocomplete');
      if (autocomplete) {
        autocomplete.style.display = 'none';
      }
    }

    // ✅ Ctrl/Cmd + S: Guardar (si hay formulario de edición abierto)
    if (isCtrl && key === 's') {
      const editForm = document.querySelector('[data-edit-form="true"]');
      if (editForm && !isInputFocused) {
        e.preventDefault();
        const btnSave = editForm.querySelector('button.btn:not(.btn-secondary)');
        if (btnSave && !btnSave.disabled) {
          btnSave.click();
        }
        return;
      }
    }

    // ✅ Ctrl/Cmd + /: Mostrar ayuda de shortcuts
    if (isCtrl && key === '/' && !isInputFocused) {
      e.preventDefault();
      showKeyboardShortcutsHelp();
      return;
    }
  });

  log('[SHORTCUTS] ✅ Sistema de shortcuts de teclado configurado');
}

/**
 * ✅ Muestra un modal con la lista de shortcuts disponibles
 */
function showKeyboardShortcutsHelp() {
  const existingModal = document.getElementById('shortcutsHelpModal');
  if (existingModal) {
    existingModal.classList.add('show');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'shortcutsHelpModal';
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2><i class="ph ph-keyboard"></i> Atajos de Teclado</h2>
        <button class="modal-close" onclick="this.closest('.modal').classList.remove('show')">&times;</button>
      </div>
      <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--accent);">Vista Maestra</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+N</kbd> <span style="margin-left: 8px;">Agregar curso</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+F</kbd> <span style="margin-left: 8px;">Buscar cursos</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+K</kbd> <span style="margin-left: 8px;">Búsqueda rápida</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+E</kbd> <span style="margin-left: 8px;">Exportar backup</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+I</kbd> <span style="margin-left: 8px;">Importar backup</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+,</kbd> <span style="margin-left: 8px;">Ajustes</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+B</kbd> <span style="margin-left: 8px;">Notificaciones</span></div>
          </div>
        </div>
        
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--accent);">Vista de Curso</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+F</kbd> <span style="margin-left: 8px;">Buscar archivos</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Esc</kbd> <span style="margin-left: 8px;">Volver</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+S</kbd> <span style="margin-left: 8px;">Guardar (en edición)</span></div>
          </div>
        </div>
        
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: var(--accent);">Globales</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px;">
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Esc</kbd> <span style="margin-left: 8px;">Cerrar modales/paneles</span></div>
            <div><kbd style="background: var(--bg); border: 1px solid var(--border); padding: 4px 8px; border-radius: 4px; font-family: monospace;">Ctrl+/</kbd> <span style="margin-left: 8px;">Ver esta ayuda</span></div>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 12px; background: rgba(90,169,255,0.1); border-radius: 8px; font-size: 13px; color: var(--muted);">
          <strong><i class="ph ph-lightbulb"></i> Tip:</strong> Los shortcuts no funcionan cuando estás escribiendo en un campo de texto.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Cerrar al hacer click fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });

  // Cerrar con Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/* ============ login ============ */
async function tryLoginByCode(code) {
  const msg = $('#msg');
  msg.textContent = 'Verificando…';
  msg.classList.remove('error');

  // ✅ Sanitizar código
  const sanitizedCode = safeInput(code, 'code');

  if (!sanitizedCode || sanitizedCode.length === 0) {
    msg.textContent = 'Ingrese un código válido.';
    msg.classList.add('error');
    return false;
  }

  try {
    const hex = await sha256Hex(sanitizedCode);

    // ✅ Google Analytics: Tracking de intento de login
    if (typeof gtag !== 'undefined') {
      gtag('event', 'login_attempt', {
        'event_category': 'authentication',
        'event_label': 'attempt'
      });
    }

    // master
    if (hex === MASTER_HASH) {
      // ✅ Establecer flag de master autenticado (CRÍTICO para validación de seguridad)
      isMasterAuthenticated = true;
      currentKeyHex = MASTER_HASH;

      // ✅ Refresh en background (no bloquear login) con timeout corto
      if (hasRemote()) {
        log('[SYNC] Iniciando refresh de todos los cursos en background...');
        const mergedMap = getMergedAccessHashMap();
        const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
        log('[SYNC] Total de cursos a refrescar:', hexes.length);

        // Iniciar refresh en background (no await, con timeout global)
        Promise.race([
          Promise.allSettled(hexes.map((h, index) => {
            const isLast = index === hexes.length - 1;
            const label = isLast ? `[ÚLTIMO CURSO]` : '';
            log(`${label} [SYNC] Refrescando curso ${index + 1}/${hexes.length}: ${h.substring(0, 8)}...`);
            return refreshFromRemoteSilent(h)
              .then(result => {
                if (isLast) {
                  log(`[ÚLTIMO CURSO] ✅ Refresh completado para ${h.substring(0, 8)}, resultado:`, result);
                }
                return result;
              })
              .catch(e => {
                console.error(`[SYNC] ❌ Error refrescando curso ${h.substring(0, 8)}:`, e);
                return false;
              });
          })),
          new Promise(resolve => setTimeout(() => {
            log('[SYNC] Timeout refresh global, continuando...');
            resolve({});
          }, 2000)) // Timeout de 2 segundos máximo para todos los cursos
        ])
          .then(results => {
            if (Array.isArray(results)) {
              const successful = results.filter(r => r.status === 'fulfilled').length;
              const failed = results.filter(r => r.status === 'rejected').length;
              log(`[SYNC] Refresh completado: ${successful} exitosos, ${failed} fallidos`);
            }
          })
          .catch(e => {
            warn('[SYNC] Error general en refresh:', e);
          });

        log('[SYNC] Refresh iniciado en background, continuando con login...');
      }

      // Ejecutar animación de loader ahora que ya tenemos los datos
      try {
        await runLoader();
      } catch (e) { }

      clearAttempts();
      setQueryParam('code', btoa(code));

      // ✅ Cargar cursos remotos en background (no bloquear)
      refreshCustomCourses().catch(e => {
        warn('[MASTER] Error cargando cursos remotos (continuando):', e);
      });

      buildMasterGrid();
      setupMasterSearch();
      $('#year_master').textContent = new Date().getFullYear();
      showMaster();
      // ✅ Llamar setupAdvancedFilters y setupNotificationsPanel DESPUÉS de showMaster para asegurar que los elementos estén visibles
      setTimeout(() => {
        setupAdvancedFilters();
        setupNotificationsPanel();
      }, 50);

      // ✅ Google Analytics: Tracking login exitoso Master
      if (typeof gtag !== 'undefined') {
        gtag('event', 'login_success_master', {
          'event_category': 'authentication'
        });
      }

      return true;
    }

    // normal
    // ✅ CRÍTICO: Cargar cursos personalizados ANTES de validar (por si no están cargados)
    // Esto asegura que cursos personalizados recién creados estén disponibles
    if (hasRemote()) {
      log('[LOGIN] Cargando cursos personalizados antes de validar...');
      await refreshCustomCourses().catch(e => {
        warn('[LOGIN] Error cargando cursos personalizados (continuando):', e);
      });
    }

    // ✅ Obtener mergedMap DESPUÉS de cargar cursos personalizados
    const mergedMap = getMergedAccessHashMap();
    log('[LOGIN] Validando código, cursos disponibles:', Object.keys(mergedMap).length);
    log('[LOGIN] Hex a buscar:', hex.substring(0, 8) + '...');

    if (mergedMap && mergedMap[hex]) {
      log('[LOGIN] ✅ Código válido encontrado en hashmap');
      // Mostrar loader inmediatamente
      showLoader();

      // ✅ CRÍTICO: Esperar refresh ANTES de renderizar (igual que cursos base desde master)
      // Esto asegura que los archivos estén actualizados cuando se muestra el curso
      if (hasRemote()) {
        log('[SYNC] Iniciando refresh antes de mostrar curso...');
        await refreshFromRemoteSilent(hex).catch(e => {
          warn('[SYNC] Error en refresh:', e);
          return false;
        });
        log('[SYNC] ✅ Refresh completado, renderizando curso...');
      }

      // Ejecutar animación de loader después del refresh
      try {
        await runLoader();
      } catch (e) { }

      currentKeyHex = hex;
      clearAttempts();
      setQueryParam('code', btoa(code));
      renderCourse(hex);
      showContent();

      // ✅ Google Analytics: Tracking login exitoso curso
      if (typeof gtag !== 'undefined') {
        const courseData = mergedMap[hex];
        gtag('event', 'login_success_course', {
          'event_category': 'authentication',
          'event_label': courseData.card?.tag || 'unknown'
        });
      }

      return true;
    } else {
      warn('[LOGIN] ❌ Código no encontrado en hashmap');
      warn('[LOGIN] Cursos disponibles:', Object.keys(mergedMap || {}));
      warn('[LOGIN] Hex buscado:', hex.substring(0, 8) + '...');

      const attempts = recordAttempt();
      msg.textContent = 'Código inválido. Verifique y vuelva a intentar.';
      msg.classList.add('error');
      maybeShowAttemptsWarning();

      // ✅ Google Analytics: Tracking de código inválido
      if (typeof gtag !== 'undefined') {
        gtag('event', 'login_error', {
          'event_category': 'authentication',
          'event_label': 'invalid_code',
          'value': attempts
        });
      }

      return false;
    }
  } catch (e) {
    console.error(e);
    msg.textContent = 'Ocurrió un error al verificar el código.';
    msg.classList.add('error');
    return false;
  }
}

/* ============ Firebase Authentication ============ */

// ✅ Función para manejar pestañas de autenticación
function switchAuthTab(tab) {
  const tabCode = $('#tab-code');
  const tabAccount = $('#tab-account');
  const formCode = $('#form-code');
  const formAccount = $('#form-account');

  if (tab === 'code') {
    if (tabCode) tabCode.classList.add('active');
    if (tabAccount) tabAccount.classList.remove('active');
    if (formCode) formCode.classList.remove('hidden');
    if (formAccount) formAccount.classList.add('hidden');
  } else {
    if (tabCode) tabCode.classList.remove('active');
    if (tabAccount) tabAccount.classList.add('active');
    if (formCode) formCode.classList.add('hidden');
    if (formAccount) formAccount.classList.remove('hidden');
    // Mostrar formulario de login por defecto
    showLoginForm();
  }
}

// ✅ Función para mostrar formulario de login
function showLoginForm() {
  const formLogin = $('#form-login');
  const formRegister = $('#form-register');
  const formReset = $('#form-reset');

  if (formLogin) {
    formLogin.classList.remove('hidden');
  }
  if (formRegister) {
    formRegister.classList.add('hidden');
    // Resetear formulario de registro al paso 1
    const step1 = $('#register-step-1');
    const step2 = $('#register-step-2');
    const step3 = $('#register-step-3');
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';
    if (step3) step3.style.display = 'none';
    window.verifiedEmailForRegistration = null;
    window.verifiedCoursesForRegistration = null;
    window.verifiedIsAdmin = null;
    showAuthMessage('msg-register', '', false);
    showAuthMessage('msg-register-step2', '', false);
    showAuthMessage('msg-register-step3', '', false);
    clearFieldErrors();
  }
  if (formReset) {
    formReset.classList.add('hidden');
  }
}

// ✅ Función para mostrar mensaje de autenticación
function showAuthMessage(elementId, message, isError = false) {
  const msgEl = $(elementId);
  if (msgEl) {
    msgEl.textContent = message;
    msgEl.classList.remove('error');
    if (isError) {
      msgEl.classList.add('error');
    }
    // Asegurar que el mensaje sea visible
    msgEl.style.display = 'block';
    msgEl.style.visibility = 'visible';
    log('[AUTH] 💬 Mensaje mostrado:', elementId, message);
  } else {
    warn('[AUTH] ⚠️ No se encontró el elemento para mensaje:', elementId);
  }
}

// ✅ Funciones de autenticación con email/password

// ✅ Función para login con email/password
async function tryLoginByEmail() {
  // ✅ Rate limiting: prevenir ataques de fuerza bruta
  if (!checkRateLimitSimple('login')) {
    return false;
  }

  // ✅ Sanitizar inputs
  const email = getSafeInputValue('#input-email', 'email');
  const password = getSafeInputValue('#input-password', 'password'); // Password no se sanitiza

  if (!email || !password) {
    showAuthMessage('msg-auth', 'Por favor, completa todos los campos.', true);
    return false;
  }

  if (!email.includes('@')) {
    showAuthMessage('msg-auth', 'Por favor, ingresa un correo válido.', true);
    markFieldError('input-email');
    return false;
  }

  clearFieldErrors();
  showAuthMessage('msg-auth', 'Iniciando sesión…', false);

  try {
    if (!window.firebaseAuth) {
      showAuthMessage('msg-auth', 'Firebase Authentication no está disponible. Por favor, espere unos segundos e intente nuevamente.', true);
      return false;
    }

    const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const userEmail = user.email.toLowerCase().trim();

    log('[AUTH] ✅ Login exitoso:', userEmail);

    window.currentUserEmail = userEmail;

    // ✅ PRIMERO: Verificar si es administrador
    let isAdmin = false;
    try {
      log('[AUTH] 🔍 Verificando si', userEmail, 'es administrador...');
      isAdmin = await checkIsAdmin(userEmail);
      log('[AUTH] 🔍 Resultado de checkIsAdmin para', userEmail, ':', isAdmin);

      // ✅ Verificación adicional: verificar directamente si es super admin (por si checkIsAdmin falla)
      if (!isAdmin) {
        const normalizedEmail = userEmail.toLowerCase().trim();
        const isSuperAdmin = SUPER_ADMINS.includes(normalizedEmail);
        log('[AUTH] 🔍 Verificación directa de super admin:', isSuperAdmin, 'para', normalizedEmail);
        if (isSuperAdmin) {
          log('[AUTH] ✅ Detectado como super admin directamente');
          isAdmin = true;
        }
      }
    } catch (error) {
      console.error('[AUTH] ❌ Error verificando si es admin:', error);
      // Si hay error, intentar verificar directamente los super admins
      const normalizedEmail = userEmail.toLowerCase().trim();
      isAdmin = SUPER_ADMINS.includes(normalizedEmail);
      log('[AUTH] 🔍 Verificación directa de super admin (fallback):', isAdmin);
    }

    if (isAdmin) {
      // ✅ Es administrador, otorgar acceso master directamente
      log('[AUTH] ✅ Usuario es administrador, otorgando acceso master');
      showAuthMessage('msg-auth', '¡Bienvenido! Acceso de administrador activado.', false);
      await handleSuccessfulAuthWithEmail(userEmail, []); // Array vacío, pero es admin
      return true;
    }

    // ✅ Si NO es admin, verificar cursos permitidos
    showAuthMessage('msg-auth', 'Verificando cursos disponibles…', false);

    let allowedCourses;
    try {
      allowedCourses = await getCoursesForEmail(userEmail);
    } catch (error) {
      console.error('[AUTH] ❌ Error obteniendo cursos:', error);
      showAuthMessage('msg-auth', 'Error al verificar cursos. Por favor, intente nuevamente.', true);
      return false;
    }

    log('[AUTH] Cursos permitidos para', userEmail, ':', allowedCourses.length);

    if (allowedCourses.length === 0) {
      showAuthMessage('msg-auth', 'No tienes acceso a ningún curso. Contacta al administrador para solicitar acceso.', true);
      return false;
    }

    // ✅ USAR LA FUNCIÓN EXISTENTE (LÓGICA INTACTA)
    await handleSuccessfulAuthWithEmail(userEmail, allowedCourses);
    showAuthMessage('msg-auth', `¡Bienvenido! Tienes acceso a ${allowedCourses.length} curso(s).`, false);

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.LOGIN_SUCCESS, {
      email: userEmail,
      coursesCount: allowedCourses.length
    }, userEmail, false); // No enviar a Firebase para evitar spam

    return true;

  } catch (error) {
    console.error('[AUTH] ❌ Error en login:', error);
    let errorMessage = 'Error al iniciar sesión.';

    // ✅ Log de auditoría para login fallido
    const email = getSafeInputValue('#input-email', 'email');
    await auditLog(AUDIT_ACTION_TYPES.LOGIN_FAILED, {
      email: email || 'unknown',
      errorCode: error.code || 'unknown'
    }, email, false); // No enviar a Firebase para evitar spam

    // ✅ Manejar el código nuevo de Firebase que combina user-not-found y wrong-password
    if (error.code === 'auth/invalid-login-credentials' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password') {
      errorMessage = 'Correo o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.';
      markFieldError('input-email');
      markFieldError('input-password');
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Correo electrónico inválido.';
      markFieldError('input-email');
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Esta cuenta ha sido deshabilitada.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    } else {
      // ✅ Mensaje genérico sin mencionar Firebase
      errorMessage = 'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.';
    }

    showAuthMessage('msg-auth', errorMessage, true);
    return false;
  }
}

// ✅ Función para verificar correo antes de registrar
async function verifyEmailForRegistration() {
  // ✅ Rate limiting: prevenir spam de registros
  if (!checkRateLimitSimple('register')) {
    return false;
  }

  console.log('[VERIFICATION] 🚀 Iniciando verificación de email...');
  // ✅ Sanitizar email
  const email = getSafeInputValue('#input-register-email', 'email');
  console.log('[VERIFICATION] 📧 Email ingresado:', email);

  if (!email) {
    showAuthMessage('msg-register', 'Por favor, ingresa tu correo electrónico.', true);
    return false;
  }

  if (!email.includes('@')) {
    showAuthMessage('msg-register', 'Por favor, ingresa un correo válido.', true);
    markFieldError('input-register-email');
    return false;
  }

  clearFieldErrors();
  const normalizedEmail = email; // Ya está en lowercase por safeInput
  console.log('[VERIFICATION] 📧 Email normalizado:', normalizedEmail);

  showAuthMessage('msg-register', 'Verificando autorización del correo…', false);

  try {
    // ✅ PRIMERO: Verificar si es administrador
    const isAdmin = await checkIsAdmin(normalizedEmail);
    let allowedCourses = [];

    if (!isAdmin) {
      // ✅ Si NO es admin, verificar si está en algún curso
      allowedCourses = await getCoursesForEmail(normalizedEmail);

      if (allowedCourses.length === 0) {
        showAuthMessage('msg-register', 'Este correo no está autorizado para crear una cuenta. Contacta al administrador para solicitar acceso.', true);
        markFieldError('input-register-email');
        return false;
      }
    }

    // ✅ Correo autorizado (admin o tiene cursos), generar y enviar código
    showAuthMessage('msg-register', 'Generando código de verificación…', false);

    try {
      const code = generateVerificationCode();
      console.log('[VERIFICATION] 🔑 Código generado: ***'); // Código oculto por seguridad
      await saveVerificationCode(normalizedEmail, code);
      console.log('[VERIFICATION] 💾 Código guardado en Firebase');

      try {
        console.log('[VERIFICATION] 🔄 Llamando a sendVerificationCode...');
        await sendVerificationCode(normalizedEmail, code);
        console.log('[VERIFICATION] ✅ sendVerificationCode completado');
      } catch (sendError) {
        // Si falla el envío, mostrar error pero no bloquear el flujo
        // El código ya está guardado en Firebase, el usuario puede pedir reenvío
        console.error('[VERIFICATION] ❌ Error enviando código:', sendError);
        const errorMessage = sendError.message || 'Error al enviar el código';

        // Mostrar error pero permitir continuar (el código está guardado)
        showAuthMessage('msg-register', 'Error al enviar el código: ' + errorMessage + '. Puedes intentar reenviarlo más tarde.', true);

        // Aún así, mostrar el paso 2 para que pueda pedir reenvío
        window.verifiedEmailForRegistration = normalizedEmail;
        window.verifiedCoursesForRegistration = allowedCourses;
        window.verifiedIsAdmin = isAdmin || false;

        const step1 = $('#register-step-1');
        const step2 = $('#register-step-2');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';

        const verifiedEmailDisplay = $('#verified-email-display');
        if (verifiedEmailDisplay) verifiedEmailDisplay.textContent = normalizedEmail;

        const codeInput = $('#input-verification-code');
        if (codeInput) codeInput.value = '';

        showAuthMessage('msg-register-step2', 'No se pudo enviar el código. Usa el botón "Reenviar código" para intentar nuevamente.', true);
        return true; // Permitir continuar para que pueda reenviar
      }

      // ✅ Código enviado exitosamente
      window.verifiedEmailForRegistration = normalizedEmail;
      window.verifiedCoursesForRegistration = allowedCourses;
      window.verifiedIsAdmin = isAdmin || false;

      // Ocultar paso 1 y mostrar paso 2 (verificación de código)
      const step1 = $('#register-step-1');
      const step2 = $('#register-step-2');
      if (step1) step1.style.display = 'none';
      if (step2) step2.style.display = 'block';

      // Mostrar email verificado
      const verifiedEmailDisplay = $('#verified-email-display');
      if (verifiedEmailDisplay) verifiedEmailDisplay.textContent = normalizedEmail;

      // Limpiar campo de código
      const codeInput = $('#input-verification-code');
      if (codeInput) codeInput.value = '';

      // Enfocar el campo de código
      setTimeout(() => {
        if (codeInput) codeInput.focus();
      }, 100);

      showAuthMessage('msg-register-step2', 'Código enviado a tu correo. Revisa tu bandeja de entrada (y spam).', false);

      return true;
    } catch (error) {
      console.error('[VERIFICATION] ❌ Error en proceso de verificación:', error);
      showAuthMessage('msg-register', 'Error al procesar la verificación. Intenta nuevamente.', true);
      return false;
    }

  } catch (error) {
    console.error('[AUTH] ❌ Error verificando correo:', error);
    showAuthMessage('msg-register', 'Error al verificar el correo. Intenta nuevamente.', true);
    return false;
  }
}

// ✅ Función para registro con email/password (correo ya verificado)
async function tryRegister() {
  // ✅ Rate limiting: prevenir spam de registros
  if (!checkRateLimitSimple('register')) {
    return false;
  }

  // ✅ Usar el correo ya verificado (ya sanitizado)
  const email = window.verifiedEmailForRegistration;
  // ✅ Passwords no se sanitizan, se mantienen como están
  const password = $('#input-register-password')?.value || '';
  const passwordConfirm = $('#input-register-password-confirm')?.value || '';

  if (!email) {
    showAuthMessage('msg-register-step3', 'Error: El correo no fue verificado. Por favor, vuelve al paso anterior.', true);
    return false;
  }

  if (!password || !passwordConfirm) {
    showAuthMessage('msg-register-step3', 'Por favor, completa todos los campos.', true);
    return false;
  }

  if (password.length < 6) {
    showAuthMessage('msg-register-step3', 'La contraseña debe tener al menos 6 caracteres.', true);
    markFieldError('input-register-password');
    return false;
  }

  if (password !== passwordConfirm) {
    showAuthMessage('msg-register-step3', 'Las contraseñas no coinciden.', true);
    markFieldError('input-register-password-confirm');
    return false;
  }

  clearFieldErrors();
  showAuthMessage('msg-register-step3', 'Creando cuenta…', false);

  try {
    if (!window.firebaseAuth) {
      showAuthMessage('msg-register-step3', 'Firebase Authentication no está disponible. Por favor, espere unos segundos e intente nuevamente.', true);
      return false;
    }

    const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    log('[AUTH] ✅ Registro exitoso:', user.email);

    showAuthMessage('msg-register-step3', '¡Cuenta creada exitosamente! Cargando tus cursos…', false);

    // ✅ Usar los cursos ya verificados (puede ser array vacío si es admin)
    const allowedCourses = window.verifiedCoursesForRegistration || [];
    window.currentUserEmail = email;
    await handleSuccessfulAuthWithEmail(email, allowedCourses);

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.REGISTER_SUCCESS, {
      email: email,
      coursesCount: allowedCourses.length
    }, email, true); // Enviar a Firebase

    // Limpiar variables temporales
    window.verifiedEmailForRegistration = null;
    window.verifiedCoursesForRegistration = null;
    window.verifiedIsAdmin = null; // ✅ Limpiar flag de admin

    return true;

  } catch (error) {
    console.error('[AUTH] ❌ Error en registro:', error);
    let errorMessage = 'Error al crear la cuenta.';

    // ✅ Manejar errores de Firebase con mensajes amigables
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este correo ya está registrado. Inicia sesión en su lugar.';
      markFieldError('input-register-password');
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Correo electrónico inválido.';
      markFieldError('input-register-password');
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil. Usa al menos 6 caracteres.';
      markFieldError('input-register-password');
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    } else {
      // ✅ Mensaje genérico sin mencionar Firebase
      errorMessage = 'No se pudo crear la cuenta. Verifica los datos e intenta nuevamente.';
    }

    showAuthMessage('msg-register-step3', errorMessage, true);
    return false;
  }
}

// ✅ Función para verificar código de verificación
async function verifyCodeForRegistration() {
  // ✅ Rate limiting: prevenir spam de códigos
  if (!checkRateLimitSimple('verify_code')) {
    return false;
  }

  const email = window.verifiedEmailForRegistration; // Ya sanitizado
  // ✅ Sanitizar código
  const code = getSafeInputValue('#input-verification-code', 'code');

  if (!email) {
    showAuthMessage('msg-register-step2', 'Error: El correo no fue verificado. Por favor, vuelve al paso anterior.', true);
    return false;
  }

  if (!code || code.length !== 6) {
    showAuthMessage('msg-register-step2', 'Por favor, ingresa el código de 6 dígitos.', true);
    markFieldError('input-verification-code');
    return false;
  }

  clearFieldErrors();
  showAuthMessage('msg-register-step2', 'Verificando código…', false);

  const verification = await verifyCode(email, code);

  if (!verification.valid) {
    showAuthMessage('msg-register-step2', verification.error || 'Código inválido. Intenta nuevamente.', true);
    markFieldError('input-verification-code');
    return false;
  }

  // Código verificado, mostrar paso 3 (crear contraseña)
  const step2 = $('#register-step-2');
  const step3 = $('#register-step-3');
  if (step2) step2.style.display = 'none';
  if (step3) step3.style.display = 'block';

  // Limpiar campos de contraseña
  const passwordInput = $('#input-register-password');
  const passwordConfirmInput = $('#input-register-password-confirm');
  if (passwordInput) passwordInput.value = '';
  if (passwordConfirmInput) passwordConfirmInput.value = '';

  // Enfocar el primer campo de contraseña
  setTimeout(() => {
    if (passwordInput) passwordInput.focus();
  }, 100);

  showAuthMessage('msg-register-step3', 'Código verificado. Ahora crea tu contraseña.', false);
  return true;
}

// ✅ Función para reenviar código de verificación
async function resendVerificationCode() {
  const email = window.verifiedEmailForRegistration;

  if (!email) {
    showAuthMessage('msg-register-step2', 'Error: No hay correo verificado.', true);
    return false;
  }

  if (!checkRateLimitSimple('resend_code')) { // Usa configuración mejorada
    return false;
  }

  showAuthMessage('msg-register-step2', 'Reenviando código…', false);

  try {
    const code = generateVerificationCode();
    await saveVerificationCode(email, code);
    await sendVerificationCode(email, code);

    // Limpiar campo de código
    const codeInput = $('#input-verification-code');
    if (codeInput) codeInput.value = '';

    showAuthMessage('msg-register-step2', 'Código reenviado. Revisa tu correo.', false);
  } catch (error) {
    console.error('[VERIFICATION] ❌ Error reenviando código:', error);
    showAuthMessage('msg-register-step2', 'Error al reenviar el código. Intenta nuevamente.', true);
  }
}

// ✅ Función para reset de contraseña
async function tryPasswordReset() {
  // ✅ Rate limiting: prevenir spam de resets
  if (!checkRateLimitSimple('password_reset')) {
    return false;
  }

  // ✅ Sanitizar email
  const email = getSafeInputValue('#input-reset-email', 'email');

  if (!email || !email.includes('@')) {
    showAuthMessage('msg-reset', 'Por favor, ingresa un correo válido.', true);
    markFieldError('input-reset-email');
    return false;
  }

  clearFieldErrors();
  showAuthMessage('msg-reset', 'Enviando enlace de restablecimiento…', false);

  try {
    if (!window.firebaseAuth) {
      showAuthMessage('msg-reset', 'Firebase Authentication no está disponible. Por favor, espere unos segundos e intente nuevamente.', true);
      return false;
    }

    await window.firebaseAuth.sendPasswordResetEmail(email.toLowerCase().trim());

    showAuthMessage('msg-reset', '✅ Se ha enviado un enlace de restablecimiento a tu correo. Revisa tu bandeja de entrada (y spam).', false);

    setTimeout(() => {
      $('#input-reset-email').value = '';
    }, 3000);

    return true;

  } catch (error) {
    console.error('[AUTH] ❌ Error en reset:', error);
    let errorMessage = 'Error al enviar el enlace.';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe una cuenta con este correo.';
      markFieldError('input-reset-email');
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Correo electrónico inválido.';
      markFieldError('input-reset-email');
    } else {
      errorMessage = `Error: ${error.message || 'No se pudo enviar el enlace.'}`;
    }

    showAuthMessage('msg-reset', errorMessage, true);
    return false;
  }
}

// ✅ Funciones auxiliares para manejo de errores de campos
function clearFieldErrors() {
  const fields = ['input-email', 'input-password', 'input-register-email', 'input-register-password', 'input-register-password-confirm', 'input-reset-email'];
  fields.forEach(id => {
    const field = $(`#${id}`);
    if (field) {
      field.style.borderColor = '';
      field.style.backgroundColor = '';
    }
  });
}

function markFieldError(fieldId) {
  const field = $(`#${fieldId}`);
  if (field) {
    field.style.borderColor = '#ff7a7a';
    field.style.backgroundColor = 'rgba(255, 122, 122, 0.1)';
  }
}

function showAuthMessage(elementId, message, isError) {
  const msgEl = $(`#${elementId}`);
  if (!msgEl) return;

  msgEl.textContent = message;
  msgEl.className = isError ? 'msg error' : 'msg';
  msgEl.style.display = 'block';

  if (msgEl.scrollIntoView) {
    msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ✅ Funciones de Google Sign-In eliminadas (ahora se usa email/password)

// ✅ Funciones de registro y recuperación implementadas arriba (tryRegister, tryPasswordReset)

/* ============ Gestión de Correos Permitidos por Curso ============ */

// ✅ Constantes para gestión de correos permitidos por curso
const COURSE_EMAILS_PATH = 'courseEmails';
// ✅ Ruta para administradores (emails con acceso master)
const ADMINS_PATH = 'admins';
// ✅ Ruta para códigos de verificación
const VERIFICATION_CODES_PATH = 'verificationCodes';
// ✅ URL de la Cloud Function para enviar códigos de verificación
// const VERIFICATION_FUNCTION_URL = 'https://sendverificationcode-nzqxumxiba-uc.a.run.app'; // ⚠️ Ya no se usa (reemplazado por EmailJS)
// ✅ Super administradores hardcodeados (siempre tienen acceso, incluso si se borran de Firebase)
const SUPER_ADMINS = [
  'diseno.edusalud@gmail.com',
  'diseno.edusalud@unah.edu.hn'
];

// ✅ Normalizar email para usar como key en Firebase
function normalizeEmailKey(email) {
  return email.toLowerCase().trim().replace(/\./g, '_');
}

/* ============ Verificación de Código por Email ============ */

// ✅ Generar código de verificación de 6 dígitos
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Guardar código en Firebase con expiración (10 minutos)
async function saveVerificationCode(email, code) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      throw new Error('Firebase no disponible');
    }

    const emailKey = normalizeEmailKey(email);
    const codeRef = db.ref(`${VERIFICATION_CODES_PATH}/${emailKey}`);

    const codeData = {
      code: code,
      email: email.toLowerCase().trim(),
      createdAt: Date.now(),
      expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutos
      used: false
    };

    await codeRef.set(codeData);
    log('[VERIFICATION] ✅ Código guardado en Firebase para:', email);
    return true;
  } catch (error) {
    error('[VERIFICATION] ❌ Error guardando código:', error);
    throw error;
  }
}

// ✅ Enviar código de verificación usando EmailJS
async function sendVerificationCode(email, code) {
  try {
    // ✅ Verificar que EmailJS esté cargado
    if (typeof emailjs === 'undefined') {
      console.error('[VERIFICATION] ❌ EmailJS no está cargado');
      throw new Error('EmailJS no está disponible. Por favor, recarga la página.');
    }

    console.log('[VERIFICATION] 📤 Enviando código a:', email);
    console.log('[VERIFICATION] 🔧 EmailJS disponible:', typeof emailjs !== 'undefined');

    const SERVICE_ID = 'service_ectemf7';
    const TEMPLATE_ID = 'template_g9pmmxm';

    console.log('[VERIFICATION] 🔧 Service ID:', SERVICE_ID);
    console.log('[VERIFICATION] 🔧 Template ID:', TEMPLATE_ID);
    console.log('[VERIFICATION] 🔧 Datos:', { email: email, code: '***', from_name: 'EduSalud' }); // Código oculto por seguridad

    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        email: email,
        code: code,
        from_name: 'EduSalud'
      }
    );

    console.log('[VERIFICATION] ✅ Código enviado exitosamente:', result);
    return { success: true };
  } catch (error) {
    console.error('[VERIFICATION] ❌ Error enviando código:', error);
    console.error('[VERIFICATION] ❌ Detalles:', {
      message: error.message,
      text: error.text,
      status: error.status,
      stack: error.stack
    });
    throw error;
  }
}

// ✅ Verificar código ingresado por el usuario
async function verifyCode(email, code) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      throw new Error('Firebase no disponible');
    }

    const emailKey = normalizeEmailKey(email);
    const codeRef = db.ref(`${VERIFICATION_CODES_PATH}/${emailKey}`);
    const snapshot = await codeRef.once('value');

    if (!snapshot.exists()) {
      return { valid: false, error: 'Código no encontrado. Solicita uno nuevo.' };
    }

    const codeData = snapshot.val();
    const now = Date.now();

    // Verificar si el código ya fue usado
    if (codeData.used) {
      return { valid: false, error: 'Este código ya fue utilizado.' };
    }

    // Verificar si el código expiró
    if (now > codeData.expiresAt) {
      return { valid: false, error: 'El código ha expirado. Solicita uno nuevo.' };
    }

    // Verificar si el código coincide
    if (codeData.code !== code.trim()) {
      return { valid: false, error: 'Código incorrecto. Intenta nuevamente.' };
    }

    // Marcar código como usado
    await codeRef.update({ used: true });

    log('[VERIFICATION] ✅ Código verificado correctamente');
    return { valid: true };
  } catch (error) {
    error('[VERIFICATION] ❌ Error verificando código:', error);
    return { valid: false, error: 'Error al verificar el código. Intenta nuevamente.' };
  }
}

// ✅ Verificar si un correo tiene acceso a un curso específico
async function checkEmailAllowedForCourse(email, courseHex) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      warn('[AUTH] Firebase no disponible, permitiendo acceso');
      return true; // Fallback: permitir si Firebase no está disponible
    }

    const emailKey = normalizeEmailKey(email);
    const emailRef = db.ref(`${COURSE_EMAILS_PATH}/${courseHex}/${emailKey}`);
    const snapshot = await emailRef.once('value');

    if (snapshot.exists()) {
      const data = snapshot.val();
      return data && data.active !== false; // Verificar que esté activo
    }

    return false;
  } catch (error) {
    console.error('[AUTH] Error verificando correo para curso:', error);
    return false;
  }
}

// ✅ Agregar correo a un curso específico
async function addEmailToCourse(email, courseHex) {
  try {
    log('[AUTH] 🔄 Intentando agregar correo:', email, 'al curso:', courseHex?.substring(0, 8));

    if (!email || !email.includes('@')) {
      throw new Error('Correo inválido');
    }

    if (!courseHex) {
      throw new Error('Hex de curso inválido');
    }

    // ✅ Verificar que Firebase esté disponible
    log('[AUTH] Verificando Firebase DB...');
    log('[AUTH] window.firebaseDB existe:', !!window.firebaseDB);

    const db = getFirebaseDB();
    if (!db) {
      console.error('[AUTH] ❌ Firebase DB no disponible');
      console.error('[AUTH] window.firebaseDB:', window.firebaseDB);
      throw new Error('Firebase no disponible. Asegúrate de que Firebase esté cargado.');
    }

    log('[AUTH] ✅ Firebase DB disponible');

    const emailKey = normalizeEmailKey(email);
    log('[AUTH] Email key normalizado:', emailKey);

    // Obtener usuario actual (si está autenticado)
    const currentUser = window.firebaseAuth?.currentUser;
    const addedBy = currentUser?.email || 'master';
    log('[AUTH] Agregado por:', addedBy);

    const emailData = {
      email: email.toLowerCase().trim(),
      addedBy: addedBy,
      addedAt: new Date().toISOString(),
      active: true
    };

    log('[AUTH] Datos a guardar:', emailData);
    log('[AUTH] Ruta completa:', `${COURSE_EMAILS_PATH}/${courseHex}/${emailKey}`);

    // ✅ Intentar guardar en Firebase
    const ref = db.ref(`${COURSE_EMAILS_PATH}/${courseHex}/${emailKey}`);
    log('[AUTH] 🔄 Guardando en Firebase...');

    await ref.set(emailData);

    log('[AUTH] ✅ Correo agregado exitosamente al curso:', email, courseHex.substring(0, 8));

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.EMAIL_ADDED, {
      email: email.toLowerCase(),
      courseHex: courseHex.substring(0, 8),
      addedBy: addedBy
    }, null, true);

    // ✅ Verificar que se guardó correctamente
    const verifySnapshot = await ref.once('value');
    if (verifySnapshot.exists()) {
      log('[AUTH] ✅ Verificación: Correo guardado correctamente en Firebase');
      log('[AUTH] Datos verificados:', verifySnapshot.val());
    } else {
      console.error('[AUTH] ⚠️ ADVERTENCIA: El correo no se encontró después de guardarlo');
    }

    return true;
  } catch (error) {
    console.error('[AUTH] ❌ Error agregando correo al curso:', error);
    console.error('[AUTH] Tipo de error:', error.name);
    console.error('[AUTH] Mensaje:', error.message);
    console.error('[AUTH] Stack:', error.stack);

    // ✅ Si es un error de permisos, dar mensaje más claro
    if (error.code === 'PERMISSION_DENIED' || error.message?.includes('PERMISSION_DENIED')) {
      throw new Error('Permisos denegados. Verifica las reglas de Firebase Realtime Database para permitir escritura en "courseEmails".');
    }

    throw error;
  }
}

// ✅ Eliminar correo de un curso específico
async function removeEmailFromCourse(email, courseHex) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      throw new Error('Firebase no disponible');
    }

    const emailKey = normalizeEmailKey(email);
    await db.ref(`${COURSE_EMAILS_PATH}/${courseHex}/${emailKey}`).remove();
    log('[AUTH] ✅ Correo eliminado del curso:', email, courseHex.substring(0, 8));

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.EMAIL_REMOVED, {
      email: email.toLowerCase(),
      courseHex: courseHex.substring(0, 8)
    }, null, true);

    return true;
  } catch (error) {
    console.error('[AUTH] Error eliminando correo del curso:', error);
    throw error;
  }
}

// ✅ Obtener lista de correos permitidos para un curso
async function getCourseAllowedEmails(courseHex) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      return [];
    }

    const emailsRef = db.ref(`${COURSE_EMAILS_PATH}/${courseHex}`);
    const snapshot = await emailsRef.once('value');

    if (!snapshot.exists()) {
      return [];
    }

    const emails = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data && data.active !== false) {
        emails.push({
          email: data.email,
          addedBy: data.addedBy || 'desconocido',
          addedAt: data.addedAt || new Date().toISOString(),
          key: childSnapshot.key
        });
      }
    });

    // Ordenar por fecha de agregado (más recientes primero)
    emails.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    return emails;
  } catch (error) {
    console.error('[AUTH] Error obteniendo correos del curso:', error);
    return [];
  }
}

// ✅ Obtener cursos a los que un correo tiene acceso (con timeout y mejor manejo de errores)
async function getCoursesForEmail(email) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      warn('[AUTH] Firebase DB no disponible, retornando array vacío');
      return [];
    }

    log('[AUTH] 🔍 Buscando cursos para:', email);
    const courseEmailsRef = db.ref(COURSE_EMAILS_PATH);

    // ✅ Agregar timeout de 10 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: La consulta a Firebase tardó demasiado')), 10000);
    });

    const snapshotPromise = courseEmailsRef.once('value');
    const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);

    if (!snapshot.exists()) {
      log('[AUTH] ✅ No hay cursos configurados aún');
      return [];
    }

    const emailKey = normalizeEmailKey(email);
    log('[AUTH] 🔑 Email key normalizado:', emailKey);
    const allowedCourses = [];

    snapshot.forEach((courseSnapshot) => {
      const courseHex = courseSnapshot.key;
      const emailData = courseSnapshot.child(emailKey).val();

      if (emailData && emailData.active !== false) {
        log('[AUTH] ✅ Encontrado acceso para curso:', courseHex.substring(0, 8));
        allowedCourses.push(courseHex);
      }
    });

    log('[AUTH] ✅ Total de cursos permitidos:', allowedCourses.length);
    return allowedCourses;
  } catch (error) {
    console.error('[AUTH] ❌ Error obteniendo cursos para correo:', error);
    console.error('[AUTH] Tipo de error:', error.name);
    console.error('[AUTH] Mensaje:', error.message);

    // ✅ Si es timeout, retornar array vacío pero loguear
    if (error.message && error.message.includes('Timeout')) {
      warn('[AUTH] ⚠️ Timeout en consulta, retornando array vacío');
      return [];
    }

    return [];
  }
}

/* ============ Gestión de Administradores ============ */

// ✅ Verificar si un email es administrador
async function checkIsAdmin(email) {
  // ✅ PRIMERO: Verificar si es super admin (hardcodeado - siempre disponible)
  const normalizedEmail = email.toLowerCase().trim();
  if (SUPER_ADMINS.includes(normalizedEmail)) {
    log('[ADMIN] ✅ Email es super administrador (hardcodeado):', normalizedEmail);
    return true;
  }

  // ✅ Luego verificar en Firebase
  try {
    const db = getFirebaseDB();
    if (!db) {
      warn('[ADMIN] Firebase no disponible, retornando false');
      return false;
    }

    const emailKey = normalizeEmailKey(email);
    const adminRef = db.ref(`${ADMINS_PATH}/${emailKey}`);
    const snapshot = await adminRef.once('value');

    if (snapshot.exists()) {
      const data = snapshot.val();
      return data && data.active !== false; // Verificar que esté activo
    }

    return false;
  } catch (error) {
    console.error('[ADMIN] Error verificando si es admin:', error);
    return false;
  }
}

// ✅ Agregar administrador
async function addAdmin(email) {
  try {
    if (!email || !email.includes('@')) {
      throw new Error('Correo inválido');
    }

    const db = getFirebaseDB();
    if (!db) {
      throw new Error('Firebase no disponible');
    }

    const emailKey = normalizeEmailKey(email);
    const currentUser = window.firebaseAuth?.currentUser;
    const addedBy = currentUser?.email || 'master';

    const adminData = {
      email: email.toLowerCase().trim(),
      role: 'admin',
      addedBy: addedBy,
      addedAt: new Date().toISOString(),
      active: true
    };

    const ref = db.ref(`${ADMINS_PATH}/${emailKey}`);
    await ref.set(adminData);

    log('[ADMIN] ✅ Administrador agregado:', email);

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.ADMIN_ADDED, {
      email: email.toLowerCase(),
      addedBy: addedBy
    }, null, true);

    return true;
  } catch (error) {
    console.error('[ADMIN] ❌ Error agregando administrador:', error);
    throw error;
  }
}

// ✅ Eliminar administrador
async function removeAdmin(email) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      throw new Error('Firebase no disponible');
    }

    const emailKey = normalizeEmailKey(email);
    await db.ref(`${ADMINS_PATH}/${emailKey}`).remove();

    log('[ADMIN] ✅ Administrador eliminado:', email);

    // ✅ Log de auditoría
    await auditLog(AUDIT_ACTION_TYPES.ADMIN_REMOVED, {
      email: email.toLowerCase()
    }, null, true);

    return true;
  } catch (error) {
    console.error('[ADMIN] ❌ Error eliminando administrador:', error);
    throw error;
  }
}

// ✅ Obtener lista de administradores
async function getAdmins() {
  try {
    const db = getFirebaseDB();
    if (!db) {
      return [];
    }

    const adminsRef = db.ref(ADMINS_PATH);
    const snapshot = await adminsRef.once('value');

    if (!snapshot.exists()) {
      return [];
    }

    const admins = [];
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data && data.active !== false) {
        admins.push({
          email: data.email,
          role: data.role || 'admin',
          addedBy: data.addedBy || 'desconocido',
          addedAt: data.addedAt || new Date().toISOString(),
          key: childSnapshot.key
        });
      }
    });

    // Ordenar por fecha de agregado (más recientes primero)
    admins.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    return admins;
  } catch (error) {
    console.error('[ADMIN] Error obteniendo administradores:', error);
    return [];
  }
}

// ✅ Mostrar modal de correos permitidos para un curso
let currentCourseEmailsHex = null;

async function showCourseEmailsModal(courseHex, courseTitle) {
  currentCourseEmailsHex = courseHex;
  const modal = $('#modalCourseEmails');
  const title = $('#modalCourseEmailsTitle');
  const input = $('#input-course-email');
  const msgEl = $('#msg-course-emails');

  if (title) {
    // ✅ Sanitizar título del curso
    const safeTitle = sanitizeHTML(courseTitle);
    title.innerHTML = `<i class="ph ph-envelope"></i> Correos Permitidos: ${safeTitle}`;
  }

  if (input) {
    input.value = '';
  }

  if (msgEl) {
    msgEl.textContent = '';
    msgEl.classList.remove('error');
  }

  if (modal) {
    modal.classList.add('show');
    await renderCourseEmailsList(courseHex);

    // Enfocar el input
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  }
}

// ✅ Cerrar modal de correos
function closeCourseEmailsModal() {
  const modal = $('#modalCourseEmails');
  if (modal) {
    modal.classList.remove('show');
  }
  currentCourseEmailsHex = null;
}

// ✅ Renderizar lista de correos permitidos para un curso
async function renderCourseEmailsList(courseHex) {
  const container = $('#course-emails-list');
  if (!container) return;

  try {
    const emails = await getCourseAllowedEmails(courseHex);

    if (emails.length === 0) {
      container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:20px; margin:0;">No hay correos autorizados para este curso. Agrega el primer correo usando el formulario de arriba.</p>';
      return;
    }

    container.innerHTML = emails.map(email => {
      const addedDate = new Date(email.addedAt);
      const formattedDate = addedDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <div class="file" style="display:flex; align-items:center; justify-content:space-between;">
          <div style="flex:1;">
            <strong>${email.email}</strong>
            <div class="meta" style="margin-top:4px;">
              Agregado por: ${email.addedBy} • ${formattedDate}
            </div>
          </div>
          <button 
            class="btn secondary remove-course-email-btn" 
            data-email="${email.email.replace(/"/g, '&quot;')}"
            style="padding:6px 12px; font-size:13px;"
            title="Eliminar acceso para ${email.email.replace(/"/g, '&quot;')}"
          >
            🗑️ Eliminar
          </button>
        </div>
      `;
    }).join('');

    // ✅ Agregar event listeners a los botones de eliminar
    container.querySelectorAll('.remove-course-email-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.getAttribute('data-email');
        if (email && currentCourseEmailsHex) {
          removeCourseEmailUI(email, currentCourseEmailsHex);
        }
      });
    });
  } catch (error) {
    console.error('[AUTH] Error renderizando correos del curso:', error);
    container.innerHTML = '<p style="color:var(--danger); text-align:center; padding:20px; margin:0;">Error al cargar la lista de correos.</p>';
  }
}

// ✅ Agregar correo a un curso desde UI
async function addCourseEmailUI() {
  // ✅ Rate limiting: prevenir spam de agregar emails
  if (!checkRateLimitSimple('agregar email')) {
    return;
  }

  if (!currentCourseEmailsHex) {
    console.error('[AUTH] No hay curso seleccionado');
    if (typeof window.showToast === 'function') {
      window.showToast('Error', 'No hay curso seleccionado', 'error');
    }
    return;
  }

  const input = $('#input-course-email');
  const msgEl = $('#msg-course-emails');

  if (!input || !input.value.trim()) {
    if (msgEl) {
      msgEl.textContent = 'Ingrese un correo válido.';
      msgEl.classList.add('error');
    }
    return;
  }

  // ✅ Sanitizar email
  const email = getSafeInputValue('#input-course-email', 'email');

  // Validar formato básico de email
  if (!email || !email.includes('@') || !email.includes('.')) {
    if (msgEl) {
      msgEl.textContent = 'Por favor, ingrese un correo electrónico válido.';
      msgEl.classList.add('error');
    }
    return;
  }

  try {
    log('[AUTH] 🔄 Iniciando proceso de agregar correo...');

    // Verificar si ya existe
    const existingEmails = await getCourseAllowedEmails(currentCourseEmailsHex);
    if (existingEmails.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      if (msgEl) {
        msgEl.textContent = `El correo "${email}" ya está en la lista.`;
        msgEl.classList.add('error');
      }
      return;
    }

    // ✅ Mostrar indicador de carga
    if (msgEl) {
      msgEl.textContent = 'Agregando correo...';
      msgEl.classList.remove('error');
    }

    await addEmailToCourse(email, currentCourseEmailsHex);

    input.value = '';
    if (msgEl) {
      // ✅ Sanitizar email antes de usar en innerHTML
      const safeEmail = sanitizeHTML(email);
      msgEl.innerHTML = `<i class="ph ph-check-circle"></i> Correo "${safeEmail}" agregado exitosamente.`;
      msgEl.classList.remove('error');
    }
    if (typeof window.showToast === 'function') {
      // ✅ Sanitizar email para toast
      const safeEmail = sanitizeHTML(email);
      window.showToast('Correo agregado', `"${safeEmail}" ahora tiene acceso a este curso`, 'success');
    }

    // ✅ Refrescar la lista
    await renderCourseEmailsList(currentCourseEmailsHex);

    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      if (msgEl) msgEl.textContent = '';
    }, 3000);
  } catch (error) {
    console.error('[AUTH] ❌ Error en addCourseEmailUI:', error);

    const errorMessage = error.message || 'No se pudo agregar el correo.';

    if (msgEl) {
      msgEl.innerHTML = `<i class="ph ph-x-circle"></i> Error: ${errorMessage}`;
      msgEl.classList.add('error');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Error', errorMessage, 'error');
    }
  }
}

// ✅ Eliminar correo de un curso desde UI
async function removeCourseEmailUI(email, courseHex) {
  if (!confirm(`¿Eliminar acceso para "${email}"?\n\nEl usuario ya no podrá acceder a este curso con este correo.`)) {
    return;
  }

  try {
    await removeEmailFromCourse(email, courseHex);
    if (typeof window.showToast === 'function') {
      window.showToast('Correo eliminado', `"${email}" ya no tiene acceso a este curso`, 'success');
    }
    await renderCourseEmailsList(courseHex);
  } catch (error) {
    if (typeof window.showToast === 'function') {
      window.showToast('Error', `No se pudo eliminar: ${error.message}`, 'error');
    }
  }
}

/* ============ Gestión General de Correos ============ */

// ✅ Mostrar modal de gestión general de correos
async function showGeneralEmailsModal() {
  const modal = $('#modalGeneralEmails');
  if (!modal) {
    console.error('[EMAILS] Modal de gestión general no encontrado');
    return;
  }

  modal.classList.add('show');
  await renderGeneralEmailsList();

  // Enfocar el input de búsqueda
  const searchInput = $('#input-search-course-emails');
  if (searchInput) {
    setTimeout(() => searchInput.focus(), 100);
  }
}

// ✅ Cerrar modal de gestión general
function closeGeneralEmailsModal() {
  const modal = $('#modalGeneralEmails');
  if (modal) {
    modal.classList.remove('show');
  }
}

// ✅ Obtener todos los cursos como array
function getAllCourses() {
  const mergedMap = getMergedAccessHashMap();
  const coursesArray = Object.entries(mergedMap)
    .filter(([hex]) => hex !== MASTER_HASH)
    .map(([hex, data]) => ({
      hex: hex,
      title: data.title || 'Sin título',
      meta: data.meta || 'Sin descripción',
      type: data.type || 'curso',
      tag: data.card?.tag || '',
      createdAt: data.createdAt || data.updatedAt || Date.now()
    }));

  return coursesArray;
}

// ✅ Renderizar lista general de cursos con sus correos
async function renderGeneralEmailsList() {
  const container = $('#general-emails-list');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:40px; margin:0;">Cargando cursos y correos...</p>';

  try {
    // Obtener todos los cursos
    const allCourses = getAllCourses();
    log('[EMAILS] Total de cursos:', allCourses.length);

    if (allCourses.length === 0) {
      container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:40px; margin:0;">No hay cursos disponibles.</p>';
      return;
    }

    // Obtener correos para cada curso
    const coursesWithEmails = await Promise.all(
      allCourses.map(async (course) => {
        const emails = await getCourseAllowedEmails(course.hex);
        return {
          ...course,
          emails: emails
        };
      })
    );

    // Renderizar
    container.innerHTML = coursesWithEmails.map(course => {
      const typeIcon = getTypeIcon(course.type || 'curso');
      const emailsCount = course.emails.length;
      const emailsList = course.emails.length > 0
        ? course.emails.map(e => {
          const emailEscaped = e.email.replace(/'/g, "\\'");
          return `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(90,169,255,0.05); border-radius:6px; margin-bottom:6px;">
                <div>
                  <span style="font-weight:500;">${e.email}</span>
                  <span style="color:var(--muted); font-size:12px; margin-left:8px;">agregado ${new Date(e.addedAt).toLocaleDateString('es-ES')}</span>
                </div>
                <button class="btn secondary" style="padding:4px 12px; font-size:12px;" onclick="window.removeEmailFromGeneral('${emailEscaped}', '${course.hex}')">
                  🗑️ Eliminar
                </button>
              </div>
            `;
        }).join('')
        : '<p style="color:var(--muted); text-align:center; padding:12px; margin:0; font-size:13px;">No hay correos autorizados</p>';

      return `
        <div class="card" style="padding:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <div>
              <h4 style="margin:0; font-size:16px; display:flex; align-items:center; gap:8px;">
                ${typeIcon} ${(course.title || 'Sin título').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
              </h4>
              <p style="margin:4px 0 0 0; color:var(--muted); font-size:13px;">${(course.meta || 'Sin descripción').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="color:var(--muted); font-size:13px;">${emailsCount} correo${emailsCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div style="margin-bottom:12px;">
            <div style="display:flex; gap:8px;">
              <input 
                id="input-email-${course.hex}" 
                class="input" 
                type="email" 
                placeholder="correo@ejemplo.com" 
                style="flex:1; font-size:13px;"
                onkeydown="if(event.key==='Enter') window.addEmailToGeneral('${course.hex}')"
              />
              <button class="btn" style="padding:8px 16px; font-size:13px;" onclick="window.addEmailToGeneral('${course.hex}')">
                ➕ Agregar
              </button>
            </div>
          </div>
          
          <div style="max-height:200px; overflow-y:auto;">
            ${emailsList}
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('[EMAILS] Error renderizando lista general:', error);
    container.innerHTML = '<p style="color:var(--danger); text-align:center; padding:40px; margin:0;">Error al cargar cursos y correos.</p>';
  }
}

// ✅ Función auxiliar para obtener ícono de tipo
function getTypeIcon(type) {
  const icons = {
    'curso': '<i class="ph ph-book-open"></i>',
    'diplomado': '<i class="ph ph-graduation-cap"></i>',
    'webinar': '<i class="ph ph-monitor"></i>',
    'seminario': '<i class="ph ph-note"></i>',
    'taller': '<i class="ph ph-wrench"></i>'
  };
  return icons[type] || '<i class="ph ph-books"></i>';
}

// ✅ Agregar correo desde la vista general (función global para usar en onclick)
window.addEmailToGeneral = async function (courseHex) {
  const input = $(`#input-email-${courseHex}`);
  const msgEl = $('#msg-general-emails');

  if (!input || !input.value.trim()) {
    if (msgEl) {
      msgEl.textContent = 'Ingrese un correo válido.';
      msgEl.classList.add('error');
    }
    return;
  }

  const email = input.value.trim();

  if (!email.includes('@') || !email.includes('.')) {
    if (msgEl) {
      msgEl.textContent = 'Por favor, ingrese un correo electrónico válido.';
      msgEl.classList.add('error');
    }
    return;
  }

  try {
    // Verificar si ya existe
    const existingEmails = await getCourseAllowedEmails(courseHex);
    if (existingEmails.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      if (msgEl) {
        msgEl.textContent = `El correo "${email}" ya está en la lista.`;
        msgEl.classList.add('error');
      }
      return;
    }

    if (msgEl) {
      msgEl.textContent = 'Agregando correo...';
      msgEl.classList.remove('error');
    }

    await addEmailToCourse(email, courseHex);

    input.value = '';
    if (msgEl) {
      // ✅ Sanitizar email antes de usar en innerHTML
      const safeEmail = sanitizeHTML(email);
      msgEl.innerHTML = `<i class="ph ph-check-circle"></i> Correo "${safeEmail}" agregado exitosamente.`;
      msgEl.classList.remove('error');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Correo agregado', `"${email}" ahora tiene acceso a este curso`, 'success');
    }

    // Refrescar la lista
    await renderGeneralEmailsList();

    setTimeout(() => {
      if (msgEl) msgEl.textContent = '';
    }, 3000);
  } catch (error) {
    console.error('[EMAILS] Error agregando correo:', error);
    const errorMessage = error.message || 'No se pudo agregar el correo.';

    if (msgEl) {
      // ✅ Sanitizar mensaje de error
      const safeError = sanitizeHTML(errorMessage);
      msgEl.innerHTML = `<i class="ph ph-x-circle"></i> Error: ${safeError}`;
      msgEl.classList.add('error');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Error', errorMessage, 'error');
    }
  }
};

// ✅ Eliminar correo desde la vista general (función global para usar en onclick)
window.removeEmailFromGeneral = async function (email, courseHex) {
  if (!confirm(`¿Eliminar acceso para "${email}"?\n\nEl usuario ya no podrá acceder a este curso con este correo.`)) {
    return;
  }

  try {
    await removeEmailFromCourse(email, courseHex);
    if (typeof window.showToast === 'function') {
      window.showToast('Correo eliminado', `"${email}" ya no tiene acceso a este curso`, 'success');
    }
    await renderGeneralEmailsList();
  } catch (error) {
    if (typeof window.showToast === 'function') {
      window.showToast('Error', `No se pudo eliminar: ${error.message}`, 'error');
    }
  }
};

/* ============ Gestión de Administradores (UI) ============ */

// ✅ Mostrar modal de administradores
async function showAdminsModal() {
  const modal = $('#modalAdmins');
  if (!modal) {
    console.error('[ADMIN] Modal de administradores no encontrado');
    return;
  }

  modal.classList.add('show');
  await renderAdminsList();

  // Enfocar el input de email
  const emailInput = $('#input-admin-email');
  if (emailInput) {
    setTimeout(() => emailInput.focus(), 100);
  }
}

// ✅ Cerrar modal de administradores
function closeAdminsModal() {
  const modal = $('#modalAdmins');
  if (modal) {
    modal.classList.remove('show');
  }
}

// ✅ Renderizar lista de administradores
async function renderAdminsList() {
  const container = $('#admins-list');
  if (!container) return;

  container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:20px; margin:0;">Cargando administradores...</p>';

  try {
    const admins = await getAdmins();

    if (admins.length === 0) {
      container.innerHTML = '<p style="color:var(--muted); text-align:center; padding:40px; margin:0;">No hay administradores registrados.</p>';
      return;
    }

    container.innerHTML = '';

    admins.forEach((admin) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px;';

      const info = document.createElement('div');
      info.style.cssText = 'flex:1; min-width:0;';

      const email = document.createElement('div');
      email.style.cssText = 'font-weight:500; color:var(--text); margin-bottom:4px;';
      email.textContent = admin.email;

      const meta = document.createElement('div');
      meta.style.cssText = 'font-size:12px; color:var(--muted);';
      const addedDate = admin.addedAt ? new Date(admin.addedAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'Fecha desconocida';
      meta.textContent = `Agregado el ${addedDate} por ${admin.addedBy}`;

      info.appendChild(email);
      info.appendChild(meta);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn secondary';
      removeBtn.type = 'button';
      removeBtn.textContent = 'Eliminar';
      removeBtn.style.cssText = 'white-space:nowrap;';
      removeBtn.setAttribute('aria-label', `Eliminar administrador ${admin.email}`);
      removeBtn.addEventListener('click', async () => {
        if (!confirm(`¿Eliminar acceso de administrador para "${admin.email}"?\n\nEl usuario ya no tendrá acceso master.`)) {
          return;
        }

        try {
          await removeAdmin(admin.email);
          if (typeof window.showToast === 'function') {
            window.showToast('Administrador eliminado', `"${admin.email}" ya no tiene acceso master`, 'success');
          }
          await renderAdminsList();
        } catch (error) {
          if (typeof window.showToast === 'function') {
            window.showToast('Error', `No se pudo eliminar: ${error.message}`, 'error');
          }
        }
      });

      item.appendChild(info);
      item.appendChild(removeBtn);
      container.appendChild(item);
    });
  } catch (error) {
    console.error('[ADMIN] Error renderizando lista:', error);
    container.innerHTML = '<p style="color:var(--error); text-align:center; padding:20px; margin:0;">Error al cargar administradores.</p>';
  }
}

// ✅ Agregar administrador desde UI
async function addAdminUI() {
  // ✅ Rate limiting: prevenir spam de agregar administradores
  if (!checkRateLimitSimple('agregar admin')) {
    return;
  }

  const input = $('#input-admin-email');
  const msgEl = $('#msg-admins');

  if (!input) return;

  // ✅ Sanitizar email
  const email = getSafeInputValue('#input-admin-email', 'email');

  if (!email || !email.includes('@')) {
    if (msgEl) {
      msgEl.innerHTML = '<i class="ph ph-x-circle"></i> Ingresa un correo válido.';
      msgEl.classList.add('error');
    }
    return;
  }

  try {
    await addAdmin(email);

    // Limpiar input
    input.value = '';
    if (msgEl) {
      msgEl.innerHTML = `<i class="ph ph-check-circle" style="font-size: 14px; vertical-align: middle;"></i> Administrador "${escapeHTML(email)}" agregado exitosamente.`;
      msgEl.classList.remove('error');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Administrador agregado', `"${email}" ahora tiene acceso master`, 'success');
    }

    // Refrescar la lista
    await renderAdminsList();

    setTimeout(() => {
      if (msgEl) msgEl.textContent = '';
    }, 3000);
  } catch (error) {
    console.error('[ADMIN] Error agregando administrador:', error);
    const errorMessage = error.message || 'No se pudo agregar el administrador.';

    if (msgEl) {
      // ✅ Sanitizar mensaje de error
      const safeError = sanitizeHTML(errorMessage);
      msgEl.innerHTML = `<i class="ph ph-x-circle"></i> Error: ${safeError}`;
      msgEl.classList.add('error');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Error', errorMessage, 'error');
    }
  }
}

// ✅ Función para manejar autenticación exitosa con email (mostrar solo cursos permitidos)
async function handleSuccessfulAuthWithEmail(userEmail, allowedCourses) {
  log('[AUTH] ✅ Mostrando cursos permitidos para:', userEmail);

  // ✅ VERIFICAR SI ES ADMINISTRADOR (otorgar acceso master)
  const isAdmin = await checkIsAdmin(userEmail);
  if (isAdmin) {
    log('[AUTH] ✅ Usuario es administrador, otorgando acceso master');
    // Establecer flags de master
    isMasterAuthenticated = true;
    currentKeyHex = MASTER_HASH;

    // ✅ Refresh en background (no bloquear login)
    if (hasRemote()) {
      log('[SYNC] Iniciando refresh de todos los cursos en background...');
      const mergedMap = getMergedAccessHashMap();
      const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
      log('[SYNC] Total de cursos a refrescar:', hexes.length);

      Promise.allSettled(hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
        warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
        return false;
      }))).then(() => {
        log('[SYNC] ✅ Refresh completado');
      });
    }

    try {
      await runLoader();
    } catch (e) { }

    clearAttempts();

    refreshCustomCourses().catch(e => {
      warn('[MASTER] Error cargando cursos remotos (continuando):', e);
    });

    // ✅ Mostrar vista master para administradores
    buildMasterGrid();
    setupMasterSearch();
    $('#year_master').textContent = new Date().getFullYear();
    showMaster();
    return;
  }

  // ✅ Si NO es admin, comportamiento normal (vista de usuario)
  // Guardar cursos permitidos en variable global para filtrar
  window.allowedCoursesForUser = allowedCourses;

  // ✅ Refresh en background (no bloquear login)
  if (hasRemote()) {
    log('[SYNC] Iniciando refresh de cursos permitidos en background...');
    Promise.allSettled(allowedCourses.map(h => refreshFromRemoteSilent(h).catch(e => {
      warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
      return false;
    }))).then(() => {
      log('[SYNC] ✅ Refresh completado');
    });
  }

  try {
    await runLoader();
  } catch (e) { }

  clearAttempts();

  refreshCustomCourses().catch(e => {
    warn('[MASTER] Error cargando cursos remotos (continuando):', e);
  });

  // ✅ Construir grid de usuario (vista simplificada)
  buildUserGrid();
  $('#year_master').textContent = new Date().getFullYear();
  showUserView();
}

// ✅ Función para logout de Firebase
async function logoutFirebase() {
  try {
    if (window.firebaseAuth) {
      await window.firebaseAuth.signOut();
      log('[AUTH] ✅ Logout exitoso');
    }
    // ✅ Limpiar flag de master al cerrar sesión
    isMasterAuthenticated = false;
    currentKeyHex = null;
  } catch (error) {
    console.error('[AUTH] ❌ Error en logout:', error);
  }
}

// ✅ Función compartida para manejar autenticación exitosa (código o Google)
async function handleSuccessfulAuth(hex, method = 'code') {
  log('[AUTH] ✅ Autenticación exitosa por:', method);

  // Si es master, mostrar vista master
  if (hex === MASTER_HASH) {
    // ✅ Establecer flag de master autenticado
    isMasterAuthenticated = true;
    currentKeyHex = MASTER_HASH; // ✅ Establecer currentKeyHex para validación
    // ✅ Refresh en background (no bloquear login)
    if (hasRemote()) {
      log('[SYNC] Iniciando refresh de todos los cursos en background...');
      const mergedMap = getMergedAccessHashMap();
      const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
      log('[SYNC] Total de cursos a refrescar:', hexes.length);

      Promise.allSettled(hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
        warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
        return false;
      }))).then(() => {
        log('[SYNC] ✅ Refresh completado');
      });
    }

    try {
      await runLoader();
    } catch (e) { }

    clearAttempts();
    if (method === 'code') {
      const code = $('#code').value;
      if (code) setQueryParam('code', btoa(code));
    }

    refreshCustomCourses().catch(e => {
      warn('[MASTER] Error cargando cursos remotos (continuando):', e);
    });

    buildMasterGrid();
    setupMasterSearch();
    $('#year_master').textContent = new Date().getFullYear();
    showMaster();
  } else {
    // Curso individual
    showLoader();

    if (hasRemote()) {
      await refreshFromRemoteSilent(hex).catch(e => {
        warn('[SYNC] Error en refresh:', e);
      });
    }

    try {
      await runLoader();
    } catch (e) { }

    currentKeyHex = hex;
    clearAttempts();
    if (method === 'code') {
      const code = $('#code').value;
      if (code) setQueryParam('code', btoa(code));
    }
    renderCourse(hex);
    showContent();
  }
}

// ✅ Listener para estado de autenticación persistente
function setupAuthStateListener() {
  if (!window.firebaseAuth) {
    log('[AUTH] Firebase Auth no disponible, omitiendo listener de estado');
    return;
  }

  window.firebaseAuth.onAuthStateChanged(async (user) => {
    log('[AUTH] 🔔 onAuthStateChanged disparado, usuario:', user?.email || 'null');

    if (user) {
      log('[AUTH] ✅ Usuario autenticado:', user.email);
      const userEmail = user.email.toLowerCase().trim();

      const urlParams = new URLSearchParams(window.location.search);
      const masterEl = document.getElementById('master');
      const userViewEl = document.getElementById('user-view');
      const contentEl = document.getElementById('content');
      const accessEl = document.getElementById('access');
      const isInMaster = currentKeyHex === MASTER_HASH || (masterEl && !masterEl.classList.contains('hidden'));
      const isInUserView = userViewEl && !userViewEl.classList.contains('hidden');
      const isInContent = contentEl && !contentEl.classList.contains('hidden');
      const isInAccess = accessEl && !accessEl.classList.contains('hidden');

      // ✅ PRIMERO: Verificar si el usuario está en vista de usuario y perdió acceso
      if (isInUserView && !isInMaster) {
        log('[AUTH] 🔍 Verificando acceso del usuario en vista de usuario...');
        const allowedCourses = await getCoursesForEmail(userEmail);

        if (allowedCourses.length === 0) {
          log('[AUTH] ⚠️ Usuario perdió acceso a todos los cursos, cerrando sesión...');
          window.currentUserEmail = null;
          window.allowedCoursesForUser = null;

          // Cerrar sesión de Firebase
          await logoutFirebase();

          // Limpiar estado
          currentKeyHex = null;
          setQueryParam('code', null);

          // Mostrar mensaje y redirigir a pantalla de acceso
          showAccess();
          showAuthMessage('msg-auth', 'Tu acceso a los cursos ha sido revocado. Contacta al administrador para solicitar acceso nuevamente.', true);
          return; // Salir temprano
        }
      }

      // ✅ SEGUNDO: Verificar cursos para usuarios que no están en ninguna vista específica
      if (!urlParams.has('code') && !isInMaster && !isInUserView && !isInContent) {
        log('[AUTH] 🔍 Verificando cursos para usuario con email...');
        const allowedCourses = await getCoursesForEmail(userEmail);
        log('[AUTH] 📚 Cursos encontrados en listener:', allowedCourses.length);

        if (allowedCourses.length > 0) {
          log('[AUTH] ✅ Mostrando vista de usuario desde listener');
          window.currentUserEmail = userEmail;
          window.allowedCoursesForUser = allowedCourses;

          if (isInAccess && accessEl) {
            accessEl.classList.add('hidden');
          }

          await handleSuccessfulAuthWithEmail(userEmail, allowedCourses);
        }
      }
    } else {
      log('[AUTH] Usuario no autenticado');
      window.currentUserEmail = null;
      window.allowedCoursesForUser = null;
      if (currentKeyHex === MASTER_HASH || (document.getElementById('user-view') && !document.getElementById('user-view').classList.contains('hidden'))) {
        currentKeyHex = null;
        setQueryParam('code', null);
        showAccess();
      }
    }
  });
}

// ✅ Inicializar listener de estado cuando Firebase esté listo
window.addEventListener('firebaseReady', () => {
  setupAuthStateListener();
});

/* ============ eventos ============ */
$('#btn-enter').addEventListener('click', () => tryLoginByCode($('#code').value));
$('#code').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#btn-enter').click(); } });
// ✅ Logout integrado (se actualiza más abajo)

// ✅ Botón "Compartir enlace con código" eliminado por solicitud del usuario
// ✅ Logout del master se maneja más abajo

// ✅ Event listeners para pestañas de autenticación
const tabCode = $('#tab-code');
const tabAccount = $('#tab-account');
if (tabCode) {
  tabCode.addEventListener('click', () => switchAuthTab('code'));
}
if (tabAccount) {
  tabAccount.addEventListener('click', () => switchAuthTab('account'));
}

// ✅ Función para configurar event listeners de autenticación email/password
function setupEmailPasswordListeners() {
  console.log('[SETUP] 🔧 Configurando event listeners de autenticación...');
  // Event listeners para autenticación email/password
  const btnLogin = $('#btn-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      tryLoginByEmail();
    });
  }

  // Enter en campos de login
  const inputEmail = $('#input-email');
  const inputPassword = $('#input-password');
  if (inputEmail) {
    inputEmail.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (inputPassword) inputPassword.focus();
      }
    });
  }
  if (inputPassword) {
    inputPassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (btnLogin) btnLogin.click();
      }
    });
  }

  // ✅ Event listener para verificar correo antes de registrar
  const btnVerifyEmail = $('#btn-verify-email');
  console.log('[SETUP] 🔍 Buscando botón btn-verify-email:', btnVerifyEmail);
  if (btnVerifyEmail) {
    console.log('[SETUP] ✅ Botón encontrado, registrando event listener');
    btnVerifyEmail.addEventListener('click', async () => {
      console.log('[VERIFICATION] 🖱️ Botón "Verificar correo" clickeado');
      await verifyEmailForRegistration();
    });
  } else {
    console.error('[SETUP] ❌ Botón btn-verify-email NO encontrado');
  }

  // Enter en campo de correo para verificar
  const inputRegisterEmail = $('#input-register-email');
  if (inputRegisterEmail) {
    inputRegisterEmail.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await verifyEmailForRegistration();
      }
    });
  }

  // ✅ Event listener para verificar código
  const btnVerifyCode = $('#btn-verify-code');
  if (btnVerifyCode) {
    btnVerifyCode.addEventListener('click', async () => {
      await verifyCodeForRegistration();
    });
  }

  // ✅ Event listener para reenviar código
  const btnResendCode = $('#btn-resend-code');
  if (btnResendCode) {
    btnResendCode.addEventListener('click', async () => {
      await resendVerificationCode();
    });
  }

  // ✅ Enter en campo de código para verificar
  const inputVerificationCode = $('#input-verification-code');
  if (inputVerificationCode) {
    inputVerificationCode.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await verifyCodeForRegistration();
      }
    });

    // Solo permitir números
    inputVerificationCode.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
  }

  // ✅ Event listener para volver del paso 2 al paso 1
  const btnBackToEmail = $('#btn-back-to-email');
  if (btnBackToEmail) {
    btnBackToEmail.addEventListener('click', () => {
      const step1 = $('#register-step-1');
      const step2 = $('#register-step-2');
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';

      window.verifiedEmailForRegistration = null;
      window.verifiedCoursesForRegistration = null;
      window.verifiedIsAdmin = null;

      showAuthMessage('msg-register', '', false);
      showAuthMessage('msg-register-step2', '', false);
      clearFieldErrors();
    });
  }

  // Enter en campos de contraseña para crear cuenta
  const inputRegisterPassword = $('#input-register-password');
  const inputRegisterPasswordConfirm = $('#input-register-password-confirm');
  if (inputRegisterPassword) {
    inputRegisterPassword.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (inputRegisterPasswordConfirm) inputRegisterPasswordConfirm.focus();
      }
    });
  }
  if (inputRegisterPasswordConfirm) {
    inputRegisterPasswordConfirm.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await tryRegister();
      }
    });
  }

  // Registro (paso 3)
  const btnRegister = $('#btn-register');
  if (btnRegister) {
    btnRegister.addEventListener('click', () => {
      tryRegister();
    });
  }

  // ✅ Event listener para volver del paso 3 al paso 2
  const btnBackToVerify = $('#btn-back-to-verify');
  if (btnBackToVerify) {
    btnBackToVerify.addEventListener('click', () => {
      const step2 = $('#register-step-2');
      const step3 = $('#register-step-3');
      if (step2) step2.style.display = 'block';
      if (step3) step3.style.display = 'none';

      // Limpiar campos de contraseña
      const passwordInput = $('#input-register-password');
      const passwordConfirmInput = $('#input-register-password-confirm');
      if (passwordInput) passwordInput.value = '';
      if (passwordConfirmInput) passwordConfirmInput.value = '';

      // Limpiar mensajes
      showAuthMessage('msg-register-step3', '', false);
      clearFieldErrors();
    });
  }

  // Reset password
  const btnReset = $('#btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      tryPasswordReset();
    });
  }

  // Navegación entre formularios
  const btnShowRegister = $('#btn-show-register');
  const btnShowLogin = $('#btn-show-login');
  const btnShowReset = $('#btn-show-reset');
  const btnBackToLogin = $('#btn-back-to-login');

  if (btnShowRegister) {
    btnShowRegister.addEventListener('click', () => {
      $('#form-login').classList.add('hidden');
      $('#form-register').classList.remove('hidden');
      $('#form-reset').classList.add('hidden');

      // Resetear formulario de registro al paso 1
      const step1 = $('#register-step-1');
      const step2 = $('#register-step-2');
      const step3 = $('#register-step-3');
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';
      if (step3) step3.style.display = 'none';
      window.verifiedEmailForRegistration = null;
      window.verifiedCoursesForRegistration = null;
      window.verifiedIsAdmin = null;
      window.verifiedCoursesForRegistration = null;
      showAuthMessage('msg-register', '', false);
      showAuthMessage('msg-register-step2', '', false);
      clearFieldErrors();
    });
  }

  if (btnShowLogin) {
    btnShowLogin.addEventListener('click', () => {
      $('#form-register').classList.add('hidden');
      $('#form-reset').classList.add('hidden');
      $('#form-login').classList.remove('hidden');

      // Resetear formulario de registro al paso 1
      const step1 = $('#register-step-1');
      const step2 = $('#register-step-2');
      const step3 = $('#register-step-3');
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';
      if (step3) step3.style.display = 'none';
      window.verifiedEmailForRegistration = null;
      window.verifiedCoursesForRegistration = null;
      window.verifiedIsAdmin = null;
      window.verifiedCoursesForRegistration = null;
      showAuthMessage('msg-register', '', false);
      showAuthMessage('msg-register-step2', '', false);
      clearFieldErrors();
    });
  }

  if (btnShowReset) {
    btnShowReset.addEventListener('click', () => {
      $('#form-login').classList.add('hidden');
      $('#form-register').classList.add('hidden');
      $('#form-reset').classList.remove('hidden');
      clearFieldErrors();
    });
  }

  if (btnBackToLogin) {
    btnBackToLogin.addEventListener('click', () => {
      $('#form-reset').classList.add('hidden');
      $('#form-register').classList.add('hidden');
      $('#form-login').classList.remove('hidden');
      clearFieldErrors();
    });
  }

  // Limpiar errores al escribir
  if (inputEmail) {
    inputEmail.addEventListener('input', () => {
      if (inputEmail.style.borderColor === '#ff7a7a') {
        clearFieldErrors();
      }
    });
  }
  if (inputPassword) {
    // ✅ Validación en tiempo real
    setupRealTimeValidation(inputPassword, validatePassword, { minLength: 6, showIndicator: true });

    inputPassword.addEventListener('input', () => {
      if (inputPassword.style.borderColor === '#ff7a7a') {
        clearFieldErrors();
      }
    });
  }

  // ✅ Validación en tiempo real para email de login
  if (inputEmail) {
    setupRealTimeValidation(inputEmail, validateEmail, { showIndicator: true });
  }

  // ✅ Validación en tiempo real para formulario de registro
  // Nota: Las variables ya están declaradas arriba, solo agregamos validación
  if (inputRegisterEmail) {
    setupRealTimeValidation(inputRegisterEmail, validateEmail, { showIndicator: true });
  }

  // Buscar variables de registro que ya están declaradas
  const inputRegPassword = $('#input-register-password');
  const inputRegPasswordConfirm = $('#input-register-password-confirm');
  const inputVerifCode = $('#input-verification-code');

  if (inputRegPassword) {
    setupRealTimeValidation(inputRegPassword, validatePassword, { minLength: 6, showIndicator: true });
  }

  if (inputRegPasswordConfirm) {
    // Validación personalizada para confirmación de contraseña
    inputRegPasswordConfirm.addEventListener('input', () => {
      const password = inputRegPassword?.value || '';
      const confirm = inputRegPasswordConfirm.value;

      if (confirm.length === 0) {
        inputRegPasswordConfirm.classList.remove('input-valid', 'input-invalid');
        inputRegPasswordConfirm.dataset.valid = '';
        return;
      }

      if (password === confirm) {
        inputRegPasswordConfirm.classList.add('input-valid');
        inputRegPasswordConfirm.classList.remove('input-invalid');
        inputRegPasswordConfirm.setAttribute('aria-invalid', 'false');
        inputRegPasswordConfirm.dataset.valid = 'true';
      } else {
        inputRegPasswordConfirm.classList.add('input-invalid');
        inputRegPasswordConfirm.classList.remove('input-valid');
        inputRegPasswordConfirm.setAttribute('aria-invalid', 'true');
        inputRegPasswordConfirm.dataset.valid = 'false';

        let errorMsg = inputRegPasswordConfirm.parentElement.querySelector('.validation-error');
        if (!errorMsg) {
          errorMsg = document.createElement('div');
          errorMsg.className = 'validation-error';
          errorMsg.setAttribute('role', 'alert');
          inputRegPasswordConfirm.parentElement.appendChild(errorMsg);
        }
        errorMsg.textContent = 'Las contraseñas no coinciden';
        errorMsg.style.display = 'block';
      }
    });
  }

  if (inputVerifCode) {
    setupRealTimeValidation(inputVerifCode, validateVerificationCode, { showIndicator: true });
  }
}

// ✅ Configurar listeners cuando el DOM esté listo
console.log('[SETUP] 🔍 Verificando estado del DOM. readyState:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[SETUP] ⏳ DOM aún cargando, esperando DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', setupEmailPasswordListeners);
} else {
  // DOM ya está listo
  console.log('[SETUP] ✅ DOM ya está listo, ejecutando setupEmailPasswordListeners inmediatamente');
  setupEmailPasswordListeners();
}

// ✅ Event listeners para modal de correos por curso
const modalCourseEmailsClose = $('#modalCourseEmailsClose');
if (modalCourseEmailsClose) {
  modalCourseEmailsClose.addEventListener('click', () => {
    closeCourseEmailsModal();
  });
}

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = $('#modalCourseEmails');
    if (modal && modal.classList.contains('show')) {
      closeCourseEmailsModal();
    }
    const modalGeneral = $('#modalGeneralEmails');
    if (modalGeneral && modalGeneral.classList.contains('show')) {
      closeGeneralEmailsModal();
    }
  }
});

// Cerrar modal al hacer clic fuera
const modalCourseEmails = $('#modalCourseEmails');
if (modalCourseEmails) {
  modalCourseEmails.addEventListener('click', (e) => {
    if (e.target === modalCourseEmails) {
      closeCourseEmailsModal();
    }
  });
}

// Cerrar modal general al hacer clic fuera
const modalGeneralEmails = $('#modalGeneralEmails');
if (modalGeneralEmails) {
  modalGeneralEmails.addEventListener('click', (e) => {
    if (e.target === modalGeneralEmails) {
      closeGeneralEmailsModal();
    }
  });
}

// ✅ Event listeners para modal de gestión general de correos
const modalGeneralEmailsClose = $('#modalGeneralEmailsClose');
if (modalGeneralEmailsClose) {
  modalGeneralEmailsClose.addEventListener('click', () => {
    closeGeneralEmailsModal();
  });
}

// ✅ Event listeners para modal de administradores
const modalAdminsClose = $('#modalAdminsClose');
if (modalAdminsClose) {
  modalAdminsClose.addEventListener('click', () => {
    closeAdminsModal();
  });
}

// Event listener para botón agregar administrador
const btnAddAdmin = $('#btn-add-admin');
if (btnAddAdmin) {
  btnAddAdmin.addEventListener('click', () => {
    addAdminUI();
  });
}

// Event listener para input de administrador (Enter)
const inputAdminEmail = $('#input-admin-email');
if (inputAdminEmail) {
  // ✅ Validación en tiempo real
  setupRealTimeValidation(inputAdminEmail, validateEmail, { showIndicator: true });

  inputAdminEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Validar antes de agregar
      const emailValue = inputAdminEmail.value.trim();
      const emailValidation = validateEmail(emailValue);
      if (emailValidation.valid) {
        addAdminUI();
      } else {
        if (typeof window.showToast === 'function') {
          window.showToast('error', 'Correo inválido', emailValidation.error);
        }
      }
    }
  });
}

// ✅ Búsqueda y filtrado en modal de gestión general
const inputSearchCourseEmails = $('#input-search-course-emails');
const filterCourseTypeEmails = $('#filter-course-type-emails');

if (inputSearchCourseEmails) {
  let searchTimeout;
  inputSearchCourseEmails.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filterGeneralEmailsList();
    }, 300);
  });
}

if (filterCourseTypeEmails) {
  filterCourseTypeEmails.addEventListener('change', () => {
    filterGeneralEmailsList();
  });
}

// ✅ Función para filtrar la lista general de correos
function filterGeneralEmailsList() {
  const searchTerm = inputSearchCourseEmails?.value.toLowerCase().trim() || '';
  const filterType = filterCourseTypeEmails?.value || 'all';
  const cards = document.querySelectorAll('#general-emails-list .card');

  cards.forEach(card => {
    const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
    const meta = card.querySelector('p')?.textContent.toLowerCase() || '';
    const emails = Array.from(card.querySelectorAll('span[style*="font-weight:500"]')).map(e => e.textContent.toLowerCase());
    const typeIcon = card.querySelector('h4')?.textContent || '';

    const matchesSearch = !searchTerm ||
      title.includes(searchTerm) ||
      meta.includes(searchTerm) ||
      emails.some(e => e.includes(searchTerm));

    const matchesType = filterType === 'all' ||
      (filterType === 'curso' && typeIcon.includes('ph-book-open')) ||
      (filterType === 'diplomado' && typeIcon.includes('ph-graduation-cap')) ||
      (filterType === 'webinar' && typeIcon.includes('ph-monitor')) ||
      (filterType === 'seminario' && typeIcon.includes('ph-note')) ||
      (filterType === 'taller' && typeIcon.includes('ph-wrench'));

    card.style.display = (matchesSearch && matchesType) ? 'block' : 'none';
  });
}

// Event listener para botón agregar correo
const btnAddCourseEmail = $('#btn-add-course-email');
if (btnAddCourseEmail) {
  btnAddCourseEmail.addEventListener('click', () => {
    addCourseEmailUI();
  });
}

// Event listener para input de correo (Enter)
const inputCourseEmail = $('#input-course-email');
if (inputCourseEmail) {
  // ✅ Validación en tiempo real
  setupRealTimeValidation(inputCourseEmail, validateEmail, { showIndicator: true });

  inputCourseEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Validar antes de agregar
      const emailValue = inputCourseEmail.value.trim();
      const emailValidation = validateEmail(emailValue);
      if (emailValidation.valid) {
        addCourseEmailUI();
      } else {
        if (typeof window.showToast === 'function') {
          window.showToast('error', 'Correo inválido', emailValidation.error);
        }
      }
    }
  });
}

// ✅ Event listener para logout de usuario (vista de usuario)
const btnUserLogout = $('#btn-user-logout');
if (btnUserLogout) {
  btnUserLogout.addEventListener('click', async () => {
    await logoutFirebase();
    window.currentUserEmail = null;
    window.allowedCoursesForUser = null;
    currentKeyHex = null;
    setQueryParam('code', null);
    showAccess();
  });
}

// ✅ Event listener para botón "Volver" (desde vista de contenido a vista de usuario)
const btnBackToUser = $('#btn-back-to-user');
if (btnBackToUser) {
  btnBackToUser.addEventListener('click', () => {
    // Limpiar curso actual y flag
    currentKeyHex = null;
    window.isFromUserView = false;
    setQueryParam('code', null);
    // Regresar a vista de usuario
    showUserView();
  });
}

// ✅ Event listener para botón "Volver a Master" (desde vista de contenido a vista maestra)
const btnBackToMaster = $('#btn-back-to-master');
if (btnBackToMaster) {
  btnBackToMaster.addEventListener('click', () => {
    // Limpiar curso actual
    currentKeyHex = MASTER_HASH; // ✅ Mantener como master para validación
    window.isFromUserView = false;
    setQueryParam('code', null);
    // Regresar a vista maestra
    buildMasterGrid();
    setupMasterSearch();
    showMaster();
    setTimeout(() => {
      setupNotificationsPanel();
    }, 50);
  });
}

// ✅ Event listener para botón "Salir" (comportamiento inteligente)
$('#btn-logout').addEventListener('click', async () => {
  // ✅ Si viene de vista de usuario, regresar a vista de usuario
  const isFromUserView = window.currentUserEmail && window.allowedCoursesForUser && window.isFromUserView;

  if (isFromUserView) {
    // Regresar a vista de usuario (no cerrar sesión)
    currentKeyHex = null;
    window.isFromUserView = false;
    setQueryParam('code', null);
    showUserView();
  } else {
    // Si viene de master o acceso directo, cerrar sesión
    currentKeyHex = null;
    window.isFromUserView = false;
    setQueryParam('code', null);
    await logoutFirebase();
    showAccess();
  }
});

// ✅ Integrar logout de Firebase con logout del master
$('#btn-master-exit').addEventListener('click', async () => {
  setQueryParam('code', null);
  await logoutFirebase();
  showAccess();
});

// ✅ FUNCIÓN GLOBAL: Ver qué hay guardado en localStorage
window.verDatosGuardados = function () {
  log('==========================================');
  log('📦 DATOS EN LOCALSTORAGE:');
  log('==========================================');

  const keys = Object.keys(localStorage);
  const fileKeys = keys.filter(k => k.startsWith(FILES_STORAGE_PREFIX));

  log('Total archivos guardados:', fileKeys.length);

  fileKeys.forEach(key => {
    const hex = key.replace(FILES_STORAGE_PREFIX, '');
    try {
      const data = JSON.parse(localStorage.getItem(key));
      log('\n---');
      log('Hex:', hex.substring(0, 10) + '...');
      log('Archivos:', data.length);
      data.forEach((file, idx) => {
        log(`  ${idx + 1}. ${file.label}`);
      });
    } catch (e) {
      console.error('Error leyendo:', key);
    }
  });

  log('\n==========================================');
  return fileKeys.length;
};

// ✅ FUNCIÓN GLOBAL: Forzar sincronización desde servidor (SIN borrar localStorage)
window.forzarSincronizacion = async function () {
  log('[SYNC FORCE] 🔄 Forzando sincronización desde servidor...');

  try {
    // Detectar en qué vista estamos
    const isMasterView = !$('#master').classList.contains('hidden');
    const isContentView = !$('#content').classList.contains('hidden');

    if (isMasterView) {
      log('[SYNC FORCE] 📋 Vista Maestra detectada - Sincronizando todos los cursos...');

      // Refrescar cursos personalizados
      await refreshCustomCourses().catch(e => {
        warn('[SYNC FORCE] Error refrescando cursos:', e);
      });

      // Refrescar todos los archivos de cada curso
      const mergedMap = getMergedAccessHashMap();
      const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);

      log('[SYNC FORCE] Total cursos a sincronizar:', hexes.length);

      const results = await Promise.allSettled(
        hexes.map(h => refreshFromRemoteSilent(h))
      );

      const updated = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      log('[SYNC FORCE] ✅ Sincronizados', updated, 'cursos');

      // Reconstruir grid
      buildMasterGrid();

      // ✅ Mostrar modal de éxito (sin alert)
      if (typeof window.showSuccessModal === 'function') {
        window.showSuccessModal(
          '¡Sincronización Exitosa!',
          `${updated} curso(s) actualizado(s) desde el servidor.`
        );
      }

    } else if (isContentView) {
      log('[SYNC FORCE] 📄 Vista de curso detectada - Sincronizando curso actual...');

      // Obtener el hex del curso actual
      const currentHex = window.currentCourseHex; // Necesitamos guardarlo globalmente

      if (currentHex) {
        const updated = await refreshFromRemoteSilent(currentHex);

        if (updated) {
          log('[SYNC FORCE] ✅ Curso sincronizado, re-renderizando...');
          renderCourse(currentHex);
          // ✅ Mostrar modal de éxito (sin alert)
          if (typeof window.showSuccessModal === 'function') {
            window.showSuccessModal(
              '¡Sincronización Exitosa!',
              'Los recursos se han actualizado correctamente desde el servidor.'
            );
          }
        } else {
          log('[SYNC FORCE] ℹ️ No hay cambios nuevos');
          // ✅ Mostrar modal informativo (sin alert)
          if (typeof window.showSuccessModal === 'function') {
            window.showSuccessModal(
              'Sin Cambios',
              'Ya estás viendo la última versión disponible.'
            );
          }
        }
      } else {
        warn('[SYNC FORCE] ⚠️ No se detectó hex del curso actual');
        // ✅ Mostrar modal de advertencia (sin alert)
        if (typeof window.showSuccessModal === 'function') {
          window.showSuccessModal(
            'Error',
            'No se pudo identificar el curso actual.'
          );
        }
      }

    } else {
      log('[SYNC FORCE] ℹ️ No hay vista activa para sincronizar');
      // ✅ Mostrar modal informativo (sin alert)
      if (typeof window.showSuccessModal === 'function') {
        window.showSuccessModal(
          'Información',
          'Primero ingresa a un curso o a la vista maestra.'
        );
      }
    }

  } catch (error) {
    console.error('[SYNC FORCE] ❌ Error:', error);
    throw error;
  }
};

// ✅ FUNCIÓN GLOBAL: Limpiar TODO y recargar
window.limpiarTodoYRecargar = async function () {
  log('[CLEAN] 🧹 LIMPIANDO TODO...');

  // 1. Limpiar localStorage de archivos
  const filesCleared = clearAllFilesOverrides();
  log('[CLEAN] 🧹 Limpiados', filesCleared, 'archivos de localStorage');

  // 2. Limpiar caché del navegador
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        log('[CLEAN] 🧹 Eliminando caché:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }

  // 3. Desregistrar Service Worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(reg => {
        log('[CLEAN] 🧹 Desregistrando Service Worker');
        return reg.unregister();
      })
    );
  }

  log('[CLEAN] ✅ TODO LIMPIADO. Recargando...');
  alert('✅ TODO limpiado. Solo verás datos desde Google Sheets.');

  // 4. Recargar página
  setTimeout(() => {
    location.reload(true);
  }, 500);
};

/* ============ init ============ */
(async function init() {
  // ✅ Iniciar medición de tiempo total de inicialización
  const initStart = startPerformanceMeasure('Inicialización total');

  // ✅ Inicializar tema (claro/oscuro) ANTES de cualquier renderizado
  initTheme();

  // ✅ NO limpiar archivos al inicio - dejar que la sincronización automática lo maneje
  log('[INIT] 🚀 Iniciando plataforma...');
  log('[INIT] 📦 Archivos locales disponibles:', Object.keys(localStorage).filter(k => k.startsWith(FILES_STORAGE_PREFIX)).length);
  log('[INIT] 🔄 La sincronización automática actualizará los datos cada 1.2s');

  // ✅ Medir tiempo de carga de página
  const pageLoadTime = performance.now() - performanceMetrics.pageLoadStart;
  logPerformanceMetric('Tiempo de carga de página', `${pageLoadTime.toFixed(0)}ms`);

  // Actualizar versión de caché
  localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);

  $('#year').textContent = new Date().getFullYear();
  $('#year_master').textContent = new Date().getFullYear();

  const qp = new URLSearchParams(location.search);
  const pre = qp.get('code');
  if (pre) {
    // ✅ Mostrar loader inmediatamente si hay código pre-cargado
    showLoader();
    try {
      const decoded = atob(pre);
      if (decoded) {
        const ok = await tryLoginByCode(decoded);
        if (ok) { try { $('#code').value = decoded; } catch (e) { } return; }
        else {
          hideLoader(); // ✅ Ocultar loader antes de mostrar acceso
          setQueryParam('code', null);
          showAccess();
          $('#msg').textContent = 'El enlace contiene código inválido o expirado.';
          $('#msg').classList.add('error');
          return;
        }
      }
    } catch (e) {
      hideLoader(); // ✅ Ocultar loader si hay error
      warn('Parámetro code inválido', e);
    }
  }
  showAccess();
  maybeShowAttemptsWarning();

  // ✅ Cargar cursos remotos (no bloquear con await para no demorar carga)
  loadRemoteCoursesOnInit();

  // ❌ NO iniciar polling automático para no interrumpir al usuario
  // El botón manual de sincronización será usado cuando el usuario quiera
  log('[INIT] ✅ Plataforma lista (sin polling automático)');

  // ✅ Finalizar medición de inicialización
  endPerformanceMeasure('Inicialización total', initStart);
})();

/* ============ Modal agregar curso ============ */
let setupAddCourseModalDone = false;

function setupAddCourseModal() {
  if (setupAddCourseModalDone) {
    log('[SETUP] Ya configurado, saltando...');
    return;
  }
  setupAddCourseModalDone = true;

  const modalAddCourse = $('#modalAddCourse');
  const modalClose = $('#modalAddCourseClose');
  const btnAddCourse = $('#btn-add-course');
  const formAddCourse = $('#formAddCourse');
  const inputCourseAccent = $('#inputCourseAccent');
  const inputCourseAccentHex = $('#inputCourseAccentHex');

  log('[SETUP] Elementos encontrados:', {
    modalAddCourse: !!modalAddCourse,
    formAddCourse: !!formAddCourse,
    btnAddCourse: !!btnAddCourse
  });

  if (!modalAddCourse || !formAddCourse) {
    console.error('[SETUP] Faltan elementos del modal');
    return;
  }

  // ✅ Configurar contadores de caracteres
  const inputTitle = $('#inputCourseTitle');
  const inputMeta = $('#inputCourseMeta');
  const inputTag = $('#inputCourseTag');
  const inputCode = $('#inputCourseCode');

  if (inputTitle) setupCharacterCounter(inputTitle, 100, 5);
  if (inputMeta) setupCharacterCounter(inputMeta, 200, 10);
  if (inputTag) setupCharacterCounter(inputTag, 10, 2);
  if (inputCode) setupCharacterCounter(inputCode, 50, 5);

  // ✅ Validación en tiempo real
  if (inputTitle) {
    setupRealTimeValidation(inputTitle, validateTitle, { minLength: 5, maxLength: 100 });
  }
  if (inputMeta) {
    setupRealTimeValidation(inputMeta, validateMeta, { minLength: 10, maxLength: 200 });
  }
  if (inputTag) {
    setupRealTimeValidation(inputTag, validateTag, { minLength: 2, maxLength: 10 });
  }
  if (inputCode) {
    setupRealTimeValidation(inputCode, validateCode, { minLength: 5, maxLength: 50 });
  }

  // Validación de color hexadecimal
  if (inputCourseAccentHex) {
    setupRealTimeValidation(inputCourseAccentHex, validateHexColor, { showIndicator: true });
  }

  // ✅ Sugerencias automáticas de código basadas en el título
  if (inputTitle && inputCode) {
    let lastTitle = '';
    inputTitle.addEventListener('blur', () => {
      const currentTitle = inputTitle.value.trim();
      if (currentTitle && currentTitle !== lastTitle && !inputCode.value.trim()) {
        const suggestions = generateCodeSuggestions(currentTitle);
        if (suggestions.length > 0) {
          // Mostrar sugerencias como tooltip o pequeño dropdown
          const suggestionText = `💡 Sugerencias: ${suggestions.join(', ')}`;
          if (typeof window.showToast === 'function') {
            window.showToast('info', 'Sugerencias de código', suggestionText, 3000);
          }
        }
      }
      lastTitle = currentTitle;
    });
  }

  // ✅ Validación en tiempo real de URL de imagen
  const inputImage = $('#inputCourseImage');
  if (inputImage) {
    let imageCheckTimeout = null;
    let lastValidatedUrl = '';

    inputImage.addEventListener('blur', async () => {
      const imageUrl = inputImage.value.trim();

      if (!imageUrl) return;
      if (imageUrl === lastValidatedUrl) return;

      // Validar formato primero
      const urlValidation = validateURL(imageUrl);
      if (!urlValidation.valid) {
        inputImage.style.borderColor = '#ff5555';
        inputImage.setAttribute('aria-invalid', 'true');
        if (inputImage.parentElement) {
          let errorMsg = inputImage.parentElement.querySelector('.url-error');
          if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'url-error';
            errorMsg.id = 'inputCourseImage-error';
            errorMsg.setAttribute('role', 'alert');
            errorMsg.style.cssText = 'font-size: 12px; color: #ff5555; margin-top: 4px; padding: 4px 8px; border-radius: 4px; background: rgba(255,85,85,0.1); border-left: 3px solid #ff5555;';
            inputImage.parentElement.appendChild(errorMsg);
          }
          errorMsg.innerHTML = `<i class="ph ph-warning-circle" style="font-size: 14px; vertical-align: middle;"></i> ${escapeHTML(urlValidation.error)}`;
          inputImage.setAttribute('aria-describedby', 'inputCourseImage-error');
        }
        return;
      }

      // ✅ Limpiar estado de error si la URL es válida
      inputImage.setAttribute('aria-invalid', 'false');
      const existingError = inputImage.parentElement.querySelector('.url-error');
      if (existingError) {
        inputImage.removeAttribute('aria-describedby');
      }

      // Verificar existencia de imagen (con indicador de carga)
      const loadingMsg = inputImage.parentElement.querySelector('.image-checking');
      if (!loadingMsg && inputImage.parentElement) {
        const msg = document.createElement('div');
        msg.className = 'image-checking';
        msg.style.cssText = 'font-size: 12px; color: var(--accent); margin-top: 4px; padding: 4px 8px; border-radius: 4px; background: rgba(90,169,255,0.1); border-left: 3px solid var(--accent);';
        msg.innerHTML = '<i class="ph ph-spinner" style="font-size: 14px; vertical-align: middle; animation: spin 1s linear infinite;"></i> Verificando imagen...';
        inputImage.parentElement.appendChild(msg);
      }

      const imageCheck = await verifyImageExists(urlValidation.url);

      // Remover mensaje de carga
      const checkingMsg = inputImage.parentElement.querySelector('.image-checking');
      if (checkingMsg) checkingMsg.remove();

      // Remover error anterior
      const errorMsg = inputImage.parentElement.querySelector('.url-error');
      if (errorMsg) errorMsg.remove();

      if (imageCheck.exists) {
        inputImage.style.borderColor = '#4ade80';
        inputImage.setAttribute('aria-invalid', 'false');
        if (inputImage.parentElement) {
          const successMsg = document.createElement('div');
          successMsg.className = 'image-success';
          successMsg.setAttribute('role', 'status');
          successMsg.setAttribute('aria-live', 'polite');
          successMsg.style.cssText = 'font-size: 12px; color: #4ade80; margin-top: 4px; padding: 4px 8px; border-radius: 4px; background: rgba(74,222,128,0.1); border-left: 3px solid #4ade80;';
          successMsg.innerHTML = `<i class="ph ph-check-circle" style="font-size: 14px; vertical-align: middle;"></i> Imagen válida (${imageCheck.width}x${imageCheck.height}px)`;
          inputImage.parentElement.appendChild(successMsg);

          // Remover después de 3 segundos
          setTimeout(() => {
            if (successMsg.parentElement) {
              successMsg.remove();
            }
          }, 3000);
        }
        lastValidatedUrl = imageUrl;
      } else {
        inputImage.style.borderColor = '#fbbf24';
        inputImage.setAttribute('aria-invalid', 'true');
        if (inputImage.parentElement) {
          const warningMsg = document.createElement('div');
          warningMsg.className = 'image-warning';
          warningMsg.id = 'inputCourseImage-warning';
          warningMsg.setAttribute('role', 'alert');
          warningMsg.style.cssText = 'font-size: 12px; color: #fbbf24; margin-top: 4px; padding: 4px 8px; border-radius: 4px; background: rgba(251,191,36,0.1); border-left: 3px solid #fbbf24;';
          warningMsg.innerHTML = `<i class="ph ph-warning-circle" style="font-size: 14px; vertical-align: middle;"></i> No se pudo verificar la imagen: ${escapeHTML(imageCheck.error || 'Error desconocido')}`;
          inputImage.parentElement.appendChild(warningMsg);
          inputImage.setAttribute('aria-describedby', 'inputCourseImage-warning');
        }
      }
    });
  }

  // Sincronizar color picker con input hex
  if (inputCourseAccent && inputCourseAccentHex) {
    inputCourseAccent.addEventListener('input', (e) => {
      inputCourseAccentHex.value = e.target.value;
    });
    inputCourseAccentHex.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
        inputCourseAccent.value = val;
      }
    });
  }

  // Abrir modal
  if (btnAddCourse) {
    btnAddCourse.addEventListener('click', () => {
      modalAddCourse.classList.add('show');
    });
  }

  // Cerrar modal
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modalAddCourse.classList.remove('show');
    });
  }

  $('#btnCancelAddCourse')?.addEventListener('click', () => {
    modalAddCourse.classList.remove('show');
  });

  // Submit formulario
  formAddCourse.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ✅ Validar formulario completo antes de continuar
    if (!validateForm(formAddCourse)) {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Formulario inválido', 'Por favor, corrige los errores antes de continuar');
      }
      return;
    }

    // ✅ Obtener botón submit
    const submitBtn = formAddCourse.querySelector('button[type="submit"]');
    let restoreButton = null;

    // ✅ Rate limiting: prevenir acciones repetidas
    if (!checkRateLimitSimple('crear curso')) {
      return;
    }

    // ✅ Sanitizar y validar inputs
    const titleRaw = getSafeInputValue('#inputCourseTitle', 'title');
    const metaRaw = getSafeInputValue('#inputCourseMeta', 'meta');
    const imageUrlRaw = getSafeInputValue('#inputCourseImage', 'url');
    const tagRaw = getSafeInputValue('#inputCourseTag', 'tag');
    const codeRaw = getSafeInputValue('#inputCourseCode', 'code');
    const type = ($('#selectCourseType')?.value || 'curso').trim(); // ✅ Clasificación del curso

    // Validaciones básicas de longitud (redundantes pero por seguridad)
    if (!titleRaw || titleRaw.length < 5 || titleRaw.length > 100) {
      alert('El título debe tener entre 5 y 100 caracteres');
      $('#inputCourseTitle').focus();
      return;
    }

    if (!metaRaw || metaRaw.length < 10 || metaRaw.length > 200) {
      alert('La descripción debe tener entre 10 y 200 caracteres');
      $('#inputCourseMeta').focus();
      return;
    }

    if (!tagRaw || tagRaw.length < 2 || tagRaw.length > 10) {
      alert('El tag debe tener entre 2 y 10 caracteres');
      $('#inputCourseTag').focus();
      return;
    }

    if (!codeRaw || codeRaw.length < 5 || codeRaw.length > 50) {
      alert('El código debe tener entre 5 y 50 caracteres');
      $('#inputCourseCode').focus();
      return;
    }

    // ✅ Activar indicador de carga
    if (submitBtn) {
      restoreButton = setButtonLoading(submitBtn, 'Creando curso...', 'Curso creado');
    }

    // ✅ Los valores ya están sanitizados por getSafeInputValue
    // Solo normalizamos formatos específicos
    const title = titleRaw; // Ya sanitizado
    const meta = metaRaw; // Ya sanitizado
    const imageUrl = imageUrlRaw; // Ya sanitizado y validado
    const tag = tagRaw.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Normalizar tag
    const code = codeRaw; // Ya sanitizado

    // ✅ Leer valores de estilo visual y color accent con validación
    const selectVariant = $('#selectCourseVariant');
    const inputAccent = $('#inputCourseAccent');

    if (!selectVariant) {
      console.error('[FORM] ⚠️ selectCourseVariant no encontrado');
      alert('Error: Campo "Estilo Visual" no encontrado');
      return;
    }

    if (!inputAccent) {
      console.error('[FORM] ⚠️ inputCourseAccent no encontrado');
      alert('Error: Campo "Color Accent" no encontrado');
      return;
    }

    const variant = (selectVariant.value || 'dramatic').trim(); // Valor por defecto
    const accent = getSafeInputValue('#inputCourseAccentHex', 'color') || '#5aa9ff'; // Sanitizado y validado
    // code ya está definido arriba (línea 4720)

    // ✅ Debug: mostrar valores capturados
    log('[FORM] 📝 Valores capturados:', {
      title,
      meta,
      imageUrl,
      tag,
      type,
      variant,
      accent,
      code
    });

    // ✅ Validación adicional: verificar que tag tenga al menos 2 caracteres después de sanitizar
    if (tag.length < 2) {
      alert('El tag debe contener al menos 2 letras o números');
      $('#inputCourseTag').focus();
      return;
    }

    // ✅ Validación mejorada de URL de imagen
    const imageValidation = validateURL(imageUrl);
    if (!imageValidation.valid) {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'URL inválida', imageValidation.error);
      } else {
        alert(imageValidation.error);
      }
      $('#inputCourseImage').focus();
      return;
    }

    // ✅ Verificar imagen (opcional, no bloquea)
    const imageCheck = await verifyImageExists(imageValidation.url);
    if (!imageCheck.exists) {
      const proceed = confirm(`⚠️ No se pudo verificar la imagen: ${imageCheck.error}\n\n¿Desea continuar de todas formas?`);
      if (!proceed) {
        $('#inputCourseImage').focus();
        return;
      }
    }

    // Verificar que el código no exista
    const existingCourses = getMergedAccessHashMap();
    const hex = await sha256Hex(code);
    if (existingCourses[hex]) {
      alert('Este código ya existe. Use otro.');
      return;
    }

    // Verificar que el tag sea único
    const tags = Object.values(existingCourses).map(c => c.card?.tag?.toUpperCase());
    if (tags.includes(tag)) {
      alert('Este tag ya está en uso. Use otro.');
      return;
    }

    // Crear datos del curso
    const courseData = {
      title: title,
      meta: meta,
      files: [],
      code: code, // ✅ Guardar el código secreto para poder mostrarlo después
      type: type, // ✅ Guardar clasificación (curso, diplomado, webinar, etc.)
      card: {
        img: imageUrl,
        tag: tag,
        variant: variant, // ✅ Asegurar que se guarde
        seed: Math.floor(Math.random() * 100),
        accent: accent // ✅ Asegurar que se guarde
      }
    };

    // ✅ Debug: mostrar datos que se van a guardar
    log('[FORM] 💾 Datos del curso a guardar:', courseData);

    try {
      // Guardar curso (esperar confirmación)
      await addCustomCourse(hex, courseData);

      // ✅ NO hacer refresh de cursos remotos después de crear, porque puede sobrescribir el código
      // El código se guarda localmente y en Firebase, no necesita refresh desde Google Sheets
      // await refreshCustomCourses().catch(e => {
      //   warn('[ADD COURSE] Error refrescando cursos después de crear:', e);
      // });

      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'course_created', {
          'event_category': 'management',
          'event_label': tag
        });
      }

      // ✅ Restaurar botón con éxito
      if (restoreButton) {
        restoreButton(true, 'Curso creado');
      }

      // Cerrar modal y recargar grid
      modalAddCourse.classList.remove('show');
      formAddCourse.reset();
      inputCourseAccent.value = '#5aa9ff';
      inputCourseAccentHex.value = '#5aa9ff';

      // Reconstruir grid
    } catch (error) {
      console.error('[FORM] Error creando curso:', error);
      // ✅ Restaurar botón con error
      if (restoreButton) {
        restoreButton(false, 'Error al crear');
      }
      alert('Error al crear el curso. Por favor, intente nuevamente.');
      return;
    }
    buildMasterGrid();

    // ✅ Mostrar modal de éxito
    window.showSuccessModal(
      '¡Curso Creado Exitosamente!',
      `El curso "${tag}" ha sido creado.\n\nCódigo de acceso: ${code}`
    );
  });

  // Cerrar modal al hacer click fuera
  modalAddCourse.addEventListener('click', (e) => {
    if (e.target === modalAddCourse) {
      modalAddCourse.classList.remove('show');
    }
  });
}

// ✅ Configurar modal de edición de curso
function setupEditCourseModal() {
  const modalEditCourse = $('#modalEditCourse');
  const modalEditClose = $('#modalEditCourseClose');
  const formEditCourse = $('#formEditCourse');
  const inputEditCourseAccent = $('#inputEditCourseAccent');
  const inputEditCourseAccentHex = $('#inputEditCourseAccentHex');

  if (!modalEditCourse || !formEditCourse) {
    console.error('[SETUP EDIT] Faltan elementos del modal de edición');
    return;
  }

  // Sincronizar color picker con input hex
  if (inputEditCourseAccent && inputEditCourseAccentHex) {
    inputEditCourseAccent.addEventListener('input', (e) => {
      inputEditCourseAccentHex.value = e.target.value;
    });
    inputEditCourseAccentHex.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
        inputEditCourseAccent.value = val;
      }
    });
  }

  // Cerrar modal
  if (modalEditClose) {
    modalEditClose.addEventListener('click', () => {
      modalEditCourse.classList.remove('show');
    });
  }

  $('#btnCancelEditCourse')?.addEventListener('click', () => {
    modalEditCourse.classList.remove('show');
  });

  // ✅ Configurar validación en tiempo real para formulario de edición
  const inputEditTitle = $('#inputEditCourseTitle');
  const inputEditMeta = $('#inputEditCourseMeta');
  const inputEditTag = $('#inputEditCourseTag');
  const inputEditImage = $('#inputEditCourseImage');

  if (inputEditTitle) {
    setupRealTimeValidation(inputEditTitle, validateTitle, { minLength: 5, maxLength: 100 });
  }
  if (inputEditMeta) {
    setupRealTimeValidation(inputEditMeta, validateMeta, { minLength: 10, maxLength: 200 });
  }
  if (inputEditTag) {
    setupRealTimeValidation(inputEditTag, validateTag, { minLength: 2, maxLength: 10 });
  }
  if (inputEditCourseAccentHex) {
    setupRealTimeValidation(inputEditCourseAccentHex, validateHexColor, { showIndicator: true });
  }

  // Validación de URL de imagen (similar a agregar curso)
  if (inputEditImage) {
    let imageCheckTimeout = null;
    let lastValidatedUrl = '';

    inputEditImage.addEventListener('blur', async () => {
      const imageUrl = inputEditImage.value.trim();

      if (!imageUrl) return;
      if (imageUrl === lastValidatedUrl) return;

      const urlValidation = validateURL(imageUrl);
      if (!urlValidation.valid) {
        inputEditImage.classList.add('input-invalid');
        inputEditImage.setAttribute('aria-invalid', 'true');
        if (inputEditImage.parentElement) {
          let errorMsg = inputEditImage.parentElement.querySelector('.url-error');
          if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'url-error validation-error';
            errorMsg.id = 'inputEditCourseImage-error';
            errorMsg.setAttribute('role', 'alert');
            inputEditImage.parentElement.appendChild(errorMsg);
          }
          errorMsg.textContent = urlValidation.error;
          inputEditImage.setAttribute('aria-describedby', 'inputEditCourseImage-error');
        }
        return;
      }

      inputEditImage.setAttribute('aria-invalid', 'false');
      const existingError = inputEditImage.parentElement.querySelector('.url-error');
      if (existingError) {
        inputEditImage.removeAttribute('aria-describedby');
        existingError.remove();
      }

      const imageCheck = await verifyImageExists(urlValidation.url);
      if (imageCheck.exists) {
        inputEditImage.classList.add('input-valid');
        inputEditImage.classList.remove('input-invalid');
        lastValidatedUrl = imageUrl;
      } else {
        inputEditImage.classList.add('input-invalid');
        inputEditImage.classList.remove('input-valid');
      }
    });
  }

  // Función global para abrir el modal con datos del curso
  window.openEditCourseModal = function (hex, courseData) {
    // Pre-llenar formulario con datos del curso
    $('#inputEditCourseHex').value = hex;
    $('#inputEditCourseTitle').value = courseData.title || '';
    $('#inputEditCourseMeta').value = courseData.meta || '';
    $('#inputEditCourseImage').value = courseData.card?.img || '';
    $('#inputEditCourseTag').value = courseData.card?.tag || '';
    $('#selectEditCourseType').value = courseData.type || 'curso'; // ✅ Pre-llenar clasificación
    $('#selectEditCourseVariant').value = courseData.card?.variant || 'dramatic';
    $('#inputEditCourseAccent').value = courseData.card?.accent || '#5aa9ff';
    $('#inputEditCourseAccentHex').value = courseData.card?.accent || '#5aa9ff';

    // Obtener el código del curso (necesitamos buscarlo en todos los cursos)
    const mergedMap = getMergedAccessHashMap();
    // El código no se puede obtener directamente del hex, así que lo dejamos vacío o mostramos un mensaje
    $('#inputEditCourseCode').value = 'No se puede cambiar';

    // ✅ Disparar validación inicial si hay valores
    if (inputEditTitle && inputEditTitle.value) {
      inputEditTitle.dispatchEvent(new Event('input'));
    }
    if (inputEditMeta && inputEditMeta.value) {
      inputEditMeta.dispatchEvent(new Event('input'));
    }
    if (inputEditTag && inputEditTag.value) {
      inputEditTag.dispatchEvent(new Event('input'));
    }

    modalEditCourse.classList.add('show');
  };

  // Submit formulario
  formEditCourse.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ✅ Validar formulario completo antes de continuar
    if (!validateForm(formEditCourse)) {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Formulario inválido', 'Por favor, corrige los errores antes de continuar');
      }
      return;
    }

    // ✅ Obtener botón submit
    const submitBtn = formEditCourse.querySelector('button[type="submit"]');
    let restoreButton = null;

    // ✅ Rate limiting: prevenir ediciones repetidas
    if (!checkRateLimitSimple('editar curso')) {
      return;
    }

    const hex = getSafeInputValue('#inputEditCourseHex', 'code');
    if (!hex) {
      alert('Error: No se encontró el identificador del curso');
      return;
    }

    // ✅ Sanitizar y validar inputs
    const titleRaw = getSafeInputValue('#inputEditCourseTitle', 'title');
    const metaRaw = getSafeInputValue('#inputEditCourseMeta', 'meta');
    const imageUrlRaw = getSafeInputValue('#inputEditCourseImage', 'url');
    const tagRaw = getSafeInputValue('#inputEditCourseTag', 'tag');
    const type = ($('#selectEditCourseType')?.value || 'curso').trim(); // ✅ Clasificación del curso
    const variant = ($('#selectEditCourseVariant')?.value || 'dramatic').trim();
    const accent = getSafeInputValue('#inputEditCourseAccentHex', 'color') || '#5aa9ff';

    // Validaciones básicas de longitud
    if (!titleRaw || titleRaw.length < 5 || titleRaw.length > 100) {
      alert('El título debe tener entre 5 y 100 caracteres');
      $('#inputEditCourseTitle').focus();
      return;
    }

    if (!metaRaw || metaRaw.length < 10 || metaRaw.length > 200) {
      alert('La descripción debe tener entre 10 y 200 caracteres');
      $('#inputEditCourseMeta').focus();
      return;
    }

    if (!tagRaw || tagRaw.length < 2 || tagRaw.length > 10) {
      alert('El tag debe tener entre 2 y 10 caracteres');
      $('#inputEditCourseTag').focus();
      return;
    }

    // ✅ Activar indicador de carga
    if (submitBtn) {
      restoreButton = setButtonLoading(submitBtn, 'Guardando cambios...', 'Cambios guardados');
    }

    // ✅ Los valores ya están sanitizados por getSafeInputValue
    const title = titleRaw; // Ya sanitizado
    const meta = metaRaw; // Ya sanitizado
    const imageUrl = imageUrlRaw; // Ya sanitizado y validado
    const tag = tagRaw.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Normalizar tag

    // ✅ Validación adicional: verificar que tag tenga al menos 2 caracteres después de sanitizar
    if (tag.length < 2) {
      alert('El tag debe contener al menos 2 letras o números');
      $('#inputEditCourseTag').focus();
      return;
    }

    // ✅ Validación mejorada de URL de imagen
    const imageValidation = validateURL(imageUrl);
    if (!imageValidation.valid) {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'URL inválida', imageValidation.error);
      } else {
        alert(imageValidation.error);
      }
      $('#inputEditCourseImage').focus();
      return;
    }

    // ✅ Verificar imagen (opcional, no bloquea)
    const imageCheck = await verifyImageExists(imageValidation.url);
    if (!imageCheck.exists) {
      const proceed = confirm(`⚠️ No se pudo verificar la imagen: ${imageCheck.error}\n\n¿Desea continuar de todas formas?`);
      if (!proceed) {
        $('#inputEditCourseImage').focus();
        return;
      }
    }

    // Verificar que el tag sea único (excepto para el curso actual)
    const existingCourses = getMergedAccessHashMap();
    const tagConflict = Object.entries(existingCourses).find(([h, c]) =>
      h !== hex && c.card?.tag?.toUpperCase() === tag
    );
    if (tagConflict) {
      alert('Este tag ya está en uso por otro curso. Use otro.');
      return;
    }

    // Obtener datos actuales del curso para preservar files y createdAt
    const currentCourse = existingCourses[hex];
    if (!currentCourse) {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Error', 'Curso no encontrado.');
      } else {
        alert('Error: Curso no encontrado');
      }
      return;
    }

    // Crear datos actualizados del curso
    const courseData = {
      title: title,
      meta: meta,
      files: currentCourse.files || [], // Preservar archivos existentes
      type: type, // ✅ Actualizar clasificación
      card: {
        img: imageUrl,
        tag: tag,
        variant: variant,
        seed: currentCourse.card?.seed || Math.floor(Math.random() * 100), // Preservar seed
        accent: accent
      }
    };

    // Actualizar curso (esperar confirmación)
    try {
      await updateCustomCourse(hex, courseData);

      // ✅ Forzar refresh de cursos para que se vea inmediatamente
      await refreshCustomCourses().catch(e => {
        warn('[EDIT COURSE] Error refrescando cursos después de editar:', e);
      });

      // Analytics tracking
      if (typeof gtag !== 'undefined') {
        gtag('event', 'course_updated', {
          'event_category': 'management',
          'event_label': tag
        });
      }

      // ✅ Restaurar botón con éxito
      if (restoreButton) {
        restoreButton(true, 'Cambios guardados');
      }

      // Cerrar modal y recargar grid
      modalEditCourse.classList.remove('show');
      formEditCourse.reset();

      // Reconstruir grid
      buildMasterGrid();

      // ✅ Mostrar modal de éxito
      window.showSuccessModal(
        '¡Curso Actualizado Exitosamente!',
        `El curso "${tag}" ha sido actualizado.`
      );
    } catch (error) {
      console.error('[EDIT COURSE] Error:', error);
      // ✅ Restaurar botón con error
      if (restoreButton) {
        restoreButton(false, 'Error al guardar');
      }
      alert('Error al actualizar el curso: ' + (error.message || 'Error desconocido'));
    }
  });

  // Cerrar modal al hacer click fuera
  modalEditCourse.addEventListener('click', (e) => {
    if (e.target === modalEditCourse) {
      modalEditCourse.classList.remove('show');
    }
  });
}

// ✅ Configurar modal cuando DOM está completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupAddCourseModal();
    setupEditCourseModal();
  });
} else {
  setupAddCourseModal();
  setupEditCourseModal();
}

/* ============ FUNCIONES DE PRUEBA Y DIAGNÓSTICO GLOBALES ============ */

// 🧪 TEST DE BOTÓN FLOTANTE (CAMBIO DE COLOR)
window.testButtonColor = function () {
  log('═══════════════════════════════════════════');
  log('🧪 TEST DE BOTÓN FLOTANTE');
  log('═══════════════════════════════════════════');
  log('');

  // Test 1: Cambiar a amarillo
  log('Test 1: Cambiando botón a AMARILLO (con cambios)...');
  if (typeof window.updateSyncButtonState === 'function') {
    window.updateSyncButtonState(true);
    log('✅ Botón debería estar AMARILLO pulsante ahora');
    log('   Verifica visualmente el botón flotante →');
  } else {
    console.error('❌ updateSyncButtonState no está disponible');
    console.error('   Asegúrate de haber refrescado la página');
  }

  // Test 2: Esperar 4 segundos y cambiar a azul
  setTimeout(() => {
    log('');
    log('Test 2: Cambiando botón a AZUL (sin cambios)...');
    if (typeof window.updateSyncButtonState === 'function') {
      window.updateSyncButtonState(false);
      log('✅ Botón debería estar AZUL ahora');
      log('   Verifica visualmente el botón flotante →');
    }

    log('');
    log('═══════════════════════════════════════════');
    log('Si viste el cambio de colores, ¡funciona! 🎉');
    log('═══════════════════════════════════════════');
  }, 4000);
};

// 🧪 TEST COMPLETO DE SINCRONIZACIÓN
window.testSyncComplete = async function (hex) {
  log('═══════════════════════════════════════════');
  log('🧪 TEST COMPLETO DE SINCRONIZACIÓN');
  log('═══════════════════════════════════════════');
  log('Hex:', hex);
  log('URL Remoto:', REMOTE_BASE_URL);
  log('');

  // 1. Ver datos locales actuales
  log('📦 PASO 1: Datos locales actuales');
  const localFiles = getFilesForHex(hex);
  log('  → Archivos locales:', localFiles.length);
  log('  → Datos:', JSON.stringify(localFiles));
  log('');

  // 2. Leer desde remoto
  log('📥 PASO 2: Leer desde remoto (JSONP)');
  const remoteFiles = await remoteGetFilesJSONP(hex);
  log('  → Archivos remotos:', remoteFiles ? remoteFiles.length : 'NULL');
  log('  → Datos:', JSON.stringify(remoteFiles));
  log('');

  // 3. Agregar un archivo de prueba
  log('✏️ PASO 3: Agregar archivo de prueba');
  const testFile = {
    label: 'TEST ' + new Date().toLocaleTimeString(),
    url: 'https://ejemplo.com/test-' + Date.now()
  };
  const newFiles = [...localFiles, testFile];
  log('  → Agregando:', testFile);
  log('  → Total archivos:', newFiles.length);
  log('');

  // 4. Guardar localmente
  log('💾 PASO 4: Guardar localmente');
  saveFilesOverride(hex, newFiles);
  const savedLocal = getFilesForHex(hex);
  log('  → Guardado local exitoso:', savedLocal.length === newFiles.length ? '✅' : '❌');
  log('');

  // 5. Guardar en remoto
  log('☁️ PASO 5: Guardar en remoto (POST)');
  const saveOk = await remoteSaveFiles(hex, newFiles);
  log('  → Resultado POST:', saveOk ? '✅ ÉXITO' : '❌ FALLÓ');
  log('');

  // 6. Esperar 2 segundos para que Google Sheets procese
  log('⏳ PASO 6: Esperando 2 segundos...');
  await new Promise(r => setTimeout(r, 2000));
  log('');

  // 7. Verificar que se guardó en remoto
  log('🔍 PASO 7: Verificar en remoto');
  const remoteCheck = await remoteGetFilesJSONP(hex);
  log('  → Archivos en remoto:', remoteCheck ? remoteCheck.length : 'NULL');
  log('  → Coincide con local:', remoteCheck && remoteCheck.length === newFiles.length ? '✅' : '❌');
  log('  → Datos remotos:', JSON.stringify(remoteCheck));
  log('');

  // 8. Resumen
  log('═══════════════════════════════════════════');
  log('📊 RESUMEN DEL TEST');
  log('═══════════════════════════════════════════');
  log('✓ Lectura local:', localFiles.length, 'archivos');
  log('✓ Lectura remota inicial:', remoteFiles ? remoteFiles.length : 'NULL', 'archivos');
  log('✓ Guardado local:', savedLocal.length === newFiles.length ? '✅' : '❌');
  log('✓ Guardado remoto:', saveOk ? '✅' : '❌');
  log('✓ Verificación remota:', remoteCheck && remoteCheck.length === newFiles.length ? '✅' : '❌');
  log('');

  if (remoteCheck && remoteCheck.length === newFiles.length) {
    log('🎉 ¡TEST EXITOSO! La sincronización funciona correctamente');
    log('💡 Abre la página en otro dispositivo/pestaña y ejecuta:');
    log('   verDatosGuardados()');
  } else {
    log('❌ TEST FALLÓ - La sincronización no está funcionando');
    log('🔧 Posibles causas:');
    log('   1. El POST no llega a Google Sheets');
    log('   2. Google Apps Script tiene un error');
    log('   3. La URL del WebApp es incorrecta');
    log('   4. Hay un delay en el procesamiento');
  }
  log('═══════════════════════════════════════════');
};

// 🔍 DIAGNÓSTICO: Ver qué devuelve realmente el servidor
window.diagnosticarRespuesta = async function (hex = null) {
  log('═══════════════════════════════════════════');
  log('🔍 DIAGNÓSTICO DE RESPUESTA DEL SERVIDOR');
  log('═══════════════════════════════════════════');

  // Test 1: Sin callback (JSON puro)
  const testUrl1 = hex
    ? `${REMOTE_BASE_URL}?hex=${encodeURIComponent(hex)}&ts=${Date.now()}`
    : `${REMOTE_BASE_URL}?action=get_courses&ts=${Date.now()}`;

  // Test 2: Con callback (JSONP)
  const testUrl2 = hex
    ? `${REMOTE_BASE_URL}?hex=${encodeURIComponent(hex)}&callback=testCallback123&ts=${Date.now()}`
    : `${REMOTE_BASE_URL}?action=get_courses&callback=testCallback123&ts=${Date.now()}`;

  log('');
  log('🧪 TEST 1: Sin parámetro callback');
  log('URL:', testUrl1);
  log('');

  try {
    const response1 = await fetch(testUrl1);
    const text1 = await response1.text();

    log('Status:', response1.status);
    log('Content-Type:', response1.headers.get('content-type'));
    log('📄 Respuesta:');
    log('─────────────────────────────────────────');
    log(text1);
    log('─────────────────────────────────────────');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  log('');
  log('🧪 TEST 2: Con parámetro callback=testCallback123');
  log('URL:', testUrl2);
  log('');

  try {
    const response2 = await fetch(testUrl2);
    const text2 = await response2.text();

    log('Status:', response2.status);
    log('Content-Type:', response2.headers.get('content-type'));
    log('📄 Respuesta:');
    log('─────────────────────────────────────────');
    log(text2);
    log('─────────────────────────────────────────');
    log('');

    // Analizar si es JSONP válido
    if (text2.includes('testCallback123')) {
      log('✅ El servidor SÍ está usando el callback');
      if (text2.startsWith('testCallback123(') && text2.includes(')')) {
        log('✅ Formato JSONP CORRECTO');
        log('');
        log('🎉 ¡EL SERVIDOR ESTÁ CONFIGURADO CORRECTAMENTE!');
      } else {
        log('⚠️ El callback está presente pero el formato es incorrecto');
      }
    } else {
      log('❌ El servidor NO está usando el callback');
      log('❌ Problema: Google Apps Script no está devolviendo JSONP');
      log('');
      log('🔧 SOLUCIONES:');
      log('1. Verifica que copiaste el código COMPLETO a Google Apps Script');
      log('2. Verifica que guardaste (Ctrl+S)');
      log('3. Haz una NUEVA implementación (no editar la existente)');
      log('4. Copia la NUEVA URL y actualiza app.js');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  log('═══════════════════════════════════════════');
};

// 🧪 TEST JSONP SIMPLE
window.testJSONP = async function (hex) {
  log('🧪 TEST JSONP para hex:', hex);
  // 🛡️ Cache-buster
  const url = REMOTE_BASE_URL
    + '?hex=' + encodeURIComponent(hex)
    + '&callback=test_callback'
    + '&ts=' + Date.now();
  log('URL:', url);

  return new Promise((resolve) => {
    const callbackName = 'test_callback_' + Date.now();
    const script = document.createElement('script');
    const testUrl = REMOTE_BASE_URL
      + '?hex=' + encodeURIComponent(hex)
      + '&callback=' + callbackName
      + '&ts=' + Date.now();
    script.src = testUrl;

    window[callbackName] = function (data) {
      log('✅ CALLBACK EJECUTADO!', data);
      document.body.removeChild(script);
      delete window[callbackName];
      resolve(data);
    };

    script.onerror = (err) => {
      console.error('❌ ERROR cargando script:', err);
      if (script.parentNode) document.body.removeChild(script);
      if (window[callbackName]) delete window[callbackName];
      resolve(null);
    };

    setTimeout(() => {
      if (window[callbackName]) {
        warn('⏱️ TIMEOUT - callback no se ejecutó después de 10s');
        if (script.parentNode) document.body.removeChild(script);
        delete window[callbackName];
        resolve(null);
      }
    }, 10000);

    document.body.appendChild(script);
    log('📡 Script agregado, esperando respuesta...');
  });
};

// Probar GET directo desde la consola
window.testGET = async function (hex) {
  log('🧪 TEST GET para hex:', hex);
  try {
    const result = await remoteGetFiles(hex);
    log('✅ Resultado:', result);
    return result;
  } catch (e) {
    console.error('❌ Error:', e);
    return null;
  }
};

