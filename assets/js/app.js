// ================= Utilidades =================
const $ = (sel) => document.querySelector(sel);
const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,'0')).join('');
async function sha256Hex(text) {
  const data = new TextEncoder().encode(String(text).trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(hash);
}
function setQueryParam(key, value) {
  const url = new URL(window.location.href);
  if (value == null) url.searchParams.delete(key); else url.searchParams.set(key, value);
  history.replaceState({}, '', url);
}
function downloadFile(url) { window.open(url, '_blank', 'noopener'); }

// =============== Loader (original) ===============
const loaderEl = document.getElementById('eduLoader');
const loaderBar = document.getElementById('loaderBar');
const loaderPercent = document.getElementById('loaderPercent');
function showLoader() { if (!loaderEl) return; loaderEl.classList.remove('hidden'); loaderEl.setAttribute('aria-hidden', 'false'); }
function hideLoader() { if (!loaderEl) return; loaderEl.classList.add('hidden'); loaderEl.setAttribute('aria-hidden', 'true'); }
const LOAD_DURATION_MS = 1600;
function runLoader(durationMs = LOAD_DURATION_MS) {
  return new Promise((resolve) => {
    if (!loaderBar || !loaderPercent) { resolve(); return; }
    showLoader();
    loaderBar.style.width = '0%';
    loaderPercent.textContent = '0%';
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const ease = t < 0.5 ? (2*t*t) : (-1 + (4-2*t)*t);
      const percent = Math.round(ease * 100);
      loaderBar.style.width = percent + '%';
      loaderPercent.textContent = percent + '%';
      if (t < 1) requestAnimationFrame(frame);
      else {
        loaderBar.style.width = '100%';
        loaderPercent.textContent = '100%';
        setTimeout(() => { hideLoader(); resolve(); }, 200);
      }
    }
    requestAnimationFrame(frame);
  });
}
// =================================================

// =============== Datos =================
const MASTER_CODE = 'EDUMASTER123456987';
const MASTER_HASH = '7d61f670561642f08322ad4860c28ba207b55e8d8158242f459f2017d4c1cfc8';

const ACCESS_HASH_MAP = {
  "2291db02a1c676fcb2f5effd7bba8232c1d7eb75ab236f4880aa8ce0536359c0": {
    title: "Diplomado en Gerencia y Administración de Servicios Hospitalarios (GASH) – 3ª Ed. 2025",
    meta: "Material oficial para docentes/consultores (logos, PPT, manual de marca, social kit)",
    files: [
      { label: "Logos (PNG)", url: "https://drive.google.com/drive/folders/1ooz6Z0YICAqP7PP5UgmPq1v1DFIkv9pi?usp=sharing" },
      { label: "Plantilla PPT (PPTX)", url: "https://drive.google.com/drive/folders/14E42MPlcjsIcc6OWNCYJ2J1HRzcdr21F?usp=sharing" },
      { label: "Manual de Marca (PDF)", url: "https://drive.google.com/file/d/100O3Xp4CzybPdo-uEJqjNLpvbPMUeB-S/view?usp=sharing" },
      { label: "Social Kit (JPG)", url: "https://drive.google.com/drive/folders/1FbTQSAMZk84de7ykDs9YmMmp7z1Pyufr?usp=sharing" },
      { label: "Papel Membretado (DOCX)", url: "https://drive.google.com/drive/folders/1RXj1Mv0t1azJoiWMOhEldfMNfbwclXXm?usp=sharing" },
      { label: "Platform toolkit (WEB)", url: "https://www.notion.so/Plataformas-para-Docentes-estudiantes-29b7e88eb31a8029a710dc4ec95809f3?source=copy_link" }
    ],
    card: { img: "assets/IMG/D_GASH_B1.jpg", tag: "GASH", variant: "dramatic", seed: 7, accent: "#5aa9ff" }
  },

  "88f62dd4f34bc0c54550634cee859bb2178aa0e69041e1bee3be5a132e1c7456": {
    title: "Curso Manejo Básico de Fracturas (MBF) – 2ª Ed. 2025",
    meta: "Material oficial para docentes/consultores (logos, PPT, manual de marca, social kit)",
    files: [
      { label: "Logos (PNG)", url: "https://drive.google.com/drive/folders/1ooz6Z0YICAqP7PP5UgmPq1v1DFIkv9pi?usp=sharing" },
      { label: "Plantilla PPT (PPTX)", url: "https://drive.google.com/drive/folders/1qJqRPO2akiosdJ9BMBXp49gYgrRExcD2?usp=sharing" },
      { label: "Manual de Marca (PDF)", url: "https://drive.google.com/file/d/100O3Xp4CzybPdo-uEJqjNLpvbPMUeB-S/view?usp=sharing" },
      { label: "Social Kit (JPG)", url: "https://drive.google.com/drive/folders/1msdy6xita4RcTesyg7qV3Q51WGu97qPZ?usp=sharing" },
      { label: "Papel Membretado (DOCX)", url: "https://drive.google.com/drive/folders/1RXj1Mv0t1azJoiWMOhEldfMNfbwclXXm?usp=sharing" },
      { label: "Platform toolkit (WEB)", url: "https://www.notion.so/Plataformas-para-Docentes-estudiantes-29b7e88eb31a8029a710dc4ec95809f3?source=copy_link" }
    ],
    card: { img: "assets/IMG/C_MBF_2026_B1.jpg", tag: "MBF", variant: "neon", seed: 11, accent: "#8be9fd" }
  },

  "4544b187690fbe2b84c7b20f7d9fe3d9330419f6f8fc42998fa7348dc3ae2907": {
    title: "Curso Abordaje de Hemorragias Gineo-Obstétricas – 2025",
    meta: "Material oficial para docentes/consultores (logos, PPT, manual de marca, social kit)",
    files: [
      { label: "Logos (PNG)",             url: "https://drive.google.com/drive/folders/1ooz6Z0YICAqP7PP5UgmPq1v1DFIkv9pi?usp=sharing" },
      { label: "Manual de Marca (PDF)",   url: "https://drive.google.com/file/d/100O3Xp4CzybPdo-uEJqjNLpvbPMUeB-S/view?usp=sharing" },
      { label: "Social Kit (JPG)",        url: "https://drive.google.com/drive/folders/1KJkd0InpGNF-iTFObDc4CuC4A8DCGpuF?usp=sharing" },
      { label: "Papel Membretado (DOCX)", url: "https://drive.google.com/drive/folders/1RXj1Mv0t1azJoiWMOhEldfMNfbwclXXm?usp=sharing" },
      { label: "Platform toolkit (WEB)",  url: "https://www.notion.so/Plataformas-para-Docentes-estudiantes-29b7e88eb31a8029a710dc4ec95809f3?source=copy_link" }
    ],
    card: { img: "assets/IMG/C_CAHGO_2025_B1.jpg", tag: "AHGO2", variant: "neon", seed: 3, accent: "#8be9fd" }
  }
};

