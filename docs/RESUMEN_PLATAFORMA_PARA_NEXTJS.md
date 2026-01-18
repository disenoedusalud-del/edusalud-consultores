# 📋 RESUMEN DE LA PLATAFORMA - EduSalud Platform

**Propósito:** Documento de referencia para crear una versión mejorada con Next.js

---

## 🎯 ¿QUÉ ES LA PLATAFORMA?

**EduSalud Platform** es una plataforma educativa web para gestión de cursos, materiales educativos y generación automática de certificados. Está diseñada para instituciones educativas que necesitan:

1. **Gestionar cursos personalizados** con materiales (PDFs, enlaces, archivos)
2. **Autenticación dual**: Administradores (vista maestra) y estudiantes (vista usuario)
3. **Generación automática de certificados** desde plantillas de Google Slides
4. **Funcionalidad offline** para acceso sin conexión
5. **Sincronización en tiempo real** entre dispositivos

---

## 👥 TIPOS DE USUARIOS Y ROLES

### 1. **Super Administradores (Master)**
- Acceso con código secreto (`EDUMASTER123456987`)
- Validación server-side mediante Firebase Cloud Functions
- Custom Claim `isMaster` en Firebase Auth
- **Permisos:**
  - Ver todos los cursos (Vista Maestra)
  - Crear/editar/eliminar cursos personalizados
  - Gestionar administradores
  - Gestionar correos por curso
  - Acceso completo al generador de certificados

### 2. **Administradores/Consultores**
- Login con email/password
- Verificación de email con código de 6 dígitos (EmailJS)
- Custom Claims configurados por super admin
- **Permisos:**
  - Ver cursos asignados
  - Gestionar materiales de cursos
  - Generar certificados (si tienen permisos)

### 3. **Usuarios/Estudiantes**
- Login con email/password
- Registro con verificación de email (3 pasos)
- **Permisos:**
  - Ver "mis cursos" (cursos asignados)
  - Descargar materiales
  - Ver certificados generados

---

## 🏗️ ARQUITECTURA ACTUAL

### **Stack Tecnológico:**
- **Frontend:** HTML5, JavaScript vanilla (sin frameworks)
- **Backend:** Firebase (Realtime Database + Authentication + Cloud Functions)
- **Servicios Externos:**
  - Google Apps Script (generación de certificados)
  - EmailJS (envío de códigos de verificación)
  - Google Analytics 4 (tracking)
- **Hosting:** GitHub Pages
- **PWA:** Service Worker para funcionalidad offline

### **Estructura de Módulos:**
```
assets/js/
├── app.js              # Lógica principal (12,000+ líneas)
├── utils.js            # Funciones de utilidad
├── data-service.js     # Servicios de datos (Firebase/GAS)
├── ui-renderer.js      # Renderizado de UI
├── certificates.js      # Generador de certificados
├── electric-card.js    # Componente de tarjetas
└── modules/
    ├── auth.js         # Autenticación
    ├── core.js         # Funciones core
    └── ui.js           # Funciones UI
```

### **Base de Datos (Firebase Realtime Database):**
```
/courses/{hex}
  - title, meta, files[], card{}
  
/customCourses/{hex}
  - Datos de cursos personalizados
  
/courseEmails/{courseHex}/{emailKey}
  - Emails asociados a cursos
  
/admins/{emailKey}
  - Administradores con permisos
  
/auditLogs/{timestamp}
  - Registro de acciones
  
/verificationCodes/{email}
  - Códigos de verificación temporal
```

---

## ✨ FUNCIONALIDADES PRINCIPALES

### 1. **Gestión de Cursos**

#### **Cursos Personalizados:**
- Crear cursos con título, descripción, imagen, tag
- Agregar archivos mediante drag & drop
- Archivos pueden ser:
  - URLs externas
  - Enlaces a Google Drive
  - Archivos subidos (almacenados en Firebase Storage o Google Drive)
- Editar/eliminar cursos
- Validación para prevenir cursos vacíos

#### **Vistas:**
- **Vista Maestra:** Todos los cursos (solo para super admins)
- **Vista Individual:** Detalle de un curso con lista de archivos
- **Vista Usuario:** "Mis cursos" (cursos asignados al usuario)

#### **Búsqueda:**
- Búsqueda en tiempo real de cursos
- Búsqueda de archivos dentro de un curso
- Filtros y contadores de resultados

### 2. **Sistema de Autenticación**

#### **Login Master:**
- Código secreto validado en Cloud Function
- Hash SHA-256 almacenado en Google Secret Manager
- Establece Custom Claim `isMaster`
- Crea usuario anónimo si no hay sesión activa

