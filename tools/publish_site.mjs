// Publish the marketing site from www/ (the working folder, with the full design-taste kit and its
// check history) to the repo root, which GitHub Pages serves. Only the files the page loads are
// copied: the kit is 37 MB and the page uses about 30 of its files.
// The demo app goes to demo/index.html (built by tools/build_app.py into app/dist/index.html).
//   node tools/publish_site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'www');

// Every local file index.html and credits.html request, recorded in a browser after scrolling the
// page, clicking each tab and opening the nav menu. Re-record it when the page gains a fragment,
// moment or effect.
const FILES = [
  'index.html', 'credits.html', 'favicon.svg', 'share.jpg',
  'brand/trueround-logo-horizontal.svg', 'brand/trueround-emblem.svg',
  'assets/system.css', 'assets/system.js',
  'assets/backgrounds/backgrounds.css', 'assets/backgrounds/backgrounds.js',
  'assets/effects/fx.js', 'assets/effects/grain-gradient/effect.js',
  'assets/icons/icon.css',
  'assets/img/mohammad-mortada.jpg', 'assets/img/photo-f133494819-500.jpg', 'assets/img/photo-f7805690-500.jpg',
  'assets/layout/layout.css', 'assets/layout/layout.js',
  'assets/moments/moments.js', 'assets/moments/lib.js', 'assets/moments/marquee-row/moment.css', 'assets/moments/marquee-row/moment.js',
  'assets/motion/motion.css', 'assets/motion/motion.js',
  'assets/ui/ui.js', 'assets/ui/base.css', 'assets/ui/cards.css',
  ...['window', 'doc', 'checklist', 'notify', 'toggles'].flatMap((n) => [`assets/ui/${n}/fragment.css`, `assets/ui/${n}/fragment.js`]),
];

for (const f of FILES) {
  const from = path.join(SRC, f), to = path.join(ROOT, f);
  if (!fs.existsSync(from)) throw new Error('missing in www/: ' + f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

const app = path.join(ROOT, 'app', 'dist', 'index.html');
fs.mkdirSync(path.join(ROOT, 'demo'), { recursive: true });
fs.copyFileSync(app, path.join(ROOT, 'demo', 'index.html'));
console.log(`published ${FILES.length} site files and demo/index.html`);
