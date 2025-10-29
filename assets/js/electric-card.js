// ---------------------------------------------------------
// Tarjeta "eléctrica" (estructura mínima para integrarse con index)
// Efecto SVG desactivado intencionalmente (namespace comentado).
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

  function createCardDOM(opts = {}) {
    const title = opts.title || 'Curso / Diplomado';
    const desc  = opts.desc  || '';
    const tag   = opts.tag   || 'EDUSALUD';

    const wrapper = document.createElement('div');
    wrapper.className = 'ec-wrapper';
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      aspect-ratio: 3/4;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(0,0,0,.35);
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.06);
    `;

    const inner = document.createElement('div');
    inner.className = 'ec-inner';
    inner.style.cssText = `
      position: absolute; inset: 0;
      display: grid; grid-template-rows: 1fr auto;
    `;

    const imgBox = document.createElement('div');
    imgBox.className = 'ec-imgbox';
    imgBox.style.cssText = `
      position: relative; overflow: hidden;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(0,0,0,.12));
    `;

    // La imagen va SIN src; el index la fija por curso con setCardImage(...)
    const img = document.createElement('img');
    img.className = 'ec-card-img';
    img.alt = 'Tarjeta EduSalud - imagen';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.style.cssText = `
      width: 100%; height: 100%; object-fit: cover; display:block;
      filter: none;
    `;
    imgBox.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'ec-meta';
    meta.style.cssText = `
      padding: 10px 12px; display:flex; flex-direction:column; gap:6px;
      background: linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.35));
      border-top: 1px solid rgba(255,255,255,.06);
    `;
    meta.innerHTML = `
      <div style="font-size:12px; color:#9fb1d1; font-weight:700; letter-spacing:.4px">${tag}</div>
      <div style="font-size:13px; color:#dbe9ff; line-height:1.25">${title}</div>
      ${desc ? `<div style="font-size:12px; color:#9fb1d1">${desc}</div>` : ``}
    `;

    inner.appendChild(imgBox);
    inner.appendChild(meta);
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
