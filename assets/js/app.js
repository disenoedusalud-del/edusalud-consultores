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
  // ✅ Validar URL antes de abrir
  try {
    new URL(url);
  } catch (e) {
    console.error('[DOWNLOAD] URL inválida:', url);
    alert('URL inválida. No se puede abrir el enlace.');
    return;
  }
  
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
    console.log('[HASHMAP] 🔍 Cursos personalizados cargados desde localStorage:', Object.keys(custom));
    console.log('[HASHMAP] 🔍 Detalles:', custom);
  } catch (e) {
    console.warn('[HASHMAP] Error cargando cursos custom, usando solo base:', e);
  }
  
  // Combinar base con custom (base siempre debe existir)
  const merged = Object.assign({}, base, custom);
  console.log('[HASHMAP] 📊 Resumen: Base:', Object.keys(base).length, 'Custom:', Object.keys(custom).length, 'Total:', Object.keys(merged).length);
  console.log('[HASHMAP] 🔑 Hex de cursos custom:', Object.keys(custom));
  
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
  console.log('[ADD COURSE] Guardando curso localmente - hex:', hex.substring(0,8));
  console.log('[ADD COURSE] Datos del curso:', courseData);
  
  const custom = loadCustomCourses();
  console.log('[ADD COURSE] Cursos actuales antes de agregar:', Object.keys(custom).length);
  
  custom[hex] = courseData;
  saveCustomCourses(custom);
  
  console.log('[ADD COURSE] ✅ Curso guardado localmente');
  console.log('[ADD COURSE] Cursos después de guardar:', Object.keys(custom).length);
  console.log('[ADD COURSE] Verificando que se guardó:', hex in loadCustomCourses() ? '✅ SÍ' : '❌ NO');
  
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
function storageKeyFor(hex){ return FILES_STORAGE_PREFIX + hex; }
function loadFilesOverride(hex){
  try {
    const raw = localStorage.getItem(storageKeyFor(hex));
    const arr = raw ? JSON.parse(raw) : null;
    return Array.isArray(arr) ? arr : null;
  } catch (e) { return null; }
}
function saveFilesOverride(hex, files){
  try {
    localStorage.setItem(storageKeyFor(hex), JSON.stringify(files || []));
  } catch (e) {}
}
function clearFilesOverride(hex){
  try { localStorage.removeItem(storageKeyFor(hex)); } catch(e) {}
}
function getBaseFilesForHex(hex){
  const base = ACCESS_HASH_MAP[hex]?.files;
  return Array.isArray(base) ? base.slice() : [];
}
function getFilesForHex(hex){
  const override = loadFilesOverride(hex);
  if (override) return override;
  return getBaseFilesForHex(hex);
}

