const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

// ✅ Inicializar Resend con tu API Key desde variables de entorno
// Para producción: configurar RESEND_API_KEY en Firebase Console (Functions > Configuration > Environment variables)
// Para desarrollo local: crear archivo .env con RESEND_API_KEY=tu_api_key
const resendApiKey = process.env.RESEND_API_KEY || 're_eATCWBLR_5MBUmnvRAo2y2hYkwTt1Qdis';
const resend = new Resend(resendApiKey);

// ✅ Cloud Function para enviar código de verificación
exports.sendVerificationCode = functions.https.onRequest(async (req, res) => {
  // ✅ Habilitar CORS para permitir llamadas desde el frontend
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // ✅ Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  // ✅ Solo permitir método POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Use POST.' });
    return;
  }
  
  const { email, code } = req.body;
  
  // Validar parámetros
  if (!email || !code) {
    res.status(400).json({ error: 'Email y código son requeridos' });
    return;
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Email inválido' });
    return;
  }
  
  try {
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
    
    console.log('Email enviado exitosamente:', result);
    res.status(200).json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ error: 'Error enviando email: ' + error.message });
  }
});
