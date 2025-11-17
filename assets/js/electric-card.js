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
    
    // ✅ Aplicar estilos según variant
    let bgColor, defaultBorderColor, defaultShadowColor;
    if (variant === 'neon') {
      // Estilo Neon (Cian)
      bgColor = '#0a1a2e';
      defaultBorderColor = `rgba(139, 233, 253, 0.3)`; // accent-2 (cian)
      defaultShadowColor = `rgba(139, 233, 253, 0.4)`;
    } else {
      // Estilo Dramatic (Azul) - por defecto
      bgColor = '#0e1630';
      defaultBorderColor = `rgba(90, 169, 255, 0.3)`; // accent (azul)
      defaultShadowColor = `rgba(90, 169, 255, 0.4)`;
    }
    
    // ✅ Usar color accent personalizado si está disponible
    const accentRgb = hexToRgb(accent);
    let borderColor = defaultBorderColor;
    let shadowColor = defaultShadowColor;
    
    if (accentRgb) {
      borderColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.3)`;
      shadowColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.4)`;
    }
    
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;
      border-radius: 12px;
      overflow: hidden;
      background: ${bgColor};
      box-shadow: 0 10px 30px ${shadowColor}, 0 0 20px ${shadowColor}40;
      border: 2px solid ${borderColor};
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