/* ============ sincronización remota (opcional) ============ */
const REMOTE_BASE_URL = 'https://script.google.com/macros/s/AKfycbxMz5Q1Q0cM0AR3-yjOT_3pOdKF5e4ASYOEX1NUBW1cV0YMdgI9SHk82FCm2okOuEg/exec';
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
  const testUrl = REMOTE_BASE_URL + '?hex=' + encodeURIComponent(hex) + '&callback=test_callback';
  
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
    const callbackName = '_gas_jsonp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    const script = document.createElement('script');
    const url = REMOTE_BASE_URL + '?hex=' + encodeURIComponent(hex) + '&callback=' + callbackName;
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
    
    // ✅ CRÍTICO: Declarar timeout ANTES de usarlo en callbacks
    let timeout;
    
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
    
    // Timeout reducido a 3 segundos para respuesta más rápida
    timeout = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      console.warn('[JSONP] ⚠️ Timeout después de 3s para hex:', hex.substring(0,8));
      cleanup();
      resolve(null);
    }, 3000);
    
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
    
    // ✅ Esperar un momento para asegurar que el formulario se envió
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Limpiar después de enviar (pero mantener iframe para no interrumpir el envío)
    setTimeout(() => {
      try {
        if (form.parentNode) document.body.removeChild(form);
      } catch (e) {
        console.warn('[SAVE] Error limpiando formulario:', e);
      }
      // Limpiar iframe después de más tiempo para asegurar que recibió la respuesta
      setTimeout(() => {
        try {
          if (iframe.parentNode) document.body.removeChild(iframe);
        } catch (e) {
          console.warn('[SAVE] Error limpiando iframe:', e);
        }
      }, 1000);
    }, 500);
    
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
      const callbackName = '_gas_jsonp_courses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
      const script = document.createElement('script');
      const url = REMOTE_BASE_URL + '?action=get_courses&callback=' + callbackName;
      script.src = url;
      script.async = true;
      
      console.log('[COURSE GET] 🌐 URL completa:', url);
      console.log('[COURSE GET] 🔤 Callback name:', callbackName);
      
      let resolved = false;
      const cleanup = () => {
        try {
          if (script.parentNode) document.body.removeChild(script);
        } catch(e) {}
        try {
          if (window[callbackName]) delete window[callbackName];
        } catch(e) {}
      };
      
      // ✅ CRÍTICO: Declarar timeout ANTES de usarlo en callbacks
      let timeout;
      
      // ✅ CRÍTICO: Registrar callback ANTES de agregar script al DOM
      window[callbackName] = function(data) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        
        console.log('[COURSE GET] 🔍 Respuesta completa del servidor:', data);
        
        let courses = {};
        if (data && typeof data.courses === 'object') {
          courses = data.courses;
          console.log('[COURSE GET] ✅ Cursos remotos obtenidos:', Object.keys(courses).length);
          console.log('[COURSE GET] 📋 Hex de cursos:', Object.keys(courses));
        } else if (data && typeof data === 'object') {
          // ✅ INTENTAR: Si data es directamente un objeto de cursos (sin wrapper)
          console.log('[COURSE GET] ⚠️ Intentando parsear data directamente como objeto de cursos...');
          courses = data;
          console.log('[COURSE GET] ✅ Cursos parseados directamente:', Object.keys(courses).length);
          console.log('[COURSE GET] 📋 Hex de cursos:', Object.keys(courses));
        } else {
          console.warn('[COURSE GET] ⚠️ Datos recibidos no tienen formato esperado:', data);
          console.warn('[COURSE GET] Tipo de data:', typeof data);
        }
        
        cleanup();
        resolve(courses);
      };
      
      timeout = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        console.warn('[COURSE GET] ⚠️ Timeout después de 5s');
        cleanup();
        resolve({});
      }, 5000); // ✅ Aumentado a 5 segundos para dar más tiempo al servidor
      
      script.onload = () => {
        console.log('[COURSE GET] ✅ Script cargado exitosamente');
        // Verificar si el callback se ejecutó después de 1 segundo
        setTimeout(() => {
          if (!resolved) {
            console.warn('[COURSE GET] ⚠️ Script cargó pero callback no se ejecutó después de 1s');
          }
        }, 1000);
      };
      
      script.onerror = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        console.error('[COURSE GET] ❌ Error cargando script (script.onerror)');
        console.error('[COURSE GET] URL que falló:', url);
        cleanup();
        resolve({});
      };
      
      // ✅ Agregar script DESPUÉS de registrar callback
      console.log('[COURSE GET] Callback registrado:', callbackName);
      console.log('[COURSE GET] Agregando script al DOM...');
      document.body.appendChild(script);
      console.log('[COURSE GET] ✅ Script agregado al DOM');
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
    
    // ✅ CRÍTICO: Timeout debe ser mayor que el timeout de remoteGetCourses (3s)
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn('[REFRESH] ⚠️ Timeout obteniendo cursos remotos (continuando con cursos base)');
        resolve({});
      }, 5000); // ✅ Aumentado a 5 segundos para dar tiempo al JSONP
    });
    
    const remoteCoursesPromise = remoteGetCourses();
    const remoteCourses = await Promise.race([remoteCoursesPromise, timeoutPromise]);
    
    console.log('[REFRESH] Cursos remotos obtenidos:', Object.keys(remoteCourses || {}).length);
    console.log('[REFRESH] 🔍 Cursos remotos completos:', remoteCourses);
    
    // ✅ Remoto es la fuente de verdad - sobrescribir completamente
    let localCourses = {};
    try {
      localCourses = loadCustomCourses();
      console.log('[REFRESH] Cursos locales cargados:', Object.keys(localCourses).length);
    } catch (e) {
      console.warn('[REFRESH] Error cargando cursos locales (modo incógnito?):', e);
      localCourses = {};
    }
    
    const remoteKeys = Object.keys(remoteCourses || {});
    const localKeys = Object.keys(localCourses);
    
    console.log('[REFRESH] Comparación - Remoto:', remoteKeys.length, 'Local:', localKeys.length);
    console.log('[REFRESH] 📋 Hex remotos:', remoteKeys);
    console.log('[REFRESH] 📋 Hex locales:', localKeys);
    
    // ✅ MEJORADO: Fusionar cursos remotos con locales
    // PRIORIDAD: Si remoto tiene cursos, usar remoto (es la fuente de verdad)
    // Pero preservar cursos locales que no están en remoto (pueden ser recién creados)
    const mergedCourses = { ...localCourses };
    
    // Agregar/actualizar cursos remotos (remoto tiene prioridad)
    if (remoteCourses && typeof remoteCourses === 'object') {
      Object.keys(remoteCourses).forEach(hex => {
        mergedCourses[hex] = remoteCourses[hex];
      });
    }
    
    // Detectar cambios después de la fusión
    const hadChanges = JSON.stringify(localCourses) !== JSON.stringify(mergedCourses);
    
    // Guardar cursos fusionados (remoto tiene prioridad, pero local preserva cursos nuevos)
    // ✅ Manejar error de localStorage silenciosamente
    try {
      saveCustomCourses(mergedCourses);
      console.log('[REFRESH] ✅ Cursos sincronizados (fusionados:', Object.keys(mergedCourses).length, 'cursos)');
      console.log('[REFRESH] 📊 Resumen: Local:', localKeys.length, 'Remoto:', remoteKeys.length, 'Final:', Object.keys(mergedCourses).length);
    } catch (e) {
      console.warn('[REFRESH] ⚠️ No se pudieron guardar cursos (modo incógnito?), continuando...', e);
    }
    
    // ✅ IMPORTANTE: Refrescar archivos SOLO del curso actual si es personalizado
    // No refrescar todos los cursos personalizados para evitar lentitud
    // El refresh periódico se encargará de refrescar todos cada 3 segundos
    if (currentKeyHex && mergedCourses && mergedCourses[currentKeyHex]) {
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
}
// Sistema de refresh periódico para sincronización en tiempo real
let periodicRefreshInterval = null;
const PERIODIC_REFRESH_INTERVAL_MS = 3000; // 3 segundos para mejor sincronización

