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

// ✅ Cloud Function para validar código master (HTTP, no requiere autenticación previa)
exports.validateMasterCodeHTTP = onRequest(
  { secrets: ['MASTER_HASH'] }, // 👈 Aquí enlazamos el secret de Secret Manager
  async (req, res) => {
    // ✅ Habilitar CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // ✅ Manejar preflight OPTIONS
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    // ✅ Solo permitir POST
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Método no permitido. Use POST.' });
      return;
    }

    let code;
    
    // ✅ Obtener código del body (JSON) o query parameters
    if (req.body && typeof req.body === 'object') {
      code = req.body.code;
    } else if (req.query && req.query.code) {
      code = req.query.code;
    } else {
      res.status(400).json({ success: false, error: 'El código master es requerido' });
      return;
    }

    // Validar que se proporcionó el código
    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'El código master es requerido' });
      return;
    }

    try {
      // ✅ Obtener MASTER_HASH desde Secret Manager (inyectado como variable de entorno)
      const masterHash = process.env.MASTER_HASH;

      console.log('[MASTER] ===== INICIO VALIDACIÓN =====');
      console.log('[MASTER] Código recibido (longitud):', code ? code.length : 0);
      console.log('[MASTER] Código recibido (primeros 10 chars):', code ? code.substring(0, 10) : 'null');
      console.log('[MASTER] MASTER_HASH disponible:', masterHash ? 'Sí (longitud: ' + masterHash.length + ')' : 'NO');
      console.log('[MASTER] MASTER_HASH (primeros 16 chars):', masterHash ? masterHash.substring(0, 16) + '...' : 'null');

      if (!masterHash) {
        console.error('[MASTER] ❌ MASTER_HASH no está disponible en las variables de entorno');
        res.status(500).json({
          success: false,
          error: 'Configuración del servidor incompleta (MASTER_HASH no definido)',
        });
        return;
      }

      // Calcular hash SHA-256 del código recibido
      const codeHash = crypto
        .createHash('sha256')
        .update(code.trim())
        .digest('hex');

      console.log('[MASTER] Validando código master...');
      console.log('[MASTER] Hash recibido (completo):', codeHash);
      console.log('[MASTER] Hash esperado (completo):', masterHash);
      console.log('[MASTER] Hash recibido (primeros 16):', codeHash.substring(0, 16) + '...');
      console.log('[MASTER] Hash esperado (primeros 16):', masterHash.substring(0, 16) + '...');
      console.log('[MASTER] ¿Coinciden?:', codeHash === masterHash ? '✅ SÍ' : '❌ NO');

      // Función auxiliar para encontrar primera diferencia
      function findFirstDifference(str1, str2) {
        for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
          if (str1[i] !== str2[i]) {
            return `Posición ${i}: recibido="${str1[i]}", esperado="${str2[i]}"`;
          }
        }
        if (str1.length !== str2.length) {
          return `Longitudes diferentes: recibido=${str1.length}, esperado=${str2.length}`;
        }
        return 'Sin diferencias encontradas';
      }

      // Comparar hash
      console.log('[MASTER] Comparando hashes...');
      console.log('[MASTER] Hash recibido === Hash esperado:', codeHash === masterHash);
      if (codeHash !== masterHash) {
        console.log('[MASTER] ❌ Código master inválido');
        const diff = findFirstDifference(codeHash, masterHash);
        console.log('[MASTER] Diferencia:', diff);
        res.status(403).json({ 
          success: false, 
          error: 'Código master inválido',
          hint: 'Verifica que el código sea exactamente: EDUMASTER123456987 (sin espacios)'
        });
        return;
      }

      // ✅ Código válido: retornar éxito
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
  }
);
