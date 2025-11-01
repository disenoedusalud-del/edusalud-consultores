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
function downloadFile(url) { window.open(url, '_blank', 'noopener'); }

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
const REMOTE_BASE_URL = 'https://script.google.com/macros/s/AKfycbyx0l1-H93a0wfML47fHrMVKA-P-huaBI3npJUepD0UgwxNZZfJEi4EX2B2IaN5Tk4D/exec';
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
    const callbackName = '_gas_jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
    const timeout = setTimeout(() => {
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
  if (!hasRemote()) return false;
  try {
    const filesJson = JSON.stringify(Array.isArray(files) ? files : []);
    console.log('[SAVE] Enviando a remoto - hex:', hex.substring(0,8), 'archivos:', files.length);
    console.log('[SAVE] Datos a guardar:', filesJson.substring(0, 100) + '...');
    
    // Google Apps Script funciona mejor con formularios HTML que con fetch
    const iframe = document.createElement('iframe');
    iframe.name = 'hiddenFrame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = REMOTE_BASE_URL;
    form.target = 'hiddenFrame';
    
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
    
    form.submit();
    console.log('[SAVE] ✅ Formulario enviado a:', REMOTE_BASE_URL);
    
    // Limpiar después de enviar y forzar refresh múltiples veces (para asegurar sincronización)
    setTimeout(() => {
      if (form.parentNode) document.body.removeChild(form);
      if (iframe.parentNode) document.body.removeChild(iframe);
      
      // Forzar refresh inmediato y múltiples intentos para asegurar sincronización
      // El refresh inmediato es crítico para que otros navegadores vean los cambios
      const refreshAttempts = [500, 1000, 2000, 4000];
      refreshAttempts.forEach((delay, index) => {
        setTimeout(async () => {
          console.log(`[SAVE] Refrescando después de guardar (intento ${index + 1}/${refreshAttempts.length} - ${delay}ms)...`);
          
          // Forzar lectura desde remoto sin usar caché
          const remote = await remoteGetFiles(hex).catch(e => {
            console.warn('[SAVE] Error obteniendo datos remotos:', e);
            return null;
          });
          
          if (remote && Array.isArray(remote)) {
            const current = getFilesForHex(hex);
            const remoteStr = stableStringify(remote);
            const currentStr = stableStringify(current);
            
            console.log('[SAVE] Comparación - Remoto:', remote.length, 'vs Local:', current.length);
            
            // SIEMPRE sincronizar con remoto (remoto es la fuente de verdad después de guardar)
            if (remoteStr !== currentStr) {
              console.log('[SAVE] ✅ Desincronización detectada, forzando sincronización...');
              saveFilesOverride(hex, remote);
              
              // Si remoto está vacío y hay base, limpiar override
              const base = getBaseFilesForHex(hex);
              if (remote.length === 0 && base.length > 0) {
                clearFilesOverride(hex);
              }
              
              console.log('[SAVE] ✅ Sincronizado, reconstruyendo grid...');
              buildMasterGrid();
            } else {
              console.log('[SAVE] ✅ Ya sincronizado');
            }
          }
        }, delay);
      });
    }, 2000);
    
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
const PERIODIC_REFRESH_INTERVAL_MS = 10000; // 10 segundos

function startPeriodicRefresh(currentHex = null) {
  // Detener cualquier refresh periódico existente
  stopPeriodicRefresh();
  
  if (!hasRemote()) return;
  
  console.log('[PERIODIC] Iniciando refresh periódico cada', PERIODIC_REFRESH_INTERVAL_MS / 1000, 'segundos');
  
  periodicRefreshInterval = setInterval(async () => {
    try {
      if (currentHex === MASTER_HASH) {
        // Refresh de todos los cursos para vista maestra
        console.log('[PERIODIC] Refrescando todos los cursos...');
        const hexes = Object.keys(ACCESS_HASH_MAP).filter(h => h !== MASTER_HASH);
        const results = await Promise.allSettled(
          hexes.map(h => refreshFromRemoteSilent(h).catch(e => {
            console.warn('[PERIODIC] Error refrescando', h.substring(0, 8), ':', e);
            return false;
          }))
        );
        const anyUpdated = results.some(r => 
          r.status === 'fulfilled' && r.value === true
        );
        if (anyUpdated) {
          console.log('[PERIODIC] ✅ Cambios detectados, actualizando vista...');
          buildMasterGrid();
        }
      } else if (currentHex && ACCESS_HASH_MAP[currentHex]) {
        // Refresh del curso actual
        console.log('[PERIODIC] Refrescando curso actual...');
        const updated = await refreshFromRemoteSilent(currentHex).catch(e => {
          console.warn('[PERIODIC] Error:', e);
          return false;
        });
        if (updated) {
          console.log('[PERIODIC] ✅ Cambios detectados, actualizando vista...');
          renderCourse(currentHex);
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
  const data = ACCESS_HASH_MAP[keyHex];
  if (!data) return;

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
    btn.addEventListener('click', () => downloadFile(item.url));
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
  grid.innerHTML = '';

  Object.entries(ACCESS_HASH_MAP).forEach(([hex, data]) => {
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
    header.appendChild(t); header.appendChild(open);
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
      btnOpen.addEventListener('click', () => downloadFile(item.url));

      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn secondary';
      btnRemove.type = 'button';
      btnRemove.textContent = 'Quitar';
      btnRemove.addEventListener('click', () => {
        const next = files.slice();
        next.splice(idx, 1);
        saveFilesOverride(hex, next);
        remoteSaveFiles(hex, next);
        buildMasterGrid();
      });

      actions.appendChild(btnOpen);
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
      remoteSaveFiles(hex, next);
      buildMasterGrid();
    });

    // formulario para agregar nuevo link
    const addWrap = document.createElement('div');
    addWrap.style.marginTop = '12px';
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

    const inputUrl = document.createElement('input');
    inputUrl.className = 'input';
    inputUrl.type = 'url';
    inputUrl.placeholder = 'URL (https://...)';

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
      remoteSaveFiles(hex, next);
      buildMasterGrid();
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
    btnRestore.addEventListener('click', () => {
      if (!confirm('¿Restaurar la lista original de enlaces? Se perderán los cambios locales.')) return;
      clearFilesOverride(hex);
      remoteSaveFiles(hex, getFilesForHex(hex));
      buildMasterGrid();
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
    
    const current = getFilesForHex(hex);
    const base = getBaseFilesForHex(hex); // Datos originales del código
    const currentStr = stableStringify(current);
    const remoteStr = stableStringify(remote);
    const baseStr = stableStringify(base);
    
    console.log('[REFRESH] Estado actual:');
    console.log('[REFRESH] - Remoto:', remote.length, 'archivos');
    console.log('[REFRESH] - Local:', current.length, 'archivos');
    console.log('[REFRESH] - Base:', base.length, 'archivos');
    
    // CRÍTICO: Si remoto es diferente a local, actualizar SIEMPRE (sin excepciones)
    // Esto asegura que los cambios remotos siempre prevalezcan
    const stringsMatch = remoteStr === currentStr;
    
    if (!stringsMatch) {
      console.log('[REFRESH] ✅ CAMBIOS DETECTADOS - Remoto diferente a Local');
      console.log('[REFRESH] Remoto JSON:', remoteStr.substring(0, 200));
      console.log('[REFRESH] Local JSON:', currentStr.substring(0, 200));
      
      // SIEMPRE sincronizar con remoto (remoto es la fuente de verdad)
      saveFilesOverride(hex, remote);
      
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
    
    // Caso: remoto tiene menos elementos que local (se borraron enlaces)
    if (remote.length < current.length) {
      console.log('[REFRESH] ⚠️ Remoto tiene MENOS elementos que local');
      console.log('[REFRESH] Forzando sincronización con remoto...');
      saveFilesOverride(hex, remote);
      if (remote.length === 0 && base.length > 0) {
        clearFilesOverride(hex);
      }
      return true;
    }
    
    console.log('[REFRESH] ✅ Sin cambios, datos sincronizados');
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

    // master
    if (hex === MASTER_HASH) {
      // Mostrar loader inmediatamente
      showLoader();
      
      // ✅ NUEVO: Esperar a que termine el refresh ANTES de cerrar el loader
      if (hasRemote()) {
        console.log('[SYNC] Iniciando refresh de todos los cursos...');
        const hexes = Object.keys(ACCESS_HASH_MAP).filter(h => h !== MASTER_HASH);
        console.log('[SYNC] Total de cursos a refrescar:', hexes.length);
        
        // Iniciar refresh
        await Promise.allSettled(hexes.map((h, index) => {
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
        }))
          .then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`[SYNC] Refresh completado: ${successful} exitosos, ${failed} fallidos`);
          })
          .catch(e => {
            console.warn('[SYNC] Error general en refresh:', e);
          });
        
        console.log('[SYNC] ✅ Refresh completado, cerrando loader...');
      }
      
      // Ejecutar animación de loader ahora que ya tenemos los datos
      try { 
        await runLoader(); 
      } catch (e) {}
      
      clearAttempts();
      setQueryParam('code', btoa(code));
      buildMasterGrid();
      setupMasterSearch();
      $('#year_master').textContent = new Date().getFullYear();
      showMaster();
      
      return true;
    }

    // normal
    if (ACCESS_HASH_MAP[hex]) {
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
      try { 
        await runLoader(); 
      } catch (e) {}
      
      currentKeyHex = hex;
      clearAttempts();
      setQueryParam('code', btoa(code));
      renderCourse(hex);
      showContent();
      
      return true;
    } else {
      const attempts = recordAttempt();
      msg.textContent = 'Código inválido. Verifique y vuelva a intentar.';
      msg.classList.add('error');
      maybeShowAttemptsWarning();
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

/* ============ init ============ */
(async function init(){
  $('#year').textContent = new Date().getFullYear();
  $('#year_master').textContent = new Date().getFullYear();

  const qp = new URLSearchParams(location.search);
  const pre = qp.get('code');
  if (pre) {
    try {
      const decoded = atob(pre);
      if (decoded) {
        const ok = await tryLoginByCode(decoded);
        if (ok) { try { $('#code').value = decoded; } catch(e) {} return; }
        else {
          setQueryParam('code', null);
          showAccess();
          $('#msg').textContent = 'El enlace contiene código inválido o expirado.';
          $('#msg').classList.add('error');
          return;
        }
      }
    } catch (e) { console.warn('Parámetro code inválido', e); }
  }
  showAccess();
  maybeShowAttemptsWarning();
})();

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

