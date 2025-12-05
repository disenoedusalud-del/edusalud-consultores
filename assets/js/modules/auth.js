/* ============ MÓDULO DE AUTENTICACIÓN ============ */
// ✅ Este módulo maneja todo lo relacionado con autenticación
// ✅ Depende de window.App para acceder a funciones de app.js
// ✅ Versión: 1.0 - Separado de app.js para mejor mantenibilidad

// Verificar que App esté disponible
if (typeof window.App === 'undefined') {
    console.error('[AUTH] ❌ App namespace no disponible. Asegúrate de cargar app.js antes de auth.js');
}

// ✅ Acceder a App de forma segura
function getApp() {
    if (typeof window.App === 'undefined') {
        console.error('[AUTH] ❌ App namespace no disponible. Asegúrate de cargar app.js antes de auth.js');
        return null;
    }
    return window.App;
}

// ✅ Funciones helper para acceder a constantes de forma segura
function getMasterHash() {
    const App = getApp();
    if (!App) return null;
    try {
        return App.getMasterHash();
    } catch (e) {
        console.error('[AUTH] Error obteniendo MASTER_HASH:', e);
        return null;
    }
}

function getSuperAdmins() {
    const App = getApp();
    if (!App) return [];
    try {
        return App.getSuperAdmins();
    } catch (e) {
        console.error('[AUTH] Error obteniendo SUPER_ADMINS:', e);
        return [];
    }
}

function getAuditActionTypes() {
    const App = getApp();
    if (!App) return {};
    try {
        return App.getAuditActionTypes();
    } catch (e) {
        console.error('[AUTH] Error obteniendo AUDIT_ACTION_TYPES:', e);
        return {};
    }
}

// ✅ Variables globales que este módulo necesita modificar
// Estas se acceden directamente desde window porque son compartidas
// window.currentUserEmail
// window.allowedCoursesForUser
// window.isFromUserView
// isMasterAuthenticated (se accede mediante App)
// currentKeyHex (se accede mediante App)

/* ============ FUNCIONES DE AUTENTICACIÓN ============ */

