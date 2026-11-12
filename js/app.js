import { templates } from './templates/index.js';
import { W, H, photoLayout, normalizeLink } from './draw.js';

const $ = (sel) => document.querySelector(sel);
const STORE_KEY = 'pawpromo:v1';
const PET_FIELDS = ['name', 'species', 'age', 'sex', 'bio', 'traits'];

const state = {
  img: null,
  view: { zoom: 1, panX: 0, panY: 0 },
  templateId: templates[0].id,
  data: {},
};

const canvas = $('#preview');
const ctx = canvas.getContext('2d');
const form = $('#form');

// ---------- storage ----------
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (saved.data) state.data = saved.data;
    if (templates.some((t) => t.id === saved.templateId)) state.templateId = saved.templateId;
  } catch { /* storage unavailable: start fresh */ }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ data: state.data, templateId: state.templateId }));
  } catch { /* ignore */ }
}

const current = () => templates.find((t) => t.id === state.templateId) || templates[0];

// Fill in defaults for every template's extra fields.
function withDefaults(data) {
  const out = { ...data };
  for (const t of templates) {
    for (const f of t.fields) if (out[f.key] === undefined && f.default !== undefined) out[f.key] = f.default;
  }
  return out;
}

// ---------- fonts ----------
const fontReady = new Map();
function fontsFor(t) {
  if (!fontReady.has(t.id)) {
    fontReady.set(t.id, Promise.all(t.fonts.map((f) => document.fonts.load(f).catch(() => null))));
  }
  return fontReady.get(t.id);
}

// ---------- rendering ----------
let pending = false;
function render() {
  if (pending) return;
  pending = true;
  const t = current();
  fontsFor(t).then(() => requestAnimationFrame(() => {
    pending = false;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    current().render(ctx, withDefaults(state.data), state.img, state.view);
    ctx.restore();
    scheduleThumbs();
  }));
}

let thumbTimer = null;
const thumbCanvas = document.createElement('canvas');
thumbCanvas.width = W;
thumbCanvas.height = H;
function scheduleThumbs() {
  clearTimeout(thumbTimer);
  thumbTimer = setTimeout(drawThumbs, 700);
}
async function drawThumbs() {
  const tctx = thumbCanvas.getContext('2d');
  for (const t of templates) {
    const el = document.querySelector(`[data-thumb="${t.id}"]`);
    if (!el) continue;
    await fontsFor(t);
    tctx.save();
    tctx.clearRect(0, 0, W, H);
    // Thumbs use the default framing so they don't change the drag math of the main preview.
    const keep = { ...photoLayout };
    t.render(tctx, withDefaults(state.data), state.img, { zoom: 1, panX: 0, panY: 0 });
    Object.assign(photoLayout, keep);
    tctx.restore();
    const c = el.getContext('2d');
    c.clearRect(0, 0, el.width, el.height);
    c.imageSmoothingQuality = 'high';
    c.drawImage(thumbCanvas, 0, 0, el.width, el.height);
  }
}

// ---------- style picker ----------
function buildStylePicker() {
  const wrap = $('#styles');
  wrap.innerHTML = '';
  for (const t of templates) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'style-tile';
    b.setAttribute('role', 'radio');
    b.dataset.id = t.id;
    b.innerHTML = `<canvas data-thumb="${t.id}" width="216" height="270"></canvas>
      <span>${t.name}</span><small>${t.blurb}</small>`;
    b.addEventListener('click', () => selectTemplate(t.id));
    wrap.appendChild(b);
  }
  syncStylePicker();
}
function syncStylePicker() {
  document.querySelectorAll('.style-tile').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.id === state.templateId));
  });
}
function selectTemplate(id) {
  state.templateId = id;
  syncStylePicker();
  buildExtraFields();
  save();
  render();
}

// ---------- form ----------
function fillForm() {
  for (const key of ['name', 'species', 'age', 'bio', 'traits', 'shelter', 'link']) {
    form.elements[key].value = state.data[key] || '';
  }
  const sex = state.data.sex ?? '';
  form.querySelectorAll('input[name="sex"]').forEach((r) => { r.checked = r.value === sex; });
}

