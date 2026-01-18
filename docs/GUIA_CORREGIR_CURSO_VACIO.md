# 🔧 Guía: Corregir Curso Vacío en Firebase

**Fecha:** 2025-12-05  
**Curso afectado:** `2291db02a1c676fcb2f5effd7bba8232c1d7eb75ab236f4880aa8ce0536359c0`

---

## 🎯 Opción 1: Usando Firebase Console (Más Fácil) ✅

### Paso 1: Abrir Firebase Console

1. Ve a: https://console.firebase.google.com/project/edusalud-platfor/database
2. Inicia sesión si es necesario
3. Selecciona **Realtime Database** (no Firestore)

### Paso 2: Navegar al Curso

1. En el panel izquierdo, expande la estructura de datos
2. Busca y haz clic en: `customCourses`
3. Busca el hash: `2291db02a1c676fcb2f5effd7bba8232c1d7eb75ab236f4880aa8ce0536359c0`
4. Haz clic en ese nodo

### Paso 3: Verificar el Problema

Deberías ver algo como:
```json
{}
```

O simplemente un objeto vacío sin propiedades.

### Paso 4A: Eliminar el Curso (Recomendado)

1. Haz clic en el ícono de **eliminar** (🗑️) junto al nodo
2. Confirma la eliminación
3. **Listo** ✅

**Próximo paso:** Crea el curso nuevamente desde la vista master de la aplicación.

---

### Paso 4B: Corregir Manualmente

Si prefieres corregir en lugar de eliminar:

1. Haz clic en el nodo del curso
2. Haz clic en **"Agregar campo"** o edita directamente
3. Agrega los siguientes campos:

```json
{
  "title": "Nombre del Curso",
  "type": "curso",
  "meta": "Descripción del curso",
  "files": [],
  "code": "TU_CODIGO_AQUI",
  "card": {},
  "createdAt": 1733175000000,
  "updatedAt": 1733175000000
}
```

**Campos mínimos requeridos:**
- `title`: **REQUERIDO** - Título del curso (string no vacío)
- `type`: Opcional - Tipo de curso (default: "curso")
- `code`: Opcional - Código de acceso

4. Haz clic en **"Guardar"** o presiona Enter

---

## 🎯 Opción 2: Usando Firebase CLI (Avanzado)

### Requisitos Previos

1. Tener Firebase CLI instalado: `firebase --version`
2. Estar autenticado: `firebase login`
3. Tener permisos de escritura en el proyecto

### Paso 1: Verificar Autenticación

```bash
firebase login
firebase projects:list
```

### Paso 2: Leer el Curso Actual

```bash
# Leer el curso vacío
curl "https://edusalud-platfor-default-rtdb.firebaseio.com/customCourses/2291db02a1c676fcb2f5effd7bba8232c1d7eb75ab236f4880aa8ce0536359c0.json"
```

### Paso 3: Eliminar el Curso

**⚠️ Nota:** Firebase CLI no tiene comando directo para eliminar desde Realtime Database.  
**Usa la Opción 1 (Firebase Console) o el script de Node.js con credenciales de servicio.**

---

## 🎯 Opción 3: Script con Credenciales de Servicio

Si tienes un archivo de credenciales de servicio de Firebase:

### Paso 1: Obtener Credenciales

1. Firebase Console → Configuración del proyecto → Cuentas de servicio
2. Generar nueva clave privada
3. Guardar el archivo JSON (ej: `service-account-key.json`)

### Paso 2: Instalar Dependencias

```bash
npm install firebase-admin
```

### Paso 3: Crear Script

Crear archivo `fix-course-with-credentials.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://edusalud-platfor-default-rtdb.firebaseio.com'
});

const db = admin.database();
const hex = '2291db02a1c676fcb2f5effd7bba8232c1d7eb75ab236f4880aa8ce0536359c0';

// Eliminar curso vacío
db.ref(`customCourses/${hex}`).remove()
  .then(() => {
    console.log('✅ Curso eliminado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

### Paso 4: Ejecutar

```bash
node fix-course-with-credentials.js
```

---

## ✅ Verificación Después de Corregir

### Opción A: Desde la Aplicación

1. Recargar la aplicación (F5)
2. Abrir DevTools Console
3. Ejecutar:

```javascript
const hex = '2291db02a1c676fcb2f5effd7bba8232c1d7eb75ab236f4880aa8ce0536359c0';
const merged = App.getMergedAccessHashMap();
const course = merged[hex];

console.log('=== VERIFICACIÓN ===');
console.log('Curso:', course);
console.log('Es válido:', !!(
    course &&
    typeof course === 'object' &&
    Object.keys(course).length > 0 &&
    course.title &&
    typeof course.title === 'string' &&
    course.title.trim().length > 0
));
```

**Resultado esperado:**
- Si eliminaste: `Curso: undefined` (correcto, ya no existe)
- Si corregiste: `Curso: {title: "...", type: "...", ...}` y `Es válido: true`

### Opción B: Probar Login

1. Si eliminaste el curso: Crea uno nuevo desde la vista master
2. Si corregiste el curso: Prueba login con el código del curso
3. Verifica que:
   - ✅ Se muestra el curso correctamente
   - ✅ No hay errores en consola
   - ✅ El título aparece

---

## 🎯 Recomendación

**Usa la Opción 1 (Firebase Console)** porque:
- ✅ No requiere configuración adicional
- ✅ Es visual e intuitiva
- ✅ Permite ver y editar datos fácilmente
- ✅ No necesita credenciales de servicio

---

## 📝 Notas Adicionales

- **Si eliminas el curso:** Deberás recrearlo desde la vista master de la aplicación
- **Si corriges el curso:** Asegúrate de que el `code` coincida con el código que los usuarios usarán
- **Estructura mínima:** Solo `title` es estrictamente requerido, pero es buena práctica incluir `type`, `code`, etc.

---

**Última actualización:** 2025-12-05

