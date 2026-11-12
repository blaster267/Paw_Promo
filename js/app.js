import { templates } from './templates/index.js';
import { W, H, photoLayout, normalizeLink } from './draw.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];
const STORE_KEY = 'pawpromo:v1';
const STEPS = ['photo', 'style', 'details', 'share'];

const state = {
  img: null,
  view: { zoom: 1, panX: 0, panY: 0 },
  templateId: templates[0].id,
  data: {},
  step: 'photo',
};

// The promo is always drawn on this hidden full-size canvas, then copied to
// whichever previews are on screen. Saving uses the full-size one.
const master = document.createElement('canvas');
master.width = W;
master.height = H;
const ctx = master.getContext('2d');
const form = $('#form');

// ---------- storage ----------
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    if (saved.data) state.data = saved.data;
    if (saved.view) state.view = saved.view;
    if (templates.some((t) => t.id === saved.templateId)) state.templateId = saved.templateId;
    if (STEPS.includes(saved.step)) state.step = saved.step;
  } catch { /* storage unavailable: start fresh */ }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      data: state.data, templateId: state.templateId, view: state.view, step: state.step,
    }));
  } catch { /* ignore */ }
}

// The photo is kept on the phone (IndexedDB) so closing the app by accident loses nothing.
const photoStore = {
  open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('pawpromo', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async run(mode, fn) {
    try {
      const db = await this.open();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('kv', mode);
        const req = fn(tx.objectStore('kv'));
        tx.oncomplete = () => resolve(req?.result);
        tx.onerror = () => reject(tx.error);
      });
    } catch { return undefined; }
  },
  get() { return this.run('readonly', (s) => s.get('photo')); },
  set(blob) { return this.run('readwrite', (s) => s.put(blob, 'photo')); },
  clear() { return this.run('readwrite', (s) => s.delete('photo')); },
};

const current = () => templates.find((t) => t.id === state.templateId) || templates[0];

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
  fontsFor(current()).then(() => requestAnimationFrame(() => {
    pending = false;
    drawMaster();
    copyToViews();
  }));
}
function drawMaster() {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  current().render(ctx, withDefaults(state.data), state.img, state.view);
  ctx.restore();
}
function copyToViews() {
  for (const c of $$('canvas[data-view]')) {
    if (!c.offsetParent) continue; // not on screen right now
    const v = c.getContext('2d');
    v.imageSmoothingQuality = 'high';
    v.clearRect(0, 0, c.width, c.height);
    v.drawImage(master, 0, 0, c.width, c.height);
  }
}

// Style thumbnails are only redrawn when the style step is showing.
let thumbsStale = true;
const thumbCanvas = document.createElement('canvas');
thumbCanvas.width = W;
thumbCanvas.height = H;
async function drawThumbs() {
  if (!thumbsStale || state.step !== 'style') return;
  thumbsStale = false;
  const tctx = thumbCanvas.getContext('2d');
  for (const t of templates) {
    const el = document.querySelector(`[data-thumb="${t.id}"]`);
    if (!el) continue;
    await fontsFor(t);
    await new Promise((r) => requestAnimationFrame(r)); // keep the screen responsive
    const keep = { ...photoLayout };
    tctx.save();
    tctx.clearRect(0, 0, W, H);
    t.render(tctx, withDefaults(state.data), state.img, { zoom: 1, panX: 0, panY: 0 });
    tctx.restore();
    Object.assign(photoLayout, keep);
    const c = el.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.clearRect(0, 0, el.width, el.height);
    c.drawImage(thumbCanvas, 0, 0, el.width, el.height);
  }
}

// ---------- steps ----------
/** Returns a short message if the user can't be on this step yet. */
function blockedReason(step) {
  const i = STEPS.indexOf(step);
  if (i >= 1 && !state.img) return { step: 'photo', msg: 'Add a photo first.' };
  if (i >= 3 && !state.data.name?.trim()) return { step: 'details', msg: "Please add the pet's name." };
  return null;
}

