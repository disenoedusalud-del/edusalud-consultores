// Código completo del Google Apps Script para el Generador de Certificados
window.GOOGLE_APPS_SCRIPT_CODE = `function doGet(e) {
  const action = e.parameter.action;
  let result;
  
  try {
    switch(action) {
      case 'test':
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
  console.log('[DOPOST] ===== Iniciando doPost =====');
  console.log('[DOPOST] postData existe:', !!e.postData);
  if (e.postData) {
    console.log('[DOPOST] postData.type:', e.postData.type);
    console.log('[DOPOST] postData.contents (primeros 200 chars):', e.postData.contents ? e.postData.contents.substring(0, 200) : 'vacío');
  }
  console.log('[DOPOST] parameters:', e.parameter);
  
  let data;
  try {
    if (e.postData && (e.postData.type === 'application/json' || e.postData.type === 'text/plain')) {
      console.log('[DOPOST] Parseando como JSON (tipo:', e.postData.type + ')');
      data = JSON.parse(e.postData.contents);
      console.log('[DOPOST] Datos parseados (primeros 200 chars):', JSON.stringify(data).substring(0, 200));
    } else if (e.postData && e.postData.contents) {
      console.log('[DOPOST] Intentando parsear postData.contents como JSON');
      try {
        data = JSON.parse(e.postData.contents);
        console.log('[DOPOST] Datos parseados (primeros 200 chars):', JSON.stringify(data).substring(0, 200));
      } catch (parseError) {
        console.error('[DOPOST] Error parseando JSON:', parseError.message);
        throw new Error('No se pudo parsear el JSON: ' + parseError.message);
      }
    } else {
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

function doOptions() {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'CORS preflight OK'
  })).setMimeType(ContentService.MimeType.JSON);
}

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
    
    const myDriveFolders = DriveApp.getFolders();
    while (myDriveFolders.hasNext()) {
      const folder = myDriveFolders.next();
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

function createNewSheet(params) {
  try {
    const { name, mode } = params;
    
    if (!name || name.trim() === '') {
      throw new Error('El nombre de la hoja es requerido');
    }
    
    const spreadsheet = SpreadsheetApp.create(name.trim());
    const sheet = spreadsheet.getActiveSheet();
    
    let headers;
    let numColumns;
    
    if (mode === 'with-code') {
      headers = [
        'Nombre', 'Código Validación', 'Correo', 'Teléfono', 
        'Correo link', 'WhatsApp link', 'Link PDF', 'Estado', 'Certificado generado'
      ];
      numColumns = 9;
    } else {
      headers = [
        'Nombre', 'Correo', 'Teléfono', 'Correo link', 
        'WhatsApp link', 'Link PDF', 'Estado', 'Certificado generado'
      ];
      numColumns = 8;
    }
    
    sheet.getRange(1, 1, 1, numColumns).setValues([headers]);
    
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

function generarCertificadosYGuardarPDF(params) {
  try {
    console.log('[GENERATOR] Iniciando generación de certificados');
    console.log('[GENERATOR] Parámetros recibidos:', params);
    
    const startTime = new Date().getTime();
    const MAX_EXECUTION_TIME = 330000;
    
    const { slideTemplateId, outputFolderId, sheetId, mode } = params;
    const certMode = mode || 'webinar';
    
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
    
    const numColumns = certMode === 'with-code' ? 9 : 8;
    const COL_NOMBRE = 0;
    const COL_CODIGO = certMode === 'with-code' ? 1 : -1;
    const COL_CORREO = certMode === 'with-code' ? 2 : 1;
    const COL_TELEFONO = certMode === 'with-code' ? 3 : 2;
    const COL_CERTIFICADO_GENERADO = certMode === 'with-code' ? 8 : 7;
    
    const datos = hoja.getRange(2, 1, lastRow - 1, numColumns).getValues();
    console.log('[GENERATOR] Filas de datos encontradas:', datos.length);
    console.log('[GENERATOR] Modo:', certMode, 'Columnas:', numColumns);
    
    console.log('[GENERATOR] Validando plantilla:', slideTemplateId);
    let templateFile;
    try {
      templateFile = DriveApp.getFileById(slideTemplateId);
      console.log('[GENERATOR] Plantilla encontrada:', templateFile.getName());
    } catch (e) {
      throw new Error('No se puede acceder a la plantilla. Verifica el ID y los permisos: ' + e.message);
    }
    
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
    let skipped = 0;
    const errorMessages = [];
    let pendingCount = 0;
    
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
      if (i > 0 && i % 5 === 0) {
        const elapsed = new Date().getTime() - startTime;
        if (elapsed >= MAX_EXECUTION_TIME) {
          console.log('[GENERATOR] ⏰ Límite de tiempo alcanzado. Deteniendo para evitar timeout.');
          
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
            message: '⏰ Límite de tiempo alcanzado. Procesados ' + generated + ' certificados. Quedan ' + remaining + ' pendientes. Ejecuta nuevamente para continuar.',
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
      
      if (certMode === 'with-code') {
        if (!codigoValidacion || codigoValidacion.toString().trim() === '') {
          console.log('[GENERATOR] Fila ' + (i + 2) + ': Código de validación vacío, omitiendo');
          hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue('❌ Error: Código de validación faltante');
          errors++;
          errorMessages.push('Fila ' + (i + 2) + ' (' + nombre + '): Código de validación faltante');
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
        console.log('[GENERATOR] Creando copia de plantilla para:', nombre);
        const copia = templateFile.makeCopy('Certificado - ' + nombre);
        const copiaId = copia.getId();
        console.log('[GENERATOR] Copia creada:', copiaId);
        
        console.log('[GENERATOR] Abriendo presentación:', copiaId);
        const presentacion = SlidesApp.openById(copiaId);
        
        console.log('[GENERATOR] Reemplazando texto en diapositivas');
        const slides = presentacion.getSlides();
        slides.forEach(function(slide, index) {
          slide.replaceAllText('{{NOMBRE}}', nombre);
          
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
        
        console.log('[GENERATOR] Generando PDF');
        const pdf = DriveApp.getFileById(copiaId).getAs(MimeType.PDF);
        
        console.log('[GENERATOR] Guardando PDF en carpeta');
        outputFolder.createFile(pdf).setName('Certificado - ' + nombre + '.pdf');
        
        console.log('[GENERATOR] Eliminando copia temporal del Slide');
        copia.setTrashed(true);
        
        console.log('[GENERATOR] Marcando como generado en hoja');
        hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue('✅');
        generated++;
        
        console.log('[GENERATOR] ✅ Certificado generado exitosamente para:', nombre);
        
      } catch (error) {
        errors++;
        const errorMsg = 'Error en ' + nombre + ': ' + error.message;
        errorMessages.push(errorMsg);
        console.error('[GENERATOR] ❌ ' + errorMsg);
        console.error('[GENERATOR] Stack:', error.stack);
        
        try {
          hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue('❌ Error: ' + error.message.substring(0, 50));
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
      message: 'Procesados ' + (pendingCount || total) + ' registros. Generados: ' + generated + ', Errores: ' + errors + ', Omitidos: ' + skipped,
      errorMessages: errorMessages.slice(0, 10)
    };
    
  } catch (error) {
    console.error('[GENERATOR] ❌ Error fatal:', error.message);
    console.error('[GENERATOR] Stack:', error.stack);
    throw new Error('Error generando certificados: ' + error.message);
  }
}

function generarLinksDesdePDFProtegido(params) {
  try {
    const { sheetId, folderProtegidosId, webinarTitle, webinarDate, emailMessage, whatsappMessage, mode } = params;
    const certMode = mode || 'webinar';
    
    if (!sheetId || !folderProtegidosId || !webinarTitle || !webinarDate) {
      throw new Error('Faltan parámetros requeridos');
    }
    
    console.log('[LINKS] Modo de certificado:', certMode);
    
    const defaultEmailMessage = 'Estimada/o {{NOMBRE}},\n\nGracias por participar en el webinar {{TITULO}}, realizado el {{FECHA}}.\n\nAquí puede descargar su certificado de participación:\n{{ENLACE_PDF}}\n\nCordialmente,\nPrograma Educación Continua en Salud – EduSalud\nFacultad de Ciencias Médicas – UNAH';
    
    const defaultWhatsappMessage = 'Hola {{NOMBRE}}, gracias por participar en el webinar "{{TITULO}}", realizado el {{FECHA}}.\n\nAquí puede descargar su certificado de participación:\n{{ENLACE_PDF}}\n\nSaludos cordiales,\nEduSalud – UNAH';
    
    const emailTemplate = emailMessage || defaultEmailMessage;
    const whatsappTemplate = whatsappMessage || defaultWhatsappMessage;
    
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
    
    const numColumns = certMode === 'with-code' ? 9 : 8;
    const COL_NOMBRE = 0;
    const COL_CORREO = certMode === 'with-code' ? 2 : 1;
    const COL_TELEFONO = certMode === 'with-code' ? 3 : 2;
    const COL_CORREO_LINK = certMode === 'with-code' ? 4 : 3;
    const COL_WHATSAPP_LINK = certMode === 'with-code' ? 5 : 4;
    const COL_PDF_LINK = certMode === 'with-code' ? 6 : 5;
    const COL_ESTADO = certMode === 'with-code' ? 7 : 6;
    
    const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, numColumns).getValues();
    const folder = DriveApp.getFolderById(folderProtegidosId);
    
    console.log('[LINKS] Modo:', certMode, 'Columnas:', numColumns);
    
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
        continue;
      }
      
      const nombreArchivo = 'Certificado - ' + nombre + '.pdf';
      
      if (mapaPDF[nombreArchivo]) {
        const fileId = mapaPDF[nombreArchivo];
        const enlacePDF = 'https://drive.google.com/file/d/' + fileId + '/view';
        
        const emailBody = replaceVariables(emailTemplate, nombre, webinarTitle, webinarDate, enlacePDF);
        const mensajeWA = replaceVariables(whatsappTemplate, nombre, webinarTitle, webinarDate, enlacePDF);
        
        const emailBodyUriEncoded = encodeURIComponent(emailBody);
        
        const enlaceCorreo = 'mailto:' + correo + '?subject=Entrega de certificado - ' + encodeURIComponent(webinarTitle) + '&body=' + emailBodyUriEncoded;
        
        const telefonoStr = telefono ? String(telefono).replace(/[^0-9]/g, '') : '';
        const enlaceWhatsApp = telefonoStr ? 'https://wa.me/' + telefonoStr + '?text=' + encodeURIComponent(mensajeWA) : '';
        
        const enlaceCorreoEscapado = enlaceCorreo.replace(/"/g, '""');
        const enlaceWhatsAppEscapado = enlaceWhatsApp ? enlaceWhatsApp.replace(/"/g, '""') : '';
        const enlacePDFEscapado = enlacePDF.replace(/"/g, '""');
        
        hoja.getRange(fila, COL_CORREO_LINK + 1).setFormula('=HYPERLINK("' + enlaceCorreoEscapado + '", "Enviar correo")');
        if (enlaceWhatsApp) {
          hoja.getRange(fila, COL_WHATSAPP_LINK + 1).setFormula('=HYPERLINK("' + enlaceWhatsAppEscapado + '", "Enviar WhatsApp")');
        } else {
          hoja.getRange(fila, COL_WHATSAPP_LINK + 1).setValue('Sin teléfono');
        }
        hoja.getRange(fila, COL_PDF_LINK + 1).setFormula('=HYPERLINK("' + enlacePDFEscapado + '", "Ver PDF protegido")');
        hoja.getRange(fila, COL_ESTADO + 1).setValue('✅ Encontrado');
        
        created++;
      } else {
        hoja.getRange(fila, COL_CORREO_LINK + 1, 1, 3).clearContent();
        hoja.getRange(fila, COL_ESTADO + 1).setValue('❌ No encontrado');
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
}`;

