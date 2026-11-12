import {
  W, H, drawQR, drawPhoto, drawWrapped, fitSize, spacedText, joinParts, listFrom,
  punch,
} from '../draw.js';

const A = (s) => `${s}px "Abril Fatface", Georgia, serif`;
const O = (w, s) => `${w} ${s}px Oswald, sans-serif`;
const PB = (s) => `700 ${s}px "Playfair Display", Georgia, serif`;
const PI = (s) => `italic 600 ${s}px "Playfair Display", Georgia, serif`;

const COLORS = {
  red:    { label: 'Classic red', accent: '#e4002b' },
  pink:   { label: 'Hot pink',    accent: '#ff2e88' },
  yellow: { label: 'Sunny yellow', accent: '#ffd400' },
  teal:   { label: 'Teal',        accent: '#19d3c5' },
};

export default {
  id: 'magazine',
  name: 'Magazine cover',
  emoji: '📰',
  blurb: 'Cover star of the month',
  fonts: [A(40), O(400, 40), O(700, 40), PB(40), PI(40)],
  fields: [
    { key: 'magName', label: 'Magazine name', placeholder: 'PAWS' },
    { key: 'headline', label: 'Headline', placeholder: 'Ready for a forever home' },
    {
      key: 'magColor', label: 'Cover color', type: 'select', default: 'red',
      options: Object.entries(COLORS).map(([value, c]) => ({ value, label: c.label })),
    },
  ],

  render(ctx, d, img, view) {
    const accent = (COLORS[d.magColor] || COLORS.red).accent;
    const name = d.name?.trim() || 'Your pet';
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, W, H);
    drawPhoto(ctx, img, 0, 0, W, H, view);
    if (img) punch(ctx, 0, 0, W, H, 0.35);
    // glossy cover sheen
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const sheen = ctx.createLinearGradient(0, H * 0.15, W, H * 0.75);
    sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.47, 'rgba(255,255,255,0.16)');
    sheen.addColorStop(0.53, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    sheen.addColorStop(0.75, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const top = ctx.createLinearGradient(0, 0, 0, 420);
    top.addColorStop(0, 'rgba(0,0,0,0.45)');
    top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 420);
    const bot = ctx.createLinearGradient(0, H * 0.55, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)');
    bot.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    const left = ctx.createLinearGradient(0, 0, 460, 0);
    left.addColorStop(0, 'rgba(0,0,0,0.4)');
    left.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = left;
    ctx.fillRect(0, 300, 460, 600);

    // Print details: accent bars top and bottom, and a fine keyline
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 14);
    ctx.fillRect(0, H - 14, W, 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;

    // Issue line + masthead
    const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    ctx.font = O(400, 24);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    spacedText(ctx, 'THE ADOPTION ISSUE', 60, 62, 4);
    ctx.textAlign = 'right';
    spacedText(ctx, month, W - 60, 62, 4, 'right');
    const mag = (d.magName?.trim() || 'PAWS').toUpperCase();
    const ms = fitSize(ctx, mag, W - 110, 270, 90, A);
    ctx.font = A(ms);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.fillText(mag, W / 2, 70 + ms * 0.8);

    // Left cover lines
    let y = 110 + ms * 0.8 + 40;
    ctx.textAlign = 'left';
    const line = (kicker, text, size = 42) => {
      ctx.font = O(700, 24);
      const kw = ctx.measureText(kicker).width + kicker.length * 3 + 20;
      ctx.shadowBlur = 0;
      ctx.fillStyle = accent;
      ctx.fillRect(56, y - 26, kw, 34);
      ctx.fillStyle = accent === '#ffd400' || accent === '#19d3c5' ? '#111' : '#fff';
      spacedText(ctx, kicker, 66, y, 3);
      ctx.shadowBlur = 10;
      y += size + 14;
      ctx.font = O(700, size);
      ctx.fillStyle = '#fff';
      y += drawWrapped(ctx, text.toUpperCase(), 60, y, 380, size + 4, 2) + 24;
    };
    line('EXCLUSIVE', `${name} tells all`);
    const traits = listFrom(d.traits).slice(0, 3);
    const kickers = ['THE TRUTH ABOUT', 'INSIDE', 'WHY EVERYONE LOVES'];
    traits.forEach((t, i) => line(kickers[i], t, 38));

    // Starburst badge
    const bx = W - 150, by = 110 + ms * 0.8 + 130;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(0.2);
    ctx.fillStyle = accent;
    ctx.beginPath();
    for (let i = 0; i < 32; i++) {
      const r = i % 2 ? 92 : 108;
      const a = (i * Math.PI) / 16;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = accent === '#ffd400' ? '#111' : '#fff';
    ctx.textAlign = 'center';
    ctx.font = O(700, 30);
    ctx.fillText('ADOPT', 0, -8);
    ctx.font = O(700, 40);
    ctx.fillText('ME!', 0, 34);
    ctx.restore();

    // Bottom: big name + headline
    const hasQR = !!d.link?.trim();
    const textW = hasQR ? W - 120 - 230 : W - 120;
    ctx.textAlign = 'left';
    ctx.shadowBlur = 16;
    const ns = fitSize(ctx, name, textW, 170, 70, PB);
    // "Cover star" tag above the name
    const onAccent = accent === '#ffd400' || accent === '#19d3c5' ? '#111' : '#fff';
    ctx.font = O(700, 26);
    const tagW = ctx.measureText('COVER STAR').width + 9 * 4 + 28;
    const tagY = 1110 - ns * 0.76 - 52;
    ctx.shadowBlur = 0;
    ctx.fillStyle = accent;
    ctx.fillRect(60, tagY, tagW, 40);
    ctx.fillStyle = onAccent;
    spacedText(ctx, 'COVER STAR', 74, tagY + 29, 4);
    ctx.shadowBlur = 16;
    ctx.font = PB(ns);
    ctx.fillStyle = '#fff';
    ctx.fillText(name, 60, 1110);

    // Pull quote from the bio, on the right
    const bio = d.bio?.trim();
    if (bio) {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 14;
      ctx.font = A(150);
      ctx.fillStyle = accent;
      ctx.fillText('\u201C', W - 56, 760);
      ctx.font = PI(32);
      ctx.fillStyle = '#fff';
      drawWrapped(ctx, bio, W - 60, 800, 330, 42, 4);
      ctx.restore();
    }
    const headline = d.headline?.trim() || 'Ready for a forever home';
    ctx.font = PI(46);
    drawWrapped(ctx, headline, 60, 1170, textW, 54, 2);
    ctx.shadowBlur = 0;
    const info = joinParts([d.species, d.age, d.shelter], '  ·  ');
    if (info) {
      ctx.fillStyle = accent;
      const is = fitSize(ctx, info.toUpperCase(), textW, 26, 16, (s) => O(700, s));
      ctx.font = O(700, is);
      ctx.fillText(info.toUpperCase(), 60, 1300);
    }

    // QR code in the corner, when there's a link
    drawQR(ctx, d.link, W - 50 - 200, H - 50 - 234, 200, { label: 'SCAN ME', font: (s) => O(700, s), radius: 4 });
  },
};
