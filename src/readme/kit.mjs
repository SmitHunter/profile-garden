// Shared drawing kit for the README pieces: document wrapper, day/night
// filters, keyframes and small garden props (lanterns, fireflies, flowers).
import { DEFS, E, Ci, L, leaf, MONO, SANS } from '../scene/draw.mjs';

export { MONO, SANS };
export const f1 = v => (Math.round(v * 10) / 10).toString();
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Menlo / DejaVu Sans Mono advance ~0.6em per glyph (Consolas 0.55), so size boards for 0.6em.
export const monoW = (s, size) => s.length * size * 0.6;

export const PAL = {
  wood: '#a8784a', woodDark: '#8a5c34', woodEnd: '#6e4a2a', woodLight: '#c39363',
  soil: '#5b3c22', paper: '#e9d3a6', paperEdge: '#8a6238', ink: '#3a2410', inkSoft: '#5a3a1e',
  picket: '#f6f1e6', picketShade: '#d8d0bf', lavender: '#7f6fc9', glow: '#ffcf73',
  gravel: '#e9dcc0',
};
// text drawn straight onto the page (no board behind it)
export const pageInk = night => night ? '#e6d6b4' : '#3a2410';
export const pageInkSoft = night => night ? '#b9a786' : '#5a3a1e';

// Moonlight matches the garden's night overlay (#0d1117 at .62 over the day colours);
// lamp light is a warm, slightly dimmed tint for sign boards. Filters only ever wrap
// artwork: lettering is drawn after, unfiltered, so glyphs stay crisp (see lit()).
const FILTERS = (w, h) => `<filter id="moon" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".38 0 0 0 .03  0 .4 0 0 .045  0 0 .48 0 .075  0 0 0 1 0"/></filter>`
  + `<filter id="lamp" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".93 0 0 0 .01  0 .84 0 0 .01  0 0 .68 0 .01  0 0 0 1 0"/></filter>`
  + `<radialGradient id="gWarm"><stop offset="0" stop-color="#ffcf73" stop-opacity=".6"/><stop offset=".45" stop-color="#ffcf73" stop-opacity=".2"/><stop offset="1" stop-color="#ffcf73" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="gMoon"><stop offset="0" stop-color="#cfe0ff" stop-opacity=".3"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="gFly"><stop offset="0" stop-color="#f4ff9a"/><stop offset=".3" stop-color="#d8ff5a" stop-opacity=".7"/><stop offset="1" stop-color="#b8ff3a" stop-opacity="0"/></radialGradient>`
  + `<linearGradient id="woodV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8875a"/><stop offset="1" stop-color="#9a6a3e"/></linearGradient>`
  + `<linearGradient id="paperG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efdcb4"/><stop offset="1" stop-color="#e2c998"/></linearGradient>`;

export const CSS = [
  '.sw{transform-box:fill-box;transform-origin:50% 100%;animation:sway 3s ease-in-out infinite alternate}',
  '@keyframes sway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}',
  '.swing{animation:swing 5s ease-in-out infinite alternate}',
  '@keyframes swing{from{transform:rotate(-.7deg)}to{transform:rotate(.7deg)}}',
  '.fk{animation:flicker 2.3s ease-in-out infinite alternate}',
  '@keyframes flicker{0%{opacity:.78}35%{opacity:1}55%{opacity:.86}80%{opacity:.97}100%{opacity:.82}}',
  '.ff{animation:blink 2.4s ease-in-out infinite,bob1 3.6s ease-in-out infinite alternate}',
  '@keyframes blink{0%,100%{opacity:.08}40%,60%{opacity:1}}',
  '@keyframes bob1{to{transform:translate(9px,-6px)}}', '@keyframes bob2{to{transform:translate(-8px,5px)}}',
  '@keyframes bob3{to{transform:translate(6px,7px)}}', '@keyframes bob4{to{transform:translate(-10px,-4px)}}',
  '.tw{animation:blink 3.4s ease-in-out infinite}',
].join('');

