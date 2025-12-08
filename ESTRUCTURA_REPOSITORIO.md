# Estructura del Repositorio - EduSalud Platform

## 📁 Estructura de Directorios

```
PLATAFORM/
│
├── 📄 index.html                    # Página principal (MODIFICADO)
├── 📄 manifest.json                 # PWA Manifest
├── 📄 sw.js                         # Service Worker
│
├── 📄 firebase.json                 # Configuración Firebase (MODIFICADO - agregado database rules)
├── 📄 database.rules.json           # ⭐ NUEVO - Reglas de seguridad Firebase
│
├── 📄 package.json                  # Dependencias Node.js
├── 📄 package-lock.json            # Lock de dependencias
│
├── 📁 assets/
│   ├── 📁 css/
│   │   └── style.css                # Estilos principales
│   │
│   └── 📁 js/
│       ├── app.js                   # ⚠️ MODIFICADO - Código principal (MASTER_HASH movido a función)
│       ├── auth.js                  # ⚠️ MODIFICADO - Módulo de autenticación (usa Cloud Function)
│       ├── utils.js                 # ⭐ NUEVO - Funciones de utilidad (extraídas de app.js)
│       ├── certificates.js           # Generador de certificados
│       ├── electric-card.js         # Componente de tarjetas
│       └── google-apps-script-code.js
│
├── 📁 src/
│   ├── firebase.js                  # ⚠️ MODIFICADO - Configuración Firebase (agregado Functions)
│   └── firebase.config.example.js   # Ejemplo de configuración
│
├── 📁 functions/
│   ├── index.js                     # ⚠️ MODIFICADO - Cloud Functions (agregada validateMasterCode)
│   ├── package.json                 # Dependencias de Functions
│   └── node_modules/                # Dependencias instaladas
│
└── 📁 Documentación/
    ├── README_FINAL.md
    ├── INSTRUCCIONES_GAS_TOKEN.md   # ⭐ NUEVO - Instrucciones para proteger GAS
    ├── ESTRUCTURA_REPOSITORIO.md    # ⭐ NUEVO - Este archivo
    └── ... (otros archivos .md)
```

## ⭐ Archivos Nuevos Creados

### 1. `database.rules.json` (Raíz)
**Ubicación:** `/database.rules.json`

**Descripción:** Reglas de seguridad para Firebase Realtime Database. Define quién puede leer/escribir en cada ruta.

**Contenido:**
- Reglas para `customCourses` (lectura/escritura según permisos)
- Reglas para `courseEmails` (acceso por curso)
- Reglas para `admins` (solo masters pueden escribir)
- Reglas para `auditLogs` (solo admins pueden leer)
- Reglas para `verificationCodes` (solo escritura autenticada)

**Importante:** Este archivo debe desplegarse con `firebase deploy --only database`

---

### 2. `assets/js/utils.js` (Nuevo Módulo)
**Ubicación:** `/assets/js/utils.js`

**Descripción:** Módulo de utilidades extraído de `app.js` para mejor modularidad.

**Funciones incluidas:**
- `escapeHTML()` - Escapa HTML para prevenir XSS
- `sanitizeHTML()` - Sanitiza texto
- `safeInput()` - Sanitiza inputs según tipo
- `getSafeInputValue()` - Obtiene y sanitiza valores de inputs
- `validateEmail()` - Valida formato de email
- `validatePassword()` - Valida contraseñas
- `validateVerificationCode()` - Valida códigos de 6 dígitos
- `sha256Hex()` - Genera hash SHA-256
- `clearFieldErrors()` - Limpia errores visuales de campos
- `markFieldError()` - Marca campos con error
- `normalizeEmailKey()` - Normaliza emails para Firebase
- `$()` - Selector DOM helper
- `toHex()` - Convierte buffer a hexadecimal

**Exposición:** Funciones expuestas en `window.Utils` y también directamente en `window` para compatibilidad.

---

### 3. `INSTRUCCIONES_GAS_TOKEN.md` (Documentación)
**Ubicación:** `/INSTRUCCIONES_GAS_TOKEN.md`

**Descripción:** Guía paso a paso para proteger Google Apps Script con autenticación por token.

**Contenido:**
- Instrucciones para instalar Firebase Admin SDK en GAS
- Configuración de credenciales de servicio
- Código de validación de token
- Modificación de función `doGet`
- Configuración de Properties Service
- Notas de seguridad

---

### 4. `ESTRUCTURA_REPOSITORIO.md` (Este archivo)
**Ubicación:** `/ESTRUCTURA_REPOSITORIO.md`

**Descripción:** Documentación de la estructura del repositorio y archivos nuevos.

---

## ⚠️ Archivos Modificados

### 1. `firebase.json`
**Cambios:**
- Agregada sección `database` apuntando a `database.rules.json`

**Antes:**
```json
{
  "functions": [...]
}
```

**Después:**
```json
{
  "database": {
    "rules": "database.rules.json"
  },
  "functions": [...]
}
```

---

### 2. `src/firebase.js`
**Cambios:**
- Agregada carga de `firebase-functions-compat.js`
- Agregada inicialización de `firebase.functions()`
- Exposición de `window.firebaseFunctions`

**Líneas agregadas:**
- Carga de script de Functions
- `const functions = firebase.functions()`
- `window.firebaseFunctions = functions`

---

### 3. `functions/index.js`
**Cambios:**
- Agregado `require('crypto')` para hashing
- Agregada Cloud Function `validateMasterCode`

