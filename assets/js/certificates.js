// Generador de Certificados - EduSalud
// Maneja la generación de certificados y enlaces desde Google Apps Script

const CERT_CONFIG_KEY = 'edusalud_cert_config';
const SCRIPT_WEB_APP_URL_KEY = 'edusalud_script_web_app_url';

// Configuración por defecto
let certConfig = {
  scriptWebAppUrl: '',
  certMode: 'webinar',   // 'webinar' o 'with-code'
  slideTemplateId: '',
  sheetId: '',
  folderOriginalesId: '',
  folderProtegidosId: '',
  webinarTitle: '',
  webinarDate: '',
  emailMessage: '',      // Mensaje personalizado de correo (opcional)
  whatsappMessage: ''    // Mensaje personalizado de WhatsApp (opcional)
};

// ===== FUNCIONES DE CONFIGURACIÓN =====

function loadCertConfig() {
  try {
    const saved = localStorage.getItem(CERT_CONFIG_KEY);
    const scriptUrl = localStorage.getItem(SCRIPT_WEB_APP_URL_KEY);
    
    if (saved) {
      certConfig = { ...certConfig, ...JSON.parse(saved) };
    }
    
    if (scriptUrl) {
      certConfig.scriptWebAppUrl = scriptUrl;
    }
    
    // Llenar inputs
    const scriptUrlInput = $('#input-script-web-app-url');
    if (scriptUrlInput) scriptUrlInput.value = certConfig.scriptWebAppUrl || '';
    
    const modeInput = $('#select-cert-mode');
    if (modeInput) modeInput.value = certConfig.certMode || 'webinar';
    
    const slideInput = $('#select-slide-template');
    if (slideInput && certConfig.slideTemplateId) {
      slideInput.value = certConfig.slideTemplateId;
    }
    
    const sheetInput = $('#select-google-sheet');
    if (sheetInput && certConfig.sheetId) {
      sheetInput.value = certConfig.sheetId;
    }
    
    const folderOrigInput = $('#select-folder-originales');
    if (folderOrigInput && certConfig.folderOriginalesId) {
      folderOrigInput.value = certConfig.folderOriginalesId;
    }
    
    const folderProtInput = $('#select-folder-protegidos');
    if (folderProtInput && certConfig.folderProtegidosId) {
      folderProtInput.value = certConfig.folderProtegidosId;
    }
    
    const titleInput = $('#input-webinar-title');
    if (titleInput) titleInput.value = certConfig.webinarTitle || '';
    
    const dateInput = $('#input-webinar-date');
    if (dateInput) dateInput.value = certConfig.webinarDate || '';
    
    const emailMsgInput = $('#textarea-email-message');
    if (emailMsgInput) emailMsgInput.value = certConfig.emailMessage || '';
    
    const whatsappMsgInput = $('#textarea-whatsapp-message');
    if (whatsappMsgInput) whatsappMsgInput.value = certConfig.whatsappMessage || '';
    
    console.log('[CERT] ✅ Configuración cargada');
  } catch (e) {
    console.error('[CERT] ❌ Error cargando configuración:', e);
  }
}

function saveCertConfig() {
  const scriptUrlInput = $('#input-script-web-app-url');
  const modeInput = $('#select-cert-mode');
  const slideInput = $('#select-slide-template');
  const sheetInput = $('#select-google-sheet');
  const folderOrigInput = $('#select-folder-originales');
  const folderProtInput = $('#select-folder-protegidos');
  const titleInput = $('#input-webinar-title');
  const dateInput = $('#input-webinar-date');
  const emailMsgInput = $('#textarea-email-message');
  const whatsappMsgInput = $('#textarea-whatsapp-message');
  
  // ✅ Sanitizar inputs (usar funciones de app.js si están disponibles, sino sanitizar manualmente)
  const sanitizeText = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str.trim();
    return div.innerHTML;
  };
  
  certConfig = {
    scriptWebAppUrl: sanitizeText(scriptUrlInput?.value || ''), // URL se sanitiza pero se valida después
    certMode: (modeInput?.value || 'webinar').trim(),
    slideTemplateId: (slideInput?.value || '').trim(),
    sheetId: (sheetInput?.value || '').trim(),
    folderOriginalesId: (folderOrigInput?.value || '').trim(),
    folderProtegidosId: (folderProtInput?.value || '').trim(),
    webinarTitle: sanitizeText(titleInput?.value || ''),
    webinarDate: sanitizeText(dateInput?.value || ''),
    emailMessage: sanitizeText(emailMsgInput?.value || ''),
    whatsappMessage: sanitizeText(whatsappMsgInput?.value || '')
  };
  
  localStorage.setItem(CERT_CONFIG_KEY, JSON.stringify(certConfig));
  if (certConfig.scriptWebAppUrl) {
    localStorage.setItem(SCRIPT_WEB_APP_URL_KEY, certConfig.scriptWebAppUrl);
  }
  
  // ✅ Validar botones después de guardar
  validatePDFGeneration();
  validateLinksGeneration();
  
  showToast('success', 'Configuración guardada', 'La configuración se ha guardado correctamente');
  console.log('[CERT] 💾 Configuración guardada:', certConfig);
}