function startPeriodicRefresh(currentHex = null) {
  // Detener cualquier refresh periódico existente
  stopPeriodicRefresh();
  
  if (!hasRemote()) return;
  
  console.log('[PERIODIC] Iniciando refresh periódico cada', PERIODIC_REFRESH_INTERVAL_MS / 1000, 'segundos');
  
  periodicRefreshInterval = setInterval(async () => {
    try {
      // ✅ PROTECCIÓN MEJORADA: Verificar TODOS los inputs y textareas visibles
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      );
      
      // ✅ Verificar si HAY ALGÚN input con contenido (incluso si no está enfocado)
      const allInputs = document.querySelectorAll('input[type="text"], input[type="url"], textarea');
      const hasInputWithContent = Array.from(allInputs).some(input => {
        if (!input || !input.offsetParent) return false; // No está visible
        const value = (input.value || '').trim();
        return value.length > 0 || input === activeElement;
      });
      
      // ✅ Verificar si hay formularios de edición abiertos
      const hasEditFormOpen = document.querySelector('[data-edit-form]') !== null;
      
      // ✅ Si hay cualquier input enfocado O con contenido O formulario abierto, SALTEAR refresh
      if (isInputFocused || hasInputWithContent || hasEditFormOpen) {
        console.log('[PERIODIC] ⏭️ Saltando refresh: usuario escribiendo o editando');
        return;
      }
      
      if (currentHex === MASTER_HASH) {
        // Refresh de todos los cursos para vista maestra (incluye personalizados)
        console.log('[PERIODIC] Refrescando todos los cursos...');
        const mergedMap = getMergedAccessHashMap();
        const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH);
        console.log('[PERIODIC] Total cursos a refrescar (base + personalizados):', hexes.length);
        
        const results = await Promise.allSettled(
          hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
            console.warn('[PERIODIC] Error refrescando', h.substring(0, 8), ':', e);
            return false;
          }))
        );
        const anyUpdated = results.some(r => 
          r.status === 'fulfilled' && r.value === true
        );
        
        // ✅ También refrescar cursos personalizados (para nuevos cursos, no solo archivos)
        await refreshCustomCourses();
        
        // ✅ CRÍTICO: Reconstruir grid SIEMPRE si hay cambios O si es la primera vez
        // Esto asegura que cambios remotos se vean incluso si la detección falla
        if (anyUpdated) {
          console.log('[PERIODIC] ✅ Cambios detectados, actualizando vista...');
          buildMasterGrid();
        } else {
          // ✅ Aún así reconstruir cada cierto tiempo para asegurar sincronización
          // Contador para reconstruir cada 5 refreshes (cada ~15 segundos)
          if (!window._lastMasterGridRebuild) window._lastMasterGridRebuild = 0;
          window._lastMasterGridRebuild++;
          if (window._lastMasterGridRebuild >= 5) {
            console.log('[PERIODIC] Reconstruyendo grid periódicamente para asegurar sincronización...');
            buildMasterGrid();
            window._lastMasterGridRebuild = 0;
          }
        }
      } else if (currentHex) {
        // ✅ Refresh del curso actual (incluye cursos personalizados)
        const mergedMap = getMergedAccessHashMap();
        if (mergedMap[currentHex]) {
          console.log('[PERIODIC] Refrescando curso actual (hex:', currentHex.substring(0, 8) + ')...');
          
          // ✅ CRÍTICO: Refrescar archivos del curso actual PRIMERO (los URLs se guardan en overrides)
          const updated = await refreshFromRemoteSilent(currentHex).catch(e => {
            console.warn('[PERIODIC] Error refrescando archivos:', e);
            return false;
          });
          
          if (updated) {
            // ✅ VERIFICAR OTRA VEZ antes de actualizar la vista (por si el usuario empezó a escribir durante el refresh)
            const activeElementNow = document.activeElement;
            const isInputFocusedNow = activeElementNow && (
              activeElementNow.tagName === 'INPUT' || 
              activeElementNow.tagName === 'TEXTAREA'
            );
            const hasEditFormOpenNow = document.querySelector('[data-edit-form]') !== null;
            
            // ✅ CRÍTICO: Solo saltar si el usuario está ACTIVAMENTE escribiendo (enfoque), no solo si hay inputs visibles
            // Esto permite que URLs agregados desde otra cuenta se vean inmediatamente
            if (!isInputFocusedNow && !hasEditFormOpenNow) {
              console.log('[PERIODIC] ✅ Cambios detectados en archivos, actualizando vista...');
              renderCourse(currentHex);
            } else {
              console.log('[PERIODIC] ⏭️ Cambios detectados pero saltando actualización: usuario escribiendo activamente');
            }
          } else {
            // ✅ Aún así reconstruir cada cierto tiempo para asegurar sincronización
            // Contador para reconstruir cada 5 refreshes (cada ~15 segundos)
            if (!window._lastCourseRefreshRebuild) window._lastCourseRefreshRebuild = {};
            if (!window._lastCourseRefreshRebuild[currentHex]) window._lastCourseRefreshRebuild[currentHex] = 0;
            window._lastCourseRefreshRebuild[currentHex]++;
            
            if (window._lastCourseRefreshRebuild[currentHex] >= 5) {
              console.log('[PERIODIC] Reconstruyendo vista de curso periódicamente para asegurar sincronización...');
              const activeElementNow = document.activeElement;
              const isInputFocusedNow = activeElementNow && (
                activeElementNow.tagName === 'INPUT' || 
                activeElementNow.tagName === 'TEXTAREA'
              );
              const hasEditFormOpenNow = document.querySelector('[data-edit-form]') !== null;
              
              if (!isInputFocusedNow && !hasEditFormOpenNow) {
                renderCourse(currentHex);
              }
              window._lastCourseRefreshRebuild[currentHex] = 0;
            }
          }
          
          // ✅ También refrescar cursos personalizados en background (para detectar nuevos cursos)
          // Esto no bloquea porque ya actualizamos la vista arriba si había cambios en archivos
          refreshCustomCourses().catch(e => {
            console.warn('[PERIODIC] Error refrescando cursos personalizados:', e);
          });
        }
      }
    } catch (e) {
      console.warn('[PERIODIC] Error en refresh periódico:', e);
    }
  }, PERIODIC_REFRESH_INTERVAL_MS);
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
}
function showMaster() {
  $('#access').classList.add('hidden');
  $('#content').classList.add('hidden');
  $('#master').classList.remove('hidden');
  // Iniciar refresh periódico para vista maestra
  startPeriodicRefresh(MASTER_HASH);
  
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

  $('#courseTitle').textContent = data.title;
  $('#courseMeta').textContent = data.meta || '';

  const list = $('#filelist');
  if (!list) return; // Elemento no encontrado, salir silenciosamente
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
  
  // Iniciar refresh periódico para este curso
  startPeriodicRefresh(keyHex);
}