// ✅ Función para login con código secreto
async function tryLoginByCode(code) {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en tryLoginByCode');
        return false;
    }

    const msg = App.$('#msg');
    if (!msg) {
        console.error('[AUTH] No se encontró el elemento #msg');
        return false;
    }
    msg.textContent = 'Verificando…';
    msg.classList.remove('error');

    // ✅ Sanitizar código
    const sanitizedCode = App.safeInput(code, 'code');

    if (!sanitizedCode || sanitizedCode.length === 0) {
        msg.textContent = 'Ingrese un código válido.';
        msg.classList.add('error');
        return false;
    }

    try {
        // ✅ Debug: Ver qué código se está procesando ANTES de hashear
        App.log('[LOGIN] ===== INICIO VALIDACIÓN =====');
        App.log('[LOGIN] Código ingresado (longitud):', sanitizedCode.length);
        App.log('[LOGIN] Código ingresado (completo):', sanitizedCode);
        App.log('[LOGIN] Código ingresado (códigos ASCII):', Array.from(sanitizedCode).map(c => c.charCodeAt(0)).join(','));

        const hex = await App.sha256Hex(sanitizedCode);
        App.log('[LOGIN] Hash calculado localmente:', hex);
        App.log('[LOGIN] Hash esperado (según README):', '7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8');

        // ✅ Google Analytics: Tracking de intento de login
        if (typeof gtag !== 'undefined') {
            gtag('event', 'login_attempt', {
                'event_category': 'authentication',
                'event_label': 'attempt'
            });
        }

        // master - Validar usando Cloud Function (HTTP, no requiere autenticación)
        // Verificar si Firebase Functions está disponible
        if (!window.firebaseFunctions) {
            App.warn('[LOGIN] Firebase Functions no disponible, usando validación local como fallback');
            // Fallback a validación local (temporal hasta que Functions esté disponible)
            const MASTER_HASH_VAL = getMasterHash();
            if (MASTER_HASH_VAL && hex === MASTER_HASH_VAL) {
                App.log('[LOGIN] ✅ Código master válido (fallback local)');
                App.setIsMasterAuthenticated(true);
                if (MASTER_HASH_VAL) {
                    App.setCurrentKeyHex(MASTER_HASH_VAL);
                }
                // Continuar con el flujo normal...
            } else {
                msg.textContent = 'Código inválido. Verifique y vuelva a intentar.';
                msg.classList.add('error');
                return false;
            }
        } else {
            // Usar Cloud Function HTTP para validar código master
            App.log('[LOGIN] Validando código master con Cloud Function...');

            try {
                // ✅ URL de la función v2 desplegada (usando Secret Manager)
                const functionUrl = 'https://validatemastercodehttp-nzqxumxiba-uc.a.run.app';

                App.log('[LOGIN] Llamando a:', functionUrl);

                // Llamar a la función HTTP
                // ✅ Forzar console.log para que siempre se vea
                console.log('[LOGIN] ===== DETALLES DEL CÓDIGO MASTER =====');
                console.log('[LOGIN] Enviando código master (primeros 5 chars):', sanitizedCode.substring(0, 5) + '...');
                console.log('[LOGIN] Código completo que se envía:', sanitizedCode);
                console.log('[LOGIN] Longitud del código:', sanitizedCode.length);
                console.log('[LOGIN] Código esperado (según README):', 'EDUMASTER123456987');
                console.log('[LOGIN] ¿Coinciden?:', sanitizedCode === 'EDUMASTER123456987' ? '✅ SÍ' : '❌ NO');
                console.log('[LOGIN] Código en ASCII:', Array.from(sanitizedCode).map(c => c.charCodeAt(0)).join(','));
                console.log('[LOGIN] Body JSON que se envía:', JSON.stringify({ code: sanitizedCode }));
                console.log('[LOGIN] ======================================');

                App.log('[LOGIN] Enviando código master (primeros 5 chars):', sanitizedCode.substring(0, 5) + '...');
                App.log('[LOGIN] Código completo que se envía:', sanitizedCode);
                App.log('[LOGIN] Longitud del código:', sanitizedCode.length);
                App.log('[LOGIN] Código esperado (según README):', 'EDUMASTER123456987');
                App.log('[LOGIN] ¿Coinciden?:', sanitizedCode === 'EDUMASTER123456987' ? '✅ SÍ' : '❌ NO');
                App.log('[LOGIN] Body JSON que se envía:', JSON.stringify({ code: sanitizedCode }));

                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: sanitizedCode })
                });

                // ✅ Forzar console.log para que siempre se vea
                console.log('[LOGIN] Respuesta recibida - Status:', response.status, response.statusText);
                App.log('[LOGIN] Respuesta recibida - Status:', response.status, response.statusText);

                // Verificar si la respuesta es JSON válido
                let result;
                try {
                    result = await response.json();
                } catch (parseError) {
                    const textResponse = await response.text();
                    console.error('[LOGIN] ❌ Error parseando respuesta JSON:', parseError);
                    console.error('[LOGIN] Respuesta recibida (texto):', textResponse);
                    App.error('[LOGIN] ❌ Error parseando respuesta JSON:', parseError);
                    App.error('[LOGIN] Respuesta recibida (texto):', textResponse);
                    throw new Error('Error en la respuesta del servidor: ' + response.statusText);
                }

                console.log('[LOGIN] Resultado parseado:', result);
                App.log('[LOGIN] Resultado parseado:', result);

                if (result.success) {
                    App.log('[LOGIN] ✅ Código master válido!');
                    App.setIsMasterAuthenticated(true);
                    // Obtener MASTER_HASH para usar como currentKeyHex (necesario para compatibilidad)
                    const MASTER_HASH_VAL = getMasterHash();
                    if (MASTER_HASH_VAL) {
                        App.setCurrentKeyHex(MASTER_HASH_VAL);
                    }
                } else {
                    // Log detallado del debug info si existe
                    if (result.debug) {
                        console.warn('[LOGIN] ⚠️ DEBUG INFO:', result.debug);
                        console.warn(`[LOGIN] Recibido (len=${result.debug.receivedLength}): ${result.debug.receivedStart}...`);
                        console.warn(`[LOGIN] Esperado (len=${result.debug.expectedLength}): ${result.debug.expectedStart}...`);
                    }
                    App.error('[LOGIN] ❌ Código master rechazado:', result.error);
                    throw new Error(result.error || 'Código master inválido');
                }
            } catch (error) {
                App.error('[LOGIN] ❌ Error validando código master:', error);

                // Si es error de código inválido, mostrar mensaje específico
                if (error.message?.includes('inválido') || error.message?.includes('invalid')) {
                    msg.textContent = 'Código master inválido. Verifique y vuelva a intentar.';
                } else {
                    msg.textContent = 'Error al validar el código. Por favor, intente nuevamente.';
                }
                msg.classList.add('error');
                return false;
            }
        }

        // Si llegamos aquí, el código master es válido
        if (App.getIsMasterAuthenticated()) {
            App.log('[LOGIN] ✅ Código master válido! Continuando con flujo master...');

            // Obtener MASTER_HASH para usar en el filtro
            const MASTER_HASH_VAL = getMasterHash();

            // ✅ Refresh en background (no bloquear login) con timeout corto
            if (App.hasRemote()) {
                App.log('[SYNC] Iniciando refresh de todos los cursos en background...');
                const mergedMap = App.getMergedAccessHashMap();
                const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH_VAL);
                App.log('[SYNC] Total de cursos a refrescar:', hexes.length);

                // Iniciar refresh en background (no await, con timeout global)
                Promise.race([
                    Promise.allSettled(hexes.map((h, index) => {
                        const isLast = index === hexes.length - 1;
                        const label = isLast ? `[ÚLTIMO CURSO]` : '';
                        App.log(`${label} [SYNC] Refrescando curso ${index + 1}/${hexes.length}: ${h.substring(0, 8)}...`);
                        return App.refreshFromRemoteSilent(h)
                            .then(result => {
                                if (isLast) {
                                    App.log(`[ÚLTIMO CURSO] ✅ Refresh completado para ${h.substring(0, 8)}, resultado:`, result);
                                }
                                return result;
                            })
                            .catch(e => {
                                console.error(`[SYNC] ❌ Error refrescando curso ${h.substring(0, 8)}:`, e);
                                return false;
                            });
                    })),
                    new Promise(resolve => setTimeout(() => {
                        App.log('[SYNC] Timeout refresh global, continuando...');
                        resolve({});
                    }, 2000)) // Timeout de 2 segundos máximo para todos los cursos
                ])
                    .then(results => {
                        if (Array.isArray(results)) {
                            const successful = results.filter(r => r.status === 'fulfilled').length;
                            const failed = results.filter(r => r.status === 'rejected').length;
                            App.log(`[SYNC] Refresh completado: ${successful} exitosos, ${failed} fallidos`);
                        }
                    })
                    .catch(e => {
                        App.warn('[SYNC] Error general en refresh:', e);
                    });

                App.log('[SYNC] Refresh iniciado en background, continuando con login...');
            }

            // Ejecutar animación de loader ahora que ya tenemos los datos
            try {
                await App.runLoader();
            } catch (e) { }

            App.clearAttempts();
            App.setQueryParam('code', btoa(code));

            // ✅ Cargar cursos remotos en background (no bloquear)
            App.refreshCustomCourses().catch(e => {
                App.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
            });

            App.buildMasterGrid();
            App.setupMasterSearch();
            App.$('#year_master').textContent = new Date().getFullYear();
            App.showMaster();
            // ✅ Llamar setupAdvancedFilters y setupNotificationsPanel DESPUÉS de showMaster para asegurar que los elementos estén visibles
            setTimeout(() => {
                App.setupAdvancedFilters();
                App.setupNotificationsPanel();
            }, 50);

            // ✅ Google Analytics: Tracking login exitoso Master
            if (typeof gtag !== 'undefined') {
                gtag('event', 'login_success_master', {
                    'event_category': 'authentication'
                });
            }

            return true;
        }

        // normal
        // ✅ CRÍTICO: Cargar cursos personalizados ANTES de validar (por si no están cargados)
        // Esto asegura que cursos personalizados recién creados estén disponibles
        if (App.hasRemote()) {
            App.log('[LOGIN] Cargando cursos personalizados antes de validar...');
            await App.refreshCustomCourses().catch(e => {
                App.warn('[LOGIN] Error cargando cursos personalizados (continuando):', e);
            });
        }

        // ✅ Obtener mergedMap DESPUÉS de cargar cursos personalizados
        const mergedMap = App.getMergedAccessHashMap();
        App.log('[LOGIN] Validando código, cursos disponibles:', Object.keys(mergedMap).length);
        App.log('[LOGIN] Hex a buscar:', hex.substring(0, 8) + '...');

        if (mergedMap && mergedMap[hex]) {
            App.log('[LOGIN] ✅ Código válido encontrado en hashmap');
            // Mostrar loader inmediatamente
            App.showLoader();

            // ✅ CRÍTICO: Esperar refresh ANTES de renderizar (igual que cursos base desde master)
            // Esto asegura que los archivos estén actualizados cuando se muestra el curso
            if (App.hasRemote()) {
                App.log('[SYNC] Iniciando refresh antes de mostrar curso...');
                await App.refreshFromRemoteSilent(hex).catch(e => {
                    App.warn('[SYNC] Error en refresh:', e);
                    return false;
                });
                App.log('[SYNC] ✅ Refresh completado, renderizando curso...');
            }

            // Ejecutar animación de loader después del refresh
            try {
                await App.runLoader();
            } catch (e) { }

            App.setCurrentKeyHex(hex);
            App.clearAttempts();
            App.setQueryParam('code', btoa(code));
            App.renderCourse(hex);
            App.showContent();

            // ✅ Google Analytics: Tracking login exitoso curso
            if (typeof gtag !== 'undefined') {
                const courseData = mergedMap[hex];
                gtag('event', 'login_success_course', {
                    'event_category': 'authentication',
                    'event_label': courseData.card?.tag || 'unknown'
                });
            }

            return true;
        } else {
            App.warn('[LOGIN] ❌ Código no encontrado en hashmap');
            App.warn('[LOGIN] Cursos disponibles:', Object.keys(mergedMap || {}));
            App.warn('[LOGIN] Hex buscado:', hex.substring(0, 8) + '...');

            const attempts = App.recordAttempt();
            msg.textContent = 'Código inválido. Verifique y vuelva a intentar.';
            msg.classList.add('error');
            App.maybeShowAttemptsWarning();

            // ✅ Google Analytics: Tracking de código inválido
            if (typeof gtag !== 'undefined') {
                gtag('event', 'login_error', {
                    'event_category': 'authentication',
                    'event_label': 'invalid_code',
                    'value': attempts
                });
            }

            return false;
        }
    } catch (e) {
        console.error(e);
        msg.textContent = 'Ocurrió un error al verificar el código.';
        msg.classList.add('error');
        return false;
    }
}