function validateCertConfig() {
  if (!certConfig.scriptWebAppUrl) {
    showToast('warning', 'Configuración requerida', 'Configura la URL del Google Apps Script Web App');
    return false;
  }
  
  // Validar que la URL sea correcta
  if (!certConfig.scriptWebAppUrl.startsWith('https://script.google.com/')) {
    showToast('warning', 'URL inválida', 'La URL debe comenzar con https://script.google.com/');
    return false;
  }
  
  // Validar que termine en /exec (no /dev)
  if (!certConfig.scriptWebAppUrl.includes('/exec')) {
    console.warn('[CERT] ⚠️ La URL parece estar en modo desarrollo (/dev). Usa la URL de producción (/exec)');
  }
  
  return true;
}

// ===== FUNCIÓN DE PRUEBA DE CONEXIÓN =====

async function testScriptConnection() {
  if (!certConfig.scriptWebAppUrl) {
    showToast('warning', 'URL requerida', 'Configura la URL del Google Apps Script primero');
    return false;
  }
  
  const btn = $('#btn-test-connection');
  const statusEl = $('#test-connection-status');
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-hourglass"></i> Probando...';
  }
  
  if (statusEl) {
    statusEl.textContent = 'Probando conexión...';
    statusEl.style.color = 'var(--accent)';
  }
  
  try {
    const testUrl = `${certConfig.scriptWebAppUrl}?action=test`;
    console.log('[CERT] 🧪 Probando conexión:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('[CERT] 📡 Respuesta de prueba:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[CERT] ✅ Conexión exitosa:', data);
      
      if (statusEl) {
        statusEl.innerHTML = '<i class="ph ph-check-circle"></i> Conexión exitosa';
        statusEl.style.color = '#4ade80';
      }
      
      showToast('success', 'Conexión exitosa', 'El script está respondiendo correctamente');
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('[CERT] ❌ Error en prueba de conexión:', error);
    
    if (statusEl) {
      statusEl.innerHTML = `<i class="ph ph-x-circle"></i> Error: ${error.message}`;
      statusEl.style.color = '#ff7a7a';
    }
    
    let errorMsg = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMsg = 'No se pudo conectar. Verifica:\n1. La URL es correcta\n2. El script está desplegado\n3. El acceso es "Cualquiera, incluso anónimos"';
    }
    
    showToast('error', 'Error de conexión', errorMsg);
    return false;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-flask"></i> Probar Conexión';
    }
  }
}

// ===== FUNCIONES PARA LISTAR RECURSOS =====

async function listGoogleResources(type) {
  if (!validateCertConfig()) return [];
  
  try {
    const url = `${certConfig.scriptWebAppUrl}?action=list${type}`;
    console.log('[CERT] 🔗 Conectando a:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('[CERT] 📡 Respuesta recibida:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CERT] ❌ Error HTTP:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[CERT] 📦 Datos recibidos:', data);
    
    if (data.success) {
      return data.data || [];
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    console.error(`[CERT] ❌ Error listando ${type}:`, error);
    console.error('[CERT] URL intentada:', certConfig.scriptWebAppUrl);
    console.error('[CERT] Stack trace:', error.stack);
    
    let errorMessage = error.message;
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'No se pudo conectar al script. Verifica que:\n1. La URL del Web App sea correcta\n2. El script esté desplegado como Web App\n3. El acceso sea "Cualquiera, incluso anónimos"';
    }
    
    showToast('error', 'Error de conexión', errorMessage);
    return [];
  }
}

async function loadTemplates() {
  const btn = $('#btn-refresh-templates');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Cargando...';
  }
  
  const templates = await listGoogleResources('Slides');
  const select = $('#select-slide-template');
  
  if (select) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Seleccionar plantilla --</option>';
    
    templates.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = `${t.name} (${new Date(t.modified).toLocaleDateString()})`;
      option.title = t.url;
      select.appendChild(option);
    });
    
    if (currentValue) {
      select.value = currentValue;
    }
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Actualizar lista';
  }
  
  if (templates.length > 0) {
    showToast('success', 'Plantillas encontradas', `${templates.length} plantilla(s) encontrada(s)`);
  }
}

