// Scene props (world coordinates for the isometric projection in draw.mjs).
// Each returns { depth, svg } or an array of them; some also carry `glow`
// (markup Task 7 draws again above the night overlay).
import { iso, pts, poly, line, box, E, Ci, L, leaf, MONO } from './draw.mjs';
import { plant } from './plants.mjs';

const BG = -1e6; // background layers: below everything, kept in insertion order
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const f1 = v => v.toFixed(1);

// Sign lettering: the garden is 1080 wide but shown ~700px wide, so 18.5 units
// is ~12 CSS px. Boards are lamplit (a warm, darker paper) at night and redrawn
// above the night overlay; ink stays dark so contrast holds (>= 4.5:1).
export const SIGN_FS = 18.5, SIGN_FS_SMALL = 15.5;
export const INK = '#3a2410', INK_SOFT = '#5a3a1e';
export const boardColours = night => night ? { fill: '#dbb473', stroke: '#7a5530' } : { fill: '#e9d3a6', stroke: '#8a6238' };
const txt = (x, y, size, s, fill = INK, extra = '') => `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" font-weight="700" text-anchor="middle" font-family="${MONO}" fill="${fill}"${extra}>${s}</text>`;

// ---------- ground ----------

// lawn + shadowed edge (thin earth slab under the lawn), grass tufts, gravel courtyard, speckles, stepping stones
export function ground(r) {
  let s = box(-7, -6, -0.8, 47, 31, 0.8, 'url(#lawn)', '#8a6a44', '#6e5233');
  for (let i = 0; i < 420; i++) {
    const gx = -7 + r()*47, gy = -6 + r()*31;
    if (gx > -1.5 && gx < 28.5 && gy > -1.5 && gy < 22.5) continue;
    const [a,b] = iso(gx, gy), p = `${f1(a)} ${f1(b)}`;
    s += `<path d="M${p} l-1.2 -3 M${p} l0.4 -3.6 M${p} l1.6 -2.6" stroke="${r() > .5 ? '#6aa944' : '#8fcb62'}" stroke-width="1"/>`;
  }
  s += poly([[-1.5,-1.5],[28.5,-1.5],[28.5,22.5],[-1.5,22.5]], '#b9a27a');
  s += poly([[-1.3,-1.3],[28.3,-1.3],[28.3,22.3],[-1.3,22.3]], 'url(#gravel)');
  for (let i = 0; i < 900; i++) { const [a,b] = iso(-1.2 + r()*29.4, -1.2 + r()*23.4); s += `<circle cx="${f1(a)}" cy="${f1(b)}" r="${(0.5 + r()*0.9).toFixed(1)}" fill="${['#c9b48c','#f4ead4','#b8a17a','#e0cfa8'][i%4]}"/>`; }
  for (let i = 0; i < 4; i++) { const sx = 29.5 + i*1.6, sy = 4.2 + (i%2)*0.4; s += poly([[sx,sy],[sx+1.1,sy],[sx+1.1,sy+1],[sx,sy+1]], '#b9b2a6') + poly([[sx+0.1,sy+0.1],[sx+1,sy+0.1],[sx+1,sy+0.8],[sx+0.1,sy+0.8]], '#d6d0c4'); }
  return { depth: BG, svg: s };
}

// picket fence along back edges (x=-6 and y=-5 lines)
function picket(x, y) {
  const z = 1.6; const [a,b] = iso(x,y), [c,d] = iso(x,y,z);
  return `<line x1="${f1(a)}" y1="${f1(b)}" x2="${f1(c)}" y2="${f1(d)}" stroke="#f6f1e6" stroke-width="5"/><line x1="${f1(a+2)}" y1="${f1(b)}" x2="${f1(c+2)}" y2="${f1(d)}" stroke="#d8d0bf" stroke-width="1.4"/><polygon points="${f1(c-2.5)},${f1(d)} ${f1(c+2.5)},${f1(d)} ${f1(c)},${f1(d-3)}" fill="#f6f1e6"/>`;
}
export function fence() {
  const out = [];
  for (let x = -6; x <= 39; x += 0.9) out.push({ depth: x - 5 - 50, svg: picket(x, -5) });
  for (let y = -5; y <= 24; y += 0.9) out.push({ depth: -6 + y - 50, svg: picket(-6, y) });
  out.push({ depth: -200, svg: line([-6,-5,1.1],[39.5,-5,1.1], '#e8e0cf', 3) + line([-6,-5,0.5],[39.5,-5,0.5], '#e8e0cf', 3) + line([-6,-5,1.1],[-6,24.5,1.1], '#e8e0cf', 3) + line([-6,-5,0.5],[-6,24.5,0.5], '#e8e0cf', 3) });
  return out;
}

