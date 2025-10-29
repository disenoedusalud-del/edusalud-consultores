// electric-card.js — versión con imagen dentro de la tarjeta (sin textos)
// Uso:
//   const card = insertElectricCard('#leftColumn'); // inserta tarjeta vacía (imagen por defecto)
//   setCardImage(card, 'https://.../mi-imagen.jpg');
//   // o con File:
//   setCardImage(card, someFileObject);

(function () {
  const STYLE_ID = 'ec-electric-style-img-v1';
  const SVG_ID = 'ec-turbulent-displace-img-v1';
  const SCOPE = '.ec-scope-img'; // scope de estilos

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
${SCOPE} { display:block; }
${SCOPE} .main-container{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:480px;position:relative;}
${SCOPE} .svg-container{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;}
${SCOPE} .card-container{padding:2px;border-radius:24px;position:relative;background:linear-gradient(-30deg, rgba(255,160,110,0.06), transparent, rgba(255,160,110,0.04)), linear-gradient(to bottom, #0f1112, #0f1112);}

/* inner */
${SCOPE} .inner-container{position:relative;}
${SCOPE} .border-outer{border:2px solid rgba(221,132,72,0.5);border-radius:24px;padding-right:4px;padding-bottom:4px;}
${SCOPE} .main-card{width:350px;height:500px;border-radius:24px;border:2px solid #dd8448;margin-top:-4px;margin-left:-4px;filter:url(#${SVG_ID}-filter);background:linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.24));position:relative;overflow:hidden;display:block;}

/* imagen dentro de la tarjeta */
${SCOPE} .ec-card-img{width:100%;height:100%;object-fit:cover;display:block;border-radius:20px;}

/* glows */
${SCOPE} .glow-layer-1{border:2px solid rgba(221,132,72,0.6);border-radius:24px;width:100%;height:100%;position:absolute;top:0;left:0;right:0;bottom:0;filter:blur(1px);pointer-events:none;mix-blend-mode:screen;opacity:0.95}
${SCOPE} .glow-layer-2{border:2px solid rgba(255,200,140,0.35);border-radius:24px;width:100%;height:100%;position:absolute;top:0;left:0;right:0;bottom:0;filter:blur(4px);pointer-events:none;mix-blend-mode:screen;opacity:0.6}

/* overlays & bg glow */
${SCOPE} .overlay-1, ${SCOPE} .overlay-2{position:absolute;width:100%;height:100%;top:0;left:0;border-radius:24px;mix-blend-mode:overlay;transform:scale(1.06);pointer-events:none}
${SCOPE} .overlay-1{filter:blur(14px);background:linear-gradient(-30deg, rgba(255,255,255,0.06), transparent 30%, transparent 70%, rgba(255,255,255,0.04));opacity:0.9}
${SCOPE} .overlay-2{filter:blur(24px);background:linear-gradient(120deg, rgba(255,200,140,0.06), transparent 30%, rgba(255,200,140,0.02));opacity:0.5}
${SCOPE} .background-glow{position:absolute;width:100%;height:100%;top:0;left:0;border-radius:24px;filter:blur(32px);transform:scale(1.08);opacity:0.32;z-index:-1;background:linear-gradient(-30deg, rgba(255,200,140,0.28), transparent, rgba(221,132,72,0.18));}

/* responsive small tweak */
@media (max-width:680px){
  ${SCOPE} .main-card{width:300px;height:420px}
}
`;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  function ensureSVGFilter() {
    if (document.getElementById(SVG_ID + '-filter')) return;
    const ns = '/*http://www.w3.org/2000/svg*/';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:visible;pointer-events:none;');

    const defs = document.createElementNS(ns, 'defs');
    const filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', SVG_ID + '-filter');
    filter.setAttribute('colorInterpolationFilters', 'sRGB');
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');

    function el(name, attrs = {}) {
      const e = document.createElementNS(ns, name);
      Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
      return e;
    }

    const ft1 = el('feTurbulence', { type: 'turbulence', baseFrequency: '0.02', numOctaves: '10', result: 'noise1', seed: '1' });
    const fo1 = el('feOffset', { in: 'noise1', dx: '0', dy: '0', result: 'offsetNoise1' });
    const a1 = el('animate', { attributeName: 'dy', values: '700; 0', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear' });
    fo1.appendChild(a1);

    const ft2 = el('feTurbulence', { type: 'turbulence', baseFrequency: '0.02', numOctaves: '10', result: 'noise2', seed: '1' });
    const fo2 = el('feOffset', { in: 'noise2', dx: '0', dy: '0', result: 'offsetNoise2' });
    const a2 = el('animate', { attributeName: 'dy', values: '0; -700', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear' });
    fo2.appendChild(a2);

    const ft3 = el('feTurbulence', { type: 'turbulence', baseFrequency: '0.02', numOctaves: '10', result: 'noise3', seed: '2' });
    const fo3 = el('feOffset', { in: 'noise3', dx: '0', dy: '0', result: 'offsetNoise3' });
    const a3 = el('animate', { attributeName: 'dx', values: '490; 0', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear' });
    fo3.appendChild(a3);

    const ft4 = el('feTurbulence', { type: 'turbulence', baseFrequency: '0.02', numOctaves: '10', result: 'noise4', seed: '2' });
    const fo4 = el('feOffset', { in: 'noise4', dx: '0', dy: '0', result: 'offsetNoise4' });
    const a4 = el('animate', { attributeName: 'dx', values: '0; -490', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear' });
    fo4.appendChild(a4);

    const comp1 = el('feComposite', { in: 'offsetNoise1', in2: 'offsetNoise2', result: 'part1' });
    const comp2 = el('feComposite', { in: 'offsetNoise3', in2: 'offsetNoise4', result: 'part2' });
    const blend = el('feBlend', { in: 'part1', in2: 'part2', mode: 'color-dodge', result: 'combinedNoise' });
    const disp = el('feDisplacementMap', { in: 'SourceGraphic', in2: 'combinedNoise', scale: '30', xChannelSelector: 'R', yChannelSelector: 'B' });

    filter.appendChild(ft1); filter.appendChild(fo1);
    filter.appendChild(ft2); filter.appendChild(fo2);
    filter.appendChild(ft3); filter.appendChild(fo3);
    filter.appendChild(ft4); filter.appendChild(fo4);
    filter.appendChild(comp1); filter.appendChild(comp2);
    filter.appendChild(blend); filter.appendChild(disp);

    defs.appendChild(filter);
    svg.appendChild(defs);
    document.body.appendChild(svg);
  }

  function createCardDOM() {
    const wrapper = document.createElement('div');
    wrapper.className = SCOPE.slice(1); // remove dot

    wrapper.innerHTML = `
      <main class="main-container" aria-hidden="false">
        <svg class="svg-container" aria-hidden="true"></svg>

        <div class="card-container">
          <div class="inner-container">
            <div class="border-outer">
              <div class="main-card">
                <!-- zona de imagen (vacía al inicio) -->
                <img class="ec-card-img" alt="Tarjeta EduSalud - imagen" src="assets/IMG
/D_GASH_B1.jpg" />
              </div>
            </div>
            <div class="glow-layer-1" aria-hidden="true"></div>
            <div class="glow-layer-2" aria-hidden="true"></div>
          </div>

          <div class="overlay-1" aria-hidden="true"></div>
          <div class="overlay-2" aria-hidden="true"></div>
          <div class="background-glow" aria-hidden="true"></div>
        </div>
      </main>
    `;
    return wrapper;
  }

  // Inserta la tarjeta en un contenedor. Devuelve el nodo wrapper insertado.
  function insertElectricCard(target) {
    let container = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!container) {
      console.warn('insertElectricCard: target no encontrado', target);
      return null;
    }
    ensureStyles();
    ensureSVGFilter();
    const card = createCardDOM();
    // append al final del container (no borra contenido previo)
    container.appendChild(card);
    return card;
  }

  // setCardImage soporta: URL (string) o File (objeto File)
  function setCardImage(cardOrSelector, urlOrFile) {
    const card = (typeof cardOrSelector === 'string') ? document.querySelector(cardOrSelector) : cardOrSelector;
    if (!card) { console.warn('setCardImage: card no encontrado', cardOrSelector); return; }
    const img = card.querySelector('.ec-card-img');
    if (!img) { console.warn('setCardImage: img no encontrada en tarjeta', card); return; }

    // limpiar previos objectURLs si existen
    if (img._objectURL) {
      URL.revokeObjectURL(img._objectURL);
      img._objectURL = null;
    }

    // File -> objectURL
    if (urlOrFile instanceof File) {
      const o = URL.createObjectURL(urlOrFile);
      img._objectURL = o;
      img.src = o;
      return;
    }

    // si es string (URL)
    if (typeof urlOrFile === 'string') {
      img.src = urlOrFile;
      return;
    }

    console.warn('setCardImage: tipo no soportado', urlOrFile);
  }

  // exportar funciones globales
  window.insertElectricCard = window.insertElectricCard || insertElectricCard;
  window.setCardImage = window.setCardImage || setCardImage;

  // auto-insert en elementos con data-ec-auto="true"
  document.addEventListener('DOMContentLoaded', () => {
    const autoEls = document.querySelectorAll('[data-ec-auto="true"]');
    autoEls.forEach(el => {
      if (!el.querySelector('.ec-card-img')) {
        const wrapper = insertElectricCard(el);
        const src = el.getAttribute('data-ec-img') || '';
        if (src) setCardImage(wrapper, src);
      }
    });
  });
})();


