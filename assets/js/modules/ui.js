/* ===================== SKELETON SCREENS Y LAZY LOADING ===================== */

/**
 * ✅ Crea un skeleton screen para una tarjeta de curso
 */
function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'skeleton-master-card';
    card.innerHTML = `
    <div class="skeleton skeleton-image"></div>
    <div class="skeleton skeleton-title"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text-short"></div>
  `;
    return card;
}

/**
 * ✅ Crea un skeleton screen para un archivo
 */
function createSkeletonFile() {
    const file = document.createElement('div');
    file.className = 'skeleton-file';
    file.innerHTML = `
    <div class="skeleton skeleton-file-icon"></div>
    <div class="skeleton-file-content">
      <div class="skeleton skeleton-file-title"></div>
      <div class="skeleton skeleton-file-meta"></div>
    </div>
  `;
    return file;
}

/**
 * ✅ Muestra skeleton screens en el grid maestro
 * @param {HTMLElement} grid - Contenedor del grid
 * @param {number} count - Número de skeletons a mostrar
 */
function showMasterSkeletons(grid, count = 6) {
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        grid.appendChild(createSkeletonCard());
    }
}

/**
 * ✅ Muestra skeleton screens en la lista de archivos
 * @param {HTMLElement} filelist - Contenedor de archivos
 * @param {number} count - Número de skeletons a mostrar
 */
function showFilesSkeletons(filelist, count = 3) {
    if (!filelist) return;
    filelist.innerHTML = '';
    for (let i = 0; i < count; i++) {
        filelist.appendChild(createSkeletonFile());
    }
}

/**
 * ✅ Lazy loading para imágenes
 * @param {HTMLImageElement} img - Elemento imagen
 */
function setupLazyImage(img) {
    if (!img || !('loading' in HTMLImageElement.prototype)) {
        return; // Navegador no soporta lazy loading nativo
    }

    img.loading = 'lazy';

    // Agregar clase cuando la imagen carga
    if (img.complete) {
        img.classList.add('loaded');
    } else {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
        img.addEventListener('error', () => {
            img.classList.add('loaded'); // Mostrar aunque haya error
        });
    }
}

/**
 * ✅ Aplicar lazy loading a todas las imágenes de un contenedor
 * @param {HTMLElement} container - Contenedor con imágenes
 */
function setupLazyImages(container) {
    if (!container) return;
    const images = container.querySelectorAll('img:not([loading])');
    images.forEach(img => setupLazyImage(img));
}

/**
 * ✅ Mostrar overlay de carga
 * @param {string} message - Mensaje a mostrar
 */
function showLoadingOverlay(message = 'Cargando...') {
    // Remover overlay existente si hay
    const existing = document.getElementById('loading-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
    <div class="loading-overlay-content">
      <div class="loading-spinner"></div>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
    document.body.appendChild(overlay);
}

/**
 * ✅ Ocultar overlay de carga
 */
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    }
}

/* ===================== NOTIFICACIONES TOAST ===================== */

/**
 * ✅ Sistema de notificaciones toast
 */
