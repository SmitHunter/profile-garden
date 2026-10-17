// Night layer.
// Drawn after the sorted day items: overlay first, then lights and life,
// then the plaque + glow markup again so they sit above the overlay.
import { iso, poly, line, E, Ci, L, MONO } from './draw.mjs';
import { rng } from '../rng.mjs';
import { BED, bedOrigin, spot, bedSignAt, plaqueBoard, plaqueLantern } from './props.mjs';

const f1 = v => v.toFixed(1);
const pad = n => String(n).padStart(2, '0');

const NIGHT_DEFS = `<defs><radialGradient id="gWarm"><stop offset="0" stop-color="#ffcf73" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf73" stop-opacity="0"/></radialGradient><radialGradient id="gMoon"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".35"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient><radialGradient id="gFly"><stop offset="0" stop-color="#f4ff9a" stop-opacity="1"/><stop offset=".3" stop-color="#d8ff5a" stop-opacity=".7"/><stop offset="1" stop-color="#b8ff3a" stop-opacity="0"/></radialGradient><linearGradient id="gShoot" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;

const lamp = (x, y, z, r) => { const [a,b] = iso(x, y, z), [g1,g2] = iso(x, y, 0); return E(g1, g2, r*2.2, r*1.1, 'url(#gWarm)') + Ci(a, b, r, 'url(#gWarm)') + Ci(a, b, 2.2, '#fff1c4'); };

// festoon lights hanging between fence posts
function festoon(from, to, n) {
  const p2 = [];
  for (let i = 0; i <= n * 6; i++) { const t = i / (n * 6), seg = (t * n) % 1; p2.push(iso(from[0] + (to[0]-from[0]) * t, from[1] + (to[1]-from[1]) * t, 2.05 - Math.sin(seg * Math.PI) * 0.45)); }
  let o = `<polyline points="${p2.map(p => p.map(f1).join(',')).join(' ')}" fill="none" stroke="#3a3428" stroke-width="1"/>`;
  p2.forEach((p, i) => { if (i % 2) return; o += Ci(p[0], p[1]+1.6, 7, 'url(#gWarm)') + `<circle class="bulb" style="animation-delay:${f1(-(i%7)*0.4)}s" cx="${f1(p[0])}" cy="${f1(p[1]+1.6)}" r="1.7" fill="#ffe7a3"/>`; });
  return o;
}

// gold star + number above each 100th-contribution day's plant. A label that
// would collide with the rosette, a month sign or an earlier label is lifted clear.
function milestones(stats, win, rosetteBox) {
  let o = '', idx = 0;
  const boxes = win.months.map((_, m) => { const [sa, sb] = bedSignAt(m); return [sa - 22, sb - 37, sa + 22, sb - 13]; });
  const hit = (b) => boxes.some(q => b[0] < q[2] + 3 && q[0] < b[2] + 3 && b[1] < q[3] + 2 && q[1] < b[3] + 2);
  const days = [];
  win.months.forEach(({ year, month, days: n }, m) => {
    const { bx, by } = bedOrigin(m);
    for (let i = 0; i < n; i++, idx++) days.push({ date: `${year}-${pad(month)}-${pad(i + 1)}`, i, idx, ...spot(bx, by, i) });
  });
  if (rosetteBox) boxes.push(rosetteBox);
  for (const { date, i, idx, cx, cy } of days) {
    const v = stats.milestones[date];
    if (!v) continue;
    const [px, py] = iso(cx, cy, BED.Z), hw = String(v).length * 18.5 * 0.3 + 2;
    let ly = py - 29;
    for (let k = 0; k < 8 && hit([px - hw, ly - 15, px + hw, ly + 3]); k++) ly -= 18;
    boxes.push([px - hw, ly - 15, px + hw, ly + 3]);
    o += `<g class="gr mg" style="animation-delay:${idx*28}ms"><g class="ms" style="animation-duration:2.2s;animation-delay:${f1(-(i % 5) * 0.4)}s"><circle cx="${f1(px)}" cy="${f1(py-14)}" r="9" fill="#ffd84a" opacity=".25"/><path d="M${f1(px)} ${f1(py-24)} l2 8 l8 2 l-8 2 l-2 8 l-2 -8 l-8 -2 l8 -2 z" fill="#ffe680"/></g></g><text x="${f1(px)}" y="${f1(ly)}" font-size="18.5" font-weight="700" text-anchor="middle" font-family="${MONO}" fill="#ffe27a" stroke="#2a1a08" stroke-width="4" stroke-linejoin="round" paint-order="stroke">${v}</text>`;
  }
  return o;
}

export function nightLayer({ stats, win, glow, plaque, rosetteBox }) {
  const r = rng(505);
  let N = NIGHT_DEFS;
  // darken everything to night, matching GitHub's dark background
  N += `<rect width="1080" height="700" fill="#0d1117" opacity=".62"/>`;
  N += poly([[-7,-6],[40,-6],[40,25],[-7,25]], '#7f9fe8', 'opacity=".07"');
  // moon + stars
  N += Ci(985, 72, 70, 'url(#gMoon)') + Ci(985, 72, 24, '#eef3ff') + Ci(976, 66, 5, '#d8e2f5') + Ci(993, 80, 3.4, '#d8e2f5');
  for (let i = 0; i < 46; i++) {
    const sx = 20 + r()*1040, sy = 10 + r()*150; if (sy > 60 && sx > 150 && sx < 900) continue;
    N += `<circle class="tw" style="animation-duration:${f1(2+r()*3)}s;animation-delay:${f1(-r()*4)}s" cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="${f1(0.6+r()*0.9)}" fill="#dfe8ff"/>`;
  }
  // moon on the pond
  { const [a,b] = iso(37.4, 13.4); N += E(a+6, b-2, 9, 3.4, '#e6eeff', 'opacity=".55"') + E(a+6, b-2, 16, 6, '#cfe0ff', 'opacity=".15"'); }
  // shed: glowing window + light spill + door lantern + moths
  N += poly([[36,0,1.6],[36,2,1.6],[36,2,2.9],[36,0,2.9]], '#ffd27a') + line([36,1,1.6],[36,1,2.9],'#7a5a2a',1.4) + line([36,0,2.25],[36,2,2.25],'#7a5a2a',1.4);
  { const [a,b] = iso(37.6, 1); N += E(a, b, 46, 18, 'url(#gWarm)'); }
  N += lamp(34.7, 3.5, 2.7, 16);
  { const [a,b] = iso(34.7, 3.5, 2.7); [0, 1, 2].forEach(n => { N += `<g class="moth" style="transform-origin:${f1(a)}px ${f1(b)}px;animation-duration:${f1(1.6+n*0.5)}s;animation-delay:${f1(-n*0.6)}s">` + E(a + 7 + n*3, b - 2, 1.6, 1, '#e8dcc8') + '</g>'; }); }
  // festoon lights along the back + left fence
  N += festoon([-6,-5], [39,-5], 10) + festoon([-6,-5], [-6,24], 6);
  // path lights between the beds
  for (const x of [6.5, 13.5, 20.5]) for (const y of [6.3, 13.9]) { const [a,b] = iso(x, y), [c,d] = iso(x, y, 0.9); N += L(a, b, c, d, '#4a4a4a', 1.6) + lamp(x, y, 0.95, 12); }
  // lantern on a pole above the sign
  { const { x, y, base } = plaqueLantern(), { x0, x1 } = plaqueBoard(); N += E((x0+x1)/2, base+20, 150, 30, 'url(#gWarm)') + L(x, base, x, y, '#3a3428', 1.6) + Ci(x, y-2, 12, 'url(#gWarm)') + Ci(x, y-2, 2.6, '#fff1c4'); }
  // owl on the fence
  { const [a,b] = iso(12, -5, 1.7); N += `<g class="owl">` + E(a, b-6, 5, 6.4, '#6b5a48') + E(a, b-4, 3.4, 4, '#a8957a') + Ci(a-2, b-9, 2.2, '#f4e6c8') + Ci(a+2, b-9, 2.2, '#f4e6c8') + Ci(a-2, b-9, 1.1, '#1a1a1a') + Ci(a+2, b-9, 1.1, '#1a1a1a') + `<path d="M${f1(a-0.8)} ${f1(b-7.6)} l0.8 1.4 l0.8 -1.4z" fill="#e8a33a"/><path d="M${f1(a-4.6)} ${f1(b-11.4)} l1 -2.8 l1.6 2z M${f1(a+4.6)} ${f1(b-11.4)} l-1 -2.8 l-1.6 2z" fill="#6b5a48"/>` + '</g>'; }
  // fireflies drifting over the lawn and beds; drift direction picks one of bob1..bob4
  for (let n = 0; n < 42; n++) {
    const [a,b] = iso(-5 + r()*44, -4 + r()*28, 0.6 + r()*2.2);
    const t = 1.8 + r()*2.6, o = -r()*4, dx = r()*24 - 12, dy = r()*14 - 7;
    const k = dx >= 0 ? (dy < 0 ? 1 : 3) : (dy >= 0 ? 2 : 4);
    N += `<g class="ff" style="animation-name:blink,bob${k};animation-duration:${f1(t)}s,${f1(t*1.7)}s;animation-delay:${f1(o)}s">` + Ci(a, b, 7, 'url(#gFly)') + Ci(a, b, 1.3, '#f8ffc0') + '</g>';
  }
  // sign lit by its lantern, readable; then everything else that glows
  N += plaque + milestones(stats, win, rosetteBox) + glow.join('');
  // shooting star + fox eyes in the lavender
  N += `<g class="shoot"><path d="M880 70 L940 42 L941 44.5 Z" fill="url(#gShoot)"/><circle cx="880" cy="70" r="1.8" fill="#fff"/></g>`;
  { const [a,b] = iso(-4.0, 14.9, 0.35); N += `<g class="eyes">` + Ci(a-3, b, 1.4, '#ffd23f') + Ci(a+3, b, 1.4, '#ffd23f') + Ci(a-3, b, 4, '#ffd23f', 'opacity=".2"') + Ci(a+3, b, 4, '#ffd23f', 'opacity=".2"') + '</g>'; }
  return N;
}