export function doc({ w, h, label, night, body, css = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label).replace(/"/g, '&quot;')}" text-rendering="geometricPrecision"><title>${esc(label)}</title><style>${CSS}${css}</style>${DEFS}<defs>${FILTERS(w, h)}</defs>${body}</svg>`;
}

// Day: everything as drawn. Night: the scene (never text) is moonlit; signs carry
// their own lamplit boards via lit() with unfiltered lettering; `lights` (glows,
// fireflies, stars) and loose `text` sit on top untouched.
export function compose(night, { scene = '', signs = '', lights = '', text = '' }) {
  if (!night) return scene + signs + text;
  return `<g filter="url(#moon)">${scene}</g>${signs}${lights}${text}`;
}

// lamplit artwork at night (boards, chains, nails) - never pass text in here
export const lit = (night, s) => night && s ? `<g filter="url(#lamp)">${s}</g>` : s;

// sign lettering: bold mono, dark ink, crisp
export const sign = (x, y, size, s, { anchor = 'middle', fill = PAL.ink, weight = 700, extra = '' } = {}) =>
  `<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(size)}" font-weight="${weight}"${anchor ? ` text-anchor="${anchor}"` : ''} font-family="${MONO}" fill="${fill}"${extra}>${esc(s)}</text>`;

// a hanging lantern whose ring sits at (x, y); returns { body, glow }
export function lantern(x, y, s = 1, lit = true, delay = 0) {
  const k = v => f1(v * s);
  const body = L(x, y - 10 * s, x, y, '#3a3428', 1.4 * s)
    + `<path d="M${f1(x - 7 * s)} ${f1(y + 4 * s)} L${f1(x + 7 * s)} ${f1(y + 4 * s)} L${f1(x + 4 * s)} ${f1(y)} L${f1(x - 4 * s)} ${f1(y)} Z" fill="#3a3428"/>`
    + `<rect x="${f1(x - 5.5 * s)}" y="${f1(y + 4 * s)}" width="${k(11)}" height="${k(14)}" rx="${k(1.5)}" fill="${lit ? '#ffd98a' : '#cfd6d8'}" stroke="#3a3428" stroke-width="${k(1.6)}"/>`
    + L(x, y + 4 * s, x, y + 18 * s, '#3a3428', 1 * s)
    + `<rect x="${f1(x - 7 * s)}" y="${f1(y + 18 * s)}" width="${k(14)}" height="${k(3)}" rx="${k(1)}" fill="#3a3428"/>`
    + (lit ? Ci(x, y + 11 * s, 2.6 * s, '#fff4d0') : '');
  const glow = lit ? `<g class="fk" style="animation-delay:${f1(delay)}s">${Ci(x, y + 11 * s, 46 * s, 'url(#gWarm)')}${Ci(x, y + 11 * s, 12 * s, 'url(#gWarm)')}</g>` : '';
  return { body, glow };
}

export function firefly(x, y, i) {
  const t = 1.8 + (i * 0.37) % 1.6;
  return `<g class="ff" style="animation-name:blink,bob${(i % 4) + 1};animation-duration:${f1(t)}s,${f1(t * 1.7)}s;animation-delay:${f1(-(i * 0.71) % 3)}s">${Ci(x, y, 7, 'url(#gFly)')}${Ci(x, y, 1.3, '#f8ffc0')}</g>`;
}

export function star(x, y, r, i) {
  return `<circle class="tw" style="animation-duration:${f1(2.4 + (i * 0.53) % 2.2)}s;animation-delay:${f1(-(i * 0.9) % 4)}s" cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#dfe8ff"/>`;
}

// lavender clump rooted at (x, y)
export function lavender(x, y, k, r) {
  let o = E(x + 2 * k, y + 0.6 * k, 9 * k, 2.2 * k, '#000', 'opacity=".12"');
  for (let i = 0; i < 7; i++) {
    const a = -32 + i * 10.5 + (r() - 0.5) * 6, len = (14 + r() * 6) * k;
    const rad = a * Math.PI / 180, ex = x + Math.sin(rad) * len, ey = y - Math.cos(rad) * len;
    o += L(x, y, ex, ey, '#6f9a5a', 0.7 * k);
    for (let j = 0; j < 4; j++) {
      const t = 0.62 + j * 0.12;
      o += E(x + (ex - x) * t, y + (ey - y) * t, 1.3 * k, 2 * k, j % 2 ? '#9585dc' : PAL.lavender, `transform="rotate(${f1(a)} ${f1(x + (ex - x) * t)} ${f1(y + (ey - y) * t)})"`);
    }
  }
  return `<g class="sw" style="animation-duration:${f1(3 + r() * 2)}s;animation-delay:${f1(-r() * 3)}s">${o}</g>`;
}

// little five-petal flower
export function flower(x, y, r, petal, centre = '#f4cc3a') {
  let o = '';
  for (let i = 0; i < 5; i++) { const a = i * 72 * Math.PI / 180; o += Ci(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, petal); }
  return o + Ci(x, y, r * 0.65, centre);
}

// a rose-ish bloom for the vines
export function rose(x, y, r, c1 = '#e8708f', c2 = '#f7a8bb') {
  return Ci(x, y, r, c1) + Ci(x - r * 0.2, y - r * 0.25, r * 0.62, c2) + `<path d="M${f1(x - r * 0.4)} ${f1(y)} q${f1(r * 0.4)} ${f1(-r * 0.5)} ${f1(r * 0.8)} 0" stroke="${c1}" stroke-width="${f1(r * 0.22)}" fill="none"/>`;
}

export function tuft(x, y, c = '#6aa944') {
  const p = `${f1(x)} ${f1(y)}`;
  return `<path d="M${p} l-1.6 -4 M${p} l0.5 -4.8 M${p} l2.1 -3.4" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`;
}

// white picket with a pointed top, base at (x, y)
export function picket(x, y, h, w = 11) {
  return `<path d="M${f1(x)} ${f1(y)} V${f1(y - h + w * 0.5)} L${f1(x + w / 2)} ${f1(y - h)} L${f1(x + w)} ${f1(y - h + w * 0.5)} V${f1(y)} Z" fill="${PAL.picket}"/>`
    + `<path d="M${f1(x + w - 2.6)} ${f1(y)} V${f1(y - h + w * 0.5 + 1.3)} L${f1(x + w)} ${f1(y - h + w * 0.5)} V${f1(y)} Z" fill="${PAL.picketShade}"/>`;
}

// faint wood grain lines inside a rect
export function grain(x, y, w, h, r, n = 3) {
  let o = '';
  for (let i = 0; i < n; i++) {
    const gy = y + h * (0.25 + 0.5 * (i + r() * 0.6) / n), gx = x + w * (0.06 + r() * 0.2), gw = w * (0.3 + r() * 0.5);
    o += `<path d="M${f1(gx)} ${f1(gy)} q${f1(gw / 2)} ${f1((r() - 0.5) * 3)} ${f1(gw)} 0" stroke="#000" stroke-opacity=".08" stroke-width="1" fill="none"/>`;
  }
  return o;
}

// a sign board in paper colours with an ink edge
export function board(x, y, w, h, rx = 5) {
  return `<rect x="${f1(x + 2)}" y="${f1(y + 3)}" width="${f1(w)}" height="${f1(h)}" rx="${rx}" fill="#000" opacity=".16"/>`
    + `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${rx}" fill="url(#paperG)" stroke="${PAL.paperEdge}" stroke-width="2"/>`;
}

export const nail = (x, y) => Ci(x, y, 2.2, '#6b5a48') + Ci(x - 0.6, y - 0.6, 0.8, '#b9a98f');

export { E, Ci, L, leaf };