// sunflowers along back fence
export function sunflowers() {
  const out = [];
  for (let x = -3; x <= 27; x += 2.6) {
    const [a,b] = iso(x, -4); const h = 34 + (x*7 % 9);
    const petals = [...Array(12)].map((_, i) => { const t = i/12*Math.PI*2, px = a + Math.cos(t)*5.2, py = b-h + Math.sin(t)*5.2; return E(px, py, 2.6, 1.2, '#f7c531', `transform="rotate(${f1(t*57.3)} ${f1(px)} ${f1(py)})"`); }).join('');
    out.push({ depth: x - 4 - 40, svg: `<g class="sw" style="animation-duration:${(3.5+(x%3)*0.4).toFixed(2)}s;animation-delay:${(-x%4).toFixed(2)}s">` + L(a, b, a, b-h, '#5f8f2f', 2) + leaf(a, b-h*0.4, 9, -60, 2.4, 'url(#leafB)') + leaf(a, b-h*0.6, 9, 60, 2.4, 'url(#leafA)') + petals + Ci(a, b-h, 3.6, '#6b3f1d') + Ci(a-1, b-h-1, 1.2, '#8a5a30') + '</g>' });
  }
  return out;
}

// trees outside the fence
function tree(x, y, s) { const [a,b] = iso(x,y); return E(a+10*s, b+2, 22*s, 8*s, '#000', 'opacity=".15"') + `<rect x="${f1(a-2.5*s)}" y="${f1(b-26*s)}" width="${f1(5*s)}" height="${f1(26*s)}" fill="#7a5233"/>` + Ci(a-8*s, b-30*s, 13*s, '#3f8a2c') + Ci(a+9*s, b-32*s, 12*s, '#3a7a28') + Ci(a, b-44*s, 15*s, '#4f9a35') + Ci(a-4*s, b-48*s, 7*s, '#6dbb45') + Ci(a+5*s, b-38*s, 5*s, '#ff6b5a') + Ci(a-7*s, b-34*s, 2.6*s, '#e53b2c') + Ci(a+8*s, b-44*s, 2.6*s, '#e53b2c'); }
export const TREES = [[-4.2, 6, 0.9], [38.4, -3.4, 1], [-4.2, 17.5, 0.8]]; // x, y, scale
export function trees() {
  return TREES.map(([x, y, s]) => ({ depth: x + y, svg: tree(x, y, s) }));
}

// ---------- beds ----------

export const BED = { W: 6, H: 5, Z: 0.7 };
export const bedOrigin = m => ({ bx: (m % 4) * 7, by: Math.floor(m / 4) * 7.6 });
// spot i (0-based day of month): 7 columns x 5 rows
export const spot = (bx, by, i) => ({ cx: bx + (i % 7 + .5) * 6 / 7, cy: by + .5 + Math.floor(i / 7) });

// raised bed frame, soil and speckles (r = bed soil speckle rng)
export function bed(m, r) {
  const { bx, by } = bedOrigin(m), { W, H, Z } = BED;
  let s = poly([[bx+0.3,by+0.3],[bx+W+0.5,by+0.3],[bx+W+0.5,by+H+0.5],[bx+0.3,by+H+0.5]], '#000', 'opacity=".1"');
  s += box(bx, by, 0, W, H, Z, '#a8784a', '#b88552', '#8c5f36');
  for (const z of [0.23, 0.46]) s += line([bx, by+H, z], [bx+W, by+H, z], '#8a5c34', 0.9) + line([bx+W, by, z], [bx+W, by+H, z], '#6e4526', 0.9);
  s += line([bx, by+H, 0], [bx, by+H, Z+0.15], '#7a4f2c', 3) + line([bx+W, by+H, 0], [bx+W, by+H, Z+0.15], '#6e4526', 3) + line([bx+W, by, 0], [bx+W, by, Z+0.15], '#5e3b20', 3);
  s += poly([[bx+0.18,by+0.18,Z],[bx+W-0.18,by+0.18,Z],[bx+W-0.18,by+H-0.18,Z],[bx+0.18,by+H-0.18,Z]], 'url(#soil)');
  for (let row = 0; row < 5; row++) s += line([bx+0.35, by+0.95+row, Z], [bx+W-0.35, by+0.95+row, Z], '#3a2312', 1);
  for (let i = 0; i < 40; i++) { const [a,b] = iso(bx+0.3+r()*(W-0.6), by+0.3+r()*(H-0.6), Z); s += Ci(a, b, 0.7, '#7d5636'); }
  return { depth: bx + by - 0.5, svg: s };
}

// month sign stuck in front-left corner (month 1-12)
export const bedSignAt = m => { const { bx, by } = bedOrigin(m); return iso(bx + 0.6, by + BED.H + 0.6, 0); };
// (night: the same sign is also returned as `glow` so it is redrawn above the overlay)
export function bedSign(m, month, night = false) {
  const { bx, by } = bedOrigin(m), { H } = BED;
  const [sa, sb] = bedSignAt(m);
  const c = boardColours(night);
  const svg = L(sa, sb, sa, sb - 14, '#7a5233', 2.2) + `<rect x="${f1(sa-22)}" y="${f1(sb-37)}" width="44" height="24" rx="3" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.4"/>` + txt(sa, sb - 18.6, SIGN_FS, MON[month-1]);
  return { depth: bx + by + H + 1.5, svg, glow: night ? svg : undefined };
}