// =============== Vistas =================
function showAccess() {
  $('#access').classList.remove('hidden');
  $('#content').classList.add('hidden');
  $('#master').classList.add('hidden');
  $('#code').focus();
}
function showContent() {
  $('#access').classList.add('hidden');
  $('#content').classList.remove('hidden');
  $('#master').classList.add('hidden');
}
function showMaster() {
  $('#access').classList.add('hidden');
  $('#content').classList.add('hidden');
  $('#master').classList.remove('hidden');
}

// =============== Render por curso =================
function renderCourse(keyHex) {
  const data = ACCESS_HASH_MAP[keyHex];
  if (!data) return;

  $('#courseTitle').textContent = data.title;
  $('#courseMeta').textContent = data.meta || '';

  const list = $('#filelist');
  list.innerHTML = '';
  (data.files || []).forEach(item => {
    const row = document.createElement('div');
    row.className = 'file';
    let host = '';
    try { host = new URL(item.url).hostname; } catch { host = ''; }
    row.innerHTML = `<div><strong>${item.label}</strong><div class="meta">${host}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = 'Descargar';
    btn.addEventListener('click', () => downloadFile(item.url));
    row.appendChild(btn);
    list.appendChild(row);
  });

  try {
    const left = document.querySelector('#courseCard .card-left-wrapper');
    if (left) {
      left.innerHTML = '';
      const opts = {
        title: data.title,
        desc: data.meta,
        tag: data.card?.tag || 'EDUSALUD',
        variant: data.card?.variant,
        seed: data.card?.seed,
        accent: data.card?.accent
      };
      let wrapper = null;
      if (window.insertElectricCard) wrapper = window.insertElectricCard(left, opts);
      if (wrapper && data.card?.img && window.setCardImage) {
        window.setCardImage(wrapper, `${data.card.img}?v=2`);
      }
    }
  } catch (e) { console.warn('No se pudo insertar la tarjeta:', e); }
}

// =============== Render MASTER =================
function renderMaster() {
  const grid = $('#masterGrid');
  grid.innerHTML = '';

  Object.entries(ACCESS_HASH_MAP).forEach(([hex, data]) => {
    const card = document.createElement('div');
    card.className = 'master-card';

    const left = document.createElement('div');
    left.className = 'left';
    const right = document.createElement('div');
    right.className = 'right';

    try {
      const opts = {
        title: data.title,
        desc: data.meta,
        tag: data.card?.tag || 'EDUSALUD',
        variant: data.card?.variant,
        seed: data.card?.seed,
        accent: data.card?.accent
      };
      let wrapper = null;
      if (window.insertElectricCard) wrapper = window.insertElectricCard(left, opts);
      if (wrapper && data.card?.img && window.setCardImage) {
        window.setCardImage(wrapper, `${data.card.img}?v=2`);
      }
    } catch (e) { console.warn('No se pudo insertar la tarjeta:', e); }

    const list = document.createElement('div');
    list.className = 'filelist';
    (data.files || []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'file';
      let host = '';
      try { host = new URL(item.url).hostname; } catch { host = ''; }
      row.innerHTML = `<div><strong>${item.label}</strong><div class="meta">${host}</div></div>`;
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.type = 'button';
      btn.textContent = 'Descargar';
      btn.addEventListener('click', () => downloadFile(item.url));
      row.appendChild(btn);
      list.appendChild(row);
    });

    right.appendChild(list);
    card.appendChild(left);
    card.appendChild(right);
    grid.appendChild(card);
  });
}

// =============== Login =================
let currentKeyHex = null;
const ATTEMPT_KEY = 'edusalud_attempts_session';
function recordAttempt() {
  try {
    const raw = sessionStorage.getItem(ATTEMPT_KEY);
    const n = raw ? Number(raw) : 0;
    const next = n + 1;
    sessionStorage.setItem(ATTEMPT_KEY, String(next));
    return next;
  } catch (e) { return 0; }
}
function clearAttempts() { try { sessionStorage.removeItem(ATTEMPT_KEY); } catch(e) {} }
function getAttemptsCount() { try { return Number(sessionStorage.getItem(ATTEMPT_KEY) || 0); } catch(e) { return 0; } }
function maybeShowAttemptsWarning() {
  const attempts = getAttemptsCount();
  const msg = $('#msg');
  if (!msg) return;
  if (attempts === 0) return;
  if (attempts >= 8 && attempts < 15) {
    msg.textContent = `Ha intentado ${attempts} veces. Verifique que el código esté correcto antes de seguir intentando.`;
    msg.classList.add('error');
  } else if (attempts >= 15) {
    msg.textContent = `Ha realizado muchos intentos (${attempts}). Si el problema persiste, solicite el código a coordinación.`;
    msg.classList.add('error');
  }
}

async function tryLoginByCode(code) {
  const msg = $('#msg');
  msg.textContent = 'Verificando…';
  msg.classList.remove('error');

  if (!code || String(code).trim().length === 0) {
    msg.textContent = 'Ingrese un código válido.';
    msg.classList.add('error');
    return false;
  }

  try {
    const hex = await sha256Hex(code);

    if (hex === MASTER_HASH) {
      try { await runLoader(); } catch {}
      currentKeyHex = null;
      clearAttempts();
      setQueryParam('code', btoa(code));
      renderMaster();
      showMaster();

      const btnCopy = $('#btn-master-copy');
      const btnExit = $('#btn-master-exit');
      if (btnCopy) {
        btnCopy.onclick = async () => {
          const url = new URL(location.href);
          url.searchParams.set('code', btoa(MASTER_CODE));
          try {
            await navigator.clipboard.writeText(url.toString());
            alert('Enlace copiado al portapapeles');
          } catch {
            prompt('Copie este enlace:', url.toString());
          }
        };
      }
      if (btnExit) btnExit.onclick = () => { setQueryParam('code', null); showAccess(); };
      return true;
    }

    if (ACCESS_HASH_MAP[hex]) {
      try { await runLoader(); } catch {}
      currentKeyHex = hex;
      clearAttempts();
      setQueryParam('code', btoa(code));
      renderCourse(hex);
      showContent();
      return true;
    } else {
      const attempts = recordAttempt();
      msg.textContent = 'Código inválido. Verifique y vuelva a intentar.';
      msg.classList.add('error');
      maybeShowAttemptsWarning();
      return false;
    }
  } catch (e) {
    console.error(e);
    msg.textContent = 'Ocurrió un error al verificar el código.';
    msg.classList.add('error');
    return false;
  }
}

// =============== Eventos UI ===============
document.addEventListener('DOMContentLoaded', () => {
  const y = String(new Date().getFullYear());
  const a = document.getElementById('year'); if (a) a.textContent = y;
  const b = document.getElementById('year_master'); if (b) b.textContent = y;

  $('#btn-enter')?.addEventListener('click', () => tryLoginByCode($('#code').value));
  $('#code')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#btn-enter').click(); } });
  $('#btn-logout')?.addEventListener('click', () => { currentKeyHex = null; setQueryParam('code', null); showAccess(); });

  $('#btn-copy-code-link')?.addEventListener('click', async () => {
    if (!currentKeyHex) return;
    const url = new URL(location.href);
    const codeField = $('#code');
    const encoded = url.searchParams.get('code');
    const codeVal = (encoded ? atob(encoded) : codeField.value) || '';
    if (!codeVal) return;
    url.searchParams.set('code', btoa(codeVal));
    try {
      await navigator.clipboard.writeText(url.toString());
      alert('Enlace copiado al portapapeles');
    } catch (e) {
      prompt('Copie este enlace:', url.toString());
    }
  });

  (async function init(){
    const qp = new URLSearchParams(location.search);
    const pre = qp.get('code');
    if (pre) {
      try {
        const decoded = atob(pre);
        if (decoded) {
          const ok = await tryLoginByCode(decoded);
          if (ok) { try { $('#code').value = decoded; } catch(e) {} return; }
          else {
            setQueryParam('code', null);
            showAccess();
            const m = $('#msg');
            if (m) { m.textContent = 'El enlace contiene código inválido o expirado.'; m.classList.add('error'); }
            return;
          }
        }
      } catch (e) { console.warn('Parámetro code inválido', e); }
    }
    showAccess();
    maybeShowAttemptsWarning();
  })();
});
