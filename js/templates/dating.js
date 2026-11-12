import {
  W, H, drawQR, drawPhoto, roundRectPath, fillRoundRect, wrapLines, drawWrapped, countLines,
  fitSize, drawHeart, heartPath, drawPaw, listFrom, joinParts, seeded, hashString, sparkle, punch,
} from '../draw.js';

const F = (w, s) => `${w} ${s}px Fredoka, sans-serif`;
const PINK = '#ff4f7b';

export default {
  id: 'dating',
  name: 'Dating profile',
  emoji: '💘',
  blurb: 'Swipe right on true love',
  fonts: [F(700, 40), F(500, 40), F(600, 40)],
  fields: [
    { key: 'lookingFor', label: 'Looking for', placeholder: 'Someone to share the couch and the snacks' },
  ],

  render(ctx, d, img, view) {
    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#ff8fab');
    bg.addColorStop(0.55, '#ff6f91');
    bg.addColorStop(1, '#ffb36b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Soft glowing blobs, then floating hearts
    const rand = seeded(hashString((d.name || '') + 'match'));
    for (const [bx, by, br, col] of [[120, 180, 380, '255,220,120'], [980, 520, 420, '255,120,200'], [200, 1200, 460, '255,170,90'], [900, 1250, 300, '255,255,255']]) {
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `rgba(${col},0.38)`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    for (let i = 0; i < 22; i++) {
      const edge = rand() < 0.5;
      const x = edge ? (rand() < 0.5 ? rand() * 70 : W - rand() * 70) : rand() * W;
      const y = edge ? rand() * H : (rand() < 0.5 ? rand() * 120 : H - rand() * 140);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rand() - 0.5) * 0.9);
      ctx.fillStyle = `rgba(255,255,255,${0.14 + rand() * 0.22})`;
      drawHeart(ctx, 0, 0, 26 + rand() * 60);
      ctx.restore();
    }
    for (let i = 0; i < 9; i++) sparkle(ctx, rand() < 0.5 ? 14 + rand() * 40 : W - 14 - rand() * 40, 120 + rand() * 1150, 10 + rand() * 16);

    // App header
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = F(700, 58);
    const brand = 'pawmatch';
    const bw = ctx.measureText(brand).width;
    ctx.fillText(brand, W / 2 + 30, 92);
    drawPaw(ctx, W / 2 - bw / 2 - 18, 74, 46);

    // Card, with two more "profiles" peeking out behind it
    const cx = 60, cy = 128, cw = W - 120, cb = 1190;
    for (const [rot, alpha] of [[0.035, 0.35], [-0.03, 0.5]]) {
      ctx.save();
      ctx.translate(W / 2, (cy + cb) / 2);
      ctx.rotate(rot);
      ctx.shadowColor = 'rgba(120, 20, 60, 0.25)';
      ctx.shadowBlur = 24;
      fillRoundRect(ctx, -cw / 2, -(cb - cy) / 2, cw, cb - cy, 48, `rgba(255,255,255,${alpha})`);
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(120, 20, 60, 0.35)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    fillRoundRect(ctx, cx, cy, cw, cb - cy, 48, '#fff');
    ctx.restore();

    // Work out the text block below the photo so the photo can take the rest.
    const pad = 48, tw = cw - pad * 2;
    const bio = d.bio?.trim();
    const looking = d.lookingFor?.trim();
    const traits = listFrom(d.traits);
    ctx.font = F(500, 36);
    const bioLines = bio ? countLines(ctx, bio, tw, 3) : 0;
    const lookLines = looking ? countLines(ctx, looking, tw, 2) : 0;
    let textH = 40; // top padding
    if (bio) textH += 46 + bioLines * 46 + 18;
    if (looking) textH += 46 + lookLines * 46 + 18;
    if (traits.length) textH += 70;
    textH += 86; // room for the like buttons that sit on the card's edge
    const photoH = Math.max(560, cb - cy - textH);
    const py = cy, ph = photoH;

    drawPhoto(ctx, img, cx, py, cw, ph, view, [48, 48, 0, 0]);
    if (img) punch(ctx, cx, py, cw, ph, 0.22, 'soft-light');

    // Shade under name
    const shade = ctx.createLinearGradient(0, py + ph - 300, 0, py + ph);
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = shade;
    ctx.fillRect(cx, py + ph - 300, cw, 300);

    // Photo page dots
    for (let i = 0; i < 4; i++) {
      const dw = (cw - pad * 2 - 30) / 4;
      fillRoundRect(ctx, cx + pad + i * (dw + 10), py + 22, dw, 8, 4, i === 0 ? '#fff' : 'rgba(255,255,255,0.45)');
    }

    drawQR(ctx, d.link, cx + cw - pad - 190, py + 52, 190, { label: 'SCAN ME', fg: '#2b2235', labelColor: PINK });

    // "Adopt me" stamp, like the swipe-right stamp
    ctx.save();
    ctx.translate(cx + pad + 150, py + 130);
    ctx.rotate(-0.22);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#3ee08f';
    ctx.lineWidth = 9;
    roundRectPath(ctx, -150, -52, 300, 104, 16);
    ctx.stroke();
    ctx.fillStyle = '#3ee08f';
    ctx.textAlign = 'center';
    ctx.font = F(700, 62);
    ctx.fillText('ADOPT ME', 0, 22);
    ctx.restore();

    // Name, age
    ctx.textAlign = 'left';
    const name = d.name?.trim() || 'Your pet';
    const age = d.age?.trim();
    let nameText = age ? `${name}, ${age}` : name;
    let ageInDetails = false;
    let size = fitSize(ctx, nameText, tw - 70, 88, 44, (s) => F(700, s));
    if (age && ctx.measureText(nameText).width > tw - 70) {
      nameText = name;
      ageInDetails = true;
      size = fitSize(ctx, nameText, tw - 70, 88, 40, (s) => F(700, s));
    }
    ctx.font = F(700, size);
    ctx.fillStyle = '#fff';
    const nameY = py + ph - 92;
    ctx.fillText(nameText, cx + pad, nameY);
    // verified badge
    const nw = ctx.measureText(nameText).width;
    const bx = cx + pad + nw + 34, by = nameY - size * 0.34;
    ctx.fillStyle = '#3aa0ff';
    ctx.beginPath(); ctx.arc(bx, by, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(bx - 10, by + 1); ctx.lineTo(bx - 3, by + 9); ctx.lineTo(bx + 11, by - 8); ctx.stroke();

    // Details line
    const sex = d.sex === 'boy' ? 'Boy' : d.sex === 'girl' ? 'Girl' : '';
    ctx.font = F(500, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const details = joinParts([d.species, sex, ageInDetails && age, 'Lives nearby']);
    drawWrapped(ctx, details, cx + pad, py + ph - 40, tw, 40, 1);

    // Match pill above the name
    ctx.font = F(700, 28);
    const pillText = '100% MATCH';
    const pillW = ctx.measureText(pillText).width + 86;
    const pillY = nameY - size - 48;
    const pg = ctx.createLinearGradient(cx + pad, 0, cx + pad + pillW, 0);
    pg.addColorStop(0, '#ff4f7b'); pg.addColorStop(1, '#ff9a5a');
    fillRoundRect(ctx, cx + pad, pillY, pillW, 50, 25, pg);
    ctx.fillStyle = '#fff';
    drawHeart(ctx, cx + pad + 34, pillY + 27, 26);
    ctx.fillText(pillText, cx + pad + 60, pillY + 35);

    // Text block
    let y = py + ph + 40;
    const label = (t) => {
      ctx.font = F(700, 28);
      ctx.fillStyle = PINK;
      ctx.fillText(t.toUpperCase(), cx + pad, y + 28);
      y += 46;
    };
    if (bio) {
      label('About me');
      ctx.font = F(500, 36);
      ctx.fillStyle = '#3a2f3f';
      y += drawWrapped(ctx, bio, cx + pad, y + 32, tw, 46, 3) + 18;
    }
    if (looking) {
      label('Looking for');
      ctx.font = F(500, 36);
      ctx.fillStyle = '#3a2f3f';
      y += drawWrapped(ctx, looking, cx + pad, y + 32, tw, 46, 2) + 18;
    }
    if (traits.length) {
      ctx.font = F(600, 30);
      let x = cx + pad;
      for (const t of traits) {
        const w = ctx.measureText(t).width + 48;
        if (x + w > cx + cw - pad) break;
        roundRectPath(ctx, x, y, w, 54, 27);
        ctx.fillStyle = '#ffe8ee';
        ctx.fill();
        ctx.fillStyle = '#d6335c';
        ctx.fillText(t, x + 24, y + 38);
        x += w + 14;
      }
    }

    // Like / nope buttons on the card edge
    const btn = (x, r, draw) => {
      ctx.save();
      ctx.shadowColor = 'rgba(120, 20, 60, 0.3)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, cb, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      draw(x, cb, r);
    };
    btn(W / 2 - 150, 58, (x, y) => {
      ctx.strokeStyle = '#b9b0c0'; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 18, y - 18); ctx.lineTo(x + 18, y + 18);
      ctx.moveTo(x + 18, y - 18); ctx.lineTo(x - 18, y + 18); ctx.stroke();
    });
    btn(W / 2, 76, (x, y) => {
      const g = ctx.createLinearGradient(x - 40, y - 40, x + 40, y + 40);
      g.addColorStop(0, '#ff6f91'); g.addColorStop(1, '#ff3d6e');
      ctx.fillStyle = g;
      drawHeart(ctx, x, y + 4, 70);
    });
    btn(W / 2 + 150, 58, (x, y) => {
      ctx.fillStyle = '#ffb02e';
      drawStarSmall(ctx, x, y, 28);
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    const footer = d.shelter?.trim()
      ? `It's a match? ${d.shelter.trim()}`
      : "It's a match? Come meet me!";
    const fs = fitSize(ctx, footer, W - 100, 38, 24, (s) => F(600, s));
    ctx.font = F(600, fs);
    ctx.fillText(footer, W / 2, 1316);
  },
};

function drawStarSmall(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
