import {
  W, H, drawQR, drawPhoto, drawWrapped, wrapLines, fitSize, joinParts, listFrom,
  rays, halftone, punch, seeded, hashString,
} from '../draw.js';

const BG = (s) => `${s}px Bangers, Impact, sans-serif`;
const RED = '#e8262e', YEL = '#ffd21f', BLUE = '#1d5bd8', INK = '#111';

export default {
  id: 'comic',
  name: 'Comic cover',
  emoji: '💥',
  blurb: 'A superhero is born',
  fonts: [BG(40)],
  fields: [
    { key: 'heroName', label: 'Hero name', placeholder: 'Captain Floof' },
    { key: 'power', label: 'Superpower', placeholder: 'Super Snuggles' },
    { key: 'catchphrase', label: 'Speech bubble', placeholder: 'Adopt me, citizen!' },
  ],

  render(ctx, d, img, view) {
    const name = d.name?.trim() || 'Your pet';

    // Background: yellow with red halftone dots
    ctx.fillStyle = YEL;
    ctx.fillRect(0, 0, W, H);
    rays(ctx, W / 2, 620, 1200, 40, 'rgba(255,140,0,0.45)', 0.05);
    ctx.fillStyle = 'rgba(232,38,46,0.35)';
    for (let y = 0; y < H; y += 22) {
      for (let x = (y / 22) % 2 ? 11 : 0; x < W; x += 22) {
        const r = 2 + 5 * (y / H);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Issue box
    const box = (x, y, w, h, fill) => {
      ctx.fillStyle = INK; // hard comic-book drop shadow
      ctx.fillRect(x + 10, y + 10, w, h);
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = 8;
      ctx.strokeStyle = INK;
      ctx.strokeRect(x, y, w, h);
    };
    box(36, 36, 150, 150, '#fff');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    ctx.font = BG(30);
    ctx.fillText('ADOPT', 111, 78);
    ctx.font = BG(70);
    ctx.fillStyle = RED;
    ctx.fillText('#1', 111, 146);
    ctx.font = BG(24);
    ctx.fillStyle = INK;
    ctx.fillText('COMICS', 111, 174);

    // Title band
    box(204, 36, W - 240, 150, RED);
    ctx.save();
    ctx.beginPath(); ctx.rect(204, 36, W - 240, 150); ctx.clip();
    rays(ctx, 204 + (W - 240) / 2, 111, 700, 32, 'rgba(120,0,10,0.35)');
    ctx.restore();
    ctx.lineWidth = 8;
    ctx.strokeRect(204, 36, W - 240, 150);
    const hero = (d.heroName?.trim() || `The Amazing ${name}`).toUpperCase();
    ctx.save();
    ctx.translate(204 + (W - 240) / 2, 0);
    ctx.rotate(-0.02);
    const lines = fitTitle(ctx, hero, W - 300);
    ctx.lineJoin = 'round';
    lines.lines.forEach((l, i) => {
      const y = lines.lines.length === 1 ? 140 : 100 + i * (lines.size * 0.95);
      ctx.font = BG(lines.size);
      ctx.lineWidth = 12;
      ctx.strokeStyle = INK;
      ctx.strokeText(l, 6, y + 6);
      ctx.fillStyle = INK;
      ctx.fillText(l, 6, y + 6);
      ctx.strokeText(l, 0, y);
      ctx.fillStyle = YEL;
      ctx.fillText(l, 0, y);
    });
    ctx.restore();

    // Photo panel
    const px = 36, py = 206, pw = W - 72, ph = 840;
    ctx.fillStyle = INK;
    ctx.fillRect(px + 10, py + 10, pw, ph);
    drawPhoto(ctx, img, px, py, pw, ph, view);
    if (img) {
      // printed-comic look: punchy colours, Ben-Day dots in the corners
      punch(ctx, px, py, pw, ph, 0.7);
      punch(ctx, px, py, pw, ph, 0.3, 'soft-light');
    }
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    halftone(ctx, px, py, pw, ph, 'rgba(29,91,216,0.5)', 'bl', 20, 10, 0.55);
    halftone(ctx, px, py, pw, ph, 'rgba(232,38,46,0.45)', 'tr', 20, 10, 0.5);
    ctx.restore();
    // speed lines shooting in from the panel edges
    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    const sr = seeded(hashString(name + 'zoom'));
    const ccx = px + pw / 2, ccy = py + ph / 2;
    for (let i = 0; i < 90; i++) {
      const a = sr() * Math.PI * 2;
      const outer = 900, inner = 470 + sr() * 150;
      const wdt = 0.006 + sr() * 0.014;
      ctx.fillStyle = i % 3 ? 'rgba(17,17,17,0.85)' : 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(ccx + Math.cos(a) * inner, ccy + Math.sin(a) * inner * 1.15);
      ctx.lineTo(ccx + Math.cos(a - wdt) * outer, ccy + Math.sin(a - wdt) * outer * 1.15);
      ctx.lineTo(ccx + Math.cos(a + wdt) * outer, ccy + Math.sin(a + wdt) * outer * 1.15);
      ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth = 10;
    ctx.strokeStyle = INK;
    ctx.strokeRect(px, py, pw, ph);

    // Seal of approval
    ctx.save();
    ctx.translate(px + 26, py + ph - 26 - 150);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 124, 150);
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, 124, 150);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ['APPROVED', 'BY THE', 'CUDDLE', 'CODE'].forEach((l, i) => {
      ctx.font = BG(i === 2 || i === 3 ? 34 : 22);
      ctx.fillText(l, 62, [30, 54, 92, 128][i]);
    });
    ctx.restore();

    // POW starburst
    burst(ctx, 170, 330, 120, 86, YEL, 'POW!', -0.18);

    // Speech bubble
    const say = d.catchphrase?.trim() || 'Adopt me, citizen!';
    bubble(ctx, say, W - 60, 250);

    // QR sticker
    drawQR(ctx, d.link, px + pw - 30 - 180, py + ph - 30 - 211, 180, {
      label: 'SCAN ME', font: BG, radius: 0, shadow: false, fg: INK,
    }) && (ctx.lineWidth = 6, ctx.strokeStyle = INK, ctx.strokeRect(px + pw - 210, py + ph - 241, 180, 211));

    // Caption box
    box(36, 1066, W - 72, 168, '#fff7d6');
    ctx.textAlign = 'left';
    const power = (d.power?.trim() || 'Super snuggles').toUpperCase();
    const weakness = (listFrom(d.traits)[0] || 'Belly rubs').toUpperCase();
    ctx.font = BG(44);
    ctx.fillStyle = RED;
    ctx.fillText('SUPERPOWER:', 66, 1126);
    const pw1 = ctx.measureText('SUPERPOWER: ').width;
    ctx.fillStyle = INK;
    drawWrapped(ctx, power, 66 + pw1, 1126, W - 150 - pw1, 44, 1);
    ctx.fillStyle = BLUE;
    ctx.fillText('WEAKNESS:', 66, 1192);
    const pw2 = ctx.measureText('WEAKNESS: ').width;
    ctx.fillStyle = INK;
    drawWrapped(ctx, weakness, 66 + pw2, 1192, W - 150 - pw2, 44, 1);

    // Footer strip
    ctx.fillStyle = INK;
    ctx.fillRect(0, 1254, W, H - 1254);
    const foot = joinParts([`Starring ${name}`, d.species, d.age, d.shelter], '  ★  ').toUpperCase();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    const fs = fitSize(ctx, foot, W - 80, 40, 20, BG);
    ctx.font = BG(fs);
    ctx.fillText(foot, W / 2, 1318);
  },
};

function fitTitle(ctx, text, maxW) {
  let size = fitSize(ctx, text, maxW, 110, 40, BG);
  if (size >= 80) return { size, lines: [text] };
  const words = text.split(/\s+/);
  if (words.length < 2) return { size, lines: [text] };
  let best = { size, lines: [text] };
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const s = Math.min(fitSize(ctx, a, maxW, 64, 30, BG), fitSize(ctx, b, maxW, 64, 30, BG));
    if (s > best.size) best = { size: s, lines: [a, b] };
  }
  return best;
}

function burst(ctx, x, y, outer, inner, fill, text, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const r = i % 2 ? inner : outer * (0.85 + ((i * 7) % 5) * 0.05);
    const a = (i * Math.PI) / 12;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = BG(64);
  ctx.lineWidth = 8;
  ctx.strokeText(text, 0, 22);
  ctx.fillStyle = RED;
  ctx.fillText(text, 0, 22);
  ctx.restore();
}

function bubble(ctx, text, right, top) {
  ctx.font = BG(46);
  const lines = wrapLines(ctx, text.toUpperCase(), 360).slice(0, 3);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 90;
  const h = lines.length * 48 + 60;
  const cx = right - w / 2, cy = top + h / 2;
  ctx.save();
  const a0 = 1.65, a1 = 2.2; // where the tail leaves the bubble (bottom left)
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, a1, a0 + Math.PI * 2);
  ctx.lineTo(cx - w * 0.36, cy + h / 2 + 70);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, cx, cy - ((lines.length - 1) * 48) / 2 + i * 48 + 16));
  ctx.restore();
}
