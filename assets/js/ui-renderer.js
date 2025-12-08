/* ============ MÓDULO DE RENDERIZADO UI ============ */
// ✅ Este módulo contiene funciones para renderizar la interfaz de usuario
// ✅ Versión: 1.0 - Extraído de app.js para mejor modularidad
// ⚠️ NOTA: Este módulo depende de funciones globales definidas en app.js
// Las funciones se exponen globalmente para mantener compatibilidad

/* ===================== FUNCIONES DE RENDERIZADO ===================== */

/**
 * ✅ Renderizar un curso individual (vista de contenido)
 * @param {string} keyHex - Hash del curso a renderizar
 * 
 * ⚠️ DEPENDENCIAS GLOBALES (definidas en app.js):
 * - getMergedAccessHashMap()
 * - getFilesForHex()
 * - shouldRenderCourse()
 * - setupFilesSearch()
 * - setupLazyImages()
 * - addCacheBuster()
 * - escapeHTML()
 * - initFirestoreRealtime()
 * - log(), warn()
 */
function renderCourse(keyHex) {
  // ✅ Usar función global si existe, sino usar función local
  const getMergedAccessHashMap = window.getMergedAccessHashMap || (() => ({}));
  const mergedMap = getMergedAccessHashMap();
  const data = mergedMap[keyHex];
  if (!data) return;

  // ✅ Verificar si es necesario renderizar (memoización)
  const lastRenderCourseHex = window.lastRenderCourseHex;
  const shouldForceRender = lastRenderCourseHex === null;

  const shouldRenderCourse = window.shouldRenderCourse || (() => true);
  if (!shouldForceRender && !shouldRenderCourse(keyHex, data)) {
    // ✅ CRÍTICO: Aunque no se renderice todo, SIEMPRE actualizar la lista de archivos
    const $ = window.$ || ((s) => document.querySelector(s));
    const list = $('#filelist');
    if (list) {
      list.innerHTML = '';
      const getFilesForHex = window.getFilesForHex || (() => []);
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

      const escapeHTML = window.escapeHTML || ((s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      const downloadFile = window.downloadFile || ((url) => window.open(url, '_blank', 'noopener'));

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
        filesCountEl.textContent = `${(uniqueFiles || []).length} archivo(s)`;
      }
    }
    return;
  }

  // ✅ Guardar hex globalmente para el botón de sincronización forzada
  window.currentCourseHex = keyHex;

  // ✅ FIREBASE: Inicializar listener en tiempo real (solo si no está activo)
  if (typeof window.initFirestoreRealtime === 'function') {
    // Limpiar flag de renderizado antes de inicializar
    window.isRenderingCourse = null;
    window.initFirestoreRealtime(keyHex);
  }

  const $ = window.$ || ((s) => document.querySelector(s));
  const log = window.log || console.log;
  const warn = window.warn || console.warn;
  const escapeHTML = window.escapeHTML || ((s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

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
  if (list) {
    list.innerHTML = '';
    const getFilesForHex = window.getFilesForHex || (() => []);
    const files = getFilesForHex(keyHex);

    // ✅ Configurar búsqueda de archivos
    if (typeof window.setupFilesSearch === 'function') {
      window.setupFilesSearch(keyHex, list);
    }

    // ✅ Actualizar contador de archivos
    const filesCountEl = $('#files-count');
    if (filesCountEl) {
      filesCountEl.textContent = `${(files || []).length} archivo(s)`;
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

    const downloadFile = window.downloadFile || ((url) => window.open(url, '_blank', 'noopener'));

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
    if (typeof window.setupLazyImages === 'function') {
      window.setupLazyImages(list);
    }
  }

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
        const addCacheBuster = window.addCacheBuster || ((url) => url);
        window.setCardImage(wrapper, addCacheBuster(data.card.img));
      }
    }
  } catch (e) {
    if (typeof warn === 'function') {
      warn('No se pudo insertar la tarjeta:', e);
    }
  }
}

/**
 * ✅ Actualizar SOLO la lista de archivos sin pasar por memoización
 * @param {string} keyHex - Hash del curso
 */
function updateFileListOnly(keyHex) {
  const $ = window.$ || ((s) => document.querySelector(s));
  const list = $('#filelist');
  if (!list) {
    if (typeof log === 'function') {
      log('[UPDATE FILE LIST] ⚠️ Lista de archivos no encontrada');
    }
    return;
  }

  if (typeof log === 'function') {
    log('[UPDATE FILE LIST] 🔄 Actualizando lista de archivos para:', keyHex.substring(0, 8));
  }

  list.innerHTML = '';
  const getFilesForHex = window.getFilesForHex || (() => []);
  const files = getFilesForHex(keyHex);

  // ✅ PREVENIR DUPLICADOS
  const seen = new Set();
  const uniqueFiles = (files || []).filter(item => {
    const key = item.firebaseId || `${item.url}|||${item.label}`;
    if (seen.has(key)) {
      if (typeof log === 'function') {
        log('[UPDATE FILE LIST] ⚠️ Duplicado filtrado:', item.label);
      }
      return false;
    }
    seen.add(key);
    return true;
  });

  const escapeHTML = window.escapeHTML || ((s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const downloadFile = window.downloadFile || ((url) => window.open(url, '_blank', 'noopener'));

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
    filesCountEl.textContent = `${(uniqueFiles || []).length} archivo(s)`;
  }

  // ✅ Reconfigurar búsqueda de archivos
  if (typeof window.setupFilesSearch === 'function') {
    window.setupFilesSearch(keyHex, list);
  }

  if (typeof log === 'function') {
    log('[UPDATE FILE LIST] ✅ Lista actualizada:', uniqueFiles.length, 'archivos');
  }
}

/* ===================== EXPOSICIÓN GLOBAL ===================== */
// ✅ Exponer funciones globalmente para compatibilidad con código existente
window.UIRenderer = {
  renderCourse: renderCourse,
  updateFileListOnly: updateFileListOnly
};

// ✅ También exponer funciones directamente en window para compatibilidad
window.renderCourse = renderCourse;
window.updateFileListOnly = updateFileListOnly;

// ⚠️ NOTA: buildUserGrid, buildMasterGrid y renderCourseEmailsList son funciones muy grandes
// que dependen de muchas funciones globales. Por ahora, se mantienen en app.js
// y se pueden mover en una segunda fase de refactorización más cuidadosa.