// one plant spot: grow-once wrapper, sway only for level >= 2
export function plantSpot({ date, idx, cx, cy, lv, crop, prize, j }) {
  const [px, py] = iso(cx, cy, BED.Z);
  let inner = plant(px, py, lv, crop, prize ? 2.7 : 1.6, j);
  if (lv >= 2) inner = `<g class="sw" style="animation-duration:${(2.6+j*2).toFixed(2)}s;animation-delay:${(-j*4).toFixed(2)}s">${inner}</g>`;
  return { depth: cx + cy, svg: `<g class="gr" data-d="${date}" style="animation-delay:${idx*28}ms">${inner}</g>` };
}

// approx. height of a grown plant above its base, in plant-scale units (k)
const CROP_H = { tomato: 19, corn: 30, pumpkin: 6, carrot: 11, cabbage: 6, broccoli: 11, garlic: 16, peas: 17, lettuce: 5, beans: 21, strawberry: 4 };
const plantTop = (crop, lv, k) => (lv <= 2 ? 4 : CROP_H[crop] * (lv === 3 ? 0.72 : 1)) * k;

// blue prize rosette centred above the best day's plant, pinned to it by its ribbon tails;
// sized so the count reads at SIGN_FS, and kept within its own bed's top-face footprint
export function rosetteGeom(cx, cy, count, bx, by, lv, crop) {
  const [px, py] = iso(cx, cy, BED.Z), rc = Math.max(12, String(count).length * SIGN_FS * 0.3 + 4);
  const xmin = iso(bx, by + BED.H)[0], xmax = iso(bx + BED.W, by)[0];
  const rx = Math.min(Math.max(px, xmin + rc - 3), xmax - rc + 3);
  const top = py - plantTop(crop, lv, 2.7), ry = top - rc * 1.5 - 2;
  return { rc, rx, ry, px, top, xmin, xmax, box: [rx - rc - 5, ry - rc - 5, rx + rc + 5, top] };
}
export function rosette({ idx, cx, cy, count, bx, by, lv, crop }) {
  const { rc, rx, ry, px, top, box } = rosetteGeom(cx, cy, count, bx, by, lv, crop);
  const tail = (sx) => `M${f1(rx + sx * rc * 0.45)} ${f1(ry + rc * 0.6)} l${sx * 4} ${f1(rc * 0.9)} l${-sx * 4} -3 l${-sx * 3} 4 z`;
  const svg = `<g class="gr rz" style="animation-delay:${idx*28}ms">` + L(rx, ry + rc * 0.5, px, top + 1, '#2f6fd6', 2) + `<path d="${tail(-1)} ${tail(1)}" fill="#2f6fd6"/>` +
    [...Array(14)].map((_, n) => Ci(rx + Math.cos(n/14*6.28)*(rc + 1.5), ry + Math.sin(n/14*6.28)*(rc + 1.5), 3.4, '#3f82e8')).join('') +
    Ci(rx, ry, rc + 1, '#2f6fd6') + Ci(rx, ry, rc - 1.2, '#ffe08a') +
    txt(rx, ry + SIGN_FS * 0.35, SIGN_FS, count) + '</g>';
  // depth above everything in its own bed (and its sign), so neighbours never cover it
  return { depth: bx + by + BED.W + BED.H + 2, svg, glow: svg, box };
}

// ---------- outbuildings ----------

export function shed() {
  const x = 31, y = -1, W = 5, H = 4.4, Z = 3.6;
  let s = E(...iso(x+W/2+1, y+H/2+1), 70, 26, '#000', 'opacity=".15"');
  s += box(x, y, 0, W, H, Z, '#c9a27a', '#9db7c4', '#7f9cab');
  for (let i = 0.5; i < W; i += 0.5) s += line([x+i, y+H, 0], [x+i, y+H, Z], '#89a5b3', 0.8);
  for (let i = 0.5; i < H; i += 0.5) s += line([x+W, y+i, 0], [x+W, y+i, Z], '#6c8999', 0.8);
  s += poly([[x+1.7,y+H,0],[x+3.3,y+H,0],[x+3.3,y+H,2.6],[x+1.7,y+H,2.6]], '#5b6f7a') + poly([[x+1.85,y+H,0.1],[x+3.15,y+H,0.1],[x+3.15,y+H,2.45],[x+1.85,y+H,2.45]], '#6f8794');
  s += Ci(...iso(x+3, y+H, 1.3), 0.9, '#e9d3a6');
  s += poly([[x+W,y+1,1.6],[x+W,y+3,1.6],[x+W,y+3,2.9],[x+W,y+1,2.9]], '#fff6d6') + line([x+W,y+2,1.6],[x+W,y+2,2.9],'#7f9cab',1.4) + line([x+W,y+1,2.25],[x+W,y+3,2.25],'#7f9cab',1.4);
  // gable roof
  s += poly([[x-0.4,y-0.4,Z],[x-0.4,y+H/2,Z+1.9],[x-0.4,y+H+0.4,Z]], '#b2c8d2');
  s += poly([[x-0.4,y+H/2,Z+1.9],[x+W+0.4,y+H/2,Z+1.9],[x+W+0.4,y+H+0.4,Z],[x-0.4,y+H+0.4,Z]], '#a4473a');
  s += poly([[x-0.4,y-0.4,Z],[x+W+0.4,y-0.4,Z],[x+W+0.4,y+H/2,Z+1.9],[x-0.4,y+H/2,Z+1.9]], '#c95a48');
  for (let t = 0.2; t < 1; t += 0.2) s += line([x-0.4, y+H/2+(H/2+0.4)*t, Z+1.9*(1-t)], [x+W+0.4, y+H/2+(H/2+0.4)*t, Z+1.9*(1-t)], '#8c3a2f', 0.9);
  // flower box under window
  s += box(x+W, y+0.9, 1.25, 0.4, 2.2, 0.3, '#5a3a1e', '#8a6238', '#7a5233');
  [1.1,1.6,2.1,2.7].forEach((t,i) => s += Ci(...iso(x+W+0.2, y+t, 1.75), 2.2, ['#ff6b8a','#ffd54d','#b38cf2','#ff8a4d'][i]));
  return { depth: x + y + 8, svg: s };
}