/* ============ render master ============ */
function buildMasterGrid() {
  const grid = $('#masterGrid');
  if (!grid) {
    console.error('[BUILD GRID] ❌ Grid no encontrado!');
    return;
  }
  
  grid.innerHTML = '';

  const mergedMap = getMergedAccessHashMap();
  console.log('[BUILD GRID] Construyendo grid con', Object.keys(mergedMap).length, 'cursos totales');
  
  let cardsCreated = 0;
  
  Object.entries(mergedMap).forEach(([hex, data]) => {
    // excluir el master si algún día lo metes en el mismo objeto
    if (hex === MASTER_HASH) return;
    
    console.log('[BUILD GRID] Agregando curso al grid:', hex.substring(0,8), '-', data.title);
    cardsCreated++;

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
        if (confirm(`¿Eliminar curso "${data.title}"? Esta acción no se puede deshacer.`)) {
          // ✅ Eliminar curso (local y remoto)
          removeCustomCourse(hex);
          
          // ✅ Forzar refresh inmediato de cursos para que otros dispositivos vean el cambio
          await refreshCustomCourses().catch(e => {
            console.warn('[DELETE] Error refrescando cursos después de eliminar:', e);
          });
          
          buildMasterGrid();
          alert('✅ Curso eliminado');
          
          // Analytics tracking
          if (typeof gtag !== 'undefined') {
            gtag('event', 'course_deleted', {
              'event_category': 'management',
              'event_label': data.card?.tag || 'unknown'
            });
          }
        }
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
          
          // ✅ GUARDAR EN REMOTO (esperar confirmación)
          await remoteSaveFiles(hex, next).catch(e => {
            console.error('[EDIT] ❌ Error guardando en remoto:', e);
          });
          
          // ✅ ACTUALIZAR VISTA INMEDIATAMENTE
          const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
          if (isMasterView) {
            buildMasterGrid();
          } else {
            renderCourse(hex);
          }
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
        
        // ✅ GUARDAR EN REMOTO (esperar confirmación)
        await remoteSaveFiles(hex, next).catch(e => {
          console.error('[REMOVE] ❌ Error guardando en remoto:', e);
        });
        
        // ✅ ACTUALIZAR VISTA INMEDIATAMENTE
        const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
        if (isMasterView) {
          buildMasterGrid();
        } else {
          renderCourse(hex);
        }
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
      
      // ✅ GUARDAR EN REMOTO (esperar confirmación)
      await remoteSaveFiles(hex, next).catch(e => {
        console.error('[REORDER] ❌ Error guardando en remoto:', e);
      });
      
      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE
      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      if (isMasterView) {
        buildMasterGrid();
      } else {
        renderCourse(hex);
      }
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
      
      // ✅ GUARDAR EN REMOTO (esperar confirmación)
      const saveResult = await remoteSaveFiles(hex, next).catch(e => {
        console.error('[ADD] ❌ Error guardando en remoto:', e);
        alert('⚠️ Error al guardar en remoto. Los cambios están guardados localmente pero no se sincronizarán.');
        return false;
      });
      
      if (saveResult) {
        console.log('[ADD] ✅ Archivo guardado en remoto correctamente');
      } else {
        console.warn('[ADD] ⚠️ No se pudo guardar en remoto (continuando de todas formas)');
      }
      
      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE (sin recargar)
      // Verificar si estamos en vista master o vista curso
      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      
      if (isMasterView) {
        // Si estamos en vista master, reconstruir el grid
        buildMasterGrid();
        console.log('[ADD] ✅ Vista master actualizada');
      } else {
        // Si estamos en vista de curso individual, re-renderizar el curso
        renderCourse(hex);
        console.log('[ADD] ✅ Vista de curso actualizada');
      }
      
      // ✅ Log informativo
      console.log('[ADD] ✅ Archivo guardado localmente y en remoto. Otros dispositivos lo verán en el próximo refresh (máx 3 segundos)');
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
      
      // ✅ GUARDAR EN REMOTO (esperar confirmación)
      await remoteSaveFiles(hex, getFilesForHex(hex)).catch(e => {
        console.error('[RESTORE] ❌ Error guardando en remoto:', e);
      });
      
      // ✅ ACTUALIZAR VISTA INMEDIATAMENTE
      const isMasterView = document.getElementById('master') && !document.getElementById('master').classList.contains('hidden');
      if (isMasterView) {
        buildMasterGrid();
      } else {
        renderCourse(hex);
      }
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
  
  const actualCards = grid.querySelectorAll('.master-card').length;
  console.log('[BUILD GRID] ✅ Grid construido:', {
    esperados: cardsCreated,
    creados: actualCards,
    diferencia: cardsCreated - actualCards
  });
  
  // herramientas exportar/importar
  try { ensureMasterTools(); } catch(e) {}
}

async function refreshFromRemoteSilent(hex){
  try {
    console.log('[REFRESH] Iniciando refresh silencioso para hex:', hex.substring(0,8));
    const remote = await remoteGetFiles(hex);
    
    if (!remote) {
      console.warn('[REFRESH] No se obtuvieron datos remotos para hex:', hex.substring(0,8));
      return false;
    }
    
    if (!Array.isArray(remote)) {
      console.warn('[REFRESH] Datos remotos no son un array:', remote);
      return false;
    }
    
    console.log('[REFRESH] Datos remotos obtenidos:', remote.length, 'archivos');
    console.log('[REFRESH] 📋 Contenido remoto:', remote.map(f => `${f.label}: ${f.url}`).join(', '));
    
    const current = getFilesForHex(hex);
    const base = getBaseFilesForHex(hex); // Datos originales del código
    const currentStr = stableStringify(current);
    const remoteStr = stableStringify(remote);
    const baseStr = stableStringify(base);
    
    console.log('[REFRESH] Estado actual:');
    console.log('[REFRESH] - Remoto:', remote.length, 'archivos');
    console.log('[REFRESH] - Local:', current.length, 'archivos');
    console.log('[REFRESH] - Base:', base.length, 'archivos');
    console.log('[REFRESH] 📋 Contenido local:', current.map(f => `${f.label}: ${f.url}`).join(', '));
    
    // ✅ CRÍTICO: Comparar primero por longitud (más rápido y detecta cambios inmediatamente)
    // Si hay diferencia en longitud, SIEMPRE sincronizar (remoto tiene prioridad)
    if (remote.length !== current.length) {
      console.log('[REFRESH] ✅ CAMBIOS DETECTADOS - Diferencia en cantidad de archivos');
      console.log('[REFRESH] Remoto:', remote.length, 'archivos');
      console.log('[REFRESH] Local:', current.length, 'archivos');
      console.log('[REFRESH] 📋 Contenido remoto:', remote.map(f => `${f.label}: ${f.url}`).join(', '));
      console.log('[REFRESH] 📋 Contenido local:', current.map(f => `${f.label}: ${f.url}`).join(', '));
      
      // SIEMPRE sincronizar con remoto (remoto es la fuente de verdad)
      saveFilesOverride(hex, remote);
      
      // ✅ VERIFICAR que se guardó correctamente
      const verify = getFilesForHex(hex);
      const verifyStr = stableStringify(verify);
      const savedCorrectly = verifyStr === remoteStr;
      console.log('[REFRESH] 🔍 Verificación post-guardado:', savedCorrectly ? '✅ SÍ' : '❌ NO');
      if (!savedCorrectly) {
        console.error('[REFRESH] ❌ ERROR: Los datos no se guardaron correctamente en localStorage!');
        console.error('[REFRESH] Esperado:', remoteStr.substring(0, 200));
        console.error('[REFRESH] Obtenido:', verifyStr.substring(0, 200));
      }
      
      // Si remoto está vacío pero base tiene enlaces, limpiar override para usar base
      if (remote.length === 0 && base.length > 0) {
        console.log('[REFRESH] Remoto vacío, limpiando override para usar datos base');
        clearFilesOverride(hex);
        return true;
      }
      
      return true;
    }
    
    // CRÍTICO: Si remoto es diferente a local (mismo largo pero contenido diferente), actualizar SIEMPRE
    // Esto asegura que los cambios remotos siempre prevalezcan
    const stringsMatch = remoteStr === currentStr;
    
    if (!stringsMatch) {
      console.log('[REFRESH] ✅ CAMBIOS DETECTADOS - Remoto diferente a Local (mismo largo pero contenido diferente)');
      console.log('[REFRESH] Remoto JSON:', remoteStr.substring(0, 300));
      console.log('[REFRESH] Local JSON:', currentStr.substring(0, 300));
      
      // SIEMPRE sincronizar con remoto (remoto es la fuente de verdad)
      saveFilesOverride(hex, remote);
      
      // ✅ VERIFICAR que se guardó correctamente
      const verify = getFilesForHex(hex);
      const verifyStr = stableStringify(verify);
      const savedCorrectly = verifyStr === remoteStr;
      console.log('[REFRESH] 🔍 Verificación post-guardado:', savedCorrectly ? '✅ SÍ' : '❌ NO');
      if (!savedCorrectly) {
        console.error('[REFRESH] ❌ ERROR: Los datos no se guardaron correctamente en localStorage!');
        console.error('[REFRESH] Esperado:', remoteStr.substring(0, 200));
        console.error('[REFRESH] Obtenido:', verifyStr.substring(0, 200));
      }
      
      // Si remoto está vacío pero base tiene enlaces, limpiar override para usar base
      if (remote.length === 0 && base.length > 0) {
        console.log('[REFRESH] Remoto vacío, limpiando override para usar datos base');
        clearFilesOverride(hex);
        return true;
      }
      
      // Si remoto tiene datos, guardarlos (incluso si es un array vacío)
      return true;
    }
    
    // Si las strings coinciden pero hay inconsistencias visuales, verificar
    // Caso: remoto vacío pero local tiene más que base (overrides obsoletos)
    if (remote.length === 0 && current.length > base.length) {
      console.log('[REFRESH] ⚠️ INCONSISTENCIA: Remoto vacío pero local tiene overrides obsoletos');
      console.log('[REFRESH] Limpiando localStorage para sincronizar con remoto...');
      clearFilesOverride(hex);
      return true;
    }
    
    
    console.log('[REFRESH] ✅ Sin cambios, datos sincronizados');
    return false;
  } catch (e) { 
    console.error('[REFRESH] Error en refresh silencioso:', e);
    console.error('[REFRESH] Stack trace:', e.stack);
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
            resolve([]); // ✅ Resolver con array vacío en lugar de objeto
          }, 2000)) // Timeout de 2 segundos máximo para todos los cursos
        ])
          .then(results => {
            // ✅ Manejar correctamente el resultado (puede ser array o array vacío)
            if (Array.isArray(results) && results.length > 0) {
              const successful = results.filter(r => r.status === 'fulfilled').length;
              const failed = results.filter(r => r.status === 'rejected').length;
              console.log(`[SYNC] Refresh completado: ${successful} exitosos, ${failed} fallidos`);
            } else {
              console.log('[SYNC] Timeout alcanzado, continuando con login...');
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
      
      // ✅ CRÍTICO: Cargar cursos remotos ANTES de construir el grid
      // Esperar a que termine para asegurar que los cursos estén disponibles
      console.log('[MASTER] Cargando cursos remotos antes de construir grid...');
      await refreshCustomCourses().catch(e => {
        console.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
      });
      console.log('[MASTER] ✅ Cursos remotos cargados, construyendo grid...');
      
      buildMasterGrid();
      setupMasterSearch();
      const yearMasterEl = $('#year_master');
      if (yearMasterEl) yearMasterEl.textContent = new Date().getFullYear();
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
// ✅ Validar elementos DOM antes de agregar event listeners
const btnEnter = $('#btn-enter');
const codeInput = $('#code');
const btnLogout = $('#btn-logout');
const btnCopyCodeLink = $('#btn-copy-code-link');
const btnMasterExit = $('#btn-master-exit');
const btnMasterCopy = $('#btn-master-copy');

if (btnEnter && codeInput) {
  btnEnter.addEventListener('click', () => tryLoginByCode(codeInput.value));
  codeInput.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      btnEnter.click(); 
    } 
  });
}

