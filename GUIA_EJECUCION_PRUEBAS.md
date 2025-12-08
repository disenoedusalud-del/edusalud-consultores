# 🧪 Guía de Ejecución de Pruebas - Autenticación y Custom Claims

**Fecha:** 2025-12-05  
**Objetivo:** Ejecutar pruebas sistemáticas de autenticación  
**Estado:** 🚀 En progreso

---

## 📋 Checklist de Pruebas

### ✅ Preparación Inicial
- [ ] Abrir aplicación en navegador
- [ ] Abrir DevTools (F12)
- [ ] Verificar que Firebase está cargado
- [ ] Verificar consola sin errores críticos

---

## 🔐 FASE 1: Login con Código Master

### Test 1.1: Código Master Válido ✅
**Objetivo:** Verificar que el código master otorga acceso completo

**Pasos:**
1. [ ] Abrir aplicación (debe mostrar pantalla de login)
2. [ ] Abrir DevTools → Console
3. [ ] Ingresar código master en el campo de código
4. [ ] Click en "Acceder" o presionar Enter
5. [ ] Observar logs en consola

**Resultados Esperados:**
```
[LOGIN] ===== INICIO VALIDACIÓN =====
[LOGIN] Código ingresado (longitud): 18
[LOGIN] Hash calculado localmente: 7d61f670...
[LOGIN] Validando código master con Cloud Function...
[LOGIN] Llamando a: https://validatemastercodehttp-nzqxumxiba-uc.a.run.app
[LOGIN] Respuesta recibida - Status: 200 OK
[LOGIN] ✅ Código master válido!
[AUTH] ✅ Usuario es administrador, otorgando acceso master
```

**Verificaciones:**
- [ ] Se muestra vista master con todos los cursos
- [ ] URL contiene `?code=...`
- [ ] No hay errores en consola
- [ ] Se pueden ver todos los cursos disponibles
- [ ] Botones de administración visibles

**Comando de verificación en consola:**
```javascript
// Ejecutar en DevTools Console
console.log('isMasterAuthenticated:', window.App?.getIsMasterAuthenticated());
console.log('currentKeyHex:', window.App?.getCurrentKeyHex());
```

---

### Test 1.2: Código Master Inválido ❌
**Objetivo:** Verificar que códigos incorrectos son rechazados

**Pasos:**
1. [ ] Recargar página (F5) para limpiar sesión
2. [ ] Ingresar código incorrecto: `CODIGO_INVALIDO_123`
3. [ ] Click en "Acceder"
4. [ ] Observar mensaje de error

**Resultados Esperados:**
```
[LOGIN] ❌ Código master rechazado
```

**Verificaciones:**
- [ ] Mensaje de error: "Código inválido. Verifique y vuelva a intentar."
- [ ] NO se otorga acceso
- [ ] Permanece en pantalla de login
- [ ] Se registra intento fallido

---

### Test 1.3: Código de Curso Normal ✅
**Objetivo:** Verificar que códigos de curso muestran solo ese curso

**Pasos:**
1. [ ] Recargar página (F5)
2. [ ] Obtener código de un curso específico (desde vista master)
3. [ ] Logout si está autenticado
4. [ ] Ingresar código del curso
5. [ ] Click en "Acceder"

**Resultados Esperados:**
- [ ] Se muestra SOLO ese curso
- [ ] NO se muestra vista master
- [ ] NO se pueden ver otros cursos
- [ ] `isMasterAuthenticated = false`

---

## 👤 FASE 2: Login con Email/Password (Admin)

### Test 2.1: Super Admin Hardcodeado ✅
**Objetivo:** Verificar que super admins tienen acceso completo

**Pasos:**
1. [ ] Recargar página y hacer logout si es necesario
2. [ ] Click en pestaña "Cuenta"
3. [ ] Ingresar email: `diseno.edusalud@gmail.com`
4. [ ] Ingresar contraseña correcta
5. [ ] Click en "Iniciar Sesión"
6. [ ] Observar logs en consola

**Resultados Esperados:**
```
[AUTH] ✅ Login exitoso: diseno.edusalud@gmail.com
[AUTH] 🔍 Verificando si diseno.edusalud@gmail.com es administrador...
[AUTH] ✅ Detectado como super admin directamente
[AUTH] ✅ Usuario es administrador, otorgando acceso master
```

**Verificaciones:**
- [ ] Se muestra vista master completa
- [ ] Puede ver todos los cursos
- [ ] Puede acceder a configuraciones
- [ ] `checkIsAdmin()` retorna `true`

