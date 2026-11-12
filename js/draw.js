// Shared drawing helpers used by every promo template.
import qrcode from './vendor/qrcode.js';

export const W = 1080;
export const H = 1350; // 4:5 portrait, the size Facebook shows largest in the feed

// Last photo layout, so the app can turn finger drags into pan amounts.
export const photoLayout = { overflowX: 0, overflowY: 0, scale: 1 };

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = typeof r === 'number' ? [r, r, r, r] : r; // tl, tr, br, bl
  ctx.beginPath();
  ctx.moveTo(x + rr[0], y);
  ctx.lineTo(x + w - rr[1], y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr[1]);
  ctx.lineTo(x + w, y + h - rr[2]);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr[2], y + h);
  ctx.lineTo(x + rr[3], y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr[3]);
  ctx.lineTo(x, y + rr[0]);
  ctx.quadraticCurveTo(x, y, x + rr[0], y);
  ctx.closePath();
}

export function fillRoundRect(ctx, x, y, w, h, r, fill) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * Draws the photo so it covers the box, honouring the user's zoom and pan.
 * view: { zoom: 1..3, panX: -1..1, panY: -1..1 }
 */
export function drawPhoto(ctx, img, x, y, w, h, view, radius = 0) {
  ctx.save();
  if (radius) roundRectPath(ctx, x, y, w, h, radius);
  else { ctx.beginPath(); ctx.rect(x, y, w, h); }
  ctx.clip();
  if (!img) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#e9dfd3');
    g.addColorStop(1, '#d4c6b6');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    drawPaw(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.18);
  } else {
    const iw = img.width, ih = img.height;
    const zoom = view?.zoom || 1;
    const scale = Math.max(w / iw, h / ih) * zoom;
    const dw = iw * scale, dh = ih * scale;
    const ox = dw - w, oy = dh - h;
    const dx = x - ox / 2 + (view?.panX || 0) * ox / 2;
    const dy = y - oy / 2 + (view?.panY || 0) * oy / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    photoLayout.overflowX = ox;
    photoLayout.overflowY = oy;
  }
  ctx.restore();
}

/** Splits text into lines that fit maxWidth with the current ctx.font. */
export function wrapLines(ctx, text, maxWidth) {
  const out = [];
  for (const para of String(text || '').split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
        // A single very long word: hard-break it.
        while (ctx.measureText(line).width > maxWidth && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut--;
          out.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/** Draws wrapped text, trimming with an ellipsis past maxLines. Returns height used. */
export function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
  let lines = wrapLines(ctx, text, maxWidth);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = last.replace(/[\s,.;:-]+$/, '') + '…';
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length * lineHeight;
}

export function countLines(ctx, text, maxWidth, maxLines = 99) {
  return Math.min(wrapLines(ctx, text, maxWidth).length, maxLines);
}

/** Largest font size (between min and max) at which text fits maxWidth on one line. */
export function fitSize(ctx, text, maxWidth, max, min, fontFn) {
  let size = max;
  ctx.font = fontFn(size);
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = fontFn(size);
  }
  return size;
}

/** Draws text with extra letter spacing (works in every browser). */
export function spacedText(ctx, text, x, y, spacing, align = 'left') {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
  return total;
}

export function heartPath(ctx, cx, cy, size) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.6, cy - s * 0.1, cx - s * 0.9, cy - s * 1.25, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.9, cy - s * 1.25, cx + s * 1.6, cy - s * 0.1, cx, cy + s * 0.9);
  ctx.closePath();
}

export function drawHeart(ctx, cx, cy, size) {
  heartPath(ctx, cx, cy, size);
  ctx.fill();
}