if (btnLogout) {
  btnLogout.addEventListener('click', () => { 
    currentKeyHex = null; 
    setQueryParam('code', null); 
    showAccess(); 
  });
}

if (btnCopyCodeLink) {
  btnCopyCodeLink.addEventListener('click', async () => {
    if (!currentKeyHex) return;
    const url = new URL(location.href);
    const codeField = $('#code');
    const encoded = url.searchParams.get('code');
    const codeVal = (encoded ? atob(encoded) : (codeField ? codeField.value : '')) || '';
    if (!codeVal) return;
    url.searchParams.set('code', btoa(codeVal));
    try {
      await navigator.clipboard.writeText(url.toString());
      alert('Enlace copiado al portapapeles');
    } catch (e) {
      prompt('Copie este enlace:', url.toString());
    }
  });
}

if (btnMasterExit) {
  btnMasterExit.addEventListener('click', () => { 
    setQueryParam('code', null); 
    showAccess(); 
  });
}

if (btnMasterCopy) {
  btnMasterCopy.addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('code', btoa('EDUMASTER123456987'));
    try {
      await navigator.clipboard.writeText(url.toString());
      alert('Enlace de vista maestra copiado');
    } catch (e) {
      prompt('Copie este enlace:', url.toString());
    }
  });
}

