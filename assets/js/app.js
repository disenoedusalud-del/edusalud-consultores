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

// Verificar si Firebase ya está listo o esperar a que cargue
function checkFirebaseStatus() {
  if (window.firebaseDB) {
    console.log('[APP] ✅ Firebase disponible y listo para usar');
    return true;
  } else if (typeof firebase !== 'undefined') {
    console.log('[APP] ⏳ Firebase cargando, esperando Firestore...');
    return false;
  } else {
    console.log('[APP] ℹ️ Modo sin Firebase (usando solo Google Sheets)');
    return false;
  }
}

// Escuchar evento cuando Firebase esté listo
window.addEventListener('firebaseReady', (e) => {
  console.log('[APP] 🔥 Firebase conectado y listo para sincronización en tiempo real');
  console.log('[APP] 📊 Base de datos:', e.detail.db ? 'Firestore activo' : 'No disponible');
  initFirebaseCustomCoursesRealtime();
});

// Escuchar evento de error de Firebase
window.addEventListener('firebaseError', (e) => {
  console.log('[APP] ⚠️ Firebase no disponible, usando Google Sheets como backend');
});

// Verificación inicial
setTimeout(() => {
  checkFirebaseStatus();
}, 1500);

console.log('[APP] Iniciando aplicación con soporte Firebase...');

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

/* ===================== RATE LIMITING ===================== */

/**
 * ✅ Rate limiting para prevenir acciones repetidas
 */
const actionTimestamps = {};
const RATE_LIMIT_MS = 2000; // 2 segundos entre acciones

