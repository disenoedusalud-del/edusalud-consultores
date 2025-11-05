/**
 * ============================================
 * FIREBASE CONFIGURATION - CARGA DINÁMICA
 * ============================================
 * Este archivo carga Firebase sin módulos ES6
 * Compatible con GitHub Pages y navegadores normales
 * ============================================
 */

(async function() {
  console.log('[FIREBASE] Iniciando carga dinámica de Firebase...');

  // 🔧 CONFIGURACIÓN DE FIREBASE
  const firebaseConfig = {
    apiKey: "AIzaSyDHwP2svgvAumaNg44gie5HxgARtct-ztk",
    authDomain: "edusalud-platfor.firebaseapp.com",
    projectId: "edusalud-platfor",
    storageBucket: "edusalud-platfor.firebasestorage.app",
    messagingSenderId: "490035065280",
    appId: "1:490035065280:web:162fef40d04ad2b5795825",
    measurementId: "G-K8Z1739Q1V"
  };

  try {
    // ✅ Cargar Firebase desde CDN (versión compatible)
    if (typeof firebase === 'undefined') {
      console.log('[FIREBASE] Cargando librerías desde CDN...');
      
      // Cargar Firebase App
      await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js');
      
      console.log('[FIREBASE] ✅ Librerías cargadas');
    }

    // ✅ Inicializar Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ [FIREBASE] Firebase inicializado correctamente');
    }

    // ✅ Obtener Firestore
    const db = firebase.firestore();
    window.firebaseDB = db; // Exponer globalmente
    
    console.log('✅ [FIREBASE] Firestore listo para sincronización en tiempo real');
    console.log('✅ [FIREBASE] Proyecto:', firebaseConfig.projectId);

  } catch (error) {
    console.error('❌ [FIREBASE] Error inicializando Firebase:', error);
    console.log('ℹ️ [FIREBASE] Continuando sin Firebase (usando Google Sheets)');
    window.firebaseDB = null;
  }

  // ✅ Función auxiliar para cargar scripts
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
})();

