// Gate banner: a wooden garden arch with climbing roses and hanging name boards.
import { rng } from '../rng.mjs';
import { PAL, f1, doc, compose, lit, sign, lantern, firefly, star, lavender, flower, rose, tuft, picket, grain, board, nail, E, Ci, L, leaf } from './kit.mjs';

const W = 1080, H = 280;
const ARCH = { x0: 246, x1: 834, y: 80, cy: -34 }; // quadratic arch over the beam
const archAt = t => { const u = 1 - t; return [u * u * ARCH.x0 + 2 * u * t * 540 + t * t * ARCH.x1, u * u * ARCH.y + 2 * u * t * ARCH.cy + t * t * ARCH.y]; };

function ground(r) {
  let o = `<path d="M44 252 Q50 240 70 241 L1010 241 Q1032 241 1036 252 L1036 262 Q1032 270 1012 270 L68 270 Q48 270 44 262 Z" fill="url(#lawn)"/>`;
  o += `<path d="M44 260 Q48 270 68 270 L1012 270 Q1032 270 1036 260 L1036 266 Q1032 277 1012 277 L68 277 Q48 277 44 266 Z" fill="#8a6a44"/>`;
  o += `<path d="M452 243 L628 243 L676 277 L404 277 Z" fill="#b9a27a"/><path d="M455 243 L625 243 L671 274 L409 274 Z" fill="url(#gravel)"/>`;
  for (let i = 0; i < 160; i++) { const t = r(), y = 245 + t * 28, half = 86 + t * 44; o += Ci(540 + (r() * 2 - 1) * half * 0.95, y, 0.6 + r() * 0.9, ['#c9b48c', '#f4ead4', '#b8a17a', '#e0cfa8'][i % 4]); }
  for (let i = 0; i < 90; i++) { const x = 56 + r() * 968; if (x > 400 && x < 680) continue; o += tuft(x, 244 + r() * 22, r() > 0.5 ? '#6aa944' : '#8fcb62'); }
  return o;
}

function fence() {
  let o = '';
  for (const [a, b] of [[50, 258], [826, 1030]]) {
    o += `<rect x="${a}" y="212" width="${b - a}" height="5" fill="#e8e0cf"/><rect x="${a}" y="232" width="${b - a}" height="5" fill="#e8e0cf"/>`;
    for (let x = a; x <= b - 10; x += 19) o += picket(x, 250, 52);
  }
  return o;
}

function arch(r) {
  let o = `<clipPath id="lat"><path d="M${ARCH.x0} ${ARCH.y} Q540 ${ARCH.cy} ${ARCH.x1} ${ARCH.y} Z"/></clipPath>`;
  let lat = '';
  for (let x = 120; x < 960; x += 24) lat += L(x, 84, x + 80, -6, '#7a5233', 3) + L(x + 80, 84, x, -6, '#7a5233', 3);
  for (let x = 120; x < 960; x += 24) lat += L(x, 82, x + 80, -8, PAL.woodLight, 2.2) + L(x + 80, 82, x, -8, PAL.woodLight, 2.2);
  o += `<g clip-path="url(#lat)">${lat}</g>`;
  o += `<path d="M${ARCH.x0} ${ARCH.y} Q540 ${ARCH.cy} ${ARCH.x1} ${ARCH.y}" stroke="${PAL.woodEnd}" stroke-width="15" fill="none"/>`;
  o += `<path d="M${ARCH.x0} ${ARCH.y - 2} Q540 ${ARCH.cy - 2} ${ARCH.x1} ${ARCH.y - 2}" stroke="${PAL.wood}" stroke-width="9" fill="none"/>`;
  o += `<path d="M${ARCH.x0 + 10} ${ARCH.y - 6} Q540 ${ARCH.cy - 6} ${ARCH.x1 - 10} ${ARCH.y - 6}" stroke="#c9a070" stroke-width="2" fill="none" opacity=".7"/>`;
  // posts
  for (const x of [262, 794]) {
    o += E(x + 14, 251, 22, 4, '#000', 'opacity=".18"');
    o += `<rect x="${x}" y="98" width="24" height="153" fill="url(#woodV)"/><path d="M${x + 24} 98 L${x + 31} 92 L${x + 31} 246 L${x + 24} 251 Z" fill="${PAL.woodEnd}"/>`;
    o += grain(x, 110, 24, 130, r, 3);
  }
  // beam: top, front, end grain
  o += `<path d="M228 78 L852 78 L860 71 L236 71 Z" fill="${PAL.wood}"/><rect x="228" y="78" width="624" height="25" fill="${PAL.woodDark}"/><path d="M852 78 L860 71 L860 96 L852 103 Z" fill="${PAL.woodEnd}"/>`;
  o += grain(228, 78, 624, 25, r, 4);
  return o;
}

