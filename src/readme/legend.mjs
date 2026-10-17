// Caption + growth legend: five little raised beds showing each growth stage.
import { plant } from '../scene/plants.mjs';
import { C, S } from '../scene/draw.mjs';
import { rng } from '../rng.mjs';
import { MONO, SANS, PAL, f1, esc, doc, compose, firefly, pageInk, pageInkSoft, Ci, E } from './kit.mjs';

const W = 1080, H = 180;
export const STAGES = [[0, '0', 'bare soil'], [1, '1', 'sprout'], [2, '2–3', 'seedling'], [3, '4–6', 'growing'], [4, '7+', 'harvest']];

// a small iso raised bed whose soil centre lands on (cx, cy); returns markup
export function patch(cx, cy, r, { w = 3.2, z = 0.6 } = {}) {
  const ox = cx, oy = cy - w * 0.5 * S + z * S;
  const P = (x, y, h = 0) => [ox + (x - y) * C * S, oy + (x + y) * 0.5 * S - h * S];
  const poly = (a, fill) => `<polygon points="${a.map(p => P(...p).map(f1).join(',')).join(' ')}" fill="${fill}"/>`;
  let o = E(cx + 8, cy + w * 0.5 * S + 4, w * C * S * 1.05, 9, '#000', 'opacity=".12"');
  o += poly([[0, w, 0], [w, w, 0], [w, w, z], [0, w, z]], PAL.wood) + poly([[w, 0, 0], [w, w, 0], [w, w, z], [w, 0, z]], PAL.woodDark);
  o += poly([[0, 0, z], [w, 0, z], [w, w, z], [0, w, z]], '#c39363');
  const i = 0.28;
  o += poly([[i, i, z], [w - i, i, z], [w - i, w - i, z], [i, w - i, z]], 'url(#soil)');
  for (let n = 0; n < 26; n++) { const [x, y] = P(i + r() * (w - 2 * i), i + r() * (w - 2 * i), z); o += Ci(x, y, 0.6 + r() * 0.8, n % 2 ? '#7a5636' : '#3e2716'); }
  return o;
}

export function renderLegend({ night }) {
  const r = rng(31);
  const cols = STAGES.map((_, i) => 140 + i * 200), cy = 114;
  let scene = '';
  STAGES.forEach(([lv], i) => {
    const x = cols[i];
    scene += patch(x, cy, r, { w: 3.7 });
    let p = plant(x, cy + 2, lv, 'tomato', 3.1, r());
    if (lv >= 2) p = `<g class="sw" style="animation-duration:${f1(2.8 + r() * 1.6)}s;animation-delay:${f1(-r() * 3)}s">${p}</g>`;
    scene += p;
  });
  // dotted arrows between the stages
  let text = '';
  const arrow = night ? '#6e6250' : '#cdbb95';
  for (let i = 0; i < 4; i++) {
    const a = cols[i] + 62, b = cols[i + 1] - 62;
    text += `<path d="M${a} ${cy} H${b - 6}" stroke="${arrow}" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/><path d="M${b - 8} ${cy - 5} L${b} ${cy} L${b - 8} ${cy + 5}" stroke="${arrow}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  text += `<text x="540" y="30" font-size="19" text-anchor="middle" font-family="${SANS}" fill="${pageInk(night)}">Every plant is a day of my GitHub activity. Busier days grow bigger crops. <tspan font-style="italic" fill="${pageInkSoft(night)}">Redrawn daily.</tspan></text>`;
  STAGES.forEach(([, n, label], i) => {
    text += `<text x="${cols[i]}" y="${H - 7}" font-size="18.5" font-weight="700" text-anchor="middle" font-family="${MONO}" fill="${pageInkSoft(night)}"><tspan fill="${pageInk(night)}">${esc(n)}</tspan> · ${esc(label)}</text>`;
  });
  let lights = '';
  if (night) [[240, 70], [452, 88], [655, 64], [860, 82]].forEach(([x, y], i) => lights += firefly(x, y, i + 2));
  const body = compose(night, { scene, lights, text });
  return doc({ w: W, h: H, night, label: 'Legend: every plant is a day of GitHub activity. 0 contributions is bare soil, 1 a sprout, 2 to 3 a seedling, 4 to 6 growing, 7 or more ready to harvest.', body });
}