async function loadSheets() {
  const btn = $('#btn-refresh-sheets');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Cargando...';
  }
  
  const sheets = await listGoogleResources('Sheets');
  const select = $('#select-google-sheet');
  
  if (select) {
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Seleccionar hoja --</option>';
    
    sheets.forEach(s => {
      const option = document.createElement('option');
      option.value = s.id;
      option.textContent = `${s.name} (${new Date(s.modified).toLocaleDateString()})`;
      option.title = s.url;
      select.appendChild(option);
    });
    
    if (currentValue) {
      select.value = currentValue;
    }
  }
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Actualizar lista';
  }
  
  if (sheets.length > 0) {
    showToast('success', 'Hojas encontradas', `${sheets.length} hoja(s) encontrada(s)`);
  }
}

async function loadFolders() {
  const btn = $('#btn-refresh-folders');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Cargando...';
  }
  
  const folders = await listGoogleResources('Folders');
  const selectOrig = $('#select-folder-originales');
  const selectProt = $('#select-folder-protegidos');
  
  [selectOrig, selectProt].forEach(select => {
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="">-- Seleccionar carpeta --</option>';
      
      folders.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name;
        option.title = f.url;
        select.appendChild(option);
      });
      
      if (currentValue) {
        select.value = currentValue;
      }
    }
  });
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> Actualizar lista';
  }
  
  if (folders.length > 0) {
    showToast('success', 'Carpetas encontradas', `${folders.length} carpeta(s) encontrada(s)`);
  }
}

// ===== FUNCIONES PARA CREAR RECURSOS =====