/* ============ Firebase Authentication ============ */

// ✅ Función para manejar pestañas de autenticación
function switchAuthTab(tab) {
    const App = getApp();
    if (!App) return;
    const tabCode = App.$('#tab-code');
    const tabAccount = App.$('#tab-account');
    const formCode = App.$('#form-code');
    const formAccount = App.$('#form-account');

    if (tab === 'code') {
        if (tabCode) tabCode.classList.add('active');
        if (tabAccount) tabAccount.classList.remove('active');
        if (formCode) formCode.classList.remove('hidden');
        if (formAccount) formAccount.classList.add('hidden');
    } else {
        if (tabCode) tabCode.classList.remove('active');
        if (tabAccount) tabAccount.classList.add('active');
        if (formCode) formCode.classList.add('hidden');
        if (formAccount) formAccount.classList.remove('hidden');
        // Mostrar formulario de login por defecto
        showLoginForm();
    }
}

// ✅ Función para mostrar formulario de login
function showLoginForm() {
    const App = getApp();
    if (!App) return;
    const formLogin = App.$('#form-login');
    const formRegister = App.$('#form-register');
    const formReset = App.$('#form-reset');

    if (formLogin) {
        formLogin.classList.remove('hidden');
    }
    if (formRegister) {
        formRegister.classList.add('hidden');
        // Resetear formulario de registro al paso 1
        const step1 = App.$('#register-step-1');
        const step2 = App.$('#register-step-2');
        const step3 = App.$('#register-step-3');
        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
        if (step3) step3.style.display = 'none';
        window.verifiedEmailForRegistration = null;
        window.verifiedCoursesForRegistration = null;
        window.verifiedIsAdmin = null;
        showAuthMessage('msg-register', '', false);
        showAuthMessage('msg-register-step2', '', false);
        showAuthMessage('msg-register-step3', '', false);
        App.clearFieldErrors();
    }
    if (formReset) {
        formReset.classList.add('hidden');
    }
}

// ✅ Función para mostrar mensaje de autenticación
function showAuthMessage(elementId, message, isError = false) {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en showAuthMessage');
        return;
    }
    const msgEl = App.$(elementId);
    if (msgEl) {
        msgEl.textContent = message;
        msgEl.classList.remove('error');
        if (isError) {
            msgEl.classList.add('error');
        }
        // Asegurar que el mensaje sea visible
        msgEl.style.display = 'block';
        msgEl.style.visibility = 'visible';
        App.log('[AUTH] 💬 Mensaje mostrado:', elementId, message);
    } else {
        App.warn('[AUTH] ⚠️ No se encontró el elemento para mensaje:', elementId);
    }
}