export function drawPaw(ctx, cx, cy, size) {
  const s = size;
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.28, s * 0.42, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes = [[-0.5, -0.18, -0.35], [-0.18, -0.48, -0.12], [0.18, -0.48, 0.12], [0.5, -0.18, 0.35]];
  for (const [tx, ty, rot] of toes) {
    ctx.beginPath();
    ctx.ellipse(cx + tx * s, cy + ty * s, s * 0.15, s * 0.2, rot, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawStar(ctx, cx, cy, outer, inner = outer * 0.45, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

/** Small seeded random so decorations stay put between redraws. */
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Splits "a, b; c" style input into a clean list. */
export function listFrom(text) {
  return String(text || '')
    .split(/[,;\n•]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "Boy"/"Girl" helpers for playful wording. */
export function kidWord(sex, boy = 'boy', girl = 'girl', other = 'pal') {
  if (sex === 'boy') return boy;
  if (sex === 'girl') return girl;
  return other;
}

/** Joins non-empty parts with a separator. */
export function joinParts(parts, sep = ' · ') {
  return parts.map((p) => String(p || '').trim()).filter(Boolean).join(sep);
}

// ---------- QR codes ----------
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
const qrCache = new Map();

/** Cleans up what staff type: "happytails.org/biscuit" becomes "https://happytails.org/biscuit". */
export function normalizeLink(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  return 'https://' + t.replace(/^\/+/, '');
}

function qrMatrix(text) {
  if (!qrCache.has(text)) {
    let qr = null;
    try {
      qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
    } catch {
      qr = null; // too long to encode
    }
    qrCache.set(text, qr);
  }
  return qrCache.get(text);
}

/**
 * Draws a scannable QR code on a white tile with a short caption under it.
 * (x, y) is the tile's top-left corner; size is the tile's width.
 * Returns the tile height, or 0 when there is no link.
 */
export function drawQR(ctx, link, x, y, size, opts = {}) {
  const url = normalizeLink(link);
  if (!url) return 0;
  const qr = qrMatrix(url);
  if (!qr) return 0;
  const {
    label = 'SCAN ME', bg = '#ffffff', fg = '#111111', labelColor = fg,
    radius = Math.round(size * 0.1), font = (s) => `700 ${s}px Fredoka, sans-serif`, shadow = true,
  } = opts;
  const n = qr.getModuleCount();
  const pad = Math.round(size * 0.09);
  const labelH = label ? Math.round(size * 0.17) : 0;
  const h = size + labelH;
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
  }
  fillRoundRect(ctx, x, y, size, h, radius, bg);
  ctx.restore();
  const inner = size - pad * 2;
  const cell = inner / n;
  ctx.save();
  ctx.fillStyle = fg;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // slight overlap avoids hairline gaps between modules
      if (qr.isDark(r, c)) ctx.fillRect(x + pad + c * cell, y + pad + r * cell, cell + 0.6, cell + 0.6);
    }
  }
  if (label) {
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const fs = fitSize(ctx, label, size - pad * 2, Math.round(labelH * 0.62), 10, font);
    ctx.font = font(fs);
    ctx.fillText(label, x + size / 2, y + size + labelH * 0.42);
  }
  ctx.restore();
  return h;
}

// ---------- effects ----------
let noiseTile = null;
function getNoise() {
  if (!noiseTile) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const id = x.createImageData(256, 256);
    const r = seeded(7);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.floor(r() * 255);
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    noiseTile = c;
  }
  return noiseTile;
}

/** Film grain / paper texture over a region. */
export function grain(ctx, x, y, w, h, alpha = 0.12, mode = 'overlay') {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = ctx.createPattern(getNoise(), 'repeat');
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Boosts contrast and colour of a region by blending it over itself. */
export function punch(ctx, x, y, w, h, amount = 0.4, mode = 'overlay') {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = mode;
  ctx.drawImage(ctx.canvas, x, y, w, h, x, y, w, h);
  ctx.restore();
}

/** A glowing four-point sparkle. */
export function sparkle(ctx, x, y, r, color = '#ffffff') {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.12 : r;
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Alternating wedges radiating from a point (sunburst). Clip first if needed. */
export function rays(ctx, cx, cy, radius, count, color, rot = 0) {
  ctx.save();
  ctx.fillStyle = color;
  const step = (Math.PI * 2) / count;
  for (let i = 0; i < count; i += 2) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, rot + i * step, rot + (i + 1) * step);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Halftone dots that grow toward one corner of the box. corner: 'tl' | 'tr' | 'bl' | 'br'. */
export function halftone(ctx, x, y, w, h, color, corner = 'br', step = 18, maxR = 9, reach = 0.75) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = color;
  const ox = corner.includes('r') ? x + w : x;
  const oy = corner.includes('b') ? y + h : y;
  const far = Math.hypot(w, h) * reach;
  let row = 0;
  for (let py = y; py <= y + h; py += step, row++) {
    for (let px = x + (row % 2 ? step / 2 : 0); px <= x + w; px += step) {
      const t = 1 - Math.hypot(px - ox, py - oy) / far;
      if (t <= 0.02) continue;
      ctx.beginPath();
      ctx.arc(px, py, maxR * t, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A pastel rainbow gradient, handy for holographic foil. */
export function rainbow(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const cols = ['#ff8ad4', '#ffd36e', '#b8ff8a', '#7afcff', '#9d8cff', '#ff8ad4', '#ffd36e', '#7afcff'];
  cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
  return g;
}

/** Scatter of little rectangles and circles. */
export function confetti(ctx, rand, count, colors, x, y, w, h) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const px = x + rand() * w, py = y + rand() * h;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rand() * Math.PI);
    ctx.globalAlpha = 0.55 + rand() * 0.45;
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    const s = 8 + rand() * 12;
    if (rand() < 0.3) { ctx.beginPath(); ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(-s / 2, -s / 5, s, s / 2.5);
    ctx.restore();
  }
  ctx.restore();
}