**Comando de verificación:**
```javascript
// En DevTools Console
const isAdmin = await window.App.checkIsAdmin('diseno.edusalud@gmail.com');
console.log('Es admin:', isAdmin); // Debe ser true
```

---

### Test 2.2: Verificar Custom Claim `isMaster` 🔍
**Objetivo:** Verificar que el custom claim está presente en el token

**Pasos:**
1. [ ] Con sesión activa de super admin
2. [ ] Abrir DevTools Console
3. [ ] Ejecutar script de verificación

**Script de verificación:**
```javascript
// Copiar y pegar en DevTools Console
(async () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log('❌ No hay usuario autenticado');
    return;
  }
  
  console.log('👤 Usuario actual:', user.email);
  
  // Obtener token con claims
  const tokenResult = await user.getIdTokenResult();
  
  console.log('🔑 Custom Claims:', tokenResult.claims);
  console.log('🔑 isMaster:', tokenResult.claims.isMaster);
  
  if (tokenResult.claims.isMaster === true) {
    console.log('✅ Custom claim isMaster está presente y es TRUE');
  } else {
    console.log('❌ Custom claim isMaster NO está presente o es FALSE');
  }
  
  // Verificar expiración del token
  const expirationTime = new Date(tokenResult.expirationTime);
  console.log('⏰ Token expira:', expirationTime.toLocaleString());
  
  // Verificar tiempo de autenticación
  const authTime = new Date(tokenResult.authTime);
  console.log('🕐 Autenticado desde:', authTime.toLocaleString());
})();
```

**Resultados Esperados:**
```
👤 Usuario actual: diseno.edusalud@gmail.com
🔑 Custom Claims: { isMaster: true }
🔑 isMaster: true
✅ Custom claim isMaster está presente y es TRUE
⏰ Token expira: [fecha futura]
🕐 Autenticado desde: [fecha actual]
```

---

### Test 2.3: Usuario Normal (No Admin) 👥
**Objetivo:** Verificar que usuarios normales solo ven sus cursos

**Pasos:**
1. [ ] Logout de sesión actual
2. [ ] Crear usuario de prueba (si no existe):
   - Email: `usuario.prueba@test.com`
   - Asignar acceso a 1-2 cursos específicos
3. [ ] Login con ese usuario
4. [ ] Verificar acceso limitado

**Resultados Esperados:**
```
[AUTH] ✅ Login exitoso: usuario.prueba@test.com
[AUTH] 🔍 Verificando si usuario.prueba@test.com es administrador...
[AUTH] 🔍 Resultado de checkIsAdmin: false
[AUTH] Cursos permitidos para usuario.prueba@test.com: 2
```

**Verificaciones:**
- [ ] Solo ve cursos asignados
- [ ] NO ve vista master
- [ ] NO puede acceder a configuraciones
- [ ] NO tiene botones de administración

**Comando de verificación:**
```javascript
// En DevTools Console
console.log('Cursos permitidos:', window.allowedCoursesForUser);
console.log('Es master:', window.App?.getIsMasterAuthenticated());
// allowedCoursesForUser debe tener array con cursos
// isMasterAuthenticated debe ser false
```

---

## 🛡️ FASE 3: Reglas de Base de Datos

### Test 3.1: Lectura con `isMaster` ✅
**Objetivo:** Verificar que usuario con `isMaster` puede leer datos protegidos

**Pasos:**
1. [ ] Login como admin (con `isMaster = true`)
2. [ ] Abrir DevTools Console
3. [ ] Ejecutar script de prueba de lectura

**Script de prueba:**
```javascript
// Copiar y pegar en DevTools Console
(async () => {
  const db = firebase.database();
  
  console.log('🧪 Iniciando pruebas de lectura con isMaster...');
  
  // Test 1: Leer customCourses
  try {
    const customCoursesRef = db.ref('customCourses');
    const snapshot = await customCoursesRef.once('value');
    console.log('✅ customCourses - Lectura exitosa');
    console.log('   Cursos encontrados:', snapshot.numChildren());
  } catch (error) {
    console.log('❌ customCourses - Error:', error.code);
  }
  
  // Test 2: Leer admins
  try {
    const adminsRef = db.ref('admins');
    const snapshot = await adminsRef.once('value');
    console.log('✅ admins - Lectura exitosa');
    console.log('   Admins encontrados:', snapshot.numChildren());
  } catch (error) {
    console.log('❌ admins - Error:', error.code);
  }
  
  // Test 3: Leer auditLogs
  try {
    const auditRef = db.ref('auditLogs');
    const snapshot = await auditRef.limitToLast(5).once('value');
    console.log('✅ auditLogs - Lectura exitosa');
    console.log('   Logs encontrados:', snapshot.numChildren());
  } catch (error) {
    console.log('❌ auditLogs - Error:', error.code);
  }
  
  // Test 4: Leer courseEmails
  try {
    const courseEmailsRef = db.ref('courseEmails');
    const snapshot = await courseEmailsRef.once('value');
    console.log('✅ courseEmails - Lectura exitosa');
    console.log('   Cursos con emails:', snapshot.numChildren());
  } catch (error) {
    console.log('❌ courseEmails - Error:', error.code);
  }
  
  console.log('🧪 Pruebas de lectura completadas');
})();
```