// climbing rose vines: a stem up each post and round the arch corner, with
// leaves and a few rose clusters only at the post bases and the corners
function vines(r) {
  let o = '';
  const run = pts => {
    const d = 'M' + pts.map(p => p.map(f1).join(' ')).join(' L');
    let s = `<path d="${d}" stroke="#4f7f3a" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
    let cluster = '', n = 0;
    pts.forEach(([x, y, corner], i) => {
      const base = y > 196;
      if (i % (base || corner ? 2 : 4)) return;
      const side = (i / 2) % 2 ? 1 : -1;
      cluster += leaf(x, y, 9 + r() * 4, side * (50 + r() * 30), 3.2, r() > 0.5 ? 'url(#leafA)' : 'url(#leafB)');
      if ((base || corner) && r() > 0.5) cluster += rose(x + side * 4, y - 3, 3.6 + r() * 1.6, ...(r() > 0.35 ? ['#e8708f', '#f7a8bb'] : ['#f3ece0', '#ffffff']));
      if (++n % 3 === 0) { s += `<g class="sw" style="animation-duration:${f1(3 + r() * 2.5)}s;animation-delay:${f1(-r() * 4)}s">${cluster}</g>`; cluster = ''; }
    });
    if (cluster) s += cluster;
    return s;
  };
  for (const [px, dir] of [[266, 1], [814, -1]]) {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.035) pts.push([px + Math.sin(t * 13 + dir) * 6, 250 - t * 165, false]);
    for (let t = 0; t <= 0.12; t += 0.018) { const [x, y] = archAt(dir > 0 ? t : 1 - t); pts.push([x + Math.sin(t * 40) * 4, y + Math.cos(t * 40) * 4, true]); }
    o += run(pts);
  }
  // a short drape of leaves hanging from the beam ends
  for (const x0 of [236, 820]) for (let i = 0; i < 4; i++) o += leaf(x0 + i * 8, 104 + (i % 2) * 3, 8, 160 + (i % 2 ? 20 : -20), 2.8, i % 2 ? 'url(#leafA)' : 'url(#leafB)');
  return o;
}

function beds(r) {
  let o = '';
  for (const x of [92, 168, 236, 846, 916, 990]) o += lavender(x, 256, 1.25, r);
  for (let i = 0; i < 14; i++) {
    const x = 70 + r() * 940; if (x > 380 && x < 700) continue;
    o += flower(x, 262 + r() * 6, 2, r() > 0.5 ? '#ffffff' : '#ffd54d', r() > 0.5 ? '#f4cc3a' : '#e08a2a');
  }
  return o;
}

const chain = (x, y0, y1) => { let o = ''; for (let y = y0, i = 0; y < y1; y += 4.6, i++) o += i % 2 ? `<rect x="${f1(x - 0.8)}" y="${f1(y)}" width="1.6" height="5" fill="#57534c"/>` : `<ellipse cx="${f1(x)}" cy="${f1(y + 2.5)}" rx="2" ry="3" fill="none" stroke="#57534c" stroke-width="1.3"/>`; return o; };

// name on the big board (shrinking to fit), title on a small board hung below it
function signs(r, night, name, title) {
  const ns = Math.min(42, 324 / (Math.max(name.length, 1) * 0.6));
  let o = chain(410, 102, 122) + chain(670, 102, 122);
  o += board(358, 120, 364, 66, 7) + `<rect x="366" y="127" width="348" height="52" rx="4" fill="none" stroke="${PAL.paperEdge}" stroke-opacity=".35" stroke-width="1" stroke-dasharray="4 3"/>`;
  o += grain(358, 120, 364, 66, r, 3) + nail(410, 127) + nail(670, 127);
  let text = sign(540, 167, ns, name);
  if (title) {
    const rw = Math.max(260, title.length * 18.5 * 0.6 + 32), rx = 540 - rw / 2;
    o += chain(432, 186, 199) + chain(648, 186, 199);
    o += board(rx, 198, rw, 34, 5) + nail(432, 203) + nail(648, 203);
    text += sign(540, 221, 18.5, title);
  }
  return `<g class="swing" style="transform-origin:540px 102px">${lit(night, o)}${text}</g>`;
}

const taglineText = (night, tagline) => tagline ? sign(540, 97, 18.5, tagline, { fill: night ? '#f0d9a8' : '#f6e7c6' }) : '';

// screen-reader label: "Name: Title. Tagline." with the middots read as commas
export const bannerLabel = ({ name, title, tagline }) => [name + (title ? ':' : '.'), title && `${title}.`, tagline && `${tagline}.`].filter(Boolean).join(' ').replace(/ · /g, ', ');

// banner: { name, title, tagline } from readme.banner in the config
export function renderBanner({ night, banner }) {
  const { name, title = '', tagline = '' } = banner;
  const r = rng(11);
  let scene = ground(r) + fence() + beds(r) + arch(r) + vines(r);
  let lights = '';
  if (night) {
    const lamps = [lantern(244, 112, 1.1, true, 0), lantern(836, 112, 1.1, true, -1.1)];
    lights += `<mask id="cres"><circle cx="984" cy="44" r="15" fill="#fff"/><circle cx="991" cy="39" r="13" fill="#000"/></mask>`;
    lights += Ci(984, 44, 48, 'url(#gMoon)') + `<circle cx="984" cy="44" r="15" fill="#eef3ff" mask="url(#cres)"/>`;
    const s = rng(77);
    for (let i = 0; i < 34; i++) { const x = 16 + s() * 1048, y = 8 + s() * 150; if (x > 240 && x < 840 && y > 10) continue; if (y > 196) continue; lights += star(x, y, 0.6 + s() * 0.9, i); }
    lights += E(244, 256, 70, 10, 'url(#gWarm)') + E(836, 256, 70, 10, 'url(#gWarm)');
    lights += lamps.map(l => l.body + l.glow).join('');
    [[120, 200], [210, 170], [380, 236], [700, 228], [880, 190], [960, 222], [60, 228], [1010, 160]].forEach(([x, y], i) => lights += firefly(x, y, i));
  }
  const body = compose(night, { scene, signs: signs(rng(5), night, name, title), lights, text: night ? taglineText(true, tagline) : '' }) + (night ? '' : taglineText(false, tagline));
  return doc({ w: W, h: H, night, label: bannerLabel(banner), body });
}
