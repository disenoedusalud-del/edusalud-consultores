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

const ACCESS_HASH_MAP = {
  "2291db02a1c676fcb2f5effd7bba8232c1d7eb75ab236f4880aa8ce0536359c0": {
    title: "Diplomado en Gerencia y Administración de Servicios Hospitalarios (GASH) – 3ª Ed. 2025",
    meta: "Material oficial para docentes/consultores (logos, PPT, manual de marca, social kit)",
    files: [
      { label: "Logos (PNG)", url: "https://drive.google.com/drive/folders/1ooz6Z0YICAqP7PP5UgmPq1v1DFIkv9pi?usp=sharing" },
      { label: "Plantilla PPT (PPTX)", url: "https://drive.google.com/drive/folders/14E42MPlcjsIcc6OWNCYJ2J1HRzcdr21F?usp=sharing" },
      { label: "Manual de Marca (PDF)", url: "https://drive.google.com/file/d/100O3Xp4CzybPdo-uEJqjNLpvbPMUeB-S/view?usp=sharing" },
      { label: "Social Kit (JPG)", url: "https://drive.google.com/drive/folders/1FbTQSAMZk84de7ykDs9YmMmp7z1Pyufr?usp=sharing" },
      { label: "Papel Membretado (DOCX)", url: "https://drive.google.com/drive/folders/1RXj1Mv0t1azJoiWMOhEldfMNfbwclXXm?usp=sharing" },
      { label: "Platform toolkit (web)", url: "https://www.notion.so/Plataformas-para-Docentes-estudiantes-29b7e88eb31a8029a710dc4ec95809f3?source=copy_link" }
    ],
    card: { img: "assets/IMG/D_GASH_B1.jpg", tag: "GASH", variant: "dramatic", seed: 7, accent: "#5aa9ff" }
  },

  "88f62dd4f34bc0c54550634cee859bb2178aa0e69041e1bee3be5a132e1c7456": {
    title: "Curso Manejo Básico de Fracturas (MBF) – 2ª Ed. 2025",
    meta: "Material oficial para docentes/consultores (logos, PPT, manual de marca, social kit)",
    files: [
      { label: "Logos (PNG)", url: "https://drive.google.com/drive/folders/1ooz6Z0YICAqP7PP5UgmPq1v1DFIkv9pi?usp=sharing" },
      { label: "Plantilla PPT (PPTX)", url: "https://drive.google.com/drive/folders/1qJqRPO2akiosdJ9BMBXp49gYgrRExcD2?usp=sharing" },
      { label: "Manual de Marca (PDF)", url: "https://drive.google.com/file/d/100O3Xp4CzybPdo-uEJqjNLpvbPMUeB-S/view?usp=sharing" },
      { label: "Social Kit (JPG)", url: "https://drive.google.com/drive/folders/1msdy6xita4RcTesyg7qV3Q51WGu97qPZ?usp=sharing" },
      { label: "Papel Membretado (DOCX)", url: "https://drive.google.com/drive/folders/1RXj1Mv0t1azJoiWMOhEldfMNfbwclXXm?usp=sharing" },
      { label: "Platform toolkit (web)", url: "https://www.notion.so/Plataformas-para-Docentes-estudiantes-29b7e88eb31a8029a710dc4ec95809f3?source=copy_link" }
    ],
    card: { img: "assets/IMG/C_MBF_2026_B1.jpg", tag: "MBF", variant: "neon", seed: 11, accent: "#8be9fd" }
  },

  "4544b187690fbe2b84c7b20f7d9fe3d9330419f6f8fc42998fa7348dc3ae2907": {
    title: "Curso Abordaje de Hemorragias Gineo-Obstétricas – 2025",
    meta: "Material oficial para docentes/consultores (logos, PPT, manual de marca, social kit)",
    files: [
      { label: "Logos (PNG)",             url: "https://drive.google.com/drive/folders/1ooz6Z0YICAqP7PP5UgmPq1v1DFIkv9pi?usp=sharing" },
      { label: "Manual de Marca (PDF)",   url: "https://drive.google.com/file/d/100O3Xp4CzybPdo-uEJqjNLpvbPMUeB-S/view?usp=sharing" },
      { label: "Social Kit (JPG)",        url: "https://drive.google.com/drive/folders/1KJkd0InpGNF-iTFObDc4CuC4A8DCGpuF?usp=sharing" },
      { label: "Papel Membretado (DOCX)", url: "https://drive.google.com/drive/folders/1RXj1Mv0t1azJoiWMOhEldfMNfbwclXXm?usp=sharing" },
      { label: "Platform toolkit (web)", url: "https://www.notion.so/Plataformas-para-Docentes-estudiantes-29b7e88eb31a8029a710dc4ec95809f3?source=copy_link" }
    ],
    card: { img: "assets/IMG/C_CAHGO_2025_B1.jpg", tag: "AHGO2", variant: "neon", seed: 3, accent: "#8be9fd" }
  }
};

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
    console.warn('[STORAGE] Error cargando cursos personalizados:', e);
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
    console.warn('[STORAGE] Error guardando cursos personalizados:', e);
  }
}
function getMergedAccessHashMap(){
  // ✅ Siempre devolver al menos los cursos base, incluso si falla localStorage
  const base = ACCESS_HASH_MAP || {};
  
  // ✅ Verificar que base tiene contenido (importante para modo incógnito)
  if (!base || typeof base !== 'object' || Object.keys(base).length === 0) {
    console.error('[HASHMAP] ⚠️ ACCESS_HASH_MAP está vacío o undefined!');
    return {}; // Retornar objeto vacío en lugar de fallar
  }
  
  let custom = {};
  try {
    custom = loadCustomCourses();
  } catch (e) {
    console.warn('[HASHMAP] Error cargando cursos custom, usando solo base:', e);
  }
  
  // Combinar base con custom (base siempre debe existir)
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
  const custom = loadCustomCourses();
  custom[hex] = courseData;
  saveCustomCourses(custom);
  // ✅ Guardar también en remoto (esperar confirmación)
  const saveResult = await remoteSaveCourse(hex, courseData).catch(e => {
    console.error('[ADD COURSE] ❌ Error guardando curso en remoto:', e);
    alert('⚠️ Error al guardar curso en remoto. El curso está guardado localmente pero no se sincronizará.');
    return false;
  });
  
  if (saveResult) {
    console.log('[ADD COURSE] ✅ Curso guardado en remoto correctamente');
  } else {
    console.warn('[ADD COURSE] ⚠️ No se pudo guardar en remoto (continuando de todas formas)');
  }
}
function removeCustomCourse(hex){
  const custom = loadCustomCourses();
  delete custom[hex];
  saveCustomCourses(custom);
  // ✅ Eliminar también en remoto
  remoteDeleteCourse(hex);
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
  const base = ACCESS_HASH_MAP[hex]?.files;
  return Array.isArray(base) ? base.slice() : [];
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

/* ============ sincronización remota (opcional) ============ */
const REMOTE_BASE_URL = 'https://script.google.com/macros/s/AKfycbzoM4WegVy9eMrl3nmto_WsGtpNNmKI-E_1FLVuJFsJZoxraNTkxb1vKnCBU8yLiprN/exec';
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
  if (!hasRemote()) {
    console.log('[REFRESH] Sin remoto, saltando...');
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
      return true;
    }
    return false;
  } catch (e) {
    console.error('[REFRESH] Error en refreshCustomCourses:', e);
    // ✅ No fallar completamente, siempre devolver false para continuar
    return false;
  }
}