function buildExtraFields() {
  const t = current();
  const box = $('#extraFields');
  box.innerHTML = '';
  if (!t.fields.length) return;
  const h = document.createElement('h3');
  h.textContent = `${t.emoji} Just for the ${t.name.toLowerCase()}`;
  box.appendChild(h);
  const data = withDefaults(state.data);
  let rangeHintShown = false;
  for (const f of t.fields) {
    if (f.type === 'range') {
      // A slider with a name the staff can change (tap the name to edit it).
      if (!rangeHintShown) {
        const hint = document.createElement('small');
        hint.className = 'help';
        hint.textContent = 'Tap a stat name to rename it, then drag the slider to set its score.';
        box.appendChild(hint);
        rangeHintShown = true;
      }
      const wrap = document.createElement('div');
      wrap.className = 'field range-field';
      const head = document.createElement('div');
      head.className = 'range-label';
      const nameInput = document.createElement('input');
      nameInput.className = 'range-name';
      nameInput.name = f.nameKey;
      nameInput.placeholder = f.label;
      nameInput.maxLength = 16;
      nameInput.value = state.data[f.nameKey] || '';
      nameInput.setAttribute('aria-label', `Name for the ${f.label} slider`);
      nameInput.autocapitalize = 'words';
      const out = document.createElement('output');
      out.textContent = data[f.key];
      head.append(nameInput, out);
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = f.min; slider.max = f.max; slider.step = 1;
      slider.value = data[f.key];
      slider.name = f.key;
      const describe = () => slider.setAttribute('aria-label', `${nameInput.value.trim() || f.label} score`);
      describe();
      nameInput.addEventListener('input', describe);
      slider.addEventListener('input', () => { out.textContent = slider.value; });
      wrap.append(head, slider);
      box.appendChild(wrap);
      continue;
    }
    const label = document.createElement('label');
    label.className = 'field';
    let input;
    if (f.type === 'select') {
      label.innerHTML = `<span>${f.label}</span>`;
      input = document.createElement('select');
      for (const o of f.options) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        input.appendChild(opt);
      }
      input.value = data[f.key];
    } else {
      label.innerHTML = `<span>${f.label}</span>`;
      input = document.createElement('input');
      input.placeholder = f.placeholder || '';
      input.maxLength = 90;
      if (f.inputmode) input.inputMode = f.inputmode;
      input.value = data[f.key] || '';
    }
    input.name = f.key;
    input.dataset.extra = '1';
    label.appendChild(input);
    box.appendChild(label);
  }
}

form.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.name) return;
  state.data[el.name] = el.value;
  if (el.name === 'link') checkLink();
  save();
  render();
});
form.addEventListener('change', (e) => {
  const el = e.target;
  if (!el.name) return;
  state.data[el.name] = el.value;
  save();
  render();
});

$('#newPet').addEventListener('click', () => {
  // The adoption line and any renamed sliders carry over to the next pet.
  const keep = { shelter: state.data.shelter, cardNumber: '' };
  const sliderNames = new Set(templates.flatMap((t) => t.fields.map((f) => f.nameKey).filter(Boolean)));
  for (const k of Object.keys(state.data)) {
    if (sliderNames.has(k)) keep[k] = state.data[k];
    if (k !== 'shelter') delete state.data[k];
  }
  Object.assign(state.data, keep);
  state.img = null;
  state.view = { zoom: 1, panX: 0, panY: 0 };
  $('#zoom').value = 1;
  $('#zoomRow').hidden = true;
  fillForm();
  checkLink();
  buildExtraFields();
  save();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Ready for the next pet!');
});

function checkLink() {
  const help = $('#linkHelp');
  const url = normalizeLink(state.data.link);
  const ok = !url || /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(url);
  help.classList.toggle('warn', !ok);
  help.textContent = !url
    ? "Paste the pet's adoption page and a scannable code appears on the promo."
    : ok ? `The code opens ${url}` : "That doesn't look like a web link yet. Check it before posting.";
}

// ---------- photo ----------
async function loadPhoto(file) {
  if (!file) return;
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    // Shrink big phone photos so drawing stays quick. Browsers apply the
    // photo's rotation automatically when drawing an <img>.
    const max = 2400;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const cctx = c.getContext('2d');
    cctx.imageSmoothingQuality = 'high';
    cctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    state.img = c;
    state.view = { zoom: 1, panX: 0, panY: 0 };
    $('#zoom').value = 1;
    $('#zoomRow').hidden = false;
    showDragHint();
    render();
    scheduleThumbs();
  } catch {
    toast("Sorry, that photo couldn't be opened. Try another one.");
  }
}
for (const id of ['#cameraInput', '#libraryInput']) {
  $(id).addEventListener('change', (e) => {
    loadPhoto(e.target.files[0]);
    e.target.value = '';
  });
}