**Resultados Esperados:**
```
🧪 Iniciando pruebas de lectura con isMaster...
✅ customCourses - Lectura exitosa
   Cursos encontrados: [número]
✅ admins - Lectura exitosa
   Admins encontrados: [número]
✅ auditLogs - Lectura exitosa
   Logs encontrados: [número]
✅ courseEmails - Lectura exitosa
   Cursos con emails: [número]
🧪 Pruebas de lectura completadas
```

---

### Test 3.2: Escritura con `isMaster` ✅
**Objetivo:** Verificar que usuario con `isMaster` puede escribir en rutas protegidas

**Pasos:**
1. [ ] Con sesión admin activa
2. [ ] Ejecutar script de prueba de escritura

**Script de prueba:**
```javascript
// Copiar y pegar en DevTools Console
(async () => {
  const db = firebase.database();
  const testId = 'test_' + Date.now();
  
  console.log('🧪 Iniciando pruebas de escritura con isMaster...');
  
  // Test 1: Escribir en admins (solo isMaster puede)
  try {
    const adminRef = db.ref(`admins/${testId}`);
    await adminRef.set({
      email: 'test@example.com',
      role: 'test',
      addedAt: new Date().toISOString(),
      active: false,
      isTest: true
    });
    console.log('✅ admins - Escritura exitosa');
    
    // Limpiar
    await adminRef.remove();
    console.log('   Dato de prueba eliminado');
  } catch (error) {
    console.log('❌ admins - Error:', error.code, error.message);
  }
  
  // Test 2: Escribir en customCourses
  try {
    const courseRef = db.ref(`customCourses/${testId}`);
    await courseRef.set({
      title: 'Curso de Prueba',
      createdAt: Date.now(),
      isTest: true
    });
    console.log('✅ customCourses - Escritura exitosa');
    
    // Limpiar
    await courseRef.remove();
    console.log('   Dato de prueba eliminado');
  } catch (error) {
    console.log('❌ customCourses - Error:', error.code, error.message);
  }
  
  console.log('🧪 Pruebas de escritura completadas');
})();
```

**Resultados Esperados:**
```
🧪 Iniciando pruebas de escritura con isMaster...
✅ admins - Escritura exitosa
   Dato de prueba eliminado
✅ customCourses - Escritura exitosa
   Dato de prueba eliminado
🧪 Pruebas de escritura completadas
```

---

### Test 3.3: Usuario sin `isMaster` ❌
**Objetivo:** Verificar que usuarios normales NO pueden acceder a rutas protegidas

**Pasos:**
1. [ ] Logout de admin
2. [ ] Login como usuario normal (sin `isMaster`)
3. [ ] Ejecutar script de prueba

**Script de prueba:**
```javascript
// Copiar y pegar en DevTools Console
(async () => {
  const db = firebase.database();
  
  console.log('🧪 Iniciando pruebas SIN isMaster (debe fallar)...');
  
  // Verificar que NO tiene isMaster
  const user = firebase.auth().currentUser;
  const token = await user.getIdTokenResult();
  console.log('🔑 isMaster:', token.claims.isMaster || false);
  
  // Test 1: Intentar leer admins (debe fallar)
  try {
    const adminsRef = db.ref('admins');
    const snapshot = await adminsRef.once('value');
    console.log('❌ PROBLEMA: admins - Lectura exitosa (NO debería permitirse)');
  } catch (error) {
    console.log('✅ admins - Acceso denegado correctamente:', error.code);
  }
  
  // Test 2: Intentar escribir en admins (debe fallar)
  try {
    const testRef = db.ref('admins/test_unauthorized');
    await testRef.set({ test: true });
    console.log('❌ PROBLEMA: admins - Escritura exitosa (NO debería permitirse)');
  } catch (error) {
    console.log('✅ admins - Escritura denegada correctamente:', error.code);
  }
  
  console.log('🧪 Pruebas completadas');
})();
```

