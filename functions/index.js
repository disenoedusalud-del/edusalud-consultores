const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { Resend } = require('resend');
const crypto = require('crypto');

admin.initializeApp();

// ✅ Inicializar Resend con tu API Key desde variables de entorno
// Para producción: configurar RESEND_API_KEY en Firebase Console (Functions > Configuration > Environment variables)
// Para desarrollo local: crear archivo .env con RESEND_API_KEY=tu_api_key
const resendApiKey = process.env.RESEND_API_KEY || 're_eATCWBLR_5MBUmnvRAo2y2hYkwTt1Qdis';
const resend = new Resend(resendApiKey);

// ✅ Cloud Function para enviar código de verificación
exports.sendVerificationCode = functions.https.onRequest(async (req, res) => {
  // ✅ Logging para diagnóstico
  console.log('=== REQUEST RECIBIDA ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers));
  console.log('Body:', JSON.stringify(req.body));

  // ✅ Habilitar CORS para permitir llamadas desde el frontend
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - enviando CORS headers');
    res.status(204).send('');
    return;
  }

  // ✅ Solo permitir método POST
  if (req.method !== 'POST') {
    console.log('Método no permitido:', req.method);
    res.status(405).json({ error: 'Método no permitido. Use POST.' });
    return;
  }

  const { email, code } = req.body;
  console.log('Procesando solicitud de verificación...');

  // Validar parámetros
  if (!email || !code) {
    console.log('Error: Email o código faltante');
    res.status(400).json({ error: 'Email y código son requeridos' });
    return;
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('Error: Email inválido:', email);
    res.status(400).json({ error: 'Email inválido' });
    return;
  }

  try {
    const masterHash = process.env.MASTER_HASH;

    if (!masterHash) {
      console.error('[MASTER] ❌ MASTER_HASH no está disponible en las variables de entorno');
      res.status(500).json({
        success: false,
        error: 'Configuración del servidor incompleta (MASTER_HASH no definido)',
      });
      return;
    }

    // 👉 LOG del código recibido
    // 👉 LOG del código recibido (REMOVED FOR SECURITY)

    const codeHash = crypto
      .createHash('sha256')
      .update(code.trim())
      .digest('hex');

    // 👉 LOGS DETALLADOS
    // 👉 LOGS DETALLADOS (SENSITIVE DATA REMOVED)
    console.log('[MASTER] ¿Coinciden?:', codeHash === masterHash);
    console.log('[MASTER] Longitud hash recibido:', codeHash.length);
    console.log('[MASTER] Longitud hash esperado:', masterHash.length);

    if (codeHash !== masterHash) {
      console.log('[MASTER] ❌ Código master inválido');
      res.status(403).json({
        success: false,
        error: 'Código master inválido'
      });
      return;
    }

    console.log('[MASTER] ✅ Código master válido');

    res.status(200).json({
      success: true,
      message: 'Código master válido. Acceso de administrador otorgado.',
    });
  } catch (error) {
    console.error('[MASTER] ❌ Error validando código master:', error);
    res.status(500).json({
      success: false,
      error: 'Error al validar el código master: ' + error.message,
    });
  }
});

// ✅ Cloud Function para validar código master (HTTP)
exports.validateMasterCodeHTTP = functions.https.onRequest(async (req, res) => {
  // CORS básico
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res
      .status(405)
      .json({ success: false, error: "Método no permitido. Use POST." });
    return;
  }

  // 🔹 Leer código y email del body o query
  let code, email;
  if (req.body && typeof req.body === "object") {
    code = req.body.code;
    email = req.body.email;
  } else if (req.query && req.query.code) {
    code = req.query.code;
    email = req.query.email;
  }

  if (!code) {
    res.status(400).json({
      success: false,
      error: "El código master es requerido",
    });
    return;
  }

  // Normalizar
  const codeStr = String(code).trim();

  // ✅ Validación por HASH usando MASTER_HASH
  try {
    // ✅ Obtener hash maestro (soporte para process.env y functions.config)
    let masterHash = process.env.MASTER_HASH;
    if (!masterHash) {
      try {
        if (functions.config().env && functions.config().env.master_hash) {
          masterHash = functions.config().env.master_hash;
        }
      } catch (e) {
        console.warn("[MASTER] No se pudo leer functions.config()", e);
      }
    }

    // ✅ Asegurar que no haya espacios en blanco
    if (masterHash) {
      masterHash = masterHash.trim();
    }

    if (!masterHash) {
      console.error("[MASTER] ❌ MASTER_HASH no configurado en variables de entorno");
      res.status(500).json({ success: false, error: "Error de configuración del servidor (MASTER_HASH missing)" });
      return;
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(codeStr)
      .digest("hex");

    // Log seguro sin revelar información sensible
    console.log("[MASTER] Verificando código maestro...");



    if (codeHash !== masterHash) {
      console.log("[MASTER] ❌ Intento de acceso con código inválido");
      res.status(403).json({
        success: false,
        error: "Código master inválido",
      });
      return;
    }


    console.log("[MASTER] ✅ Código master válido (hash)");

    // ✅ Asignar Custom Claim si se proporcionó email
    if (email) {
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { isMaster: true });
        console.log(`[MASTER] ✅ Custom claim 'isMaster' asignado a: ${email}`);
      } catch (claimError) {
        console.warn(`[MASTER] ⚠️ No se pudo asignar custom claim a ${email}:`, claimError.message);
        // No fallamos la request principal, pero avisamos
      }
    }

    res.status(200).json({
      success: true,
      message: "Código master válido. Acceso de administrador otorgado.",
    });
  } catch (error) {
    console.error("[MASTER] ❌ Error validando código master:", error);
    res.status(500).json({
      success: false,
      error: "Error al validar el código master: " + error.message,
    });
  }
});