#### **Login Usuario:**
- Email/password con Firebase Auth
- Verificación de email con código de 6 dígitos
- Registro en 3 pasos:
  1. Email y password
  2. Verificación de código
  3. Confirmación

#### **Seguridad:**
- Firebase Security Rules en Realtime Database
- Validación server-side de permisos
- Tokens JWT para Google Apps Script
- Rate limiting (implementado en módulos)

### 3. **Generador de Certificados**

#### **Flujo Completo:**
1. **Configuración:**
   - URL de Google Apps Script Web App
   - Seleccionar plantilla de Google Slides
   - Seleccionar/crear hoja de cálculo (Google Sheets)
   - Seleccionar/crear carpetas en Google Drive
   - Configurar título y fecha del webinar

2. **Modos de Certificado:**
   - **Modo Webinar:** 8 columnas (nombre, email, fecha, etc.)
   - **Modo With-Code:** 9 columnas (incluye código de validación)

3. **Generación:**
   - Crea hoja de cálculo con datos de participantes
   - Genera certificados PDF desde plantilla de Slides
   - Guarda PDFs en carpetas de Google Drive
   - Genera enlaces de correo y WhatsApp
   - Manejo de timeouts (5.5 minutos máximo)
   - Reintento automático para certificados pendientes

4. **Entregas:**
   - Enlaces de correo personalizados
   - Enlaces de WhatsApp con mensaje pre-configurado
   - PDFs protegidos con permisos de Google Drive

#### **Integración con Google Apps Script:**
- Endpoints protegidos con Firebase ID Tokens
- Funciones principales:
  - `listMySlides()` - Lista plantillas disponibles
  - `listMySheets()` - Lista hojas de cálculo
  - `listMyFolders()` - Lista carpetas de Drive
  - `createNewSheet()` - Crea nueva hoja
  - `createNewFolder()` - Crea nueva carpeta
  - `generarCertificadosYGuardarPDF()` - Genera certificados
  - `generarLinksDesdePDFProtegido()` - Genera enlaces

### 4. **Gestión de Administradores**

- Agregar/eliminar administradores por email
- Asignar permisos por curso
- Gestión de correos asociados a cursos
- Lista blanca de super administradores hardcodeados

### 5. **Funcionalidad Offline**

#### **Service Worker (v4):**
- Cache-first para imágenes
- Runtime cache para JS/CSS
- Cacheo de cursos visitados
- Fallback a página offline personalizada

#### **Página Offline (`offline.html`):**
- Diseño moderno y responsive
- Lista de cursos cacheados desde localStorage
- Indicador de estado de conexión
- Redirección automática al recuperar conexión
- Botón de reintento manual

#### **Detección Offline:**
- Indicador visual fijo en la parte superior
- Notificación de reconexión
- Verificación periódica del estado

### 6. **Experiencia de Usuario**

- **Tema:** Modo claro/oscuro con persistencia
- **Navegación:** Botones "Volver" en todas las vistas
- **Animaciones:** Carga con animación, transiciones suaves
- **Notificaciones:** Toast notifications para feedback
- **Responsive:** Diseño adaptable a móviles
- **PWA:** Instalable como aplicación móvil

---

## 🔧 CONFIGURACIÓN TÉCNICA

### **Firebase:**
- **Project ID:** `edusalud-platfor`
- **Auth Domain:** `edusalud-platfor.firebaseapp.com`
- **Database:** Realtime Database (tier Spark - gratis)
- **Storage:** Firebase Storage
- **Functions:** Cloud Functions v2 con Secret Manager
- **Security Rules:** Desplegadas en Realtime Database

### **EmailJS:**
- **Service ID:** `service_ectemf7`
- **Template ID:** `template_g9pmmxm`
- **Plan:** Gratuito (200 emails/mes)

### **Google Apps Script:**
- Desplegado como Web App
- Acceso: "Cualquiera, incluso anónimos" (con protección por token)
- Timeout máximo: 6 minutos por ejecución

---

## 📊 ANALYTICS Y TRACKING

### **Google Analytics 4:**
- Login intentos (éxitos/fallos)
- Login por tipo (Master/Usuario)
- Descargas de archivos
- Creación/eliminación de cursos
- Errores de autenticación

---

## ⚠️ PROBLEMAS Y LIMITACIONES ACTUALES

### **Arquitectura:**
- ❌ Código monolítico en `app.js` (12,000+ líneas)
- ❌ Sin TypeScript (dificulta mantenimiento)
- ❌ Sin framework moderno (Next.js, React, etc.)
- ❌ Manejo de estado global no estructurado
- ❌ Sin sistema de routing (SPA manual)

