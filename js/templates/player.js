import {
  W, H, drawQR, drawPhoto, drawWrapped, fitSize, joinParts, listFrom, seeded, hashString, drawStar,
  punch,
} from '../draw.js';

const PS = (s) => `${s}px "Press Start 2P", monospace`;
const CYAN = '#3df2ff', PINK = '#ff3df2', YEL = '#ffe14d';

const CLASSES = {
  tank:    'Snuggle Tank',
  scout:   'Speedy Scout',
  wizard:  'Nap Wizard',
  rogue:   'Treat Rogue',
  gremlin: 'Chaos Gremlin',
};

export default {
  id: 'player',
  name: 'Player select',
  emoji: '🎮',
  blurb: 'Choose your fighter',
  fonts: [PS(20)],
  fields: [
    {
      key: 'playerClass', label: 'Class', type: 'select', default: 'tank',
      options: Object.entries(CLASSES).map(([value, label]) => ({ value, label })),
    },
    { key: 'special', label: 'Special move', placeholder: 'Puppy Eyes: melts any heart within 50 feet' },
    { key: 'pSpeed', nameKey: 'pSpeedName', label: 'Speed', type: 'range', min: 1, max: 10, default: 7 },
    { key: 'pCute', nameKey: 'pCuteName', label: 'Cute', type: 'range', min: 1, max: 10, default: 10 },
    { key: 'pSnuggle', nameKey: 'pSnuggleName', label: 'Snuggle', type: 'range', min: 1, max: 10, default: 9 },
  ],

  render(ctx, d, img, view) {
    const name = (d.name?.trim() || 'Your pet').toUpperCase();
    const rand = seeded(hashString(name + 'p1'));
    ctx.imageSmoothingEnabled = true;

    // Night sky + neon grid floor
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b0620');
    sky.addColorStop(0.6, '#24104f');
    sky.addColorStop(1, '#3a0d4f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(rand() * W / 6) * 6, Math.floor(rand() * 700 / 6) * 6, 6, 6);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,61,242,0.35)';
    ctx.lineWidth = 3;
    const horizon = 860;
    for (let i = 0; i < 14; i++) {
      const y = horizon + Math.pow(i / 13, 2) * (H - horizon);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let i = -12; i <= 12; i++) {
      ctx.beginPath(); ctx.moveTo(W / 2 + i * 40, horizon); ctx.lineTo(W / 2 + i * 260, H); ctx.stroke();
    }
    ctx.restore();

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = PS(18);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('1UP 000100', 60, 46);
    ctx.textAlign = 'right';
    ctx.fillText('HI-SCORE 999999', W - 60, 46);
    ctx.textAlign = 'center';
    ctx.font = PS(54);
    ctx.fillStyle = CYAN;
    ctx.fillText('PLAYER SELECT', W / 2 - 5, 118);
    ctx.fillStyle = PINK;
    ctx.fillText('PLAYER SELECT', W / 2 + 6, 118 + 6);
    ctx.save();
    ctx.shadowColor = YEL;
    ctx.shadowBlur = 24;
    ctx.fillStyle = YEL;
    ctx.fillText('PLAYER SELECT', W / 2, 118);
    ctx.restore();

    // Photo with a chunky pixel frame
    const px = 150, py = 170, pw = W - 300, ph = 620;
    pixelFrame(ctx, px - 18, py - 18, pw + 36, ph + 36, CYAN);
    drawPhoto(ctx, img, px, py, pw, ph, view);
    if (img) punch(ctx, px, py, pw, ph, 0.45);
    // selection arrows either side
    ctx.save();
    ctx.shadowColor = YEL;
    ctx.shadowBlur = 20;
    ctx.fillStyle = YEL;
    for (const side of [-1, 1]) {
      const ax = W / 2 + side * 470, ay = py + ph / 2;
      ctx.beginPath();
      ctx.moveTo(ax + side * 34, ay); ctx.lineTo(ax - side * 14, ay - 44); ctx.lineTo(ax - side * 14, ay + 44);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // lives
    ctx.fillStyle = 'rgba(11,6,32,0.72)';
    ctx.fillRect(px + 16, py + ph - 76, 214, 60);
    const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
    for (let n = 0; n < 3; n++) {
      HEART.forEach((row, ry) => [...row].forEach((c, rx) => {
        if (c === '1') { ctx.fillStyle = PINK; ctx.fillRect(px + 34 + n * 64 + rx * 7, py + ph - 68 + ry * 7, 7, 7); }
      }));
      ctx.fillStyle = '#fff';
      ctx.fillRect(px + 34 + n * 64 + 7, py + ph - 68 + 7, 7, 7);
    }
    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = py; y < py + ph; y += 6) ctx.fillRect(px, y, pw, 2);
    // P1 tag
    ctx.fillStyle = PINK;
    ctx.fillRect(px - 18, py - 18, 120, 64);
    ctx.fillStyle = '#fff';
    ctx.font = PS(30);
    ctx.textAlign = 'left';
    ctx.fillText('P1', px + 4, py + 34);
    drawQR(ctx, d.link, px + pw - 20 - 175, py + 20, 175, { label: 'SCAN ME', font: PS, radius: 0, fg: '#0b0620', labelColor: '#0b0620' });

    // Name + class
    ctx.textAlign = 'center';
    const ns = fitSize(ctx, name, W - 160, 60, 24, PS);
    ctx.font = PS(ns);
    ctx.fillStyle = PINK;
    ctx.fillText(name, W / 2 + 5, 895);
    ctx.fillStyle = '#fff';
    ctx.fillText(name, W / 2, 890);
    const cls = CLASSES[d.playerClass] || CLASSES.tank;
    const sub = joinParts([`CLASS: ${cls}`, d.species, d.age], '  ').toUpperCase();
    const ss = fitSize(ctx, sub, W - 160, 22, 12, PS);
    ctx.font = PS(ss);
    ctx.fillStyle = CYAN;
    ctx.fillText(sub, W / 2, 940);

    // Stats
    const stats = [
      [d.pSpeedName?.trim() || 'Speed', d.pSpeed],
      [d.pCuteName?.trim() || 'Cute', d.pCute],
      [d.pSnuggleName?.trim() || 'Snuggle', d.pSnuggle],
    ].map(([label, v]) => [label.toUpperCase(), v]);
    ctx.textAlign = 'left';
    stats.forEach(([label, v], i) => {
      const val = Math.max(1, Math.min(10, Number(v) || 5));
      const y = 1000 + i * 52;
      ctx.font = PS(fitSize(ctx, label, 270, 24, 11, PS));
      ctx.fillStyle = '#fff';
      ctx.fillText(label, 150, y + 24);
      for (let k = 0; k < 10; k++) {
        const x = 440 + k * 49;
        const on = k < val;
        const col = k >= 8 ? PINK : k >= 5 ? YEL : CYAN;
        ctx.save();
        if (on) { ctx.shadowColor = col; ctx.shadowBlur = 16; }
        ctx.fillStyle = on ? col : 'rgba(255,255,255,0.12)';
        ctx.fillRect(x, y, 40, 28);
        ctx.restore();
        if (on) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x, y, 40, 6); }
      }
    });

    // Special move
    const special = d.special?.trim() || listFrom(d.traits)[0] || d.bio?.trim() || 'Puppy eyes';
    ctx.font = PS(20);
    ctx.fillStyle = YEL;
    ctx.fillText('SPECIAL:', 150, 1196);
    ctx.fillStyle = '#fff';
    const sw = ctx.measureText('SPECIAL: ').width;
    const lines = 2;
    drawWrapped(ctx, special.toUpperCase(), 150 + sw, 1196, W - 300 - sw, 32, lines);

    // Footer
    ctx.textAlign = 'center';
    if (d.shelter?.trim()) {
      ctx.fillStyle = CYAN;
      const fs = fitSize(ctx, d.shelter.trim().toUpperCase(), W - 120, 18, 10, PS);
      ctx.font = PS(fs);
      ctx.fillText(d.shelter.trim().toUpperCase(), W / 2, 1272);
    }
    ctx.font = PS(32);
    ctx.fillStyle = YEL;
    ctx.save();
    ctx.shadowColor = YEL;
    ctx.shadowBlur = 22;
    ctx.fillText('PRESS START TO ADOPT', W / 2, 1322);
    ctx.restore();
    ctx.fillStyle = '#fff';
    drawStar(ctx, 70, 1310, 14, 6, 4);
    drawStar(ctx, W - 70, 1310, 14, 6, 4);

    // CRT finish: faint scanlines and darkened corners over everything
    ctx.fillStyle = 'rgba(0,0,0,0.07)';
    for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
    const crt = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.8);
    crt.addColorStop(0, 'rgba(0,0,0,0)');
    crt.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = crt;
    ctx.fillRect(0, 0, W, H);
  },
};

function pixelFrame(ctx, x, y, w, h, color) {
  const s = 12; // step size for the notched corners
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + s * 2, y);
  ctx.lineTo(x + w - s * 2, y); ctx.lineTo(x + w - s * 2, y + s); ctx.lineTo(x + w - s, y + s);
  ctx.lineTo(x + w - s, y + s * 2); ctx.lineTo(x + w, y + s * 2);
  ctx.lineTo(x + w, y + h - s * 2); ctx.lineTo(x + w - s, y + h - s * 2); ctx.lineTo(x + w - s, y + h - s);
  ctx.lineTo(x + w - s * 2, y + h - s); ctx.lineTo(x + w - s * 2, y + h);
  ctx.lineTo(x + s * 2, y + h); ctx.lineTo(x + s * 2, y + h - s); ctx.lineTo(x + s, y + h - s);
  ctx.lineTo(x + s, y + h - s * 2); ctx.lineTo(x, y + h - s * 2);
  ctx.lineTo(x, y + s * 2); ctx.lineTo(x + s, y + s * 2); ctx.lineTo(x + s, y + s);
  ctx.lineTo(x + s * 2, y + s); ctx.closePath();
  ctx.fill();
  ctx.restore();
}
