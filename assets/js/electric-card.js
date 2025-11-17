// ---------------------------------------------------------
// Tarjeta "eléctrica" mínima (solo imagen). Sin textos.
// Efecto SVG desactivado (namespace comentado intencionalmente).
// ✅ Soporta variant (dramatic/neon) y color accent personalizado
// ---------------------------------------------------------
(function () {
  const SVG_ID = 'electric-card';

  function ensureSVGFilter() {
    if (document.getElementById(SVG_ID + '-filter')) return;
    const ns = '/*http://www.w3.org/2000/svg*/'; // NO CAMBIAR (tu preferencia actual)
    // Para activar en el futuro: usar const ns = 'http://www.w3.org/2000/svg' y crear <svg><defs>...
  }
  
  // ✅ Función auxiliar para convertir hex a RGB
  function hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function createCardDOM(variant = 'dramatic', accent = '#5aa9ff') {
    const wrapper = document.createElement('div');
    wrapper.className = 'ec-wrapper';
    
    // ✅ Aplicar estilos según variant - DIFERENCIAS MUY DRAMÁTICAS
    let bgColor, defaultBorderColor, defaultShadowColor, glowEffect, borderWidth;
    
    if (variant === 'neon') {
      // Estilo Neon (Cian) - MUY BRILLANTE con efecto glow MUY INTENSO
      bgColor = '#051020'; // Más oscuro para que el glow resalte más
      defaultBorderColor = `rgba(139, 233, 253, 0.8)`; // MUY visible - casi opaco
      defaultShadowColor = `rgba(139, 233, 253, 0.7)`;
      borderWidth = '3px'; // Borde más grueso
      // Glow MUY intenso y extenso para efecto neon real
      glowEffect = `0 0 40px rgba(139, 233, 253, 0.9), 0 0 80px rgba(139, 233, 253, 0.6), 0 0 120px rgba(139, 233, 253, 0.3), inset 0 0 20px rgba(139, 233, 253, 0.2)`;
    } else {
      // Estilo Dramatic (Azul) - Profundo y elegante, sin glow excesivo
      bgColor = '#0e1630';
      defaultBorderColor = `rgba(90, 169, 255, 0.5)`; // Moderado
      defaultShadowColor = `rgba(90, 169, 255, 0.4)`;
      borderWidth = '2px'; // Borde normal
      // Glow sutil y elegante
      glowEffect = `0 0 20px rgba(90, 169, 255, 0.4), 0 0 40px rgba(90, 169, 255, 0.2)`;
    }
    
    // ✅ Usar color accent personalizado PERO mantener diferencias del variant
    const accentRgb = hexToRgb(accent);
    let borderColor = defaultBorderColor;
    let shadowColor = defaultShadowColor;
    let finalGlow = glowEffect;
    let finalBorderWidth = borderWidth;
    
    if (accentRgb) {
      // Si hay color personalizado, usarlo pero mantener el estilo del variant
      if (variant === 'neon') {
        // Neon: MUY intenso y brillante
        borderColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.8)`;
        shadowColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.7)`;
        finalBorderWidth = '3px';
        finalGlow = `0 0 40px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.9), 0 0 80px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.6), 0 0 120px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.3), inset 0 0 20px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`;
      } else {
        // Dramatic: Sutil y elegante
        borderColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.5)`;
        shadowColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.4)`;
        finalBorderWidth = '2px';
        finalGlow = `0 0 20px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.4), 0 0 40px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`;
      }
    }
    
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;
      border-radius: 12px;
      overflow: hidden;
      background: ${bgColor};
      box-shadow: ${finalGlow}, 0 10px 30px ${shadowColor};
      border: ${finalBorderWidth} solid ${borderColor};
      display:block;
      transition: all 0.3s ease;
    `;

    const img = document.createElement('img');
    img.className = 'ec-card-img';
    img.alt = 'Tarjeta EduSalud';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;   /* encaja al 100% sin recorte */
      display:block;
      background:${bgColor};
    `;

    wrapper.appendChild(img);
    return wrapper;
  }

  function insertElectricCard(container, variant = 'dramatic', accent = '#5aa9ff') {
    ensureSVGFilter();
    const card = createCardDOM(variant, accent);
    if (container) {
      container.appendChild(card);
    }
    return card;
  }

  function setCardImage(wrapper, src) {
    if (!wrapper) return;
    const img = wrapper.querySelector('.ec-card-img');
    if (img) img.src = src;
  }

  // Exponer
  window.insertElectricCard = window.insertElectricCard || insertElectricCard;
  window.setCardImage = window.setCardImage || setCardImage;
})();