function showToast(type, title, message, duration = 3000) {
    // Crear contenedor si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
        document.body.appendChild(toastContainer);
    }

    // Crear toast
    const toast = document.createElement('div');
    toast.style.cssText = `
    background: var(--bg);
    border: 1px solid rgba(90,169,255,0.3);
    border-left: 4px solid ${getToastColor(type)};
    border-radius: 8px;
    padding: 14px 18px;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    pointer-events: auto;
    animation: slideInRight 0.3s ease-out;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  `;

    // Icono
    const icon = document.createElement('div');
    icon.innerHTML = getToastIcon(type);
    icon.style.cssText = `
    font-size: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

    // Contenido
    const content = document.createElement('div');
    content.style.cssText = `flex: 1;`;

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = `
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    margin-bottom: 4px;
  `;

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
    font-size: 13px;
    color: var(--muted);
    line-height: 1.4;
  `;

    content.appendChild(titleEl);
    content.appendChild(messageEl);

    // Botón cerrar
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
    background: none;
    border: none;
    color: var(--muted);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.2s;
  `;
    closeBtn.addEventListener('click', () => removeToast(toast));
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.color = 'var(--text)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.color = 'var(--muted)';
    });

    toast.appendChild(icon);
    toast.appendChild(content);
    toast.appendChild(closeBtn);
    toastContainer.appendChild(toast);

    // Auto-remover después de duration
    setTimeout(() => removeToast(toast), duration);

    // Agregar animación CSS si no existe
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
        document.head.appendChild(style);
    }
}

function getToastColor(type) {
    const colors = {
        success: '#4ade80',
        error: '#ff5555',
        warning: '#fbbf24',
        info: '#5aa9ff'
    };
    return colors[type] || colors.info;
}

function getToastIcon(type) {
    const icons = {
        success: '<i class="ph ph-check-circle" style="font-size: 20px;"></i>',
        error: '<i class="ph ph-x-circle" style="font-size: 20px;"></i>',
        warning: '<i class="ph ph-warning-circle" style="font-size: 20px;"></i>',
        info: '<i class="ph ph-info" style="font-size: 20px;"></i>'
    };
    return icons[type] || icons.info;
}

function removeToast(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 300);
}

// ✅ Sistema de Notificaciones Persistente
const NOTIFICATIONS_STORAGE_KEY = 'edusalud_notifications';
const MAX_NOTIFICATIONS = 50;

function saveNotification(type, title, message, action = null) {
    try {
        const notifications = getNotifications();
        const notification = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type,
            title,
            message,
            action,
            timestamp: Date.now(),
            read: false
        };

        notifications.unshift(notification);
        const limited = notifications.slice(0, MAX_NOTIFICATIONS);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(limited));

        // Actualizar badge
        updateNotificationsBadge();

        return notification;
    } catch (e) {
        warn('[NOTIFICATIONS] Error guardando notificación:', e);
        return null;
    }
}

function getNotifications() {
    try {
        const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        warn('[NOTIFICATIONS] Error obteniendo notificaciones:', e);
        return [];
    }
}

function markNotificationAsRead(id) {
    try {
        const notifications = getNotifications();
        const index = notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            notifications[index].read = true;
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
            updateNotificationsBadge();
        }
    } catch (e) {
        warn('[NOTIFICATIONS] Error marcando notificación como leída:', e);
    }
}

function updateNotificationsBadge() {
    const badge = $('#notifications-badge');
    if (badge) {
        const notifications = getNotifications();
        const unread = notifications.filter(n => !n.read).length;
        if (unread > 0) {
            badge.textContent = unread > 99 ? '99+' : unread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ✅ Mejorar showToast para guardar notificaciones importantes
const originalShowToast = showToast;
window.showToast = function (type, title, message, duration = 3000, saveToHistory = false) {
    // Mostrar toast normal
    originalShowToast(type, title, message, duration);

    // Guardar notificaciones importantes
    if (saveToHistory || type === 'error' || type === 'warning') {
        saveNotification(type, title, message);
    }
};

// ✅ Configurar panel de notificaciones - VERSIÓN ULTRA SIMPLIFICADA
function setupNotificationsPanel() {
    console.log('[NOTIFICATIONS] 🔄 Iniciando configuración...');

    const btnNotifications = document.getElementById('btn-notifications');
    const panel = document.getElementById('notificationsPanel');

    // ✅ Si el botón o panel no existen, simplemente retornar sin intentar de nuevo
    if (!btnNotifications || !panel) {
        console.log('[NOTIFICATIONS] ℹ️ Botón o panel no encontrado, omitiendo configuración');
        return; // ✅ NO hacer setTimeout, simplemente retornar
    }

    console.log('[NOTIFICATIONS] ✅ Elementos encontrados');

    // ✅ REMOVER TODOS LOS LISTENERS ANTERIORES - Clonar el botón
    const newBtn = btnNotifications.cloneNode(true);
    btnNotifications.parentNode.replaceChild(newBtn, btnNotifications);
    const btn = document.getElementById('btn-notifications');
    const panelEl = document.getElementById('notificationsPanel');

    let isOpen = false;
    let escapeHandler = null;

    // ✅ Click handler ULTRA SIMPLE
    btn.onclick = function (e) {
        console.log('[NOTIFICATIONS] 🖱️ CLICK DETECTADO!');
        e.preventDefault();
        e.stopPropagation();

        isOpen = !isOpen;

        if (isOpen) {
            console.log('[NOTIFICATIONS] ➕ Abriendo panel...');
            panelEl.classList.add('show'); // ✅ Agregar clase .show para activar animación CSS
            panelEl.style.display = 'flex';
            panelEl.style.visibility = 'visible';
            panelEl.style.opacity = '1';
            panelEl.style.zIndex = '10000';
            btn.setAttribute('aria-expanded', 'true');

            // ✅ Verificar que el panel se abrió
            setTimeout(() => {
                const computedStyle = window.getComputedStyle(panelEl);
                console.log('[NOTIFICATIONS] 📊 Estado del panel:', {
                    display: computedStyle.display,
                    visibility: computedStyle.visibility,
                    opacity: computedStyle.opacity,
                    zIndex: computedStyle.zIndex,
                    width: computedStyle.width,
                    height: computedStyle.height
                });
            }, 50);

            // Mostrar vacío primero
            const list = document.getElementById('notifications-list');
            const empty = document.getElementById('notifications-empty');
            if (list && empty) {
                list.style.display = 'none';
                empty.style.display = 'block';
            }

            const activityList = document.getElementById('activity-list');
            const activityEmpty = document.getElementById('activity-empty');
            if (activityList && activityEmpty) {
                activityList.style.display = 'none';
                activityEmpty.style.display = 'block';
            }

            // Renderizar después (MUY ASÍNCRONO para no bloquear)
            console.log('[NOTIFICATIONS] ⏳ Programando renderizado asíncrono...');

            // ✅ Renderizar notificaciones primero (más rápido)
            requestAnimationFrame(() => {
                setTimeout(() => {
                    try {
                        console.log('[NOTIFICATIONS] 🎨 Renderizando notificaciones...');
                        if (typeof renderNotifications === 'function') {
                            renderNotifications();
                            console.log('[NOTIFICATIONS] ✅ Notificaciones renderizadas');
                        }
                    } catch (e) {
                        console.error('[NOTIFICATIONS] ❌ Error renderizando notificaciones:', e);
                    }
                }, 50);
            });

            // ✅ Renderizar actividad después (más pesado)
            requestAnimationFrame(() => {
                setTimeout(() => {
                    try {
                        console.log('[ACTIVITY] 🎨 Renderizando actividad...');
                        if (typeof renderActivity === 'function') {
                            renderActivity();
                            console.log('[ACTIVITY] ✅ Actividad renderizada');
                        }
                    } catch (e) {
                        console.error('[ACTIVITY] ❌ Error renderizando actividad:', e);
                    }
                }, 200);
            });

            // Escape
            if (!escapeHandler) {
                escapeHandler = function (e) {
                    if (e.key === 'Escape' && isOpen) {
                        isOpen = false;
                        panelEl.classList.remove('show'); // ✅ Remover clase .show
                        panelEl.style.display = 'none';
                        btn.setAttribute('aria-expanded', 'false');
                        document.removeEventListener('keydown', escapeHandler);
                        escapeHandler = null;
                    }
                };
                document.addEventListener('keydown', escapeHandler);
            }

        } else {
            console.log('[NOTIFICATIONS] ➖ Cerrando panel...');
            isOpen = false;
            panelEl.classList.remove('show'); // ✅ Remover clase .show
            panelEl.style.display = 'none';
            btn.setAttribute('aria-expanded', 'false');
            if (escapeHandler) {
                document.removeEventListener('keydown', escapeHandler);
                escapeHandler = null;
            }
        }
    };

    // ✅ Botón cerrar
    const btnClose = document.getElementById('btn-close-notifications');
    if (btnClose) {
        btnClose.onclick = function () {
            isOpen = false;
            panelEl.classList.remove('show'); // ✅ Remover clase .show
            panelEl.style.display = 'none';
            btn.setAttribute('aria-expanded', 'false');
            if (escapeHandler) {
                document.removeEventListener('keydown', escapeHandler);
                escapeHandler = null;
            }
        };
    }

    // ✅ Pestañas
    const tabNotif = document.getElementById('tab-notifications');
    const tabAct = document.getElementById('tab-activity');
    const contentNotif = document.getElementById('notifications-content');
    const contentAct = document.getElementById('activity-content');

    if (tabNotif) {
        tabNotif.onclick = function () {
            if (tabNotif) tabNotif.classList.add('active');
            if (tabAct) tabAct.classList.remove('active');
            if (contentNotif) contentNotif.style.display = 'block';
            if (contentAct) contentAct.style.display = 'none';
            if (tabNotif) tabNotif.style.borderBottomColor = 'var(--accent)';
            if (tabAct) tabAct.style.borderBottomColor = 'transparent';
        };
    }

    if (tabAct) {
        tabAct.onclick = function () {
            if (tabAct) tabAct.classList.add('active');
            if (tabNotif) tabNotif.classList.remove('active');
            if (contentNotif) contentNotif.style.display = 'none';
            if (contentAct) contentAct.style.display = 'block';
            if (tabAct) tabAct.style.borderBottomColor = 'var(--accent)';
            if (tabNotif) tabNotif.style.borderBottomColor = 'transparent';
            setTimeout(() => {
                try {
                    if (typeof renderActivity === 'function') renderActivity();
                } catch (e) { console.error(e); }
            }, 50);
        };
    }

    // ✅ Filtro
    const filter = document.getElementById('filter-activity');
    if (filter) {
        filter.onchange = function () {
            try {
                if (typeof renderActivity === 'function') renderActivity(this.value);
            } catch (e) { console.error(e); }
        };
    }

    // ✅ Inicializar badge
    if (typeof updateNotificationsBadge === 'function') {
        updateNotificationsBadge();
    }

    console.log('[NOTIFICATIONS] ✅✅✅ CONFIGURACIÓN COMPLETA - BOTÓN LISTO');

    // ✅ Forzar prueba inmediata
    setTimeout(() => {
        if (btn.onclick) {
            console.log('[NOTIFICATIONS] ✅ Handler existe y está configurado');
        } else {
            console.error('[NOTIFICATIONS] ❌ Handler NO existe!');
        }
    }, 100);

    // ✅ Exponer función global para debug
    window.reconfigureNotificationsPanel = () => {
        setupNotificationsPanel();
        console.log('[NOTIFICATIONS] 🔄 Panel reconfigurado manualmente');
    };
}

// ✅ Renderizar notificaciones (con límite y protección)
function renderNotifications() {
    console.log('[NOTIFICATIONS] 🎨 Iniciando renderNotifications...');
    try {
        const list = document.getElementById('notifications-list');
        const empty = document.getElementById('notifications-empty');
        if (!list || !empty) {
            console.warn('[NOTIFICATIONS] Elementos no encontrados');
            return;
        }

        console.log('[NOTIFICATIONS] Obteniendo notificaciones...');
        const notifications = getNotifications();
        if (!Array.isArray(notifications)) {
            list.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        // ✅ Limitar cantidad de notificaciones para evitar bloqueo
        const limitedNotifications = notifications.slice(0, 50);

        if (limitedNotifications.length === 0) {
            console.log('[NOTIFICATIONS] No hay notificaciones');
            list.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        console.log('[NOTIFICATIONS] Renderizando', limitedNotifications.length, 'notificaciones...');
        list.style.display = 'flex';
        empty.style.display = 'none';
        list.innerHTML = '';

        // ✅ Renderizar en lotes pequeños para no bloquear
        let rendered = 0;
        const batchSize = 10;

        const renderBatch = () => {
            const batch = limitedNotifications.slice(rendered, rendered + batchSize);

            batch.forEach((notification, index) => {
                try {
                    // ✅ Validar datos de notificación
                    if (!notification || !notification.id) {
                        return;
                    }

                    const item = document.createElement('div');
                    item.style.cssText = `
            padding: 12px;
            background: ${notification.read ? 'rgba(90,169,255,0.05)' : 'rgba(90,169,255,0.1)'};
            border-left: 3px solid ${getToastColor(notification.type || 'info')};
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
          `;

                    if (!notification.read) {
                        item.style.fontWeight = '500';
                    }

                    item.addEventListener('click', () => {
                        try {
                            markNotificationAsRead(notification.id);
                            item.style.background = 'rgba(90,169,255,0.05)';
                            item.style.fontWeight = 'normal';
                            updateNotificationsBadge();
                        } catch (e) {
                            console.error('[NOTIFICATIONS] Error marcando como leída:', e);
                        }
                    });

                    const time = new Date(notification.timestamp || Date.now());
                    const timeStr = time.toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    const title = escapeHTML(String(notification.title || 'Sin título'));
                    const message = escapeHTML(String(notification.message || ''));

                    item.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
              <div style="font-size: 20px; flex-shrink: 0;">${getToastIcon(notification.type || 'info')}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 13px; color: var(--text); margin-bottom: 4px;">${title}</div>
                <div style="font-size: 12px; color: var(--muted); margin-bottom: 4px;">${message}</div>
                <div style="font-size: 11px; color: var(--muted); opacity: 0.7;">${timeStr}</div>
              </div>
              ${!notification.read ? '<div style="width: 8px; height: 8px; background: var(--accent); border-radius: 50%; flex-shrink: 0; margin-top: 4px;"></div>' : ''}
            </div>
          `;

                    list.appendChild(item);
                } catch (error) {
                    console.error(`[NOTIFICATIONS] Error renderizando notificación ${rendered + index}:`, error);
                }
            });

            rendered += batch.length;

            // ✅ Continuar con siguiente lote si hay más
            if (rendered < limitedNotifications.length) {
                setTimeout(renderBatch, 10); // Delay muy corto entre lotes
            } else {
                console.log('[NOTIFICATIONS] ✅ Todas las notificaciones renderizadas');
            }
        };

        // Iniciar renderizado
        renderBatch();
    } catch (e) {
        console.error('[NOTIFICATIONS] Error crítico:', e);
    }
}