function goTo(step, { quiet = false } = {}) {
  const blocked = blockedReason(step);
  if (blocked) {
    if (!quiet) toast(blocked.msg);
    if (blocked.step === 'details') showNameError(true);
    step = blocked.step;
  }
  const changed = step !== state.step;
  state.step = step;
  save();
  for (const s of $$('.step')) s.hidden = s.dataset.step !== step;
  const idx = STEPS.indexOf(step);
  $$('#steps button').forEach((b, i) => {
    b.classList.toggle('current', i === idx);
    b.classList.toggle('done', i < idx);
    if (i === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
  });
  $('#backBtn').hidden = idx === 0;
  // The last step has its own buttons, so the bottom bar steps aside.
  $('#actionbar').hidden = step === 'share';
  document.body.classList.toggle('no-bar', step === 'share');
  const next = $('#nextBtn');
  next.textContent = step === 'details' ? 'See my promo' : 'Next';
  $('#newPet').hidden = !state.img && !state.data.name;
  if (step === 'share') resetShareHeading();
  if (changed) {
    window.scrollTo(0, 0);
    if (!quiet) document.querySelector(`.step[data-step="${step}"] h1`)?.focus({ preventScroll: true });
  }
  render();
  drawThumbs();
}

$('#nextBtn').addEventListener('click', () => {
  const i = STEPS.indexOf(state.step);
  if (state.step === 'photo' && !state.img) return toast('Add a photo first: tap one of the two buttons above.');
  if (state.step === 'details' && !state.data.name?.trim()) {
    showNameError(true);
    form.elements.name.focus();
    return;
  }
  goTo(STEPS[Math.min(i + 1, STEPS.length - 1)]);
});
$('#backBtn').addEventListener('click', () => goTo(STEPS[Math.max(STEPS.indexOf(state.step) - 1, 0)]));
$$('#steps button').forEach((b) => b.addEventListener('click', () => goTo(b.dataset.go)));
$('#anotherStyle').addEventListener('click', () => goTo('style'));
$('#editDetails').addEventListener('click', () => goTo('details'));

function showNameError(on) {
  $('#nameError').hidden = !on;
  form.elements.name.classList.toggle('invalid', on);
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
    const c = document.createElement('canvas');
    c.dataset.thumb = t.id;
    c.width = 216; c.height = 270;
    const label = document.createElement('span');
    label.textContent = t.name;
    b.append(c, label);
    b.addEventListener('click', () => selectTemplate(t.id));
    wrap.appendChild(b);
  }
  syncStylePicker();
}
function syncStylePicker() {
  $$('.style-tile').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === state.templateId)));
  $('#miniTitle').textContent = `${current().name} preview`;
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
  showNameError(false);
  checkLink();
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
      // A slider with a name the staff can change.
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
      nameInput.enterKeyHint = 'done';
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
    const caption = document.createElement('span');
    caption.textContent = f.label;
    label.appendChild(caption);
    let input;
    if (f.type === 'select') {
      input = document.createElement('select');
      for (const o of f.options) {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        input.appendChild(opt);
      }
      input.value = data[f.key];
    } else {
      input = document.createElement('input');
      input.placeholder = f.placeholder || '';
      input.maxLength = 90;
      input.enterKeyHint = 'done';
      if (f.inputmode) input.inputMode = f.inputmode;
      input.value = data[f.key] || '';
    }
    input.name = f.key;
    label.appendChild(input);
    box.appendChild(label);
  }
}

function onFieldChange(e) {
  const el = e.target;
  if (!el.name) return;
  state.data[el.name] = el.value;
  if (el.name === 'link') checkLink();
  if (el.name === 'name' && el.value.trim()) showNameError(false);
  thumbsStale = true;
  save();
  render();
}
form.addEventListener('input', onFieldChange);
form.addEventListener('change', onFieldChange);
form.addEventListener('submit', (e) => e.preventDefault());
// The keyboard's Enter key moves to the next box instead of doing something surprising.
form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA') return;
  e.preventDefault();
  const boxes = [...form.querySelectorAll('input:not([type="radio"]):not([type="range"]), textarea')];
  const next = boxes[boxes.indexOf(e.target) + 1];
  if (next && e.target.enterKeyHint !== 'done') next.focus(); else e.target.blur();
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
async function loadPhoto(file, { restore = false } = {}) {
  if (!file) return false;
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
    if (!restore) {
      state.view = { zoom: 1, panX: 0, panY: 0 };
      c.toBlob((blob) => blob && photoStore.set(blob), 'image/jpeg', 0.9);
    }
    $('#zoom').value = state.view.zoom;
    thumbsStale = true;
    showPhotoThumb();
    save();
    render();
    drawThumbs();
    return true;
  } catch {
    if (!restore) toast("Sorry, that photo couldn't be opened. Try another one.");
    return false;
  }
}