// cat on the shed roof: napping by day, watching the moon at night
export function cat(night) {
  const [a,b] = iso(33.4, 2.1, 4.95); let c;
  if (!night) {
    c = E(a+1, b+1, 9, 2.4, '#000', 'opacity=".15"') + E(a, b-3, 8, 4.4, '#e8954a') + `<path d="M${f1(a+7)} ${f1(b-2)} q6 2 3 -4 q-2 -3 -5 -1" stroke="#e8954a" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      L(a-2, b-6.6, a-1, b-3, '#c4702c', 1) + L(a+1.4, b-6.8, a+2, b-3, '#c4702c', 1) + L(a+4.4, b-6, a+4.6, b-2.6, '#c4702c', 1) +
      Ci(a-6.4, b-3.6, 3.6, '#eea05a') + `<path d="M${f1(a-9.4)} ${f1(b-5.4)} l0.6 -3.8 l2.6 2.4 z M${f1(a-5.6)} ${f1(b-6.6)} l1.8 -3.4 l1.4 3.2 z" fill="#e8954a"/>` + L(a-8.4, b-3.4, a-7, b-3.2, '#5a3a1e', 0.7) + L(a-5.6, b-3.2, a-4.2, b-3.4, '#5a3a1e', 0.7);
    // drifting z's, drawn as strokes (decoration, not lettering)
    c += [0, 1, 2].map(n => { const k = 3.4 + n * 0.6, x = a - 8, y = b - 11; return `<path class="zz" style="animation-delay:${-n}s" d="M${f1(x)} ${f1(y - k)} h${f1(k)} l${f1(-k)} ${f1(k)} h${f1(k)}" stroke="#6a7a9a" stroke-width="1.3" fill="none" stroke-linejoin="round"/>`; }).join('');
  } else {
    c = E(a, b-5, 4.4, 6, '#262833') + Ci(a+1, b-12.6, 3.4, '#262833') + `<path d="M${f1(a-1.6)} ${f1(b-14.6)} l0.4 -4 l2.6 2.6 z M${f1(a+2)} ${f1(b-15.2)} l1.8 -3.6 l1 3.8 z" fill="#262833"/>` +
      `<g class="tail"><path d="M${f1(a-3)} ${f1(b-1)} q-8 -1 -6 -10" stroke="#262833" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>` + `<path d="M${f1(a+3.6)} ${f1(b-14)} q1.2 2.6 0.4 5" stroke="#9fb4e8" stroke-width="0.8" fill="none" opacity=".7"/>`;
  }
  return { depth: 38.2, svg: c };
}

export function waterButt() {
  const [a,b] = iso(31.5, 6.5);
  return { depth: 38.5, svg: E(a+4, b+2, 12, 5, '#000', 'opacity=".15"') + `<rect x="${f1(a-9)}" y="${f1(b-26)}" width="18" height="26" fill="#3f7a5a"/>` + E(a, b, 9, 4, '#3f7a5a') + E(a, b-26, 9, 4, '#5a9a76') + E(a, b-26, 7, 2.8, '#2c5a7a') + L(a-9, b-9, a+9, b-9, '#2f5f45', 1.6) + L(a-9, b-18, a+9, b-18, '#2f5f45', 1.6) };
}

export function compostBin(r) {
  const x = 31, y = 10, W = 3, H = 3, Z = 1.6;
  let s = box(x, y, 0, W, H, Z, '#5a3a1e', '#a07a4a', '#86613a');
  for (let z = 0.3; z < Z; z += 0.32) s += line([x,y+H,z],[x+W,y+H,z],'#6e4a2a',1.4) + line([x+W,y,z],[x+W,y+H,z],'#5a3a1e',1.4);
  s += poly([[x+0.2,y+0.2,Z-0.1],[x+W-0.2,y+0.2,Z-0.1],[x+W-0.2,y+H-0.2,Z-0.1],[x+0.2,y+H-0.2,Z-0.1]], '#4a2e1a');
  for (let i = 0; i < 8; i++) s += Ci(...iso(x+0.5+r()*2, y+0.5+r()*2, Z-0.1), 1.6, ['#7cc451','#f08a24','#e9d3a6','#5a9a35'][i%4]);
  return { depth: x + y + 3, svg: s };
}

export const WHEELBARROW = { x: 38.2, y: 9.6 };
export function wheelbarrow() {
  const [a,b] = iso(WHEELBARROW.x, WHEELBARROW.y);
  return { depth: WHEELBARROW.x + WHEELBARROW.y + 0.5, svg: E(a+4, b+3, 16, 5, '#000', 'opacity=".15"') + Ci(a-12, b-4, 5, '#3a3a3a') + Ci(a-12, b-4, 2, '#9a9a9a') + `<path d="M${f1(a-18)} ${f1(b-16)} L${f1(a+10)} ${f1(b-16)} L${f1(a+4)} ${f1(b-6)} L${f1(a-14)} ${f1(b-6)} Z" fill="#2f86c9"/>` + `<path d="M${f1(a-17)} ${f1(b-16)} L${f1(a+9)} ${f1(b-16)} L${f1(a+7)} ${f1(b-13)} L${f1(a-15)} ${f1(b-13)} Z" fill="#6b4a2e"/>` + Ci(a-8, b-17, 3, '#f08a24') + Ci(a-2, b-17.5, 3.2, '#f4cc3a') + L(a+4, b-10, a+18, b-4, '#7a5233', 2) + L(a+2, b-6, a+2, b+2, '#555', 1.6) };
}

// watering can on the gravel by Jun bed
export function wateringCan() {
  const [a,b] = iso(27.4, 11.8);
  return { depth: 39.5, svg: E(a+2, b+1, 8, 2.6, '#000', 'opacity=".15"') + `<rect x="${f1(a-6)}" y="${f1(b-11)}" width="12" height="11" rx="2" fill="#4caf7a"/>` + L(a+6, b-8, a+13, b-15, '#4caf7a', 2.2) + E(a+13.5, b-15.5, 2.4, 1.2, '#3d9468') + `<path d="M${f1(a-5)} ${f1(b-11)} q5 -8 10 0" stroke="#3d9468" stroke-width="1.8" fill="none"/>` };
}

export function gnome() {
  const [a,b] = iso(-0.9, 21.5);
  return { depth: 20.9, svg: E(a+2, b+1, 5, 1.8, '#000', 'opacity=".2"') + `<rect x="${f1(a-3)}" y="${f1(b-7)}" width="6" height="7" rx="2" fill="#2f86c9"/>` + Ci(a, b-9, 2.6, '#f2c9a0') + `<path d="M${f1(a-2.6)} ${f1(b-8)} L${f1(a+2.6)} ${f1(b-8)} L${f1(a+0.6)} ${f1(b-11)} L${f1(a)} ${f1(b-17)} Z" fill="#e53b2c"/>` + `<path d="M${f1(a-2.4)} ${f1(b-8.4)} q2.4 5 4.8 0" fill="#ffffff"/>` };
}

// plaque: a three-line board on posts, anchored in screen space (a = centre, b = ground line)
// in the front-right corner of the lawn; the night lantern hangs on a pole above the board.
export const PLAQUE = { a: 646, b: 620, w: 196, h: 64, fs1: 16, fs2: SIGN_FS_SMALL, post: 26, lantern: 38 };
export function plaqueBoard({ a, b, w, h } = PLAQUE) { return { x0: a - w/2, x1: a + w/2, y0: b - h - 10, y1: b - 10 }; }
// everything the sign occupies on screen: board, posts and (night) lantern
export function plaqueBounds(p = PLAQUE) { const r = plaqueBoard(p); return { x0: r.x0, x1: r.x1 + 2, y0: r.y0 - p.lantern - 14, y1: p.b }; }
export function plaqueLantern(p = PLAQUE) { const r = plaqueBoard(p); return { x: r.x1 - 64, y: r.y0 - p.lantern, base: r.y0 }; }
export function plaque({ total, longestStreak }, night = false, signName = 'MY PLOT') {
  const { a, b, w, h, fs1, fs2, post } = PLAQUE, r = plaqueBoard(), c = boardColours(night), ink2 = INK_SOFT;
  const l2 = `${total} contribution${total === 1 ? '' : 's'}`, l3 = `${longestStreak}-day streak`;
  return { depth: 80, svg: L(a-w/2+post, b, a-w/2+post, r.y1, '#7a5233', 3) + L(a+w/2-post, b, a+w/2-post, r.y1, '#7a5233', 3) +
    `<rect x="${f1(r.x0)}" y="${f1(r.y0)}" width="${w}" height="${h}" rx="5" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.8"/>` +
    txt(a, r.y0 + 20, fs1, signName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) + txt(a, r.y0 + 39, fs2, l2, ink2) + txt(a, r.y0 + 57, fs2, l3, ink2) };
}