// ===== Exportar / Importar overrides (todas los cursos) =====
function exportOverrides(){
  const payload = { version: 1, exportedAt: new Date().toISOString(), overrides: {} };
  Object.keys(ACCESS_HASH_MAP).forEach(hex => {
    const arr = loadFilesOverride(hex);
    if (Array.isArray(arr)) payload.overrides[hex] = arr;
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'edusalud_overrides.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
async function importOverridesFromFile(file){
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || typeof data.overrides !== 'object') {
      alert('Archivo inválido'); return;
    }
    let count = 0;
    Object.entries(data.overrides).forEach(([hex, arr]) => {
      if (ACCESS_HASH_MAP[hex] && Array.isArray(arr)) { saveFilesOverride(hex, arr); count++; }
    });
    buildMasterGrid();
    alert(`Importado correctamente (${count} cursos)`);
  } catch (e) {
    alert('No se pudo importar el archivo');
  }
}
function ensureMasterTools(){
  const grid = document.getElementById('masterGrid');
  if (!grid) return;
  let tools = document.getElementById('masterTools');
  if (tools) return;
  tools = document.createElement('div');
  tools.id = 'masterTools';
  tools.style.cssText = 'display:flex; gap:10px; align-items:center; margin:10px 0;';
  const btnExp = document.createElement('button');
  btnExp.className = 'btn secondary'; btnExp.type = 'button'; btnExp.textContent = 'Exportar cambios';
  btnExp.addEventListener('click', exportOverrides);
  const btnImp = document.createElement('button');
  btnImp.className = 'btn secondary'; btnImp.type = 'button'; btnImp.textContent = 'Importar cambios';
  const file = document.createElement('input');
  file.type = 'file'; file.accept = 'application/json'; file.style.display = 'none';
  btnImp.addEventListener('click', () => file.click());
  file.addEventListener('change', () => { if (file.files && file.files[0]) importOverridesFromFile(file.files[0]); });
  tools.appendChild(btnExp); tools.appendChild(btnImp); tools.appendChild(file);
  grid.parentNode.insertBefore(tools, grid);
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
  $('#access').classList.remove('hidden');
  $('#content').classList.add('hidden');
  $('#master').classList.add('hidden');
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
  $('#access').classList.add('hidden');
  $('#content').classList.remove('hidden');
  $('#master').classList.add('hidden');
  // No iniciar refresh periódico aquí, se inicia cuando se renderiza el curso
  // ✅ Mostrar botón flotante cuando está autenticado
  const fabBtn = document.getElementById('btn-speed-refresh');
  if (fabBtn) fabBtn.classList.add('visible');
}
function showMaster() {
  $('#access').classList.add('hidden');
  $('#content').classList.add('hidden');
  $('#master').classList.remove('hidden');
  // ❌ NO iniciar polling automático (el usuario sincroniza manualmente con el botón)
  // startPeriodicRefresh(MASTER_HASH);
  
  // ✅ Mostrar botón flotante cuando está autenticado
  const fabBtn = document.getElementById('btn-speed-refresh');
  if (fabBtn) fabBtn.classList.add('visible');
  
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

  $('#courseTitle').textContent = data.title;
  $('#courseMeta').textContent = data.meta || '';

  const list = $('#filelist');
  list.innerHTML = '';
  const files = getFilesForHex(keyHex);
  (files || []).forEach(item => {
    const row = document.createElement('div');
    row.className = 'file';
    let host = '';
    try { host = new URL(item.url).hostname; } catch { host = ''; }
    row.innerHTML = `<div><strong>${item.label}</strong><div class="meta">${host}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = 'Ver más';
    btn.addEventListener('click', () => downloadFile(item.url, item.label));
    row.appendChild(btn);
    list.appendChild(row);
  });

  // Tarjeta imagen
  try {
    const left = document.querySelector('#courseCard .card-left-wrapper');
    if (left) {
      left.innerHTML = '';
      let wrapper = null;
      if (window.insertElectricCard) {
        wrapper = window.insertElectricCard(left);
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
  const grid = $('#masterGrid');
  grid.innerHTML = '';

  const mergedMap = getMergedAccessHashMap();
  Object.entries(mergedMap).forEach(([hex, data]) => {
    // excluir el master si algún día lo metes en el mismo objeto
    if (hex === MASTER_HASH) return;

    const cardEl = document.createElement('div');
    cardEl.className = 'master-card';
    cardEl.dataset.title = (data.title || '').toLowerCase();
    cardEl.dataset.tag = (data.card?.tag || '').toLowerCase();

    const left = document.createElement('div');
    left.className = 'left';
    const right = document.createElement('div');
    right.className = 'right';

    // cabecera derecha (título + meta + botón abrir curso)
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;';
    const t = document.createElement('div');
    t.innerHTML = `<div style="font-weight:700">${data.title}</div><div class="meta">${data.meta || ''}</div>`;
    
    const headerActions = document.createElement('div');
    headerActions.style.cssText = 'display:flex; gap:8px;';
    
    const open = document.createElement('button');
    open.className = 'btn secondary';
    open.type = 'button';
    open.textContent = 'Abrir curso';
    open.addEventListener('click', async () => {
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
    
    // Botón eliminar solo para cursos personalizados
    if (isCustomCourse(hex)) {
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn';
      btnDelete.type = 'button';
      btnDelete.textContent = '🗑️ Eliminar';
      btnDelete.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
      btnDelete.addEventListener('click', async () => {
        // ✅ Mostrar modal de confirmación elegante
        window.showDeleteConfirmModal(data.title, async () => {
          console.log('[DELETE] Eliminando curso:', data.title);
          
          // ✅ Eliminar curso (local y remoto)
          removeCustomCourse(hex);
          
          // ✅ Forzar refresh inmediato de cursos para que otros dispositivos vean el cambio
          await refreshCustomCourses().catch(e => {
            console.warn('[DELETE] Error refrescando cursos después de eliminar:', e);
          });
          
          buildMasterGrid();
          console.log('[DELETE] ✅ Curso eliminado exitosamente');
          
          // Analytics tracking
          if (typeof gtag !== 'undefined') {
            gtag('event', 'course_deleted', {
              'event_category': 'management',
              'event_label': data.card?.tag || 'unknown'
            });
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
      leftInfo.innerHTML = `<strong>${item.label}</strong><div class="meta">${host}</div>`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '8px';

      const btnOpen = document.createElement('button');
      btnOpen.className = 'btn';
      btnOpen.type = 'button';
      btnOpen.textContent = 'Descargar';
      btnOpen.addEventListener('click', () => downloadFile(item.url, item.label));

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn secondary';
      btnEdit.type = 'button';
      btnEdit.textContent = 'Editar';
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
      btnRemove.addEventListener('click', async () => {
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
      if (!labelVal || !urlVal) { alert('Complete etiqueta y URL'); return; }
      try { new URL(urlVal); } catch { alert('URL inválida'); return; }
      
      const current = getFilesForHex(hex);
      console.log('[ADD] Links actuales:', current.length);
      const next = current.concat({ label: labelVal, url: urlVal });
      console.log('[ADD] Links después de agregar:', next.length);
      console.log('[ADD] Array completo a guardar:', JSON.stringify(next));
      
      // Limpiar inputs
      inputLabel.value = '';
      inputUrl.value = '';
      
      saveFilesOverride(hex, next);
      
      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE (sin esperar nada)
      console.log('[ADD] ➕ Agregando link inmediatamente a la vista');
      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      
      if (isMasterView) {
        buildMasterGrid();
        console.log('[ADD] ✅ Vista master actualizada');
      } else {
        renderCourse(hex);
        console.log('[ADD] ✅ Vista de curso actualizada');
      }
      
      // ✅ GUARDAR EN REMOTO (en segundo plano, sin bloquear UI)
      remoteSaveFiles(hex, next).then(saveResult => {
        if (saveResult) {
          console.log('[ADD] ✅ Guardado en remoto - POST exitoso');
          // 🔄 Push optimista: sincronizar con remoto (sin await, en background)
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

    // tarjeta izquierda (solo imagen)
    let wrapper = null;
    if (window.insertElectricCard) {
      wrapper = window.insertElectricCard(left);
    }
    if (wrapper && data.card?.img && window.setCardImage) {
      window.setCardImage(wrapper, `${data.card.img}?v=2`);
    }

    cardEl.appendChild(left);
    cardEl.appendChild(right);
    grid.appendChild(cardEl);
  });
  // herramientas exportar/importar
  try { ensureMasterTools(); } catch(e) {}
}

async function refreshFromRemoteSilent(hex){
  try {
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

  function applyFilter(){
    const q = (input.value || '').trim().toLowerCase();
    const cards = grid.querySelectorAll('.master-card');
    if (!q){
      cards.forEach(c => c.style.display = '');
      return;
    }
    cards.forEach(c => {
      const t = c.dataset.title || '';
      const tg = c.dataset.tag || '';
      c.style.display = (t.includes(q) || tg.includes(q)) ? '' : 'none';
    });
  }

  input.addEventListener('input', applyFilter);
  clear?.addEventListener('click', () => { input.value=''; applyFilter(); });
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

/* ============ eventos ============ */
$('#btn-enter').addEventListener('click', () => tryLoginByCode($('#code').value));
$('#code').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#btn-enter').click(); } });
$('#btn-logout').addEventListener('click', () => { currentKeyHex = null; setQueryParam('code', null); showAccess(); });

$('#btn-copy-code-link').addEventListener('click', async () => {
  if (!currentKeyHex) return;
  const url = new URL(location.href);
  const codeField = $('#code');
  const encoded = url.searchParams.get('code');
  const codeVal = (encoded ? atob(encoded) : codeField.value) || '';
  if (!codeVal) return;
  url.searchParams.set('code', btoa(codeVal));
  try {
    await navigator.clipboard.writeText(url.toString());
    alert('Enlace copiado al portapapeles');
  } catch (e) {
    prompt('Copie este enlace:', url.toString());
  }
});

$('#btn-master-exit').addEventListener('click', () => { setQueryParam('code', null); showAccess(); });
$('#btn-master-copy').addEventListener('click', async () => {
  const url = new URL(location.href);
  url.searchParams.set('code', btoa('EDUMASTER123456987'));
  try {
    await navigator.clipboard.writeText(url.toString());
    alert('Enlace de vista maestra copiado');
  } catch (e) {
    prompt('Copie este enlace:', url.toString());
  }
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
      
      alert(`✅ Sincronización completada: ${updated} curso(s) actualizado(s)`);
      
    } else if (isContentView) {
      console.log('[SYNC FORCE] 📄 Vista de curso detectada - Sincronizando curso actual...');
      
      // Obtener el hex del curso actual
      const currentHex = window.currentCourseHex; // Necesitamos guardarlo globalmente
      
      if (currentHex) {
        const updated = await refreshFromRemoteSilent(currentHex);
        
        if (updated) {
          console.log('[SYNC FORCE] ✅ Curso sincronizado, re-renderizando...');
          renderCourse(currentHex);
          alert('✅ Recursos sincronizados desde el servidor');
        } else {
          console.log('[SYNC FORCE] ℹ️ No hay cambios nuevos');
          alert('ℹ️ Ya estás viendo la última versión');
        }
      } else {
        console.warn('[SYNC FORCE] ⚠️ No se detectó hex del curso actual');
        alert('⚠️ No se pudo identificar el curso actual');
      }
      
    } else {
      console.log('[SYNC FORCE] ℹ️ No hay vista activa para sincronizar');
      alert('ℹ️ Primero ingresa a un curso o a la vista maestra');
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
  // ✅ NO limpiar archivos al inicio - dejar que la sincronización automática lo maneje
  console.log('[INIT] 🚀 Iniciando plataforma...');
  console.log('[INIT] 📦 Archivos locales disponibles:', Object.keys(localStorage).filter(k => k.startsWith(FILES_STORAGE_PREFIX)).length);
  console.log('[INIT] 🔄 La sincronización automática actualizará los datos cada 1.2s');
  
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
    
    const title = $('#inputCourseTitle').value.trim();
    const meta = $('#inputCourseMeta').value.trim();
    const imageUrl = $('#inputCourseImage').value.trim();
    const tag = $('#inputCourseTag').value.trim().toUpperCase();
    const variant = $('#selectCourseVariant').value;
    const accent = $('#inputCourseAccent').value;
    const code = $('#inputCourseCode').value.trim();
    
    // Validaciones
    if (!title || !meta || !imageUrl || !tag || !code) {
      alert('Complete todos los campos');
      return;
    }
    
    // Validar URL de imagen
    try {
      new URL(imageUrl);
    } catch {
      // Si no es una URL absoluta, asumimos que es relativa
      if (!imageUrl.startsWith('/') && !imageUrl.startsWith('assets/')) {
        alert('URL de imagen inválida');
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
      card: {
        img: imageUrl,
        tag: tag,
        variant: variant,
        seed: Math.floor(Math.random() * 100),
        accent: accent
      }
    };
    
    // Guardar curso (esperar confirmación)
    await addCustomCourse(hex, courseData);
    
    // ✅ Forzar refresh de cursos para que se vea inmediatamente
    await refreshCustomCourses().catch(e => {
      console.warn('[ADD COURSE] Error refrescando cursos después de crear:', e);
    });
    
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'course_created', {
        'event_category': 'management',
        'event_label': tag
      });
    }
    
    // Cerrar modal y recargar grid
    modalAddCourse.classList.remove('show');
    formAddCourse.reset();
    inputCourseAccent.value = '#5aa9ff';
    inputCourseAccentHex.value = '#5aa9ff';
    
    // Reconstruir grid
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

// ✅ Configurar modal cuando DOM está completamente cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAddCourseModal);
} else {
  setupAddCourseModal();
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