function showPhotoThumb() {
  const has = !!state.img;
  const thumb = $('#photoThumb');
  $('#photoCard').hidden = !has;
  $('#photoLead').textContent = has
    ? 'Looking good! Tap Next, or pick a different photo.'
    : "A clear, bright photo of the pet's face works best.";
  // Once there's a photo, Next is the one bold button, so a stray tap doesn't replace the photo.
  $('#cameraInput').closest('label').className = has ? 'btn secondary' : 'btn primary big';
  $('#libraryInput').closest('label').className = has ? 'btn secondary' : 'btn secondary big';
  $('#cameraLabel').textContent = has ? 'Retake the photo' : 'Take a photo';
  $('#libraryLabel').textContent = has ? 'Choose a different photo' : 'Choose from my photos';
  $('#newPet').hidden = !has && !state.data.name;
  if (!has) return;
  const img = state.img;
  const side = Math.min(img.width, img.height);
  const t = thumb.getContext('2d');
  t.imageSmoothingQuality = 'high';
  t.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, thumb.width, thumb.height);
}

for (const id of ['#cameraInput', '#libraryInput']) {
  $(id).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (await loadPhoto(file)) toast('Photo added. Tap Next.');
  });
}

// ---------- move & zoom (only inside the full preview, so scrolling never shifts the photo) ----------
const adjustCanvas = $('#adjustCanvas');
const pointers = new Map();
let pinchStart = null;
adjustCanvas.addEventListener('pointerdown', (e) => {
  if (!state.img) return;
  adjustCanvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: state.view.zoom };
  }
});
adjustCanvas.addEventListener('pointermove', (e) => {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  const now = { x: e.clientX, y: e.clientY };
  pointers.set(e.pointerId, now);
  if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    setZoom(pinchStart.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.dist));
    return;
  }
  const k = W / adjustCanvas.getBoundingClientRect().width; // screen px -> canvas px
  const { overflowX, overflowY } = photoLayout;
  if (overflowX > 0) state.view.panX = clamp(state.view.panX + (2 * (now.x - prev.x) * k) / overflowX, -1, 1);
  if (overflowY > 0) state.view.panY = clamp(state.view.panY + (2 * (now.y - prev.y) * k) / overflowY, -1, 1);
  render();
});
const endPointer = (e) => {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;
  save();
};
adjustCanvas.addEventListener('pointerup', endPointer);
adjustCanvas.addEventListener('pointercancel', endPointer);
adjustCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  setZoom(state.view.zoom * (e.deltaY < 0 ? 1.06 : 1 / 1.06));
}, { passive: false });

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function setZoom(z) {
  state.view.zoom = clamp(z, 1, 3);
  $('#zoom').value = state.view.zoom;
  save();
  render();
}
$('#zoom').addEventListener('input', (e) => setZoom(Number(e.target.value)));
$('#zoomIn').addEventListener('click', () => setZoom(state.view.zoom + 0.15));
$('#zoomOut').addEventListener('click', () => setZoom(state.view.zoom - 0.15));
$('#resetView').addEventListener('click', () => {
  state.view = { zoom: 1, panX: 0, panY: 0 };
  $('#zoom').value = 1;
  save();
  render();
});

function openAdjust() {
  $('#adjust').hidden = false;
  document.body.classList.add('locked');
  $('#zoom').value = state.view.zoom;
  render();
  $('#adjustDone').focus();
}
function closeAdjust() {
  $('#adjust').hidden = true;
  document.body.classList.remove('locked');
  thumbsStale = true;
  render();
}
$('#adjustBtn').addEventListener('click', openAdjust);
$('#miniPreview').addEventListener('click', openAdjust);
$('#adjustDone').addEventListener('click', closeAdjust);

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
  drawMaster(); // make sure the saved image has the very latest edits
  const blob = await new Promise((res) => master.toBlob(res, 'image/jpeg', 0.92));
  return new File([blob], fileName(), { type: 'image/jpeg' });
}

const canShareFiles = (() => {
  try {
    return !!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.jpg', { type: 'image/jpeg' })] });
  } catch { return false; }
})();
if (canShareFiles) {
  $('#shareBtn').hidden = false;
  $('#saveBtn').className = 'btn secondary';
}

function resetShareHeading() {
  $('#shareTitle').textContent = 'Ready to share!';
  $('#shareLead').textContent = canShareFiles
    ? 'Tap Share to post it to Facebook or save it to your photos.'
    : 'Tap Save image, then post it to Facebook.';
}
function celebrate(how) {
  $('#shareTitle').textContent = how === 'shared' ? 'Shared! 🎉' : 'Saved! 🎉';
  $('#shareLead').textContent = 'Want more? Try another style for this pet, or start a new pet.';
}