function showDragHint() {
  const h = $('#dragHint');
  h.hidden = false;
  h.style.opacity = 1;
  setTimeout(() => { h.style.opacity = 0; }, 2500);
  setTimeout(() => { h.hidden = true; }, 3000);
}

// Drag to move the photo, pinch or slider to zoom.
const pointers = new Map();
let pinchStart = null;
canvas.addEventListener('pointerdown', (e) => {
  if (!state.img) return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.classList.add('dragging');
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: state.view.zoom };
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  const now = { x: e.clientX, y: e.clientY };
  pointers.set(e.pointerId, now);
  if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    setZoom(pinchStart.zoom * (dist / pinchStart.dist));
    return;
  }
  const k = W / canvas.getBoundingClientRect().width; // screen px -> canvas px
  const { overflowX, overflowY } = photoLayout;
  if (overflowX > 0) state.view.panX = clamp(state.view.panX + (2 * (now.x - prev.x) * k) / overflowX, -1, 1);
  if (overflowY > 0) state.view.panY = clamp(state.view.panY + (2 * (now.y - prev.y) * k) / overflowY, -1, 1);
  render();
});
const endPointer = (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;
  if (!pointers.size) canvas.classList.remove('dragging');
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  if (!state.img) return;
  e.preventDefault();
  setZoom(state.view.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
}, { passive: false });

function setZoom(z) {
  state.view.zoom = clamp(z, 1, 3);
  $('#zoom').value = state.view.zoom;
  render();
}
$('#zoom').addEventListener('input', (e) => setZoom(Number(e.target.value)));
$('#resetView').addEventListener('click', () => {
  state.view = { zoom: 1, panX: 0, panY: 0 };
  $('#zoom').value = 1;
  render();
});

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------- save & share ----------
const previewDownloads = window.claude?.use
  ? Promise.race([window.claude.use('downloads').catch(() => null), new Promise((r) => setTimeout(() => r(null), 4000))])
  : Promise.resolve(null);

function fileName() {
  const name = (state.data.name || 'pet').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'pet';
  return `${name}-${current().id}.jpg`;
}
async function makeFile() {
  await fontsFor(current());
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
  return new File([blob], fileName(), { type: 'image/jpeg' });
}

const canShareFiles = (() => {
  try {
    return !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] });
  } catch { return false; }
})();
if (canShareFiles) {
  $('#shareBtn').hidden = false;
  $('#saveBtn').className = 'btn secondary big';
}

$('#shareBtn').addEventListener('click', async () => {
  if (!state.img && !confirmNoPhoto()) return;
  try {
    const file = await makeFile();
    await navigator.share({ files: [file], title: state.data.name || 'Adopt me!' });
  } catch (err) {
    if (err?.name !== 'AbortError') toast("Couldn't open sharing. Try Save image instead.");
  }
});

$('#saveBtn').addEventListener('click', async () => {
  if (!state.img && !confirmNoPhoto()) return;
  const file = await makeFile();
  // Inside a claude.ai preview the page saves through the viewer's own download prompt.
  const dl = await previewDownloads;
  if (dl) {
    try {
      await dl.save({ filename: file.name, data: file });
      toast('Saved!');
    } catch (err) {
      if (err?.code !== 'declined') toast("Couldn't save here. Try Share instead.");
    }
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Saved! Look in your Downloads or Files.');
});

function confirmNoPhoto() {
  toast('Add a photo first: tap Take photo or Choose photo.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false;
}

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ---------- install tip ----------
const TIP_KEY = 'pawpromo:tipDismissed';
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let deferredPrompt = null;
function tipDismissed() { try { return localStorage.getItem(TIP_KEY) === '1'; } catch { return false; } }
function showTip(text, withButton) {
  if (isStandalone || tipDismissed()) return;
  $('#installText').textContent = text;
  $('#installBtn').hidden = !withButton;
  $('#installTip').hidden = false;
}
if (isIOS) {
  showTip('In Safari, tap the Share button, then "Add to Home Screen".', false);
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showTip('Add it to your home screen so it opens like an app.', true);
});
$('#installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => null);
  deferredPrompt = null;
  $('#installTip').hidden = true;
});
$('#installClose').addEventListener('click', () => {
  $('#installTip').hidden = true;
  try { localStorage.setItem(TIP_KEY, '1'); } catch { /* ignore */ }
});

// ---------- start ----------
load();
fillForm();
checkLink();
buildStylePicker();
buildExtraFields();
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Handy for testing in a desktop browser.
window.pawPromo = { state, render, loadPhoto };
