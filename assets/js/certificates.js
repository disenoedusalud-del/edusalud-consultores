// Generador de Certificados - EduSalud
// Maneja la generación de certificados y enlaces desde Google Apps Script

const CERT_CONFIG_KEY = 'edusalud_cert_config';
const SCRIPT_WEB_APP_URL_KEY = 'edusalud_script_web_app_url';

// Configuración por defecto
let certConfig = {
  scriptWebAppUrl: '',
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
  const slideInput = $('#select-slide-template');
  const sheetInput = $('#select-google-sheet');
  const folderOrigInput = $('#select-folder-originales');
  const folderProtInput = $('#select-folder-protegidos');
  const titleInput = $('#input-webinar-title');
  const dateInput = $('#input-webinar-date');
  const emailMsgInput = $('#textarea-email-message');
  const whatsappMsgInput = $('#textarea-whatsapp-message');
  
  certConfig = {
    scriptWebAppUrl: scriptUrlInput?.value.trim() || '',
    slideTemplateId: slideInput?.value || '',
    sheetId: sheetInput?.value || '',
    folderOriginalesId: folderOrigInput?.value || '',
    folderProtegidosId: folderProtInput?.value || '',
    webinarTitle: titleInput?.value.trim() || '',
    webinarDate: dateInput?.value.trim() || '',
    emailMessage: emailMsgInput?.value.trim() || '',
    whatsappMessage: whatsappMsgInput?.value.trim() || ''
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
    btn.textContent = '⏳ Probando...';
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
        statusEl.textContent = '✅ Conexión exitosa';
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
      statusEl.textContent = `❌ Error: ${error.message}`;
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
      btn.textContent = '🧪 Probar Conexión';
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
    btn.textContent = '🔄 Cargando...';
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
    btn.textContent = '🔄 Actualizar lista';
  }
  
  if (templates.length > 0) {
    showToast('success', 'Plantillas encontradas', `${templates.length} plantilla(s) encontrada(s)`);
  }
}

async function loadSheets() {
  const btn = $('#btn-refresh-sheets');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '🔄 Cargando...';
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
    btn.textContent = '🔄 Actualizar lista';
  }
  
  if (sheets.length > 0) {
    showToast('success', 'Hojas encontradas', `${sheets.length} hoja(s) encontrada(s)`);
  }
}

async function loadFolders() {
  const btn = $('#btn-refresh-folders');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '🔄 Cargando...';
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
    btn.textContent = '🔄 Actualizar lista';
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
    btn.textContent = '⏳ Creando...';
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
      btn.textContent = '➕ Crear nueva hoja';
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
    btn.textContent = '⏳ Creando...';
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
      btn.textContent = '➕ Crear nueva carpeta';
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
    btn.textContent = '⏳ Generando...';
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
        sheetId: certConfig.sheetId
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
      
      // ✅ Completar la barra al 100%
      progressBar.style.width = '100%';
      progressBar.style.background = '#4ade80';
      statusEl.textContent = '✅ Certificados generados exitosamente';
      
      let detailsHTML = `
        <div style="color:#4ade80; margin-top:8px;">
          ✅ Total procesados: ${data.total || 0}<br>
          ✅ Generados: ${data.generated || 0}<br>
      `;
      
      if (data.errors > 0) {
        detailsHTML += `<span style="color:#ff7a7a;">❌ Errores: ${data.errors}</span><br>`;
        
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
    
    statusEl.textContent = '❌ Error al generar certificados';
    progressBar.style.width = '100%';
    progressBar.style.background = '#ff7a7a';
    
    // Mostrar el error REAL con más detalles
    let errorMessage = `Error: ${error.name}\nMensaje: ${error.message}`;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = `No se pudo conectar al script. Esto puede ser porque:\n\n1. El script no está recibiendo la petición\n2. El script está tardando demasiado (timeout)\n3. Hay un error de red\n4. Hay un error en el script que lo hace fallar silenciosamente\n\n🔍 DIAGNÓSTICO:\n- Revisa los logs de Google Apps Script (Ver → Logs de ejecución)\n- Si NO aparece "[DOPOST] ===== Iniciando doPost =====", la petición no está llegando\n- Si SÍ aparece, verifica el error específico en los logs\n- Revisa la consola del navegador (F12) para más detalles`;
    } else if (error.message.includes('NetworkError') || error.message.includes('Network error')) {
      errorMessage = `Error de red. Verifica tu conexión a internet.`;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = `Error de conexión (TypeError). Verifica:\n1. El script está desplegado correctamente\n2. La URL es correcta\n3. El Web App permite acceso anónimo\n4. Revisa la consola del navegador para más detalles\n\nError específico: ${error.message}`;
    }
    
    detailsEl.textContent = errorMessage;
    showToast('error', 'Error al generar certificados', errorMessage);
  } finally {
    // ✅ Asegurar que el botón vuelva a su estado normal
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📄 Generar PDFs desde Plantilla';
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
    btn.textContent = '⏳ Generando...';
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
          whatsappMessage: certConfig.whatsappMessage || ''  // Mensaje personalizado de WhatsApp (opcional)
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
      
      statusEl.textContent = '✅ Enlaces generados exitosamente';
      progressBar.style.width = '100%';
      progressBar.style.background = '#4ade80';
      detailsEl.innerHTML = `
        <div style="color:#4ade80; margin-top:8px;">
          ✅ Total procesados: ${data.total || 0}<br>
          ✅ Enlaces creados: ${data.created || 0}<br>
          ${data.notFound > 0 ? `<span style="color:#fbbf24;">⚠️ No encontrados: ${data.notFound}</span>` : ''}
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
    statusEl.textContent = '❌ Error al generar enlaces';
    progressBar.style.width = '100%';
    progressBar.style.background = '#ff7a7a';
    detailsEl.textContent = error.message;
    showToast('error', 'Error', error.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🔗 Generar Enlaces';
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

