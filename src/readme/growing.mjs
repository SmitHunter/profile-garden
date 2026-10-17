// "Currently growing": three seedling trays on a potting bench, one per stat.
import { plant } from '../scene/plants.mjs';
import { addDays } from '../dates.mjs';
import { rng } from '../rng.mjs';
import { PAL, f1, doc, compose, lit, sign, lantern, firefly, board, grain, monoW, E, Ci, L } from './kit.mjs';

const W = 1080, H = 204;

export function growingStats(calendar, today) {
  const n = d => calendar.get(d) ?? 0;
  let week = 0, month = 0, active = 0;
  for (let i = 0; i < 7; i++) week += n(addDays(today, -i));
  for (let d = today.slice(0, 8) + '01'; d <= today; d = addDays(d, 1)) month += n(d);
  for (let i = 0; i < 30; i++) if (n(addDays(today, -i)) > 0) active++;
  return { week, month, active };
}

// share of the tray to fill: square-root growth for counts, linear for active days
export const fillShare = (v, cap, linear = false) => v <= 0 ? 0 : Math.min(1, linear ? v / cap : Math.sqrt(v / cap));

const COLS = 9, ROWS = 2, TW = 250, DX = 16, DY = -26;

function tray(x0, value, label, sub, cap, linear, r, seed) {
  const yF = 128, yB = 178; // front face top / bottom
  const at = (u, v) => [x0 + u * TW + v * DX, yF + v * DY];
  const q = a => a.map(p => p.map(f1).join(',')).join(' ');
  let s = E(x0 + TW / 2 + 10, yB + 1, TW / 2 + 16, 5, '#000', 'opacity=".16"');
  // back + top rim + soil
  s += `<polygon points="${q([at(0, 0), at(1, 0), at(1, 1), at(0, 1)])}" fill="#c39363"/>`;
  s += `<polygon points="${q([at(0.015, 0.1), at(0.985, 0.1), at(0.985, 0.92), at(0.015, 0.92)])}" fill="url(#soil)"/>`;
  // cells, back row first so front seedlings overlap
  const cells = [];
  for (let row = ROWS - 1; row >= 0; row--) for (let c = 0; c < COLS; c++) cells.push([c, row]);
  const order = cells.map((_, i) => i).sort((a, b) => ((a * 7919 + seed) % 97) - ((b * 7919 + seed) % 97));
  const share = fillShare(value, cap, linear), filled = value > 0 ? Math.max(1, Math.round(share * cells.length)) : 0;
  const on = new Set(order.slice(0, filled));
  let plants = '';
  cells.forEach(([c, row], i) => {
    const u = (c + 0.5) / COLS, v = 0.2 + row * 0.5 + 0.06;
    const [px, py] = at(u, v);
    s += E(px, py, 9.5, 4.2, '#3e2716') + E(px - 1, py - 0.8, 6.5, 2.2, '#6e4a2e', 'opacity=".7"');
    if (!on.has(i)) return;
    const j = r(), lv = Math.min(3, 1 + Math.floor(j * (1 + share * 2.4)));
    let p = plant(px, py, lv, 'tomato', 2, j);
    if (lv >= 2) p = `<g class="sw" style="animation-duration:${f1(2.6 + j * 2)}s;animation-delay:${f1(-j * 4)}s">${p}</g>`;
    plants += p;
  });
  s += plants;
  // front face + right side
  s += `<rect x="${x0}" y="${yF}" width="${TW}" height="${yB - yF}" fill="url(#woodV)"/>` + grain(x0, yF, TW, yB - yF, r, 3);
  s += L(x0, yF + 1, x0 + TW, yF + 1, '#d4a878', 1.6);
  s += `<polygon points="${q([[x0 + TW, yF], [x0 + TW + DX, yF + DY], [x0 + TW + DX, yB + DY], [x0 + TW, yB]])}" fill="${PAL.woodEnd}"/>`;
  // label pinned to the front
  const num = String(value), nw = monoW(num, 34), lw = Math.max(monoW(label, 18.5), monoW(sub, 15.5));
  const bw = nw + lw + 32, bx = x0 + TW / 2 - bw / 2;
  const lab = board(bx, yF + 3, bw, 46, 4);
  const text = sign(bx + 11, yF + 38, 34, num, { anchor: '' })
    + sign(bx + 21 + nw, yF + 22, 18.5, label, { anchor: '' })
    + sign(bx + 21 + nw, yF + 41, 15.5, sub, { anchor: '', fill: PAL.inkSoft });
  return { scene: s, board: lab, text };
}

function bench() {
  let o = `<rect x="34" y="194" width="10" height="10" fill="${PAL.woodEnd}"/><rect x="1036" y="194" width="10" height="10" fill="${PAL.woodEnd}"/>`;
  o += `<path d="M22 178 L1058 178 L1066 172 L30 172 Z" fill="#c39363"/><rect x="22" y="178" width="1036" height="16" fill="${PAL.woodDark}"/><path d="M1058 178 L1066 172 L1066 188 L1058 194 Z" fill="${PAL.woodEnd}"/>`;
  for (let x = 120; x < 1058; x += 130) o += L(x, 179, x, 193, '#6e4a2a', 1);
  return o;
}

function chalkboard() {
  let o = L(540, 2, 474, 16, '#7a6a55', 1.4) + L(540, 2, 606, 16, '#7a6a55', 1.4) + Ci(540, 3, 2.4, '#6b5a48');
  o += `<rect x="394" y="14" width="292" height="46" rx="4" fill="${PAL.woodDark}"/><rect x="399" y="19" width="282" height="36" rx="2" fill="#2f3d36"/>`;
  o += `<path d="M412 48 q30 -6 60 0 M580 30 q40 -4 86 2" stroke="#fff" stroke-opacity=".07" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  return o;
}
const chalk = sign(540, 44, 18.5, 'CURRENTLY GROWING', { fill: '#f1efe4', extra: ' letter-spacing="2"' });

export function renderGrowing({ week, month, active }, { night }) {
  const r = rng(91);
  const parts = [
    tray(57, week, 'this week', 'contributions', 40, false, r, 3),
    tray(407, month, 'this month', 'contributions', 150, false, r, 11),
    tray(757, active, 'active days', 'of the last 30', 30, true, r, 29),
  ];
  let scene = bench() + chalkboard() + parts.map(p => p.scene).join('');
  const lamps = [lantern(372, 106, 0.9, night, 0), lantern(722, 106, 0.9, night, -1.3)];
  for (const x of [358, 708]) scene += `<path d="M${x} 172 V96 q0 -8 8 -8 h6 v10" stroke="#3a3428" stroke-width="2.4" fill="none"/>`;
  let lights = '';
  if (night) {
    lights = lamps.map(l => l.body + l.glow).join('');
    [[40, 90], [330, 60], [690, 70], [1040, 100], [960, 60]].forEach(([x, y], i) => lights += firefly(x, y, i + 5));
  } else scene += lamps.map(l => l.body).join('');
  const body = compose(night, { scene, signs: lit(night, parts.map(p => p.board).join('')) + parts.map(p => p.text).join(''), lights, text: chalk });
  return doc({ w: W, h: H, night, label: `Currently growing: ${week} contributions this week, ${month} this month, active on ${active} of the last 30 days.`, body });
}
