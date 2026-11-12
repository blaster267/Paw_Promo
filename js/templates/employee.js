import {
  W, H, drawQR, drawPhoto, drawWrapped, fitSize, spacedText, joinParts, listFrom, drawStar,
  fillRoundRect, roundRectPath, confetti, punch, seeded, hashString, sparkle,
} from '../draw.js';

const O = (w, s) => `${w} ${s}px Oswald, sans-serif`;
const PB = (s) => `700 ${s}px "Playfair Display", Georgia, serif`;
const PI = (s) => `italic 600 ${s}px "Playfair Display", Georgia, serif`;
const GV = (s) => `${s}px "Great Vibes", cursive`;
const F = (w, s) => `${w} ${s}px Fredoka, sans-serif`;
const GOLD = '#e9c46a';

function goldGradient(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#fff1b8');
  g.addColorStop(0.3, '#d9a62e');
  g.addColorStop(0.55, '#fbe39a');
  g.addColorStop(0.8, '#b8861b');
  g.addColorStop(1, '#f5d77a');
  return g;
}

export default {
  id: 'employee',
  name: 'Employee of the month',
  emoji: '🏆',
  blurb: 'Top performer, every month',
  fonts: [O(700, 40), O(400, 40), PB(40), PI(40), GV(40), F(500, 40)],
  fields: [
    { key: 'jobTitle', label: 'Job title', placeholder: 'Chief Cuddle Officer' },
    { key: 'month', label: 'Month', placeholder: new Date().toLocaleString('en-US', { month: 'long' }) },
  ],

  render(ctx, d, img, view) {
    const name = d.name?.trim() || 'Your pet';

    // Navy wall with panel stripes
    const wall = ctx.createLinearGradient(0, 0, 0, H);
    wall.addColorStop(0, '#1d2b53');
    wall.addColorStop(1, '#0f1733');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x < W; x += 90) ctx.fillRect(x, 0, 45, H);
    const spot = ctx.createRadialGradient(W / 2, 480, 50, W / 2, 480, 700);
    spot.addColorStop(0, 'rgba(255,230,160,0.22)');
    spot.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, W, H);

    // Stage spotlights and a shower of confetti
    for (const side of [-1, 1]) {
      const sx = W / 2 + side * 520;
      const beam = ctx.createLinearGradient(sx, 0, W / 2 + side * 120, 760);
      beam.addColorStop(0, 'rgba(255,240,190,0.3)');
      beam.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(sx - 30, 0); ctx.lineTo(sx + 30, 0);
      ctx.lineTo(W / 2 + side * 40 + 260, 820); ctx.lineTo(W / 2 + side * 40 - 260, 820);
      ctx.closePath();
      ctx.fill();
    }
    const rand = seeded(hashString(name + 'party'));
    confetti(ctx, rand, 120, ['#e9c46a', '#ffffff', '#6ec5ff', '#ff6b81', '#fff1b8'], 0, 150, W, 840);

    // Header on a ribbon banner
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const rbx = 120, rby = 52, rbw = W - 240, rbh = 86;
    ctx.fillStyle = '#7a1024';
    for (const side of [-1, 1]) {
      const ex = side < 0 ? rbx : rbx + rbw;
      ctx.beginPath();
      ctx.moveTo(ex, rby + 18); ctx.lineTo(ex + side * 70, rby + 18);
      ctx.lineTo(ex + side * 44, rby + 18 + rbh / 2); ctx.lineTo(ex + side * 70, rby + 18 + rbh);
      ctx.lineTo(ex, rby + 18 + rbh);
      ctx.closePath();
      ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    const rib = ctx.createLinearGradient(0, rby, 0, rby + rbh);
    rib.addColorStop(0, '#d7263d'); rib.addColorStop(1, '#a3162c');
    ctx.fillStyle = rib;
    ctx.fillRect(rbx, rby, rbw, rbh);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,225,150,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rbx + 8, rby + 8, rbw - 16, rbh - 16);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = O(700, 54);
    spacedText(ctx, 'EMPLOYEE OF THE MONTH', W / 2, rby + 63, 5, 'center');
    ctx.fillStyle = GOLD;

    // Frame + photo
    const fx = 180, fy = 160, fw = W - 360, fh = 640;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = goldGradient(ctx, fx, fy, fw, fh);
    ctx.fillRect(fx, fy, fw, fh);
    ctx.restore();
    ctx.strokeStyle = 'rgba(90,60,10,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(fx + 16, fy + 16, fw - 32, fh - 32);
    // bevel: light on the top-left edges, shade on the bottom-right
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(fx, fy, fw, 5); ctx.fillRect(fx, fy, 5, fh);
    ctx.fillStyle = 'rgba(70,40,0,0.45)';
    ctx.fillRect(fx, fy + fh - 5, fw, 5); ctx.fillRect(fx + fw - 5, fy, 5, fh);
    drawPhoto(ctx, img, fx + 28, fy + 28, fw - 56, fh - 56, view);
    if (img) punch(ctx, fx + 28, fy + 28, fw - 56, fh - 56, 0.25, 'soft-light');
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(fx + 31, fy + 31, fw - 62, fh - 62);
    sparkle(ctx, fx + 14, fy + 14, 34);
    sparkle(ctx, fx + fw - 20, fy + fh - 18, 24);

    // Engraved name plate
    const px = 230, py = 830, pw = W - 460, ph = 130;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    fillRoundRect(ctx, px, py, pw, ph, 14, goldGradient(ctx, px, py, pw, ph));
    ctx.restore();
    roundRectPath(ctx, px + 10, py + 10, pw - 20, ph - 20, 8);
    ctx.strokeStyle = 'rgba(90,60,10,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#4b3206';
    const ns = fitSize(ctx, name, pw - 80, 64, 34, PB);
    ctx.font = PB(ns);
    ctx.fillText(name, W / 2, py + 76);
    const month = (d.month?.trim() || new Date().toLocaleString('en-US', { month: 'long' })).toUpperCase();
    ctx.font = O(400, 24);
    spacedText(ctx, `${month} ${new Date().getFullYear()}`, W / 2, py + 110, 5, 'center');

    // Job title
    const job = d.jobTitle?.trim() || 'Chief Cuddle Officer';
    ctx.fillStyle = '#fff';
    const js = fitSize(ctx, job, W - 200, 50, 28, PI);
    ctx.font = PI(js);
    ctx.fillText(job, W / 2, 1030);

    // Achievements
    const hasQR = !!d.link?.trim();
    const traits = listFrom(d.traits).slice(0, 3);
    const items = traits.length ? traits : [d.bio?.trim() || 'Greets every visitor with a wag'];
    const listW = 620, lx = 130;
    ctx.textAlign = 'left';
    ctx.font = F(500, 34);
    items.forEach((t, i) => {
      const y = 1090 + i * 52;
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.arc(lx + 18, y - 11, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1d2b53'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(lx + 10, y - 11); ctx.lineTo(lx + 16, y - 4); ctx.lineTo(lx + 27, y - 18); ctx.stroke();
      ctx.fillStyle = '#fff';
      drawWrapped(ctx, t, lx + 50, y, listW - 50, 40, 1);
    });

    // Signature + footer
    const sigX = 130;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = GV(52);
    ctx.fillText('The Management', sigX, 1268);
    ctx.fillStyle = 'rgba(233,196,106,0.7)';
    ctx.fillRect(sigX, 1282, 360, 2);
    const foot = d.shelter?.trim() || 'Now accepting adoption applications';
    ctx.fillStyle = GOLD;
    const fs = fitSize(ctx, foot, 620, 24, 14, (s) => O(400, s));
    ctx.font = O(400, fs);
    ctx.textAlign = 'left';
    ctx.fillText(foot, 130, 1320);

    if (hasQR) {
      drawQR(ctx, d.link, W - 80 - 200, 1075, 200, { label: 'SCAN ME', font: (s) => O(700, s), fg: '#1d2b53', labelColor: '#1d2b53', radius: 10 });
    } else {
      // gold seal
      ctx.save();
      ctx.translate(W - 170, 1180);
      // rosette ribbon tails
      for (const [dx, col] of [[-30, '#a3162c'], [30, '#d7263d']]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(dx - 26, 30); ctx.lineTo(dx + 26, 30);
        ctx.lineTo(dx + 34 + dx * 0.4, 150); ctx.lineTo(dx + dx * 0.4, 124); ctx.lineTo(dx - 34 + dx * 0.4, 150);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 14;
      ctx.fillStyle = goldGradient(ctx, -70, -70, 140, 140);
      ctx.beginPath();
      for (let i = 0; i < 40; i++) {
        const r = i % 2 ? 62 : 70;
        const a = (i * Math.PI) / 20;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#d7263d';
      ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,170,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 43, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = PB(46);
      ctx.fillText('#1', 0, 16);
      ctx.restore();
    }
  },
};
