/**
 * ============================================
 * FIREBASE CONFIGURATION - INSTRUCCIONES
 * ============================================
 * 
 * 1. Ve a Firebase Console: https://console.firebase.google.com/
 * 2. Crea un proyecto nuevo (o usa uno existente)
 * 3. Ve a "Project Settings" > "Your apps" > "Web app"
 * 4. Copia tu firebaseConfig
 * 5. REEMPLAZA los valores TODO_... de abajo con tus datos reales:
 *    - apiKey: "AIza..."
 *    - authDomain: "tu-proyecto.firebaseapp.com"
 *    - projectId: "tu-proyecto"
 *    - storageBucket: "tu-proyecto.appspot.com"
 *    - messagingSenderId: "123456789"
 *    - appId: "1:123456789:web:abc123"
 * 
 * 6. En Firebase Console:
 *    - Ve a "Firestore Database"
 *    - Click "Create database"
 *    - Selecciona modo "Test mode" (o configura reglas después)
 *    - Elige región más cercana
 * 
 * 7. REGLAS DE FIRESTORE (para desarrollo):
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /{document=**} {
 *          allow read, write: if true;
 *        }
 *      }
 *    }
 *    ⚠️ IMPORTANTE: Estas reglas son para desarrollo. 
 *    Para producción, implementa autenticación adecuada.
 * 
 * 8. ¡Listo! El tiempo real funcionará automáticamente
 * ============================================
 */

// ✅ Importar Firebase desde CDN (módulos ES)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// 🔧 CONFIGURACIÓN DE FIREBASE
// ✅ Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDHwP2svgvAumaNg44gie5HxgARtct-ztk",
  authDomain: "edusalud-platfor.firebaseapp.com",
  projectId: "edusalud-platfor",
  storageBucket: "edusalud-platfor.firebasestorage.app",
  messagingSenderId: "490035065280",
  appId: "1:490035065280:web:162fef40d04ad2b5795825",
  measurementId: "G-K8Z1739Q1V"
};

// ✅ Validar que la configuración no tenga placeholders
const hasPlaceholders = Object.values(firebaseConfig).some(val => 
  typeof val === 'string' && val.startsWith('TODO_')
);

if (hasPlaceholders) {
  console.warn('⚠️ [FIREBASE] Configuración con placeholders detectada.');
  console.warn('⚠️ [FIREBASE] Edita /src/firebase.js y reemplaza los valores TODO_... con tu config real.');
  console.warn('⚠️ [FIREBASE] Firebase NO se inicializará hasta que configures los valores correctos.');
}

let app = null;
let db = null;

try {
  if (!hasPlaceholders) {
    // ✅ Inicializar Firebase
    app = initializeApp(firebaseConfig);
    
    // ✅ Inicializar Firestore
    db = getFirestore(app);
    
    console.log('✅ [FIREBASE] Firebase inicializado correctamente');
    console.log('✅ [FIREBASE] Firestore listo para sincronización en tiempo real');
  } else {
    console.log('ℹ️ [FIREBASE] Modo sin Firebase - usando solo Google Sheets');
  }
} catch (error) {
  console.error('❌ [FIREBASE] Error al inicializar Firebase:', error);
  console.error('❌ [FIREBASE] Verifica tu configuración en /src/firebase.js');
}

// ✅ Exportar para uso en otros archivos
export { app, db };