// ✅ Función para login con email/password
async function tryLoginByEmail() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en tryLoginByEmail');
        return false;
    }

    // ✅ Rate limiting: prevenir ataques de fuerza bruta
    // if (!App.checkRateLimitSimple('login')) {
    //     console.warn('[AUTH] Rate limit excedido para login');
    //     return false;
    // }

    // ✅ Sanitizar inputs
    const email = App.getSafeInputValue('#input-email', 'email');
    const password = App.getSafeInputValue('#input-password', 'password'); // Password no se sanitiza

    App.log('[AUTH] Intentando login con:', email);

    if (!email || !password) {
        showAuthMessage('msg-auth', 'Por favor, completa todos los campos.', true);
        return false;
    }

    if (!email.includes('@')) {
        showAuthMessage('msg-auth', 'Por favor, ingresa un correo válido.', true);
        App.markFieldError('input-email');
        return false;
    }

    App.clearFieldErrors();
    showAuthMessage('msg-auth', 'Iniciando sesión…', false);

    try {
        App.log('[AUTH] Verificando objeto firebaseAuth:', window.firebaseAuth);

        if (!window.firebaseAuth) {
            console.error('[AUTH] window.firebaseAuth es undefined/null');
            showAuthMessage('msg-auth', 'Firebase Authentication no está disponible. Por favor, espere unos segundos e intente nuevamente.', true);
            return false;
        }

        App.log('[AUTH] Llamando a signInWithEmailAndPassword...');
        const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        App.log('[AUTH] signInWithEmailAndPassword retornó:', userCredential);

        const user = userCredential.user;
        const userEmail = user.email.toLowerCase().trim();

        App.log('[AUTH] ✅ Login exitoso:', userEmail);

        window.currentUserEmail = userEmail;

        // ✅ PRIMERO: Verificar si es administrador
        let isAdmin = false;
        try {
            App.log('[AUTH] 🔍 Verificando si', userEmail, 'es administrador...');
            isAdmin = await App.checkIsAdmin(userEmail);
            App.log('[AUTH] 🔍 Resultado de checkIsAdmin para', userEmail, ':', isAdmin);

            // ✅ Verificación adicional: verificar directamente si es super admin (por si checkIsAdmin falla)
            if (!isAdmin) {
                const normalizedEmail = userEmail.toLowerCase().trim();
                const superAdmins = getSuperAdmins();
                const isSuperAdmin = superAdmins.includes(normalizedEmail);
                App.log('[AUTH] 🔍 Verificación directa de super admin:', isSuperAdmin, 'para', normalizedEmail);
                if (isSuperAdmin) {
                    App.log('[AUTH] ✅ Detectado como super admin directamente');
                    isAdmin = true;
                }
            }
        } catch (error) {
            console.error('[AUTH] ❌ Error verificando si es admin:', error);
            // Si hay error, intentar verificar directamente los super admins
            const normalizedEmail = userEmail.toLowerCase().trim();
            const superAdmins = getSuperAdmins();
            isAdmin = superAdmins.includes(normalizedEmail);
            App.log('[AUTH] 🔍 Verificación directa de super admin (fallback):', isAdmin);
        }

        if (isAdmin) {
            // ✅ Es administrador, otorgar acceso master directamente
            App.log('[AUTH] ✅ Usuario es administrador, otorgando acceso master');
            showAuthMessage('msg-auth', '¡Bienvenido! Acceso de administrador activado.', false);
            await handleSuccessfulAuthWithEmail(userEmail, []); // Array vacío, pero es admin
            return true;
        }

        // ✅ Si NO es admin, verificar cursos permitidos
        showAuthMessage('msg-auth', 'Verificando cursos disponibles…', false);

        let allowedCourses;
        try {
            allowedCourses = await App.getCoursesForEmail(userEmail);
        } catch (error) {
            console.error('[AUTH] ❌ Error obteniendo cursos:', error);
            showAuthMessage('msg-auth', 'Error al verificar cursos. Por favor, intente nuevamente.', true);
            return false;
        }

        App.log('[AUTH] Cursos permitidos para', userEmail, ':', allowedCourses.length);

        if (allowedCourses.length === 0) {
            showAuthMessage('msg-auth', 'No tienes acceso a ningún curso. Contacta al administrador para solicitar acceso.', true);
            return false;
        }

        // ✅ USAR LA FUNCIÓN EXISTENTE (LÓGICA INTACTA)
        await handleSuccessfulAuthWithEmail(userEmail, allowedCourses);
        showAuthMessage('msg-auth', `¡Bienvenido! Tienes acceso a ${allowedCourses.length} curso(s).`, false);

        // ✅ Log de auditoría
        const auditTypes = getAuditActionTypes();
        await App.auditLog(auditTypes.LOGIN_SUCCESS, {
            email: userEmail,
            coursesCount: allowedCourses.length
        }, userEmail, false); // No enviar a Firebase para evitar spam

        return true;

    } catch (error) {
        console.error('[AUTH] ❌ Error en login:', error);
        let errorMessage = 'Error al iniciar sesión.';

        // ✅ Log de auditoría para login fallido
        const email = App.getSafeInputValue('#input-email', 'email');
        const auditTypes = getAuditActionTypes();
        await App.auditLog(auditTypes.LOGIN_FAILED, {
            email: email || 'unknown',
            errorCode: error.code || 'unknown'
        }, email, false); // No enviar a Firebase para evitar spam

        // ✅ Manejar errores específicos
        if (error.code === 'auth/invalid-login-credentials' ||
            error.code === 'auth/user-not-found' ||
            error.code === 'auth/wrong-password') {
            errorMessage = 'Correo o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.';
            App.markFieldError('input-email');
            App.markFieldError('input-password');
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Correo electrónico inválido.';
            App.markFieldError('input-email');
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Esta cuenta ha sido deshabilitada.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        } else if (error.message && error.message.includes('permission_denied')) {
            // ✅ ERROR DE PERMISOS: El usuario se autenticó pero no puede leer la BD
            console.warn('[AUTH] ⚠️ Usuario autenticado pero sin permisos de lectura (permission_denied)');

            // Intentar ver si es un problema de reglas de seguridad para un usuario nuevo
            // Asumimos que si entró, es un usuario válido, pero tal vez sus permisos no se han propagado
            // O es un usuario que no tiene cursos asignados y las reglas bloquean la lectura

            showAuthMessage('msg-auth', 'Sesión iniciada, pero no tienes cursos asignados o permisos suficientes.', true);

            // Opcional: Cerrar sesión para no dejarlo en un estado limbo
            // await logoutFirebase(); 
            return false;
        } else {
            // ✅ Mensaje genérico sin mencionar Firebase
            errorMessage = 'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.';
        }

        showAuthMessage('msg-auth', errorMessage, true);
        return false;
    }
}


// ✅ Funciones auxiliares de verificación
function normalizeEmailKey(email) {
    return email.toLowerCase().trim().replace(/\./g, '_');
}

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function saveVerificationCode(email, code) {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en saveVerificationCode');
        throw new Error('App no disponible');
    }
    try {
        const db = App.getFirebaseDB();
        if (!db) {
            throw new Error('Firebase no disponible');
        }

        const emailKey = normalizeEmailKey(email);
        const codeRef = db.ref(`${App.getVerificationCodesPath()}/${emailKey}`);

        const codeData = {
            code: code,
            email: email.toLowerCase().trim(),
            createdAt: Date.now(),
            expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutos
            used: false
        };

        await codeRef.set(codeData);
        App.log('[VERIFICATION] ✅ Código guardado en Firebase para:', email);
        return true;
    } catch (error) {
        App.error('[VERIFICATION] ❌ Error guardando código:', error);
        throw error;
    }
}

async function sendVerificationCode(email, code) {
    try {
        if (typeof emailjs === 'undefined') {
            console.error('[VERIFICATION] ❌ EmailJS no está cargado');
            throw new Error('EmailJS no está disponible. Por favor, recarga la página.');
        }

        const SERVICE_ID = 'service_ectemf7';
        const TEMPLATE_ID = 'template_g9pmmxm';

        const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            email: email,
            code: code,
            from_name: 'EduSalud'
        });

        return { success: true };
    } catch (error) {
        console.error('[VERIFICATION] ❌ Error enviando código:', error);
        throw error;
    }
}

async function verifyCode(email, code) {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en verifyCode');
        return { valid: false, error: 'App no disponible' };
    }
    try {
        const db = App.getFirebaseDB();
        if (!db) {
            throw new Error('Firebase no disponible');
        }

        const emailKey = normalizeEmailKey(email);
        const codeRef = db.ref(`${App.getVerificationCodesPath()}/${emailKey}`);
        const snapshot = await codeRef.once('value');

        if (!snapshot.exists()) {
            return { valid: false, error: 'Código no encontrado. Solicita uno nuevo.' };
        }

        const codeData = snapshot.val();
        const now = Date.now();

        if (codeData.used) {
            return { valid: false, error: 'Este código ya fue utilizado.' };
        }

        if (now > codeData.expiresAt) {
            return { valid: false, error: 'El código ha expirado. Solicita uno nuevo.' };
        }

        if (codeData.code !== code.trim()) {
            return { valid: false, error: 'Código incorrecto. Intenta nuevamente.' };
        }

        await codeRef.update({ used: true });
        App.log('[VERIFICATION] ✅ Código verificado correctamente');
        return { valid: true };
    } catch (error) {
        App.error('[VERIFICATION] ❌ Error verificando código:', error);
        return { valid: false, error: 'Error al verificar el código. Intenta nuevamente.' };
    }
}