export function bird() {
  const [a,b] = iso(12, -5, 1.7);
  return { depth: 100, svg: '<g class="hop">' + E(a, b-2, 3.4, 2.4, '#5a6f8a') + Ci(a+2.6, b-4, 1.8, '#5a6f8a') + `<path d="M${f1(a+4.2)} ${f1(b-4)} l2 0.6 l-2 0.6z" fill="#f4cc3a"/>` + Ci(a+3, b-4.4, 0.4, '#000') + E(a-0.4, b-1.2, 2.2, 1.2, '#e86a4a') + '</g>' };
}

// gardener standing at world (x, y), tending the plant at screen (px, py):
// watering by day, lantern at night. Returns the drop keyframe offset by day.
export function gardener({ x, y, px, py }, night) {
  const [a,b] = iso(x, y);
  let g = E(a+3, b+1, 7, 2.4, '#000', 'opacity=".2"');
  g += `<rect x="${f1(a-3)}" y="${f1(b-8)}" width="2.4" height="8" fill="#3a3a4a"/><rect x="${f1(a+0.6)}" y="${f1(b-8)}" width="2.4" height="8" fill="#3a3a4a"/>`;
  g += `<rect x="${f1(a-4)}" y="${f1(b-17)}" width="8" height="10" rx="2" fill="#3f6fb5"/><rect x="${f1(a-3)}" y="${f1(b-17)}" width="6" height="3" fill="#e9e4d4"/>`;
  g += Ci(a, b-20.5, 3.4, '#f2c9a0') + E(a, b-22.6, 7, 2, '#e3c27a') + E(a, b-24, 3.6, 2.2, '#d6b064') + L(a-3.6, b-23.2, a+3.6, b-23.2, '#b8913f', 1);
  let drop = null, glow = '';
  if (!night) {
    const sx = a - 18, sy = b - 17, dx = px - sx, dy = py - 4 - sy;
    drop = { dx: (dx*0.5 - 4).toFixed(0), dy: (dy*0.5 + 14).toFixed(0) };
    g += L(a-4, b-15, a-8, b-12, '#e9e4d4', 2) + `<rect x="${f1(a-14)}" y="${f1(b-15)}" width="7" height="6" rx="1.4" fill="#4caf7a"/>` + L(a-14, b-13, a-18, b-17, '#4caf7a', 1.6);
    for (let n = 0; n < 5; n++) g += `<circle class="drop" style="animation-delay:${(-n*0.18).toFixed(2)}s" cx="${f1(a-18)}" cy="${f1(b-17)}" r="1.1" fill="#7cc4ee"/>`;
  } else {
    g += L(a+4, b-15, a+8, b-11, '#e9e4d4', 2) + L(a+8, b-11, a+8, b-8, '#3a3428', 0.8) + `<rect x="${f1(a+6)}" y="${f1(b-8)}" width="4" height="5" rx="1" fill="#ffd27a"/>`;
    glow = E(a+8, b+1, 28, 10, 'url(#gWarm)') + Ci(a+8, b-5.5, 14, 'url(#gWarm)') + `<rect x="${f1(a+6)}" y="${f1(b-8)}" width="4" height="5" rx="1" fill="#fff1c4"/>`;
  }
  return { depth: x + y + 0.5, svg: `<g id="gardener">${g}</g>`, glow, drop };
}