// One tap at a time: buttons are paused while the image is being made.
async function busy(btn, fn) {
  if (btn.disabled) return;
  btn.disabled = true;
  try { await fn(); } finally { btn.disabled = false; }
}

$('#shareBtn').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  try {
    const file = await makeFile();
    await navigator.share({ files: [file], title: state.data.name || 'Adopt me!' });
    celebrate('shared');
  } catch (err) {
    if (err?.name !== 'AbortError') toast("Couldn't open sharing. Try Save image instead.");
  }
}));

$('#saveBtn').addEventListener('click', (e) => busy(e.currentTarget, async () => {
  const file = await makeFile();
  const dl = await previewDownloads; // inside a claude.ai preview, saving goes through its own prompt
  if (dl) {
    try { await dl.save({ filename: file.name, data: file }); celebrate('saved'); }
    catch (err) { if (err?.code !== 'declined') toast("Couldn't save here. Try Share instead."); }
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
  celebrate('saved');
  toast('Saved. Look in your Downloads or Files.');
}));

// ---------- starting over (with a confirm, and an undo) ----------
function confirmSheet({ title, text, yes }) {
  return new Promise((resolve) => {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmYes').textContent = yes;
    const wrap = $('#confirm');
    wrap.hidden = false;
    document.body.classList.add('locked');
    const done = (answer) => {
      wrap.hidden = true;
      document.body.classList.remove('locked');
      $('#confirmYes').onclick = $('#confirmNo').onclick = wrap.onclick = null;
      resolve(answer);
    };
    $('#confirmYes').onclick = () => done(true);
    $('#confirmNo').onclick = () => done(false);
    wrap.onclick = (e) => { if (e.target === wrap) done(false); };
    $('#confirmNo').focus();
  });
}

async function startOver() {
  const ok = await confirmSheet({
    title: 'Start a new pet?',
    text: 'This clears the photo and details for this pet. Your adoption info and renamed stats are kept.',
    yes: 'Yes, start a new pet',
  });
  if (!ok) return;
  const snapshot = { data: { ...state.data }, img: state.img, view: { ...state.view }, templateId: state.templateId, step: state.step };
  const keep = { shelter: state.data.shelter };
  const sliderNames = new Set(templates.flatMap((t) => t.fields.map((f) => f.nameKey).filter(Boolean)));
  for (const k of Object.keys(state.data)) if (sliderNames.has(k)) keep[k] = state.data[k];
  state.data = keep;
  state.img = null;
  state.view = { zoom: 1, panX: 0, panY: 0 };
  thumbsStale = true;
  fillForm();
  buildExtraFields();
  showPhotoThumb();
  goTo('photo', { quiet: true });
  // The stored photo is only erased once the chance to undo has passed.
  const forget = setTimeout(() => { if (!state.img) photoStore.clear(); }, 9000);
  toast('Ready for the next pet.', {
    action: 'Undo',
    ms: 8000,
    onAction: () => {
      clearTimeout(forget);
      Object.assign(state, snapshot);
      thumbsStale = true;
      fillForm();
      syncStylePicker();
      buildExtraFields();
      showPhotoThumb();
      goTo(snapshot.step, { quiet: true });
      toast('Brought it back.');
    },
  });
}
$('#newPet').addEventListener('click', startOver);
$('#nextPet').addEventListener('click', startOver);

// ---------- toast ----------
let toastTimer;
function toast(msg, { action, onAction, ms = 3000 } = {}) {
  const t = $('#toast');
  $('#toastText').textContent = msg;
  const btn = $('#toastAction');
  btn.hidden = !action;
  btn.textContent = action || '';
  btn.onclick = action ? () => { t.classList.remove('show'); onAction(); } : null;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
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
if (isIOS) showTip('In Safari, tap the Share button, then "Add to Home Screen".', false);
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
async function start() {
  load();
  fillForm();
  buildStylePicker();
  buildExtraFields();
  showPhotoThumb();
  const wanted = state.step;
  goTo('photo', { quiet: true });
  // Pick up where they left off if a photo was in progress.
  const blob = await photoStore.get();
  if (blob && await loadPhoto(blob, { restore: true })) goTo(wanted, { quiet: true });
  document.documentElement.dataset.ready = '1';
}
start();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Handy for testing in a desktop browser.
window.pawPromo = { state, render, loadPhoto, goTo };
