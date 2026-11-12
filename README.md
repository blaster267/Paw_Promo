# Paw Promo

A phone-friendly web app that turns a photo of a shelter pet into a fun promo image for Facebook.

Take or choose a photo, type in the pet's details, pick a style, and save or share a 1080×1350 image. Optionally add a link and a scannable QR code appears on the promo.

**Styles:** dating profile, trading card, movie poster, wanted poster, magazine cover, comic cover, employee of the month, royal portrait, player select.

Everything runs in the browser. Photos and text never leave the phone, and there are no accounts or fees.

## Use it

Open https://blaster267.github.io/Paw_Promo/ on a phone, then:

- **iPhone:** in Safari, tap Share, then "Add to Home Screen".
- **Android:** in Chrome, tap "Install" (or the menu, then "Add to Home screen").

## How it's built

Plain HTML, CSS and JavaScript with no build step. Promos are drawn on a canvas.

- `index.html`, `app.css`, `js/app.js`: the app screen and form
- `js/draw.js`: shared drawing helpers (photo framing, text fitting, QR codes, effects)
- `js/templates/`: one file per style, registered in `js/templates/index.js`
- `sw.js`: offline support. Bump `VERSION` in it whenever files change so phones pick up the update.

To run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

QR codes use [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT). Fonts are from Google Fonts (SIL Open Font License).