// ---------- lawn life ----------

// screen-space check for the sign (board, posts, lantern) plus a little room; the coop strip is the left lawn between the apple trees
const underSign = (x, y) => { const [a, b] = iso(x, y), r = plaqueBounds(); return a > r.x0 - 12 && a < r.x1 + 12 && b > r.y0 - 6 && b < r.y1 + 6; };
const busy = (x, y) => underSign(x, y) || (x < -2.6 && y > 8.4 && y < 15.8) || (x > -2.6 && x < 29.2 && y > -2.6 && y < 23.4) || (x > 30 && x < 37 && y < 4.5) || (x > 30 && x < 35 && y > 5 && y < 13.5) || (x > 36.8 && x < 39.8 && y > 8.4 && y < 11) || (x > 35 && x < 40 && y > 11 && y < 16) || y < -3.6 || x < -5.4 || (x < -2.6 && Math.abs(y - 6) < 2.4) || (x < -2.6 && Math.abs(y - 17.5) < 2.2) || (x > 36.6 && y < -1.4);

// lavender + cosmos border along the front and left of the gravel
export function borders() {
  const out = [];
  const tuft = (a, b) => E(a, b, 6, 2.4, '#5f8f4a') + [...Array(5)].map((_, i) => L(a-4+i*2, b-1, a-5+i*2.5, b-8-(i%2)*2, '#7f6fc9', 1.8)).join('');
  for (let x = -1.5; x <= 28.5; x += 1.15) { const [a,b] = iso(x, 23.3); out.push({ depth: x + 23.3, svg: tuft(a, b) + (Math.round(x*3) % 4 === 0 ? Ci(a+3, b-6, 2.2, '#ff8fb1') + Ci(a+3, b-6, 0.8, '#ffd23f') : '') }); }
  for (let y = -1.5; y <= 22.5; y += 1.15) { const [a,b] = iso(-2.4, y); out.push({ depth: -2.4 + y, svg: tuft(a, b) + (Math.round(y*3) % 5 === 0 ? Ci(a-2, b-7, 2.2, '#ffffff') + Ci(a-2, b-7, 0.8, '#ffd23f') : '') }); }
  return out;
}