function checkRateLimit(action, customLimit = RATE_LIMIT_MS) {
  const now = Date.now();
  const lastAction = actionTimestamps[action] || 0;
  if (now - lastAction < customLimit) {
    const remaining = Math.ceil((customLimit - (now - lastAction)) / 1000);
    if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal(
        'Espera un momento',
        `Por favor espera ${remaining} segundo(s) antes de ${action} nuevamente.`
      );
    } else {
      alert(`Espera ${remaining} segundo(s) antes de ${action} nuevamente`);
    }
    return false;
  }
  actionTimestamps[action] = now;
  return true;
}

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
  icon.textContent = getToastIcon(type);
  icon.style.cssText = `
    font-size: 20px;
    flex-shrink: 0;
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
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
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
  Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,'0')).join('');

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
    } catch(e) {
      gtag('event', 'file_download', {
        'event_category': 'download',
        'event_label': 'unknown'
      });
    }
  }
}

/* ============ base de cursos (hash -> data) ============ */
const MASTER_HASH = "7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8"; // EDUMASTER123456987

// ✅ CURSOS BASE ELIMINADOS - Todos los cursos ahora vienen de Firebase (customCourses)
const ACCESS_HASH_MAP = {};

/* ============ persistencia de cursos personalizados ============ */
const CUSTOM_COURSES_KEY = 'edusalud_custom_courses';
function loadCustomCourses(){
  try {
    // ✅ Verificar que localStorage está disponible (importante para modo incógnito)
    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('[STORAGE] localStorage no disponible (modo incógnito?)');
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
function saveCustomCourses(courses){
  try {
    // ✅ Verificar que localStorage está disponible
    if (typeof Storage === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('[STORAGE] localStorage no disponible, no se pueden guardar cursos');
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
function getMergedAccessHashMap(){
  // ✅ CURSOS BASE ELIMINADOS - Solo usar cursos de Firebase (customCourses)
  const base = ACCESS_HASH_MAP || {};
  
  let custom = {};
  try {
    custom = loadCustomCourses();
  } catch (e) {
    console.warn('[HASHMAP] Error cargando cursos custom:', e);
  }
  
  // ✅ Combinar base (vacío) con custom - Ahora solo custom tiene cursos
  const merged = Object.assign({}, base, custom);
  console.log('[HASHMAP] Cursos base:', Object.keys(base).length, 'Custom:', Object.keys(custom).length, 'Total:', Object.keys(merged).length);
  
  return merged;
}

// Cargar cursos remotos al inicio
async function loadRemoteCoursesOnInit(){
  // Cargar cursos remotos sin sessionStorage para que siempre cargue
  try {
    await refreshCustomCourses();
  } catch (e) {
    console.warn('[INIT] Error cargando cursos remotos al inicio (continuando):', e);
    // No bloquear la carga si falla
  }
}
async function addCustomCourse(hex, courseData){
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
  console.log('[ADD COURSE] 🧹 localStorage de links limpiado para curso nuevo');

  const db = getFirestoreDB();
  if (db) {
    try {
      // ✅ LIMPIAR DATOS RESIDUALES: Si existe un curso anterior con este hash, eliminar sus links primero
      try {
        const linksRef = db.ref(`courses/${hex}/links`);
        const linksSnapshot = await linksRef.once('value');
        if (linksSnapshot.exists()) {
          console.log('[ADD COURSE] 🧹 Eliminando links residuales de Firebase para este hash');
          await linksRef.remove();
        }
      } catch (cleanupError) {
        console.warn('[ADD COURSE] ⚠️ Error limpiando links residuales (continuando):', cleanupError);
      }
      
      const firebasePayload = {
        ...normalizedCourse,
        createdAt: normalizedCourse.createdAt || firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      await db.ref(`customCourses/${hex}`).set(firebasePayload);
      console.log('[ADD COURSE] ✅ Curso guardado en Firebase Realtime Database');
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
    console.warn('[ADD COURSE] ⚠️ Firebase no disponible, usando solo almacenamiento local');
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
    console.log('[ADD COURSE] ✅ Curso guardado en Google Sheets como respaldo');
  }
  
  // ✅ Historial de cambios: registrar creación de curso
  logChangeHistory('course_created', {
    hex: hex.substring(0, 8),
    title: normalizedCourse.title,
    code: normalizedCourse.code
  });
}

// ✅ Hacer exportOverrides() global para acceso desde el menú
window.exportOverrides = exportOverrides;
async function updateCustomCourse(hex, courseData){
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
      await db.ref(`customCourses/${hex}`).set(firebasePayload);
      console.log('[UPDATE COURSE] ✅ Curso actualizado en Firebase Realtime Database');
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
    console.warn('[UPDATE COURSE] ⚠️ Firebase no disponible, usando solo almacenamiento local');
  }

  const saveResult = await remoteSaveCourse(hex, normalizedCourse).catch(e => {
    console.error('[UPDATE COURSE] ❌ Error actualizando curso en remoto (Sheets):', e);
    return false;
  });

  if (saveResult) {
    console.log('[UPDATE COURSE] ✅ Curso actualizado en Google Sheets como respaldo');
  }
  
  // ✅ Historial de cambios: registrar actualización de curso
  logChangeHistory('course_updated', {
    hex: hex.substring(0, 8),
    title: normalizedCourse.title,
    changes: Object.keys(courseData)
  });
}

async function removeCustomCourse(hex){
  const custom = loadCustomCourses();
  // ✅ Guardar información del curso antes de eliminarlo (para historial)
  const deletedCourse = custom[hex] || {};
  delete custom[hex];
  saveCustomCourses(custom);

  const db = getFirestoreDB();
  if (db) {
    try {
      // ✅ Eliminar el curso de customCourses
      await db.ref(`customCourses/${hex}`).remove();
      console.log('[DELETE COURSE] ✅ Curso eliminado de Firebase');
      
      // ✅ Eliminar también todos los links asociados al curso
      await db.ref(`courses/${hex}/links`).remove();
      console.log('[DELETE COURSE] ✅ Links del curso eliminados de Firebase');
      
      // ✅ Limpiar también localStorage de los links
      clearFilesOverride(hex);
      console.log('[DELETE COURSE] ✅ Links eliminados de localStorage');
      
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
    console.warn('[DELETE COURSE] ⚠️ Error eliminando curso en Google Sheets:', e);
  });
  
  // ✅ Eliminar también los links de la hoja de overrides en Google Sheets
  await remoteDeleteFiles(hex).catch(e => {
    console.warn('[DELETE COURSE] ⚠️ Error eliminando links de Google Sheets:', e);
  });
  
  // ✅ Historial de cambios: registrar eliminación de curso
  logChangeHistory('course_deleted', {
    hex: hex.substring(0, 8),
    title: deletedCourse.title || 'Desconocido',
    code: deletedCourse.code || ''
  });
}
function isCustomCourse(hex){
  const custom = loadCustomCourses();
  return hex in custom;
}

/* ============ persistencia de enlaces por curso ============ */
const FILES_STORAGE_PREFIX = 'edusalud_files_';
const CACHE_VERSION_KEY = 'edusalud_cache_version';
const CURRENT_CACHE_VERSION = '1.2'; // Incrementar para forzar limpieza

function storageKeyFor(hex){ return FILES_STORAGE_PREFIX + hex; }

// ✅ Verificar versión de caché (YA NO limpia automáticamente)
function checkAndCleanOldCache(){
  try {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (storedVersion !== CURRENT_CACHE_VERSION) {
      console.log('[CACHE] ℹ️ Nueva versión detectada:', CURRENT_CACHE_VERSION);
      // SOLO actualizar versión, NO limpiar datos
      // Los datos se sincronizarán con remoto automáticamente
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
      console.log('[CACHE] ✅ Versión actualizada, datos se sincronizarán automáticamente');
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[CACHE] Error verificando versión:', e);
    return false;
  }
}

function loadFilesOverride(hex){
  try {
    const raw = localStorage.getItem(storageKeyFor(hex));
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : null;
  } catch (e) { return null; }
}
function saveFilesOverride(hex, files){
  try {
    const key = storageKeyFor(hex);
    const value = JSON.stringify(files || []);
    localStorage.setItem(key, value);
    console.log('[STORAGE] 💾 Guardados', files.length, 'archivos para hex:', hex.substring(0, 8));
  } catch (e) {
    console.error('[STORAGE] ❌ Error guardando archivos:', e);
  }
}
function clearFilesOverride(hex){
  try { localStorage.removeItem(storageKeyFor(hex)); } catch(e) {}
}
// ✅ Limpiar TODOS los overrides de archivos
function clearAllFilesOverrides(){
  try {
    const keys = Object.keys(localStorage);
    let count = 0;
    keys.forEach(key => {
      if (key.startsWith(FILES_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
        count++;
      }
    });
    console.log('[CACHE] 🧹 Limpiados', count, 'archivos de localStorage');
    return count;
  } catch (e) {
    console.warn('[CACHE] Error limpiando archivos:', e);
    return 0;
  }
}
function getBaseFilesForHex(hex){
  // ✅ Links base eliminados - Firebase es la única fuente de verdad
  // Esta función siempre devuelve array vacío porque los links base ya no existen
  return [];
}
function getFilesForHex(hex){
  const override = loadFilesOverride(hex);
  if (override) {
    // console.log('[FILES] Usando override para', hex.substring(0,8), ':', override.length, 'archivos');
    return override;
  }
  const base = getBaseFilesForHex(hex);
  // console.log('[FILES] Usando base para', hex.substring(0,8), ':', base.length, 'archivos');
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
    console.log('[FIREBASE COURSES] Firebase no configurado, no se inicia listener de cursos');
    return;
  }

  if (customCoursesListener) {
    return; // Listener ya activo
  }

  try {
    customCoursesRef = db.ref('customCourses');
    customCoursesListener = customCoursesRef.on('value', (snapshot) => {
      const rawCourses = snapshot.exists() ? snapshot.val() : {};
      console.log('[FIREBASE COURSES] 📥 Snapshot recibido - Cursos totales:', Object.keys(rawCourses).length);

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
          console.log('[FIREBASE COURSES] 🔑 Usando código local para:', hex.substring(0, 8), 'Código:', codeToUse);
        } else if (codeToUse) {
          console.log('[FIREBASE COURSES] 🔑 Usando código de Firebase para:', hex.substring(0, 8), 'Código:', codeToUse);
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
        console.log('[FIREBASE COURSES] 🔄 Cambio detectado: cursos locales:', previousCount, '→ Firebase:', currentCount);
        if (currentCount < previousCount) {
          console.log('[FIREBASE COURSES] 🗑️ Curso(s) eliminado(s) - se actualizará localStorage');
        }
      }
      
      try {
        saveCustomCourses(mergedCourses);
        console.log('[FIREBASE COURSES] ✅ localStorage actualizado con', currentCount, 'cursos (Firebase es la fuente de verdad)');
      } catch (e) {
        console.warn('[FIREBASE COURSES] ⚠️ No se pudieron guardar cursos en localStorage:', e);
      }

      if (userInteracting) {
        console.log('[FIREBASE COURSES] ⏸️ Usuario interactuando, actualizará después');
        // ✅ Aún así actualizar localStorage para mantener sincronización
        return;
      }

      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      const isContentView = document.getElementById('content') && !document.getElementById('content').classList.contains('hidden');

      if (isMasterView) {
        console.log('[FIREBASE COURSES] ♻️ Re-renderizando grid Master (cursos eliminados se quitarán automáticamente)');
        buildMasterGrid();
        // ✅ Actualizar estadísticas después de re-renderizar (buildMasterGrid ya lo hace, pero por si acaso)
        setTimeout(() => updateMasterStats(mergedCourses), 100);
      }

      if (isContentView && currentKeyHex && rawCourses[currentKeyHex]) {
        console.log('[FIREBASE COURSES] ♻️ Re-renderizando curso personalizado en vista individual');
        renderCourse(currentKeyHex);
      }
    });

    console.log('[FIREBASE COURSES] ✅ Listener de cursos personalizados activo');
  } catch (error) {
    console.error('[FIREBASE COURSES] ❌ Error iniciando listener de cursos:', error);
  }
}

function teardownFirebaseCustomCoursesRealtime() {
  if (customCoursesRef && customCoursesListener) {
    try {
      customCoursesRef.off('value', customCoursesListener);
      console.log('[FIREBASE COURSES] 🔕 Listener de cursos desactivado');
    } catch (error) {
      console.warn('[FIREBASE COURSES] ⚠️ Error al desactivar listener de cursos:', error);
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
    console.log('[FIRESTORE] Firebase no configurado para Master');
    return;
  }
  
  console.log('[FIRESTORE] 🔥 Iniciando listeners para', courseHexes.length, 'cursos en Master');
  
  // Limpiar listeners antiguos que ya no están en la lista
  activeListeners.forEach((unsubscribe, hex) => {
    if (!courseHexes.includes(hex)) {
      console.log('[FIRESTORE] Desuscribiendo listener obsoleto:', hex.substring(0, 10));
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
          console.log('[FIREBASE] 📥 Cambio detectado en', courseHex.substring(0, 10), ':', firebaseLinks.length, 'links');
        }
        
        mergeFirestoreLinks(courseHex, firebaseLinks);
      });
      
      activeListeners.set(courseHex, () => linksRef.off('value', unsubscribe));
      console.log('[FIRESTORE] ✅ Listener activo para:', courseHex.substring(0, 10));
      
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
    console.log('[FIRESTORE] Firebase no configurado, continuando sin tiempo real');
    return;
  }

  // Desuscribir listeners anteriores si existen
  if (firestoreUnsubscribe) {
    console.log('[FIRESTORE] Desuscribiendo listener anterior');
    firestoreUnsubscribe();
    firestoreUnsubscribe = null;
  }

  if (!courseHex || courseHex === MASTER_HASH) {
    console.log('[FIRESTORE] No iniciar listener en vista master');
    return;
  }

  console.log('[FIRESTORE] 🔥 Iniciando listener en tiempo real para curso:', courseHex.substring(0, 10) + '...');

  try {
    // Referencia a la ruta de links de este curso (Realtime Database)
    const linksRef = db.ref(`courses/${courseHex}/links`);

    // ✅ SUSCRIBIRSE a cambios en tiempo real
    firestoreUnsubscribe = linksRef.on('value', (snapshot) => {
      console.log('[FIREBASE] 📥 Evento disparado - Snapshot existe:', snapshot.exists());
      
      const firebaseLinks = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const linkCount = Object.keys(data).length;
        console.log('[FIREBASE] 📥 Links en Firebase:', linkCount);
        
        // Convertir objeto a array
        Object.keys(data).forEach((key) => {
          firebaseLinks.push({
            id: key,
            ...data[key]
          });
        });
        
        // Ordenar por createdAt descendente
        firebaseLinks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        console.log('[FIREBASE] 📥 Cambios detectados - Total de links:', linkCount);
        console.log('[FIREBASE] 📝 Links:', firebaseLinks.map(l => l.label).join(', '));
      } else {
        console.log('[FIREBASE] ℹ️ Sin datos en Firebase (primera carga o curso vacío)');
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
  console.log('[FIRESTORE] 🔥 Firebase es la ÚNICA FUENTE DE VERDAD - Total:', firestoreLinks.length, 'links');
  
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
      console.log('[MERGE] ⚠️ Duplicado en Firebase detectado y filtrado:', link.label);
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
    console.log('[FIRESTORE] ⏸️ Usuario interactuando, posponer re-render');
    return;
  }
  
  // ✅ RE-RENDERIZAR vista actual solo si es necesario
  const isContentView = document.getElementById('content') && 
                       !document.getElementById('content').classList.contains('hidden');
  const isMasterView = document.getElementById('master') && 
                      !document.getElementById('master').classList.contains('hidden');
  
  if (isContentView && window.currentCourseHex === courseHex) {
    console.log('[FIRESTORE] ♻️ Re-renderizando curso (vista individual)');
    renderCourse(courseHex);
  } else if (isMasterView) {
    console.log('[FIRESTORE] ♻️ Re-renderizando Master grid con nuevos datos');
    buildMasterGrid();
  }
}

/**
 * ✅ FUNCIÓN GLOBAL: Agregar link a Firebase Firestore
 * Se puede llamar desde cualquier parte del código
 */
window.agregarLinkFirebase = async function(courseHex, label, url) {
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
    
    console.log('[FIRESTORE] ➕ Agregando link a Firebase:', label);
    console.log('[FIRESTORE] 📍 Curso:', courseHex.substring(0, 10) + '...');
    
    // Referencia a la ruta del curso (Realtime Database)
    const linksRef = db.ref(`courses/${courseHex}/links`);
    
    console.log('[FIRESTORE] 📤 Enviando datos a Realtime Database...');
    
    // Generar nuevo ID y agregar link
    const newLinkRef = linksRef.push();
    await newLinkRef.set({
      label: label.trim(),
      url: url.trim(),
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    console.log('[FIRESTORE] ✅ Link agregado con ID:', newLinkRef.key);
    console.log('[FIRESTORE] ⏳ El cambio se detectará automáticamente en todos los dispositivos...');
    
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
window.eliminarLinkFirebase = async function(courseHex, firebaseId) {
  const db = getFirestoreDB();
  
  if (!db) {
    console.warn('[FIRESTORE] Firebase no configurado');
    return;
  }

  try {
    if (!firebaseId) {
      throw new Error('No se puede eliminar: link no tiene ID de Firebase');
    }
    
    console.log('[FIRESTORE] 🗑️ Eliminando link de Firebase:', firebaseId);
    
    // Referencia al link específico (Realtime Database)
    const linkRef = db.ref(`courses/${courseHex}/links/${firebaseId}`);
    await linkRef.remove();
    
    console.log('[FIRESTORE] ✅ Link eliminado de Firebase');
    
  } catch (error) {
    console.error('[FIRESTORE] ❌ Error eliminando link:', error);
    throw error;
  }
};

console.log('[FIRESTORE] ✅ Funciones Firebase registradas globalmente');

/* ============ sincronización remota (opcional) ============ */
const REMOTE_BASE_URL = 'https://script.google.com/macros/s/AKfycbztpMUW7wlF_Ikum-sIwGHEVCKblcsGiQhmBaeB-_vJ-uhtSuH9ipd0PjRiBagq8jmM/exec';
function hasRemote(){ return typeof REMOTE_BASE_URL === 'string' && REMOTE_BASE_URL.startsWith('http'); }
function stableStringify(obj){ try { return JSON.stringify(obj || []); } catch { return '[]'; } }
async function remoteGetFiles(hex){
  if (!hasRemote()) return null;
  console.log('[GET] Iniciando para hex:', hex.substring(0,8));
  
  // Intentar primero con fetch (puede funcionar si el servidor tiene CORS habilitado)
  try {
    const url = REMOTE_BASE_URL + '?hex=' + encodeURIComponent(hex);
    console.log('[GET] Intentando fetch directo...');
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors', // Intentar con no-cors primero
      cache: 'no-store'
    });
    
    // Con no-cors no podemos leer la respuesta, así que seguimos con JSONP
    console.log('[GET] Fetch no-cors enviado, pero no podemos leer respuesta. Intentando JSONP...');
  } catch (e) {
    console.log('[GET] Fetch falló, intentando JSONP...');
  }
  
  // Usar JSONP como método principal
  try {
    const jsonpResult = await remoteGetFilesJSONP(hex);
    if (jsonpResult && Array.isArray(jsonpResult)) {
      console.log('[GET] ✅ JSONP éxito - hex:', hex.substring(0,8), 'files:', jsonpResult.length);
      return jsonpResult;
    } else {
      console.warn('[GET] ⚠️ JSONP retornó null o no es array');
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
  console.log('[DIAG] Probando respuesta del WebApp...');
  // 🛡️ Cache-buster
  const testUrl = REMOTE_BASE_URL 
    + '?hex=' + encodeURIComponent(hex) 
    + '&callback=test_callback'
    + '&ts=' + Date.now();
  
  // Intentar cargar como imagen para ver si hay redirección
  const img = new Image();
  img.onerror = () => {
    console.log('[DIAG] La URL no se puede cargar como imagen (esperado para script)');
  };
  img.src = testUrl;
  
  // También mostrar la URL completa para copiar y probar manualmente
  console.log('[DIAG] URL completa para probar manualmente:', testUrl);
  console.log('[DIAG] Abre esta URL en tu navegador para ver qué devuelve:', testUrl);
}

function remoteGetFilesJSONP(hex){
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
    
    console.log('[JSONP] Intentando GET para hex:', hex.substring(0,8));
    console.log('[JSONP] URL:', url);
    console.log('[JSONP] Callback name:', callbackName);
    
    let resolved = false;
    const cleanup = () => {
      try {
        if (script.parentNode) document.body.removeChild(script);
      } catch(e) {}
      try {
        if (window[callbackName]) delete window[callbackName];
      } catch(e) {}
    };
    
    // Crear callback global ANTES de agregar el script
    window[callbackName] = function(data) {
      if (resolved) {
        console.warn('[JSONP] Callback llamado pero ya resuelto');
        return;
      }
      resolved = true;
      clearTimeout(timeout);
      console.log('[JSONP] ✅ Callback recibido!', data);
      
      let files = null;
      if (data && Array.isArray(data.files)) {
        files = data.files;
        console.log('[JSONP] ✅ Archivos encontrados:', files.length);
      } else {
        console.warn('[JSONP] ⚠️ Respuesta inválida - no hay files array:', data);
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
      console.log('[JSONP] Script cargado, esperando callback...');
      // Si después de 2 segundos no se llamó el callback, algo está mal
      setTimeout(() => {
        if (!resolved) {
          console.warn('[JSONP] ⚠️ Script cargó pero callback no se ejecutó después de 2s');
        }
      }, 2000);
    };
    
    // Timeout de 10 segundos (Google Apps Script puede ser lento en primera carga)
    const timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      console.warn('[JSONP] ⚠️ Timeout después de 10s para hex:', hex.substring(0,8));
      cleanup();
      resolve(null);
    }, 10000);
    
    try {
      document.body.appendChild(script);
      console.log('[JSONP] Script agregado al DOM');
    } catch(e) {
      console.error('[JSONP] Error agregando script:', e);
      cleanup();
      resolve(null);
    }
  });
}
async function remoteSaveFiles(hex, files){
  if (!hasRemote()) {
    console.warn('[SAVE] ⚠️ No hay remoto configurado');
    return false;
  }
  try {
    const filesJson = JSON.stringify(Array.isArray(files) ? files : []);
    console.log('[SAVE] Enviando a remoto - hex:', hex.substring(0,8), 'archivos:', files.length);
    console.log('[SAVE] Datos a guardar:', filesJson.substring(0, 100) + '...');
    console.log('[SAVE] URL remoto:', REMOTE_BASE_URL);
    
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
    
    console.log('[SAVE] Formulario creado, enviando...');
    form.submit();
    console.log('[SAVE] ✅ Formulario enviado a:', REMOTE_BASE_URL);
    
    // Limpiar después de un breve delay
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (e) {
        console.warn('[SAVE] Error limpiando:', e);
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
async function refreshFromRemote(hex, context){
  try {
    const remote = await remoteGetFiles(hex);
    if (!remote || !Array.isArray(remote)) return false;
    const current = getFilesForHex(hex);
    if (stableStringify(remote) !== stableStringify(current)) {
      saveFilesOverride(hex, remote);
      if (context === 'course') {
        if (currentKeyHex === hex) {
          renderCourse(hex);
        }
      } else {
        // En master, reconstruir todo el grid
        buildMasterGrid();
      }
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Error en refreshFromRemote:', e);
    return false;
  }
}

// ===== Sincronización remota de cursos personalizados =====
async function remoteSaveCourse(hex, courseData){
  if (!hasRemote()) {
    console.warn('[COURSE SAVE] ⚠️ No hay remoto configurado');
    return false;
  }
  try {
    const courseJson = JSON.stringify(courseData);
    console.log('[COURSE SAVE] Enviando curso a remoto - hex:', hex.substring(0,8));
    console.log('[COURSE SAVE] Datos del curso:', courseJson.substring(0, 100) + '...');
    console.log('[COURSE SAVE] URL remoto:', REMOTE_BASE_URL);
    
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
    
    console.log('[COURSE SAVE] Formulario creado, enviando...');
    console.log('[COURSE SAVE] Hex:', hex);
    console.log('[COURSE SAVE] Course JSON length:', courseJson.length);
    
    // ✅ Enviar formulario
    form.submit();
    console.log('[COURSE SAVE] ✅ Formulario enviado a:', REMOTE_BASE_URL);
    
    // ✅ Esperar más tiempo para asegurar que el servidor procesó el envío
    // No limpiar inmediatamente para no interrumpir el envío
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
    
    // Limpiar formulario después de enviar (iframe se mantiene un poco más)
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        console.log('[COURSE SAVE] Formulario limpiado');
      } catch (e) {
        console.warn('[COURSE SAVE] Error limpiando formulario:', e);
      }
    }, 500);
    
    // Limpiar iframe después de más tiempo
    setTimeout(() => {
      try {
        if (iframe.parentNode) document.body.removeChild(iframe);
        console.log('[COURSE SAVE] Iframe limpiado');
      } catch (e) {
        console.warn('[COURSE SAVE] Error limpiando iframe:', e);
      }
    }, 3000); // 3 segundos total
    
    return true;
  } catch (e) { 
    console.error('[COURSE SAVE] ❌ Error en remoteSaveCourse:', e);
    return false; 
  }
}

async function remoteDeleteCourse(hex){
  if (!hasRemote()) return false;
  try {
    console.log('[COURSE DELETE] Eliminando curso remoto - hex:', hex.substring(0,8));
    
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
    console.log('[COURSE DELETE] ✅ Formulario de eliminación enviado a:', REMOTE_BASE_URL);
    
    // ✅ Limpiar formulario después de enviar
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (e) {
        console.warn('[COURSE DELETE] Error limpiando formulario:', e);
      }
      
      // ✅ Forzar refresh inmediato para que otros dispositivos vean el cambio
      console.log('[COURSE DELETE] Iniciando refresh para sincronizar eliminación...');
      const refreshAttempts = [500, 1000, 2000, 4000];
      refreshAttempts.forEach((delay, index) => {
        setTimeout(async () => {
          console.log(`[COURSE DELETE] Refrescando después de eliminar (intento ${index + 1}/${refreshAttempts.length} - ${delay}ms)...`);
          try {
            await refreshCustomCourses();
            console.log('[COURSE DELETE] ✅ Refresh completado');
          } catch (e) {
            console.warn('[COURSE DELETE] Error en refresh:', e);
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

async function remoteDeleteFiles(hex){
  if (!hasRemote()) return false;
  try {
    console.log('[FILES DELETE] Eliminando links de la hoja de overrides - hex:', hex.substring(0,8));
    
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
    console.log('[FILES DELETE] ✅ Formulario de eliminación de links enviado a:', REMOTE_BASE_URL);
    
    // ✅ Limpiar formulario después de enviar
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (e) {
        console.warn('[FILES DELETE] Error limpiando formulario:', e);
      }
    }, 2000);
    
    return true;
  } catch (e) { 
    console.error('Error en remoteDeleteFiles:', e);
    return false; 
  }
}

async function remoteGetCourses(){
  if (!hasRemote()) return {};
  try {
    console.log('[COURSE GET] Obteniendo cursos remotos...');
    
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
        } catch(e) {}
        try {
          if (window[callbackName]) delete window[callbackName];
        } catch(e) {}
      };
      
      // ✅ CRÍTICO: Registrar callback ANTES de agregar script al DOM
      window[callbackName] = function(data) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        
        let courses = {};
        if (data && typeof data.courses === 'object') {
          courses = data.courses;
          console.log('[COURSE GET] ✅ Cursos remotos obtenidos:', Object.keys(courses).length);
        } else {
          console.warn('[COURSE GET] ⚠️ Datos recibidos no tienen formato esperado:', data);
        }
        
        cleanup();
        resolve(courses);
      };
      
      const timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        console.warn('[COURSE GET] ⚠️ Timeout después de 10s');
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
      console.log('[COURSE GET] Callback registrado:', callbackName);
      console.log('[COURSE GET] URL completa:', script.src);
      document.body.appendChild(script);
    });
  } catch (e) {
    console.error('Error en remoteGetCourses:', e);
    return {};
  }
}

async function refreshCustomCourses(){
  // ✅ Iniciar medición de sincronización
  const syncStart = startPerformanceMeasure('Sincronización');
  
  if (getFirestoreDB()) {
    console.log('[REFRESH] Firebase maneja cursos personalizados en tiempo real, sin usar JSONP');
    endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Firebase' });
    return false;
  }
  if (!hasRemote()) {
    console.log('[REFRESH] Sin remoto, saltando...');
    endPerformanceMeasure('Sincronización', syncStart, { metodo: 'Sin remoto' });
    return false;
  }
  try {
    console.log('[REFRESH] Obteniendo cursos personalizados remotos...');
    
    // ✅ Timeout de 10 segundos (Google Apps Script puede ser lento en primera carga)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('[REFRESH] ⚠️ Timeout obteniendo cursos remotos después de 10s (continuando con cursos base)');
        resolve({});
      }, 10000); // 10 segundos para dar tiempo a Google Apps Script
    });
    
    const remoteCoursesPromise = remoteGetCourses();
    const remoteCourses = await Promise.race([remoteCoursesPromise, timeoutPromise]);
    
    console.log('[REFRESH] Cursos remotos obtenidos:', Object.keys(remoteCourses || {}).length);
    
    // ✅ Remoto es la fuente de verdad - sobrescribir completamente
    let localCourses = {};
    try {
      localCourses = loadCustomCourses();
    } catch (e) {
      console.warn('[REFRESH] Error cargando cursos locales (modo incógnito?):', e);
      localCourses = {};
    }
    
    const remoteKeys = Object.keys(remoteCourses || {});
    
    console.log('[REFRESH] Comparación - Remoto:', remoteKeys.length, 'Local:', Object.keys(localCourses).length);
    
    // Detectar cambios antes de guardar
    const hadChanges = JSON.stringify(localCourses) !== JSON.stringify(remoteCourses || {});
    
    // Guardar solo los cursos remotos (remoto es la fuente de verdad)
    // ✅ Manejar error de localStorage silenciosamente
    try {
      saveCustomCourses(remoteCourses || {});
      console.log('[REFRESH] ✅ Cursos sincronizados');
    } catch (e) {
      console.warn('[REFRESH] ⚠️ No se pudieron guardar cursos (modo incógnito?), continuando...', e);
    }
    
    // ✅ IMPORTANTE: Refrescar archivos SOLO del curso actual si es personalizado
    // No refrescar todos los cursos personalizados para evitar lentitud
    // El refresh periódico se encargará de refrescar todos cada 3 segundos
    if (currentKeyHex && remoteCourses && remoteCourses[currentKeyHex]) {
      console.log('[REFRESH] Curso actual es personalizado, refrescando sus archivos...');
      refreshFromRemoteSilent(currentKeyHex).then(updated => {
        if (updated) {
          console.log('[REFRESH] ✅ Archivos del curso actual actualizados');
          // Solo actualizar vista si estamos viendo ese curso
          if (document.getElementById('content') && !document.getElementById('content').classList.contains('hidden')) {
            renderCourse(currentKeyHex);
          }
        }
      }).catch(e => {
        console.warn('[REFRESH] Error refrescando archivos del curso actual:', e);
      });
    }
    
    // Si estamos en vista master, reconstruir SOLO si hubo cambios
    if (hadChanges && document.getElementById('master') && !document.getElementById('master').classList.contains('hidden')) {
      console.log('[REFRESH] ✅ Cambios detectados, reconstruyendo Vista Maestra...');
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
function exportOverrides(){
  // ✅ PREVENIR MÚLTIPLES EJECUCIONES: Verificar si ya se está exportando
  if (window._isExporting) {
    console.warn('[EXPORT] Ya hay una exportación en curso, ignorando...');
    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'Exportación en curso', 'Por favor espera a que termine la exportación actual.');
    }
    return;
  }
  
  // ✅ Marcar como exportando
  window._isExporting = true;
  
  try {
    const payload = { 
      version: 2, 
      exportedAt: new Date().toISOString(), 
      overrides: {},
      courses: {} // ✅ NUEVO: Incluir cursos completos
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
    
    if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal(
        'Backup Exportado',
        `Se exportaron ${Object.keys(payload.courses).length} cursos y ${Object.keys(payload.overrides).length} sets de links.`
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
// ✅ Importar backup completo (cursos + overrides)
async function importOverridesFromFile(file){
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data || typeof data !== 'object') {
      if (typeof window.showToast === 'function') {
        window.showToast('error', 'Archivo inválido', 'El archivo seleccionado no es válido.');
      } else {
        alert('Archivo inválido');
      } 
      return;
    }
    
    let coursesCount = 0;
    let overridesCount = 0;
    
    // ✅ Importar cursos personalizados (versión 2)
    if (data.courses && typeof data.courses === 'object') {
      const custom = loadCustomCourses();
      Object.entries(data.courses).forEach(([hex, courseData]) => {
        if (courseData && typeof courseData === 'object') {
          custom[hex] = courseData;
          coursesCount++;
        }
      });
      saveCustomCourses(custom);
      console.log('[IMPORT] ✅ Cursos importados:', coursesCount);
    }
    
    // Importar overrides (links personalizados) - Compatible con versión 1
    if (data.overrides && typeof data.overrides === 'object') {
      Object.entries(data.overrides).forEach(([hex, arr]) => {
        if (Array.isArray(arr)) { 
          saveFilesOverride(hex, arr); 
          overridesCount++; 
        }
      });
      console.log('[IMPORT] ✅ Overrides importados:', overridesCount);
    }
    
    // Reconstruir grid
    buildMasterGrid();
    
    // Mostrar resultado
    const message = `Importado correctamente:\n- ${coursesCount} cursos\n- ${overridesCount} sets de links`;
    if (typeof window.showSuccessModal === 'function') {
      window.showSuccessModal('Backup Importado', message);
    } else {
      alert(message);
    }
    
    // Sincronizar con Firebase si está disponible
    if (getFirestoreDB()) {
      console.log('[IMPORT] 🔄 Sincronizando cursos importados con Firebase...');
      // Los cursos se sincronizarán automáticamente con Firebase
    }
  } catch (e) {
    trackError(e, {
      operation: 'importOverridesFromFile',
      fileType: file?.type || 'unknown'
    });
    alert('No se pudo importar el archivo: ' + (e.message || 'Error desconocido'));
  }
}
function ensureMasterTools(){
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
    console.warn(`[PERFORMANCE] ⚠️ No se encontró tiempo de inicio para: ${operation}`);
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
  
  console.log(message);
  
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
  console.log(`[PERFORMANCE] 📊 ${label}: ${value}`);
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
        console.warn('[ERROR TRACKER] No se pudo enviar a Analytics:', analyticsError);
      }
    }
    
    // 5. Log adicional para debugging
    console.log(`[ERROR TRACKER] 📊 Total de errores ${errorType}: ${errorStats[errorType]}`);
    
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
  
  console.log('[ERROR STATS] 📊 Estadísticas de errores:', stats);
  return stats;
}

/**
 * ✅ Limpiar log de errores
 */
function clearErrorLog() {
  errorLog.length = 0;
  Object.keys(errorStats).forEach(key => delete errorStats[key]);
  console.log('[ERROR TRACKER] ✅ Log de errores limpiado');
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

console.log('[ERROR TRACKER] ✅ Sistema de tracking de errores inicializado');

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
  if (!button) return () => {};
  
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
      button.innerHTML = `✅ ${customText || successText}`;
      setTimeout(() => {
        button.innerHTML = originalHTML;
      }, 2000);
    } else if (!success) {
      button.innerHTML = `❌ ${customText || errorText}`;
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
    console.warn('[THEME] Error obteniendo tema:', e);
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
    console.log('[THEME] ✅ Tema guardado:', theme);
  } catch (e) {
    console.warn('[THEME] Error guardando tema:', e);
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
  console.log('[THEME] ✅ Tema aplicado:', theme);
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
function updateThemeToggleUI(theme) {
  // ✅ Actualizar toggle de la vista maestra
  const icon = document.getElementById('theme-toggle-icon');
  const text = document.getElementById('theme-toggle-text');
  
  if (icon && text) {
    // ✅ El texto indica qué modo se activará al hacer clic (no el modo actual)
    if (theme === 'light') {
      // Si está en modo claro, el botón debe permitir cambiar a oscuro
      icon.textContent = '🌙';
      text.textContent = 'Cambiar a Modo Oscuro';
    } else {
      // Si está en modo oscuro (default), el botón debe permitir cambiar a claro
      icon.textContent = '☀️';
      text.textContent = 'Cambiar a Modo Claro';
    }
  }
  
  // ✅ Actualizar toggle de la vista de consultores
  const iconContent = document.getElementById('theme-toggle-icon-content');
  const textContent = document.getElementById('theme-toggle-text-content');
  
  if (iconContent && textContent) {
    if (theme === 'light') {
      iconContent.textContent = '🌙';
      textContent.textContent = 'Cambiar a Modo Oscuro';
    } else {
      iconContent.textContent = '☀️';
      textContent.textContent = 'Cambiar a Modo Claro';
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
  console.log('[THEME] ✅ Tema inicializado:', theme);
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
    console.warn('[SETTINGS] Botón de ajustes o dropdown no encontrado');
    return;
  }
  
  // ✅ PREVENIR MÚLTIPLES REGISTROS: Verificar si ya está configurado
  if (btnSettings.dataset.settingsConfigured === 'true') {
    console.log('[SETTINGS] Menú ya configurado, saltando...');
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
  
  // ✅ Actualizar UI del toggle según el tema actual
  const currentTheme = getTheme();
  updateThemeToggleUI(currentTheme);
  
  console.log('[SETTINGS] ✅ Menú de ajustes configurado correctamente');
}

// ✅ Función para configurar el menú de ajustes en la vista de consultores
function setupSettingsMenuContent() {
  const btnSettings = document.getElementById('btn-settings-content');
  const dropdown = document.getElementById('settingsDropdownContent');
  
  if (!btnSettings || !dropdown) {
    console.warn('[SETTINGS CONTENT] Botón de ajustes o dropdown no encontrado');
    return;
  }
  
  // ✅ PREVENIR MÚLTIPLES REGISTROS: Verificar si ya está configurado
  if (btnSettings.dataset.settingsConfigured === 'true') {
    console.log('[SETTINGS CONTENT] Menú ya configurado, saltando...');
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
  
  console.log('[SETTINGS CONTENT] ✅ Menú de ajustes de consultores configurado correctamente');
}

// ✅ Función para exportar filtrado por tipo
function showExportFilterModal() {
  // ✅ PREVENIR MÚLTIPLES MODALES: Verificar si ya hay un modal abierto
  const existingModal = document.getElementById('exportFilterModal');
  if (existingModal) {
    console.warn('[EXPORT FILTER] Ya hay un modal de exportación abierto');
    return;
  }
  
  // Crear modal temporal para seleccionar tipo
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.id = 'exportFilterModal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <div class="modal-header">
        <h2>📤 Exportar por Tipo</h2>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div style="padding: 20px;">
        <p style="color: var(--muted); margin-bottom: 16px;">
          Selecciona qué tipo de cursos deseas exportar:
        </p>
        <select id="exportTypeFilter" class="input" style="width: 100%; margin-bottom: 16px;">
          <option value="all">Todos los cursos</option>
          <option value="curso">📖 Solo Cursos</option>
          <option value="diplomado">🎓 Solo Diplomados</option>
          <option value="webinar">💻 Solo Webinars</option>
          <option value="seminario">📝 Solo Seminarios</option>
          <option value="taller">🔧 Solo Talleres</option>
        </select>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn secondary" onclick="this.closest('.modal').remove()">Cancelar</button>
          <button class="btn" onclick="exportFilteredByType()">Exportar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ✅ Función para exportar filtrado
function exportFilteredByType() {
  // ✅ PREVENIR MÚLTIPLES EJECUCIONES
  if (window._isExporting) {
    console.warn('[EXPORT FILTER] Ya hay una exportación en curso, ignorando...');
    if (typeof window.showToast === 'function') {
      window.showToast('warning', 'Exportación en curso', 'Por favor espera a que termine la exportación actual.');
    }
    return;
  }
  
  const filterType = document.getElementById('exportTypeFilter')?.value || 'all';
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
    console.warn('[IMPORT] Ya hay un modal de preview abierto, cerrando el anterior...');
    existingModal.remove();
  }
  
  // ✅ Verificar si ya se está procesando una importación
  if (window._isImporting) {
    console.warn('[IMPORT] Ya hay una importación en curso, ignorando...');
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
            <h3 style="margin: 0 0 12px 0; font-size: 16px;">📋 Contenido del Backup</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
              <div>📚 Cursos: <strong>${coursesCount}</strong></div>
              <div>🔗 Sets de links: <strong>${overridesCount}</strong></div>
              <div>📅 Fecha de exportación: <strong>${exportDate}</strong></div>
              <div>🏷️ Filtro aplicado: <strong>${filterType === 'all' ? 'Todos' : filterType}</strong></div>
            </div>
          </div>
          <p style="color: var(--muted); margin-bottom: 16px; font-size: 13px;">
            ⚠️ Esta acción importará los cursos y links del backup. Los cursos existentes con el mismo código serán sobrescritos.
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
    console.warn('[IMPORT] Ya hay una importación en curso, ignorando...');
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
          
          console.log('[IMPORT] 📤 Guardando curso:', hex.substring(0, 8), '- Título:', normalizedCourse.title);
          
          // ✅ Guardar en Firebase
          if (db) {
            try {
              const firebasePayload = {
                ...normalizedCourse,
                createdAt: normalizedCourse.createdAt || firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
              };
              await db.ref(`customCourses/${hex}`).set(firebasePayload);
              console.log('[IMPORT] ✅ Curso guardado en Firebase:', hex.substring(0, 8));
            } catch (firebaseError) {
              console.error('[IMPORT] ❌ Error guardando curso en Firebase:', hex.substring(0, 8), firebaseError);
            }
          }
          
          // ✅ Guardar en Google Sheets (esperar a que termine antes de continuar)
          console.log('[IMPORT] 📤 Enviando curso a Google Sheets:', hex.substring(0, 8));
          const saveResult = await remoteSaveCourse(hex, normalizedCourse);
          if (saveResult) {
            console.log('[IMPORT] ✅ Curso guardado en Google Sheets:', hex.substring(0, 8));
          } else {
            console.warn('[IMPORT] ⚠️ No se pudo guardar curso en Google Sheets:', hex.substring(0, 8));
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
    console.warn('[BACKUP HISTORY] Ya hay un modal de historial abierto');
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
    console.log('[BACKUP HISTORY] ✅ Registrado:', action, filterType, coursesCount, 'cursos');
  } catch (e) {
    console.warn('[BACKUP HISTORY] ⚠️ Error guardando historial:', e);
  }
}

function getBackupHistory() {
  try {
    return JSON.parse(localStorage.getItem('backupHistory') || '[]');
  } catch (e) {
    console.warn('[BACKUP HISTORY] ⚠️ Error leyendo historial:', e);
    return [];
  }
}

/* ============ estado & helpers ============ */
let currentKeyHex = null;
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
function clearAttempts() { try { sessionStorage.removeItem(ATTEMPT_KEY); } catch(e) {} }
function getAttemptsCount() { try { return Number(sessionStorage.getItem(ATTEMPT_KEY) || 0); } catch(e) { return 0; } }
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
  // ✅ Transición suave: ocultar otras vistas primero
  $('#content').classList.add('hidden');
  $('#master').classList.add('hidden');
  
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
  console.log('[PERIODIC] hasRemote():', remoteAvailable);
  console.log('[PERIODIC] REMOTE_BASE_URL:', typeof REMOTE_BASE_URL !== 'undefined' ? REMOTE_BASE_URL : 'UNDEFINED');
  
  if (!remoteAvailable) {
    console.warn('[PERIODIC] ⚠️ No se puede iniciar: REMOTE_BASE_URL no disponible');
    return;
  }

  console.log('[PERIODIC] 🔄 Iniciando refresh AUTOMÁTICO cada', PERIODIC_REFRESH_INTERVAL_MS / 1000, 'segundos');
  console.log('[PERIODIC] 💡 Los cambios aparecerán AUTOMÁTICAMENTE sin refrescar');

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
        console.log('[PERIODIC] ⏸️ Pausado: usuario escribiendo en formulario');
        return;
      }

      // ✅ CORREGIDO: Si currentHex es null o MASTER_HASH, refrescar todos los cursos
      if (!currentHex || currentHex === MASTER_HASH) {
        const mergedMap = getMergedAccessHashMap();
        const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
        console.log('[PERIODIC] Total cursos a refrescar (base + personalizados):', hexes.length);

        const results = await Promise.allSettled(
          hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
            console.warn('[PERIODIC] Error refrescando', h.substring(0, 8), ':', e);
            return false;
          }))
        );
        const anyUpdated = results.some(r => r.status === 'fulfilled' && r.value === true);

        await refreshCustomCourses();

        // ✅ NO actualizar la vista automáticamente para no interrumpir al usuario
        // El botón amarillo le avisará que hay cambios, y puede sincronizar manualmente
        if (anyUpdated) {
          console.log('[PERIODIC] ✅ Cambios detectados (botón se pondrá amarillo)');
        }
        
        // ✅ Actualizar botón flotante (siempre, incluso cuando NO hay cambios)
        if (typeof window.updateSyncButtonState === 'function') {
          console.log('[PERIODIC-MASTER] 🔔 Actualizando botón:', anyUpdated ? 'AMARILLO (cambios)' : 'AZUL (sin cambios)');
          window.updateSyncButtonState(anyUpdated);
        } else {
          console.warn('[PERIODIC-MASTER] ⚠️ updateSyncButtonState no disponible');
        }
      } else if (currentHex) {
        const mergedMap = getMergedAccessHashMap();
        if (mergedMap[currentHex]) {
          const updated = await refreshFromRemoteSilent(currentHex).catch(e => {
            console.warn('[PERIODIC] Error refrescando archivos:', e);
            return false;
          });

          // ✅ NO actualizar la vista automáticamente para no interrumpir al usuario
          // El botón amarillo le avisará que hay cambios, y puede sincronizar manualmente
          if (updated) {
            console.log('[PERIODIC] ✅ Cambios detectados (botón se pondrá amarillo)');
          }
          
          // ✅ Actualizar botón flotante
          if (typeof window.updateSyncButtonState === 'function') {
            console.log('[PERIODIC-CURSO] 🔔 Actualizando botón:', updated ? 'AMARILLO (cambios)' : 'AZUL (sin cambios)');
            window.updateSyncButtonState(updated);
          } else {
            console.warn('[PERIODIC-CURSO] ⚠️ updateSyncButtonState no disponible');
          }
        } else {
          console.warn('[PERIODIC] ⚠️ Hex no encontrado en mergedMap:', currentHex.substring(0, 8));
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
    console.log('[PERIODIC] Deteniendo refresh periódico');
    clearInterval(periodicRefreshInterval);
    periodicRefreshInterval = null;
  }
}

function showContent() {
  // ✅ Transición suave: ocultar otras vistas primero
  $('#access').classList.add('hidden');
  $('#master').classList.add('hidden');
  
  // ✅ Mostrar content con transición
  const contentEl = $('#content');
  contentEl.classList.remove('hidden');
  // ✅ Forzar reflow para que la transición se active
  void contentEl.offsetWidth;
  
  // No iniciar refresh periódico aquí, se inicia cuando se renderiza el curso
  // ✅ Mostrar botón flotante cuando está autenticado
  const fabBtn = document.getElementById('btn-speed-refresh');
  if (fabBtn) fabBtn.classList.add('visible');
  // ✅ Configurar menú de ajustes para consultores
  setupSettingsMenuContent();
}
function showMaster() {
  // ✅ Transición suave: ocultar otras vistas primero
  $('#access').classList.add('hidden');
  $('#content').classList.add('hidden');
  
  // ✅ Mostrar master con transición
  const masterEl = $('#master');
  masterEl.classList.remove('hidden');
  // ✅ Forzar reflow para que la transición se active
  void masterEl.offsetWidth;
  // ❌ NO iniciar polling automático (el usuario sincroniza manualmente con el botón)
  // startPeriodicRefresh(MASTER_HASH);
  
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
        console.log('[SYNC] ⏭️ Saltando refresh inmediato: usuario escribiendo o editando');
        return;
      }
      
      console.log('[SYNC] Refresh inmediato adicional al mostrar master...');
      const hexes = Object.keys(ACCESS_HASH_MAP).filter(h => h !== MASTER_HASH);
      const results = await Promise.allSettled(
        hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
          console.warn('[SYNC] Error en refresh inmediato:', e);
          return false;
        }))
      );
      const anyUpdated = results.some(r => 
        r.status === 'fulfilled' && r.value === true
      );
      
      // ✅ NUEVO: También refrescar cursos personalizados
      await refreshCustomCourses();
      
      if (anyUpdated) {
        console.log('[SYNC] ✅ Cambios detectados en refresh inmediato, actualizando...');
        buildMasterGrid();
      }
    }, 500); // Esperar 500ms después de mostrar para no bloquear
  }
}

/* ============ loader ============ */
const loaderEl = document.getElementById('eduLoader');
const loaderBar = document.getElementById('loaderBar');
const loaderPercent = document.getElementById('loaderPercent');
function showLoader() { if (!loaderEl) return; loaderEl.classList.remove('hidden'); loaderEl.setAttribute('aria-hidden', 'false'); }
function hideLoader() { if (!loaderEl) return; loaderEl.classList.add('hidden'); loaderEl.setAttribute('aria-hidden', 'true'); }
const LOAD_DURATION_MS = 1600;
function runLoader(durationMs = LOAD_DURATION_MS) {
  return new Promise((resolve) => {
    if (!loaderBar || !loaderPercent) { resolve(); return; }
    showLoader();
    loaderBar.style.width = '0%';
    loaderPercent.textContent = '0%';
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const ease = t < 0.5 ? (2*t*t) : (-1 + (4-2*t)*t);
      const percent = Math.round(ease * 100);
      loaderBar.style.width = percent + '%';
      loaderPercent.textContent = percent + '%';
      if (t < 1) { requestAnimationFrame(frame); }
      else {
        loaderBar.style.width = '100%';
        loaderPercent.textContent = '100%';
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

  // ✅ Guardar hex globalmente para el botón de sincronización forzada
  window.currentCourseHex = keyHex;

  // ✅ FIREBASE: Inicializar listener en tiempo real
  if (typeof initFirestoreRealtime === 'function') {
    initFirestoreRealtime(keyHex);
  }

  // ✅ Mostrar clasificación del curso (badge en la parte superior)
  const courseType = data.type || 'curso';
  const typeLabels = {
    'curso': '📖 Curso',
    'diplomado': '🎓 Diplomado',
    'webinar': '💻 Webinar',
    'seminario': '📝 Seminario',
    'taller': '🔧 Taller'
  };
  const typeLabel = typeLabels[courseType] || '📖 Curso';
  
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
    typeBadge.textContent = typeLabel;
    
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
    
    console.log('[RENDER COURSE] ✅ Badge de clasificación agregado:', typeLabel);
  } else {
    console.warn('[RENDER COURSE] ⚠️ No se encontró el contenedor del título');
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
  
  // ✅ PREVENIR DUPLICADOS al renderizar: usar Set para identificar únicos por firebaseId o URL+Label
  const seen = new Set();
  const uniqueFiles = (files || []).filter(item => {
    const key = item.firebaseId || `${item.url}|||${item.label}`;
    if (seen.has(key)) {
      console.log('[RENDER] ⚠️ Duplicado filtrado al renderizar:', item.label);
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
        window.setCardImage(wrapper, `${data.card.img}?v=2`);
      }
    }
  } catch (e) { console.warn('No se pudo insertar la tarjeta:', e); }
  
  // ❌ NO iniciar polling automático (el usuario sincroniza manualmente con el botón)
  // startPeriodicRefresh(keyHex);
}

/* ============ render master ============ */
function buildMasterGrid() {
  // ✅ Iniciar medición de renderizado del grid
  const gridStart = startPerformanceMeasure('Renderizado del grid');
  
  const grid = $('#masterGrid');
  grid.innerHTML = '';

  const mergedMap = getMergedAccessHashMap();

  initFirebaseCustomCoursesRealtime();
  
  // ✅ Actualizar estadísticas (después de inicializar Firebase)
  updateMasterStats(mergedMap);

  // ✅ Paginación: solo si hay muchos cursos (más de 12)
  let coursesArray = Object.entries(mergedMap).filter(([hex]) => hex !== MASTER_HASH);
  
  // ✅ Si el usuario está autenticado con email, filtrar solo cursos permitidos
  // Si está autenticado con código master, mostrar todos los cursos
  const isEmailAuth = window.currentUserEmail && !currentKeyHex;
  if (isEmailAuth && window.allowedCoursesForUser) {
    coursesArray = coursesArray.filter(([hex]) => {
      return window.allowedCoursesForUser.includes(hex);
    });
    console.log('[MASTER] Filtrando cursos para email:', window.currentUserEmail, '- Cursos permitidos:', coursesArray.length);
  }
  
  // ✅ Aplicar filtro por tipo
  const filterType = $('#filterByType')?.value || 'all';
  if (filterType !== 'all') {
    coursesArray = coursesArray.filter(([hex, data]) => {
      const courseType = data?.type || 'curso';
      return courseType === filterType;
    });
  }
  
  // ✅ Aplicar ordenamiento
  const sortBy = $('#sortBy')?.value || 'title-asc';
  coursesArray.sort(([hexA, dataA], [hexB, dataB]) => {
    if (sortBy === 'title-asc') {
      return (dataA.title || '').localeCompare(dataB.title || '');
    } else if (sortBy === 'title-desc') {
      return (dataB.title || '').localeCompare(dataA.title || '');
    } else if (sortBy === 'type-asc') {
      const typeA = (dataA.type || 'curso').toLowerCase();
      const typeB = (dataB.type || 'curso').toLowerCase();
      return typeA.localeCompare(typeB);
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
  
  const COURSES_PER_PAGE = 12;
  const totalPages = Math.ceil(coursesArray.length / COURSES_PER_PAGE);
  
  let currentPage = 1;
  const pageKey = 'masterGridCurrentPage';
  try {
    const savedPage = sessionStorage.getItem(pageKey);
    if (savedPage) currentPage = parseInt(savedPage, 10) || 1;
  } catch (e) {}
  
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
      'curso': '📖 Curso',
      'diplomado': '🎓 Diplomado',
      'webinar': '💻 Webinar',
      'seminario': '📝 Seminario',
      'taller': '🔧 Taller'
    };
    const typeLabel = typeLabels[courseType] || '📖 Curso';
    
    const typeBadge = document.createElement('div');
    typeBadge.style.cssText = 'font-size: 11px; font-weight: 600; color: var(--accent); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;';
    typeBadge.textContent = typeLabel;
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
        codeDiv.textContent = `🔑 Código: ${codeToShow} 📋`;
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
        console.log('[SYNC] Iniciando refresh antes del loader...');
        await refreshFromRemoteSilent(hex).catch(e => {
          console.warn('[SYNC] Error en refresh:', e);
          return false;
        });
        console.log('[SYNC] ✅ Refresh completado, cerrando loader...');
      }
      
      // Ejecutar animación de loader ahora que ya tenemos los datos
      await runLoader();
      
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
      btnEmails.textContent = '📧 Correos';
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
      btnEditCourse.textContent = '✏️ Editar';
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
      btnDuplicate.textContent = '📋 Duplicar';
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
      btnDelete.textContent = '🗑️ Eliminar';
      btnDelete.setAttribute('aria-label', `Eliminar curso: ${data.title || 'Curso'}`);
      btnDelete.setAttribute('title', `Eliminar el curso "${data.title || 'Curso'}" (acción irreversible)`);
      btnDelete.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
      btnDelete.addEventListener('click', async () => {
        // ✅ Mostrar modal de confirmación elegante
        window.showDeleteConfirmModal(data.title, async () => {
          // ✅ Rate limiting: prevenir eliminaciones repetidas
          if (!checkRateLimit('eliminar curso')) {
            return;
          }
          
          // ✅ Obtener botón de confirmación y activar indicador de carga
          const confirmBtn = document.getElementById('deleteConfirmYes');
          let restoreButton = null;
          if (confirmBtn) {
            restoreButton = setButtonLoading(confirmBtn, 'Eliminando curso...', 'Curso eliminado');
          }
          
          console.log('[DELETE] Eliminando curso:', data.title);
          
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
              console.log('[DELETE] Firebase no disponible, usando refresh manual');
              await refreshCustomCourses().catch(e => {
                console.warn('[DELETE] Error refrescando cursos después de eliminar (fallback):', e);
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
            setTimeout(() => updateMasterStats(), 100);
            console.log('[DELETE] ✅ Curso eliminado exitosamente');
            
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

    // lista de archivos (editable con DnD)
    const list = document.createElement('div');
    list.className = 'filelist';
    const files = getFilesForHex(hex);
    (files || []).forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'file';
      row.draggable = true;
      row.dataset.index = String(idx);
      let host = '';
      try { host = new URL(item.url).hostname; } catch { host = ''; }
      const leftInfo = document.createElement('div');
      // ✅ Sanitizar para prevenir XSS
      const safeLabel = escapeHTML(item.label || '');
      const safeHost = escapeHTML(host);
      leftInfo.innerHTML = `<strong>${safeLabel}</strong><div class="meta">${safeHost}</div>`;

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
          const newLabel = editLabel.value.trim();
          const newUrl = editUrl.value.trim();
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
          console.log('[EDIT] ✏️ Actualizando vista inmediatamente');
          const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
          if (isMasterView) {
            buildMasterGrid();
          } else {
            renderCourse(hex);
          }
          
          // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
          remoteSaveFiles(hex, next).then(editOk => {
            if (editOk) {
              console.log('[EDIT] ✅ Guardado en remoto exitoso');
              // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
              refreshFromRemoteSilent(hex).catch(() => {});
            } else {
              console.warn('[EDIT] ⚠️ Error guardando en remoto');
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
              
              console.log('[REMOVE] 🔥 Eliminando de Firebase:', item.firebaseId);
              await window.eliminarLinkFirebase(hex, item.firebaseId);
              console.log('[REMOVE] ✅ Eliminado de Firebase');
              
              // ✅ CRÍTICO: Actualizar localStorage INMEDIATAMENTE
              const currentFiles = getFilesForHex(hex);
              const updatedFiles = currentFiles.filter(f => f.firebaseId !== item.firebaseId);
              saveFilesOverride(hex, updatedFiles);
              console.log('[REMOVE] 💾 localStorage actualizado:', currentFiles.length, '→', updatedFiles.length);
              
              // ✅ Actualizar Google Sheets (sincronización)
              // Si no quedan más links, eliminar el hex completamente de la hoja de overrides
              if (updatedFiles.length === 0) {
                console.log('[REMOVE] 🧹 No quedan más links, eliminando hex de la hoja de overrides');
                remoteDeleteFiles(hex).catch(e => {
                  console.warn('[REMOVE] ⚠️ Error eliminando hex de Google Sheets:', e);
                });
              } else {
                remoteSaveFiles(hex, updatedFiles).catch(e => {
                  console.warn('[REMOVE] ⚠️ Error actualizando Google Sheets:', e);
                });
              }
              
              // ✅ Desbloquear y re-renderizar inmediatamente
              userInteracting = false;
              const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
              if (isMasterView) {
                console.log('[REMOVE] ♻️ Re-renderizando Master');
                buildMasterGrid();
              } else {
                console.log('[REMOVE] ♻️ Re-renderizando Curso');
                renderCourse(hex);
              }
              
              return;
            } catch (error) {
              console.error('[REMOVE] ❌ Error eliminando de Firebase, usando método local:', error);
              userInteracting = false;
              // Continuar con método local si Firebase falla
            }
          }
          
          // ✅ FALLBACK: Método local si no tiene firebaseId o Firebase falló
          const next = files.slice();
          next.splice(idx, 1);
          saveFilesOverride(hex, next);
          
          // ✅ ACTUALIZAR VISTA INMEDIATAMENTE (sin esperar nada)
          console.log('[REMOVE] 🗑️ Eliminando archivo inmediatamente de la vista');
          const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
          if (isMasterView) {
            buildMasterGrid();
          } else {
            renderCourse(hex);
          }
          
          // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
          // Si no quedan más links, eliminar el hex completamente de la hoja de overrides
          if (next.length === 0) {
            console.log('[REMOVE] 🧹 No quedan más links, eliminando hex de la hoja de overrides');
            remoteDeleteFiles(hex).then(removeOk => {
              if (removeOk) {
                console.log('[REMOVE] ✅ Hex eliminado de la hoja de overrides');
              } else {
                console.warn('[REMOVE] ⚠️ Error eliminando hex de la hoja de overrides');
              }
            }).catch(e => {
              console.error('[REMOVE] ❌ Error eliminando hex de la hoja de overrides:', e);
            });
          } else {
            remoteSaveFiles(hex, next).then(removeOk => {
              if (removeOk) {
                console.log('[REMOVE] ✅ Guardado en remoto exitoso');
                // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
                refreshFromRemoteSilent(hex).catch(() => {});
              } else {
                console.warn('[REMOVE] ⚠️ Error guardando en remoto');
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

    // drag & drop reorder
    list.addEventListener('dragstart', (e) => {
      const el = e.target instanceof HTMLElement ? e.target.closest('.file') : null;
      if (!el) return;
      const idx = el.dataset.index;
      if (idx != null) { e.dataTransfer?.setData('text/plain', idx); }
    });
    list.addEventListener('dragover', (e) => { e.preventDefault(); });
    list.addEventListener('drop', async (e) => {
      e.preventDefault();
      const fromStr = e.dataTransfer?.getData('text/plain');
      const toEl = e.target instanceof HTMLElement ? e.target.closest('.file') : null;
      if (!fromStr || !toEl) return;
      const from = Number(fromStr);
      const to = Number(toEl.dataset.index || 0);
      if (Number.isNaN(from) || Number.isNaN(to) || from === to) return;
      const next = files.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      saveFilesOverride(hex, next);
      
      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE (sin esperar nada)
      console.log('[REORDER] 🔄 Reordenando inmediatamente en la vista');
      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      if (isMasterView) {
        buildMasterGrid();
      } else {
        renderCourse(hex);
      }
      
      // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
      remoteSaveFiles(hex, next).then(reorderOk => {
        if (reorderOk) {
          console.log('[REORDER] ✅ Guardado en remoto exitoso');
          // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
          refreshFromRemoteSilent(hex).catch(() => {});
        } else {
          console.warn('[REORDER] ⚠️ Error guardando en remoto');
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
      const labelVal = (inputLabel.value || '').trim();
      const urlVal = (inputUrl.value || '').trim();
      
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
          await window.agregarLinkFirebase(hex, labelVal, urlVal);
          
          // Limpiar inputs
          inputLabel.value = '';
          inputUrl.value = '';
          
          console.log('[ADD] ✅ Link agregado a Firebase, sincronización automática activa');
          
          // ✅ También guardar en Google Sheets como backup
          // Obtener los archivos actuales y agregar el nuevo link para guardar en Sheets
          const current = getFilesForHex(hex);
          const newLink = { label: labelVal, url: urlVal };
          const next = current.concat(newLink);
          console.log('[ADD] 💾 Guardando en Google Sheets como backup:', next.length, 'links');
          remoteSaveFiles(hex, next).catch(e => {
            console.warn('[ADD] ⚠️ No se pudo guardar en Google Sheets (backup):', e);
          });
          
          return; // Salir, Firebase se encarga de actualizar la vista
          
        } catch (error) {
          console.error('[ADD] ❌ Error con Firebase, usando método local:', error);
          // Continuar con método local si Firebase falla
        }
      }
      
      // ✅ FALLBACK: Método local si Firebase no está disponible
      console.log('[ADD] Usando método local (Firebase no disponible)');
      const current = getFilesForHex(hex);
      console.log('[ADD] Links actuales:', current.length);
      const next = current.concat({ label: labelVal, url: urlVal });
      console.log('[ADD] Links después de agregar:', next.length);
      
      // Limpiar inputs
      inputLabel.value = '';
      inputUrl.value = '';
      
      saveFilesOverride(hex, next);
      
      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE
      console.log('[ADD] ➕ Agregando link inmediatamente a la vista');
      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      
      if (isMasterView) {
        buildMasterGrid();
        console.log('[ADD] ✅ Vista master actualizada');
      } else {
        renderCourse(hex);
        console.log('[ADD] ✅ Vista de curso actualizada');
      }
      
      // ✅ GUARDAR EN REMOTO (Google Sheets)
      remoteSaveFiles(hex, next).then(saveResult => {
        if (saveResult) {
          console.log('[ADD] ✅ Guardado en remoto - POST exitoso');
          setTimeout(() => {
            refreshFromRemoteSilent(hex).then(() => {
              console.log('[ADD] ✅ SINCRONIZACIÓN CONFIRMADA');
            }).catch(() => {
              console.log('[ADD] ⚠️ Error en sincronización post-guardado');
            });
          }, 500);
        } else {
          console.warn('[ADD] ⚠️ No se pudo guardar en remoto');
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
      console.log('[RESTORE] ♻️ Restaurando vista inmediatamente');
      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      if (isMasterView) {
        buildMasterGrid();
      } else {
        renderCourse(hex);
      }
      
      // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
      remoteSaveFiles(hex, getFilesForHex(hex)).then(restoreOk => {
        if (restoreOk) {
          console.log('[RESTORE] ✅ Guardado en remoto exitoso');
          // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
          refreshFromRemoteSilent(hex).catch(() => {});
        } else {
          console.warn('[RESTORE] ⚠️ Error guardando en remoto');
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
      const imgUrl = `${data.card.img}?v=2`;
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
        try { sessionStorage.setItem(pageKey, String(currentPage)); } catch (e) {}
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
        try { sessionStorage.setItem(pageKey, String(currentPage)); } catch (e) {}
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
  try { ensureMasterTools(); } catch(e) {}
}

// ✅ Función para actualizar estadísticas en la vista maestra
function updateMasterStats(mergedMap) {
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
  
  Object.keys(mergedMap).forEach(hex => {
    if (hex !== MASTER_HASH) {
      const course = mergedMap[hex];
      const type = course?.type || 'curso'; // Por defecto 'curso' si no tiene tipo
      if (typeCounts.hasOwnProperty(type)) {
        typeCounts[type]++;
      } else {
        // Si hay un tipo desconocido, contarlo como curso
        typeCounts.curso++;
      }
    }
  });
  
  // ✅ Actualizar total
  const statsCourses = $('#statsCoursesCount');
  if (statsCourses) {
    statsCourses.textContent = coursesCount;
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
  
  console.log('[STATS] 📊 Total:', coursesCount, '| Por tipo:', typeCounts);
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
    console.log('[HISTORY] 📝 Registrado:', action, data);
  } catch (e) {
    console.warn('[HISTORY] ⚠️ Error guardando historial:', e);
  }
}

// ✅ Función para obtener historial de cambios (últimos N cambios)
function getChangeHistory(limit = 20) {
  try {
    const history = JSON.parse(localStorage.getItem('changeHistory') || '[]');
    return history.slice(0, limit);
  } catch (e) {
    console.warn('[HISTORY] ⚠️ Error leyendo historial:', e);
    return [];
  }
}

async function refreshFromRemoteSilent(hex){
  try {
    // ✅ FIREBASE ES LA ÚNICA FUENTE DE VERDAD - No consultar Google Sheets si Firebase está disponible
    const db = getFirestoreDB();
    if (db) {
      console.log('[REFRESH] Firebase maneja links en tiempo real, sin usar Google Sheets');
      // Firebase ya tiene listeners activos que actualizan automáticamente
      // No necesitamos consultar Google Sheets
      return false;
    }
    
    console.log('[REFRESH] 🔄 Consultando remoto para hex:', hex.substring(0, 8));
    // ✅ Usar JSONP directamente (no fetch que puede fallar)
    const remote = await remoteGetFilesJSONP(hex);
    
    if (!remote) {
      console.log('[REFRESH] ⚠️ Sin respuesta del remoto');
      return false;
    }
    
    if (!Array.isArray(remote)) {
      console.warn('[REFRESH] Datos remotos no son un array:', remote);
      return false;
    }
    
    console.log('[REFRESH] 📥 Remoto respondió:', remote.length, 'archivos');
    
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
        console.log('[REFRESH] 🔄 CAMBIOS DETECTADOS');
        console.log('[REFRESH] Remoto:', remote.length, 'archivos | Local:', current.length, 'archivos');
        console.log('[REFRESH] 📥 Aplicando', remote.length, 'archivos desde remoto');
        saveFilesOverride(hex, remote);
        console.log('[REFRESH] ✅ Sincronización completada con cambios');
        
        // ✅ Notificación de sincronización
        const mergedMap = getMergedAccessHashMap();
        const courseData = mergedMap[hex];
        if (typeof window.showToast === 'function' && courseData) {
          window.showToast('success', 'Sincronizado', `"${courseData.title}" actualizado (${remote.length} archivos)`);
        }
        return true;
      } else {
        // console.log('[REFRESH] ✅ Sin cambios (datos idénticos)');
        return false;
      }
    }
    
    // ✅ Remoto vacío → Verificar si debe usar base o limpiar
    if (remote.length === 0 && current.length > 0) {
      if (base.length === 0) {
        console.log('[REFRESH] 🧹 Remoto vacío y sin base, limpiando local');
        clearFilesOverride(hex);
        return true;
      }
      console.log('[REFRESH] 🔄 Usando datos base (', base.length, 'archivos)');
      clearFilesOverride(hex);
      return true;
    }
    
    // console.log('[REFRESH] ✅ Sin datos remotos ni locales');
    return false;
  } catch (e) { 
    console.error('[REFRESH] Error en refresh silencioso:', e);
    return false;
  }
}

function setupMasterSearch(){
  const input = $('#masterSearch');
  const clear = $('#masterSearchClear');
  const grid  = $('#masterGrid');
  if (!input || !grid) return;

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

  // ✅ Función para obtener todas las sugerencias disponibles
  function getSuggestions() {
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
    
    return Array.from(suggestions);
  }

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

  function applyFilter(){
    const q = (input.value || '').trim().toLowerCase();
    const cards = grid.querySelectorAll('.master-card');
    
    if (!q){
      cards.forEach(c => c.style.display = '');
      removeHighlights();
      return;
    }
    
    // ✅ Búsqueda mejorada: incluye título, tag, y clasificación
    cards.forEach(c => {
      const t = (c.dataset.title || '').toLowerCase();
      const tg = (c.dataset.tag || '').toLowerCase();
      const type = (c.dataset.type || '').toLowerCase();
      
      // Buscar en título, tag, o tipo
      const match = t.includes(q) || tg.includes(q) || type.includes(q);
      c.style.display = match ? '' : 'none';
      
      // ✅ Resaltar texto coincidente en tarjetas visibles
      if (match) {
        // Buscar elementos de texto dentro de la tarjeta
        const rightSection = c.querySelector('.right');
        if (rightSection) {
          // Buscar en título (primer div con texto)
          const titleElements = rightSection.querySelectorAll('div > div:first-child');
          titleElements.forEach(el => {
            if (el.textContent && !el.querySelector('.search-highlight')) {
              highlightTextInElement(el, q);
            }
          });
          
          // Buscar en meta
          const metaElements = rightSection.querySelectorAll('.meta');
          metaElements.forEach(el => {
            if (el.textContent && !el.querySelector('.search-highlight')) {
              highlightTextInElement(el, q);
            }
          });
        }
      }
    });
  }

  // ✅ Event listeners
  let selectedIndex = -1;
  
  // ✅ Debounce para optimizar búsqueda (300ms)
  const debouncedFilter = debounce(() => {
    applyFilter();
  }, 300);
  
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

  // ✅ Event listeners para filtro y ordenamiento
  const filterByType = $('#filterByType');
  const sortBy = $('#sortBy');
  
  if (filterByType) {
    filterByType.addEventListener('change', () => {
      // Resetear página a 1 cuando cambia el filtro
      try { sessionStorage.setItem('masterGridCurrentPage', '1'); } catch (e) {}
      buildMasterGrid();
      // Re-aplicar búsqueda si hay texto
      if (input.value.trim()) {
        setTimeout(() => {
          applyFilter();
          showAutocomplete(input.value.trim());
        }, 100);
      }
    });
  }
  
  if (sortBy) {
    sortBy.addEventListener('change', () => {
      buildMasterGrid();
      // Re-aplicar búsqueda si hay texto
      if (input.value.trim()) {
        setTimeout(() => {
          applyFilter();
          showAutocomplete(input.value.trim());
        }, 100);
      }
    });
  }
}

/* ===================== ATAJOS DE TECLADO ===================== */

/**
 * ✅ Configurar atajos de teclado globales
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Solo si estamos en Vista Master
    const masterView = $('#master');
    if (masterView && !masterView.classList.contains('hidden')) {
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
      }
    }

    // Escape: Cerrar modales (funciona en cualquier vista)
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        openModal.classList.remove('show');
      }
    }
  });

  console.log('[SHORTCUTS] ✅ Atajos de teclado configurados');
}

// Llamar después de que la página cargue
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupKeyboardShortcuts);
} else {
  setupKeyboardShortcuts();
}

/* ============ login ============ */
async function tryLoginByCode(code) {
  const msg = $('#msg');
  msg.textContent = 'Verificando…';
  msg.classList.remove('error');

  if (!code || String(code).trim().length === 0) {
    msg.textContent = 'Ingrese un código válido.';
    msg.classList.add('error');
    return false;
  }

  try {
    const hex = await sha256Hex(code);

    // ✅ Google Analytics: Tracking de intento de login
    if (typeof gtag !== 'undefined') {
      gtag('event', 'login_attempt', {
        'event_category': 'authentication',
        'event_label': 'attempt'
      });
    }

    // master
    if (hex === MASTER_HASH) {
      // ✅ Refresh en background (no bloquear login) con timeout corto
      if (hasRemote()) {
        console.log('[SYNC] Iniciando refresh de todos los cursos en background...');
        const mergedMap = getMergedAccessHashMap();
        const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
        console.log('[SYNC] Total de cursos a refrescar:', hexes.length);
        
        // Iniciar refresh en background (no await, con timeout global)
        Promise.race([
          Promise.allSettled(hexes.map((h, index) => {
            const isLast = index === hexes.length - 1;
            const label = isLast ? `[ÚLTIMO CURSO]` : '';
            console.log(`${label} [SYNC] Refrescando curso ${index + 1}/${hexes.length}: ${h.substring(0, 8)}...`);
            return refreshFromRemoteSilent(h)
              .then(result => {
                if (isLast) {
                  console.log(`[ÚLTIMO CURSO] ✅ Refresh completado para ${h.substring(0, 8)}, resultado:`, result);
                }
                return result;
              })
              .catch(e => {
                console.error(`[SYNC] ❌ Error refrescando curso ${h.substring(0, 8)}:`, e);
                return false;
              });
          })),
          new Promise(resolve => setTimeout(() => {
            console.log('[SYNC] Timeout refresh global, continuando...');
            resolve({});
          }, 2000)) // Timeout de 2 segundos máximo para todos los cursos
        ])
          .then(results => {
            if (Array.isArray(results)) {
              const successful = results.filter(r => r.status === 'fulfilled').length;
              const failed = results.filter(r => r.status === 'rejected').length;
              console.log(`[SYNC] Refresh completado: ${successful} exitosos, ${failed} fallidos`);
            }
          })
          .catch(e => {
            console.warn('[SYNC] Error general en refresh:', e);
          });
        
        console.log('[SYNC] Refresh iniciado en background, continuando con login...');
      }
      
      // Ejecutar animación de loader ahora que ya tenemos los datos
      try { 
        await runLoader(); 
      } catch (e) {}
      
      clearAttempts();
      setQueryParam('code', btoa(code));
      
      // ✅ Cargar cursos remotos en background (no bloquear)
      refreshCustomCourses().catch(e => {
        console.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
      });
      
      buildMasterGrid();
      setupMasterSearch();
      $('#year_master').textContent = new Date().getFullYear();
      showMaster();
      
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
      console.log('[LOGIN] Cargando cursos personalizados antes de validar...');
      await refreshCustomCourses().catch(e => {
        console.warn('[LOGIN] Error cargando cursos personalizados (continuando):', e);
      });
    }
    
    // ✅ Obtener mergedMap DESPUÉS de cargar cursos personalizados
    const mergedMap = getMergedAccessHashMap();
    console.log('[LOGIN] Validando código, cursos disponibles:', Object.keys(mergedMap).length);
    console.log('[LOGIN] Hex a buscar:', hex.substring(0, 8) + '...');
    
    if (mergedMap && mergedMap[hex]) {
      console.log('[LOGIN] ✅ Código válido encontrado en hashmap');
      // Mostrar loader inmediatamente
      showLoader();
      
      // ✅ CRÍTICO: Esperar refresh ANTES de renderizar (igual que cursos base desde master)
      // Esto asegura que los archivos estén actualizados cuando se muestra el curso
      if (hasRemote()) {
        console.log('[SYNC] Iniciando refresh antes de mostrar curso...');
        await refreshFromRemoteSilent(hex).catch(e => {
          console.warn('[SYNC] Error en refresh:', e);
          return false;
        });
        console.log('[SYNC] ✅ Refresh completado, renderizando curso...');
      }
      
      // Ejecutar animación de loader después del refresh
      try { 
        await runLoader(); 
      } catch (e) {}
      
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
      console.warn('[LOGIN] ❌ Código no encontrado en hashmap');
      console.warn('[LOGIN] Cursos disponibles:', Object.keys(mergedMap || {}));
      console.warn('[LOGIN] Hex buscado:', hex.substring(0, 8) + '...');
      
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
    tabCode.classList.add('active');
    tabAccount.classList.remove('active');
    formCode.classList.remove('hidden');
    formAccount.classList.add('hidden');
  } else {
    tabCode.classList.remove('active');
    tabAccount.classList.add('active');
    formCode.classList.add('hidden');
    formAccount.classList.remove('hidden');
    // Mostrar formulario de login por defecto
    showLoginForm();
  }
}

// ✅ Función para mostrar formulario de login (solo Google ahora)
function showLoginForm() {
  const formLogin = $('#form-login');
  if (formLogin) {
    formLogin.classList.remove('hidden');
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
    console.log('[AUTH] 💬 Mensaje mostrado:', elementId, message);
  } else {
    console.warn('[AUTH] ⚠️ No se encontró el elemento para mensaje:', elementId);
  }
}

// ✅ Funciones de validación de campos eliminadas (ya no se usan con Google Sign-In)

// ✅ Función para login con Google
async function tryLoginByGoogle() {
  const msgEl = $('#msg-auth');
  showAuthMessage('msg-auth', 'Iniciando sesión con Google…', false);
  
  try {
    if (!window.firebaseAuth) {
      showAuthMessage('msg-auth', 'Firebase Authentication no está disponible. Por favor, use el acceso por código.', true);
      return false;
    }

    // ✅ Crear proveedor de Google
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // ✅ Opcional: Solicitar permisos adicionales
    // provider.addScope('email');
    // provider.addScope('profile');
    
    console.log('[AUTH] 🔄 Iniciando popup de Google...');
    
    // ✅ Iniciar sesión con popup
    const result = await window.firebaseAuth.signInWithPopup(provider);
    const user = result.user;
    
    const userEmail = user.email.toLowerCase().trim();
    console.log('[AUTH] ✅ Login con Google exitoso:', userEmail);
    console.log('[AUTH] Usuario:', user.displayName);
    console.log('[AUTH] Foto:', user.photoURL);
    
    // ✅ OBTENER CURSOS PERMITIDOS PARA ESTE CORREO
    showAuthMessage('msg-auth', 'Verificando cursos disponibles…', false);
    const allowedCourses = await getCoursesForEmail(userEmail);
    
    console.log('[AUTH] Cursos permitidos para', userEmail, ':', allowedCourses.length);
    
    // ✅ Guardar correo del usuario en una variable global para usar después
    window.currentUserEmail = userEmail;
    
    // ✅ Google Analytics: Tracking de login exitoso
    if (typeof gtag !== 'undefined') {
      gtag('event', 'login_success_google', {
        'event_category': 'authentication',
        'event_label': 'google',
        'value': allowedCourses.length
      });
    }
    
    // ✅ Si tiene acceso a cursos, mostrar vista master filtrada
    // Si no tiene acceso a ningún curso, mostrar mensaje
    if (allowedCourses.length === 0) {
      showAuthMessage('msg-auth', 'No tienes acceso a ningún curso. Contacta al administrador para solicitar acceso.', true);
      // No cerrar sesión, permitir que el usuario vea el mensaje
      return false;
    }
    
    // ✅ Mostrar vista master con cursos filtrados
    await handleSuccessfulAuthWithEmail(userEmail, allowedCourses);
    
    showAuthMessage('msg-auth', `¡Bienvenido! Tienes acceso a ${allowedCourses.length} curso(s).`, false);
    return true;
    
  } catch (error) {
    console.error('[AUTH] ❌ Error en login con Google:', error);
    console.error('[AUTH] Código de error:', error.code);
    console.error('[AUTH] Mensaje de error:', error.message);
    
    let errorMessage = 'Error al iniciar sesión con Google.';
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'La ventana de Google se cerró. Intente nuevamente.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'La ventana emergente fue bloqueada. Permita ventanas emergentes para este sitio.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Solo se puede abrir una ventana de inicio de sesión a la vez.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'Ya existe una cuenta con este correo usando otro método de autenticación.';
    } else {
      errorMessage = `Error: ${error.message || 'No se pudo iniciar sesión con Google.'}`;
    }
    
    showAuthMessage('msg-auth', errorMessage, true);
    
    // ✅ Google Analytics: Tracking de error
    if (typeof gtag !== 'undefined') {
      gtag('event', 'login_error', {
        'event_category': 'authentication',
        'event_label': 'google',
        'value': error.code
      });
    }
    
    return false;
  }
}

// ✅ Funciones de registro y recuperación eliminadas (ya no se usan con Google Sign-In)
// Los usuarios se registran automáticamente al iniciar sesión con Google por primera vez
// Los usuarios pueden recuperar su contraseña directamente desde Google

/* ============ Gestión de Correos Permitidos por Curso ============ */

// ✅ Constantes para gestión de correos permitidos por curso
const COURSE_EMAILS_PATH = 'courseEmails';

// ✅ Normalizar email para usar como key en Firebase
function normalizeEmailKey(email) {
  return email.toLowerCase().trim().replace(/\./g, '_');
}

// ✅ Verificar si un correo tiene acceso a un curso específico
async function checkEmailAllowedForCourse(email, courseHex) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      console.warn('[AUTH] Firebase no disponible, permitiendo acceso');
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
    if (!email || !email.includes('@')) {
      throw new Error('Correo inválido');
    }
    
    if (!courseHex) {
      throw new Error('Hex de curso inválido');
    }
    
    const db = getFirebaseDB();
    if (!db) {
      throw new Error('Firebase no disponible');
    }
    
    const emailKey = normalizeEmailKey(email);
    
    // Obtener usuario actual (si está autenticado)
    const currentUser = window.firebaseAuth?.currentUser;
    const addedBy = currentUser?.email || 'master';
    
    const emailData = {
      email: email.toLowerCase().trim(),
      addedBy: addedBy,
      addedAt: new Date().toISOString(),
      active: true
    };
    
    await db.ref(`${COURSE_EMAILS_PATH}/${courseHex}/${emailKey}`).set(emailData);
    console.log('[AUTH] ✅ Correo agregado al curso:', email, courseHex.substring(0, 8));
    
    return true;
  } catch (error) {
    console.error('[AUTH] Error agregando correo al curso:', error);
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
    console.log('[AUTH] ✅ Correo eliminado del curso:', email, courseHex.substring(0, 8));
    
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

// ✅ Obtener cursos a los que un correo tiene acceso
async function getCoursesForEmail(email) {
  try {
    const db = getFirebaseDB();
    if (!db) {
      return [];
    }
    
    const courseEmailsRef = db.ref(COURSE_EMAILS_PATH);
    const snapshot = await courseEmailsRef.once('value');
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const emailKey = normalizeEmailKey(email);
    const allowedCourses = [];
    
    snapshot.forEach((courseSnapshot) => {
      const courseHex = courseSnapshot.key;
      const emailData = courseSnapshot.child(emailKey).val();
      
      if (emailData && emailData.active !== false) {
        allowedCourses.push(courseHex);
      }
    });
    
    return allowedCourses;
  } catch (error) {
    console.error('[AUTH] Error obteniendo cursos para correo:', error);
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
    title.textContent = `📧 Correos Permitidos: ${courseTitle}`;
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
  if (!currentCourseEmailsHex) {
    console.error('[AUTH] No hay curso seleccionado');
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
  
  const email = input.value.trim();
  
  // Validar formato básico de email
  if (!email.includes('@') || !email.includes('.')) {
    if (msgEl) {
      msgEl.textContent = 'Por favor, ingrese un correo electrónico válido.';
      msgEl.classList.add('error');
    }
    return;
  }
  
  try {
    // Verificar si ya existe
    const existingEmails = await getCourseAllowedEmails(currentCourseEmailsHex);
    if (existingEmails.some(e => e.email.toLowerCase() === email.toLowerCase())) {
      if (msgEl) {
        msgEl.textContent = `El correo "${email}" ya está en la lista.`;
        msgEl.classList.add('error');
      }
      return;
    }
    
    await addEmailToCourse(email, currentCourseEmailsHex);
    input.value = '';
    if (msgEl) {
      msgEl.textContent = `✅ Correo "${email}" agregado exitosamente.`;
      msgEl.classList.remove('error');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Correo agregado', `"${email}" ahora tiene acceso a este curso`, 'success');
    }
    await renderCourseEmailsList(currentCourseEmailsHex);
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
      if (msgEl) msgEl.textContent = '';
    }, 3000);
  } catch (error) {
    if (msgEl) {
      msgEl.textContent = `❌ Error: ${error.message || 'No se pudo agregar el correo.'}`;
      msgEl.classList.add('error');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('Error', `No se pudo agregar: ${error.message}`, 'error');
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

// ✅ Función para manejar autenticación exitosa con email (mostrar solo cursos permitidos)
async function handleSuccessfulAuthWithEmail(userEmail, allowedCourses) {
  console.log('[AUTH] ✅ Mostrando cursos permitidos para:', userEmail);
  
  // Guardar cursos permitidos en variable global para filtrar
  window.allowedCoursesForUser = allowedCourses;
  
  // ✅ Refresh en background (no bloquear login)
  if (hasRemote()) {
    console.log('[SYNC] Iniciando refresh de cursos permitidos en background...');
    Promise.allSettled(allowedCourses.map(h => refreshFromRemoteSilent(h).catch(e => {
      console.warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
      return false;
    }))).then(() => {
      console.log('[SYNC] ✅ Refresh completado');
    });
  }
  
  try { 
    await runLoader(); 
  } catch (e) {}
  
  clearAttempts();
  
  refreshCustomCourses().catch(e => {
    console.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
  });
  
  // ✅ Construir grid master filtrado por cursos permitidos
  buildMasterGrid();
  setupMasterSearch();
  $('#year_master').textContent = new Date().getFullYear();
  showMaster();
}

// ✅ Función para logout de Firebase
async function logoutFirebase() {
  try {
    if (window.firebaseAuth) {
      await window.firebaseAuth.signOut();
      console.log('[AUTH] ✅ Logout exitoso');
    }
  } catch (error) {
    console.error('[AUTH] ❌ Error en logout:', error);
  }
}

// ✅ Función compartida para manejar autenticación exitosa (código o Google)
async function handleSuccessfulAuth(hex, method = 'code') {
  console.log('[AUTH] ✅ Autenticación exitosa por:', method);
  
  // Si es master, mostrar vista master
  if (hex === MASTER_HASH) {
    // ✅ Refresh en background (no bloquear login)
    if (hasRemote()) {
      console.log('[SYNC] Iniciando refresh de todos los cursos en background...');
      const mergedMap = getMergedAccessHashMap();
      const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
      console.log('[SYNC] Total de cursos a refrescar:', hexes.length);
      
      Promise.allSettled(hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
        console.warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
        return false;
      }))).then(() => {
        console.log('[SYNC] ✅ Refresh completado');
      });
    }
    
    try { 
      await runLoader(); 
    } catch (e) {}
    
    clearAttempts();
    if (method === 'code') {
      const code = $('#code').value;
      if (code) setQueryParam('code', btoa(code));
    }
    
    refreshCustomCourses().catch(e => {
      console.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
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
        console.warn('[SYNC] Error en refresh:', e);
      });
    }
    
    try { 
      await runLoader(); 
    } catch (e) {}
    
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
    console.log('[AUTH] Firebase Auth no disponible, omitiendo listener de estado');
    return;
  }

  window.firebaseAuth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log('[AUTH] ✅ Usuario autenticado:', user.email);
      // Si el usuario está autenticado y no hay código en la URL y no estamos ya en master, dar acceso master
      const urlParams = new URLSearchParams(window.location.search);
      const masterEl = document.getElementById('master');
      const isInMaster = currentKeyHex === MASTER_HASH || (masterEl && !masterEl.classList.contains('hidden'));
      if (!urlParams.has('code') && !isInMaster) {
        await handleSuccessfulAuth(MASTER_HASH, 'google');
      }
    } else {
      console.log('[AUTH] Usuario no autenticado');
      // Si el usuario cierra sesión, volver a la pantalla de acceso
      if (currentKeyHex === MASTER_HASH) {
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
$('#tab-code').addEventListener('click', () => switchAuthTab('code'));
$('#tab-account').addEventListener('click', () => switchAuthTab('account'));

// ✅ Event listener para botón de Google Sign-In
const btnLoginGoogle = $('#btn-login-google');
if (btnLoginGoogle) {
  btnLoginGoogle.addEventListener('click', () => {
    tryLoginByGoogle();
  });
} else {
  console.warn('[AUTH] No se encontró el botón btn-login-google');
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
  inputCourseEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCourseEmailUI();
    }
  });
}

// ✅ Integrar logout de Firebase con logout existente
$('#btn-logout').addEventListener('click', async () => {
  currentKeyHex = null;
  setQueryParam('code', null);
  await logoutFirebase();
  showAccess();
});

// ✅ Integrar logout de Firebase con logout del master
$('#btn-master-exit').addEventListener('click', async () => {
  setQueryParam('code', null);
  await logoutFirebase();
  showAccess();
});

// ✅ FUNCIÓN GLOBAL: Ver qué hay guardado en localStorage
window.verDatosGuardados = function() {
  console.log('==========================================');
  console.log('📦 DATOS EN LOCALSTORAGE:');
  console.log('==========================================');
  
  const keys = Object.keys(localStorage);
  const fileKeys = keys.filter(k => k.startsWith(FILES_STORAGE_PREFIX));
  
  console.log('Total archivos guardados:', fileKeys.length);
  
  fileKeys.forEach(key => {
    const hex = key.replace(FILES_STORAGE_PREFIX, '');
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log('\n---');
      console.log('Hex:', hex.substring(0, 10) + '...');
      console.log('Archivos:', data.length);
      data.forEach((file, idx) => {
        console.log(`  ${idx + 1}. ${file.label}`);
      });
    } catch (e) {
      console.error('Error leyendo:', key);
    }
  });
  
  console.log('\n==========================================');
  return fileKeys.length;
};

// ✅ FUNCIÓN GLOBAL: Forzar sincronización desde servidor (SIN borrar localStorage)
window.forzarSincronizacion = async function() {
  console.log('[SYNC FORCE] 🔄 Forzando sincronización desde servidor...');
  
  try {
    // Detectar en qué vista estamos
    const isMasterView = !$('#master').classList.contains('hidden');
    const isContentView = !$('#content').classList.contains('hidden');
    
    if (isMasterView) {
      console.log('[SYNC FORCE] 📋 Vista Maestra detectada - Sincronizando todos los cursos...');
      
      // Refrescar cursos personalizados
      await refreshCustomCourses().catch(e => {
        console.warn('[SYNC FORCE] Error refrescando cursos:', e);
      });
      
      // Refrescar todos los archivos de cada curso
      const mergedMap = getMergedAccessHashMap();
      const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
      
      console.log('[SYNC FORCE] Total cursos a sincronizar:', hexes.length);
      
      const results = await Promise.allSettled(
        hexes.map(h => refreshFromRemoteSilent(h))
      );
      
      const updated = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      console.log('[SYNC FORCE] ✅ Sincronizados', updated, 'cursos');
      
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
      console.log('[SYNC FORCE] 📄 Vista de curso detectada - Sincronizando curso actual...');
      
      // Obtener el hex del curso actual
      const currentHex = window.currentCourseHex; // Necesitamos guardarlo globalmente
      
      if (currentHex) {
        const updated = await refreshFromRemoteSilent(currentHex);
        
        if (updated) {
          console.log('[SYNC FORCE] ✅ Curso sincronizado, re-renderizando...');
          renderCourse(currentHex);
          // ✅ Mostrar modal de éxito (sin alert)
          if (typeof window.showSuccessModal === 'function') {
            window.showSuccessModal(
              '¡Sincronización Exitosa!',
              'Los recursos se han actualizado correctamente desde el servidor.'
            );
          }
        } else {
          console.log('[SYNC FORCE] ℹ️ No hay cambios nuevos');
          // ✅ Mostrar modal informativo (sin alert)
          if (typeof window.showSuccessModal === 'function') {
            window.showSuccessModal(
              'Sin Cambios',
              'Ya estás viendo la última versión disponible.'
            );
          }
        }
      } else {
        console.warn('[SYNC FORCE] ⚠️ No se detectó hex del curso actual');
        // ✅ Mostrar modal de advertencia (sin alert)
        if (typeof window.showSuccessModal === 'function') {
          window.showSuccessModal(
            'Error',
            'No se pudo identificar el curso actual.'
          );
        }
      }
      
    } else {
      console.log('[SYNC FORCE] ℹ️ No hay vista activa para sincronizar');
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
window.limpiarTodoYRecargar = async function() {
  console.log('[CLEAN] 🧹 LIMPIANDO TODO...');
  
  // 1. Limpiar localStorage de archivos
  const filesCleared = clearAllFilesOverrides();
  console.log('[CLEAN] 🧹 Limpiados', filesCleared, 'archivos de localStorage');
  
  // 2. Limpiar caché del navegador
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        console.log('[CLEAN] 🧹 Eliminando caché:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }
  
  // 3. Desregistrar Service Worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(reg => {
        console.log('[CLEAN] 🧹 Desregistrando Service Worker');
        return reg.unregister();
      })
    );
  }
  
  console.log('[CLEAN] ✅ TODO LIMPIADO. Recargando...');
  alert('✅ TODO limpiado. Solo verás datos desde Google Sheets.');
  
  // 4. Recargar página
  setTimeout(() => {
    location.reload(true);
  }, 500);
};

/* ============ init ============ */
(async function init(){
  // ✅ Iniciar medición de tiempo total de inicialización
  const initStart = startPerformanceMeasure('Inicialización total');
  
  // ✅ Inicializar tema (claro/oscuro) ANTES de cualquier renderizado
  initTheme();
  
  // ✅ NO limpiar archivos al inicio - dejar que la sincronización automática lo maneje
  console.log('[INIT] 🚀 Iniciando plataforma...');
  console.log('[INIT] 📦 Archivos locales disponibles:', Object.keys(localStorage).filter(k => k.startsWith(FILES_STORAGE_PREFIX)).length);
  console.log('[INIT] 🔄 La sincronización automática actualizará los datos cada 1.2s');
  
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
        if (ok) { try { $('#code').value = decoded; } catch(e) {} return; }
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
      console.warn('Parámetro code inválido', e); 
    }
  }
  showAccess();
  maybeShowAttemptsWarning();
  
  // ✅ Cargar cursos remotos (no bloquear con await para no demorar carga)
  loadRemoteCoursesOnInit();
  
  // ❌ NO iniciar polling automático para no interrumpir al usuario
  // El botón manual de sincronización será usado cuando el usuario quiera
  console.log('[INIT] ✅ Plataforma lista (sin polling automático)');
  
  // ✅ Finalizar medición de inicialización
  endPerformanceMeasure('Inicialización total', initStart);
})();

/* ============ Modal agregar curso ============ */
let setupAddCourseModalDone = false;

function setupAddCourseModal() {
  if (setupAddCourseModalDone) {
    console.log('[SETUP] Ya configurado, saltando...');
    return;
  }
  setupAddCourseModalDone = true;
  
  const modalAddCourse = $('#modalAddCourse');
  const modalClose = $('#modalAddCourseClose');
  const btnAddCourse = $('#btn-add-course');
  const formAddCourse = $('#formAddCourse');
  const inputCourseAccent = $('#inputCourseAccent');
  const inputCourseAccentHex = $('#inputCourseAccentHex');

  console.log('[SETUP] Elementos encontrados:', {
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
          errorMsg.textContent = `⚠️ ${urlValidation.error}`;
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
        msg.textContent = '🔄 Verificando imagen...';
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
          successMsg.textContent = `✅ Imagen válida (${imageCheck.width}x${imageCheck.height}px)`;
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
          warningMsg.textContent = `⚠️ No se pudo verificar la imagen: ${imageCheck.error}`;
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
    
    // ✅ Obtener botón submit
    const submitBtn = formAddCourse.querySelector('button[type="submit"]');
    let restoreButton = null;
    
    // ✅ Rate limiting: prevenir acciones repetidas
    if (!checkRateLimit('crear curso')) {
      return;
    }
    
    // ✅ Sanitizar y validar inputs
    const titleRaw = $('#inputCourseTitle').value.trim();
    const metaRaw = $('#inputCourseMeta').value.trim();
    const imageUrlRaw = $('#inputCourseImage').value.trim();
    const tagRaw = $('#inputCourseTag').value.trim();
    const codeRaw = $('#inputCourseCode').value.trim();
    const type = $('#selectCourseType').value || 'curso'; // ✅ Clasificación del curso
    
    // Validaciones básicas de longitud
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
    
    // ✅ Sanitizar inputs (escapar HTML)
    const title = sanitizeHTML(titleRaw);
    const meta = sanitizeHTML(metaRaw);
    const imageUrl = imageUrlRaw.trim(); // URL no se sanitiza, se valida
    const tag = tagRaw.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Solo letras y números
    const code = codeRaw.trim();
    
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
    
    const variant = selectVariant.value || 'dramatic'; // Valor por defecto
    const accent = inputAccent.value || '#5aa9ff'; // Valor por defecto
    // code ya está definido arriba (línea 4720)
    
    // ✅ Debug: mostrar valores capturados
    console.log('[FORM] 📝 Valores capturados:', {
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
    console.log('[FORM] 💾 Datos del curso a guardar:', courseData);
    
    try {
      // Guardar curso (esperar confirmación)
      await addCustomCourse(hex, courseData);
      
      // ✅ NO hacer refresh de cursos remotos después de crear, porque puede sobrescribir el código
      // El código se guarda localmente y en Firebase, no necesita refresh desde Google Sheets
      // await refreshCustomCourses().catch(e => {
      //   console.warn('[ADD COURSE] Error refrescando cursos después de crear:', e);
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

  // Función global para abrir el modal con datos del curso
  window.openEditCourseModal = function(hex, courseData) {
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
    
    modalEditCourse.classList.add('show');
  };

  // Submit formulario
  formEditCourse.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // ✅ Obtener botón submit
    const submitBtn = formEditCourse.querySelector('button[type="submit"]');
    let restoreButton = null;
    
    // ✅ Rate limiting: prevenir ediciones repetidas
    if (!checkRateLimit('editar curso')) {
      return;
    }
    
    const hex = $('#inputEditCourseHex').value.trim();
    if (!hex) {
      alert('Error: No se encontró el identificador del curso');
      return;
    }
    
    // ✅ Sanitizar y validar inputs
    const titleRaw = $('#inputEditCourseTitle').value.trim();
    const metaRaw = $('#inputEditCourseMeta').value.trim();
    const imageUrlRaw = $('#inputEditCourseImage').value.trim();
    const tagRaw = $('#inputEditCourseTag').value.trim();
    const type = $('#selectEditCourseType').value || 'curso'; // ✅ Clasificación del curso
    const variant = $('#selectEditCourseVariant').value;
    const accent = $('#inputEditCourseAccent').value;
    
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
    
    // ✅ Sanitizar inputs (escapar HTML)
    const title = sanitizeHTML(titleRaw);
    const meta = sanitizeHTML(metaRaw);
    const imageUrl = imageUrlRaw.trim(); // URL no se sanitiza, se valida
    const tag = tagRaw.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Solo letras y números
    
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
        console.warn('[EDIT COURSE] Error refrescando cursos después de editar:', e);
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
window.testButtonColor = function() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 TEST DE BOTÓN FLOTANTE');
  console.log('═══════════════════════════════════════════');
  console.log('');
  
  // Test 1: Cambiar a amarillo
  console.log('Test 1: Cambiando botón a AMARILLO (con cambios)...');
  if (typeof window.updateSyncButtonState === 'function') {
    window.updateSyncButtonState(true);
    console.log('✅ Botón debería estar AMARILLO pulsante ahora');
    console.log('   Verifica visualmente el botón flotante →');
  } else {
    console.error('❌ updateSyncButtonState no está disponible');
    console.error('   Asegúrate de haber refrescado la página');
  }
  
  // Test 2: Esperar 4 segundos y cambiar a azul
  setTimeout(() => {
    console.log('');
    console.log('Test 2: Cambiando botón a AZUL (sin cambios)...');
    if (typeof window.updateSyncButtonState === 'function') {
      window.updateSyncButtonState(false);
      console.log('✅ Botón debería estar AZUL ahora');
      console.log('   Verifica visualmente el botón flotante →');
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('Si viste el cambio de colores, ¡funciona! 🎉');
    console.log('═══════════════════════════════════════════');
  }, 4000);
};

// 🧪 TEST COMPLETO DE SINCRONIZACIÓN
window.testSyncComplete = async function(hex) {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 TEST COMPLETO DE SINCRONIZACIÓN');
  console.log('═══════════════════════════════════════════');
  console.log('Hex:', hex);
  console.log('URL Remoto:', REMOTE_BASE_URL);
  console.log('');
  
  // 1. Ver datos locales actuales
  console.log('📦 PASO 1: Datos locales actuales');
  const localFiles = getFilesForHex(hex);
  console.log('  → Archivos locales:', localFiles.length);
  console.log('  → Datos:', JSON.stringify(localFiles));
  console.log('');
  
  // 2. Leer desde remoto
  console.log('📥 PASO 2: Leer desde remoto (JSONP)');
  const remoteFiles = await remoteGetFilesJSONP(hex);
  console.log('  → Archivos remotos:', remoteFiles ? remoteFiles.length : 'NULL');
  console.log('  → Datos:', JSON.stringify(remoteFiles));
  console.log('');
  
  // 3. Agregar un archivo de prueba
  console.log('✏️ PASO 3: Agregar archivo de prueba');
  const testFile = {
    label: 'TEST ' + new Date().toLocaleTimeString(),
    url: 'https://ejemplo.com/test-' + Date.now()
  };
  const newFiles = [...localFiles, testFile];
  console.log('  → Agregando:', testFile);
  console.log('  → Total archivos:', newFiles.length);
  console.log('');
  
  // 4. Guardar localmente
  console.log('💾 PASO 4: Guardar localmente');
  saveFilesOverride(hex, newFiles);
  const savedLocal = getFilesForHex(hex);
  console.log('  → Guardado local exitoso:', savedLocal.length === newFiles.length ? '✅' : '❌');
  console.log('');
  
  // 5. Guardar en remoto
  console.log('☁️ PASO 5: Guardar en remoto (POST)');
  const saveOk = await remoteSaveFiles(hex, newFiles);
  console.log('  → Resultado POST:', saveOk ? '✅ ÉXITO' : '❌ FALLÓ');
  console.log('');
  
  // 6. Esperar 2 segundos para que Google Sheets procese
  console.log('⏳ PASO 6: Esperando 2 segundos...');
  await new Promise(r => setTimeout(r, 2000));
  console.log('');
  
  // 7. Verificar que se guardó en remoto
  console.log('🔍 PASO 7: Verificar en remoto');
  const remoteCheck = await remoteGetFilesJSONP(hex);
  console.log('  → Archivos en remoto:', remoteCheck ? remoteCheck.length : 'NULL');
  console.log('  → Coincide con local:', remoteCheck && remoteCheck.length === newFiles.length ? '✅' : '❌');
  console.log('  → Datos remotos:', JSON.stringify(remoteCheck));
  console.log('');
  
  // 8. Resumen
  console.log('═══════════════════════════════════════════');
  console.log('📊 RESUMEN DEL TEST');
  console.log('═══════════════════════════════════════════');
  console.log('✓ Lectura local:', localFiles.length, 'archivos');
  console.log('✓ Lectura remota inicial:', remoteFiles ? remoteFiles.length : 'NULL', 'archivos');
  console.log('✓ Guardado local:', savedLocal.length === newFiles.length ? '✅' : '❌');
  console.log('✓ Guardado remoto:', saveOk ? '✅' : '❌');
  console.log('✓ Verificación remota:', remoteCheck && remoteCheck.length === newFiles.length ? '✅' : '❌');
  console.log('');
  
  if (remoteCheck && remoteCheck.length === newFiles.length) {
    console.log('🎉 ¡TEST EXITOSO! La sincronización funciona correctamente');
    console.log('💡 Abre la página en otro dispositivo/pestaña y ejecuta:');
    console.log('   verDatosGuardados()');
  } else {
    console.log('❌ TEST FALLÓ - La sincronización no está funcionando');
    console.log('🔧 Posibles causas:');
    console.log('   1. El POST no llega a Google Sheets');
    console.log('   2. Google Apps Script tiene un error');
    console.log('   3. La URL del WebApp es incorrecta');
    console.log('   4. Hay un delay en el procesamiento');
  }
  console.log('═══════════════════════════════════════════');
};

// 🔍 DIAGNÓSTICO: Ver qué devuelve realmente el servidor
window.diagnosticarRespuesta = async function(hex = null) {
  console.log('═══════════════════════════════════════════');
  console.log('🔍 DIAGNÓSTICO DE RESPUESTA DEL SERVIDOR');
  console.log('═══════════════════════════════════════════');
  
  // Test 1: Sin callback (JSON puro)
  const testUrl1 = hex 
    ? `${REMOTE_BASE_URL}?hex=${encodeURIComponent(hex)}&ts=${Date.now()}`
    : `${REMOTE_BASE_URL}?action=get_courses&ts=${Date.now()}`;
  
  // Test 2: Con callback (JSONP)
  const testUrl2 = hex 
    ? `${REMOTE_BASE_URL}?hex=${encodeURIComponent(hex)}&callback=testCallback123&ts=${Date.now()}`
    : `${REMOTE_BASE_URL}?action=get_courses&callback=testCallback123&ts=${Date.now()}`;
  
  console.log('');
  console.log('🧪 TEST 1: Sin parámetro callback');
  console.log('URL:', testUrl1);
  console.log('');
  
  try {
    const response1 = await fetch(testUrl1);
    const text1 = await response1.text();
    
    console.log('Status:', response1.status);
    console.log('Content-Type:', response1.headers.get('content-type'));
    console.log('📄 Respuesta:');
    console.log('─────────────────────────────────────────');
    console.log(text1);
    console.log('─────────────────────────────────────────');
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('');
  console.log('🧪 TEST 2: Con parámetro callback=testCallback123');
  console.log('URL:', testUrl2);
  console.log('');
  
  try {
    const response2 = await fetch(testUrl2);
    const text2 = await response2.text();
    
    console.log('Status:', response2.status);
    console.log('Content-Type:', response2.headers.get('content-type'));
    console.log('📄 Respuesta:');
    console.log('─────────────────────────────────────────');
    console.log(text2);
    console.log('─────────────────────────────────────────');
    console.log('');
    
    // Analizar si es JSONP válido
    if (text2.includes('testCallback123')) {
      console.log('✅ El servidor SÍ está usando el callback');
      if (text2.startsWith('testCallback123(') && text2.includes(')')) {
        console.log('✅ Formato JSONP CORRECTO');
        console.log('');
        console.log('🎉 ¡EL SERVIDOR ESTÁ CONFIGURADO CORRECTAMENTE!');
      } else {
        console.log('⚠️ El callback está presente pero el formato es incorrecto');
      }
    } else {
      console.log('❌ El servidor NO está usando el callback');
      console.log('❌ Problema: Google Apps Script no está devolviendo JSONP');
      console.log('');
      console.log('🔧 SOLUCIONES:');
      console.log('1. Verifica que copiaste el código COMPLETO a Google Apps Script');
      console.log('2. Verifica que guardaste (Ctrl+S)');
      console.log('3. Haz una NUEVA implementación (no editar la existente)');
      console.log('4. Copia la NUEVA URL y actualiza app.js');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('═══════════════════════════════════════════');
};

// 🧪 TEST JSONP SIMPLE
window.testJSONP = async function(hex) {
  console.log('🧪 TEST JSONP para hex:', hex);
  // 🛡️ Cache-buster
  const url = REMOTE_BASE_URL 
    + '?hex=' + encodeURIComponent(hex) 
    + '&callback=test_callback'
    + '&ts=' + Date.now();
  console.log('URL:', url);
  
  return new Promise((resolve) => {
    const callbackName = 'test_callback_' + Date.now();
    const script = document.createElement('script');
    const testUrl = REMOTE_BASE_URL 
      + '?hex=' + encodeURIComponent(hex) 
      + '&callback=' + callbackName
      + '&ts=' + Date.now();
    script.src = testUrl;
    
    window[callbackName] = function(data) {
      console.log('✅ CALLBACK EJECUTADO!', data);
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
        console.warn('⏱️ TIMEOUT - callback no se ejecutó después de 10s');
        if (script.parentNode) document.body.removeChild(script);
        delete window[callbackName];
        resolve(null);
      }
    }, 10000);
    
    document.body.appendChild(script);
    console.log('📡 Script agregado, esperando respuesta...');
  });
};

// Probar GET directo desde la consola
window.testGET = async function(hex) {
  console.log('🧪 TEST GET para hex:', hex);
  try {
    const result = await remoteGetFiles(hex);
    console.log('✅ Resultado:', result);
    return result;
  } catch(e) {
    console.error('❌ Error:', e);
    return null;
  }
};

