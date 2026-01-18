# Instrucciones para Proteger Google Apps Script con Token

## ⚠️ IMPORTANTE: Solución Simplificada

En lugar de usar Firebase Admin SDK (que requiere librerías externas), usaremos un **token compartido secreto** que es más simple y funciona inmediatamente.

---

## Paso 1: Generar Token Secreto

1. Abre tu proyecto de Google Apps Script
2. Ve a **Ejecutar > Ejecutar función > `generateSecretToken`** (crearemos esta función)
3. Copia el token generado (lo necesitarás en el Paso 2)

**O genera uno manualmente:**
- Puedes usar cualquier generador de tokens online
- O ejecuta esto en la consola del navegador: `btoa(Date.now() + Math.random().toString(36))`
- O usa este formato: `GAS_SECRET_` + un string aleatorio de 32 caracteres

**Ejemplo de token:** `GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

## Paso 2: Configurar Token en Google Apps Script

Agrega esta función a tu Google Apps Script y ejecútala **UNA VEZ**:

```javascript
// ✅ EJECUTAR ESTA FUNCIÓN UNA VEZ para configurar el token secreto
function setupSecretToken() {
  const properties = PropertiesService.getScriptProperties();
  
  // ⚠️ REEMPLAZA ESTE TOKEN con uno que generes tú (mínimo 32 caracteres)
  const secretToken = 'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
  
  // Guardar en Properties Service (almacenamiento seguro)
  properties.setProperty('GAS_SECRET_TOKEN', secretToken);
  
  console.log('✅ Token secreto configurado correctamente');
  console.log('⚠️ IMPORTANTE: Guarda este token en un lugar seguro');
  console.log('Token:', secretToken);
  
  return secretToken;
}
```

**Pasos:**
1. Copia la función `setupSecretToken()` en tu Google Apps Script
2. Reemplaza `'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'` con un token que generes tú
3. Ve a **Ejecutar > Ejecutar función > `setupSecretToken`**
4. Copia el token que se muestra en los logs
5. **Guarda este token** - lo necesitarás para configurar en `app.js`

---

## Paso 3: Agregar Función de Validación

Agrega esta función a tu Google Apps Script (antes de `doGet`):

```javascript
// ✅ Validar token de autenticación
function validateToken(token) {
  if (!token) {
    console.log('[AUTH] ❌ Token no proporcionado');
    return false;
  }
  
  try {
    // Obtener token secreto desde Properties Service
    const properties = PropertiesService.getScriptProperties();
    const secretToken = properties.getProperty('GAS_SECRET_TOKEN');
    
    if (!secretToken) {
      console.error('[AUTH] ❌ Token secreto no configurado. Ejecuta setupSecretToken() primero.');
      return false;
    }
    
    // Comparar token recibido con el secreto almacenado
    if (token === secretToken) {
      console.log('[AUTH] ✅ Token válido');
      return true;
    } else {
      console.log('[AUTH] ❌ Token inválido');
      return false;
    }
  } catch (error) {
    console.error('[AUTH] ❌ Error validando token:', error);
    return false;
  }
}
```

---

## Paso 4: Modificar función doGet

Modifica tu función `doGet` para validar el token antes de procesar:

```javascript
function doGet(e) {
  // ✅ Validar token de autenticación
  const token = e.parameter.token;
  
  if (!validateToken(token)) {
    return ContentService.createTextOutput(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Token de autenticación inválido o faltante'
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  
  // ✅ Continuar con la lógica existente
  const hex = e.parameter.hex;
  const callback = e.parameter.callback;
  
  // ... resto de tu código existente ...
  
  // Ejemplo de respuesta JSONP:
  if (callback) {
    const result = {
      success: true,
      files: [] // Tu lógica para obtener archivos
    };
    return ContentService.createTextOutput(
      callback + '(' + JSON.stringify(result) + ');'
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  // Respuesta JSON normal
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, files: [] })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

---

## Paso 5: Configurar Token en app.js

Ahora necesitas configurar el mismo token en tu aplicación web:

1. Abre `assets/js/app.js`
2. Busca la función `getAuthToken()` (debería estar alrededor de la línea 3200)
3. Modifica la función para incluir el token secreto:

```javascript
// ✅ Helper para obtener token de Firebase Auth para autenticación con GAS
async function getAuthToken() {
  try {
    const currentUser = window.firebaseAuth?.currentUser;
    let token = null;
    
    if (currentUser) {
      // Obtener token de Firebase Auth
      token = await currentUser.getIdToken();
    }
    
    // ⚠️ AGREGAR: Token secreto compartido (debe coincidir con el de GAS)
    const GAS_SECRET_TOKEN = 'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
    
    // Si hay usuario autenticado, usar su token de Firebase
    // Si no, usar token secreto como fallback
    return token || GAS_SECRET_TOKEN;
  } catch (error) {
    warn('[AUTH] Error obteniendo token para GAS:', error);
    // Fallback a token secreto si hay error
    return 'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
  }
}
```

**⚠️ IMPORTANTE:** 
- Reemplaza `'GAS_SECRET_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'` con el **mismo token** que configuraste en el Paso 2
- Este token debe ser **exactamente igual** en ambos lugares (GAS y app.js)

---

## Resumen del Flujo

1. **Cliente (app.js)** envía petición a GAS con parámetro `token`
2. **GAS** recibe el token y lo compara con el secreto almacenado
3. Si coinciden → permite la petición
4. Si no coinciden → rechaza con error 401

---

## Notas Importantes

1. **Seguridad del Token:**
   - El token secreto está visible en `app.js` (no es seguridad militar, pero evita uso casual)
   - Para mayor seguridad, considera usar Firebase Auth tokens reales (más complejo)
   - El token debe tener al menos 32 caracteres
   - **NUNCA** compartas el token públicamente

2. **Testing:**
   - Prueba la función con y sin token para asegurar que rechaza peticiones no autenticadas
   - Prueba con token incorrecto para verificar que rechaza
   - Revisa los logs de ejecución en GAS para ver mensajes de validación

3. **Logs:**
   - Los logs en GAS mostrarán `[AUTH] ✅ Token válido` o `[AUTH] ❌ Token inválido`
   - Revisa los logs en **Ejecutar > Ver registros de ejecución**

4. **Actualización del Token:**
   - Si necesitas cambiar el token, ejecuta `setupSecretToken()` de nuevo con un nuevo token
   - Actualiza también el token en `app.js` para que coincidan

## Verificación

Después de implementar, prueba que:
- ✅ Peticiones sin token son rechazadas
- ✅ Peticiones con token válido son aceptadas
- ✅ La funcionalidad existente sigue funcionando

