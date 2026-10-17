// Tech stack as wooden plant markers stuck in a strip of soil.
import { plant } from '../scene/plants.mjs';
import { rng } from '../rng.mjs';
import { PAL, f1, doc, compose, lit, sign, firefly, board, monoW, E, Ci, L } from './kit.mjs';

// FS 18.5 keeps the lettering >= 12 CSS px when the image is shown 700px wide.
// Markers alternate tall/short so neighbouring boards can overlap a little sideways.
const W = 1080, H = 200, FS = 18.5, DROP = 16;

function bed(r) {
  let o = `<path d="M20 160 L1060 160 L1068 140 L28 140 Z" fill="url(#soil)"/>`;
  o += `<rect x="20" y="160" width="1040" height="14" fill="${PAL.woodDark}"/><path d="M1060 160 L1068 140 L1068 154 L1060 174 Z" fill="${PAL.woodEnd}"/>`;
  o += L(20, 160.5, 1060, 160.5, '#b8875a', 1.4);
  for (let i = 0; i < 260; i++) { const y = 142 + r() * 17, x = 30 + r() * 1030 - (y - 140) * 0.4; o += Ci(x, y, 0.6 + r() * 1, i % 3 ? '#3e2716' : '#7a5636'); }
  return o;
}

function festoon() {
  const pts = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120, seg = (t * 6) % 1; pts.push([30 + t * 1020, 12 + Math.sin(seg * Math.PI) * 14]); }
  let o = `<polyline points="${pts.map(p => p.map(f1).join(',')).join(' ')}" fill="none" stroke="#3a3428" stroke-width="1.2"/>`;
  pts.forEach(([x, y], i) => { if (i % 5) return; o += Ci(x, y + 2, 8, 'url(#gWarm)') + `<circle class="fk" style="animation-delay:${f1(-(i % 7) * 0.4)}s" cx="${f1(x)}" cy="${f1(y + 2.4)}" r="2" fill="#ffe7a3"/>`; });
  return o;
}

const SPAN = 1016;
const layout = name => {
  const lines = name.length > 12 ? name.split(' ') : [name];
  return { name, lines, w: Math.max(...lines.map(l => monoW(l, FS))) + 16, h: 14 + lines.length * 21 };
};

// Throws if the markers can't all stand in the bed; the error says by how much.
// Neighbours alternate tall/short, so they may overlap sideways by up to 8px.
export function checkStack(stack) {
  if (!stack.length) return;
  const used = stack.map(layout).reduce((a, b) => a + b.w, 0) - 8 * (stack.length - 1);
  if (used > SPAN) throw new Error(`readme.stack is too wide for the plant-marker bed (${Math.round(used)} of ${SPAN} px): remove an item or shorten names (names over 12 characters wrap at spaces)`);
}

// stack: the list of names from readme.stack in the config
export function renderStack({ night, stack }) {
  checkStack(stack);
  const r = rng(17);
  const items = stack.map(layout);
  const used = items.reduce((a, b) => a + b.w, 0), gap = items.length > 1 ? (SPAN - used) / (items.length - 1) : 0;
  const x0 = items.length > 1 ? 32 : 540 - items[0].w / 2;
  let x = x0, scene = bed(r), signs = '', sprouts = '';
  const crops = ['lettuce', 'carrot', 'cabbage', 'strawberry', 'beans'];
  items.forEach((it, i) => {
    const cx = x + it.w / 2, base = 146 + r() * 9, top = (i % 2 ? 66 : 22) + r() * 6 - (it.lines.length - 1) * 21;
    let m = E(cx + 3, base + 1, 11, 3, '#2a1a0e', 'opacity=".5"');
    m += `<rect x="${f1(cx - 4)}" y="${f1(top + it.h - 4)}" width="8" height="${f1(base - top - it.h + 6)}" fill="url(#woodV)"/>`;
    m += board(x, top, it.w, it.h, 4);
    m += E(cx, base, 7, 2.6, '#4a2e1a');
    const text = it.lines.map((ln, k) => sign(cx, top + 27 + k * 21, FS, ln)).join('');
    signs += `<g class="swing" style="transform-origin:${f1(cx)}px ${f1(base)}px;animation-duration:${f1(4 + r() * 3)}s;animation-delay:${f1(-r() * 4)}s">${lit(night, m)}${text}</g>`;
    if (i < items.length - 1) {
      const sx = x + it.w + gap / 2, j = r(), lv = 1 + Math.floor(j * 3);
      let p = plant(sx, 150 + r() * 6, lv, crops[i % crops.length], 2.3, j);
      if (lv >= 2) p = `<g class="sw" style="animation-duration:${f1(2.6 + j * 2)}s;animation-delay:${f1(-j * 4)}s">${p}</g>`;
      sprouts += p;
    }
    x += it.w + gap;
  });
  let lights = '';
  if (night) { lights = festoon(); [[64, 134], [262, 132], [556, 138], [796, 130], [1052, 128]].forEach(([fx, fy], i) => lights += firefly(fx, fy, i + 3)); }
  const body = `<g transform="translate(0 ${DROP})">${compose(night, { scene: scene + sprouts, signs })}</g>${lights}`;
  return doc({ w: W, h: H, night, label: `Tech stack: ${stack.join(', ')}.`, body });
}
