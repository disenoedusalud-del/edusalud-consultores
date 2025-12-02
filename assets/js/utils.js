/* ============ MÓDULO DE UTILIDADES ============ */
// ✅ Este módulo contiene funciones de utilidad reutilizables
// ✅ Versión: 1.0 - Extraído de app.js para mejor modularidad

/* ===================== HELPER DE SELECTOR ===================== */
const $ = (s) => document.querySelector(s);

/* ===================== HELPER DE CONVERSIÓN ===================== */
const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

/* ===================== SEGURIDAD: SANITIZACIÓN XSS ===================== */

/**
 * ✅ Escapa HTML para prevenir XSS
 * Convierte caracteres especiales en entidades HTML
 */
function escapeHTML(str) {
  if (typeof str !== 'string') {
    if (str == null) return '';
    return String(str);
  }
  try {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  } catch (e) {
    // Fallback si document.createElement falla (no debería pasar)
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * ✅ Sanitiza texto para usar en innerHTML de forma segura
 * Solo permite texto plano, sin etiquetas HTML
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  return escapeHTML(str);
}

/**
 * ✅ Función helper para sanitizar inputs según su tipo
 * @param {string} value - Valor a sanitizar
 * @param {string} type - Tipo de input: 'text', 'url', 'email', 'code', 'tag', 'color'
 * @returns {string|object} Valor sanitizado o objeto con validación
 */
function safeInput(value, type = 'text') {
  if (value == null) value = '';
  if (typeof value !== 'string') value = String(value);

  const trimmed = value.trim();

  switch (type) {
    case 'text':
    case 'title':
    case 'meta':
      return sanitizeHTML(trimmed);

    case 'url':
      const urlValidation = validateURL(trimmed);
      if (urlValidation.valid) {
        return sanitizeHTML(urlValidation.url);
      }
      return sanitizeHTML(trimmed); // Sanitizar aunque sea inválido

    case 'email':
      const emailValidation = validateEmail(trimmed);
      if (emailValidation.valid) {
        return trimmed.toLowerCase(); // Emails se normalizan a lowercase
      }
      return sanitizeHTML(trimmed);

    case 'code':
    case 'tag':
      // Solo letras, números, guiones y guiones bajos
      return sanitizeHTML(trimmed.replace(/[^a-zA-Z0-9_-]/g, ''));

    case 'color':
      // Validar formato hexadecimal
      if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
        return trimmed.toUpperCase();
      }
      return '#5aa9ff'; // Color por defecto si es inválido

    case 'password':
      // Las contraseñas NO se sanitizan (se mantienen como están)
      return value; // No trim ni sanitize para passwords

    default:
      return sanitizeHTML(trimmed);
  }
}

/**
 * ✅ Obtener y sanitizar valor de un input de forma segura
 * @param {string|HTMLElement} selector - Selector CSS o elemento DOM
 * @param {string} type - Tipo de input (ver safeInput)
 * @returns {string} Valor sanitizado
 */
function getSafeInputValue(selector, type = 'text') {
  const element = typeof selector === 'string' ? $(selector) : selector;
  if (!element) return '';
  return safeInput(element.value, type);
}

/* ===================== VALIDACIÓN ===================== */

/**
 * ✅ Valida URL
 * @param {string} url - URL a validar
 * @returns {object} {valid: boolean, url: string, error: string}
 */
function validateURL(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'La URL es requerida' };
  }

  const trimmed = url.trim();

  try {
    const urlObj = new URL(trimmed);
    return { valid: true, url: urlObj.href };
  } catch (e) {
    // Si no tiene protocolo, intentar agregar https://
    try {
      const urlWithProtocol = trimmed.startsWith('http') ? trimmed : 'https://' + trimmed;
      const urlObj = new URL(urlWithProtocol);
      return { valid: true, url: urlObj.href };
    } catch (e2) {
      return { valid: false, error: 'Formato de URL inválido' };
    }
  }
}

