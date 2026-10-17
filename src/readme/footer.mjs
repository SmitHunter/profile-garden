// Fence footer: white pickets, a garden gate and two signposts.
import { rng } from '../rng.mjs';
import { PAL, f1, doc, compose, lit, sign, lantern, firefly, lavender, flower, tuft, picket, grain, monoW, nail, E, Ci, L, leaf } from './kit.mjs';

const W = 1080, H = 164, BASE = 142;

function ground(r) {
  let o = `<path d="M24 146 Q26 134 44 134 L1036 134 Q1054 134 1056 146 L1056 150 Q1054 158 1036 158 L44 158 Q26 158 24 150 Z" fill="url(#lawn)"/>`;
  o += `<path d="M24 150 Q26 158 44 158 L1036 158 Q1054 158 1056 150 L1056 154 Q1054 163 1036 163 L44 163 Q26 163 24 154 Z" fill="#8a6a44"/>`;
  o += `<path d="M500 136 L580 136 L600 160 L480 160 Z" fill="url(#gravel)"/>`;
  for (let i = 0; i < 70; i++) { const x = 36 + r() * 1008; if (x > 476 && x < 604) continue; o += tuft(x, 138 + r() * 16, r() > 0.5 ? '#6aa944' : '#8fcb62'); }
  return o;
}

function sunflower(x, y, h) {
  const fy = y - h;
  let o = L(x, y, x, fy, '#5f8f3a', 2.4) + leaf(x, y - h * 0.45, 14, -60, 4.5, 'url(#leafA)') + leaf(x, y - h * 0.62, 13, 58, 4.2, 'url(#leafB)');
  for (let i = 0; i < 12; i++) { const a = i * 30; o += `<ellipse cx="${f1(x)}" cy="${f1(fy - 8)}" rx="2.6" ry="6" fill="${i % 2 ? '#f4cc3a' : '#f0b81e'}" transform="rotate(${a} ${f1(x)} ${f1(fy)})"/>`; }
  return `<g class="sw" style="animation-duration:5s;animation-delay:${f1(-x % 4)}s">${o + Ci(x, fy, 5.6, '#6b4220') + Ci(x - 1.4, fy - 1.4, 2, '#8a5a2e')}</g>`;
}

function fence() {
  let o = '';
  for (const [a, b] of [[30, 476], [604, 1050]]) {
    o += `<rect x="${a}" y="94" width="${b - a}" height="5" fill="#e8e0cf"/><rect x="${a}" y="120" width="${b - a}" height="5" fill="#e8e0cf"/>`;
    for (let x = a + 2; x <= b - 12; x += 20) o += picket(x, BASE, 64);
  }
  // gate: arched pickets between two posts, with a Z brace
  let g = `<rect x="494" y="96" width="92" height="5" fill="#e8e0cf"/><rect x="494" y="124" width="92" height="5" fill="#e8e0cf"/>`;
  g += `<path d="M498 126 L582 99" stroke="#e8e0cf" stroke-width="5"/>`;
  for (let x = 494; x <= 576; x += 13) { const t = (x + 5 - 540) / 46; g += picket(x, BASE - 2, 76 - t * t * 18, 10); }
  o += g;
  for (const x of [476, 590]) {
    o += `<rect x="${x}" y="64" width="14" height="${BASE - 64 + 2}" fill="${PAL.picket}"/><rect x="${x + 10}" y="64" width="4" height="${BASE - 64 + 2}" fill="${PAL.picketShade}"/>`;
    o += `<rect x="${x - 2}" y="60" width="18" height="5" rx="1" fill="#e8e0cf"/>` + Ci(x + 7, 54, 6, PAL.picket) + Ci(x + 9, 52, 2.2, '#ffffff');
  }
  return o;
}

// arrow-shaped signpost board; dir 1 points right, -1 left
function signpost(px, label, dir, r, night) {
  const fs = 18.5, w = monoW(label, fs) + 40, h = 34, y = 48;
  const bx = dir > 0 ? px - 18 : px + 18 - w;
  const tip = dir > 0 ? bx + w + 12 : bx - 12;
  let post = E(px + 3, BASE + 2, 12, 3, '#000', 'opacity=".18"') + `<rect x="${px - 5}" y="${y - 6}" width="10" height="${BASE - y + 8}" fill="url(#woodV)"/>` + `<path d="M${px - 5} ${y - 6} L${px} ${y - 11} L${px + 5} ${y - 6} Z" fill="${PAL.woodDark}"/>`;
  const shape = dir > 0
    ? `M${bx} ${y} H${bx + w} L${tip} ${y + h / 2} L${bx + w} ${y + h} H${bx} Z`
    : `M${bx + w} ${y} H${bx} L${tip} ${y + h / 2} L${bx} ${y + h} H${bx + w} Z`;
  let board = `<path d="${shape}" fill="#000" opacity=".16" transform="translate(2 3)"/><path d="${shape}" fill="url(#paperG)" stroke="${PAL.paperEdge}" stroke-width="2" stroke-linejoin="round"/>`;
  board += grain(bx, y, w, h, r, 2) + nail(px, y + 7) + nail(px, y + h - 7);
  return { post, board, text: sign(bx + w / 2 + dir * 8, y + 23, fs, label) };
}

// footer: { left, right } signpost labels from readme.footer (either may be empty)
export function renderFooter({ night, footer = {} }) {
  const { left = '', right = '' } = footer;
  const r = rng(43);
  let scene = ground(r);
  for (const [x, h] of [[640, 92], [668, 104], [700, 86], [140, 96], [172, 84]]) scene += sunflower(x, 128, h);
  scene += fence();
  for (const x of [70, 150, 230, 420, 660, 860, 940, 1010]) scene += lavender(x, 146, 1.1, r);
  for (let i = 0; i < 16; i++) { const x = 40 + r() * 1000; if (x > 470 && x < 610) continue; scene += flower(x, 148 + r() * 8, 1.8, r() > 0.5 ? '#ffffff' : '#ffd54d', '#e08a2a'); }
  const none = { post: '', board: '', text: '' };
  const a = left ? signpost(196, left, 1, r, night) : none, b = right ? signpost(850, right, -1, r, night) : none;
  scene += a.post + b.post;
  let lights = '';
  if (night) {
    const lamps = [lantern(467, 72, 0.95, true, 0), lantern(613, 72, 0.95, true, -0.9)];
    scene += `<path d="M477 62 H466 M603 62 H614" stroke="#3a3428" stroke-width="2.4" fill="none"/>`;
    lights += E(540, 150, 120, 12, 'url(#gWarm)') + lamps.map(l => l.body + l.glow).join('');
    [[120, 70], [250, 112], [430, 40], [700, 52], [900, 100], [1020, 60]].forEach(([x, y], i) => lights += firefly(x, y, i + 1));
  }
  const body = compose(night, { scene, signs: lit(night, a.board + b.board) + a.text + b.text, lights });
  const posts = [left, right].filter(Boolean).map(t => t.replace(/\s*→\s*/g, ', '));
  return doc({ w: W, h: H, night, label: `Garden fence with a gate.${posts.length ? ` Signposts: ${posts.join('; ')}.` : ''}`, body });
}
