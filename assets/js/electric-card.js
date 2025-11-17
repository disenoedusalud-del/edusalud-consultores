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
    
    // ✅ Aplicar estilos según variant - DIFERENCIAS MÁS NOTORIAS
    let bgColor, defaultBorderColor, defaultShadowColor, glowEffect;
    
    if (variant === 'neon') {
      // Estilo Neon (Cian) - Más brillante y con efecto glow intenso
      bgColor = '#0a1a2e';
      defaultBorderColor = `rgba(139, 233, 253, 0.5)`; // Más visible
      defaultShadowColor = `rgba(139, 233, 253, 0.5)`;
      glowEffect = `0 0 30px rgba(139, 233, 253, 0.6), 0 0 60px rgba(139, 233, 253, 0.3)`; // Efecto glow cian intenso
    } else {
      // Estilo Dramatic (Azul) - Más profundo y elegante
      bgColor = '#0e1630';
      defaultBorderColor = `rgba(90, 169, 255, 0.4)`; // Más visible
      defaultShadowColor = `rgba(90, 169, 255, 0.5)`;
      glowEffect = `0 0 25px rgba(90, 169, 255, 0.5), 0 0 50px rgba(90, 169, 255, 0.2)`; // Efecto glow azul sutil
    }
    
    // ✅ Usar color accent personalizado PERO mantener diferencias del variant
    const accentRgb = hexToRgb(accent);
    let borderColor = defaultBorderColor;
    let shadowColor = defaultShadowColor;
    let finalGlow = glowEffect;
    
    if (accentRgb) {
      // Si hay color personalizado, usarlo pero mantener el estilo del variant
      borderColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${variant === 'neon' ? 0.5 : 0.4})`;
      shadowColor = `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, ${variant === 'neon' ? 0.5 : 0.5})`;
      // Glow más intenso para Neon, más sutil para Dramatic
      finalGlow = variant === 'neon' 
        ? `0 0 30px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.6), 0 0 60px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.3)`
        : `0 0 25px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.5), 0 0 50px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`;
    }
    
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;
      border-radius: 12px;
      overflow: hidden;
      background: ${bgColor};
      box-shadow: ${finalGlow}, 0 10px 30px ${shadowColor};
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