// ✅ Función para verificar correo antes de registrar
async function verifyEmailForRegistration() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en verifyEmailForRegistration');
        return false;
    }
    if (!App.checkRateLimitSimple('register')) {
        return false;
    }

    const email = App.getSafeInputValue('#input-register-email', 'email');

    if (!email) {
        showAuthMessage('msg-register', 'Por favor, ingresa tu correo electrónico.', true);
        return false;
    }

    if (!email.includes('@')) {
        showAuthMessage('msg-register', 'Por favor, ingresa un correo válido.', true);
        App.markFieldError('input-register-email');
        return false;
    }

    App.clearFieldErrors();
    const normalizedEmail = email;
    showAuthMessage('msg-register', 'Verificando autorización del correo…', false);

    try {
        const isAdmin = await App.checkIsAdmin(normalizedEmail);
        let allowedCourses = [];

        if (!isAdmin) {
            allowedCourses = await App.getCoursesForEmail(normalizedEmail);
            if (allowedCourses.length === 0) {
                showAuthMessage('msg-register', 'Este correo no está autorizado para crear una cuenta. Contacta al administrador para solicitar acceso.', true);
                App.markFieldError('input-register-email');
                return false;
            }
        }

        showAuthMessage('msg-register', 'Generando código de verificación…', false);

        try {
            const code = generateVerificationCode();
            await saveVerificationCode(normalizedEmail, code);

            try {
                await sendVerificationCode(normalizedEmail, code);
            } catch (sendError) {
                showAuthMessage('msg-register', 'Error al enviar el código: ' + sendError.message + '. Puedes intentar reenviarlo más tarde.', true);
                window.verifiedEmailForRegistration = normalizedEmail;
                window.verifiedCoursesForRegistration = allowedCourses;
                window.verifiedIsAdmin = isAdmin || false;

                const step1 = App.$('#register-step-1');
                const step2 = App.$('#register-step-2');
                if (step1) step1.style.display = 'none';
                if (step2) step2.style.display = 'block';

                const verifiedEmailDisplay = App.$('#verified-email-display');
                if (verifiedEmailDisplay) verifiedEmailDisplay.textContent = normalizedEmail;

                const codeInput = App.$('#input-verification-code');
                if (codeInput) codeInput.value = '';

                showAuthMessage('msg-register-step2', 'No se pudo enviar el código. Usa el botón "Reenviar código" para intentar nuevamente.', true);
                return true;
            }

            window.verifiedEmailForRegistration = normalizedEmail;
            window.verifiedCoursesForRegistration = allowedCourses;
            window.verifiedIsAdmin = isAdmin || false;

            const step1 = App.$('#register-step-1');
            const step2 = App.$('#register-step-2');
            if (step1) step1.style.display = 'none';
            if (step2) step2.style.display = 'block';

            const verifiedEmailDisplay = App.$('#verified-email-display');
            if (verifiedEmailDisplay) verifiedEmailDisplay.textContent = normalizedEmail;

            const codeInput = App.$('#input-verification-code');
            if (codeInput) codeInput.value = '';

            setTimeout(() => {
                if (codeInput) codeInput.focus();
            }, 100);

            showAuthMessage('msg-register-step2', 'Código enviado a tu correo. Revisa tu bandeja de entrada (y spam).', false);
            return true;
        } catch (error) {
            console.error('[VERIFICATION] ❌ Error en proceso de verificación:', error);
            showAuthMessage('msg-register', 'Error al procesar la verificación. Intenta nuevamente.', true);
            return false;
        }
    } catch (error) {
        console.error('[AUTH] ❌ Error verificando correo:', error);
        showAuthMessage('msg-register', 'Error al verificar el correo. Intenta nuevamente.', true);
        return false;
    }
}

// ✅ Función para registro con email/password
async function tryRegister() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en tryRegister');
        return false;
    }
    if (!App.checkRateLimitSimple('register')) {
        return false;
    }

    const email = window.verifiedEmailForRegistration;
    const password = App.$('#input-register-password')?.value || '';
    const passwordConfirm = App.$('#input-register-password-confirm')?.value || '';

    if (!email) {
        showAuthMessage('msg-register-step3', 'Error: El correo no fue verificado. Por favor, vuelve al paso anterior.', true);
        return false;
    }

    if (!password || !passwordConfirm) {
        showAuthMessage('msg-register-step3', 'Por favor, completa todos los campos.', true);
        return false;
    }

    if (password.length < 6) {
        showAuthMessage('msg-register-step3', 'La contraseña debe tener al menos 6 caracteres.', true);
        App.markFieldError('input-register-password');
        return false;
    }

    if (password !== passwordConfirm) {
        showAuthMessage('msg-register-step3', 'Las contraseñas no coinciden.', true);
        App.markFieldError('input-register-password-confirm');
        return false;
    }

    App.clearFieldErrors();
    showAuthMessage('msg-register-step3', 'Creando cuenta…', false);

    try {
        if (!window.firebaseAuth) {
            showAuthMessage('msg-register-step3', 'Firebase Authentication no está disponible. Por favor, espere unos segundos e intente nuevamente.', true);
            return false;
        }

        const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        App.log('[AUTH] ✅ Registro exitoso:', userCredential.user.email);

        showAuthMessage('msg-register-step3', '¡Cuenta creada exitosamente! Cargando tus cursos…', false);

        const allowedCourses = window.verifiedCoursesForRegistration || [];
        window.currentUserEmail = email;
        await handleSuccessfulAuthWithEmail(email, allowedCourses);

        const auditTypes = getAuditActionTypes();
        await App.auditLog(auditTypes.REGISTER_SUCCESS, {
            email: email,
            coursesCount: allowedCourses.length
        }, email, true);

        window.verifiedEmailForRegistration = null;
        window.verifiedCoursesForRegistration = null;
        window.verifiedIsAdmin = null;

        return true;
    } catch (error) {
        console.error('[AUTH] ❌ Error en registro:', error);
        let errorMessage = 'Error al crear la cuenta.';

        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este correo ya está registrado. Inicia sesión en su lugar.';
            App.markFieldError('input-register-password');
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Correo electrónico inválido.';
            App.markFieldError('input-register-password');
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'La contraseña es muy débil. Usa al menos 6 caracteres.';
            App.markFieldError('input-register-password');
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        } else {
            errorMessage = 'No se pudo crear la cuenta. Verifica los datos e intenta nuevamente.';
        }

        showAuthMessage('msg-register-step3', errorMessage, true);
        return false;
    }
}

