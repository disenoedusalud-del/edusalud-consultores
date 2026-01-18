# 📋 CONFIGURACIÓN - Plataforma EduSalud

Este documento contiene toda la información de configuración necesaria para mantener y desplegar la plataforma.

---

## 🔥 Firebase Configuration

### Proyecto Firebase
- **Project ID:** `edusalud-platfor`
- **Auth Domain:** `edusalud-platfor.firebaseapp.com`
- **Database URL:** `https://edusalud-platfor-default-rtdb.firebaseio.com`
- **Storage Bucket:** `edusalud-platfor.firebasestorage.app`
- **Messaging Sender ID:** `490035065280`
- **App ID:** `1:490035065280:web:162fef40d04ad2b5795825`
- **Measurement ID:** `G-K8Z1739Q1V`

### Configuración
- **Tipo de Base de Datos:** Realtime Database (gratis, sin facturación)
- **Authentication:** Habilitado
- **Cloud Functions:** Disponible (opcional, actualmente no se usa)

### Archivo de Configuración
- **Ubicación:** `src/firebase.js`
- **Nota:** Las credenciales completas están en `src/firebase.js`. No exponer la `apiKey` públicamente en documentación.

---

## 📧 EmailJS Configuration

### Credenciales
- **Service ID:** `service_ectemf7`
- **Template ID:** `template_g9pmmxm`
- **Public Key:** Configurada en `index.html` (línea 28)
- **Plan:** Gratuito (200 emails/mes)

### Configuración
- **Servicio de Email:** Gmail/Outlook (configurado en EmailJS)
- **Template:** "Código de verificación - EduSalud"
- **Variables del Template:** `{{code}}` y `{{email}}`

### Archivo de Configuración
- **Ubicación:** `index.html` (líneas 24-29)

### Notas
- Si necesitas más de 200 emails/mes, considerar actualizar el plan en EmailJS
- El Public Key está visible en el código frontend (esto es normal para EmailJS)

---

## 📜 Google Apps Script - Generador de Certificados

### Configuración del Script