**Resultados Esperados:**
```
🧪 Iniciando pruebas SIN isMaster (debe fallar)...
🔑 isMaster: false
✅ admins - Acceso denegado correctamente: PERMISSION_DENIED
✅ admins - Escritura denegada correctamente: PERMISSION_DENIED
🧪 Pruebas completadas
```

---

## 🔄 FASE 4: Persistencia de Sesión

### Test 4.1: Recarga de Página (Master) ✅
**Objetivo:** Verificar que la sesión master persiste al recargar

**Pasos:**
1. [ ] Login como master (código o email admin)
2. [ ] Verificar que estás en vista master
3. [ ] Presionar F5 para recargar página
4. [ ] Observar consola

**Resultados Esperados:**
```
[AUTH] 🔔 onAuthStateChanged disparado, usuario: diseno.edusalud@gmail.com
[AUTH] ✅ Usuario autenticado: diseno.edusalud@gmail.com
[AUTH] ✅ Mostrando vista de usuario desde listener
```

**Verificaciones:**
- [ ] Se mantiene vista master
- [ ] NO se muestra pantalla de login
- [ ] Todos los cursos siguen visibles
- [ ] `isMasterAuthenticated` sigue siendo `true`

---

### Test 4.2: Logout y Verificación ✅
**Objetivo:** Verificar que el logout limpia correctamente el estado

**Pasos:**
1. [ ] Con sesión activa
2. [ ] Click en botón de logout
3. [ ] Observar consola
4. [ ] Verificar estado

**Resultados Esperados:**
```
[AUTH] ✅ Logout exitoso
[AUTH] Usuario no autenticado
```

**Verificaciones:**
- [ ] Se muestra pantalla de login
- [ ] `currentUserEmail = null`
- [ ] `isMasterAuthenticated = false`
- [ ] URL sin parámetro `?code=`

**Comando de verificación:**
```javascript
// En DevTools Console después de logout
console.log('Usuario:', firebase.auth().currentUser); // Debe ser null
console.log('currentUserEmail:', window.currentUserEmail); // Debe ser null
console.log('isMaster:', window.App?.getIsMasterAuthenticated()); // Debe ser false
```

---

## 🎯 FASE 5: Edge Cases

### Test 5.1: Forzar Refresh de Token ✅
**Objetivo:** Verificar que se puede forzar actualización de custom claims

**Pasos:**
1. [ ] Login como admin
2. [ ] Ejecutar script de refresh

**Script:**
```javascript
// Copiar y pegar en DevTools Console
(async () => {
  const user = firebase.auth().currentUser;
  
  console.log('🔄 Token actual:');
  const oldToken = await user.getIdTokenResult();
  console.log('   isMaster:', oldToken.claims.isMaster);
  console.log('   Expira:', new Date(oldToken.expirationTime).toLocaleString());
  
  console.log('🔄 Forzando refresh del token...');
  const newToken = await user.getIdTokenResult(true); // true = force refresh
  
  console.log('✅ Token actualizado:');
  console.log('   isMaster:', newToken.claims.isMaster);
  console.log('   Expira:', new Date(newToken.expirationTime).toLocaleString());
  
  console.log('🔄 Refresh completado');
})();
```

---

### Test 5.2: Multiple Tabs 🔄
**Objetivo:** Verificar sincronización entre pestañas

**Pasos:**
1. [ ] Abrir aplicación en Tab 1
2. [ ] Abrir aplicación en Tab 2 (nueva pestaña)
3. [ ] Login en Tab 1
4. [ ] Observar Tab 2 (debe detectar login automáticamente)
5. [ ] Logout en Tab 1
6. [ ] Observar Tab 2 (debe detectar logout)

**Verificaciones:**
- [ ] Tab 2 detecta login de Tab 1
- [ ] Tab 2 detecta logout de Tab 1
- [ ] Ambas tabs se sincronizan correctamente

---

## 📊 Resumen de Resultados

### Resultados Generales:
- **Total de pruebas:** 17
- **Exitosas:** ___
- **Fallidas:** ___
- **Pendientes:** ___

### Problemas Encontrados:
1. _____________________
2. _____________________
3. _____________________

### Notas Adicionales:
_____________________
_____________________
_____________________

---

**Última actualización:** 2025-12-05  
**Ejecutado por:** _____________________