async function createNewSheet() {
  if (!validateCertConfig()) return;
  
  const nameInput = $('#input-new-sheet-name');
  const name = nameInput?.value.trim();
  
  if (!name) {
    showToast('warning', 'Nombre requerido', 'Ingresa un nombre para la hoja');
    return;
  }
  
  const btn = $('#btn-create-sheet');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-hourglass"></i> Creando...';
  }
  
  try {
    console.log('[CERT] 🔗 Creando hoja:', name);
    const response = await fetch(certConfig.scriptWebAppUrl, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      credentials: 'omit',
      headers: { 
        'Content-Type': 'text/plain'  // ✅ Solo text/plain para evitar preflight CORS
      },
      body: JSON.stringify({
        action: 'createSheet',
        params: { 
          name,
          mode: certConfig.certMode || 'webinar'
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CERT] ❌ Error HTTP:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[CERT] 📦 Respuesta:', data);
    
    if (data.success) {
      showToast('success', 'Hoja creada', `Hoja "${data.name}" creada exitosamente`);
      if (nameInput) nameInput.value = '';
      await loadSheets();
      const select = $('#select-google-sheet');
      if (select) select.value = data.id;
      saveCertConfig();
      validatePDFGeneration();
      validateLinksGeneration();
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('[CERT] ❌ Error creando hoja:', error);
    showToast('error', 'Error', error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-plus"></i> Crear nueva hoja';
    }
  }
}

async function createNewFolder(folderType) {
  if (!validateCertConfig()) return;
  
  const nameInput = $(`#input-new-folder-${folderType}`);
  const name = nameInput?.value.trim();
  
  if (!name) {
    showToast('warning', 'Nombre requerido', 'Ingresa un nombre para la carpeta');
    return;
  }
  
  const btn = $(`#btn-create-folder-${folderType}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-hourglass"></i> Creando...';
  }
  
  try {
    console.log('[CERT] 🔗 Creando carpeta:', name);
    const response = await fetch(certConfig.scriptWebAppUrl, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      credentials: 'omit',
      headers: { 
        'Content-Type': 'text/plain'  // ✅ Solo text/plain para evitar preflight CORS
      },
      body: JSON.stringify({
        action: 'createFolder',
        params: { name }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CERT] ❌ Error HTTP:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[CERT] 📦 Respuesta:', data);
    
    if (data.success) {
      showToast('success', 'Carpeta creada', `Carpeta "${data.name}" creada exitosamente`);
      if (nameInput) nameInput.value = '';
      await loadFolders();
      const select = $(`#select-folder-${folderType}`);
      if (select) select.value = data.id;
      saveCertConfig();
      validatePDFGeneration();
      validateLinksGeneration();
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    console.error('[CERT] ❌ Error creando carpeta:', error);
    showToast('error', 'Error', error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-plus"></i> Crear nueva carpeta';
    }
  }
}

// ===== FUNCIONES DE VALIDACIÓN Y ESTADO DE BOTONES =====

function validatePDFGeneration() {
  const missing = [];
  
  if (!certConfig.scriptWebAppUrl) missing.push('URL del Google Apps Script');
  if (!certConfig.slideTemplateId) missing.push('Plantilla de Slides');
  if (!certConfig.sheetId) missing.push('Hoja de Cálculo');
  if (!certConfig.folderOriginalesId) missing.push('Carpeta para PDFs originales');
  
  const btn = $('#btn-generate-pdfs');
  const statusEl = $('#pdf-validation-status');
  const missingListEl = $('#pdf-missing-fields');
  
  if (missing.length > 0) {
    if (btn) btn.disabled = true;
    if (statusEl) statusEl.style.display = 'block';
    if (missingListEl) {
      missingListEl.innerHTML = missing.map(item => `<li>${item}</li>`).join('');
    }
    return false;
  } else {
    if (btn) btn.disabled = false;
    if (statusEl) statusEl.style.display = 'none';
    return true;
  }
}

function validateLinksGeneration() {
  const missing = [];
  
  if (!certConfig.scriptWebAppUrl) missing.push('URL del Google Apps Script');
  if (!certConfig.sheetId) missing.push('Hoja de Cálculo');
  if (!certConfig.folderProtegidosId) missing.push('Carpeta para PDFs protegidos');
  if (!certConfig.webinarTitle) missing.push('Título del Webinar/Evento');
  if (!certConfig.webinarDate) missing.push('Fecha del Evento');
  
  const btn = $('#btn-generate-links');
  const statusEl = $('#links-validation-status');
  const missingListEl = $('#links-missing-fields');
  
  if (missing.length > 0) {
    if (btn) btn.disabled = true;
    if (statusEl) statusEl.style.display = 'block';
    if (missingListEl) {
      missingListEl.innerHTML = missing.map(item => `<li>${item}</li>`).join('');
    }
    return false;
  } else {
    if (btn) btn.disabled = false;
    if (statusEl) statusEl.style.display = 'none';
    return true;
  }
}

// ===== FUNCIONES PARA DESHABILITAR/HABILITAR CONFIGURACIÓN =====

function disableCertConfig() {
  // Deshabilitar todos los campos de configuración
  const configElements = [
    'input-script-web-app-url',
    'select-slide-template',
    'select-google-sheet',
    'select-folder-originales',
    'select-folder-protegidos',
    'input-webinar-title',
    'input-webinar-date',
    'textarea-email-message',
    'textarea-whatsapp-message',
    'btn-create-sheet',
    'btn-create-folder-originales',
    'btn-create-folder-protegidos',
    'btn-refresh-slides',
    'btn-refresh-sheets',
    'btn-refresh-folders',
    'btn-refresh-folders-prot',
    'btn-save-cert-config',
    'btn-load-cert-config'
  ];
  
  configElements.forEach(id => {
    const el = $(`#${id}`);
    if (el) {
      el.disabled = true;
      el.style.opacity = '0.6';
      el.style.cursor = 'not-allowed';
    }
  });
  
  console.log('[CERT] 🔒 Campos de configuración deshabilitados');
}

function enableCertConfig() {
  // Habilitar todos los campos de configuración
  const configElements = [
    'input-script-web-app-url',
    'select-slide-template',
    'select-google-sheet',
    'select-folder-originales',
    'select-folder-protegidos',
    'input-webinar-title',
    'input-webinar-date',
    'textarea-email-message',
    'textarea-whatsapp-message',
    'btn-create-sheet',
    'btn-create-folder-originales',
    'btn-create-folder-protegidos',
    'btn-refresh-slides',
    'btn-refresh-sheets',
    'btn-refresh-folders',
    'btn-refresh-folders-prot',
    'btn-save-cert-config',
    'btn-load-cert-config'
  ];
  
  configElements.forEach(id => {
    const el = $(`#${id}`);
    if (el) {
      el.disabled = false;
      el.style.opacity = '1';
      el.style.cursor = '';
    }
  });
  
  console.log('[CERT] 🔓 Campos de configuración habilitados');
}

// ===== FUNCIONES PARA GENERAR CERTIFICADOS =====

async function generatePDFs() {
  if (!validateCertConfig()) return;
  
  if (!certConfig.slideTemplateId || !certConfig.sheetId || !certConfig.folderOriginalesId) {
    showToast('warning', 'Configuración incompleta', 'Completa la plantilla, hoja y carpeta de originales');
    return;
  }
  
  const progressEl = $('#cert-gen-progress');
  const statusEl = $('#cert-gen-status');
  const progressBar = $('#cert-gen-progress-bar');
  const detailsEl = $('#cert-gen-details');
  const btn = $('#btn-generate-pdfs');
  
  // ✅ Obtener referencia al spinner
  const spinnerEl = progressEl ? progressEl.querySelector('.loading-spinner') : null;
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-hourglass"></i> Generando...';
  }
  
  progressEl.style.display = 'block';
  statusEl.textContent = 'Iniciando generación de certificados...';
  progressBar.style.width = '5%';
  progressBar.style.background = '#5aa9ff';
  detailsEl.textContent = '';
  
  // ✅ Mostrar el spinner al iniciar
  if (spinnerEl) {
    spinnerEl.style.display = 'block';
  }
  
  // ✅ Deshabilitar campos de configuración durante la generación
  disableCertConfig();
  
  // ✅ Simular progreso mientras se procesa
  let progressInterval;
  let currentProgress = 5;
  const startTime = Date.now();
  
  // Función para simular progreso
  const simulateProgress = () => {
    const elapsed = Date.now() - startTime;
    // Calcular progreso basado en tiempo (máximo 90% hasta recibir respuesta)
    // Asumimos que puede tardar entre 2-10 segundos por certificado
    const estimatedTime = 5000; // 5 segundos base
    const progressFromTime = Math.min(90, 5 + (elapsed / estimatedTime) * 85);
    
    if (currentProgress < progressFromTime) {
      currentProgress = Math.min(progressFromTime, 90);
      progressBar.style.width = currentProgress + '%';
      statusEl.textContent = `Procesando certificados... (${Math.round(currentProgress)}%)`;
    }
  };
  
  // Actualizar progreso cada 500ms
  progressInterval = setInterval(simulateProgress, 500);
  
  try {
    console.log('[CERT] 🔗 Generando PDFs con parámetros:', {
      slideTemplateId: certConfig.slideTemplateId,
      outputFolderId: certConfig.folderOriginalesId,
      sheetId: certConfig.sheetId
    });
    
    console.log('[CERT] URL del script:', certConfig.scriptWebAppUrl);
    
    const requestBody = {
      action: 'generatePDFs',
      params: {
        slideTemplateId: certConfig.slideTemplateId,
        outputFolderId: certConfig.folderOriginalesId,
        sheetId: certConfig.sheetId,
        mode: certConfig.certMode || 'webinar'
      }
    };
    
    console.log('[CERT] Body a enviar:', JSON.stringify(requestBody));
    
    const response = await fetch(certConfig.scriptWebAppUrl, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      credentials: 'omit',
      headers: { 
        'Content-Type': 'text/plain'  // ✅ Solo text/plain para evitar preflight CORS
      },
      body: JSON.stringify(requestBody)
    });
    
    // ✅ Detener la simulación de progreso
    clearInterval(progressInterval);
    
    console.log('[CERT] 📡 Respuesta recibida:', response.status, response.statusText);
    console.log('[CERT] Headers de respuesta:', [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CERT] ❌ Error HTTP:', response.status, errorText);
      
      // Mejorar mensaje de error para Failed to fetch
      if (response.status === 0 || !response.status) {
        throw new Error('No se pudo conectar al script. Verifica que:\n1. El Web App esté configurado como "Cualquiera, incluso anónimos"\n2. El script esté desplegado correctamente\n3. La URL sea correcta');
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    console.log('[CERT] 📦 Respuesta completa:', data);
    
    if (data.success) {
      // ✅ Ocultar el spinner cuando termine exitosamente
      if (spinnerEl) {
        spinnerEl.style.display = 'none';
      }
      
      // ✅ Detener la simulación de progreso
      clearInterval(progressInterval);
      
      // ✅ Completar la barra al 100%
      progressBar.style.width = '100%';
      
      // ✅ Verificar si hubo timeout
      if (data.timeout) {
        progressBar.style.background = '#fbbf24'; // Amarillo para timeout
        statusEl.textContent = '⏰ Límite de tiempo alcanzado';
        
        let detailsHTML = `
          <div style="color:#fbbf24; margin-top:8px;">
            ⏰ El script alcanzó el límite de tiempo (6 minutos).<br>
            <i class="ph ph-check-circle"></i> Procesados: ${data.generated || 0}<br>
            <i class="ph ph-hourglass"></i> Pendientes: ${data.pending || 0}<br>
            ${data.errors > 0 ? `<span style="color:#ff7a7a;"><i class="ph ph-x-circle"></i> Errores: ${data.errors}</span><br>` : ''}
          </div>
          <div style="margin-top:12px; padding:12px; background:var(--bg-secondary); border-radius:8px; font-size:13px;">
            <strong><i class="ph ph-clipboard"></i> Próximos pasos:</strong><br>
            1. Verifica que los certificados procesados tengan <i class="ph ph-check-circle"></i> en la columna H<br>
            2. Haz clic en "Generar PDFs" nuevamente<br>
            3. El script omitirá los que ya tienen ✅ y procesará los pendientes<br>
            4. Repite hasta completar todos los certificados
          </div>
        `;
        
        if (data.message) {
          detailsHTML += `<div style="margin-top:8px; font-size:12px; color:var(--muted);">${data.message}</div>`;
        }
        
        detailsEl.innerHTML = detailsHTML;
        showToast('warning', 'Proceso parcialmente completado', `Procesados ${data.generated || 0} certificados. Ejecuta nuevamente para continuar.`);
      } else {
        progressBar.style.background = '#4ade80';
        statusEl.innerHTML = '<i class="ph ph-check-circle"></i> Certificados generados exitosamente';
        
        let detailsHTML = `
          <div style="color:#4ade80; margin-top:8px;">
            <i class="ph ph-check-circle"></i> Total procesados: ${data.total || 0}<br>
            <i class="ph ph-check-circle"></i> Generados: ${data.generated || 0}<br>
        `;
        
        if (data.errors > 0) {
          detailsHTML += `<span style="color:#ff7a7a;"><i class="ph ph-x-circle"></i> Errores: ${data.errors}</span><br>`;
          
          if (data.errorMessages && data.errorMessages.length > 0) {
            detailsHTML += '<div style="margin-top:8px; font-size:12px; color:var(--muted);">';
            detailsHTML += '<strong>Detalles de errores:</strong><ul style="margin:4px 0; padding-left:20px;">';
            data.errorMessages.forEach(msg => {
              detailsHTML += `<li>${msg}</li>`;
            });
            detailsHTML += '</ul></div>';
          }
        }
        
        if (data.message) {
          detailsHTML += `<div style="margin-top:8px; font-size:12px; color:var(--muted);">${data.message}</div>`;
        }
        
        detailsHTML += '</div>';
        detailsEl.innerHTML = detailsHTML;
        
        const successMsg = data.errors > 0 
          ? `Se generaron ${data.generated} certificados. Hubo ${data.errors} error(es).`
          : `Se generaron ${data.generated} certificados exitosamente.`;
        
        showToast('success', 'Certificados generados', successMsg);
      }
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    // ✅ Detener la simulación de progreso en caso de error
    clearInterval(progressInterval);
    
    // ✅ Ocultar el spinner en caso de error
    if (spinnerEl) {
      spinnerEl.style.display = 'none';
    }
    
    console.error('[CERT] ❌ Error COMPLETO generando certificados:');
    console.error('[CERT] Nombre del error:', error.name);
    console.error('[CERT] Mensaje:', error.message);
    console.error('[CERT] Stack:', error.stack);
    console.error('[CERT] Error completo (objeto):', error);
    console.error('[CERT] Error completo (stringify):', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    statusEl.innerHTML = '<i class="ph ph-x-circle"></i> Error al generar certificados';
    progressBar.style.width = '100%';
    progressBar.style.background = '#ff7a7a';
    
    // Mostrar el error REAL con más detalles
    let errorMessage = `Error: ${error.name}\nMensaje: ${error.message}`;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = `⏰ Timeout o error de conexión detectado.

Esto generalmente ocurre cuando:
1. El script alcanza el límite de tiempo (6 minutos)
2. Hay un error de red
3. El script está tardando demasiado en responder

🔍 DIAGNÓSTICO:
1. Revisa la hoja de cálculo:
   - ¿Hay certificados con ✅ en la columna H? → El script SÍ procesó algunos
   - Si SÍ hay ✅ → Ejecuta nuevamente, el script omitirá los procesados
   - Si NO hay ✅ → Puede ser un error de conexión real

2. Revisa los logs de Google Apps Script:
   - Ve a tu script en script.google.com
   - Ver → Logs de ejecución
   - Busca errores o mensajes de timeout

3. Si hay certificados procesados (con ✅), ejecuta nuevamente para continuar con los pendientes.`;
      
      // ✅ Mostrar como HTML en lugar de texto plano para mejor formato
      detailsEl.innerHTML = `<div style="white-space: pre-line; font-size: 13px;">${errorMessage}</div>`;
    } else if (error.message.includes('NetworkError') || error.message.includes('Network error')) {
      errorMessage = `Error de red. Verifica tu conexión a internet.`;
      detailsEl.textContent = errorMessage;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = `Error de conexión (TypeError). Verifica:\n1. El script está desplegado correctamente\n2. La URL es correcta\n3. El Web App permite acceso anónimo\n4. Revisa la consola del navegador para más detalles\n\nError específico: ${error.message}`;
      detailsEl.textContent = errorMessage;
    } else {
      detailsEl.textContent = errorMessage;
    }
    
    showToast('error', 'Error al generar certificados', errorMessage.replace(/\n/g, ' '));
  } finally {
    // ✅ Asegurar que el botón vuelva a su estado normal
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-file-text"></i> Generar PDFs desde Plantilla';
    }
    // ✅ Asegurar que no quede ningún indicador de carga activo
    // (el intervalo ya se detuvo arriba, pero por si acaso)
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    // ✅ Habilitar campos de configuración al finalizar
    enableCertConfig();
  }
}

async function generateLinks() {
  if (!validateCertConfig()) return;
  
  if (!certConfig.sheetId || !certConfig.folderProtegidosId || !certConfig.webinarTitle || !certConfig.webinarDate) {
    showToast('warning', 'Configuración incompleta', 'Completa la hoja, carpeta de protegidos, título y fecha del evento');
    return;
  }
  
  const progressEl = $('#cert-links-progress');
  const statusEl = $('#cert-links-status');
  const progressBar = $('#cert-links-progress-bar');
  const detailsEl = $('#cert-links-details');
  const btn = $('#btn-generate-links');
  
  // ✅ Obtener referencia al spinner
  const spinnerEl = progressEl ? progressEl.querySelector('.loading-spinner') : null;
  
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-hourglass"></i> Generando...';
  }
  
  progressEl.style.display = 'block';
  statusEl.textContent = 'Generando enlaces...';
  progressBar.style.width = '10%';
  detailsEl.textContent = '';
  
  // ✅ Mostrar el spinner al iniciar
  if (spinnerEl) {
    spinnerEl.style.display = 'block';
  }
  
  // ✅ Deshabilitar campos de configuración durante la generación
  disableCertConfig();
  
  try {
    console.log('[CERT] 🔗 Generando enlaces con parámetros:', {
      sheetId: certConfig.sheetId,
      folderProtegidosId: certConfig.folderProtegidosId,
      webinarTitle: certConfig.webinarTitle,
      webinarDate: certConfig.webinarDate,
      emailMessage: certConfig.emailMessage ? 'Personalizado' : 'Por defecto',
      whatsappMessage: certConfig.whatsappMessage ? 'Personalizado' : 'Por defecto'
    });
    
    const response = await fetch(certConfig.scriptWebAppUrl, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      credentials: 'omit',
      headers: { 
        'Content-Type': 'text/plain'  // ✅ Solo text/plain para evitar preflight CORS
      },
      body: JSON.stringify({
        action: 'generateLinks',
        params: {
          sheetId: certConfig.sheetId,
          folderProtegidosId: certConfig.folderProtegidosId,
          webinarTitle: certConfig.webinarTitle,
          webinarDate: certConfig.webinarDate,
          emailMessage: certConfig.emailMessage || '',      // Mensaje personalizado de correo (opcional)
          whatsappMessage: certConfig.whatsappMessage || '', // Mensaje personalizado de WhatsApp (opcional)
          mode: certConfig.certMode || 'webinar'            // Modo de certificado (webinar o with-code)
        }
      })
    });
    
    console.log('[CERT] 📡 Respuesta recibida:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CERT] ❌ Error HTTP:', response.status, errorText);
      
      // Mejorar mensaje de error para Failed to fetch
      if (response.status === 0 || !response.status) {
        throw new Error('No se pudo conectar al script. Verifica que:\n1. El Web App esté configurado como "Cualquiera, incluso anónimos"\n2. El script esté desplegado correctamente\n3. La URL sea correcta');
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    console.log('[CERT] 📦 Respuesta:', data);
    
    if (data.success) {
      // ✅ Ocultar el spinner cuando termine exitosamente
      if (spinnerEl) {
        spinnerEl.style.display = 'none';
      }
      
      statusEl.innerHTML = '<i class="ph ph-check-circle"></i> Enlaces generados exitosamente';
      progressBar.style.width = '100%';
      progressBar.style.background = '#4ade80';
      detailsEl.innerHTML = `
        <div style="color:#4ade80; margin-top:8px;">
          <i class="ph ph-check-circle"></i> Total procesados: ${data.total || 0}<br>
          <i class="ph ph-check-circle"></i> Enlaces creados: ${data.created || 0}<br>
          ${data.notFound > 0 ? `<span style="color:#fbbf24;"><i class="ph ph-warning"></i> No encontrados: ${data.notFound}</span>` : ''}
        </div>
      `;
      showToast('success', 'Enlaces generados', 'Los enlaces se han generado correctamente');
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    // ✅ Ocultar el spinner en caso de error
    if (spinnerEl) {
      spinnerEl.style.display = 'none';
    }
    
    console.error('[CERT] ❌ Error generando enlaces:', error);
    statusEl.innerHTML = '<i class="ph ph-x-circle"></i> Error al generar enlaces';
    progressBar.style.width = '100%';
    progressBar.style.background = '#ff7a7a';
    detailsEl.textContent = error.message;
    showToast('error', 'Error', error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-link"></i> Generar Enlaces';
    }
    // ✅ Habilitar campos de configuración al finalizar
    enableCertConfig();
  }
}

// ===== SETUP DE EVENT LISTENERS =====

function setupCertificatesListeners() {
  // Botones de configuración
  $('#btn-save-cert-config')?.addEventListener('click', () => {
    saveCertConfig();
  });
  
  $('#btn-load-cert-config')?.addEventListener('click', () => {
    loadCertConfig();
    showToast('success', 'Configuración cargada', 'La configuración se ha cargado correctamente');
  });
  
  // Botón de prueba de conexión
  $('#btn-test-connection')?.addEventListener('click', testScriptConnection);
  
  // ✅ Botón para mostrar código del script
  $('#btn-show-cert-script')?.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[CERT SCRIPT] Click en botón mostrar código');
    
    // Buscar el modal y elementos necesarios
    const modalCertScript = document.getElementById('modal-cert-script-code');
    const certScriptCode = document.getElementById('cert-script-code');
    
    if (!modalCertScript) {
      console.error('[CERT SCRIPT] Modal no encontrado');
      showToast('error', 'Error', 'No se encontró el modal del código del script');
      return;
    }
    
    // Mostrar el modal
    modalCertScript.style.display = 'flex';
    modalCertScript.classList.add('show');
    
    // Mostrar indicador de carga
    if (certScriptCode) {
      const codeElement = certScriptCode.querySelector('code');
      if (codeElement) {
        codeElement.innerHTML = '<i class="ph ph-hourglass"></i> Cargando código...';
      }
    }
    
    // Cargar el código de forma asíncrona
    setTimeout(function() {
      if (certScriptCode) {
        const codeElement = certScriptCode.querySelector('code');
        if (codeElement) {
          // Obtener el código del script desde el HTML (variable global)
          const scriptCode = window.GOOGLE_APPS_SCRIPT_CODE || '';
          if (scriptCode) {
            codeElement.textContent = scriptCode;
            console.log('[CERT SCRIPT] Código cargado en code element, longitud:', scriptCode.length);
          } else {
            codeElement.textContent = '// Error: No se pudo cargar el código del script';
            console.error('[CERT SCRIPT] GOOGLE_APPS_SCRIPT_CODE no está disponible');
          }
        } else {
          // Si no hay elemento code, poner el código directamente en el pre
          const scriptCode = window.GOOGLE_APPS_SCRIPT_CODE || '';
          if (scriptCode) {
            certScriptCode.textContent = scriptCode;
            console.log('[CERT SCRIPT] Código cargado directamente en pre, longitud:', scriptCode.length);
          } else {
            certScriptCode.textContent = '// Error: No se pudo cargar el código del script';
            console.error('[CERT SCRIPT] GOOGLE_APPS_SCRIPT_CODE no está disponible');
          }
        }
      }
    }, 50);
    
    console.log('[CERT SCRIPT] Modal mostrado');
  });
  
  // Botones de listar recursos
  $('#btn-refresh-templates')?.addEventListener('click', loadTemplates);
  $('#btn-refresh-sheets')?.addEventListener('click', loadSheets);
  $('#btn-refresh-folders')?.addEventListener('click', loadFolders);
  $('#btn-refresh-folders-prot')?.addEventListener('click', loadFolders);
  $('#btn-refresh-folders-prot')?.addEventListener('click', loadFolders);
  
  // Botones de crear recursos
  $('#btn-create-sheet')?.addEventListener('click', createNewSheet);
  $('#btn-create-folder-originales')?.addEventListener('click', () => createNewFolder('originales'));
  $('#btn-create-folder-protegidos')?.addEventListener('click', () => createNewFolder('protegidos'));
  
  // Botones de generar
  $('#btn-generate-pdfs')?.addEventListener('click', generatePDFs);
  $('#btn-generate-links')?.addEventListener('click', generateLinks);
  
  // Guardar configuración al cambiar selects y validar botones
  ['select-slide-template', 'select-google-sheet', 'select-folder-originales', 
   'select-folder-protegidos', 'input-webinar-title', 'input-webinar-date',
   'input-script-web-app-url'].forEach(id => {
    const el = $(`#${id}`);
    if (el) {
      el.addEventListener('change', () => {
        saveCertConfig();
        // Validar botones después de cada cambio
        validatePDFGeneration();
        validateLinksGeneration();
      });
    }
  });
  
  // Guardar configuración al cambiar el modo
  const modeSelect = $('#select-cert-mode');
  if (modeSelect) {
    modeSelect.addEventListener('change', () => {
      saveCertConfig();
      showToast('info', 'Modo actualizado', 'El modo se ha guardado. Recuerda que la estructura de la hoja de cálculo debe coincidir con el modo seleccionado.');
    });
  }
  
  // Guardar configuración al cambiar textareas (input event para capturar cambios en tiempo real)
  ['textarea-email-message', 'textarea-whatsapp-message'].forEach(id => {
    const el = $(`#${id}`);
    if (el) {
      el.addEventListener('input', () => {
        saveCertConfig();
        // Los mensajes no afectan la validación de botones, pero se guardan
      });
    }
  });
  
  // ✅ Validar botones al cargar la configuración inicial
  setTimeout(() => {
    validatePDFGeneration();
    validateLinksGeneration();
  }, 500);
  
  // Cargar configuración cuando se muestra la vista
  const certView = $('#master-certificates-view');
  if (certView) {
    const observer = new MutationObserver((mutations) => {
      if (!certView.classList.contains('hidden')) {
        loadCertConfig();
      }
    });
    observer.observe(certView, { attributes: true, attributeFilter: ['class'] });
  }
  
  console.log('[CERT] ✅ Event listeners configurados');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCertificatesListeners);
} else {
  setupCertificatesListeners();
}

