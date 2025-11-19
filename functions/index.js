require('dotenv').config();

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

// ✅ Inicializar Resend con tu API Key
const resend = new Resend(process.env.RESEND_API_KEY || 'tu_api_key_aqui');

// ✅ Cloud Function para enviar código de verificación
exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
  // Validar que el usuario esté autenticado (opcional, puedes quitarlo si quieres)
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
  // }
  
  const { email, code } = data;
  
  // Validar parámetros
  if (!email || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Email y código son requeridos');
  }
  
  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Email inválido');
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
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Error enviando email:', error);
    throw new functions.https.HttpsError('internal', 'Error enviando email: ' + error.message);
  }
});