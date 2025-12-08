# Google Apps Script - Generador de Certificados

Este script debe ser creado en Google Apps Script y desplegado como Web App para que funcione con la plataforma.

## 📋 Pasos para Configurar

### 1. Crear el Script

1. Ve a [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto
3. Pega el código completo de abajo
4. Guarda el proyecto con un nombre (ej: "Generador de Certificados EduSalud")

### 2. Configurar Permisos

1. Ejecuta una función de prueba (ej: `listMySlides`)
2. Autoriza el acceso a:
   - Google Drive
   - Google Slides
   - Google Sheets

### 3. Desplegar como Web App

1. Ve a "Desplegar" → "Nueva implementación"
2. Tipo: "Aplicación web"
3. Descripción: "Generador de Certificados v1"
4. Ejecutar como: "Yo"
5. Quién tiene acceso: **"Cualquiera, incluso anónimos"** (importante)
6. Haz clic en "Desplegar"
7. Copia la URL del Web App (la necesitarás en la plataforma)

## 📝 Código Completo del Script

```javascript
// Generador de Certificados - EduSalud
// Google Apps Script - Backend para la plataforma web

// ===== FUNCIONES PRINCIPALES (doGet y doPost) =====

function doGet(e) {
  const action = e.parameter.action;
  let result;
  
  // ✅ Nota: Los headers CORS se manejan automáticamente cuando el Web App
  // está configurado como "Cualquiera, incluso anónimos"
  
  try {
    switch(action) {
      case 'test':
        // ✅ Función de prueba de conexión
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Conexión exitosa',
          timestamp: new Date().toISOString()
        })).setMimeType(ContentService.MimeType.JSON);
        
      case 'listSlides':
        result = listMySlides();
        break;
      case 'listSheets':
        result = listMySheets();
        break;
      case 'listFolders':
        result = listMyFolders();
        break;
      default:
        throw new Error('Acción no válida');
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // ✅ Nota: Los headers CORS se manejan automáticamente cuando el Web App
  // está configurado como "Cualquiera, incluso anónimos"
  
  console.log('[DOPOST] ===== Iniciando doPost =====');
  console.log('[DOPOST] postData existe:', !!e.postData);
  if (e.postData) {
    console.log('[DOPOST] postData.type:', e.postData.type);
    console.log('[DOPOST] postData.contents (primeros 200 chars):', e.postData.contents ? e.postData.contents.substring(0, 200) : 'vacío');
  }
  console.log('[DOPOST] parameters:', e.parameter);
  
  let data;
  try {
    // Intentar parsear como JSON primero
    if (e.postData && (e.postData.type === 'application/json' || e.postData.type === 'text/plain')) {
      console.log('[DOPOST] Parseando como JSON (tipo:', e.postData.type + ')');
      data = JSON.parse(e.postData.contents);
      console.log('[DOPOST] Datos parseados (primeros 200 chars):', JSON.stringify(data).substring(0, 200));
    } else if (e.postData && e.postData.contents) {
      // Intentar parsear aunque no diga que es JSON
      console.log('[DOPOST] Intentando parsear postData.contents como JSON');
      try {
        data = JSON.parse(e.postData.contents);
        console.log('[DOPOST] Datos parseados (primeros 200 chars):', JSON.stringify(data).substring(0, 200));
      } catch (parseError) {
        console.error('[DOPOST] Error parseando JSON:', parseError.message);
        throw new Error('No se pudo parsear el JSON: ' + parseError.message);
      }
    } else {
      // Si es form data, leer desde parameters
      console.log('[DOPOST] Leyendo desde parameters (form data)');
      const params = e.parameter;
      data = {
        action: params.action,
        params: params.params ? JSON.parse(decodeURIComponent(params.params)) : {}
      };
      console.log('[DOPOST] Datos desde parameters:', JSON.stringify(data).substring(0, 200));
    }
    
    if (!data || !data.action) {
      console.error('[DOPOST] ❌ No se encontró la acción en los datos recibidos');
      throw new Error('No se encontró la acción en los datos recibidos');
    }
    
    console.log('[DOPOST] Acción recibida:', data.action);
    
  } catch (error) {
    console.error('[DOPOST] ❌ Error parseando datos:', error.message);
    console.error('[DOPOST] Stack:', error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error parseando datos: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = data.action;
  const params = data.params || {};
  
  console.log('[DOPOST] Procesando acción:', action);
  console.log('[DOPOST] Parámetros (primeros 200 chars):', JSON.stringify(params).substring(0, 200));
  
  let result;
  
  try {
    switch(action) {
      case 'createSheet':
        console.log('[DOPOST] Llamando a createNewSheet');
        result = createNewSheet(params);
        break;
      case 'createFolder':
        console.log('[DOPOST] Llamando a createNewFolder');
        result = createNewFolder(params);
        break;
      case 'generatePDFs':
        console.log('[DOPOST] Llamando a generarCertificadosYGuardarPDF');
        result = generarCertificadosYGuardarPDF(params);
        console.log('[DOPOST] Resultado (primeros 200 chars):', JSON.stringify(result).substring(0, 200));
        break;
      case 'generateLinks':
        console.log('[DOPOST] Llamando a generarLinksDesdePDFProtegido');
        result = generarLinksDesdePDFProtegido(params);
        break;
      default:
        console.error('[DOPOST] ❌ Acción no válida:', action);
        throw new Error('Acción no válida: ' + action);
    }
    
    console.log('[DOPOST] ✅ Éxito, retornando resultado');
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      ...result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('[DOPOST] ❌ Error procesando acción:', error.message);
    console.error('[DOPOST] Stack:', error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack ? error.stack.substring(0, 500) : 'No hay stack'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ✅ Función para manejar preflight CORS (OPTIONS) - OPCIONAL
// Google Apps Script maneja CORS automáticamente cuando está configurado como "Cualquiera, incluso anónimos"
function doOptions() {
  // ✅ Respuesta para solicitudes OPTIONS (preflight CORS)
  // Google Apps Script maneja CORS automáticamente, pero esta función
  // asegura que las solicitudes preflight se respondan correctamente
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'CORS preflight OK'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== FUNCIONES PARA LISTAR RECURSOS =====

function listMySlides() {
  try {
    const files = DriveApp.getFilesByType(MimeType.GOOGLE_SLIDES);
    const slides = [];
    
    while (files.hasNext()) {
      const file = files.next();
      slides.push({
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        modified: file.getLastUpdated().getTime()
      });
    }
    
    return slides.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    throw new Error('Error listando Slides: ' + error.message);
  }
}

function listMySheets() {
  try {
    const files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
    const sheets = [];
    
    while (files.hasNext()) {
      const file = files.next();
      sheets.push({
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        modified: file.getLastUpdated().getTime()
      });
    }
    
    return sheets.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    throw new Error('Error listando Sheets: ' + error.message);
  }
}

function listMyFolders() {
  try {
    const folders = [];
    const rootFolders = DriveApp.getRootFolder().getFolders();
    
    while (rootFolders.hasNext()) {
      const folder = rootFolders.next();
      folders.push({
        id: folder.getId(),
        name: folder.getName(),
        url: folder.getUrl()
      });
    }
    
    // También buscar en "Mi unidad" directamente
    const myDriveFolders = DriveApp.getFolders();
    while (myDriveFolders.hasNext()) {
      const folder = myDriveFolders.next();
      // Evitar duplicados
      if (!folders.find(f => f.id === folder.getId())) {
        folders.push({
          id: folder.getId(),
          name: folder.getName(),
          url: folder.getUrl()
        });
      }
    }
    
    return folders.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    throw new Error('Error listando Folders: ' + error.message);
  }
}

// ===== FUNCIONES PARA CREAR RECURSOS =====

function createNewSheet(params) {
  try {
    const { name, mode } = params;
    
    if (!name || name.trim() === '') {
      throw new Error('El nombre de la hoja es requerido');
    }
    
    const spreadsheet = SpreadsheetApp.create(name.trim());
    const sheet = spreadsheet.getActiveSheet();
    
    // ✅ Crear encabezados según el modo
    let headers;
    let numColumns;
    
    if (mode === 'with-code') {
      // Modo con código: 9 columnas (incluye Código Validación)
      headers = [
        'Nombre', 'Código Validación', 'Correo', 'Teléfono', 
        'Correo link', 'WhatsApp link', 'Link PDF', 'Estado', 'Certificado generado'
      ];
      numColumns = 9;
    } else {
      // Modo webinar: 8 columnas (sin código)
      headers = [
        'Nombre', 'Correo', 'Teléfono', 'Correo link', 
        'WhatsApp link', 'Link PDF', 'Estado', 'Certificado generado'
      ];
      numColumns = 8;
    }
    
    sheet.getRange(1, 1, 1, numColumns).setValues([headers]);
    
    // Formatear encabezados
    const headerRange = sheet.getRange(1, 1, 1, numColumns);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
    
    return {
      id: spreadsheet.getId(),
      name: spreadsheet.getName(),
      url: spreadsheet.getUrl()
    };
  } catch (error) {
    throw new Error('Error creando hoja: ' + error.message);
  }
}

function createNewFolder(params) {
  try {
    const { name } = params;
    
    if (!name || name.trim() === '') {
      throw new Error('El nombre de la carpeta es requerido');
    }
    
    const folder = DriveApp.createFolder(name.trim());
    
    return {
      id: folder.getId(),
      name: folder.getName(),
      url: folder.getUrl()
    };
  } catch (error) {
    throw new Error('Error creando carpeta: ' + error.message);
  }
}

// ===== FUNCIONES PARA GENERAR CERTIFICADOS =====

function generarCertificadosYGuardarPDF(params) {
  try {
    console.log('[GENERATOR] Iniciando generación de certificados');
    console.log('[GENERATOR] Parámetros recibidos:', params);
    
    // ✅ Registrar tiempo de inicio y límite máximo
    const startTime = new Date().getTime();
    const MAX_EXECUTION_TIME = 330000; // 5.5 minutos en milisegundos (dejamos margen de 30 segundos)
    
    const { slideTemplateId, outputFolderId, sheetId, mode } = params;
    const certMode = mode || 'webinar'; // Por defecto modo webinar
    
    if (!slideTemplateId || !outputFolderId || !sheetId) {
      throw new Error('Faltan parámetros requeridos. Verifica: slideTemplateId, outputFolderId, sheetId');
    }
    
    console.log('[GENERATOR] Modo de certificado:', certMode);
    
    console.log('[GENERATOR] Abriendo hoja de cálculo:', sheetId);
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(sheetId);
    } catch (e) {
      throw new Error('No se puede acceder a la hoja de cálculo. Verifica el ID y los permisos: ' + e.message);
    }
    
    const hoja = spreadsheet.getSheetByName('Hoja 1');
    if (!hoja) {
      throw new Error('No se encontró la hoja "Hoja 1". Verifica el nombre de la hoja.');
    }
    
    console.log('[GENERATOR] Obteniendo datos de la hoja');
    const lastRow = hoja.getLastRow();
    if (lastRow < 2) {
      return {
        total: 0,
        generated: 0,
        errors: 0,
        message: 'No hay datos en la hoja (solo encabezados)'
      };
    }
    
    // ✅ Determinar número de columnas según el modo
    const numColumns = certMode === 'with-code' ? 9 : 8;
    const COL_NOMBRE = 0; // Columna A
    const COL_CODIGO = certMode === 'with-code' ? 1 : -1; // Columna B solo en modo with-code
    const COL_CORREO = certMode === 'with-code' ? 2 : 1; // Columna C o B según modo
    const COL_TELEFONO = certMode === 'with-code' ? 3 : 2; // Columna D o C según modo
    const COL_CERTIFICADO_GENERADO = certMode === 'with-code' ? 8 : 7; // Columna I o H según modo
    
    const datos = hoja.getRange(2, 1, lastRow - 1, numColumns).getValues();
    console.log('[GENERATOR] Filas de datos encontradas:', datos.length);
    console.log('[GENERATOR] Modo:', certMode, 'Columnas:', numColumns);
    
    // Validar plantilla
    console.log('[GENERATOR] Validando plantilla:', slideTemplateId);
    let templateFile;
    try {
      templateFile = DriveApp.getFileById(slideTemplateId);
      console.log('[GENERATOR] Plantilla encontrada:', templateFile.getName());
    } catch (e) {
      throw new Error('No se puede acceder a la plantilla. Verifica el ID y los permisos: ' + e.message);
    }
    
    // Validar carpeta de salida
    console.log('[GENERATOR] Validando carpeta de salida:', outputFolderId);
    let outputFolder;
    try {
      outputFolder = DriveApp.getFolderById(outputFolderId);
      console.log('[GENERATOR] Carpeta encontrada:', outputFolder.getName());
    } catch (e) {
      throw new Error('No se puede acceder a la carpeta de salida. Verifica el ID y los permisos: ' + e.message);
    }
    
    let total = 0;
    let generated = 0;
    let errors = 0;
    let skipped = 0; // ✅ Contador para omitidos
    const errorMessages = [];
    let pendingCount = 0; // ✅ Contar cuántos quedan pendientes
    
    // ✅ Primero contar cuántos hay pendientes
    for (let i = 0; i < datos.length; i++) {
      const nombre = datos[i][COL_NOMBRE];
      const yaGenerado = datos[i][COL_CERTIFICADO_GENERADO];
      
      if (!nombre || nombre.toString().trim() === '') {
        continue;
      }
      
      if (yaGenerado !== '✅' && yaGenerado !== 'OK') {
        pendingCount++;
      }
    }
    
    console.log('[GENERATOR] Total pendientes: ' + pendingCount);
    
    for (let i = 0; i < datos.length; i++) {
      // ✅ Verificar tiempo transcurrido cada 5 certificados
      if (i > 0 && i % 5 === 0) {
        const elapsed = new Date().getTime() - startTime; // tiempo en milisegundos
        if (elapsed >= MAX_EXECUTION_TIME) {
          console.log('[GENERATOR] ⏰ Límite de tiempo alcanzado. Deteniendo para evitar timeout.');
          
          // Contar cuántos quedan pendientes
          let remaining = 0;
          for (let j = i; j < datos.length; j++) {
            const nombreRestante = datos[j][COL_NOMBRE];
            const yaGeneradoRestante = datos[j][COL_CERTIFICADO_GENERADO];
            if (nombreRestante && nombreRestante.toString().trim() !== '' && 
                yaGeneradoRestante !== '✅' && yaGeneradoRestante !== 'OK') {
              remaining++;
            }
          }
          
          return {
            total: pendingCount,
            generated: generated,
            errors: errors,
            skipped: skipped,
            pending: remaining,
            timeout: true,
            message: `⏰ Límite de tiempo alcanzado. Procesados ${generated} certificados. Quedan ${remaining} pendientes. Ejecuta nuevamente para continuar.`,
            errorMessages: errorMessages.slice(0, 10)
          };
        }
      }
      
      const nombre = datos[i][COL_NOMBRE];
      const codigoValidacion = certMode === 'with-code' ? datos[i][COL_CODIGO] : null;
      const yaGenerado = datos[i][COL_CERTIFICADO_GENERADO];
      
      if (!nombre || nombre.toString().trim() === '') {
        console.log('[GENERATOR] Fila ' + (i + 2) + ': Nombre vacío, omitiendo');
        continue;
      }
      
      // ✅ Validar código de validación si es modo with-code
      if (certMode === 'with-code') {
        if (!codigoValidacion || codigoValidacion.toString().trim() === '') {
          console.log('[GENERATOR] Fila ' + (i + 2) + ': Código de validación vacío, omitiendo');
          hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue('❌ Error: Código de validación faltante');
          errors++;
          errorMessages.push(`Fila ${i + 2} (${nombre}): Código de validación faltante`);
          continue;
        }
      }
      
      total++;
      
      if (yaGenerado === '✅' || yaGenerado === 'OK') {
        console.log('[GENERATOR] ' + nombre + ': Ya generado, omitiendo');
        skipped++;
        continue;
      }
      
      console.log('[GENERATOR] Procesando certificado ' + (generated + 1) + ' de ' + total + ': ' + nombre);
      
      try {
        // Crear copia de la plantilla
        console.log('[GENERATOR] Creando copia de plantilla para:', nombre);
        const copia = templateFile.makeCopy(`Certificado - ${nombre}`);
        const copiaId = copia.getId();
        console.log('[GENERATOR] Copia creada:', copiaId);
        
        // Abrir presentación
        console.log('[GENERATOR] Abriendo presentación:', copiaId);
        const presentacion = SlidesApp.openById(copiaId);
        
        // ✅ Reemplazar variables según el modo
        console.log('[GENERATOR] Reemplazando texto en diapositivas');
        const slides = presentacion.getSlides();
        slides.forEach((slide, index) => {
          // Reemplazar {{NOMBRE}}
          slide.replaceAllText('{{NOMBRE}}', nombre);
          
          // ✅ Si es modo with-code, reemplazar {{CODIGO_VALIDACION}}
          if (certMode === 'with-code' && codigoValidacion) {
            const codigoStr = codigoValidacion.toString().trim();
            slide.replaceAllText('{{CODIGO_VALIDACION}}', codigoStr);
            console.log('[GENERATOR] Diapositiva ' + (index + 1) + ' actualizada (Nombre: ' + nombre + ', Código: ' + codigoStr + ')');
          } else {
            console.log('[GENERATOR] Diapositiva ' + (index + 1) + ' actualizada (Nombre: ' + nombre + ')');
          }
        });
        
        console.log('[GENERATOR] Guardando y cerrando presentación');
        presentacion.saveAndClose();
        
        // Generar PDF
        console.log('[GENERATOR] Generando PDF');
        const pdf = DriveApp.getFileById(copiaId).getAs(MimeType.PDF);
        
        // Guardar PDF en carpeta de salida
        console.log('[GENERATOR] Guardando PDF en carpeta');
        outputFolder.createFile(pdf).setName(`Certificado - ${nombre}.pdf`);
        
        // Eliminar la copia del Slide
        console.log('[GENERATOR] Eliminando copia temporal del Slide');
        copia.setTrashed(true);
        
        // Marcar como generado en la hoja
        console.log('[GENERATOR] Marcando como generado en hoja');
        hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue('✅');
        generated++;
        
        console.log('[GENERATOR] ✅ Certificado generado exitosamente para:', nombre);
        
      } catch (error) {
        errors++;
        const errorMsg = `Error en ${nombre}: ${error.message}`;
        errorMessages.push(errorMsg);
        console.error('[GENERATOR] ❌ ' + errorMsg);
        console.error('[GENERATOR] Stack:', error.stack);
        
        try {
          hoja.getRange(i + 2, 8).setValue(`❌ Error: ${error.message.substring(0, 50)}`);
        } catch (writeError) {
          console.error('[GENERATOR] ❌ No se pudo escribir error en hoja:', writeError.message);
        }
      }
    }
    
    console.log('[GENERATOR] Proceso completado. Total: ' + total + ', Generados: ' + generated + ', Errores: ' + errors + ', Omitidos: ' + skipped);
    
    return {
      total: pendingCount || total,
      generated: generated,
      errors: errors,
      skipped: skipped,
      pending: 0,
      timeout: false,
      message: `Procesados ${pendingCount || total} registros. Generados: ${generated}, Errores: ${errors}, Omitidos: ${skipped}`,
      errorMessages: errorMessages.slice(0, 10)
    };
    
  } catch (error) {
    console.error('[GENERATOR] ❌ Error fatal:', error.message);
    console.error('[GENERATOR] Stack:', error.stack);
    throw new Error('Error generando certificados: ' + error.message);
  }
}

// ===== FUNCIONES PARA GENERAR ENLACES =====

function generarLinksDesdePDFProtegido(params) {
  try {
    const { sheetId, folderProtegidosId, webinarTitle, webinarDate, emailMessage, whatsappMessage, mode } = params;
    const certMode = mode || 'webinar'; // Por defecto modo webinar
    
    if (!sheetId || !folderProtegidosId || !webinarTitle || !webinarDate) {
      throw new Error('Faltan parámetros requeridos');
    }
    
    console.log('[LINKS] Modo de certificado:', certMode);
    
    // ✅ Mensajes por defecto si no se proporcionan personalizados
    const defaultEmailMessage = `Estimada/o {{NOMBRE}},

Gracias por participar en el webinar {{TITULO}}, realizado el {{FECHA}}.

Aquí puede descargar su certificado de participación:
{{ENLACE_PDF}}

Cordialmente,
Programa Educación Continua en Salud – EduSalud
Facultad de Ciencias Médicas – UNAH`;
    
    const defaultWhatsappMessage = `Hola {{NOMBRE}}, gracias por participar en el webinar "{{TITULO}}", realizado el {{FECHA}}.

Aquí puede descargar su certificado de participación:
{{ENLACE_PDF}}

Saludos cordiales,
EduSalud – UNAH`;
    
    // Usar mensajes personalizados si existen, sino usar los por defecto
    const emailTemplate = emailMessage || defaultEmailMessage;
    const whatsappTemplate = whatsappMessage || defaultWhatsappMessage;
    
    // ✅ Función para reemplazar variables en los mensajes
    function replaceVariables(template, nombre, titulo, fecha, enlacePDF) {
      return template
        .replace(/\{\{NOMBRE\}\}/g, nombre)
        .replace(/\{\{TITULO\}\}/g, titulo)
        .replace(/\{\{FECHA\}\}/g, fecha)
        .replace(/\{\{ENLACE_PDF\}\}/g, enlacePDF);
    }
    
    const hoja = SpreadsheetApp.openById(sheetId).getSheetByName('Hoja 1');
    
    if (!hoja) {
      throw new Error('No se encontró la hoja "Hoja 1"');
    }
    
    // ✅ Determinar número de columnas según el modo y índices de columnas
    const numColumns = certMode === 'with-code' ? 9 : 8;
    const COL_NOMBRE = 0; // Columna A
    const COL_CORREO = certMode === 'with-code' ? 2 : 1; // Columna C o B según modo
    const COL_TELEFONO = certMode === 'with-code' ? 3 : 2; // Columna D o C según modo
    const COL_CORREO_LINK = certMode === 'with-code' ? 4 : 3; // Columna E o D según modo
    const COL_WHATSAPP_LINK = certMode === 'with-code' ? 5 : 4; // Columna F o E según modo
    const COL_PDF_LINK = certMode === 'with-code' ? 6 : 5; // Columna G o F según modo
    const COL_ESTADO = certMode === 'with-code' ? 7 : 6; // Columna H o G según modo
    
    const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, numColumns).getValues();
    const folder = DriveApp.getFolderById(folderProtegidosId);
    
    console.log('[LINKS] Modo:', certMode, 'Columnas:', numColumns);
    
    // Crear mapa de archivos PDF
    const mapaPDF = {};
    const archivos = folder.getFiles();
    while (archivos.hasNext()) {
      const archivo = archivos.next();
      if (archivo.getMimeType() === MimeType.PDF) {
        mapaPDF[archivo.getName()] = archivo.getId();
      }
    }
    
    let total = 0;
    let created = 0;
    let notFound = 0;
    
    for (let i = 0; i < datos.length; i++) {
      const nombre = datos[i][COL_NOMBRE];
      const correo = datos[i][COL_CORREO];
      const telefono = datos[i][COL_TELEFONO];
      const estado = datos[i][COL_ESTADO];
      const fila = i + 2;
      
      if (!nombre || nombre.toString().trim() === '') continue;
      total++;
      
      if (estado === '✅ Encontrado') {
        continue; // Ya procesado
      }
      
      const nombreArchivo = `Certificado - ${nombre}.pdf`;
      
      if (mapaPDF[nombreArchivo]) {
        const fileId = mapaPDF[nombreArchivo];
        const enlacePDF = `https://drive.google.com/file/d/${fileId}/view`;
        
        // ✅ Generar mensajes personalizados usando plantillas
        const emailBody = replaceVariables(emailTemplate, nombre, webinarTitle, webinarDate, enlacePDF);
        const mensajeWA = replaceVariables(whatsappTemplate, nombre, webinarTitle, webinarDate, enlacePDF);
        
        // Crear enlace de correo con el mensaje personalizado
        // Codificar el body completo para URL (encodeURIComponent maneja saltos de línea y caracteres especiales)
        const emailBodyUriEncoded = encodeURIComponent(emailBody);
        
        const enlaceCorreo = `mailto:${correo}?subject=Entrega de certificado - ${encodeURIComponent(webinarTitle)}&body=${emailBodyUriEncoded}`;
        
        // ✅ Convertir teléfono a string y limpiar (quitar caracteres no numéricos)
        const telefonoStr = telefono ? String(telefono).replace(/[^0-9]/g, '') : '';
        const enlaceWhatsApp = telefonoStr ? `https://wa.me/${telefonoStr}?text=${encodeURIComponent(mensajeWA)}` : '';
        
        // ✅ Escapar comillas dobles para las fórmulas HYPERLINK (duplicar comillas)
        // En Google Sheets, las comillas dobles dentro de strings deben duplicarse
        const enlaceCorreoEscapado = enlaceCorreo.replace(/"/g, '""');
        const enlaceWhatsAppEscapado = enlaceWhatsApp ? enlaceWhatsApp.replace(/"/g, '""') : '';
        const enlacePDFEscapado = enlacePDF.replace(/"/g, '""');
        
        // Escribir enlaces en la hoja (usar índices base 1 para getRange)
        hoja.getRange(fila, COL_CORREO_LINK + 1).setFormula(`=HYPERLINK("${enlaceCorreoEscapado}", "Enviar correo")`);
        if (enlaceWhatsApp) {
          hoja.getRange(fila, COL_WHATSAPP_LINK + 1).setFormula(`=HYPERLINK("${enlaceWhatsAppEscapado}", "Enviar WhatsApp")`);
        } else {
          hoja.getRange(fila, COL_WHATSAPP_LINK + 1).setValue('Sin teléfono');
        }
        hoja.getRange(fila, COL_PDF_LINK + 1).setFormula(`=HYPERLINK("${enlacePDFEscapado}", "Ver PDF protegido")`);
        hoja.getRange(fila, COL_ESTADO + 1).setValue("✅ Encontrado");
        
        created++;
      } else {
        hoja.getRange(fila, COL_CORREO_LINK + 1, 1, 3).clearContent();
        hoja.getRange(fila, COL_ESTADO + 1).setValue("❌ No encontrado");
        notFound++;
      }
    }
    
    return {
      total: total,
      created: created,
      notFound: notFound
    };
    
  } catch (error) {
    throw new Error('Error generando enlaces: ' + error.message);
  }
}
```

## 🔧 Configuración en la Plataforma

1. Ve a la sección "🎓 Generador de Certificados" en la plataforma
2. Pega la URL del Web App en el campo "URL del Google Apps Script Web App"
3. Haz clic en "💾 Guardar Configuración"
4. Ahora puedes usar todas las funciones del generador

## ⚠️ Notas Importantes

- **Permisos**: El script necesita acceso a Drive, Slides y Sheets
- **Web App**: Debe estar configurado como "Cualquiera, incluso anónimos" para funcionar desde la web
  - Ve a "Desplegar" → "Administrar implementaciones"
  - En "Quién tiene acceso", selecciona: **"Cualquiera, incluso anónimos"**
  - En "Ejecutar como", selecciona: **"Yo (tu cuenta)"**
- **CORS**: Los headers CORS se manejan automáticamente cuando el Web App está configurado como "Cualquiera, incluso anónimos". No es necesario establecer headers manualmente.
- **Plantilla**: La plantilla de Slides debe contener `{{NOMBRE}}` como placeholder
- **Hoja**: La hoja debe tener las columnas en el orden correcto (ver estructura en el código)
- **Carpetas**: Asegúrate de tener permisos en las carpetas que uses

## 🐛 Solución de Problemas

### Error: "No se encontró la hoja"
- Verifica que la hoja se llame exactamente "Hoja 1"
- O modifica el código para usar `getActiveSheet()` si prefieres

### Error: "Acceso denegado" o "Failed to fetch"
- **Verifica la configuración del Web App:**
  1. Ve a "Desplegar" → "Administrar implementaciones"
  2. En "Quién tiene acceso", debe ser: **"Cualquiera, incluso anónimos"**
  3. En "Ejecutar como", debe ser: **"Yo (tu cuenta)"**
  4. Después de cambiar la configuración, crea una **"Nueva implementación"**
- **Nota importante:** Google Apps Script maneja los headers CORS automáticamente. No es necesario establecerlos manualmente cuando el Web App está configurado como "Cualquiera, incluso anónimos"
- **Revisa los permisos del script:** El script debe tener acceso a Drive, Slides y Sheets
- **Si persiste el error:** Prueba abrir la URL del Web App directamente en el navegador para ver si hay errores

### Error: "No se puede acceder a la carpeta"
- Verifica que tengas permisos de escritura en la carpeta
- Asegúrate de que el ID de la carpeta sea correcto

