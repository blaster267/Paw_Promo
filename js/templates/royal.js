import {
  W, H, drawQR, drawPhoto, drawWrapped, fitSize, spacedText, kidWord, roundRectPath,
  punch, grain, sparkle,
} from '../draw.js';

const C = (s) => `700 ${s}px Cinzel, Georgia, serif`;
const GV = (s) => `${s}px "Great Vibes", cursive`;
const PI = (s) => `italic 600 ${s}px "Playfair Display", Georgia, serif`;

function gold(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#fff0b3');
  g.addColorStop(0.25, '#c99a2e');
  g.addColorStop(0.5, '#ffe9a0');
  g.addColorStop(0.75, '#a87a18');
  g.addColorStop(1, '#f0d27a');
  return g;
}

export default {
  id: 'royal',
  name: 'Royal portrait',
  emoji: '👑',
  blurb: 'Fit for a king or queen',
  fonts: [C(40), GV(40), PI(40)],
  fields: [
    { key: 'royalTitle', label: 'Royal title', placeholder: 'Ruler of the Couch' },
  ],

  render(ctx, d, img, view) {
    const name = d.name?.trim() || 'Your pet';

    // Velvet background with a faint damask lattice
    const bg = ctx.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H * 0.45, 950);
    bg.addColorStop(0, '#7a1630');
    bg.addColorStop(1, '#2a0510');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,215,140,0.07)';
    for (let y = 0; y < H + 80; y += 80) {
      for (let x = (y / 80) % 2 ? 40 : 0; x < W + 80; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, y - 18); ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 18); ctx.lineTo(x - 12, y);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 40, y + 40, 3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Velvet curtains tied back in the top corners
    for (const side of [1, -1]) {
      ctx.save();
      if (side < 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(360, 0);
      ctx.bezierCurveTo(330, 230, 170, 430, 0, 600);
      ctx.closePath();
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 40;
      const folds = ctx.createLinearGradient(0, 0, 360, 0);
      for (let i = 0; i <= 8; i++) folds.addColorStop(i / 8, i % 2 ? '#b01e3c' : '#5a0c1d');
      ctx.fillStyle = folds;
      ctx.fill();
      ctx.restore();
      ctx.lineWidth = 12;
      ctx.strokeStyle = gold(ctx, 0, 0, 360, 600);
      ctx.beginPath();
      ctx.moveTo(360, 0);
      ctx.bezierCurveTo(330, 230, 170, 430, 0, 600);
      ctx.stroke();
      // tassel
      ctx.fillStyle = gold(ctx, 60, 470, 60, 120);
      ctx.beginPath(); ctx.arc(112, 500, 20, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(96, 512); ctx.lineTo(128, 512); ctx.lineTo(140, 600); ctx.lineTo(84, 600); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Ornate frame with an arched top
    const fx = 150, fy = 150, fw = W - 300, fh = 840;
    const arch = [fw / 2, fw / 2, 0, 0];
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 20;
    roundRectPath(ctx, fx, fy, fw, fh, arch);
    ctx.fillStyle = gold(ctx, fx, fy, fw, fh);
    ctx.fill();
    ctx.restore();
    for (const [inset, color, lw] of [[14, 'rgba(90,55,5,0.55)', 4], [30, 'rgba(255,245,200,0.6)', 3], [40, 'rgba(90,55,5,0.7)', 3]]) {
      roundRectPath(ctx, fx + inset, fy + inset, fw - inset * 2, fh - inset * 2, arch.map((r) => Math.max(0, r - inset)));
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    // Pearl beading all the way around the frame
    const bi = 22, br = fw / 2 - bi;
    const beads = [];
    for (let y = fy + fh - bi; y > fy + fw / 2; y -= 30) beads.push([fx + bi, y], [fx + fw - bi, y]);
    for (let x = fx + bi + 30; x < fx + fw - bi; x += 30) beads.push([x, fy + fh - bi]);
    for (let i = 0; i <= 26; i++) {
      // the arch is drawn with quadratic curves, so follow the same curve
      const t = i / 26, u = 1 - t;
      const lx = u * u * (fx + bi) + 2 * u * t * (fx + bi) + t * t * (fx + bi + br);
      const ly = u * u * (fy + bi + br) + 2 * u * t * (fy + bi) + t * t * (fy + bi);
      beads.push([lx, ly], [2 * (fx + fw / 2) - lx, ly]);
    }
    for (const [x, y] of beads) {
      ctx.fillStyle = 'rgba(90,55,5,0.5)';
      ctx.beginPath(); ctx.arc(x + 1, y + 2, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6d5';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    }
    const ix = fx + 48, iy = fy + 48, iw = fw - 96, ih = fh - 96;
    drawPhoto(ctx, img, ix, iy, iw, ih, view, [iw / 2, iw / 2, 0, 0]);
    // Warm, painterly glaze and inner shadow
    ctx.save();
    roundRectPath(ctx, ix, iy, iw, ih, [iw / 2, iw / 2, 0, 0]);
    ctx.clip();
    if (img) punch(ctx, ix, iy, iw, ih, 0.45);
    grain(ctx, ix, iy, iw, ih, 0.28); // canvas texture
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(170,110,40,0.55)';
    ctx.fillRect(ix, iy, iw, ih);
    ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(W / 2, iy + ih * 0.5, ih * 0.3, W / 2, iy + ih * 0.5, ih * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(30,10,0,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(ix, iy, iw, ih);
    ctx.restore();

    // Crown on top of the arch
    drawCrown(ctx, W / 2, fy - 8, 150);
    sparkle(ctx, W / 2, fy - 8 - 93, 34);
    sparkle(ctx, fx + 60, fy + fh - 40, 28);
    sparkle(ctx, fx + fw - 90, fy + 250, 22);

    // Titles
    const hasQR = !!d.link?.trim();
    const maxW = hasQR ? 600 : W - 180;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f3d37f';
    ctx.font = C(30);
    const honor = `${kidWord(d.sex, 'HIS', 'HER', 'THEIR')} ROYAL HIGHNESS`;
    const hw = spacedText(ctx, honor, W / 2, 1050, 6, 'center');
    for (const side of [-1, 1]) {
      const x0 = W / 2 + side * (hw / 2 + 26);
      ctx.fillRect(Math.min(x0, x0 + side * 110), 1038, 110, 3);
      ctx.save();
      ctx.translate(x0 + side * 124, 1039.5);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    }

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const ns = fitSize(ctx, name, maxW, 120, 56, GV);
    ctx.font = GV(ns);
    const ng = ctx.createLinearGradient(0, 1160 - ns * 0.7, 0, 1170);
    ng.addColorStop(0, '#fffbe8'); ng.addColorStop(0.5, '#ffe9a0'); ng.addColorStop(1, '#e0b045');
    ctx.fillStyle = ng;
    ctx.fillText(name, W / 2, 1160);
    ctx.shadowBlur = 0;

    const title = (d.royalTitle?.trim() || `${kidWord(d.sex, 'Duke', 'Duchess', 'Monarch')} of the Couch`).toUpperCase();
    ctx.fillStyle = '#f3d37f';
    const ts = fitSize(ctx, title, maxW, 36, 20, C);
    ctx.font = C(ts);
    ctx.fillText(title, W / 2, 1220);

    const decree = d.shelter?.trim() ? `By royal decree: ${d.shelter.trim()}` : 'Now receiving loyal subjects';
    ctx.fillStyle = 'rgba(255,240,210,0.85)';
    const ds = fitSize(ctx, decree, maxW, 30, 18, PI);
    ctx.font = PI(ds);
    ctx.fillText(decree, W / 2, 1290);

    drawQR(ctx, d.link, W - 36 - 165, H - 36 - 193, 165, {
      label: 'SCAN ME', font: C, fg: '#1a0408', labelColor: '#7a1630', bg: '#ffffff', radius: 8,
    });
  },
};

function drawCrown(ctx, cx, bottom, w) {
  const h = w * 0.62;
  const x = cx - w / 2, y = bottom - h;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(x, bottom);
  ctx.lineTo(x - 6, y + h * 0.25);
  ctx.lineTo(x + w * 0.25, y + h * 0.55);
  ctx.lineTo(cx, y);
  ctx.lineTo(x + w * 0.75, y + h * 0.55);
  ctx.lineTo(x + w + 6, y + h * 0.25);
  ctx.lineTo(x + w, bottom);
  ctx.closePath();
  ctx.fillStyle = gold(ctx, x, y, w, h);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#c99a2e';
  ctx.fillRect(x, bottom - 18, w, 18);
  const jewels = [[x - 6, y + h * 0.25, '#fff3c4'], [cx, y, '#fff3c4'], [x + w + 6, y + h * 0.25, '#fff3c4'],
    [cx, bottom - 40, '#d7263d'], [x + w * 0.25, bottom - 34, '#2a6fdb'], [x + w * 0.75, bottom - 34, '#2a9d5b']];
  for (const [jx, jy, c] of jewels) {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(jx, jy, 9, 0, Math.PI * 2); ctx.fill();
  }
}
