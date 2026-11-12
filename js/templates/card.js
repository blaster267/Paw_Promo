import {
  W, H, drawQR, drawPhoto, roundRectPath, fillRoundRect, drawWrapped, fitSize, drawPaw,
  drawStar, drawHeart, seeded, hashString, spacedText, joinParts, listFrom, rays, rainbow, sparkle, punch,
} from '../draw.js';

const L = (s) => `${s}px "Lilita One", sans-serif`;
const F = (w, s) => `${w} ${s}px Fredoka, sans-serif`;

// Card "types" each get their own colour scheme.
const TYPES = {
  cuddle:   { label: 'Cuddle',   a: '#ff8fb1', b: '#ff4f86', panel: '#fff0f5', ink: '#7a1238', icon: 'heart' },
  zoomies:  { label: 'Zoomies',  a: '#ffb547', b: '#ff6a2b', panel: '#fff5e8', ink: '#7a2d08', icon: 'bolt' },
  chill:    { label: 'Chill',    a: '#5fd6c4', b: '#1f9fae', panel: '#eafbf8', ink: '#0d4d55', icon: 'moon' },
  mischief: { label: 'Mischief', a: '#a98bff', b: '#6c47e8', panel: '#f3efff', ink: '#33197a', icon: 'star' },
  snack:    { label: 'Snack',    a: '#b6e05a', b: '#5aa832', panel: '#f3fbe6', ink: '#2c5214', icon: 'bone' },
};