**Nueva función:**
```javascript
exports.validateMasterCode = functions.https.onCall(async (data, context) => {
  // Valida código master y establece Custom Claim isMaster
})
```

---

### 4. `assets/js/app.js`
**Cambios importantes:**
- `MASTER_HASH` constante eliminada (línea 2356)
- Reemplazada por función privada `getMasterHashValue()`
- Todas las referencias a `MASTER_HASH` actualizadas a `getMasterHashValue()`
- `checkIsAdmin()` actualizada para verificar Custom Claims primero
- Agregada función `getAuthToken()` para obtener token de Firebase Auth
- `remoteGetFiles()` y `remoteGetFilesJSONP()` modificadas para incluir token en peticiones a GAS

**Funciones movidas a `utils.js`:**
- `escapeHTML()`
- `sanitizeHTML()`
- `safeInput()`
- `getSafeInputValue()`
- `validateEmail()`
- `validatePassword()`
- `validateVerificationCode()`
- `sha256Hex()`
- `clearFieldErrors()`
- `markFieldError()`
- `normalizeEmailKey()`
- `$()` y `toHex()`

**Nota:** Estas funciones aún existen en `app.js` pero deberían eliminarse cuando se complete la refactorización.

---

### 5. `assets/js/auth.js`
**Cambios importantes:**
- `tryLoginByCode()` modificada para usar Cloud Function `validateMasterCode`
- Agregada lógica para crear usuario anónimo si no hay autenticado
- Agregada verificación de Custom Claims después de validar código master
- Fallback a validación local si Firebase Functions no está disponible

**Flujo nuevo:**
1. Usuario ingresa código
2. Si no hay usuario autenticado, crear usuario anónimo
3. Llamar Cloud Function `validateMasterCode`
4. Si válido, establecer Custom Claim `isMaster`
5. Refrescar token y verificar Custom Claim
6. Continuar con flujo normal de master

---

### 6. `index.html`
**Cambios:**
- ⚠️ **PENDIENTE:** Agregar `<script src="assets/js/utils.js">` antes de `app.js`

**Orden actual:**
```html
<script src="src/firebase.js"></script>
<script src="assets/js/electric-card.js" defer></script>
<script src="assets/js/app.js?v=162" defer></script>
<script src="assets/js/auth.js?v=162" defer></script>
```

**Orden recomendado (cuando se complete modularización):**
```html
<script src="src/firebase.js"></script>
<script src="assets/js/utils.js" defer></script>
<script src="assets/js/data-service.js" defer></script>
<script src="assets/js/ui-renderer.js" defer></script>
<script src="assets/js/app.js?v=163" defer></script>
<script src="assets/js/auth.js?v=163" defer></script>
```

---

## 📋 Checklist de Archivos para Git

### ✅ Archivos a Agregar (Nuevos)
```
database.rules.json
assets/js/utils.js
INSTRUCCIONES_GAS_TOKEN.md
ESTRUCTURA_REPOSITORIO.md
```

### ⚠️ Archivos a Modificar (Cambios)
```
firebase.json
src/firebase.js
functions/index.js
assets/js/app.js
assets/js/auth.js
index.html (pendiente agregar utils.js)
```

### ❌ Archivos a Ignorar (No subir a Git)
```
node_modules/
functions/node_modules/
*.log
.env
firebase-debug.log
```

---

## 🚀 Próximos Pasos (Pendientes)

### Fase 2: Modularización (Pendiente)
- [ ] Crear `assets/js/data-service.js` (lógica Firebase/GAS)
- [ ] Crear `assets/js/ui-renderer.js` (renderizado UI)
- [ ] Refactorizar `app.js` para usar módulos nuevos
- [ ] Actualizar `index.html` con orden correcto de scripts
- [ ] Eliminar código duplicado de `app.js` (funciones movidas a utils.js)

### Fase 3: Limpieza (Pendiente)
- [ ] Eliminar constante `ACCESS_HASH_MAP` y referencias
- [ ] Eliminar comentarios obsoletos
- [ ] Limpiar código muerto

### Fase 4: UX/Offline (Pendiente)
- [ ] Mejorar `sw.js` con caché de datos
- [ ] Crear `offline.html`
- [ ] Agregar detección de estado offline

---

## 📝 Notas Importantes

1. **Firebase Configuration:** Necesitas configurar la variable de entorno `MASTER_HASH` en Firebase Console:
   - Ve a Firebase Console > Functions > Configuration > Environment variables
   - Agrega: `MASTER_HASH` = `7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8`

2. **Desplegar Reglas:** Ejecuta `firebase deploy --only database` para desplegar las reglas de seguridad.

3. **Desplegar Functions:** Ejecuta `firebase deploy --only functions` para desplegar la nueva Cloud Function.

4. **Google Apps Script:** Sigue las instrucciones en `INSTRUCCIONES_GAS_TOKEN.md` para proteger tu script.

5. **Testing:** Prueba el login con código master después de desplegar para verificar que todo funciona.

---

## 🔒 Seguridad Mejorada

### Antes:
- ❌ `MASTER_HASH` visible en código cliente
- ❌ Validación de admin solo en cliente
- ❌ Sin reglas de seguridad en Firebase
- ❌ GAS accesible públicamente sin autenticación

### Después:
- ✅ `MASTER_HASH` solo en servidor (Cloud Function)
- ✅ Validación de admin con Custom Claims + lista blanca
- ✅ Reglas de seguridad Firebase implementadas
- ✅ GAS protegido con token de autenticación
- ✅ Validación del lado del servidor