// ✅ Función para verificar código de verificación
async function verifyCodeForRegistration() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en verifyCodeForRegistration');
        return false;
    }
    if (!App.checkRateLimitSimple('verify_code')) {
        return false;
    }

    const email = window.verifiedEmailForRegistration;
    const code = App.getSafeInputValue('#input-verification-code', 'code');

    if (!email) {
        showAuthMessage('msg-register-step2', 'Error: El correo no fue verificado. Por favor, vuelve al paso anterior.', true);
        return false;
    }

    if (!code || code.length !== 6) {
        showAuthMessage('msg-register-step2', 'Por favor, ingresa el código de 6 dígitos.', true);
        App.markFieldError('input-verification-code');
        return false;
    }

    App.clearFieldErrors();
    showAuthMessage('msg-register-step2', 'Verificando código…', false);

    const verification = await verifyCode(email, code);

    if (!verification.valid) {
        showAuthMessage('msg-register-step2', verification.error || 'Código inválido. Intenta nuevamente.', true);
        App.markFieldError('input-verification-code');
        return false;
    }

    const step2 = App.$('#register-step-2');
    const step3 = App.$('#register-step-3');
    if (step2) step2.style.display = 'none';
    if (step3) step3.style.display = 'block';

    const passwordInput = App.$('#input-register-password');
    const passwordConfirmInput = App.$('#input-register-password-confirm');
    if (passwordInput) passwordInput.value = '';
    if (passwordConfirmInput) passwordConfirmInput.value = '';

    setTimeout(() => {
        if (passwordInput) passwordInput.focus();
    }, 100);

    showAuthMessage('msg-register-step3', 'Código verificado. Ahora crea tu contraseña.', false);
    return true;
}

// ✅ Función para reenviar código de verificación
async function resendVerificationCode() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en resendVerificationCode');
        return false;
    }
    const email = window.verifiedEmailForRegistration;

    if (!email) {
        showAuthMessage('msg-register-step2', 'Error: No hay correo verificado.', true);
        return false;
    }

    if (!App.checkRateLimitSimple('resend_code')) {
        return false;
    }

    showAuthMessage('msg-register-step2', 'Reenviando código…', false);

    try {
        const code = generateVerificationCode();
        await saveVerificationCode(email, code);
        await sendVerificationCode(email, code);

        const codeInput = App.$('#input-verification-code');
        if (codeInput) codeInput.value = '';

        showAuthMessage('msg-register-step2', 'Código reenviado. Revisa tu correo.', false);
    } catch (error) {
        console.error('[VERIFICATION] ❌ Error reenviando código:', error);
        showAuthMessage('msg-register-step2', 'Error al reenviar el código. Intenta nuevamente.', true);
    }
}

// ✅ Función para reset de contraseña
async function tryPasswordReset() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en tryPasswordReset');
        return false;
    }
    if (!App.checkRateLimitSimple('password_reset')) {
        return false;
    }

    const email = App.getSafeInputValue('#input-reset-email', 'email');

    if (!email || !email.includes('@')) {
        showAuthMessage('msg-reset', 'Por favor, ingresa un correo válido.', true);
        App.markFieldError('input-reset-email');
        return false;
    }

    App.clearFieldErrors();
    showAuthMessage('msg-reset', 'Enviando enlace de restablecimiento…', false);

    try {
        if (!window.firebaseAuth) {
            showAuthMessage('msg-reset', 'Firebase Authentication no está disponible. Por favor, espere unos segundos e intente nuevamente.', true);
            return false;
        }

        await window.firebaseAuth.sendPasswordResetEmail(email.toLowerCase().trim());
        showAuthMessage('msg-reset', '✅ Se ha enviado un enlace de restablecimiento a tu correo. Revisa tu bandeja de entrada (y spam).', false);

        setTimeout(() => {
            App.$('#input-reset-email').value = '';
        }, 3000);

        return true;
    } catch (error) {
        console.error('[AUTH] ❌ Error en reset:', error);
        let errorMessage = 'Error al enviar el enlace.';

        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No existe una cuenta con este correo.';
            App.markFieldError('input-reset-email');
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Correo electrónico inválido.';
            App.markFieldError('input-reset-email');
        } else {
            errorMessage = `Error: ${error.message || 'No se pudo enviar el enlace.'}`;
        }

        showAuthMessage('msg-reset', errorMessage, true);
        return false;
    }
}

// ✅ Función para manejar autenticación exitosa con email
async function handleSuccessfulAuthWithEmail(userEmail, allowedCourses) {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en handleSuccessfulAuthWithEmail');
        return;
    }
    App.log('[AUTH] ✅ Mostrando cursos permitidos para:', userEmail);

    const isAdmin = await App.checkIsAdmin(userEmail);
    if (isAdmin) {
        App.log('[AUTH] ✅ Usuario es administrador, otorgando acceso master');
        const MASTER_HASH_VAL = getMasterHash();
        App.setIsMasterAuthenticated(true);
        App.setCurrentKeyHex(MASTER_HASH_VAL);

        if (App.hasRemote()) {
            App.log('[SYNC] Iniciando refresh de todos los cursos en background...');
            const mergedMap = App.getMergedAccessHashMap();
            const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH_VAL);
            App.log('[SYNC] Total de cursos a refrescar:', hexes.length);

            Promise.allSettled(hexes.map(h => App.refreshFromRemoteSilent(h).catch(e => {
                App.warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
                return false;
            }))).then(() => {
                App.log('[SYNC] ✅ Refresh completado');
            });
        }

        try {
            await App.runLoader();
        } catch (e) { }

        App.clearAttempts();
        App.refreshCustomCourses().catch(e => {
            App.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
        });

        App.buildMasterGrid();
        App.setupMasterSearch();
        App.$('#year_master').textContent = new Date().getFullYear();
        App.showMaster();
        return;
    }

    window.allowedCoursesForUser = allowedCourses;

    if (App.hasRemote()) {
        App.log('[SYNC] Iniciando refresh de cursos permitidos en background...');
        Promise.allSettled(allowedCourses.map(h => App.refreshFromRemoteSilent(h).catch(e => {
            App.warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
            return false;
        }))).then(() => {
            App.log('[SYNC] ✅ Refresh completado');
        });
    }

    try {
        await App.runLoader();
    } catch (e) { }

    App.clearAttempts();
    App.refreshCustomCourses().catch(e => {
        App.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
    });

    App.buildUserGrid();
    App.$('#year_master').textContent = new Date().getFullYear();
    App.showUserView();
}

// ✅ Función para logout de Firebase
async function logoutFirebase() {
    try {
        if (window.firebaseAuth) {
            await window.firebaseAuth.signOut();
            App.log('[AUTH] ✅ Logout exitoso');
        }
        App.setIsMasterAuthenticated(false);
        App.setCurrentKeyHex(null);
    } catch (error) {
        console.error('[AUTH] ❌ Error en logout:', error);
    }
}