export default {
  id: 'card',
  name: 'Trading card',
  emoji: '🃏',
  blurb: 'Ultra rare, must collect',
  fonts: [L(40), F(700, 40), F(600, 40), F(500, 40)],
  fields: [
    {
      key: 'cardType', label: 'Card type', type: 'select', default: 'cuddle',
      options: Object.entries(TYPES).map(([value, t]) => ({ value, label: t.label })),
    },
    { key: 'special', label: 'Special move', placeholder: 'Puppy Eyes: melts any heart within 50 feet' },
    { key: 'statCuddles', nameKey: 'statCuddlesName', label: 'Cuddles', type: 'range', min: 1, max: 10, default: 9 },
    { key: 'statZoomies', nameKey: 'statZoomiesName', label: 'Zoomies', type: 'range', min: 1, max: 10, default: 7 },
    { key: 'statSnacks', nameKey: 'statSnacksName', label: 'Snack drive', type: 'range', min: 1, max: 10, default: 10 },
    { key: 'cardNumber', label: 'Card number', placeholder: '001', inputmode: 'numeric' },
  ],

  render(ctx, d, img, view) {
    const t = TYPES[d.cardType] || TYPES.cuddle;
    const rand = seeded(hashString(d.name || 'x'));

    // Backdrop: dark with a glow and sparkles
    ctx.fillStyle = '#1b1530';
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 800);
    glow.addColorStop(0, t.a + 'aa');
    glow.addColorStop(1, 'rgba(27,21,48,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    rays(ctx, W / 2, H / 2, 1000, 36, 'rgba(255,255,255,0.07)', 0.1);
    for (let i = 0; i < 26; i++) {
      const x = rand() < 0.5 ? rand() * 70 : W - rand() * 70;
      sparkle(ctx, x, rand() * H, 6 + rand() * 18);
    }

    // Card body
    const cx = 78, cy = 34, cw = W - 156, ch = H - 68;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 18;
    const gold = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
    gold.addColorStop(0, '#fff3b0');
    gold.addColorStop(0.25, '#f2c94c');
    gold.addColorStop(0.5, '#fff6c8');
    gold.addColorStop(0.75, '#d9a520');
    gold.addColorStop(1, '#fbe08a');
    fillRoundRect(ctx, cx, cy, cw, ch, 44, gold);
    ctx.restore();
    // Holographic foil over the gold rim
    ctx.save();
    roundRectPath(ctx, cx, cy, cw, ch, 44);
    ctx.clip();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = rainbow(ctx, cx, cy, cx + cw, cy + ch * 0.6);
    ctx.fillRect(cx, cy, cw, ch);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 4;
    roundRectPath(ctx, cx + 5, cy + 5, cw - 10, ch - 10, 40);
    ctx.stroke();
    ctx.restore();

    // Inner panel with type colours
    const ix = cx + 26, iy = cy + 26, iw = cw - 52, ih = ch - 52;
    const panel = ctx.createLinearGradient(ix, iy, ix, iy + ih);
    panel.addColorStop(0, t.a);
    panel.addColorStop(1, t.b);
    fillRoundRect(ctx, ix, iy, iw, ih, 28, panel);
    // subtle diagonal shine stripes
    ctx.save();
    roundRectPath(ctx, ix, iy, iw, ih, 28);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let k = -ih; k < iw; k += 120) {
      ctx.beginPath();
      ctx.moveTo(ix + k, iy + ih); ctx.lineTo(ix + k + 50, iy + ih);
      ctx.lineTo(ix + k + 50 + ih, iy); ctx.lineTo(ix + k + ih, iy);
      ctx.fill();
    }
    ctx.restore();

    // Header: name + type emblem
    const name = d.name?.trim() || 'Your pet';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    const nsize = fitSize(ctx, name, iw - 200, 84, 34, L);
    ctx.font = L(nsize);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = t.ink;
    ctx.strokeText(name, ix + 34, iy + 100);
    const shine = ctx.createLinearGradient(0, iy + 100 - nsize, 0, iy + 104);
    shine.addColorStop(0, '#ffffff');
    shine.addColorStop(0.55, '#ffffff');
    shine.addColorStop(1, '#ffe9a8');
    ctx.fillStyle = shine;
    ctx.fillText(name, ix + 34, iy + 100);

    // Emblem
    const ex = ix + iw - 74, ey = iy + 70;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex, ey, 48, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = t.b; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = t.b;
    drawIcon(ctx, t.icon, ex, ey, 52);

    // Photo window
    const px = ix + 34, py = iy + 140, pw = iw - 68, ph = 560;
    // sunburst behind the photo frame so it pops off the card
    ctx.save();
    roundRectPath(ctx, ix, iy, iw, ih, 28);
    ctx.clip();
    rays(ctx, px + pw / 2, py + ph / 2, 900, 28, 'rgba(255,255,255,0.13)', -0.2);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    fillRoundRect(ctx, px - 12, py - 12, pw + 24, ph + 24, 22, gold);
    ctx.restore();
    drawPhoto(ctx, img, px, py, pw, ph, view, 14);
    if (img) punch(ctx, px, py, pw, ph, 0.25, 'soft-light');
    // holo shine across the photo corner
    ctx.save();
    roundRectPath(ctx, px, py, pw, ph, 14);
    ctx.clip();
    const holo = ctx.createLinearGradient(px, py, px + pw, py + ph);
    holo.addColorStop(0, 'rgba(255,255,255,0.35)');
    holo.addColorStop(0.18, 'rgba(255,255,255,0)');
    holo.addColorStop(0.82, 'rgba(255,255,255,0)');
    holo.addColorStop(1, 'rgba(255,255,255,0.25)');
    ctx.fillStyle = holo;
    ctx.fillRect(px, py, pw, ph);
    // rainbow foil bands, like a holo card catching the light
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = rainbow(ctx, px, py + ph, px + pw, py);
    ctx.fillRect(px, py, pw, ph);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    for (let i = 0; i < 7; i++) {
      const left = rand() < 0.5;
      sparkle(ctx, left ? px + rand() * 150 : px + pw - rand() * 150, py + (rand() < 0.5 ? rand() * 140 : ph - rand() * 140), 12 + rand() * 22);
    }
    ctx.restore();
    // "1st edition" foil stamp
    ctx.save();
    ctx.translate(px + 78, py + ph - 78);
    ctx.rotate(-0.2);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = gold;
    ctx.beginPath();
    for (let i = 0; i < 36; i++) {
      const r = i % 2 ? 52 : 60;
      ctx.lineTo(Math.cos((i * Math.PI) / 18) * r, Math.sin((i * Math.PI) / 18) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.font = L(40);
    ctx.fillText('1st', 0, 4);
    ctx.font = F(700, 17);
    ctx.fillText('EDITION', 0, 26);
    ctx.restore();
    drawQR(ctx, d.link, px + pw - 24 - 175, py + 24, 175, { label: 'SCAN ME', fg: t.ink, labelColor: t.ink });

    // Info ribbon
    const sex = d.sex === 'boy' ? 'Boy' : d.sex === 'girl' ? 'Girl' : '';
    const info = joinParts([d.species, sex, d.age]) || 'Adoptable';
    ctx.font = F(600, 30);
    const rw = Math.min(pw - 40, ctx.measureText(info).width + 70);
    const ry = py + ph - 4;
    fillRoundRect(ctx, ix + iw / 2 - rw / 2, ry - 6, rw, 52, 26, t.ink);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    drawWrapped(ctx, info, ix + iw / 2, ry + 31, rw - 40, 30, 1);

    // Stats box
    const sx = ix + 34, sy = ry + 74, sw = iw - 68;
    fillRoundRect(ctx, sx, sy, sw, 186, 22, t.panel);
    const stats = [
      [d.statCuddlesName?.trim() || 'Cuddles', d.statCuddles],
      [d.statZoomiesName?.trim() || 'Zoomies', d.statZoomies],
      [d.statSnacksName?.trim() || 'Snack drive', d.statSnacks],
    ];
    stats.forEach(([label, v], i) => {
      const val = Math.max(1, Math.min(10, Number(v) || 5));
      const y = sy + 48 + i * 52;
      ctx.textAlign = 'left';
      ctx.font = F(700, fitSize(ctx, label.toUpperCase(), 226, 30, 16, (s) => F(700, s)));
      ctx.fillStyle = t.ink;
      ctx.fillText(label.toUpperCase(), sx + 28, y + 11);
      const barX = sx + 270, barW = sw - 270 - 140;
      fillRoundRect(ctx, barX, y - 12, barW, 26, 13, 'rgba(0,0,0,0.08)');
      const bar = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      bar.addColorStop(0, t.a); bar.addColorStop(1, t.b);
      fillRoundRect(ctx, barX, y - 12, (barW * val) / 10, 26, 13, bar);
      ctx.textAlign = 'right';
      ctx.font = L(36);
      ctx.fillStyle = t.ink;
      ctx.fillText(val === 10 ? 'MAX' : String(val), sx + sw - 26, y + 13);
    });

    // Special move
    const my = sy + 206;
    const special = d.special?.trim() || d.bio?.trim() || listFrom(d.traits)[0] || 'Steals hearts on sight.';
    fillRoundRect(ctx, sx, my, sw, 150, 22, 'rgba(255,255,255,0.92)');
    ctx.textAlign = 'left';
    ctx.font = F(700, 24);
    ctx.fillStyle = t.b;
    spacedText(ctx, 'SPECIAL MOVE', sx + 28, my + 40, 3);
    ctx.font = F(500, 32);
    ctx.fillStyle = '#2d2433';
    drawWrapped(ctx, special, sx + 28, my + 84, sw - 56, 40, 2);

    // Footer: rarity + number + shelter
    const fy = iy + ih - 34;
    ctx.fillStyle = '#fff7c2';
    for (let i = 0; i < 5; i++) drawStar(ctx, ix + 50 + i * 36, fy - 10, 15);
    ctx.font = F(700, 24);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    spacedText(ctx, `ULTRA RARE · ${t.label.toUpperCase()} TYPE`, ix + 236, fy - 1, 2);
    ctx.textAlign = 'right';
    const num = String(d.cardNumber || '').trim() || String(1 + (hashString(name) % 199)).padStart(3, '0');
    ctx.font = L(30);
    ctx.fillText('#' + num.replace(/^#/, ''), ix + iw - 34, fy);
    const shelter = d.shelter?.trim() || 'Adoptable Edition';
    ctx.textAlign = 'center';
    ctx.font = F(600, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    const ssize = fitSize(ctx, shelter, iw - 80, 26, 18, (s) => F(600, s));
    ctx.font = F(600, ssize);
    ctx.fillText(shelter, ix + iw / 2, fy - 46);
  },
};

function drawIcon(ctx, kind, x, y, s) {
  if (kind === 'heart') return drawHeart(ctx, x, y + 3, s * 0.8);
  if (kind === 'star') return drawStar(ctx, x, y + 2, s * 0.5);
  if (kind === 'bolt') {
    ctx.beginPath();
    ctx.moveTo(x + s * 0.08, y - s * 0.48);
    ctx.lineTo(x - s * 0.3, y + s * 0.06);
    ctx.lineTo(x - s * 0.02, y + s * 0.06);
    ctx.lineTo(x - s * 0.1, y + s * 0.48);
    ctx.lineTo(x + s * 0.3, y - s * 0.08);
    ctx.lineTo(x + s * 0.02, y - s * 0.08);
    ctx.closePath();
    return ctx.fill();
  }
  if (kind === 'moon') {
    ctx.beginPath(); ctx.arc(x, y, s * 0.36, 0, Math.PI * 2); ctx.fill();
    const keep = ctx.fillStyle;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + s * 0.18, y - s * 0.12, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = keep;
    return;
  }
  if (kind === 'bone') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 4);
    const L2 = s * 0.32, r = s * 0.12;
    ctx.fillRect(-L2, -r * 0.7, L2 * 2, r * 1.4);
    for (const sx of [-L2, L2]) for (const sy of [-r * 0.8, r * 0.8]) {
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    return;
  }
  drawPaw(ctx, x, y, s * 0.6);
}
