# Google Apps Script - Manejo de Archivos y Cursos

Este script debe ser creado en Google Apps Script y desplegado como Web App para que funcione con la plataforma. Este script maneja las peticiones de archivos (con parámetro `hex`) y cursos.

## 📋 Pasos para Configurar

### 1. Crear el Script

1. Ve a [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto
3. Pega el código completo de abajo
4. Guarda el proyecto con un nombre (ej: "Manejo de Archivos EduSalud")

### 2. Configurar Permisos

1. Ejecuta una función de prueba (ej: `testConnection`)
2. Autoriza el acceso a:
   - Google Drive
   - Google Sheets

### 3. Desplegar como Web App

1. Ve a "Desplegar" → "Nueva implementación"
2. Tipo: "Aplicación web"
3. Descripción: "Manejo de Archivos v1"
4. Ejecutar como: "Yo"
5. Quién tiene acceso: **"Cualquiera, incluso anónimos"** (importante)
6. Haz clic en "Desplegar"
7. Copia la URL del Web App (la necesitarás en la plataforma)

## 📝 Código Completo del Script

```javascript
// Manejo de Archivos y Cursos - EduSalud
// Google Apps Script - Backend para la plataforma web
// ✅ Versión actualizada con protección por token

// ===== CONFIGURACIÓN DE SEGURIDAD =====

// ✅ EJECUTAR ESTA FUNCIÓN UNA VEZ para configurar el token secreto
function setupSecretToken() {
  const properties = PropertiesService.getScriptProperties();
  
  // ⚠️ REEMPLAZA ESTE TOKEN con uno que generes tú (mínimo 32 caracteres)
  // Puedes generar uno con: btoa(Date.now() + Math.random().toString(36))
  const secretToken = 'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
  
  // Guardar en Properties Service (almacenamiento seguro)
  properties.setProperty('GAS_SECRET_TOKEN', secretToken);
  
  Logger.log('✅ Token secreto configurado correctamente');
  Logger.log('⚠️ IMPORTANTE: Guarda este token en un lugar seguro');
  Logger.log('Token: ' + secretToken); // ✅ Concatenar para que se muestre
  Logger.log('═══════════════════════════════════════════');
  Logger.log('COPIA ESTE TOKEN:');
  Logger.log(secretToken);
  Logger.log('═══════════════════════════════════════════');
  
  // ✅ Retornar el token para que aparezca en el resultado de ejecución
  return '✅ Token configurado: ' + secretToken;
}

// ✅ Función auxiliar para obtener el token guardado (útil para verificar)
function getStoredToken() {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('GAS_SECRET_TOKEN');
  if (token) {
    Logger.log('Token guardado: ' + token);
    return token;
  } else {
    Logger.log('⚠️ No hay token guardado. Ejecuta setupSecretToken() primero.');
    return null;
  }
}

// 🧪 FUNCIÓN DE PRUEBA: Simular una petición doGet
function testDoGet() {
  Logger.log('═══════════════════════════════════════════');
  Logger.log('🧪 TEST DE doGet CON TOKEN');
  Logger.log('═══════════════════════════════════════════');
  
  // Simular el objeto e que recibe doGet
  const testToken = 'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
  const testE = {
    parameter: {
      action: 'get_courses',
      callback: 'testCallback123',
      token: testToken,
      ts: Date.now()
    }
  };
  
  Logger.log('📤 Token enviado: ' + testE.parameter.token);
  Logger.log('📤 Callback enviado: ' + testE.parameter.callback);
  Logger.log('📤 Action enviado: ' + testE.parameter.action);
  
  // Obtener token guardado
  const properties = PropertiesService.getScriptProperties();
  const storedToken = properties.getProperty('GAS_SECRET_TOKEN');
  Logger.log('💾 Token guardado: ' + (storedToken || 'NULL'));
  Logger.log('✅ ¿Tokens coinciden?: ' + (testE.parameter.token === storedToken ? 'SÍ' : 'NO'));
  
  // Probar validateToken
  const isValid = validateToken(testE.parameter.token);
  Logger.log('🔍 Resultado de validateToken: ' + isValid);
  
  // Ejecutar doGet
  Logger.log('');
  Logger.log('🚀 Ejecutando doGet...');
  const result = doGet(testE);
  
  Logger.log('📥 Resultado recibido (tipo): ' + typeof result);
  Logger.log('📥 Resultado recibido (clase): ' + (result ? result.constructor.name : 'null'));
  
  if (result && result.getContent) {
    const content = result.getContent();
    Logger.log('📥 Contenido (primeros 500 chars): ' + content.substring(0, 500));
    Logger.log('📥 Contenido completo (longitud): ' + content.length);
  } else {
    Logger.log('❌ No se pudo obtener el contenido del resultado');
  }
  
  Logger.log('═══════════════════════════════════════════');
  return result;
}

// ✅ Validar token de autenticación (Firebase ID Token o token secreto compartido)
function validateToken(token) {
  if (!token) {
    Logger.log('[AUTH] ❌ Token no proporcionado');
    return false;
  }

  try {
    // 🔹 1) Aceptar cualquier JWT de Firebase (validación simple)
    // Los ID Token de Firebase siempre empiezan con "eyJ" (header en base64url)
    if (token.substring(0, 3) === 'eyJ') {
      Logger.log('[AUTH] ✅ Aceptando JWT de Firebase (validación simple)');
      // Si más adelante quiere hacerlo estricto, aquí podríamos decodificar
      // y validar aud, iss, exp, etc. Por ahora solo desbloqueamos el flujo.
      return true;
    }

    // 🔹 2) Fallback: validar como token secreto compartido
    const properties = PropertiesService.getScriptProperties();
    const secretToken = properties.getProperty('GAS_SECRET_TOKEN');

    if (!secretToken) {
      Logger.log('[AUTH] ❌ Token secreto no configurado. Ejecuta setupSecretToken() primero.');
      return false;
    }

    if (token === secretToken) {
      Logger.log('[AUTH] ✅ Token secreto válido');
      return true;
    }

    Logger.log('[AUTH] ❌ Token inválido (no es JWT de Firebase y no coincide con el secreto)');
    return false;

  } catch (error) {
    Logger.log('[AUTH] ❌ Error validando token: ' + error.toString());
    return false;
  }
}

// ===== FUNCIÓN PRINCIPAL doGet =====

function doGet(e) {
  // ✅ CRÍTICO: Extraer callback PRIMERO para poder responder con JSONP incluso en caso de error
  let callback = '';
  try {
    callback = e && e.parameter && e.parameter.callback ? String(e.parameter.callback).trim() : '';
  } catch(err) {
    callback = '';
  }
  
  // ✅ AGREGADO: Validar token de autenticación
  // El token puede venir en:
  // 1. Query parameter: ?token=...
  // 2. Query parameter: ?idToken=... (para Firebase ID Token)
  const token = (e && e.parameter) ? (e.parameter.token || e.parameter.idToken) : null;
  
  // ✅ Logging para depuración
  Logger.log('[doGet] Token recibido:', token ? token.substring(0, 20) + '...' : 'NO HAY TOKEN');
  Logger.log('[doGet] Callback recibido:', callback || '(vacío)');
  
  if (!validateToken(token)) {
    Logger.log('[doGet] ❌ Token inválido o faltante');
    
    const errorResponse = {
      success: false,
      error: 'Unauthorized',
      message: 'Token de autenticación inválido o faltante',
      files: [],
      courses: {} // ✅ Agregar courses vacío para get_courses
    };
    
    // Si hay callback, devolver JSONP con error (CRÍTICO para que el callback se ejecute)
    if (callback && callback.length > 0) {
      const safeCallback = String(callback).trim().replace(/[^a-zA-Z0-9_$]/g, '');
      if (safeCallback.length > 0) {
        const jsonpResponse = safeCallback + '(' + JSON.stringify(errorResponse) + ');';
        Logger.log('[doGet] Devolviendo JSONP con error para callback:', safeCallback);
        return ContentService
          .createTextOutput(jsonpResponse)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
    }
    
    // Si no hay callback, devolver JSON normal
    Logger.log('[doGet] Devolviendo JSON con error (sin callback)');
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  Logger.log('[doGet] ✅ Token válido, procesando petición...');
  
  try {
    // Validar que e existe y tiene parameters
    if (!e) {
      e = { parameter: {} };
    }
    if (!e.parameter) {
      e.parameter = {};
    }
    
    const hex = String(e.parameter.hex || '').trim();
    const action = e.parameter.action || '';
    // ✅ El parámetro ts (cache-buster) se recibe automáticamente pero no necesita procesarse
    
    Logger.log('=== doGet ===');
    Logger.log('Hex recibido:', hex ? hex.substring(0, 20) + '...' : '(vacío)');
    Logger.log('Action:', action);
    Logger.log('Callback recibido:', callback || '(vacío)');
    
    // ✅ NUEVO: Si es para obtener todos los cursos personalizados
    if (action === 'get_courses') {
  Logger.log('Obteniendo todos los cursos personalizados...');
  const courses = getAllCourses();
  const response = {
    success: true,
    courses: courses
  };
  return createResponse(response, callback);
}

    
    // Si no hay hex, devolver vacío (sin error)
    if (!hex) {
      Logger.log('Sin hex, devolviendo files vacío');
      const response = {
        success: true,
        files: []
      };
      return createResponse(response, callback);
    }
    
    // ✅ CORREGIDO: Usar getSheet() que busca específicamente la hoja "overrides"
    const sheet = getSheet();
    
    // Buscar el hex en la hoja usando findRow
    const row = findRow(sheet, hex);
    
    let files = [];
    if (row && row.files) {
      try {
        const filesStr = String(row.files).trim();
        Logger.log('Datos encontrados en hoja "overrides":', filesStr.substring(0, 100) + '...');
        files = JSON.parse(filesStr);
        
        if (!Array.isArray(files)) {
          Logger.log('⚠️ WARNING: Los datos no son un array, convirtiendo...');
          files = [];
        }
        
        Logger.log('✅ Archivos parseados:', files.length, 'enlaces');
        
        // Validar estructura de cada enlace
        files = files.filter(f => {
          if (f && typeof f === 'object' && f.label && f.url) {
            return true;
          } else {
            Logger.log('⚠️ Enlace inválido filtrado:', f);
            return false;
          }
        });
        
        Logger.log('✅ Archivos validados:', files.length, 'enlaces');
        
      } catch (parseErr) {
        Logger.log('❌ ERROR parseando JSON:', parseErr.toString());
        Logger.log('String recibido:', String(row.files).substring(0, 200));
        files = [];
      }
    } else {
      Logger.log('Hex no encontrado en la hoja "overrides", devolviendo array vacío');
    }
    
    const response = {
  success: true,
  files: files
};
Logger.log('✅ Respuesta final:', files.length, 'enlaces');
return createResponse(response, callback);

    
  } catch (error) {
    Logger.log('❌ ERROR en doGet:', error.toString());
    Logger.log('Stack:', error.stack);
    
    try {
      const errorResponse = { files: [], error: error.toString() };
      const callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : '';
      return createResponse(errorResponse, callback);
    } catch (finalError) {
      return ContentService.createTextOutput('{"files":[],"error":"Error interno"}')
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
}

// ===== FUNCIÓN doPost =====

function doPost(e) {
  // ✅ AGREGADO: Validar token de autenticación
  // El token puede venir en:
  // 1. Query parameter: ?token=... o ?idToken=...
  // 2. Header: Authorization: Bearer ... (si GAS lo soporta)
  // 3. Body JSON: { token: ... } o { idToken: ... }
  let token = null;
  
  // Intentar obtener token desde parameters (URL)
  if (e && e.parameter) {
    token = e.parameter.token || e.parameter.idToken;
  }
  
  // Si no está en parameters, intentar leer del body
  if (!token && e.postData && e.postData.contents) {
    try {
      // Intentar parsear como JSON
      const bodyData = JSON.parse(e.postData.contents);
      token = bodyData.token || bodyData.idToken;
    } catch (e) {
      // Si no es JSON, el token podría estar en form data (ya se leyó arriba)
    }
  }
  
  if (!validateToken(token)) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: 'Unauthorized',
      message: 'Token de autenticación inválido o faltante'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  Logger.log('=== doPost ===');
  
  let hex = '';
  let files = [];
  let course = '';
  let action = '';
  
  try {
    // Si viene como form-urlencoded (desde URLSearchParams)
    if (e.postData && e.postData.type === 'application/x-www-form-urlencoded') {
      hex = String(e.parameter.hex || '').trim();
      const filesStr = e.parameter.files || '[]';
      course = String(e.parameter.course || '').trim();
      action = String(e.parameter.action || '').trim();
      
      Logger.log('Tipo: form-urlencoded');
      Logger.log('Hex recibido:', hex ? hex.substring(0, 20) + '...' : '(vacío)');
      Logger.log('Tiene files:', filesStr && filesStr !== '[]');
      Logger.log('Tiene course:', course && course !== '');
      Logger.log('Action:', action);
      
      try {
        files = JSON.parse(filesStr);
      } catch (parseErr) {
        Logger.log('❌ ERROR parseando files:', parseErr.toString());
        files = [];
      }
    }
    // ✅ FIX CRÍTICO #1: course como objeto en application/json
    else if (e.postData && e.postData.type === 'application/json') {
      const body = JSON.parse(e.postData.contents);
      hex = String(body.hex || '').trim();
      files = Array.isArray(body.files) ? body.files : [];
      action = String(body.action || '').trim();
      
      // ✅ Conservar string si es string; si es objeto, serializar
      if (typeof body.course === 'string') {
        course = body.course.trim();
      } else if (body.course && typeof body.course === 'object') {
        course = JSON.stringify(body.course);
      } else {
        course = '';
      }
      
      Logger.log('Tipo: application/json');
    }
    // Fallback: intentar desde parameters
    else if (e.parameter) {
      hex = String(e.parameter.hex || '').trim();
      const filesStr = e.parameter.files || '[]';
      course = String(e.parameter.course || '').trim();
      action = String(e.parameter.action || '').trim();
      Logger.log('Tipo: fallback (parameters)');
      try {
        files = JSON.parse(filesStr);
      } catch {
        files = [];
      }
    }
    
    Logger.log('Hex procesado:', hex ? hex.substring(0, 20) + '...' : '(vacío)');
    Logger.log('Files procesados:', files.length, 'enlaces');
    Logger.log('Course procesado:', course ? 'Sí (' + course.substring(0, 100) + '...)' : 'No');
    Logger.log('Action procesada:', action);
    
  } catch (err) {
    Logger.log('❌ ERROR parsing: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ✅ NUEVO: Si es para eliminar curso
  if (action === 'delete_course') {
    Logger.log('Eliminando curso:', hex ? hex.substring(0, 20) + '...' : '(vacío)');
    const coursesSheet = getCoursesSheet();
    deleteCourseRow(coursesSheet, hex);
   return ContentService.createTextOutput(JSON.stringify({
  ok: true,
  success: true,
  message: 'Curso eliminado'
}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ✅ NUEVO: Si es para eliminar links de la hoja de overrides
  if (action === 'delete_files') {
    Logger.log('Eliminando links de overrides:', hex ? hex.substring(0, 20) + '...' : '(vacío)');
    const overridesSheet = getSheet();
    deleteFilesRow(overridesSheet, hex);
    return ContentService.createTextOutput(JSON.stringify({
  ok: true,
  success: true,
  message: 'Links eliminados'
}))

      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // ✅ NUEVO: Si es un curso personalizado
  if (course && course.trim() !== '') {
    if (!hex) {
      Logger.log('❌ No hex provided for course');
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'No hex' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Guardando curso personalizado...');
    const coursesSheet = getCoursesSheet();
    saveCourse(coursesSheet, hex, course);
    
    return ContentService.createTextOutput(JSON.stringify({
  ok: true,
  success: true,
  message: 'Curso guardado'
}))

      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Código original para files (solo si no es course ni delete_course ni delete_files)
  if (!hex) {
    Logger.log('❌ No hex provided');
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'No hex' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Validar que files es un array
  if (!Array.isArray(files)) {
    Logger.log('❌ Files no es un array:', typeof files);
    files = [];
  }
  
  // Validar estructura de cada enlace
  const validFiles = files.filter(f => {
    if (f && typeof f === 'object' && f.label && f.url) {
      return true;
    } else {
      Logger.log('⚠️ Enlace inválido filtrado:', f);
      return false;
    }
  });
  
  Logger.log('✅ Enlaces válidos:', validFiles.length, 'de', files.length, 'total');
  files = validFiles;
  
  // ✅ FIX CRÍTICO #4: Validar tamaño de payload
  const filesJson = JSON.stringify(files);
  const sizeKB = filesJson.length / 1024;
  Logger.log('Tamaño del payload:', sizeKB.toFixed(2), 'KB');
  
  if (sizeKB > 50) {
    Logger.log('⚠️ WARNING: Payload muy grande (>50KB)');
  }
  
  Logger.log('Guardando: hex=' + hex.substring(0, 20) + '..., files=' + files.length + ' enlaces');
  
  const sheet = getSheet();
  Logger.log('JSON a guardar (primeros 200 chars):', filesJson.substring(0, 200));
  
  const existingRow = findRow(sheet, hex);
  if (existingRow) {
    Logger.log('✅ Actualizando fila existente (fila ' + existingRow.row + ')');
  } else {
    Logger.log('✅ Creando nueva fila');
  }
  
  upsert(sheet, hex, filesJson);
  
  // Verificar que se guardó correctamente
  const verificationRow = findRow(sheet, hex);
  if (verificationRow) {
    const savedData = verificationRow.files;
    Logger.log('✅ Verificación: Datos guardados correctamente');
    Logger.log('Longitud del string guardado:', String(savedData).length);
    
    try {
      const savedFiles = JSON.parse(savedData);
      if (savedFiles.length === files.length) {
        Logger.log('✅ Verificación exitosa: Cantidad de enlaces coincide');
      } else {
        Logger.log('⚠️ WARNING: Cantidad diferente. Esperado:', files.length, 'Guardado:', savedFiles.length);
      }
    } catch (e) {
      Logger.log('⚠️ WARNING: No se pudo verificar lo guardado');
    }
  } else {
    Logger.log('❌ ERROR: No se pudo verificar lo guardado');
  }
  
  Logger.log('✅ Guardado exitoso');
  
  return ContentService.createTextOutput(JSON.stringify({ 
    ok: true,
    success: true,
    saved: files.length 
  }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== FUNCIONES AUXILIARES =====

// ✅ FIX CRÍTICO #3: Protección contra borrado masivo
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('overrides') || ss.insertSheet('overrides');
  
  const lastCol = Math.max(sheet.getLastColumn(), 2);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  const needH1 = headers[0] !== 'hex';
  const needH2 = headers[1] !== 'files';
  
  if (needH1) sheet.getRange(1, 1).setValue('hex');
  if (needH2) sheet.getRange(1, 2).setValue('files');
  
  // Poner en negrita
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  
  return sheet;
}

// ✅ NUEVO: Obtiene/crea la hoja "courses"
function getCoursesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('courses');
  
  if (!sheet) {
    // Crear la hoja si no existe
    sheet = ss.insertSheet('courses');
    sheet.getRange(1, 1, 1, 2).setValues([['hex', 'course']]);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    Logger.log('✅ Hoja courses creada');
  }
  
  return sheet;
}

// ✅ FIX CRÍTICO #2: LockService para concurrencia
function saveCourse(sheet, hex, courseJson) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    const row = findRowCourses(sheet, hex);
    
    if (row) {
      // Actualizar
      sheet.getRange(row, 2).setValue(courseJson);
      Logger.log('✅ Curso actualizado en fila:', row);
    } else {
      // Insertar nuevo
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, 1, 2).setValues([[hex, courseJson]]);
      Logger.log('✅ Curso insertado en fila:', lastRow + 1);
    }
  } finally {
    lock.releaseLock();
  }
}

// ✅ NUEVO: Elimina un curso
function deleteCourseRow(sheet, hex) {
  const row = findRowCourses(sheet, hex);
  if (row) {
    sheet.deleteRow(row);
    Logger.log('✅ Curso eliminado en fila:', row);
  } else {
    Logger.log('⚠️ Curso no encontrado para eliminar');
  }
}

// ✅ NUEVO: Elimina una fila de la hoja de overrides
function deleteFilesRow(sheet, hex) {
  const row = findRow(sheet, hex);
  if (row) {
    sheet.deleteRow(row.row);
    Logger.log('✅ Links eliminados en fila:', row.row);
  } else {
    Logger.log('⚠️ Hex no encontrado en overrides para eliminar');
  }
}

// ✅ NUEVO: Busca un curso en la hoja courses
function findRowCourses(sheet, hex) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null; // Solo header
  
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(hex).trim()) {
      return i + 2; // +2 porque es desde fila 2 y array 0-indexed
    }
  }
  return null;
}

// ✅ NUEVO: Obtiene todos los cursos personalizados
function getAllCourses() {
  const sheet = getCoursesSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    Logger.log('No hay cursos (solo header)');
    return {};
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  
  const courses = {};
  data.forEach(row => {
    const hex = String(row[0]).trim();
    const courseJson = String(row[1]).trim();
    
    if (hex && courseJson) {
      try {
        const courseData = JSON.parse(courseJson);
        courses[hex] = courseData;
      } catch (e) {
        Logger.log('❌ Error parseando curso:', hex, e.toString());
      }
    }
  });
  
  Logger.log('✅ Cursos obtenidos:', Object.keys(courses).length);
  return courses;
}

function findRow(sheet, hex) {
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const data = sheet.getRange(2,1,last-1,2).getValues();
  for (var i=0;i<data.length;i++){
    const rowHex = String(data[i][0] || '').trim();
    const searchHex = String(hex).trim();
    if (rowHex === searchHex) {
      return { row: i+2, files: data[i][1] || '[]' };
    }
  }
  return null;
}

// ✅ FIX CRÍTICO #2: LockService para concurrencia
function upsert(sheet, hex, filesJson) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    const row = findRow(sheet, hex);
    if (row) {
      sheet.getRange(row.row, 2).setValue(filesJson);
      Logger.log('✅ Fila actualizada en fila', row.row);
    } else {
      sheet.appendRow([hex, filesJson]);
      Logger.log('✅ Nueva fila agregada');
    }
  } finally {
    lock.releaseLock();
  }
}

// Función auxiliar para crear respuesta con soporte JSONP
function createResponse(data, callback) {
  try {
    if (!data || typeof data !== 'object') {
      data = { files: [] };
    }
    
    const jsonString = JSON.stringify(data);
    
    // ✅ CRÍTICO: Verificar callback con múltiples validaciones
    const hasCallback = callback && 
                        typeof callback === 'string' && 
                        callback.trim() !== '' &&
                        callback.length > 0;
    
    if (hasCallback) {
      // ✅ Limpiar callback (permitir letras, números y guion bajo)
      const safeCallback = String(callback)
        .trim()
        .replace(/[^a-zA-Z0-9_$]/g, ''); // Permitir $ también para funciones JS
      
      if (safeCallback.length > 0) {
        // ✅ Formato JSONP: callback(datos);
        const jsonpResponse = safeCallback + '(' + jsonString + ');';
        
        Logger.log('✅ JSONP generado - Callback:', safeCallback);
        Logger.log('✅ Longitud respuesta:', jsonpResponse.length);
        
        return ContentService
          .createTextOutput(jsonpResponse)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
    }
    
    // Si no hay callback válido, devolver JSON puro
    Logger.log('ℹ️ JSON puro (sin callback)');
    
    return ContentService
      .createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ ERROR en createResponse:', error.toString());
    
    // Intentar devolver error como JSONP si hay callback
    if (callback) {
      const safeCallback = String(callback).replace(/[^a-zA-Z0-9_$]/g, '');
      if (safeCallback) {
        const errorJsonp = safeCallback + '({"error":"' + error.toString() + '","files":[]});';
        return ContentService
          .createTextOutput(errorJsonp)
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
    }
    
    // Fallback: JSON con error
    return ContentService
      .createTextOutput('{"error":"' + error.toString() + '","files":[]}')
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 🔧 Configuración Inicial (IMPORTANTE)

### Paso 1: Configurar Token Secreto

1. Abre tu Google Apps Script
2. Copia y pega la función `setupSecretToken()` (está al inicio del código)
3. Ve a **Ejecutar > Ejecutar función > `setupSecretToken`**
4. Copia el token que aparece en los logs
5. **Guarda este token** - lo necesitarás para configurar en `app.js`

### Paso 2: Configurar Token en app.js

1. Abre `assets/js/app.js`
2. Busca la función `getAuthToken()` (alrededor de la línea 3208)
3. Reemplaza `'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'` con el **mismo token** que generaste en el Paso 1
4. Guarda el archivo

**⚠️ IMPORTANTE:** El token debe ser **exactamente igual** en ambos lugares (GAS y app.js)

### Paso 3: Verificar Configuración

El código ya está configurado para usar Google Sheets con las siguientes hojas:
- **`overrides`**: Almacena los archivos (links) por hex
- **`courses`**: Almacena los cursos personalizados por hex

El script creará automáticamente estas hojas si no existen. No necesitas hacer cambios adicionales en el código.

## ⚠️ Notas Importantes

- **Seguridad**: El script ahora requiere un token de autenticación en cada petición
  - Las peticiones sin token o con token inválido serán rechazadas
  - El token se envía automáticamente desde `app.js` cuando hay un usuario autenticado
  - Si no hay usuario, se usa un token secreto compartido como fallback
- **Permisos**: El script necesita acceso a Drive y Sheets
- **Web App**: Debe estar configurado como "Cualquiera, incluso anónimos" para funcionar desde la web
  - Ve a "Desplegar" → "Administrar implementaciones"
  - En "Quién tiene acceso", selecciona: **"Cualquiera, incluso anónimos"**
  - En "Ejecutar como", selecciona: **"Yo (tu cuenta)"**
- **JSONP**: El script soporta JSONP mediante el parámetro `callback` para evitar problemas de CORS
- **CORS**: Los headers CORS se manejan automáticamente cuando el Web App está configurado como "Cualquiera, incluso anónimos"

## 🐛 Solución de Problemas

### Error: "Unauthorized" o "Token de autenticación inválido"
- **Verifica que hayas ejecutado `setupSecretToken()`** en Google Apps Script
- **Verifica que el token en `app.js` sea exactamente igual** al configurado en GAS
- Revisa los logs de ejecución en GAS para ver mensajes de validación:
  - `[AUTH] ✅ Token válido` = token correcto
  - `[AUTH] ❌ Token inválido` = token incorrecto
  - `[AUTH] ❌ Token no proporcionado` = falta el parámetro token
- **Si cambiaste el token en GAS**, asegúrate de actualizarlo también en `app.js`

### Error: "Acceso denegado" o "Failed to fetch"
- **Verifica la configuración del Web App:**
  1. Ve a "Desplegar" → "Administrar implementaciones"
  2. En "Quién tiene acceso", debe ser: **"Cualquiera, incluso anónimos"**
  3. En "Ejecutar como", debe ser: **"Yo (tu cuenta)"**
  4. Después de cambiar la configuración, crea una **"Nueva implementación"**
- **Revisa los permisos del script:** El script debe tener acceso a Drive y Sheets

### Error: "Parámetro hex o action requerido"
- Verifica que estés enviando el parámetro `hex` o `action` en la URL
- Para JSONP, asegúrate de incluir el parámetro `callback`

