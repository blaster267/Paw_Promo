import {
  W, H, drawQR, drawPhoto, drawWrapped, fitSize, spacedText, joinParts, listFrom, kidWord,
  punch, grain, drawStar,
} from '../draw.js';

const B = (s) => `${s}px "Bebas Neue", Oswald, sans-serif`;
const O = (w, s) => `${w} ${s}px Oswald, sans-serif`;
const P = (s) => `italic 600 ${s}px "Playfair Display", serif`;

const GRADES = {
  blockbuster: { label: 'Blockbuster', tint: 'rgba(0, 90, 120, 0.28)', accent: '#ffc65c' },
  romance:     { label: 'Romance',     tint: 'rgba(255, 60, 120, 0.25)', accent: '#ffb3c9' },
  adventure:   { label: 'Adventure',   tint: 'rgba(255, 140, 20, 0.25)', accent: '#ffd36b' },
  classic:     { label: 'Classic black & white', tint: null, accent: '#f2f2f2', mono: true },
};

export default {
  id: 'poster',
  name: 'Movie poster',
  emoji: '🎬',
  blurb: 'Coming soon to a home near you',
  fonts: [B(40), O(400, 40), O(600, 40), P(40)],
  fields: [
    { key: 'tagline', label: 'Tagline', placeholder: 'This winter, one dog will steal your heart.' },
    { key: 'award', label: 'Award', placeholder: 'Best Belly Rubs' },
    {
      key: 'grade', label: 'Movie look', type: 'select', default: 'blockbuster',
      options: Object.entries(GRADES).map(([value, g]) => ({ value, label: g.label })),
    },
  ],

  render(ctx, d, img, view) {
    const g = GRADES[d.grade] || GRADES.blockbuster;
    const name = d.name?.trim() || 'Your pet';

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    drawPhoto(ctx, img, 0, 0, W, H, view);
    if (img) punch(ctx, 0, 0, W, H, 0.4);

    // Colour grade
    ctx.save();
    if (g.mono) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = g.tint;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    // Light leak from the corner and an anamorphic lens flare
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const leak = ctx.createRadialGradient(W, 180, 0, W, 180, 760);
    leak.addColorStop(0, g.mono ? 'rgba(255,255,255,0.45)' : 'rgba(255,170,80,0.55)');
    leak.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = leak;
    ctx.fillRect(0, 0, W, H);
    const fy = 372;
    const streak = ctx.createLinearGradient(0, fy - 26, 0, fy + 26);
    const sc = g.mono ? '235,235,255' : '120,200,255';
    streak.addColorStop(0, `rgba(${sc},0)`);
    streak.addColorStop(0.5, `rgba(${sc},0.5)`);
    streak.addColorStop(1, `rgba(${sc},0)`);
    ctx.fillStyle = streak;
    ctx.fillRect(0, fy - 26, W, 52);
    const core = ctx.createRadialGradient(W * 0.8, fy, 0, W * 0.8, fy, 190);
    core.addColorStop(0, 'rgba(255,255,255,0.75)');
    core.addColorStop(0.25, `rgba(${sc},0.35)`);
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Vignette + top and bottom shading for legibility
    const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
    const top = ctx.createLinearGradient(0, 0, 0, 330);
    top.addColorStop(0, 'rgba(0,0,0,0.75)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 330);
    const bot = ctx.createLinearGradient(0, H * 0.5, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)');
    bot.addColorStop(0.45, 'rgba(0,0,0,0.7)');
    bot.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, H * 0.5, W, H * 0.5);

    grain(ctx, 0, 0, W, H, 0.16);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 12;

    // Top credit + tagline
    ctx.font = O(500, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const studio = 'A SHELTER PICTURES PRODUCTION';
    spacedText(ctx, studio, W / 2, 70, 6, 'center');
    const tagline = d.tagline?.trim() ||
      `One ${kidWord(d.sex, 'good boy', 'good girl', 'little hero')}. One big heart. One chance to find home.`;
    ctx.font = P(46);
    ctx.fillStyle = '#fff';
    const tagH = drawWrapped(ctx, tagline, W / 2, 140, W - 180, 58, 2);

    // A glowing review
    const ry = 140 + tagH + 6;
    ctx.fillStyle = g.accent;
    for (let i = 0; i < 5; i++) drawStar(ctx, W / 2 - 250 + i * 30, ry - 9, 12);
    ctx.font = O(500, 24);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    spacedText(ctx, '"TWO PAWS UP!"  THE DAILY BARK', W / 2 - 86, ry, 2);
    ctx.textAlign = 'center';

    // Award laurel
    // Title: one big line, or two lines for long names
    const title = name.toUpperCase();
    let lines = [title];
    let tsize = fitSize(ctx, title, W - 110, 290, 90, B);
    const words = title.split(/\s+/);
    if (tsize < 180 && words.length > 1) {
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
        const sz = Math.min(fitSize(ctx, a, W - 110, 220, 70, B), fitSize(ctx, b, W - 110, 220, 70, B));
        if (!best || sz > best.sz) best = { sz, lines: [a, b] };
      }
      if (best.sz > tsize) { tsize = best.sz; lines = best.lines; }
    }
    const titleY = 1090;
    const titleTop = titleY - (lines.length - 1) * tsize * 0.86 - tsize * 0.72;
    const award = d.award?.trim();
    drawLaurel(ctx, W / 2, titleTop - 90, award ? 'WINNER' : 'OFFICIAL SELECTION', award || 'Shelter Film Festival', g.accent);

    ctx.font = B(tsize);
    ctx.shadowBlur = 30;
    lines.forEach((l, i) => {
      const ly = titleY - (lines.length - 1 - i) * tsize * 0.86;
      // metallic title: white fading into the poster's accent colour
      const metal = ctx.createLinearGradient(0, ly - tsize * 0.72, 0, ly);
      metal.addColorStop(0, '#ffffff');
      metal.addColorStop(0.55, '#ffffff');
      metal.addColorStop(1, g.accent);
      ctx.fillStyle = metal;
      spacedText(ctx, l, W / 2, ly, Math.round(tsize * 0.02), 'center');
    });
    ctx.shadowBlur = 8;

    // With a QR code, the lower text block shifts left to make room for it
    const hasQR = drawQR(ctx, d.link, W - 50 - 170, H - 50 - 199, 170, {
      label: 'SCAN ME', font: (s) => O(600, s), radius: 6,
    }) > 0;
    const bx = hasQR ? (W - 220) / 2 : W / 2;
    ctx.font = B(tsize);

    // Coming soon
    ctx.font = O(600, 38);
    ctx.fillStyle = g.accent;
    spacedText(ctx, 'COMING SOON TO A HOME NEAR YOU', bx, titleY + 62, hasQR ? 3 : 5, 'center');

    // Billing block (condensed, like real posters)
    ctx.shadowBlur = 0;
    const sex = d.sex === 'boy' ? 'A GOOD BOY' : d.sex === 'girl' ? 'A GOOD GIRL' : 'A TRUE STAR';
    const traits = listFrom(d.traits).slice(0, 4).map((t) => t.toUpperCase());
    const credits = joinParts([
      `${name.toUpperCase()} STARS AS ${sex}`,
      d.species && `BREED ${d.species.toUpperCase()}`,
      d.age && `AGE ${d.age.toUpperCase()}`,
      traits.length && `ALSO STARRING ${traits.join(', ')}`,
      d.bio && d.bio.toUpperCase(),
    ], '  ·  ');
    ctx.save();
    ctx.translate(bx, titleY + 112);
    ctx.scale(0.72, 1);
    ctx.font = O(400, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    drawWrapped(ctx, credits, 0, 0, (hasQR ? W - 330 : W - 200) / 0.72, 30, 2);
    ctx.restore();

    // Rating box (bottom left) + adopt line
    const by = H - 92;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(70, by, 280, 62);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(70, by, 62, 62);
    ctx.font = O(700, 46);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText('A', 101, by + 49);
    ctx.textAlign = 'left';
    ctx.font = O(600, 19);
    ctx.fillStyle = '#fff';
    ctx.fillText('RATED A FOR ADORABLE', 144, by + 26);
    ctx.font = O(400, 15);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Extreme cuteness, tail wags', 144, by + 49);

    const adopt = d.shelter?.trim() || 'Ask us about adopting today';
    ctx.textAlign = 'right';
    const asize = fitSize(ctx, adopt.toUpperCase(), hasQR ? W - 640 : W - 450, 30, 16, (s) => O(600, s));
    ctx.font = O(600, asize);
    ctx.fillStyle = '#fff';
    ctx.fillText(adopt.toUpperCase(), hasQR ? W - 250 : W - 70, by + 42);
  },
};

function drawLaurel(ctx, cx, cy, small, big, color) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.font = O(600, 34);
  const bigW = Math.min(440, Math.max(240, ctx.measureText(big.toUpperCase()).width));
  const R = 80;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(side, 1);
    // Left branch, drawn as a "(" around the text; the right one is mirrored.
    const ax = -(bigW / 2 + 30) + R * 0.75, ay = -4;
    for (let i = 0; i < 8; i++) {
      const t = ((-70 + i * 20) * Math.PI) / 180; // top to bottom
      const x = ax - Math.cos(t) * R;
      const y = ay + Math.sin(t) * R;
      const rot = Math.atan2(Math.cos(t), Math.sin(t)) - Math.PI / 2;
      for (const tilt of [-0.55, 0.55]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot + tilt);
        ctx.beginPath();
        ctx.ellipse(0, -11, 6.5, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }
  ctx.textAlign = 'center';
  ctx.font = O(500, 20);
  spacedText(ctx, small, cx, cy - 30, 4, 'center');
  const s = fitSize(ctx, big.toUpperCase(), bigW, 34, 20, (z) => O(600, z));
  ctx.font = O(600, s);
  ctx.fillText(big.toUpperCase(), cx, cy + 12);
  ctx.restore();
}