/**
 * ✅ Valida email
 * @param {string} email - Email a validar
 * @returns {object} {valid: boolean, error: string}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'El correo electrónico es requerido' };
  }

  const trimmed = email.trim().toLowerCase();

  // Expresión regular mejorada para validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Formato de correo electrónico inválido' };
  }

  // Validar longitud máxima
  if (trimmed.length > 254) {
    return { valid: false, error: 'El correo electrónico es demasiado largo' };
  }

  return { valid: true };
}

/**
 * ✅ Valida contraseña
 * @param {string} password - Contraseña a validar
 * @param {number} minLength - Longitud mínima (default: 6)
 * @returns {object} {valid: boolean, error: string}
 */
function validatePassword(password, minLength = 6) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `La contraseña debe tener al menos ${minLength} caracteres` };
  }

  return { valid: true };
}

/**
 * ✅ Valida código de verificación (6 dígitos)
 * @param {string} code - Código a validar
 * @returns {object} {valid: boolean, error: string}
 */
function validateVerificationCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'El código de verificación es requerido' };
  }

  const trimmed = code.trim();

  if (trimmed.length !== 6) {
    return { valid: false, error: 'El código debe tener exactamente 6 dígitos' };
  }

  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, error: 'El código debe contener solo números' };
  }

  return { valid: true };
}

/* ===================== HASH Y CRIPTOGRAFÍA ===================== */

/**
 * ✅ Genera hash SHA-256 de un texto
 * @param {string} text - Texto a hashear
 * @returns {Promise<string>} Hash hexadecimal
 */
async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text).trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}

/* ===================== GESTIÓN DE ERRORES DE CAMPOS ===================== */

/**
 * ✅ Limpia errores visuales de todos los campos de formulario
 */
function clearFieldErrors() {
  const fields = ['input-email', 'input-password', 'input-register-email', 'input-register-password', 'input-register-password-confirm', 'input-reset-email'];
  fields.forEach(id => {
    const field = $(`#${id}`);
    if (field) {
      field.style.borderColor = '';
      field.style.backgroundColor = '';
    }
  });
}

/**
 * ✅ Marca un campo como con error (visual)
 * @param {string} fieldId - ID del campo a marcar
 */
function markFieldError(fieldId) {
  const field = $(`#${fieldId}`);
  if (field) {
    field.style.borderColor = '#ff7a7a';
    field.style.backgroundColor = 'rgba(255, 122, 122, 0.1)';
  }
}

/* ===================== NORMALIZACIÓN ===================== */

/**
 * ✅ Normalizar email para usar como key en Firebase
 * Convierte a lowercase, trim y reemplaza puntos por guiones bajos
 * @param {string} email - Email a normalizar
 * @returns {string} Email normalizado
 */
function normalizeEmailKey(email) {
  return email.toLowerCase().trim().replace(/\./g, '_');
}

/* ===================== EXPOSICIÓN GLOBAL ===================== */
// ✅ Exponer funciones globalmente para compatibilidad
window.Utils = {
  $: $,
  escapeHTML: escapeHTML,
  sanitizeHTML: sanitizeHTML,
  safeInput: safeInput,
  getSafeInputValue: getSafeInputValue,
  validateURL: validateURL,
  validateEmail: validateEmail,
  validatePassword: validatePassword,
  validateVerificationCode: validateVerificationCode,
  sha256Hex: sha256Hex,
  clearFieldErrors: clearFieldErrors,
  markFieldError: markFieldError,
  normalizeEmailKey: normalizeEmailKey,
  toHex: toHex
};

// ✅ También exponer funciones directamente en window para compatibilidad con código existente
window.$ = $;
window.escapeHTML = escapeHTML;
window.sanitizeHTML = sanitizeHTML;
window.safeInput = safeInput;
window.getSafeInputValue = getSafeInputValue;
window.validateURL = validateURL;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.validateVerificationCode = validateVerificationCode;
window.sha256Hex = sha256Hex;
window.clearFieldErrors = clearFieldErrors;
window.markFieldError = markFieldError;
window.normalizeEmailKey = normalizeEmailKey;

