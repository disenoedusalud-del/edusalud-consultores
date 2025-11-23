// Código completo del Google Apps Script para el Generador de Certificados
// Cargar el código de forma segura usando una función
(function() {
  'use strict';
  
  // Función que retorna el código del Google Apps Script
  function getGoogleAppsScriptCode() {
    return 'function doGet(e) {\n' +
      '  const action = e.parameter.action;\n' +
      '  let result;\n' +
      '  try {\n' +
      '    switch(action) {\n' +
      '      case \'test\':\n' +
      '        return ContentService.createTextOutput(JSON.stringify({\n' +
      '          success: true,\n' +
      '          message: \'Conexión exitosa\',\n' +
      '          timestamp: new Date().toISOString()\n' +
      '        })).setMimeType(ContentService.MimeType.JSON);\n' +
      '      case \'listSlides\':\n' +
      '        result = listMySlides();\n' +
      '        break;\n' +
      '      case \'listSheets\':\n' +
      '        result = listMySheets();\n' +
      '        break;\n' +
      '      case \'listFolders\':\n' +
      '        result = listMyFolders();\n' +
      '        break;\n' +
      '      default:\n' +
      '        throw new Error(\'Acción no válida\');\n' +
      '    }\n' +
      '    return ContentService.createTextOutput(JSON.stringify({\n' +
      '      success: true,\n' +
      '      data: result\n' +
      '    })).setMimeType(ContentService.MimeType.JSON);\n' +
      '  } catch (error) {\n' +
      '    return ContentService.createTextOutput(JSON.stringify({\n' +
      '      success: false,\n' +
      '      error: error.message\n' +
      '    })).setMimeType(ContentService.MimeType.JSON);\n' +
      '  }\n' +
      '}\n' +
      'function doPost(e) {\n' +
      '  console.log(\'[DOPOST] ===== Iniciando doPost =====\');\n' +
      '  console.log(\'[DOPOST] postData existe:\', !!e.postData);\n' +
      '  if (e.postData) {\n' +
      '    console.log(\'[DOPOST] postData.type:\', e.postData.type);\n' +
      '    console.log(\'[DOPOST] postData.contents (primeros 200 chars):\', e.postData.contents ? e.postData.contents.substring(0, 200) : \'vacío\');\n' +
      '  }\n' +
      '  console.log(\'[DOPOST] parameters:\', e.parameter);\n' +
      '  let data;\n' +
      '  try {\n' +
      '    if (e.postData && (e.postData.type === \'application/json\' || e.postData.type === \'text/plain\')) {\n' +
      '      console.log(\'[DOPOST] Parseando como JSON (tipo:\', e.postData.type + \')\');\n' +
      '      data = JSON.parse(e.postData.contents);\n' +
      '      console.log(\'[DOPOST] Datos parseados (primeros 200 chars):\', JSON.stringify(data).substring(0, 200));\n' +
      '    } else if (e.postData && e.postData.contents) {\n' +
      '      console.log(\'[DOPOST] Intentando parsear postData.contents como JSON\');\n' +
      '      try {\n' +
      '        data = JSON.parse(e.postData.contents);\n' +
      '        console.log(\'[DOPOST] Datos parseados (primeros 200 chars):\', JSON.stringify(data).substring(0, 200));\n' +
      '      } catch (parseError) {\n' +
      '        console.error(\'[DOPOST] Error parseando JSON:\', parseError.message);\n' +
      '        throw new Error(\'No se pudo parsear el JSON: \' + parseError.message);\n' +
      '      }\n' +
      '    } else {\n' +
      '      console.log(\'[DOPOST] Leyendo desde parameters (form data)\');\n' +
      '      const params = e.parameter;\n' +
      '      data = {\n' +
      '        action: params.action,\n' +
      '        params: params.params ? JSON.parse(decodeURIComponent(params.params)) : {}\n' +
      '      };\n' +
      '      console.log(\'[DOPOST] Datos desde parameters:\', JSON.stringify(data).substring(0, 200));\n' +
      '    }\n' +
      '    if (!data || !data.action) {\n' +
      '      console.error(\'[DOPOST] ❌ No se encontró la acción en los datos recibidos\');\n' +
      '      throw new Error(\'No se encontró la acción en los datos recibidos\');\n' +
      '    }\n' +
      '    console.log(\'[DOPOST] Acción recibida:\', data.action);\n' +
      '  } catch (error) {\n' +
      '    console.error(\'[DOPOST] ❌ Error parseando datos:\', error.message);\n' +
      '    console.error(\'[DOPOST] Stack:\', error.stack);\n' +
      '    return ContentService.createTextOutput(JSON.stringify({\n' +
      '      success: false,\n' +
      '      error: \'Error parseando datos: \' + error.message\n' +
      '    })).setMimeType(ContentService.MimeType.JSON);\n' +
      '  }\n' +
      '  const action = data.action;\n' +
      '  const params = data.params || {};\n' +
      '  console.log(\'[DOPOST] Procesando acción:\', action);\n' +
      '  console.log(\'[DOPOST] Parámetros (primeros 200 chars):\', JSON.stringify(params).substring(0, 200));\n' +
      '  let result;\n' +
      '  try {\n' +
      '    switch(action) {\n' +
      '      case \'createSheet\':\n' +
      '        console.log(\'[DOPOST] Llamando a createNewSheet\');\n' +
      '        result = createNewSheet(params);\n' +
      '        break;\n' +
      '      case \'createFolder\':\n' +
      '        console.log(\'[DOPOST] Llamando a createNewFolder\');\n' +
      '        result = createNewFolder(params);\n' +
      '        break;\n' +
      '      case \'generatePDFs\':\n' +
      '        console.log(\'[DOPOST] Llamando a generarCertificadosYGuardarPDF\');\n' +
      '        result = generarCertificadosYGuardarPDF(params);\n' +
      '        console.log(\'[DOPOST] Resultado (primeros 200 chars):\', JSON.stringify(result).substring(0, 200));\n' +
      '        break;\n' +
      '      case \'generateLinks\':\n' +
      '        console.log(\'[DOPOST] Llamando a generarLinksDesdePDFProtegido\');\n' +
      '        result = generarLinksDesdePDFProtegido(params);\n' +
      '        break;\n' +
      '      default:\n' +
      '        console.error(\'[DOPOST] ❌ Acción no válida:\', action);\n' +
      '        throw new Error(\'Acción no válida: \' + action);\n' +
      '    }\n' +
      '    console.log(\'[DOPOST] ✅ Éxito, retornando resultado\');\n' +
      '    return ContentService.createTextOutput(JSON.stringify({\n' +
      '      success: true,\n' +
      '      ...result\n' +
      '    })).setMimeType(ContentService.MimeType.JSON);\n' +
      '  } catch (error) {\n' +
      '    console.error(\'[DOPOST] ❌ Error procesando acción:\', error.message);\n' +
      '    console.error(\'[DOPOST] Stack:\', error.stack);\n' +
      '    return ContentService.createTextOutput(JSON.stringify({\n' +
      '      success: false,\n' +
      '      error: error.message,\n' +
      '      stack: error.stack ? error.stack.substring(0, 500) : \'No hay stack\'\n' +
      '    })).setMimeType(ContentService.MimeType.JSON);\n' +
      '  }\n' +
      '}\n' +
      'function doOptions() {\n' +
      '  return ContentService.createTextOutput(JSON.stringify({\n' +
      '    success: true,\n' +
      '    message: \'CORS preflight OK\'\n' +
      '  })).setMimeType(ContentService.MimeType.JSON);\n' +
      '}\n' +
      'function listMySlides() {\n' +
      '  try {\n' +
      '    const files = DriveApp.getFilesByType(MimeType.GOOGLE_SLIDES);\n' +
      '    const slides = [];\n' +
      '    while (files.hasNext()) {\n' +
      '      const file = files.next();\n' +
      '      slides.push({\n' +
      '        id: file.getId(),\n' +
      '        name: file.getName(),\n' +
      '        url: file.getUrl(),\n' +
      '        modified: file.getLastUpdated().getTime()\n' +
      '      });\n' +
      '    }\n' +
      '    return slides.sort((a, b) => b.modified - a.modified);\n' +
      '  } catch (error) {\n' +
      '    throw new Error(\'Error listando Slides: \' + error.message);\n' +
      '  }\n' +
      '}\n' +
      'function listMySheets() {\n' +
      '  try {\n' +
      '    const files = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);\n' +
      '    const sheets = [];\n' +
      '    while (files.hasNext()) {\n' +
      '      const file = files.next();\n' +
      '      sheets.push({\n' +
      '        id: file.getId(),\n' +
      '        name: file.getName(),\n' +
      '        url: file.getUrl(),\n' +
      '        modified: file.getLastUpdated().getTime()\n' +
      '      });\n' +
      '    }\n' +
      '    return sheets.sort((a, b) => b.modified - a.modified);\n' +
      '  } catch (error) {\n' +
      '    throw new Error(\'Error listando Sheets: \' + error.message);\n' +
      '  }\n' +
      '}\n' +
      'function listMyFolders() {\n' +
      '  try {\n' +
      '    const folders = [];\n' +
      '    const rootFolders = DriveApp.getRootFolder().getFolders();\n' +
      '    while (rootFolders.hasNext()) {\n' +
      '      const folder = rootFolders.next();\n' +
      '      folders.push({\n' +
      '        id: folder.getId(),\n' +
      '        name: folder.getName(),\n' +
      '        url: folder.getUrl()\n' +
      '      });\n' +
      '    }\n' +
      '    const myDriveFolders = DriveApp.getFolders();\n' +
      '    while (myDriveFolders.hasNext()) {\n' +
      '      const folder = myDriveFolders.next();\n' +
      '      if (!folders.find(f => f.id === folder.getId())) {\n' +
      '        folders.push({\n' +
      '          id: folder.getId(),\n' +
      '          name: folder.getName(),\n' +
      '          url: folder.getUrl()\n' +
      '        });\n' +
      '      }\n' +
      '    }\n' +
      '    return folders.sort((a, b) => a.name.localeCompare(b.name));\n' +
      '  } catch (error) {\n' +
      '    throw new Error(\'Error listando Folders: \' + error.message);\n' +
      '  }\n' +
      '}\n' +
      'function createNewSheet(params) {\n' +
      '  try {\n' +
      '    const { name, mode } = params;\n' +
      '    if (!name || name.trim() === \'\') {\n' +
      '      throw new Error(\'El nombre de la hoja es requerido\');\n' +
      '    }\n' +
      '    const spreadsheet = SpreadsheetApp.create(name.trim());\n' +
      '    const sheet = spreadsheet.getActiveSheet();\n' +
      '    let headers;\n' +
      '    let numColumns;\n' +
      '    if (mode === \'with-code\') {\n' +
      '      headers = [\n' +
      '        \'Nombre\', \'Código Validación\', \'Correo\', \'Teléfono\',\n' +
      '        \'Correo link\', \'WhatsApp link\', \'Link PDF\', \'Estado\', \'Certificado generado\'\n' +
      '      ];\n' +
      '      numColumns = 9;\n' +
      '    } else {\n' +
      '      headers = [\n' +
      '        \'Nombre\', \'Correo\', \'Teléfono\', \'Correo link\',\n' +
      '        \'WhatsApp link\', \'Link PDF\', \'Estado\', \'Certificado generado\'\n' +
      '      ];\n' +
      '      numColumns = 8;\n' +
      '    }\n' +
      '    sheet.getRange(1, 1, 1, numColumns).setValues([headers]);\n' +
      '    const headerRange = sheet.getRange(1, 1, 1, numColumns);\n' +
      '    headerRange.setFontWeight(\'bold\');\n' +
      '    headerRange.setBackground(\'#4285f4\');\n' +
      '    headerRange.setFontColor(\'#ffffff\');\n' +
      '    return {\n' +
      '      id: spreadsheet.getId(),\n' +
      '      name: spreadsheet.getName(),\n' +
      '      url: spreadsheet.getUrl()\n' +
      '    };\n' +
      '  } catch (error) {\n' +
      '    throw new Error(\'Error creando hoja: \' + error.message);\n' +
      '  }\n' +
      '}\n' +
      'function createNewFolder(params) {\n' +
      '  try {\n' +
      '    const { name } = params;\n' +
      '    if (!name || name.trim() === \'\') {\n' +
      '      throw new Error(\'El nombre de la carpeta es requerido\');\n' +
      '    }\n' +
      '    const folder = DriveApp.createFolder(name.trim());\n' +
      '    return {\n' +
      '      id: folder.getId(),\n' +
      '      name: folder.getName(),\n' +
      '      url: folder.getUrl()\n' +
      '    };\n' +
      '  } catch (error) {\n' +
      '    throw new Error(\'Error creando carpeta: \' + error.message);\n' +
      '  }\n' +
      '}\n' +
      'function generarCertificadosYGuardarPDF(params) {\n' +
      '  try {\n' +
      '    console.log(\'[GENERATOR] Iniciando generación de certificados\');\n' +
      '    console.log(\'[GENERATOR] Parámetros recibidos:\', params);\n' +
      '    const startTime = new Date().getTime();\n' +
      '    const MAX_EXECUTION_TIME = 330000;\n' +
      '    const { slideTemplateId, outputFolderId, sheetId, mode } = params;\n' +
      '    const certMode = mode || \'webinar\';\n' +
      '    if (!slideTemplateId || !outputFolderId || !sheetId) {\n' +
      '      throw new Error(\'Faltan parámetros requeridos. Verifica: slideTemplateId, outputFolderId, sheetId\');\n' +
      '    }\n' +
      '    console.log(\'[GENERATOR] Modo de certificado:\', certMode);\n' +
      '    console.log(\'[GENERATOR] Abriendo hoja de cálculo:\', sheetId);\n' +
      '    let spreadsheet;\n' +
      '    try {\n' +
      '      spreadsheet = SpreadsheetApp.openById(sheetId);\n' +
      '    } catch (e) {\n' +
      '      throw new Error(\'No se puede acceder a la hoja de cálculo. Verifica el ID y los permisos: \' + e.message);\n' +
      '    }\n' +
      '    const hoja = spreadsheet.getSheetByName(\'Hoja 1\');\n' +
      '    if (!hoja) {\n' +
      '      throw new Error(\'No se encontró la hoja "Hoja 1". Verifica el nombre de la hoja.\');\n' +
      '    }\n' +
      '    console.log(\'[GENERATOR] Obteniendo datos de la hoja\');\n' +
      '    const lastRow = hoja.getLastRow();\n' +
      '    if (lastRow < 2) {\n' +
      '      return {\n' +
      '        total: 0,\n' +
      '        generated: 0,\n' +
      '        errors: 0,\n' +
      '        message: \'No hay datos en la hoja (solo encabezados)\'\n' +
      '      };\n' +
      '    }\n' +
      '    const numColumns = certMode === \'with-code\' ? 9 : 8;\n' +
      '    const COL_NOMBRE = 0;\n' +
      '    const COL_CODIGO = certMode === \'with-code\' ? 1 : -1;\n' +
      '    const COL_CORREO = certMode === \'with-code\' ? 2 : 1;\n' +
      '    const COL_TELEFONO = certMode === \'with-code\' ? 3 : 2;\n' +
      '    const COL_CERTIFICADO_GENERADO = certMode === \'with-code\' ? 8 : 7;\n' +
      '    const datos = hoja.getRange(2, 1, lastRow - 1, numColumns).getValues();\n' +
      '    console.log(\'[GENERATOR] Filas de datos encontradas:\', datos.length);\n' +
      '    console.log(\'[GENERATOR] Modo:\', certMode, \'Columnas:\', numColumns);\n' +
      '    console.log(\'[GENERATOR] Validando plantilla:\', slideTemplateId);\n' +
      '    let templateFile;\n' +
      '    try {\n' +
      '      templateFile = DriveApp.getFileById(slideTemplateId);\n' +
      '      console.log(\'[GENERATOR] Plantilla encontrada:\', templateFile.getName());\n' +
      '    } catch (e) {\n' +
      '      throw new Error(\'No se puede acceder a la plantilla. Verifica el ID y los permisos: \' + e.message);\n' +
      '    }\n' +
      '    console.log(\'[GENERATOR] Validando carpeta de salida:\', outputFolderId);\n' +
      '    let outputFolder;\n' +
      '    try {\n' +
      '      outputFolder = DriveApp.getFolderById(outputFolderId);\n' +
      '      console.log(\'[GENERATOR] Carpeta encontrada:\', outputFolder.getName());\n' +
      '    } catch (e) {\n' +
      '      throw new Error(\'No se puede acceder a la carpeta de salida. Verifica el ID y los permisos: \' + e.message);\n' +
      '    }\n' +
      '    let total = 0;\n' +
      '    let generated = 0;\n' +
      '    let errors = 0;\n' +
      '    let skipped = 0;\n' +
      '    const errorMessages = [];\n' +
      '    let pendingCount = 0;\n' +
      '    for (let i = 0; i < datos.length; i++) {\n' +
      '      const nombre = datos[i][COL_NOMBRE];\n' +
      '      const yaGenerado = datos[i][COL_CERTIFICADO_GENERADO];\n' +
      '      if (!nombre || nombre.toString().trim() === \'\') {\n' +
      '        continue;\n' +
      '      }\n' +
      '      if (yaGenerado !== \'✅\' && yaGenerado !== \'OK\') {\n' +
      '        pendingCount++;\n' +
      '      }\n' +
      '    }\n' +
      '    console.log(\'[GENERATOR] Total pendientes: \' + pendingCount);\n' +
      '    for (let i = 0; i < datos.length; i++) {\n' +
      '      if (i > 0 && i % 5 === 0) {\n' +
      '        const elapsed = new Date().getTime() - startTime;\n' +
      '        if (elapsed >= MAX_EXECUTION_TIME) {\n' +
      '          console.log(\'[GENERATOR] ⏰ Límite de tiempo alcanzado. Deteniendo para evitar timeout.\');\n' +
      '          let remaining = 0;\n' +
      '          for (let j = i; j < datos.length; j++) {\n' +
      '            const nombreRestante = datos[j][COL_NOMBRE];\n' +
      '            const yaGeneradoRestante = datos[j][COL_CERTIFICADO_GENERADO];\n' +
      '            if (nombreRestante && nombreRestante.toString().trim() !== \'\' &&\n' +
      '                yaGeneradoRestante !== \'✅\' && yaGeneradoRestante !== \'OK\') {\n' +
      '              remaining++;\n' +
      '            }\n' +
      '          }\n' +
      '          return {\n' +
      '            total: pendingCount,\n' +
      '            generated: generated,\n' +
      '            errors: errors,\n' +
      '            skipped: skipped,\n' +
      '            pending: remaining,\n' +
      '            timeout: true,\n' +
      '            message: \'⏰ Límite de tiempo alcanzado. Procesados \' + generated + \' certificados. Quedan \' + remaining + \' pendientes. Ejecuta nuevamente para continuar.\',\n' +
      '            errorMessages: errorMessages.slice(0, 10)\n' +
      '          };\n' +
      '        }\n' +
      '      }\n' +
      '      const nombre = datos[i][COL_NOMBRE];\n' +
      '      const codigoValidacion = certMode === \'with-code\' ? datos[i][COL_CODIGO] : null;\n' +
      '      const yaGenerado = datos[i][COL_CERTIFICADO_GENERADO];\n' +
      '      if (!nombre || nombre.toString().trim() === \'\') {\n' +
      '        console.log(\'[GENERATOR] Fila \' + (i + 2) + \': Nombre vacío, omitiendo\');\n' +
      '        continue;\n' +
      '      }\n' +
      '      if (certMode === \'with-code\') {\n' +
      '        if (!codigoValidacion || codigoValidacion.toString().trim() === \'\') {\n' +
      '          console.log(\'[GENERATOR] Fila \' + (i + 2) + \': Código de validación vacío, omitiendo\');\n' +
      '          hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue(\'❌ Error: Código de validación faltante\');\n' +
      '          errors++;\n' +
      '          errorMessages.push(\'Fila \' + (i + 2) + \' (\' + nombre + \'): Código de validación faltante\');\n' +
      '          continue;\n' +
      '        }\n' +
      '      }\n' +
      '      total++;\n' +
      '      if (yaGenerado === \'✅\' || yaGenerado === \'OK\') {\n' +
      '        console.log(\'[GENERATOR] \' + nombre + \': Ya generado, omitiendo\');\n' +
      '        skipped++;\n' +
      '        continue;\n' +
      '      }\n' +
      '      console.log(\'[GENERATOR] Procesando certificado \' + (generated + 1) + \' de \' + total + \': \' + nombre);\n' +
      '      try {\n' +
      '        console.log(\'[GENERATOR] Creando copia de plantilla para:\', nombre);\n' +
      '        const copia = templateFile.makeCopy(\'Certificado - \' + nombre);\n' +
      '        const copiaId = copia.getId();\n' +
      '        console.log(\'[GENERATOR] Copia creada:\', copiaId);\n' +
      '        console.log(\'[GENERATOR] Abriendo presentación:\', copiaId);\n' +
      '        const presentacion = SlidesApp.openById(copiaId);\n' +
      '        console.log(\'[GENERATOR] Reemplazando texto en diapositivas\');\n' +
      '        const slides = presentacion.getSlides();\n' +
      '        slides.forEach(function(slide, index) {\n' +
      '          slide.replaceAllText(\'{{NOMBRE}}\', nombre);\n' +
      '          if (certMode === \'with-code\' && codigoValidacion) {\n' +
      '            const codigoStr = codigoValidacion.toString().trim();\n' +
      '            slide.replaceAllText(\'{{CODIGO_VALIDACION}}\', codigoStr);\n' +
      '            console.log(\'[GENERATOR] Diapositiva \' + (index + 1) + \' actualizada (Nombre: \' + nombre + \', Código: \' + codigoStr + \')\');\n' +
      '          } else {\n' +
      '            console.log(\'[GENERATOR] Diapositiva \' + (index + 1) + \' actualizada (Nombre: \' + nombre + \')\');\n' +
      '          }\n' +
      '        });\n' +
      '        console.log(\'[GENERATOR] Guardando y cerrando presentación\');\n' +
      '        presentacion.saveAndClose();\n' +
      '        console.log(\'[GENERATOR] Generando PDF\');\n' +
      '        const pdf = DriveApp.getFileById(copiaId).getAs(MimeType.PDF);\n' +
      '        console.log(\'[GENERATOR] Guardando PDF en carpeta\');\n' +
      '        outputFolder.createFile(pdf).setName(\'Certificado - \' + nombre + \'.pdf\');\n' +
      '        console.log(\'[GENERATOR] Eliminando copia temporal del Slide\');\n' +
      '        copia.setTrashed(true);\n' +
      '        console.log(\'[GENERATOR] Marcando como generado en hoja\');\n' +
      '        hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue(\'✅\');\n' +
      '        generated++;\n' +
      '        console.log(\'[GENERATOR] ✅ Certificado generado exitosamente para:\', nombre);\n' +
      '      } catch (error) {\n' +
      '        errors++;\n' +
      '        const errorMsg = \'Error en \' + nombre + \': \' + error.message;\n' +
      '        errorMessages.push(errorMsg);\n' +
      '        console.error(\'[GENERATOR] ❌ \' + errorMsg);\n' +
      '        console.error(\'[GENERATOR] Stack:\', error.stack);\n' +
      '        try {\n' +
      '          hoja.getRange(i + 2, COL_CERTIFICADO_GENERADO + 1).setValue(\'❌ Error: \' + error.message.substring(0, 50));\n' +
      '        } catch (writeError) {\n' +
      '          console.error(\'[GENERATOR] ❌ No se pudo escribir error en hoja:\', writeError.message);\n' +
      '        }\n' +
      '      }\n' +
      '    }\n' +
      '    console.log(\'[GENERATOR] Proceso completado. Total: \' + total + \', Generados: \' + generated + \', Errores: \' + errors + \', Omitidos: \' + skipped);\n' +
      '    return {\n' +
      '      total: pendingCount || total,\n' +
      '      generated: generated,\n' +
      '      errors: errors,\n' +
      '      skipped: skipped,\n' +
      '      pending: 0,\n' +
      '      timeout: false,\n' +
      '      message: \'Procesados \' + (pendingCount || total) + \' registros. Generados: \' + generated + \', Errores: \' + errors + \', Omitidos: \' + skipped,\n' +
      '      errorMessages: errorMessages.slice(0, 10)\n' +
      '    };\n' +
      '  } catch (error) {\n' +
      '    console.error(\'[GENERATOR] ❌ Error fatal:\', error.message);\n' +
      '    console.error(\'[GENERATOR] Stack:\', error.stack);\n' +
      '    throw new Error(\'Error generando certificados: \' + error.message);\n' +
      '  }\n' +
      '}\n' +
      'function generarLinksDesdePDFProtegido(params) {\n' +
      '  try {\n' +
      '    const { sheetId, folderProtegidosId, webinarTitle, webinarDate, emailMessage, whatsappMessage, mode } = params;\n' +
      '    const certMode = mode || \'webinar\';\n' +
      '    if (!sheetId || !folderProtegidosId || !webinarTitle || !webinarDate) {\n' +
      '      throw new Error(\'Faltan parámetros requeridos\');\n' +
      '    }\n' +
      '    console.log(\'[LINKS] Modo de certificado:\', certMode);\n' +
      '    const defaultEmailMessage = \'Estimada/o {{NOMBRE}},\\n\\nGracias por participar en el webinar {{TITULO}}, realizado el {{FECHA}}.\\n\\nAquí puede descargar su certificado de participación:\\n{{ENLACE_PDF}}\\n\\nCordialmente,\\nPrograma Educación Continua en Salud – EduSalud\\nFacultad de Ciencias Médicas – UNAH\';\n' +
      '    const defaultWhatsappMessage = \'Hola {{NOMBRE}}, gracias por participar en el webinar "{{TITULO}}", realizado el {{FECHA}}.\\n\\nAquí puede descargar su certificado de participación:\\n{{ENLACE_PDF}}\\n\\nSaludos cordiales,\\nEduSalud – UNAH\';\n' +
      '    const emailTemplate = emailMessage || defaultEmailMessage;\n' +
      '    const whatsappTemplate = whatsappMessage || defaultWhatsappMessage;\n' +
      '    function replaceVariables(template, nombre, titulo, fecha, enlacePDF) {\n' +
      '      return template\n' +
      '        .replace(/\\{\\{NOMBRE\\}\\}/g, nombre)\n' +
      '        .replace(/\\{\\{TITULO\\}\\}/g, titulo)\n' +
      '        .replace(/\\{\\{FECHA\\}\\}/g, fecha)\n' +
      '        .replace(/\\{\\{ENLACE_PDF\\}\\}/g, enlacePDF);\n' +
      '    }\n' +
      '    const hoja = SpreadsheetApp.openById(sheetId).getSheetByName(\'Hoja 1\');\n' +
      '    if (!hoja) {\n' +
      '      throw new Error(\'No se encontró la hoja "Hoja 1"\');\n' +
      '    }\n' +
      '    const numColumns = certMode === \'with-code\' ? 9 : 8;\n' +
      '    const COL_NOMBRE = 0;\n' +
      '    const COL_CORREO = certMode === \'with-code\' ? 2 : 1;\n' +
      '    const COL_TELEFONO = certMode === \'with-code\' ? 3 : 2;\n' +
      '    const COL_CORREO_LINK = certMode === \'with-code\' ? 4 : 3;\n' +
      '    const COL_WHATSAPP_LINK = certMode === \'with-code\' ? 5 : 4;\n' +
      '    const COL_PDF_LINK = certMode === \'with-code\' ? 6 : 5;\n' +
      '    const COL_ESTADO = certMode === \'with-code\' ? 7 : 6;\n' +
      '    const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, numColumns).getValues();\n' +
      '    const folder = DriveApp.getFolderById(folderProtegidosId);\n' +
      '    console.log(\'[LINKS] Modo:\', certMode, \'Columnas:\', numColumns);\n' +
      '    const mapaPDF = {};\n' +
      '    const archivos = folder.getFiles();\n' +
      '    while (archivos.hasNext()) {\n' +
      '      const archivo = archivos.next();\n' +
      '      if (archivo.getMimeType() === MimeType.PDF) {\n' +
      '        mapaPDF[archivo.getName()] = archivo.getId();\n' +
      '      }\n' +
      '    }\n' +
      '    let total = 0;\n' +
      '    let created = 0;\n' +
      '    let notFound = 0;\n' +
      '    for (let i = 0; i < datos.length; i++) {\n' +
      '      const nombre = datos[i][COL_NOMBRE];\n' +
      '      const correo = datos[i][COL_CORREO];\n' +
      '      const telefono = datos[i][COL_TELEFONO];\n' +
      '      const estado = datos[i][COL_ESTADO];\n' +
      '      const fila = i + 2;\n' +
      '      if (!nombre || nombre.toString().trim() === \'\') continue;\n' +
      '      total++;\n' +
      '      if (estado === \'✅ Encontrado\') {\n' +
      '        continue;\n' +
      '      }\n' +
      '      const nombreArchivo = \'Certificado - \' + nombre + \'.pdf\';\n' +
      '      if (mapaPDF[nombreArchivo]) {\n' +
      '        const fileId = mapaPDF[nombreArchivo];\n' +
      '        const enlacePDF = \'https://drive.google.com/file/d/\' + fileId + \'/view\';\n' +
      '        const emailBody = replaceVariables(emailTemplate, nombre, webinarTitle, webinarDate, enlacePDF);\n' +
      '        const mensajeWA = replaceVariables(whatsappTemplate, nombre, webinarTitle, webinarDate, enlacePDF);\n' +
      '        const emailBodyUriEncoded = encodeURIComponent(emailBody);\n' +
      '        const enlaceCorreo = \'mailto:\' + correo + \'?subject=Entrega de certificado - \' + encodeURIComponent(webinarTitle) + \'&body=\' + emailBodyUriEncoded;\n' +
      '        const telefonoStr = telefono ? String(telefono).replace(/[^0-9]/g, \'\') : \'\';\n' +
      '        const enlaceWhatsApp = telefonoStr ? \'https://wa.me/\' + telefonoStr + \'?text=\' + encodeURIComponent(mensajeWA) : \'\';\n' +
      '        const enlaceCorreoEscapado = enlaceCorreo.replace(/"/g, \'""\');\n' +
      '        const enlaceWhatsAppEscapado = enlaceWhatsApp ? enlaceWhatsApp.replace(/"/g, \'""\') : \'\';\n' +
      '        const enlacePDFEscapado = enlacePDF.replace(/"/g, \'""\');\n' +
      '        hoja.getRange(fila, COL_CORREO_LINK + 1).setFormula(\'=HYPERLINK("\' + enlaceCorreoEscapado + \'", "Enviar correo")\');\n' +
      '        if (enlaceWhatsApp) {\n' +
      '          hoja.getRange(fila, COL_WHATSAPP_LINK + 1).setFormula(\'=HYPERLINK("\' + enlaceWhatsAppEscapado + \'", "Enviar WhatsApp")\');\n' +
      '        } else {\n' +
      '          hoja.getRange(fila, COL_WHATSAPP_LINK + 1).setValue(\'Sin teléfono\');\n' +
      '        }\n' +
      '        hoja.getRange(fila, COL_PDF_LINK + 1).setFormula(\'=HYPERLINK("\' + enlacePDFEscapado + \'", "Ver PDF protegido")\');\n' +
      '        hoja.getRange(fila, COL_ESTADO + 1).setValue(\'✅ Encontrado\');\n' +
      '        created++;\n' +
      '      } else {\n' +
      '        hoja.getRange(fila, COL_CORREO_LINK + 1, 1, 3).clearContent();\n' +
      '        hoja.getRange(fila, COL_ESTADO + 1).setValue(\'❌ No encontrado\');\n' +
      '        notFound++;\n' +
      '      }\n' +
      '    }\n' +
      '    return {\n' +
      '      total: total,\n' +
      '      created: created,\n' +
      '      notFound: notFound\n' +
      '    };\n' +
      '  } catch (error) {\n' +
      '    throw new Error(\'Error generando enlaces: \' + error.message);\n' +
      '  }\n' +
      '}\n';
  }
  
  // Asignar el código a window para acceso global
  window.GOOGLE_APPS_SCRIPT_CODE = getGoogleAppsScriptCode();
})();
