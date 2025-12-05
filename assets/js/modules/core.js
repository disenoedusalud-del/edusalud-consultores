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

// ✅ Exponer globalmente
window.log = log;
window.warn = warn;
window.error = error;

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
            view: getCurrentView ? getCurrentView() : 'unknown'
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
        if (sendToFirebase && typeof hasRemote === 'function' && hasRemote() && window.firebaseDB) {
            try {
                await window.firebaseDB.ref(`${AUDIT_LOG_FIREBASE_PATH}/${logEntry.id}`).set({
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
    const realFiles = typeof getFilesForHex === 'function' ? getFilesForHex(hex) : [];
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
            const realFiles = typeof getFilesForHex === 'function' ? getFilesForHex(hex) : [];
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