1. **Crear el Script:**
   - Ve a [Google Apps Script](https://script.google.com)
   - Crea un nuevo proyecto
   - Pega el código completo de `GOOGLE_APPS_SCRIPT_CERTIFICADOS.md`
   - Guarda el proyecto con un nombre (ej: "Generador de Certificados EduSalud")

2. **Configurar Permisos:**
   - Ejecuta una función de prueba (ej: `listMySlides`)
   - Autoriza el acceso a:
     - Google Drive
     - Google Slides
     - Google Sheets

3. **Desplegar como Web App:**
   - Ve a "Desplegar" → "Nueva implementación"
   - Tipo: "Aplicación web"
   - Descripción: "Generador de Certificados v1"
   - **Ejecutar como:** "Yo"
   - **Quién tiene acceso:** **"Cualquiera, incluso anónimos"** ⚠️ IMPORTANTE
   - Haz clic en "Desplegar"
   - Copia la URL del Web App (termina en `/exec`)

### URL del Web App
- **Formato:** `https://script.google.com/macros/s/[APP_ID]/exec`
- **Nota:** La URL debe terminar en `/exec` (no `/dev`)
- **Configuración en Plataforma:** Se configura en la sección "🎓 Generador de Certificados"

### Archivo de Referencia
- **Código Completo:** `GOOGLE_APPS_SCRIPT_CERTIFICADOS.md`

---

## 🚀 Instrucciones de Despliegue

### 1. GitHub Pages

#### Preparación
```bash
# Asegúrate de estar en la rama main
git checkout main

# Verifica que todos los cambios estén guardados
git status
```

#### Despliegue
```bash
# Agregar archivos modificados
git add .

# Commit con mensaje descriptivo
git commit -m "Optimización: minificación JS, PWA, tema persistente"

# Push a GitHub
git push origin main
```

#### Verificación
- Esperar 1-2 minutos para que GitHub Pages actualice
- Verificar que la versión minificada se esté cargando (revisar Network tab en DevTools)
- Verificar que el manifest.json sea accesible: `https://[tu-url]/manifest.json`

### 2. Verificar Minificación

#### Antes de Desplegar
```bash
# Generar versión minificada
npm run minify

# Verificar que se creó app.min.js
ls -la assets/js/app.min.js
```

#### En Producción
- Verificar en DevTools → Network que se carga `app.min.js` (no `app.js`)
- El tamaño debe ser significativamente menor que `app.js`

### 3. Verificar PWA

#### Checklist
- [ ] `manifest.json` existe en la raíz del proyecto
- [ ] `<link rel="manifest">` está en `index.html`
- [ ] Iconos están accesibles (`assets/logo-edusalud.png`)
- [ ] La plataforma es instalable (aparece opción "Instalar" en navegadores compatibles)

#### Probar PWA
1. Abre la plataforma en Chrome/Edge
2. Busca el icono de "Instalar" en la barra de direcciones
3. O ve a DevTools → Application → Manifest para verificar

### 4. Verificar Tema Persistente

#### Checklist
- [ ] Script inline está en `<head>` antes de los estilos
- [ ] El tema se aplica inmediatamente (sin flash)
- [ ] El tema se guarda en localStorage
- [ ] El tema persiste al recargar la página

#### Probar
1. Cambia el tema (claro/oscuro)
2. Recarga la página
3. El tema debe mantenerse sin flash

---

## 🔧 Troubleshooting

### Problema: La versión minificada no se carga

**Síntomas:**
- En DevTools → Network se ve `app.js` en lugar de `app.min.js`
- Los cambios no se reflejan

**Solución:**
1. Verificar que `npm run minify` se ejecutó correctamente
2. Verificar que `index.html` línea 1073 apunta a `app.min.js`
3. Limpiar caché del navegador (Ctrl+Shift+Delete)
4. Incrementar versión en `index.html` (ej: `v=110` → `v=111`)

### Problema: PWA no es instalable

**Síntomas:**
- No aparece opción de "Instalar"
- Errores en DevTools → Application → Manifest

**Solución:**
1. Verificar que `manifest.json` está en la raíz del proyecto
2. Verificar que `<link rel="manifest">` está en `index.html`
3. Verificar que los iconos existen y son accesibles
4. Verificar que la plataforma se sirve por HTTPS (requerido para PWA)

### Problema: Flash de tema al cargar

**Síntomas:**
- La página carga con tema claro y luego cambia a oscuro (o viceversa)

**Solución:**
1. Verificar que el script inline está en `<head>` antes de `<link rel="stylesheet">`
2. Verificar que el script lee correctamente de localStorage
3. Verificar que no hay errores en consola

### Problema: Firebase no conecta

**Síntomas:**
- Errores en consola sobre Firebase
- La sincronización no funciona

**Solución:**
1. Verificar credenciales en `src/firebase.js`
2. Verificar CSP en `index.html` permite `*.firebaseio.com`
3. Verificar permisos en Firebase Console
4. Verificar que el proyecto Firebase está activo

### Problema: EmailJS no envía emails

**Síntomas:**
- Los códigos de verificación no llegan
- Errores en consola sobre EmailJS

**Solución:**
1. Verificar Service ID y Template ID en `index.html`
2. Verificar Public Key en `index.html`
3. Verificar que el template en EmailJS tiene las variables correctas (`{{code}}`, `{{email}}`)
4. Verificar límite de emails (200/mes en plan gratuito)
5. Revisar logs en EmailJS Dashboard

### Problema: Google Apps Script no responde

**Síntomas:**
- Error "Failed to fetch" al generar certificados
- Error CORS

**Solución:**
1. Verificar que el Web App está configurado como "Cualquiera, incluso anónimos"
2. Verificar que la URL termina en `/exec` (no `/dev`)
3. Crear una nueva implementación del Web App
4. Verificar permisos del script (Drive, Slides, Sheets)
5. Revisar logs en Google Apps Script (Ver → Logs de ejecución)

---

## 📝 Notas Importantes

### Seguridad
- **NO** exponer claves secretas en documentación pública
- **NO** commitear archivos con credenciales sensibles
- El `apiKey` de Firebase está visible en el frontend (esto es normal y seguro)
- El Public Key de EmailJS está visible en el frontend (esto es normal)

### Versiones
- **app.js:** v109 (sin minificar)
- **app.min.js:** v110 (minificado)
- **certificates.js:** v16
- **electric-card.js:** v9
- **firebase.js:** v3
- **style.css:** v4

### Cloud Function (Opcional)
- **URL:** `https://sendverificationcode-nzqxumxiba-uc.a.run.app`
- **Estado:** Disponible como respaldo (no se usa actualmente)
- **Nota:** Se puede eliminar o mantener como respaldo. No afecta el funcionamiento actual.

### Costos Actuales
- **Firebase:** $0 USD (tier Spark - gratis)
- **EmailJS:** $0 USD (plan gratuito - 200 emails/mes)
- **Google Apps Script:** $0 USD (gratis)
- **GitHub Pages:** $0 USD (gratis)
- **Total:** $0 USD/mes

---

## 📞 Contacto y Soporte

- **Proyecto:** EduSalud Platform
- **Repositorio:** GitHub Pages
- **URL:** https://disenoedusalud-del.github.io/edusalud-consultores/
- **Desarrollado por:** Daniel Zavala

---

**Última actualización:** Diciembre 2025  
**Versión del Documento:** 1.0