### **Rendimiento:**
- ⚠️ Carga inicial lenta (muchos scripts)
- ⚠️ Sin code splitting
- ⚠️ Sin optimización de imágenes
- ⚠️ Service Worker básico

### **UX/UI:**
- ⚠️ Sin sistema de componentes reutilizables
- ⚠️ CSS no modularizado
- ⚠️ Sin diseño system consistente
- ⚠️ Validación de formularios básica

### **Seguridad:**
- ✅ Validación server-side implementada
- ⚠️ Algunas validaciones aún en cliente
- ⚠️ Sin protección CSRF explícita

### **Testing:**
- ❌ Sin tests unitarios
- ❌ Sin tests de integración
- ❌ Sin tests E2E

---

## 🚀 MEJORAS SUGERIDAS PARA NEXT.JS

### **1. Arquitectura Moderna:**
- ✅ Next.js 14+ con App Router
- ✅ TypeScript para type safety
- ✅ Componentes React reutilizables
- ✅ Server Components para mejor rendimiento
- ✅ API Routes para lógica del servidor

### **2. Estado y Datos:**
- ✅ React Query / SWR para sincronización Firebase
- ✅ Zustand / Jotai para estado global ligero
- ✅ Server Actions para mutaciones
- ✅ Optimistic updates

### **3. Autenticación:**
- ✅ NextAuth.js / Auth.js para manejo de sesiones
- ✅ Middleware para protección de rutas
- ✅ Server-side validation mejorada
- ✅ Refresh tokens automático

### **4. UI/UX:**
- ✅ Tailwind CSS o shadcn/ui para diseño
- ✅ Componentes accesibles (ARIA)
- ✅ Loading states mejorados (Suspense)
- ✅ Error boundaries
- ✅ Formularios con React Hook Form + Zod

### **5. Rendimiento:**
- ✅ Code splitting automático
- ✅ Image optimization de Next.js
- ✅ Static generation donde sea posible
- ✅ ISR (Incremental Static Regeneration)
- ✅ Edge Functions para lógica ligera

### **6. Testing:**
- ✅ Jest + React Testing Library
- ✅ Playwright para E2E
- ✅ Tests de integración con Firebase emulators

### **7. DevOps:**
- ✅ CI/CD con GitHub Actions
- ✅ Vercel / Netlify para deployment
- ✅ Environment variables gestionadas
- ✅ Monitoreo con Sentry

### **8. Funcionalidades Nuevas:**
- ✅ Dashboard de analytics integrado
- ✅ Notificaciones push (PWA mejorado)
- ✅ Exportación de datos (CSV, Excel)
- ✅ Sistema de comentarios/feedback
- ✅ Búsqueda avanzada con filtros
- ✅ Historial de cambios visual
- ✅ Versiones de cursos (rollback)

---

## 📝 ESTRUCTURA SUGERIDA PARA NEXT.JS

```
nextjs-edusalud/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── verify/
│   ├── (master)/
│   │   ├── dashboard/
│   │   ├── courses/
│   │   ├── certificates/
│   │   └── admin/
│   ├── (user)/
│   │   ├── my-courses/
│   │   └── certificates/
│   ├── api/
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── certificates/
│   │   └── admin/
│   └── layout.tsx
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── course/
│   ├── certificate/
│   └── admin/
├── lib/
│   ├── firebase/
│   ├── auth/
│   ├── certificates/
│   └── utils/
├── hooks/
│   ├── useAuth.ts
│   ├── useCourses.ts
│   └── useCertificates.ts
├── types/
│   └── index.ts
└── public/
```

---

## 🔑 PUNTOS CLAVE PARA MIGRACIÓN

1. **Mantener compatibilidad con Firebase Realtime Database**
2. **Preservar funcionalidad de Google Apps Script**
3. **Migrar Service Worker a Next.js PWA**
4. **Mantener estructura de datos actual**
5. **Preservar Custom Claims y permisos**
6. **Migrar EmailJS o considerar alternativa**
7. **Mantener analytics (GA4)**

---

## 📚 ARCHIVOS DE REFERENCIA IMPORTANTES

- `README_FINAL.md` - Documentación principal
- `REPORTE_COMPLETO_PROYECTO.md` - Reporte técnico detallado
- `ESTRUCTURA_REPOSITORIO.md` - Estructura de archivos
- `assets/js/app.js` - Lógica principal (referencia)
- `assets/js/certificates.js` - Generador de certificados
- `functions/index.js` - Cloud Functions
- `database.rules.json` - Reglas de seguridad

---

**Última actualización:** Diciembre 2024  
**Versión actual:** 2.0  
**Estado:** Funcional en producción


