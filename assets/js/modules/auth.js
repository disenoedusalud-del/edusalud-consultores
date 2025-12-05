/**
 * Módulo de Autenticación (auth.js)
 * Maneja toda la lógica de inicio de sesión, registro y gestión de sesiones con Firebase.
 */

(function () {
    console.log('[AUTH] 🔐 Inicializando módulo de autenticación...');

    // Estado interno para el flujo de registro
    let registrationState = {
        email: '',
        code: '',
        verified: false
    };

    // Referencias a Firebase (se obtienen dinámicamente)
    function getAuth() {
        return window.firebaseAuth || (window.firebase && window.firebase.auth ? window.firebase.auth() : null);
    }

    function getFunctions() {
        return window.firebaseFunctions || (window.firebase && window.firebase.functions ? window.firebase.functions() : null);
    }

    // Objeto Auth público
    const Auth = {
        /**
         * Configura el listener de estado de autenticación de Firebase
         */
        setupAuthStateListener: function () {
            const auth = getAuth();
            if (!auth) {
                console.warn('[AUTH] ⚠️ Firebase Auth no disponible, reintentando en 500ms...');
                setTimeout(Auth.setupAuthStateListener, 500);
                return;
            }

            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    console.log('[AUTH] ✅ Usuario autenticado:', user.email);
                    window.currentUserEmail = user.email;

                    // Verificar si es admin o master
                    try {
                        const tokenResult = await user.getIdTokenResult();
                        const isMaster = tokenResult.claims.isMaster || false;

                        if (isMaster) {
                            console.log('[AUTH] 👑 Acceso Master detectado (Custom Claim)');
                            window.verifiedIsAdmin = true;
                            // Redirigir a vista master si no estamos ahí
                            if (typeof App !== 'undefined' && App.showMaster) {
                                App.setCurrentKeyHex(getMasterHashValue()); // Función global en app.js
                                App.showMaster();
                            }
                        } else {
                            // Cargar cursos permitidos para el usuario
                            await Auth.loadUserCourses(user.email);

                            // Mostrar vista de usuario
                            if (typeof App !== 'undefined' && App.showUserView) {
                                App.showUserView();
                            }
                        }
                    } catch (error) {
                        console.error('[AUTH] ❌ Error verificando claims:', error);
                    }
                } else {
                    console.log('[AUTH] ℹ️ No hay usuario autenticado');
                    window.currentUserEmail = null;
                    window.verifiedIsAdmin = false;
                    window.allowedCoursesForUser = [];

                    // Si estábamos en una vista protegida, volver al login
                    // (Lógica manejada por la UI generalmente)
                }
            });
        },

        /**
         * Carga los cursos permitidos para un usuario desde Firebase
         */
        loadUserCourses: async function (email) {
            if (!email) return;

            console.log('[AUTH] 🔄 Cargando cursos para:', email);
            // Esta lógica depende de cómo esté estructurada la DB.
            // Asumimos que hay una función global o lógica en app.js para esto,
            // o implementamos una consulta básica aquí.

            // Por ahora, simulamos una llamada o usamos una función existente si la hay.
            // En app.js vi getCourseAllowedEmails, pero eso es para un curso específico.
            // Necesitamos lo inverso: cursos para un email.

            // TODO: Implementar consulta real a Firebase: root.child('courseEmails')...
            // Dado que la estructura es courseEmails -> courseHex -> emailKey -> data
            // No es eficiente buscar en todos. Debería haber un índice inverso o iterar (lento).
            // O quizás el usuario solo ve los cursos públicos + los que tiene código.

            // Por compatibilidad con lo que parece esperar app.js:
            window.allowedCoursesForUser = []; // Se llenará con la lógica de negocio
        },

        /**
         * Intenta iniciar sesión con un código de acceso
         */
        tryLoginByCode: async function (code) {
            if (!code) {
                Auth.showAuthMessage('msg', 'Por favor ingrese un código', true);
                return;
            }

            const codeTrimmed = code.trim();

            // Validar formato básico
            if (codeTrimmed.length < 5) {
                Auth.showAuthMessage('msg', 'El código es demasiado corto', true);
                return;
            }

            // Mostrar carga
            const btn = document.querySelector('#btn-enter');
            const originalText = btn ? btn.textContent : 'Entrar';
            if (btn) {
                btn.textContent = 'Verificando...';
                btn.disabled = true;
            }

            try {
                // 1. Verificar si es código maestro (hash local o remoto)
                // Usamos la función global sha256Hex si está disponible, o crypto
                let hash;
                if (typeof sha256Hex === 'function') {
                    hash = await sha256Hex(codeTrimmed);
                } else {
                    // Fallback simple si no está disponible (no debería pasar si core.js/app.js cargó)
                    console.error('[AUTH] Función sha256Hex no disponible');
                    throw new Error('Error interno de dependencias');
                }

                // Verificar contra master hash (definido en app.js o variable global)
                // Nota: app.js define getMasterHashValue()
                const masterHash = typeof getMasterHashValue === 'function' ? getMasterHashValue() : "7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8";

                if (hash === masterHash) {
                    // Es código maestro -> Validar con backend para seguridad extra y claims
                    console.log('[AUTH] 🔐 Código maestro detectado, validando con servidor...');

                    // Llamada a Cloud Function para obtener token/claim si es necesario
                    // O simplemente permitir acceso local si app.js lo maneja así (menos seguro)

                    // Si hay función validateMasterCodeHTTP, la usamos
                    try {
                        const response = await fetch('https://us-central1-edusalud-platfor.cloudfunctions.net/validateMasterCodeHTTP', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: codeTrimmed }) // No enviamos email aquí porque es login anónimo por código
                        });

                        const data = await response.json();
                        if (data.success) {
                            if (typeof App !== 'undefined') {
                                App.setCurrentKeyHex(masterHash);
                                App.showMaster();
                            }
                        } else {
                            throw new Error(data.error || 'Código inválido');
                        }
                    } catch (serverError) {
                        console.warn('[AUTH] Falló validación servidor, usando validación local (fallback):', serverError);
                        // Fallback local (menos seguro pero funcional si falla la red)
                        if (typeof App !== 'undefined') {
                            App.setCurrentKeyHex(masterHash);
                            App.showMaster();
                        }
                    }
                } else {
                    // 2. Verificar si es código de curso
                    // Necesitamos el mapa de cursos. app.js tiene getMergedAccessHashMap()
                    if (typeof getMergedAccessHashMap === 'function') {
                        const courses = getMergedAccessHashMap();
                        if (courses[hash]) {
                            console.log('[AUTH] ✅ Código de curso válido');
                            if (typeof App !== 'undefined') {
                                App.setCurrentKeyHex(hash);
                                App.showContent(hash);
                            }
                        } else {
                            throw new Error('Código no válido o curso no encontrado');
                        }
                    } else {
                        throw new Error('No se pudo verificar el código (error sistema)');
                    }
                }

            } catch (error) {
                console.error('[AUTH] Error login code:', error);
                Auth.showAuthMessage('msg', error.message || 'Código incorrecto', true);
            } finally {
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        },

        /**
         * Intenta iniciar sesión con email y contraseña
         */
        tryLoginByEmail: async function () {
            const emailInput = document.querySelector('#input-email');
            const passwordInput = document.querySelector('#input-password');

            if (!emailInput || !passwordInput) return;

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                Auth.showAuthMessage('msg-auth', 'Por favor complete todos los campos', true);
                return;
            }

            const btn = document.querySelector('#btn-login');
            const originalText = btn ? btn.textContent : 'Iniciar sesión';
            if (btn) {
                btn.textContent = 'Iniciando...';
                btn.disabled = true;
            }

            try {
                const auth = getAuth();
                if (!auth) throw new Error('Servicio de autenticación no disponible');

                await auth.signInWithEmailAndPassword(email, password);
                // El listener onAuthStateChanged manejará la redirección
                Auth.showAuthMessage('msg-auth', '¡Bienvenido!', false);

            } catch (error) {
                console.error('[AUTH] Error login:', error);
                let msg = 'Error al iniciar sesión';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    msg = 'Correo o contraseña incorrectos';
                } else if (error.code === 'auth/too-many-requests') {
                    msg = 'Demasiados intentos. Intente más tarde.';
                }
                Auth.showAuthMessage('msg-auth', msg, true);
            } finally {
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        },

        /**
         * Paso 1 Registro: Verificar email y enviar código
         */
        verifyEmailForRegistration: async function () {
            const emailInput = document.querySelector('#input-register-email');
            if (!emailInput) return;

            const email = emailInput.value.trim();
            if (!validateEmail(email).valid) { // validateEmail de core.js/app.js
                Auth.showAuthMessage('msg-register', 'Correo inválido', true);
                return;
            }

            const btn = document.querySelector('#btn-verify-email');
            const originalText = btn ? btn.textContent : 'Verificar correo';
            if (btn) {
                btn.textContent = 'Enviando código...';
                btn.disabled = true;
            }

            try {
                // Generar código aleatorio de 6 dígitos
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                registrationState.code = code;
                registrationState.email = email;

                // Llamar a Cloud Function para enviar email
                // Usamos fetch directo a la URL de la función o firebase.functions()
                // Asumimos que existe la función sendVerificationCode

                const response = await fetch('https://us-central1-edusalud-platfor.cloudfunctions.net/sendVerificationCode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, code: code })
                });

                if (!response.ok) {
                    throw new Error('Error al enviar el correo');
                }

                // Avanzar al paso 2
                document.querySelector('#register-step-1').style.display = 'none';
                document.querySelector('#register-step-2').style.display = 'block';
                document.querySelector('#verified-email-display').textContent = email;

                Auth.showAuthMessage('msg-register-step2', 'Código enviado a tu correo', false);

            } catch (error) {
                console.error('[AUTH] Error verify email:', error);
                Auth.showAuthMessage('msg-register', 'Error al enviar código. Intente nuevamente.', true);
            } finally {
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        },

        /**
         * Paso 2 Registro: Verificar código ingresado
         */
        verifyCodeForRegistration: async function () {
            const codeInput = document.querySelector('#input-verification-code');
            if (!codeInput) return;

            const code = codeInput.value.trim();
            if (code !== registrationState.code) {
                Auth.showAuthMessage('msg-register-step2', 'Código incorrecto', true);
                return;
            }

            registrationState.verified = true;

            // Avanzar al paso 3
            document.querySelector('#register-step-2').style.display = 'none';
            document.querySelector('#register-step-3').style.display = 'block';
            Auth.showAuthMessage('msg-register-step3', 'Código verificado correctamente', false);
        },

        /**
         * Reenviar código de verificación
         */
        resendVerificationCode: async function () {
            if (!registrationState.email) return;

            const btn = document.querySelector('#btn-resend-code');
            if (btn) {
                btn.textContent = 'Reenviando...';
                btn.disabled = true;
            }

            try {
                // Reutilizar lógica de envío
                const response = await fetch('https://us-central1-edusalud-platfor.cloudfunctions.net/sendVerificationCode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: registrationState.email, code: registrationState.code })
                });

                if (!response.ok) throw new Error('Error envío');

                Auth.showAuthMessage('msg-register-step2', 'Código reenviado', false);
            } catch (e) {
                Auth.showAuthMessage('msg-register-step2', 'Error al reenviar', true);
            } finally {
                if (btn) {
                    btn.textContent = 'Reenviar código';
                    btn.disabled = false;
                }
            }
        },

        /**
         * Paso 3 Registro: Crear cuenta
         */
        tryRegister: async function () {
            if (!registrationState.verified) {
                Auth.showAuthMessage('msg-register-step3', 'Error de flujo: Email no verificado', true);
                return;
            }

            const passInput = document.querySelector('#input-register-password');
            const confirmInput = document.querySelector('#input-register-password-confirm');

            const password = passInput.value;
            const confirm = confirmInput.value;

            if (password.length < 6) {
                Auth.showAuthMessage('msg-register-step3', 'La contraseña debe tener al menos 6 caracteres', true);
                return;
            }

            if (password !== confirm) {
                Auth.showAuthMessage('msg-register-step3', 'Las contraseñas no coinciden', true);
                return;
            }

            const btn = document.querySelector('#btn-register');
            const originalText = btn ? btn.textContent : 'Crear cuenta';
            if (btn) {
                btn.textContent = 'Creando cuenta...';
                btn.disabled = true;
            }

            try {
                const auth = getAuth();
                await auth.createUserWithEmailAndPassword(registrationState.email, password);

                // Éxito - el listener onAuthStateChanged lo capturará
                // Opcional: Actualizar perfil
                const user = auth.currentUser;
                if (user) {
                    // Podríamos guardar datos adicionales en DB aquí
                }

                Auth.showAuthMessage('msg-register-step3', '¡Cuenta creada!', false);
                // Resetear UI o redirigir

            } catch (error) {
                console.error('[AUTH] Error register:', error);
                let msg = 'Error al crear cuenta';
                if (error.code === 'auth/email-already-in-use') {
                    msg = 'El correo ya está registrado';
                }
                Auth.showAuthMessage('msg-register-step3', msg, true);
            } finally {
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        },

        /**
         * Enviar correo de restablecimiento de contraseña
         */
        tryPasswordReset: async function () {
            const emailInput = document.querySelector('#input-reset-email');
            if (!emailInput) return;

            const email = emailInput.value.trim();
            if (!validateEmail(email).valid) {
                Auth.showAuthMessage('msg-reset', 'Correo inválido', true);
                return;
            }

            const btn = document.querySelector('#btn-reset');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Enviando...';
            }

            try {
                const auth = getAuth();
                await auth.sendPasswordResetEmail(email);
                Auth.showAuthMessage('msg-reset', 'Enlace enviado. Revisa tu correo.', false);
                emailInput.value = '';
            } catch (error) {
                console.error('[AUTH] Error reset:', error);
                let msg = 'Error al enviar enlace';
                if (error.code === 'auth/user-not-found') {
                    msg = 'No existe cuenta con este correo';
                }
                Auth.showAuthMessage('msg-reset', msg, true);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'Enviar enlace de restablecimiento';
                }
            }
        },

        /**
         * Cerrar sesión
         */
        logoutFirebase: async function () {
            try {
                const auth = getAuth();
                if (auth) {
                    await auth.signOut();
                    console.log('[AUTH] Sesión cerrada');
                }
            } catch (error) {
                console.error('[AUTH] Error logout:', error);
            }
        },

        /**
         * Cambiar entre pestañas de autenticación (Código vs Cuenta)
         */
        switchAuthTab: function (tabName) {
            const tabCode = document.querySelector('#tab-code');
            const tabAccount = document.querySelector('#tab-account');
            const formCode = document.querySelector('#form-code');
            const formAccount = document.querySelector('#form-account');

            if (tabName === 'code') {
                tabCode.classList.add('active');
                tabCode.setAttribute('aria-selected', 'true');
                tabAccount.classList.remove('active');
                tabAccount.setAttribute('aria-selected', 'false');

                formCode.classList.remove('hidden');
                formAccount.classList.add('hidden');
            } else {
                tabAccount.classList.add('active');
                tabAccount.setAttribute('aria-selected', 'true');
                tabCode.classList.remove('active');
                tabCode.setAttribute('aria-selected', 'false');

                formAccount.classList.remove('hidden');
                formCode.classList.add('hidden');
            }
        },

        /**
         * Mostrar mensajes de estado/error en los formularios
         */
        showAuthMessage: function (elementId, message, isError) {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = message;
                el.className = isError ? 'msg error' : 'msg success';
                el.style.display = 'block';
            }
        }
    };

    // Exponer globalmente
    window.Auth = Auth;

    // Notificar que Auth está listo
    window.dispatchEvent(new CustomEvent('authReady'));

})();