// wildflower clumps on open lawn: one group, drawn just above the lawn so its
// markup never depends on the data (depth-sorting each clump would).
export function wildflowers(r) {
  let s = '';
  for (let n = 0; n < 160; ) {
    const x = -7 + r()*47, y = -6 + r()*31; if (busy(x, y)) continue; n++;
    const [a,b] = iso(x, y), c = ['#ff6b8a','#ffd23f','#ffffff','#b38cf2','#ff9b4d'][n%5];
    s += L(a, b, a-1, b-4, '#5a9a35', 0.8) + L(a, b, a+1.5, b-3.4, '#5a9a35', 0.8) + Ci(a-1, b-4.6, 1.3, c) + Ci(a+1.6, b-4, 1.1, c);
  }
  return { depth: BG, svg: `<g id="wildflowers">${s}</g>` };
}

export function pond() {
  const [a,b] = iso(37.4, 13.4);
  return [
    { depth: 37.4 + 11, svg: E(a, b, 34, 17, '#8a7a5a') + E(a, b-1, 32, 15.5, '#4fa3d9') + E(a-6, b-4, 16, 6, '#7cc4ee', 'opacity=".7"') + E(a+10, b+3, 5, 2.4, '#4f9a35') + E(a-12, b+5, 4, 2, '#5aa83a') + Ci(a+11, b+1.6, 1.4, '#ff8fb1') + E(a+2, b+8, 3.4, 1.6, '#4f9a35') },
    ...[0, -1.5].map(o => ({ depth: 37.4 + 11.5, svg: `<ellipse class="rp" style="animation-delay:${o}s" cx="${f1(a+4)}" cy="${f1(b-2)}" rx="14" ry="6" fill="none" stroke="#d6efff" stroke-width="1.2"/>` })),
  ];
}

// bees only fly by day
export function beehive(night) {
  const x = 37.6, y = 6.6;
  let s = box(x, y, 0, 1.4, 1.4, 0.4, '#d9b45a', '#c99a3a', '#a87f2a') + box(x, y, 0.4, 1.4, 1.4, 0.55, '#f4cc3a', '#e8b830', '#c99a24') + box(x, y, 0.95, 1.4, 1.4, 0.55, '#f4cc3a', '#e8b830', '#c99a24') + box(x-0.15, y-0.15, 1.5, 1.7, 1.7, 0.18, '#a4473a', '#8c3a2f', '#7a3228');
  const [a,b] = iso(x+0.4, y+1.4, 0.2);
  s += `<rect x="${f1(a-3)}" y="${f1(b-1.5)}" width="6" height="2" fill="#3a2312"/>`;
  if (!night) [[12,-22],[16,-30],[-10,-26]].forEach(([dx,dy], n) => s += `<g class="bee" style="transform-origin:${f1(a)}px ${f1(b-24)}px;animation-duration:${f1(2.4+n*0.7)}s;animation-delay:${-n}s">` + E(a+dx, b+dy, 1.8, 1.2, '#f4cc3a') + L(a+dx-0.6, b+dy, a+dx+0.6, b+dy, '#3a2312', 0.8) + E(a+dx, b+dy-1.2, 1.2, 0.7, '#ffffff', 'opacity=".8"') + '</g>');
  return { depth: x + y + 3, svg: s };
}

function hen(x, y, c, flip) {
  const [a,b] = iso(x, y), f = flip ? -1 : 1;
  return E(a+2, b+1, 6, 2, '#000', 'opacity=".15"') + E(a, b-5, 5, 4, c) + `<path d="M${f1(a-4*f)} ${f1(b-6)} l${-3*f} -4 l${1*f} 5 z" fill="${c}"/>` + Ci(a+4*f, b-10, 2.6, c) + `<path d="M${f1(a+6.4*f)} ${f1(b-10.4)} l${2*f} 0.8 l${-2*f} 0.8z" fill="#f4a020"/>` + E(a+3.6*f, b-13, 1.4, 1, '#e53b2c') + Ci(a+4.6*f, b-10.6, 0.5, '#000') + L(a-1, b-1.4, a-1, b+1, '#f4a020', 0.8) + L(a+1, b-1.4, a+1, b+1, '#f4a020', 0.8);
}
// the hens are out by day and not drawn at all at night
export const COOP = { x: -5.4, y: 9.6, W: 2.8, H: 2.4, Z: 1.5, lg: 0.5 };
export const HENS = [{ x: -4.2, y: 13.3, c: '#ffffff', flip: false, delay: 0 }, { x: -3.1, y: 12.6, c: '#c8783a', flip: true, delay: -1.7 }, { x: -5.0, y: 14.3, c: '#3a3a3a', flip: false, delay: -3.1 }];
export function hens(night) {
  if (night) return [];
  return HENS.map(({ x, y, c, flip, delay }) => ({ depth: x + y + 0.6, svg: `<g class="hen pk${flip ? ' pkr' : ''}" style="animation-delay:${delay}s">` + hen(x, y, c, flip) + '</g>' }));
}

