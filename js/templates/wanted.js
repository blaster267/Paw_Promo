import {
  W, H, drawQR, drawPhoto, drawWrapped, fitSize, spacedText, joinParts, listFrom, seeded, hashString,
  grain, punch, drawStar,
} from '../draw.js';

const R = (s) => `${s}px Rye, Georgia, serif`;
const O = (w, s) => `${w} ${s}px Oswald, sans-serif`;
const P = (s) => `italic 600 ${s}px "Playfair Display", Georgia, serif`;
const INK = '#4a2a12';

export default {
  id: 'wanted',
  name: 'Wanted poster',
  emoji: '🤠',
  blurb: 'Wanted for stealing hearts',
  fonts: [R(40), O(600, 40), O(400, 40), P(40)],
  fields: [
    { key: 'crime', label: 'Wanted for', placeholder: 'Stealing hearts' },
    { key: 'reward', label: 'Reward', placeholder: 'A lifetime of belly rubs' },
  ],

  render(ctx, d, img, view) {
    const rand = seeded(hashString((d.name || '') + 'wanted'));

    // Weathered wood wall behind the poster
    const wood = ctx.createLinearGradient(0, 0, W, 0);
    wood.addColorStop(0, '#4b2d15'); wood.addColorStop(0.5, '#5c391c'); wood.addColorStop(1, '#40250f');
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 180) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x - 3, 0, 6, H);
      ctx.fillStyle = 'rgba(255,220,170,0.06)';
      ctx.fillRect(x + 3, 0, 3, H);
    }
    grain(ctx, 0, 0, W, H, 0.35, 'multiply');

    // Torn paper outline
    const edge = seeded(4242);
    const pts = [];
    const m = 26, step = 46;
    for (let x = m; x < W - m; x += step) pts.push([x, m + (edge() - 0.5) * 16]);
    for (let y = m; y < H - m; y += step) pts.push([W - m + (edge() - 0.5) * 16, y]);
    for (let x = W - m; x > m; x -= step) pts.push([x, H - m + (edge() - 0.5) * 16]);
    for (let y = H - m; y > m; y -= step) pts.push([m + (edge() - 0.5) * 16, y]);
    const paper = () => { ctx.beginPath(); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); };
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    paper();
    ctx.fillStyle = '#e9d3a6';
    ctx.fill();
    ctx.restore();
    ctx.save();
    paper();
    ctx.clip();

    // Parchment
    ctx.fillStyle = '#e9d3a6';
    ctx.fillRect(0, 0, W, H);
    const light = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 900);
    light.addColorStop(0, 'rgba(255,248,225,0.7)');
    light.addColorStop(0.7, 'rgba(200,160,100,0.1)');
    light.addColorStop(1, 'rgba(110,65,25,0.65)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(90,55,20,${0.04 + rand() * 0.1})`;
      ctx.beginPath();
      ctx.arc(rand() * W, rand() * H, 0.6 + rand() * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 4; i++) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, 'rgba(140,90,40,0.12)');
      g.addColorStop(1, 'rgba(140,90,40,0)');
      ctx.save();
      ctx.translate(rand() * W, rand() * H);
      ctx.scale(80 + rand() * 120, 60 + rand() * 90);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Scorched edges, fold creases and paper grain
    paper();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(95,50,12,0.28)';
    ctx.lineWidth = 90;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(50,22,4,0.45)';
    ctx.lineWidth = 26;
    ctx.stroke();
    for (const [x0, y0, x1, y1] of [[0, H * 0.5, W, H * 0.5], [W * 0.5, 0, W * 0.5, H]]) {
      ctx.strokeStyle = 'rgba(90,55,20,0.16)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,250,230,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0 + 3, y0 + 3); ctx.lineTo(x1 + 3, y1 + 3); ctx.stroke();
    }
    grain(ctx, 0, 0, W, H, 0.22, 'multiply');

    // Border and nails
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.strokeRect(58, 58, W - 116, H - 116);
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 70, W - 140, H - 140);
    for (const [x, y] of [[96, 96], [W - 96, 96], [96, H - 96], [W - 96, H - 96]]) {
      ctx.fillStyle = '#3a2410';
      ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(x - 3, y - 3, 4, 0, Math.PI * 2); ctx.fill();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;

    // WANTED
    const ws = fitSize(ctx, 'WANTED', W - 200, 230, 120, R);
    ctx.font = R(ws);
    ctx.fillText('WANTED', W / 2, 270);
    const crime = (d.crime?.trim() || 'Stealing hearts').toUpperCase();
    const cs = fitSize(ctx, 'FOR ' + crime, W - 220, 46, 26, (s) => O(600, s));
    ctx.font = O(600, cs);
    const cw = spacedText(ctx, 'FOR ' + crime, W / 2, 335, Math.round(cs * 0.15), 'center');
    if (cw < W - 330) {
      drawStar(ctx, W / 2 - cw / 2 - 40, 335 - cs * 0.38, 16);
      drawStar(ctx, W / 2 + cw / 2 + 40, 335 - cs * 0.38, 16);
    }

    // Photo, sepia toned
    const px = 180, py = 370, pw = W - 360, ph = 500;
    ctx.fillStyle = '#2d1a0b';
    ctx.fillRect(px - 10, py - 10, pw + 20, ph + 20);
    drawPhoto(ctx, img, px, py, pw, ph, view);
    if (img) punch(ctx, px, py, pw, ph, 0.55);
    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = 'rgba(150,105,55,0.85)';
    ctx.fillRect(px, py, pw, ph);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(240,215,170,0.6)';
    ctx.fillRect(px, py, pw, ph);
    ctx.globalCompositeOperation = 'source-over';
    const pv = ctx.createRadialGradient(px + pw / 2, py + ph / 2, ph * 0.35, px + pw / 2, py + ph / 2, ph * 0.85);
    pv.addColorStop(0, 'rgba(40,20,5,0)');
    pv.addColorStop(1, 'rgba(40,20,5,0.55)');
    ctx.fillStyle = pv;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    grain(ctx, px, py, pw, ph, 0.3);

    // Name and description
    const name = (d.name?.trim() || 'Your pet').toUpperCase();
    ctx.fillStyle = INK;
    const ns = fitSize(ctx, name, W - 220, 120, 54, R);
    ctx.font = R(ns);
    ctx.fillText(name, W / 2, 982);

    const alias = joinParts([d.species && `alias "The ${d.species.trim()}"`, d.age && `age ${d.age.trim()}`], '  ·  ');
    if (alias) {
      ctx.font = O(400, 32);
      drawWrapped(ctx, alias.toUpperCase(), W / 2, 1032, W - 220, 36, 1);
    }
    const traits = listFrom(d.traits);
    const known = traits.length ? `Known for ${traits.join(', ').toLowerCase()}.` : d.bio?.trim();
    if (known) {
      ctx.font = P(32);
      drawWrapped(ctx, known, W / 2, alias ? 1082 : 1060, W - 240, 40, 2);
    }

    // Reward
    ctx.font = R(54);
    ctx.fillText('REWARD', W / 2, 1192);
    drawStar(ctx, W / 2 - 210, 1173, 18);
    drawStar(ctx, W / 2 + 210, 1173, 18);
    const reward = d.reward?.trim() || 'A lifetime of belly rubs';
    const rs = fitSize(ctx, reward.toUpperCase(), W - 240, 40, 22, (s) => O(600, s));
    ctx.font = O(600, rs);
    ctx.fillText(reward.toUpperCase(), W / 2, 1238);

    const seen = d.shelter?.trim() ? `Last seen at ${d.shelter.trim()}` : 'Approach with treats';
    const ss = fitSize(ctx, seen, W - 240, 24, 16, (s) => O(400, s));
    ctx.font = O(400, ss);
    ctx.fillText(seen, W / 2, 1268);

    // Wear and tear: flecks of bare paper over the ink, plus two bullet holes
    for (let i = 0; i < 1100; i++) {
      ctx.fillStyle = `rgba(236,216,172,${0.35 + rand() * 0.4})`;
      ctx.beginPath();
      ctx.arc(80 + rand() * (W - 160), 90 + rand() * (H - 180), 0.6 + rand() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const [hx, hy] of [[124, 690], [962, 1090]]) {
      ctx.fillStyle = 'rgba(70,40,12,0.5)';
      ctx.beginPath(); ctx.arc(hx, hy, 21, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c0f05';
      ctx.beginPath(); ctx.arc(hx, hy, 13, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,5,0.7)';
      ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) {
        const a = k * 1.05 + hx;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(a) * 14, hy + Math.sin(a) * 14);
        ctx.lineTo(hx + Math.cos(a + 0.2) * (26 + (k % 3) * 9), hy + Math.sin(a + 0.2) * (26 + (k % 3) * 9));
        ctx.stroke();
      }
    }

    // QR code pinned to the photo's corner
    ctx.save();
    ctx.translate(px + pw - 70, py + ph - 120);
    ctx.rotate(-0.06);
    drawQR(ctx, d.link, -95, -95, 180, { label: 'SCAN ME', fg: '#2d1a0b', bg: '#f6ead0', font: (s) => O(600, s), radius: 4 });
    ctx.restore();
    ctx.restore(); // end of torn-paper clip
  },
};
