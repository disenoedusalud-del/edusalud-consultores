// ---------------------------------------------------------
// Tarjeta "eléctrica" (solo imagen, sin textos)
// Efecto SVG desactivado intencionalmente (namespace comentado).
// Imágenes ajustadas con object-fit: contain (sin recortes).
// ---------------------------------------------------------

(function () {
  const SVG_ID = 'electric-card';

  // Mantener el filtro desactivado (tu elección actual)
  function ensureSVGFilter() {
    if (document.getElementById(SVG_ID + '-filter')) return;
    const ns = '/*http://www.w3.org/2000/svg*/'; // <- NO CAMBIAR (lo dejaste comentado)
    // Si en el futuro quieres activarlo, usa: const ns = 'http://www.w3.org/2000/svg';
    // y agrega aquí la creación de <svg><defs><filter .../></defs></svg>
    // Por ahora no se inyecta nada para no aplicar efecto.
  }

  // --- Estilos comunes para wrapper (marco de la tarjeta) ---
  function baseWrapperStyle() {
    return `
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;                 /* Puedes cambiar a 16/9 si tus artes son apaisados */
      border-radius: 12px;
      overflow: hidden;
      background: #0b1020;               /* Fondo de la tarjeta (también se verá en las franjas) */
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.06);
    `;
  }

  // --- Contenedor interno ---
  function baseInnerStyle() {
    return `
      position: absolute; inset: 0;
      display: block;
    `;
  }

  // --- Caja de imagen ---
  function baseImgBoxStyle() {
    return `
      position: absolute; inset: 0;
      display: grid;
      place-items: center;               /* Centra la imagen en ambos ejes */
      background: radial-gradient(600px 400px at 50% 40%, rgba(255,255,255,.04), transparent) , #0b1020;
    `;
  }

  // --- Imagen (ajuste sin recorte) ---
  function baseImgStyle() {
    return `
      width: 100%;
      height: 100%;
      object-fit: contain;               /* 👈 Clave para NO recortar */
      object-position: center center;
      display: block;
      image-rendering: auto;
      background: transparent;           /* Transparente: deja ver el fondo del contenedor */
    `;
  }

  function createCardDOM(opts = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ec-wrapper';
    wrapper.style.cssText = baseWrapperStyle();

    const inner = document.createElement('div');
    inner.className = 'ec-inner';
    inner.style.cssText = baseInnerStyle();

    const imgBox = document.createElement('div');
    imgBox.className = 'ec-imgbox';
    imgBox.style.cssText = baseImgBoxStyle();

    const img = document.createElement('img');
    img.className = 'ec-card-img';
    img.alt = 'Tarjeta EduSalud - imagen';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.style.cssText = baseImgStyle();

    imgBox.appendChild(img);
    inner.appendChild(imgBox);
    wrapper.appendChild(inner);
    return wrapper;
  }

  function insertElectricCard(container, opts = {}) {
    ensureSVGFilter(); // no hace nada visible ahora, pero deja el hook
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
