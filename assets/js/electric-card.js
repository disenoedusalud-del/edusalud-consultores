// ---------------------------------------------------------
// Tarjeta "eléctrica" mínima (solo imagen). Sin textos.
// Efecto SVG desactivado (namespace comentado intencionalmente).
// ---------------------------------------------------------
(function () {
  const SVG_ID = 'electric-card';

  function ensureSVGFilter() {
    if (document.getElementById(SVG_ID + '-filter')) return;
    const ns = '/*http://www.w3.org/2000/svg*/'; // NO CAMBIAR (tu preferencia actual)
    // Para activar en el futuro: usar const ns = 'http://www.w3.org/2000/svg' y crear <svg><defs>...
  }

  function createCardDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = 'ec-wrapper';
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;
      border-radius: 12px;
      overflow: hidden;
      background: #0e1630;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.06);
      display:block;
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
      background:#0e1630;
    `;

    wrapper.appendChild(img);
    return wrapper;
  }

  function insertElectricCard(container) {
    ensureSVGFilter();
    const card = createCardDOM();
    container.appendChild(card);
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
