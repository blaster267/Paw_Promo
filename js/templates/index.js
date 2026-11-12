// Every promo style lives in its own file. To add a style, create a file that
// exports { id, name, emoji, blurb, fonts, fields, render } and list it here.
// Each render() draws the optional QR code (data.link) with drawQR() in a spot
// that suits its layout.
import dating from './dating.js';
import card from './card.js';
import poster from './poster.js';
import wanted from './wanted.js';
import magazine from './magazine.js';
import comic from './comic.js';
import employee from './employee.js';
import royal from './royal.js';
import player from './player.js';

export const templates = [dating, card, poster, wanted, magazine, comic, employee, royal, player];