// ✅ Función compartida para manejar autenticación exitosa (código)
async function handleSuccessfulAuth(hex, method = 'code') {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible');
        return;
    }
    App.log('[AUTH] ✅ Autenticación exitosa por:', method);

    const MASTER_HASH_VAL = getMasterHash();
    if (hex === MASTER_HASH_VAL) {
        App.setIsMasterAuthenticated(true);
        App.setCurrentKeyHex(MASTER_HASH_VAL);

        if (App.hasRemote()) {
            App.log('[SYNC] Iniciando refresh de todos los cursos en background...');
            const mergedMap = App.getMergedAccessHashMap();
            const hexes = Object.keys(mergedMap).filter(h => h !== MASTER_HASH_VAL);
            App.log('[SYNC] Total de cursos a refrescar:', hexes.length);

            Promise.allSettled(hexes.map(h => App.refreshFromRemoteSilent(h).catch(e => {
                App.warn('[SYNC] Error refrescando', h.substring(0, 8), ':', e);
                return false;
            }))).then(() => {
                App.log('[SYNC] ✅ Refresh completado');
            });
        }

        try {
            await App.runLoader();
        } catch (e) { }

        App.clearAttempts();
        if (method === 'code') {
            const code = App.$('#code').value;
            if (code) App.setQueryParam('code', btoa(code));
        }

        App.refreshCustomCourses().catch(e => {
            App.warn('[MASTER] Error cargando cursos remotos (continuando):', e);
        });

        App.buildMasterGrid();
        App.setupMasterSearch();
        App.$('#year_master').textContent = new Date().getFullYear();
        App.showMaster();
    } else {
        App.showLoader();

        if (App.hasRemote()) {
            await App.refreshFromRemoteSilent(hex).catch(e => {
                App.warn('[SYNC] Error en refresh:', e);
            });
        }

        try {
            await App.runLoader();
        } catch (e) { }

        App.setCurrentKeyHex(hex);
        App.clearAttempts();
        if (method === 'code') {
            const code = App.$('#code').value;
            if (code) App.setQueryParam('code', btoa(code));
        }
        App.renderCourse(hex);
        App.showContent();
    }
}

// ✅ Listener para estado de autenticación persistente
function setupAuthStateListener() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en setupAuthStateListener');
        return;
    }
    if (!window.firebaseAuth) {
        App.log('[AUTH] Firebase Auth no disponible, omitiendo listener de estado');
        return;
    }

    window.firebaseAuth.onAuthStateChanged(async (user) => {
        App.log('[AUTH] 🔔 onAuthStateChanged disparado, usuario:', user?.email || 'null');

        if (user) {
            App.log('[AUTH] ✅ Usuario autenticado:', user.email);
            const userEmail = user.email.toLowerCase().trim();

            const urlParams = new URLSearchParams(window.location.search);
            const masterEl = document.getElementById('master');
            const userViewEl = document.getElementById('user-view');
            const contentEl = document.getElementById('content');
            const accessEl = document.getElementById('access');
            const MASTER_HASH_VAL = getMasterHash();
            const isInMaster = App.getCurrentKeyHex() === MASTER_HASH_VAL || (masterEl && !masterEl.classList.contains('hidden'));
            const isInUserView = userViewEl && !userViewEl.classList.contains('hidden');
            const isInContent = contentEl && !contentEl.classList.contains('hidden');
            const isInAccess = accessEl && !accessEl.classList.contains('hidden');

            if (isInUserView && !isInMaster) {
                App.log('[AUTH] 🔍 Verificando acceso del usuario en vista de usuario...');
                const allowedCourses = await App.getCoursesForEmail(userEmail);

                if (allowedCourses.length === 0) {
                    App.log('[AUTH] ⚠️ Usuario perdió acceso a todos los cursos, cerrando sesión...');
                    window.currentUserEmail = null;
                    window.allowedCoursesForUser = null;
                    await logoutFirebase();
                    App.setCurrentKeyHex(null);
                    App.setQueryParam('code', null);
                    App.showAccess();
                    showAuthMessage('msg-auth', 'Tu acceso a los cursos ha sido revocado. Contacta al administrador para solicitar acceso nuevamente.', true);
                    return;
                }
            }

            if (!urlParams.has('code') && !isInMaster && !isInUserView && !isInContent) {
                App.log('[AUTH] 🔍 Verificando cursos para usuario con email...');
                const allowedCourses = await App.getCoursesForEmail(userEmail);
                App.log('[AUTH] 📚 Cursos encontrados en listener:', allowedCourses.length);

                if (allowedCourses.length > 0) {
                    App.log('[AUTH] ✅ Mostrando vista de usuario desde listener');
                    window.currentUserEmail = userEmail;
                    window.allowedCoursesForUser = allowedCourses;

                    if (isInAccess && accessEl) {
                        accessEl.classList.add('hidden');
                    }

                    await handleSuccessfulAuthWithEmail(userEmail, allowedCourses);
                }
            }
        } else {
            App.log('[AUTH] Usuario no autenticado');
            window.currentUserEmail = null;
            window.allowedCoursesForUser = null;
            const MASTER_HASH_VAL = getMasterHash();
            if (App.getCurrentKeyHex() === MASTER_HASH_VAL || (document.getElementById('user-view') && !document.getElementById('user-view').classList.contains('hidden'))) {
                App.setCurrentKeyHex(null);
                App.setQueryParam('code', null);
                App.showAccess();
            }
        }
    });
}

// ✅ Inicializar listener de estado cuando Firebase esté listo
window.addEventListener('firebaseReady', () => {
    setupAuthStateListener();
});

// ✅ Exponer funciones públicamente
window.Auth = {
    tryLoginByCode: tryLoginByCode,
    tryLoginByEmail: tryLoginByEmail,
    verifyEmailForRegistration: verifyEmailForRegistration,
    tryRegister: tryRegister,
    verifyCodeForRegistration: verifyCodeForRegistration,
    resendVerificationCode: resendVerificationCode,
    tryPasswordReset: tryPasswordReset,
    logoutFirebase: logoutFirebase,
    handleSuccessfulAuth: handleSuccessfulAuth,
    handleSuccessfulAuthWithEmail: handleSuccessfulAuthWithEmail,
    setupAuthStateListener: setupAuthStateListener,
    switchAuthTab: switchAuthTab,
    showLoginForm: showLoginForm,
    showAuthMessage: showAuthMessage,
    setupEmailPasswordListeners: setupEmailPasswordListeners,
    setupAuthTabListeners: setupAuthTabListeners
};

// ✅ Función para configurar event listeners de código de acceso
function setupCodeLoginListeners() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en setupCodeLoginListeners');
        return;
    }

    const btnEnter = App.$('#btn-enter');
    const codeInput = App.$('#code');

    if (btnEnter) {
        btnEnter.addEventListener('click', () => {
            const code = codeInput ? codeInput.value : '';
            tryLoginByCode(code);
        });
    }

    if (codeInput) {
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnEnter) {
                    btnEnter.click();
                }
            }
        });
    }
}

