// ---------------------------------------------------------
// Tarjeta de imagen simple (sin textos)
// Efecto SVG desactivado intencionalmente (namespace comentado).
// ---------------------------------------------------------

(function () {
  const SVG_ID = 'electric-card';

  // Mantener el filtro desactivado (tu elección actual)
  function ensureSVGFilter() {
    if (document.getElementById(SVG_ID + '-filter')) return;
    const ns = '/*http://www.w3.org/2000/svg*/'; // NO CAMBIAR: efecto apagado
    // Si en el futuro quieres activarlo:
    // const ns = 'http://www.w3.org/2000/svg';
    // ...crear aquí el <svg><defs><filter/></defs></svg>
  }

  function createCardDOM(/* opts sin uso visual ahora */) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ec-wrapper';
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      background: #0b1020;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.06);
    `;

    // Contenedor de imagen (por si quieres poner overlay en el futuro)
    const imgBox = document.createElement('div');
    imgBox.className = 'ec-imgbox';
    imgBox.style.cssText = `
      position: relative;
      width: 100%;
      background: #0b1020;
    `;

    // Imagen sin src (el index lo define con setCardImage)
    const img = document.createElement('img');
    img.className = 'ec-card-img';
    img.alt = 'Imagen del curso';
    img.decoding = 'async';
    img.loading = 'lazy';
    // IMPORTANTE: encajar completa sin recortes
    img.style.cssText = `
      display: block;
      width: 100%;
      height: auto;
      object-fit: contain;
      background: #0b1020; /* bandas laterales si la proporción no coincide */
    `;

    imgBox.appendChild(img);
    wrapper.appendChild(imgBox);
    return wrapper;
  }

  function insertElectricCard(container, opts = {}) {
    ensureSVGFilter(); // no hace nada visible ahora
    const card = createCardDOM(opts);
    container.appendChild(card);
    return card;
  }

  function setCardImage(wrapper, src) {
    if (!wrapper) return;
    const img = wrapper.querySelector('.ec-card-img');
    if (img) img.src = src;
  }

  // Exponer en window
  window.insertElectricCard = window.insertElectricCard || insertElectricCard;
  window.setCardImage = window.setCardImage || setCardImage;
})();