// chicken coop (door open by day, shut at night; window lit at night)
export function coop(night) {
  const { x, y, W, H, Z, lg } = COOP; let o = '';
  o += E(...iso(x+W/2+0.6, y+H/2+0.6), 34, 13, '#000', 'opacity=".14"');
  [[x+0.15,y+H-0.15],[x+W-0.15,y+H-0.15],[x+W-0.15,y+0.15]].forEach(([lx,ly]) => o += line([lx,ly,0],[lx,ly,lg],'#5a3a1e',2.4));
  o += box(x, y, lg, W, H, Z, '#8c3a2f', '#c0603a', '#9c4a2e');
  for (let z = lg+0.3; z < lg+Z; z += 0.3) o += line([x,y+H,z],[x+W,y+H,z],'#a8502f',0.8) + line([x+W,y,z],[x+W,y+H,z],'#86402a',0.8);
  o += poly([[x+0.9,y+H,lg],[x+1.9,y+H,lg],[x+1.9,y+H,lg+0.95],[x+0.9,y+H,lg+0.95]], night ? '#9c4a2e' : '#2a1a10') + (night ? line([x+1.4,y+H,lg],[x+1.4,y+H,lg+0.95],'#7a3a24',1) : '');
  o += poly([[x+0.9,y+H,lg],[x+1.9,y+H,lg],[x+2.1,y+H+1.4,0],[x+0.7,y+H+1.4,0]], '#a07a4a') + line([x+0.85,y+H+0.45,0.33],[x+1.95,y+H+0.45,0.33],'#7a5233',0.8) + line([x+0.8,y+H+0.9,0.17],[x+2,y+H+0.9,0.17],'#7a5233',0.8);
  const win = [[x+W,y+0.7,lg+0.6],[x+W,y+1.6,lg+0.6],[x+W,y+1.6,lg+1.2],[x+W,y+0.7,lg+1.2]];
  o += poly(win, night ? '#ffc861' : '#3a2a1a');
  o += poly([[x-0.3,y-0.3,lg+Z+0.7],[x+W+0.3,y-0.3,lg+Z+0.7],[x+W+0.3,y+H+0.4,lg+Z-0.1],[x-0.3,y+H+0.4,lg+Z-0.1]], '#5a4a3a') + line([x-0.3,y+H+0.4,lg+Z-0.1],[x+W+0.3,y+H+0.4,lg+Z-0.1],'#3a2e24',1.4);
  let glow = '';
  if (night) { const [a,b] = iso(x+W, y+1.15, lg+0.9); glow = Ci(a, b, 16, 'url(#gWarm)') + poly(win, '#ffc861'); }
  return { depth: x + y + 3.2, svg: o, glow };
}

// butterflies over the beds
export function butterflies() {
  return [[6, 3, 3.2], [17, 11, 3.6], [24, 18, 3.4]].map(([x, y, z], i) => {
    const [a,b] = iso(x, y, z), c = ['#ff9b4d','#7fb8ff','#ff6b8a'][i];
    return { depth: 500, svg: `<g class="bf" style="animation-duration:${7+i*2}s;animation-delay:${f1(-i*2.3)}s"><g class="fl">` + E(a-2, b, 2.4, 1.6, c, `transform="rotate(-30 ${f1(a-2)} ${f1(b)})"`) + E(a+2, b, 2.4, 1.6, c, `transform="rotate(30 ${f1(a+2)} ${f1(b)})"`) + L(a, b-1.4, a, b+1.4, '#3a2312', 0.6) + '</g></g>' };
  });
}

// cloud shadows drifting over the whole plot
export function clouds() {
  return { depth: 900, svg: `<clipPath id="lawnClip"><polygon points="${pts([[-7,-6],[40,-6],[40,25],[-7,25]])}"/></clipPath><g clip-path="url(#lawnClip)"><g class="cl" style="animation-duration:38s;animation-delay:0s">${E(...iso(4,4), 150, 60, '#1a3a1a', 'opacity=".08"')}</g><g class="cl" style="animation-duration:46s;animation-delay:-22s">${E(...iso(20,16), 120, 48, '#1a3a1a', 'opacity=".07"')}</g></g>` };
}