/* ============ init ============ */
(async function init(){
  const yearEl = $('#year');
  const yearMasterEl = $('#year_master');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (yearMasterEl) yearMasterEl.textContent = new Date().getFullYear();

  const qp = new URLSearchParams(location.search);
  const pre = qp.get('code');
  if (pre) {
    // ✅ Mostrar loader inmediatamente si hay código pre-cargado
    showLoader();
    try {
      const decoded = atob(pre);
      if (decoded) {
        const ok = await tryLoginByCode(decoded);
        if (ok) { 
          const codeEl = $('#code');
          if (codeEl) {
            try { codeEl.value = decoded; } catch(e) {} 
          }
          return; 
        }
        else {
          hideLoader(); // ✅ Ocultar loader antes de mostrar acceso
          setQueryParam('code', null);
          showAccess();
          const msgEl = $('#msg');
          if (msgEl) {
            msgEl.textContent = 'El enlace contiene código inválido o expirado.';
            msgEl.classList.add('error');
          }
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
    
    // ✅ CRÍTICO: Verificar que el curso se guardó correctamente
    const verifyCourses = loadCustomCourses();
    const courseExists = hex in verifyCourses;
    console.log('[ADD COURSE] 🔍 Verificación post-guardado:', {
      hex: hex.substring(0,8),
      existe: courseExists,
      totalCursos: Object.keys(verifyCourses).length
    });
    
    if (!courseExists) {
      console.error('[ADD COURSE] ❌ ERROR: El curso NO se guardó en localStorage!');
      alert('⚠️ Error: El curso no se pudo guardar localmente. Intente de nuevo.');
      return;
    }
    
    // ✅ CRÍTICO: Reconstruir grid INMEDIATAMENTE con datos locales
    // Esto asegura que el curso se vea incluso si el refresh falla o es lento
    console.log('[ADD COURSE] Reconstruyendo grid inmediatamente...');
    buildMasterGrid();
    
    // Verificar que el curso aparece en el grid
    setTimeout(() => {
      const grid = $('#masterGrid');
      const courseCards = grid ? grid.querySelectorAll('.master-card') : [];
      console.log('[ADD COURSE] 🔍 Verificación en DOM:', {
        totalCards: courseCards.length,
        buscandoHex: hex.substring(0,8)
      });
      
      // Buscar el curso en el grid
      let found = false;
      courseCards.forEach(card => {
        const cardTitle = card.querySelector('strong')?.textContent || '';
        if (courseData.title && cardTitle.includes(courseData.title.substring(0, 20))) {
          found = true;
          console.log('[ADD COURSE] ✅ Curso encontrado en grid:', cardTitle);
        }
      });
      
      if (!found) {
        console.warn('[ADD COURSE] ⚠️ Curso no encontrado en grid, reconstruyendo de nuevo...');
        buildMasterGrid();
      }
    }, 100);
    
    // Cerrar modal inmediatamente para mejor UX
    modalAddCourse.classList.remove('show');
    formAddCourse.reset();
    inputCourseAccent.value = '#5aa9ff';
    inputCourseAccentHex.value = '#5aa9ff';
    
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'course_created', {
        'event_category': 'management',
        'event_label': tag
      });
    }
    
    // Mostrar mensaje de éxito
    alert(`✅ Curso "${tag}" creado exitosamente.\n\nCódigo para acceder: ${code}`);
    
    // ✅ Esperar un momento para que el servidor procese el guardado
    // Luego hacer refresh para sincronizar (sin bloquear la UI)
    setTimeout(async () => {
      try {
        console.log('[ADD COURSE] Sincronizando con servidor...');
        const refreshed = await refreshCustomCourses();
        // ✅ CRÍTICO: Reconstruir grid SIEMPRE después de crear curso
        // Esto asegura que se muestre incluso si hay problemas de sincronización
        buildMasterGrid();
        console.log('[ADD COURSE] ✅ Sincronización completada');
      } catch (e) {
        console.warn('[ADD COURSE] Error refrescando cursos después de crear:', e);
        // El curso ya está visible gracias al buildMasterGrid() anterior
        // Pero reconstruir de nuevo por si acaso
        buildMasterGrid();
      }
    }, 1000); // Esperar 1 segundo para que el servidor procese
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

/* ============ FUNCIONES DE PRUEBA GLOBALES ============ */
// Ejecutar en la consola para probar:
// testJSONP('88f62dd...') <- reemplazar con un hex real de algún curso
window.testJSONP = async function(hex) {
  console.log('🧪 TEST JSONP para hex:', hex);
  console.log('URL:', REMOTE_BASE_URL + '?hex=' + encodeURIComponent(hex) + '&callback=test_callback');
  
  return new Promise((resolve) => {
    const callbackName = 'test_callback_' + Date.now();
    const script = document.createElement('script');
    const url = REMOTE_BASE_URL + '?hex=' + encodeURIComponent(hex) + '&callback=' + callbackName;
    script.src = url;
    
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