// ✅ Función para configurar event listeners de autenticación email/password
function setupEmailPasswordListeners() {
    const App = getApp();
    if (!App) {
        console.error('[AUTH] App no disponible en setupEmailPasswordListeners');
        return;
    }

    App.log('[AUTH] 🔧 Configurando event listeners de autenticación...');

    // Event listeners para autenticación email/password
    const btnLogin = App.$('#btn-login');
    if (btnLogin) {
        App.log('[AUTH] ✅ Botón login encontrado');
        btnLogin.addEventListener('click', () => {
            App.log('[AUTH] 🖱️ Click en botón login');
            tryLoginByEmail();
        });
    } else {
        App.warn('[AUTH] ⚠️ Botón login no encontrado');
    }

    // Enter en campos de login
    const inputEmail = App.$('#input-email');
    const inputPassword = App.$('#input-password');
    if (inputEmail) {
        inputEmail.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (inputPassword) inputPassword.focus();
            }
        });
    }
    if (inputPassword) {
        inputPassword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnLogin) btnLogin.click();
            }
        });
    }

    // ✅ Event listener para verificar correo antes de registrar
    const btnVerifyEmail = App.$('#btn-verify-email');
    if (btnVerifyEmail) {
        btnVerifyEmail.addEventListener('click', async () => {
            await verifyEmailForRegistration();
        });
    }

    // Enter en campo de correo para verificar
    const inputRegisterEmail = App.$('#input-register-email');
    if (inputRegisterEmail) {
        inputRegisterEmail.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await verifyEmailForRegistration();
            }
        });
    }

    // ✅ Event listener para verificar código
    const btnVerifyCode = App.$('#btn-verify-code');
    if (btnVerifyCode) {
        btnVerifyCode.addEventListener('click', async () => {
            await verifyCodeForRegistration();
        });
    }

    // ✅ Event listener para reenviar código
    const btnResendCode = App.$('#btn-resend-code');
    if (btnResendCode) {
        btnResendCode.addEventListener('click', async () => {
            await resendVerificationCode();
        });
    }

    // ✅ Enter en campo de código para verificar
    const inputVerificationCode = App.$('#input-verification-code');
    if (inputVerificationCode) {
        inputVerificationCode.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await verifyCodeForRegistration();
            }
        });

        // Solo permitir números
        inputVerificationCode.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    // ✅ Event listener para volver del paso 2 al paso 1
    const btnBackToEmail = App.$('#btn-back-to-email');
    if (btnBackToEmail) {
        btnBackToEmail.addEventListener('click', () => {
            const step1 = App.$('#register-step-1');
            const step2 = App.$('#register-step-2');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';

            window.verifiedEmailForRegistration = null;
            window.verifiedCoursesForRegistration = null;
            window.verifiedIsAdmin = null;

            showAuthMessage('msg-register', '', false);
            showAuthMessage('msg-register-step2', '', false);
            App.clearFieldErrors();
        });
    }

    // Enter en campos de contraseña para crear cuenta
    const inputRegisterPassword = App.$('#input-register-password');
    const inputRegisterPasswordConfirm = App.$('#input-register-password-confirm');
    if (inputRegisterPassword) {
        inputRegisterPassword.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (inputRegisterPasswordConfirm) inputRegisterPasswordConfirm.focus();
            }
        });
    }
    if (inputRegisterPasswordConfirm) {
        inputRegisterPasswordConfirm.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await tryRegister();
            }
        });
    }

    // Registro (paso 3)
    const btnRegister = App.$('#btn-register');
    if (btnRegister) {
        btnRegister.addEventListener('click', () => {
            tryRegister();
        });
    }

    // ✅ Event listener para volver del paso 3 al paso 2
    const btnBackToVerify = App.$('#btn-back-to-verify');
    if (btnBackToVerify) {
        btnBackToVerify.addEventListener('click', () => {
            const step2 = App.$('#register-step-2');
            const step3 = App.$('#register-step-3');
            if (step2) step2.style.display = 'block';
            if (step3) step3.style.display = 'none';

            // Limpiar campos de contraseña
            const passwordInput = App.$('#input-register-password');
            const passwordConfirmInput = App.$('#input-register-password-confirm');
            if (passwordInput) passwordInput.value = '';
            if (passwordConfirmInput) passwordConfirmInput.value = '';

            // Limpiar mensajes
            showAuthMessage('msg-register-step3', '', false);
            App.clearFieldErrors();
        });
    }

    // Reset password
    const btnReset = App.$('#btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            tryPasswordReset();
        });
    }

    // Navegación entre formularios
    const btnShowRegister = App.$('#btn-show-register');
    const btnShowLogin = App.$('#btn-show-login');
    const btnShowReset = App.$('#btn-show-reset');
    const btnBackToLogin = App.$('#btn-back-to-login');

    if (btnShowRegister) {
        btnShowRegister.addEventListener('click', () => {
            App.$('#form-login').classList.add('hidden');
            App.$('#form-register').classList.remove('hidden');
            App.$('#form-reset').classList.add('hidden');

            // Resetear formulario de registro al paso 1
            const step1 = App.$('#register-step-1');
            const step2 = App.$('#register-step-2');
            const step3 = App.$('#register-step-3');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';
            if (step3) step3.style.display = 'none';
            window.verifiedEmailForRegistration = null;
            window.verifiedCoursesForRegistration = null;
            window.verifiedIsAdmin = null;
            showAuthMessage('msg-register', '', false);
            showAuthMessage('msg-register-step2', '', false);
            App.clearFieldErrors();
        });
    }

    if (btnShowLogin) {
        btnShowLogin.addEventListener('click', () => {
            App.$('#form-register').classList.add('hidden');
            App.$('#form-reset').classList.add('hidden');
            App.$('#form-login').classList.remove('hidden');

            // Resetear formulario de registro al paso 1
            const step1 = App.$('#register-step-1');
            const step2 = App.$('#register-step-2');
            const step3 = App.$('#register-step-3');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';
            if (step3) step3.style.display = 'none';
            window.verifiedEmailForRegistration = null;
            window.verifiedCoursesForRegistration = null;
            window.verifiedIsAdmin = null;
            showAuthMessage('msg-register', '', false);
            showAuthMessage('msg-register-step2', '', false);
            App.clearFieldErrors();
        });
    }

    if (btnShowReset) {
        btnShowReset.addEventListener('click', () => {
            App.$('#form-login').classList.add('hidden');
            App.$('#form-register').classList.add('hidden');
            App.$('#form-reset').classList.remove('hidden');
            App.clearFieldErrors();
        });
    }

    if (btnBackToLogin) {
        btnBackToLogin.addEventListener('click', () => {
            App.$('#form-reset').classList.add('hidden');
            App.$('#form-register').classList.add('hidden');
            App.$('#form-login').classList.remove('hidden');
            App.clearFieldErrors();
        });
    }
}

// ✅ Event listeners para pestañas de autenticación
function setupAuthTabListeners() {
    const App = getApp();
    if (!App) return;

    const tabCode = App.$('#tab-code');
    const tabAccount = App.$('#tab-account');
    if (tabCode) {
        tabCode.addEventListener('click', () => switchAuthTab('code'));
    }
    if (tabAccount) {
        tabAccount.addEventListener('click', () => switchAuthTab('account'));
    }
}

// ✅ Configurar event listeners cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupCodeLoginListeners();
        setupEmailPasswordListeners();
        setupAuthTabListeners();
    });
} else {
    // DOM ya está listo
    setupCodeLoginListeners();
    setupEmailPasswordListeners();
    setupAuthTabListeners();
}

// ✅ Disparar evento personalizado para indicar que Auth está listo
window.dispatchEvent(new CustomEvent('authReady'));