// ✅ Sistema de ayuda con iconos
document.addEventListener('DOMContentLoaded', function () {
    // Contenido de ayuda para cada campo
    const helpContent = {
        'script-url': {
            title: 'URL del Google Apps Script Web App',
            body: '<p><strong><i class="ph ph-link"></i> URL del script desplegado como Web App</strong></p><p>Debe tener acceso: <strong>"Cualquiera, incluso anónimos"</strong></p><p><strong><i class="ph ph-warning"></i> Importante:</strong> Usa la URL de producción que termina en <code>/exec</code>, no la de desarrollo (<code>/dev</code>)</p><p><strong><i class="ph ph-book-open"></i> Pasos:</strong></p><ol><li>Copia el código del script (botón "<i class="ph ph-clipboard"></i> Ver Código del Script")</li><li>Ve a <a href="https://script.google.com" target="_blank" style="color: var(--accent);">script.google.com</a></li><li>Crea un nuevo proyecto y pega el código</li><li>Despliega como Web App</li><li>Configura: Ejecutar como "Yo", Acceso: "Cualquiera, incluso anónimos"</li><li>Copia la URL que termina en <code>/exec</code></li></ol>'
        },
        'slide-template': {
            title: 'Plantilla de Google Slides',
            body: '<p><strong><i class="ph ph-presentation-chart"></i> Selecciona una plantilla de Google Slides</strong></p><p>La plantilla debe contener <code>{{NOMBRE}}</code> como placeholder en el lugar donde quieres que aparezca el nombre de la persona.</p><p><strong>Ejemplo:</strong> Si tu plantilla tiene el texto "Certificado para {{NOMBRE}}", el sistema reemplazará <code>{{NOMBRE}}</code> con el nombre de cada persona de la lista.</p><p><strong><i class="ph ph-lightbulb"></i> Tip:</strong> Puedes usar "Actualizar lista" para ver todas tus plantillas de Google Slides.</p>'
        },
        'google-sheet': {
            title: 'Google Sheet (Hoja de Cálculo)',
            body: '<p><strong><i class="ph ph-clipboard"></i> La estructura de la hoja depende del modo seleccionado:</strong></p><p><strong><i class="ph ph-graduation-cap"></i> Modo Webinar (8 columnas):</strong></p><ol><li><strong>Nombre</strong> - Nombre completo de la persona</li><li><strong>Correo</strong> - Correo electrónico</li><li><strong>Teléfono</strong> - Número de teléfono (solo números)</li><li><strong>Correo link</strong> - Se genera automáticamente</li><li><strong>WhatsApp link</strong> - Se genera automáticamente</li><li><strong>Link PDF</strong> - Se genera automáticamente</li><li><strong>Estado</strong> - Estado del proceso (<i class="ph ph-check-circle"></i> Encontrado, <i class="ph ph-x-circle"></i> No encontrado)</li><li><strong>Certificado generado</strong> - <i class="ph ph-check-circle"></i> cuando está generado</li></ol><p><strong><i class="ph ph-key"></i> Modo con Código (9 columnas):</strong></p><ol><li><strong>Nombre</strong> - Nombre completo de la persona</li><li><strong>Código Validación</strong> - Código único de validación (obligatorio)</li><li><strong>Correo</strong> - Correo electrónico</li><li><strong>Teléfono</strong> - Número de teléfono (solo números)</li><li><strong>Correo link</strong> - Se genera automáticamente</li><li><strong>WhatsApp link</strong> - Se genera automáticamente</li><li><strong>Link PDF</strong> - Se genera automáticamente</li><li><strong>Estado</strong> - Estado del proceso (<i class="ph ph-check-circle"></i> Encontrado, <i class="ph ph-x-circle"></i> No encontrado)</li><li><strong>Certificado generado</strong> - <i class="ph ph-check-circle"></i> cuando está generado</li></ol><p><strong><i class="ph ph-lightbulb"></i> Tip:</strong> Puedes crear una nueva hoja desde aquí si no tienes una lista preparada. La estructura se creará automáticamente según el modo seleccionado.</p>'
        },
        'folder-originales': {
            title: 'Carpeta para PDFs Originales',
            body: '<p><strong><i class="ph ph-folder"></i> Carpeta donde se guardarán los PDFs sin proteger</strong></p><p>Aquí se guardarán los certificados PDF generados directamente desde la plantilla.</p><p><strong><i class="ph ph-warning"></i> Importante:</strong> Después de generar los PDFs, deberás protegerlos manualmente (usando PDF24 u otra herramienta) antes de generar los enlaces.</p><p><strong><i class="ph ph-lightbulb"></i> Tip:</strong> Puedes crear una nueva carpeta desde aquí si no tienes una preparada.</p>'
        },
        'folder-protegidos': {
            title: 'Carpeta para PDFs Protegidos',
            body: '<p><strong><i class="ph ph-lock"></i> Carpeta donde subiste los PDFs ya protegidos</strong></p><p>Esta carpeta debe contener los PDFs que ya protegiste manualmente después de generarlos.</p><p><strong><i class="ph ph-warning"></i> Importante:</strong> Los archivos deben llamarse exactamente: <code>Certificado - [NOMBRE].pdf</code> (donde [NOMBRE] es el nombre completo de la persona).</p><p><strong><i class="ph ph-note"></i> Pasos:</strong></p><ol><li>Genera los certificados PDF primero (botón "Generar PDFs")</li><li>Protege los PDFs manualmente usando PDF24 u otra herramienta</li><li>Sube los PDFs protegidos a esta carpeta</li><li>Luego usa "Generar Enlaces" para crear los enlaces de entrega</li></ol>'
        },
        'webinar-title': {
            title: 'Título del Webinar/Evento',
            body: '<p><strong><i class="ph ph-note"></i> Título que aparecerá en los mensajes</strong></p><p>Este título se usará en los mensajes de correo y WhatsApp.</p><p><strong>Ejemplo:</strong> "Webinar: Salud Mental en Pandemia"</p>'
        },
        'webinar-date': {
            title: 'Fecha del Evento',
            body: '<p><strong><i class="ph ph-calendar"></i> Fecha que aparecerá en los mensajes</strong></p><p>Esta fecha se usará en los mensajes de correo y WhatsApp.</p><p><strong>Ejemplo:</strong> "15 de noviembre de 2024" o "20/11/2024"</p>'
        },
        'email-message': {
            title: 'Mensaje de Correo Electrónico',
            body: '<p><strong><i class="ph ph-envelope-simple"></i> Mensaje personalizado para el correo (Opcional)</strong></p><p>Si dejas este campo vacío, se usará un mensaje por defecto.</p><p><strong>Variables disponibles:</strong></p><ul><li><code>{{NOMBRE}}</code> - Se reemplaza con el nombre de la persona</li><li><code>{{TITULO}}</code> - Se reemplaza con el título del webinar</li><li><code>{{FECHA}}</code> - Se reemplaza con la fecha del evento</li><li><code>{{ENLACE_PDF}}</code> - Se reemplaza con el enlace al PDF</li></ul><p><strong>Ejemplo:</strong></p><pre style="background: rgba(90,169,255,0.1); padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto;">Estimada/o {{NOMBRE}},\n\nGracias por participar en "{{TITULO}}" realizado el {{FECHA}}.\n\nTu certificado: {{ENLACE_PDF}}</pre>'
        },
        'whatsapp-message': {
            title: 'Mensaje de WhatsApp',
            body: '<p><strong><i class="ph ph-chat-circle"></i> Mensaje personalizado para WhatsApp (Opcional)</strong></p><p>Si dejas este campo vacío, se usará un mensaje por defecto.</p><p><strong>Variables disponibles:</strong></p><ul><li><code>{{NOMBRE}}</code> - Se reemplaza con el nombre de la persona</li><li><code>{{TITULO}}</code> - Se reemplaza con el título del webinar</li><li><code>{{FECHA}}</code> - Se reemplaza con la fecha del evento</li><li><code>{{ENLACE_PDF}}</code> - Se reemplaza con el enlace al PDF</li></ul><p><strong>Ejemplo:</strong></p><pre style="background: rgba(90,169,255,0.1); padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto;">Hola {{NOMBRE}}! \n\nGracias por participar en "{{TITULO}}" el {{FECHA}}.\n\nDescarga tu certificado: {{ENLACE_PDF}}</pre>'
        },
        'cert-mode': {
            title: 'Modo de Generación de Certificados',
            body: '<p><strong><i class="ph ph-target"></i> Selecciona el modo de generación de certificados</strong></p><p><strong><i class="ph ph-graduation-cap"></i> Modo Webinar:</strong></p><ul><li>Usa solo la variable <code>{{NOMBRE}}</code> en la plantilla</li><li>La hoja de cálculo tendrá 8 columnas: Nombre, Correo, Teléfono, Correo link, WhatsApp link, Link PDF, Estado, Certificado generado</li><li>Ideal para webinars y eventos simples</li></ul><p><strong><i class="ph ph-key"></i> Modo con Código de Validación:</strong></p><ul><li>Usa las variables <code>{{NOMBRE}}</code> y <code>{{CODIGO_VALIDACION}}</code> en la plantilla</li><li>La hoja de cálculo tendrá 9 columnas: Nombre, Código Validación, Correo, Teléfono, Correo link, WhatsApp link, Link PDF, Estado, Certificado generado</li><li>Ideal para certificados que requieren validación mediante código único</li><li><strong><i class="ph ph-warning"></i> Importante:</strong> Cada fila debe tener un código de validación único en la columna "Código Validación"</li></ul><p><strong><i class="ph ph-lightbulb"></i> Tip:</strong> El modo seleccionado afecta la estructura de la hoja de cálculo. Si cambias el modo después de crear una hoja, necesitarás ajustar las columnas manualmente o crear una nueva hoja.</p>'
        }
    };

    // Elementos del modal
    const helpModal = document.querySelector('#helpModal');
    const helpModalTitle = document.querySelector('#helpModalTitle');
    const helpModalBody = document.querySelector('#helpModalBody');
    const helpModalClose = document.querySelector('#helpModalClose');

    // Mostrar modal de ayuda
    function showHelp(helpId) {
        const content = helpContent[helpId];
        if (content && helpModal) {
            helpModalTitle.textContent = content.title;
            helpModalBody.innerHTML = content.body;
            helpModal.classList.add('show');
        }
    }

    // Cerrar modal
    function closeHelp() {
        if (helpModal) {
            helpModal.classList.remove('show');
        }
    }

    // Event listeners para iconos de ayuda
    document.querySelectorAll('.help-icon').forEach(function (icon) {
        icon.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const helpId = this.getAttribute('data-help');
            if (helpId) {
                showHelp(helpId);
            }
        });
    });

    // Cerrar modal
    if (helpModalClose) {
        helpModalClose.addEventListener('click', closeHelp);
    }

    // Cerrar al hacer click fuera
    if (helpModal) {
        helpModal.addEventListener('click', function (e) {
            if (e.target === helpModal) {
                closeHelp();
            }
        });
    }

    // Cerrar con ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && helpModal && helpModal.classList.contains('show')) {
            closeHelp();
        }
    });
});
