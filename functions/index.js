const functions = require('firebase-functions');
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
  console.log('Email recibido:', email);
  console.log('Código recibido:', code);
  
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
    console.log('Intentando enviar email a:', email);
    console.log('API Key configurada:', resendApiKey ? 'Sí (longitud: ' + resendApiKey.length + ')' : 'No');
    
    // Enviar email con Resend
    const result = await resend.emails.send({
      from: 'EduSalud <onboarding@resend.dev>', // Cambia esto después de verificar tu dominio
      to: email,
      subject: 'Código de verificación - EduSalud',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5aa9ff;">Código de verificación</h2>
          <p>Hola,</p>
          <p>Tu código de verificación para crear tu cuenta en EduSalud es:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
            ${code}
          </div>
          <p>Este código expira en <strong>10 minutos</strong>.</p>
          <p>Si no solicitaste este código, ignora este mensaje.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">EduSalud - Portal de Recursos para Consultores</p>
        </div>
      `
    });
    
    console.log('✅ Email enviado exitosamente:', JSON.stringify(result, null, 2));
    res.status(200).json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ error: 'Error enviando email: ' + error.message });
  }
});

// ✅ Cloud Function para validar código master y establecer Custom Claims
exports.validateMasterCode = functions.https.onCall(async (data, context) => {
  // Permitir autenticación anónima o autenticada
  // Si no hay usuario, se creará uno anónimo en el cliente antes de llamar
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'El usuario debe estar autenticado para validar el código master'
    );
  }

  const { code } = data;

  // Validar que se proporcionó el código
  if (!code || typeof code !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'El código master es requerido'
    );
  }

  try {
    // Obtener MASTER_HASH de variables de entorno
    const masterHash = process.env.MASTER_HASH;
    
    if (!masterHash) {
      console.error('[MASTER] ❌ MASTER_HASH no configurado en variables de entorno');
      throw new functions.https.HttpsError(
        'internal',
        'Error de configuración del servidor'
      );
    }

    // Calcular hash SHA-256 del código recibido
    const codeHash = crypto
      .createHash('sha256')
      .update(code.trim())
      .digest('hex');

    console.log('[MASTER] Validando código master...');
    console.log('[MASTER] Hash recibido:', codeHash.substring(0, 8) + '...');
    console.log('[MASTER] Hash esperado:', masterHash.substring(0, 8) + '...');

    // Comparar hash
    if (codeHash !== masterHash) {
      console.log('[MASTER] ❌ Código master inválido');
      throw new functions.https.HttpsError(
        'permission-denied',
        'Código master inválido'
      );
    }

    // Código válido: establecer Custom Claim isMaster
    const uid = context.auth.uid;
    const user = await admin.auth().getUser(uid);
    
    // Obtener claims existentes
    const customClaims = user.customClaims || {};
    
    // Agregar claim isMaster
    customClaims.isMaster = true;
    
    // Establecer claims actualizados
    await admin.auth().setCustomUserClaims(uid, customClaims);
    
    console.log('[MASTER] ✅ Código master válido. Custom Claim isMaster establecido para:', user.email);

    // Retornar éxito
    return {
      success: true,
      message: 'Código master válido. Acceso de administrador otorgado.'
    };
  } catch (error) {
    // Si ya es un HttpsError, re-lanzarlo
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Otros errores
    console.error('[MASTER] ❌ Error validando código master:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Error al validar el código master: ' + error.message
    );
  }
});
