// Seed packets for the pinned public repos. Packets are built from the pinned repo
// list; config overrides (readme.packets.overrides, keyed by repo name) replace the
// generated content, and readme.packets.exclude (plus the profile repo) are skipped.
import { rng } from '../rng.mjs';
import { SANS, PAL, f1, esc, doc, compose, lit, sign, firefly, monoW, flower, E, Ci, L, leaf } from './kit.mjs';

export const MAX_PACKETS = 6;

const LANG_ART = { Python: 'seedPython', TypeScript: 'seedTypeScript', JavaScript: 'seedJavaScript' };
export const artFor = lang => LANG_ART[lang] ?? 'seedOther';
export const slugify = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;

// Pinned repo nodes -> packets, keeping pinned order. `log` gets a one-line note per skipped repo.
export function selectPackets(nodes, { overrides = {}, exclude = [], log = () => {} } = {}) {
  const out = [], skip = new Set(exclude);
  for (const n of nodes) {
    if (!n?.name || n.isPrivate || skip.has(n.name)) continue;
    const langs = (n.languages?.nodes ?? []).map(l => l.name).filter(Boolean).slice(0, 3);
    const o = Object.hasOwn(overrides, n.name) ? overrides[n.name] : undefined;
    const desc = n.description?.trim();
    if (!o && !desc) { log(`seed packets: skipping ${n.name} (no description and no override)`); continue; }
    out.push({
      name: n.name,
      slug: o?.slug ?? (slugify(n.name) || 'repo'),
      title: o?.title ?? n.name.toUpperCase(),
      line: o?.line ?? clip(desc, 70),
      tags: o?.tags ?? langs,
      url: o?.url ?? n.url,
      art: o?.art ?? artFor(langs[0]),
    });
    if (out.length === MAX_PACKETS) break;
  }
  return out;
}

const attr = s => esc(s).replace(/"/g, '&quot;');
export const packetAlt = p => `${p.name ?? p.title} seed packet: ${p.line.replace(/[.\s]+$/, '')}.${p.tags.length ? ` ${p.tags.join(', ')}.` : ''}`;

// The README section between the seed-packets markers: one centred row, ~3 packets per line.
// imagesDir: where the packet SVGs live in the profile repo.
export function packetsHtml(packets, imagesDir = 'readme') {
  if (!packets.length) return '';
  const items = packets.map(p => [
    `  <a href="${attr(p.url)}">`,
    `    <picture>`,
    `      <source media="(prefers-color-scheme: dark)" srcset="${imagesDir}/packet-${p.slug}-night.svg">`,
    `      <source media="(prefers-color-scheme: light)" srcset="${imagesDir}/packet-${p.slug}-day.svg">`,
    `      <img alt="${attr(packetAlt(p))}" src="${imagesDir}/packet-${p.slug}-day.svg" width="31%">`,
    `    </picture>`,
    `  </a>`,
  ].join('\n'));
  return `<p align="center">\n${items.join('\n')}\n</p>`;
}

// Shown at ~31% of the README column (~260 CSS px), so 1 CSS px ~ 1.3 units here:
// main lettering >= 17, small print >= 13.5.
const W = 340, H = 480;
const X0 = 18, X1 = 322, TOP = 30, BOT = 458;
export const PACKET_FONT = { main: 17, small: 13.5 };
const SANS_W = 0.52; // average sans glyph width (em) for wrapping the description

// greedy word wrap into lines no wider than `max` px at `size`
function wrap(text, size, max) {
  const lines = [];
  for (const word of text.split(/\s+/)) {
    const cur = lines.at(-1);
    if (cur !== undefined && (cur + ' ' + word).length * size * SANS_W <= max) lines[lines.length - 1] = cur + ' ' + word;
    else lines.push(word);
  }
  return lines;
}

// even out a two-line wrap so the second line isn't a lonely word or two
function balance(lines, size, max) {
  if (lines.length < 2) return lines;
  const words = lines.join(' ').split(' ');
  let best = lines;
  for (let k = 1; k < words.length; k++) {
    const pair = [words.slice(0, k).join(' '), words.slice(k).join(' ')];
    if (pair[0].length * size * SANS_W > max || pair[1].length * size * SANS_W > max) continue;
    if (Math.max(...pair.map(l => l.length)) < Math.max(...best.map(l => l.length))) best = pair;
  }
  return best;
}

// description: up to two lines at the main size, shrinking to the small size, then clipped
export function descLines(line, max = 264) {
  for (let size = PACKET_FONT.main; size >= PACKET_FONT.small; size -= 0.5) {
    const lines = wrap(line, size, max);
    if (lines.length <= 2) return { size, lines: balance(lines, size, max) };
  }
  const size = PACKET_FONT.small, all = wrap(line, size, max);
  return { size, lines: [all[0], clip(all.slice(1).join(' '), Math.floor(max / (size * SANS_W)))] };
}

// tag pills at the main size, shrinking to fit, dropping trailing tags if they still don't
export function pillLayout(tags, max = 264, gap = 8) {
  for (let n = tags.length; n > 0; n--) {
    const t = tags.slice(0, n);
    for (let size = PACKET_FONT.main; size >= PACKET_FONT.small; size -= 0.5) {
      const ws = t.map(x => monoW(x, size) + 16), total = ws.reduce((a, b) => a + b, 0) + gap * (n - 1);
      if (total <= max) return { size, tags: t, ws, total, gap };
    }
  }
  return { size: PACKET_FONT.main, tags: [], ws: [], total: 0, gap };
}

// footer URL, shrinking to the small size; drop the host if it still doesn't fit
export function footLine(url, max = 262) {
  let foot = url.replace(/^https?:\/\//, '');
  if (foot.length * 0.6 * PACKET_FONT.small > max) foot = foot.replace(/^github\.com\//, '');
  return { foot: clip(foot, Math.floor(max / (0.6 * PACKET_FONT.small))), size: Math.max(PACKET_FONT.small, Math.min(15, max / (foot.length * 0.6))) };
}

// a seed sprouting out of a strip of film, with two short vertical clips floating off it
function filmSprout(x, y, w, h) {
  let o = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3eed3"/><stop offset="1" stop-color="#f6eed6"/></linearGradient>`;
  o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky)"/>`;
  o += Ci(x + w - 46, y + 34, 18, '#f8dc8a', 'opacity=".55"') + Ci(x + w - 46, y + 34, 11, '#f6cf63', 'opacity=".7"');
  o += `<path d="M${x} ${y + h - 30} Q${x + w * 0.3} ${y + h - 52} ${x + w * 0.6} ${y + h - 38} T${x + w} ${y + h - 44} V${y + h} H${x} Z" fill="#b9d996" opacity=".7"/>`;
  // film strip, slightly tilted
  const cx = x + w / 2, cy = y + h - 34;
  let strip = `<rect x="${cx - 190}" y="${cy - 23}" width="380" height="46" fill="#2e2b28"/>`;
  for (let sx = cx - 186; sx < cx + 190; sx += 12) strip += `<rect x="${sx}" y="${cy - 19}" width="6" height="5" rx="1.2" fill="#efe4cc"/><rect x="${sx}" y="${cy + 14}" width="6" height="5" rx="1.2" fill="#efe4cc"/>`;
  const tints = ['#9cc3d8', '#f2d48a', '#a9d38a', '#f0b49a'];
  for (let i = -4; i <= 4; i++) {
    const fx = cx + i * 42 - 17;
    if (i === 0) { strip += `<rect x="${fx}" y="${cy - 11}" width="34" height="22" rx="2" fill="#6a4529"/>` + E(cx, cy + 3, 13, 5, '#4a2e1a'); continue; }
    strip += `<rect x="${fx}" y="${cy - 11}" width="34" height="22" rx="2" fill="${tints[(i + 8) % 4]}"/>`;
    strip += `<path d="M${fx} ${cy + 11} L${fx + 12} ${cy + 1} L${fx + 20} ${cy + 7} L${fx + 26} ${cy + 3} L${fx + 34} ${cy + 11} Z" fill="#000" opacity=".14"/>`;
  }
  o += `<g transform="rotate(-7 ${cx} ${cy})">${strip}</g>`;
  // seed + sprout from the middle frame
  const sx = cx, sy = cy - 2;
  let sp = `<path d="M${sx} ${sy} C${sx - 2} ${sy - 26} ${sx + 10} ${sy - 44} ${sx + 2} ${sy - 72}" stroke="#5a9a35" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  sp += leaf(sx + 2, sy - 70, 34, -62, 10, 'url(#leafA)') + leaf(sx + 2, sy - 70, 30, 58, 9, 'url(#leafB)');
  sp += `<path d="M${sx + 2} ${sy - 70} L${f1(sx + 2 - 26)} ${sy - 86}" stroke="#a8d880" stroke-width="1.3" opacity=".8"/><path d="M${sx + 2} ${sy - 70} L${sx + 26} ${sy - 84}" stroke="#a8d880" stroke-width="1.3" opacity=".7"/>`;
  sp += leaf(sx + 3, sy - 72, 12, 8, 3.6, '#8fd45b');
  o += `<g class="sw" style="animation-duration:4s;animation-delay:-1s">${sp}</g>`;
  o += E(sx, sy + 1, 9, 6.4, '#8a5c34') + `<path d="M${sx - 7} ${sy} Q${sx} ${sy - 7} ${sx + 7} ${sy}" stroke="#5b3c22" stroke-width="1.6" fill="none"/>` + E(sx - 3, sy + 2, 2.4, 1.4, '#b88a5a');
  // short vertical clips drifting up and away
  for (const [qx, qy, rot, t] of [[x + 40, y + 34, -12, '#f2d48a'], [x + 70, y + 66, 9, '#9cc3d8']]) {
    o += `<g transform="rotate(${rot} ${qx} ${qy})"><rect x="${qx - 11}" y="${qy - 19}" width="22" height="38" rx="3" fill="#2e2b28"/><rect x="${qx - 8}" y="${qy - 15}" width="16" height="30" rx="1.5" fill="${t}"/><path d="M${qx - 3} ${qy - 5} L${qx + 5} ${qy} L${qx - 3} ${qy + 5} Z" fill="#fff" opacity=".85"/></g>`;
  }
  return o;
}

// a sprout whose bloom is a radar dish sending out pulses, with a gig ticket for a plant marker
function radarSprout(x, y, w, h) {
  let o = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4dcef"/><stop offset="1" stop-color="#f6eed6"/></linearGradient>`;
  o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky)"/>`;
  o += Ci(x + 40, y + 32, 17, '#f8dc8a', 'opacity=".55"') + Ci(x + 40, y + 32, 10, '#f6cf63', 'opacity=".7"');
  o += `<path d="M${x} ${y + h - 30} Q${x + w * 0.3} ${y + h - 48} ${x + w * 0.6} ${y + h - 36} T${x + w} ${y + h - 42} V${y + h} H${x} Z" fill="#b9d996" opacity=".75"/>`;
  const px = x + w / 2 - 14, gy = y + h - 26, top = gy - 72;
  o += E(px, gy + 6, 62, 15, '#6a4529') + E(px, gy + 2, 50, 9, '#7d5434');
  for (const [dx, dy] of [[-36, 4], [-14, 9], [20, 6], [38, 3]]) o += E(px + dx, gy + dy, 2.2, 1.3, '#4a2e1a');
  // ticket stub on a stake, planted like a seed label
  const tx = x + 40, ty = gy - 40;
  let tk = `<path d="M${tx + 2} ${ty + 30} L${tx + 4} ${gy + 6}" stroke="#9a6a3e" stroke-width="4" stroke-linecap="round"/>`;
  tk += `<rect x="${tx - 24}" y="${ty}" width="54" height="30" rx="3" fill="#f2d48a" stroke="#b8862a" stroke-width="1.2"/>`;
  tk += `<path d="M${tx + 14} ${ty + 3} V${ty + 27}" stroke="#b8862a" stroke-width="1.2" stroke-dasharray="2.5 2.5"/>`;
  tk += `<path d="M${tx - 6} ${ty + 7} l2.6 5.3 5.8 .8 -4.2 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.2 -4.1 5.8 -.8 Z" fill="#e8708f"/>`;
  o += `<g transform="rotate(-10 ${tx} ${gy})">${tk}</g>`;
  // stem, leaves and the dish (tilted up-right), with pulses rippling out of its feed
  const tilt = 35, rad = tilt * Math.PI / 180, feed = 17;
  let sp = `<path d="M${px} ${gy} C${px - 4} ${gy - 28} ${px + 8} ${gy - 56} ${px} ${top + 10}" stroke="#5a9a35" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  sp += leaf(px + 1, gy - 30, 32, -58, 10, 'url(#leafA)') + leaf(px + 2, gy - 48, 28, 60, 9, 'url(#leafB)');
  let dish = `<path d="M0 6 V13" stroke="#5a9a35" stroke-width="4" stroke-linecap="round"/>`;
  dish += `<path d="M-23 0 A23 14 0 0 0 23 0 Z" fill="#dfe3ea" stroke="#6f7a8a" stroke-width="1.5"/>` + E(0, 0, 23, 4, '#b7c0cd');
  dish += `<path d="M0 0 V${-feed + 3}" stroke="#6f7a8a" stroke-width="2"/>` + Ci(0, -feed, 3.6, '#e8708f');
  sp += `<g transform="translate(${px} ${top}) rotate(${tilt})">${dish}</g>`;
  o += `<g class="sw" style="animation-duration:5s;animation-delay:-2s">${sp}</g>`;
  const fx = px + feed * Math.sin(rad), fy = top - feed * Math.cos(rad);
  [16, 30, 44].forEach((r, i) => {
    const a0 = rad - 0.75, a1 = rad + 0.75;
    const p0 = [fx + r * Math.sin(a0), fy - r * Math.cos(a0)], p1 = [fx + r * Math.sin(a1), fy - r * Math.cos(a1)];
    o += `<path class="tw" style="animation-delay:${f1(-i * 0.6)}s" d="M${f1(p0[0])} ${f1(p0[1])} A${r} ${r} 0 0 1 ${f1(p1[0])} ${f1(p1[1])}" stroke="#8b5cf6" stroke-width="${f1(3.2 - i * 0.6)}" fill="none" stroke-linecap="round"/>`;
  });
  // two notes drifting up on the right
  for (const [nx, ny, s, d] of [[x + w - 34, y + 92, 1, 0], [x + w - 62, y + 120, 0.8, -1.4]]) {
    o += `<g class="tw" style="animation-delay:${d}s" transform="translate(${nx} ${ny}) scale(${s})" fill="#5a3a1e" opacity=".75">${E(0, 0, 6, 4.4, '#5a3a1e', 'transform="rotate(-20)"')}<path d="M5.2 -1.5 V-26 Q12 -20 14 -12" stroke="#5a3a1e" stroke-width="2" fill="none"/></g>`;
  }
  return o;
}

// generic seed illustration: a seed in a soil mound sprouting a stem and a bloom.
// Variants differ by sky, ground and bloom colour, and bloom shape.
const SEEDS = {
  seedPython: { sky: ['#dbe8f2', '#f6eed6'], ground: '#b9d996', bloom: 'flower', petal: '#f4cc3a', centre: '#3d6f9e' },
  seedTypeScript: { sky: ['#d6e4f4', '#f3ecdc'], ground: '#a9d19a', bloom: 'bell', petal: '#4f86c6', centre: '#2f5d93' },
  seedJavaScript: { sky: ['#f4ecc6', '#f6eed6'], ground: '#c4d98e', bloom: 'tulip', petal: '#f0c93a', centre: '#c9971a' },
  seedOther: { sky: ['#e3eed3', '#f6eed6'], ground: '#b9d996', bloom: 'flower', petal: '#e8708f', centre: '#f4cc3a' },
};

function seedArt(v) {
  return (x, y, w, h) => {
    let o = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${v.sky[0]}"/><stop offset="1" stop-color="${v.sky[1]}"/></linearGradient>`;
    o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#sky)"/>`;
    o += Ci(x + 44, y + 34, 18, '#f8dc8a', 'opacity=".55"') + Ci(x + 44, y + 34, 11, '#f6cf63', 'opacity=".7"');
    o += `<path d="M${x} ${y + h - 30} Q${x + w * 0.3} ${y + h - 50} ${x + w * 0.6} ${y + h - 36} T${x + w} ${y + h - 42} V${y + h} H${x} Z" fill="${v.ground}" opacity=".75"/>`;
    const cx = x + w / 2, gy = y + h - 26;
    o += E(cx, gy + 6, 70, 16, '#6a4529') + E(cx, gy + 2, 56, 10, '#7d5434');
    for (const [dx, dy] of [[-40, 4], [-18, 9], [22, 6], [44, 3], [4, 11]]) o += E(cx + dx, gy + dy, 2.2, 1.3, '#4a2e1a');
    // stem, leaves and bloom
    const top = gy - 92;
    let sp = `<path d="M${cx} ${gy} C${cx - 4} ${gy - 30} ${cx + 8} ${gy - 60} ${cx} ${top}" stroke="#5a9a35" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    sp += leaf(cx + 1, gy - 34, 34, -58, 10, 'url(#leafA)') + leaf(cx + 2, gy - 52, 30, 60, 9, 'url(#leafB)');
    if (v.bloom === 'flower') sp += flower(cx, top - 6, 9, v.petal, v.centre);
    else if (v.bloom === 'bell') sp += `<path d="M${cx - 13} ${top + 6} Q${cx - 14} ${top - 18} ${cx} ${top - 20} Q${cx + 14} ${top - 18} ${cx + 13} ${top + 6} Q${cx + 6} ${top} ${cx} ${top + 7} Q${cx - 6} ${top} ${cx - 13} ${top + 6} Z" fill="${v.petal}"/>` + Ci(cx, top + 6, 3, v.centre);
    else sp += `<path d="M${cx - 13} ${top - 18} L${cx - 6} ${top - 8} L${cx} ${top - 22} L${cx + 6} ${top - 8} L${cx + 13} ${top - 18} Q${cx + 15} ${top + 4} ${cx} ${top + 4} Q${cx - 15} ${top + 4} ${cx - 13} ${top - 18} Z" fill="${v.petal}"/><path d="M${cx} ${top - 22} L${cx + 6} ${top - 8} Q${cx + 13} ${top - 4} ${cx + 13} ${top - 18} Q${cx + 15} ${top + 4} ${cx} ${top + 4} Z" fill="${v.centre}" opacity=".45"/>`;
    o += `<g class="sw" style="animation-duration:4s;animation-delay:-1s">${sp}</g>`;
    o += E(cx, gy - 1, 9, 6.4, '#8a5c34') + `<path d="M${cx - 7} ${gy - 2} Q${cx} ${gy - 9} ${cx + 7} ${gy - 2}" stroke="#5b3c22" stroke-width="1.6" fill="none"/>`;
    return o;
  };
}

const ART = { filmSprout, radarSprout, ...Object.fromEntries(Object.entries(SEEDS).map(([k, v]) => [k, seedArt(v)])) };

// paper grain + worn edges
const PAPER_FX = `<filter id="grainF" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .36  0 0 0 0 .24  0 0 0 0 .12  0 0 0 .55 -.17"/></filter>`;

function packetShape() {
  let top = `M${X0} ${TOP + 8}`;
  for (let x = X0, i = 0; x < X1; x += 8, i++) top += ` L${Math.min(x + 4, X1)} ${TOP} L${Math.min(x + 8, X1)} ${TOP + 8}`;
  return `${top} L${X1} ${BOT - 8} Q${X1} ${BOT} ${X1 - 8} ${BOT} L${X0 + 8} ${BOT} Q${X0} ${BOT} ${X0} ${BOT - 8} Z`;
}

export function renderPacket(p, { night, index = 0 }) {
  const r = rng(61 + index);
  const shape = packetShape();
  let s = `<defs>${PAPER_FX}<clipPath id="pk"><path d="${shape}"/></clipPath><clipPath id="art"><rect x="44" y="148" width="252" height="160" rx="10"/></clipPath>`
    + `<linearGradient id="pkPaper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4e8cc"/><stop offset=".6" stop-color="#eedfbd"/><stop offset="1" stop-color="#e3cfa6"/></linearGradient></defs>`;
  s += `<path d="${shape}" fill="#000" opacity=".14" transform="translate(5 6)"/>`;
  s += `<path d="${shape}" fill="url(#pkPaper)"/>`;
  s += `<g clip-path="url(#pk)">`;
  // crimped top band
  s += `<rect x="${X0}" y="${TOP}" width="${X1 - X0}" height="30" fill="#d9c196"/>`;
  for (let x = X0 + 3; x < X1; x += 4) s += L(x, TOP + 2, x, TOP + 28, '#b89d6e', 0.8);
  s += L(X0, TOP + 30, X1, TOP + 30, '#b89d6e', 1.4);
  // worn edges, creases and grain
  s += `<path d="${shape}" fill="none" stroke="#a88a5c" stroke-opacity=".22" stroke-width="12"/>`;
  s += `<path d="M${X0} 236 Q170 226 ${X1} 240" stroke="#fff" stroke-opacity=".35" stroke-width="1.4" fill="none"/><path d="M${X0} 238 Q170 228 ${X1} 242" stroke="#8a6a44" stroke-opacity=".12" stroke-width="1" fill="none"/>`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" filter="url(#grainF)"/>`;
  s += `</g>`;
  // label frame
  s += `<rect x="32" y="70" width="276" height="${BOT - 82}" rx="8" fill="none" stroke="${PAL.ink}" stroke-opacity=".55" stroke-width="1.6"/><rect x="37" y="75" width="266" height="${BOT - 92}" rx="5" fill="none" stroke="${PAL.ink}" stroke-opacity=".3" stroke-width="1"/>`;
  let t = sign(170, 97, PACKET_FONT.small, `SEED PROJECT · No. ${String(index + 1).padStart(2, '0')}`, { fill: PAL.inkSoft, extra: ' letter-spacing="1.6"' });
  const title = clip(p.title, 22), ts = Math.max(PACKET_FONT.main, Math.min(44, 248 / (title.length * 0.6 + (title.length - 1) * 0.05)));
  t += sign(170, 139, ts, title, { extra: ` letter-spacing="${f1(ts * 0.05)}"` });
  s += `<g clip-path="url(#art)">${ART[p.art](44, 148, 252, 160, r)}</g><rect x="44" y="148" width="252" height="160" rx="10" fill="none" stroke="${PAL.ink}" stroke-opacity=".5" stroke-width="1.4"/>`;
  const d = descLines(p.line), dy = d.lines.length > 1 ? 333 : 342;
  d.lines.forEach((ln, k) => t += `<text x="170" y="${f1(dy + k * (d.size + 4))}" font-size="${f1(d.size)}" text-anchor="middle" font-family="${SANS}" font-style="italic" font-weight="600" fill="${PAL.ink}">${esc(ln)}</text>`);
  // tag pills
  const pl = pillLayout(p.tags);
  let tx = 170 - pl.total / 2;
  pl.tags.forEach((tag, i) => {
    s += `<rect x="${f1(tx)}" y="367" width="${f1(pl.ws[i])}" height="27" rx="13.5" fill="#e3cd9f" stroke="${PAL.inkSoft}" stroke-width="1"/>`;
    t += sign(tx + pl.ws[i] / 2, 386, pl.size, tag);
    tx += pl.ws[i] + pl.gap;
  });
  s += `<path d="M50 408 H290" stroke="${PAL.inkSoft}" stroke-opacity=".6" stroke-width="1" stroke-dasharray="3 3"/>`;
  const { foot, size: fsz } = footLine(p.url);
  t += sign(170, 431, fsz, foot, { fill: PAL.inkSoft });

  let lights = '', pre = '';
  if (night) {
    pre = `<ellipse cx="170" cy="220" rx="200" ry="260" fill="url(#gWarm)" opacity=".5"/>`;
    [[14, 120], [326, 300], [300, 20]].forEach(([x, y], i) => lights += firefly(x, y, i + index));
  }
  const body = pre + compose(night, { signs: lit(night, s) + t, lights });
  return doc({ w: W, h: H, night, label: `${p.title} seed packet: ${p.line}.${p.tags.length ? ` Built with ${p.tags.join(', ')}.` : ''} ${foot}`, body });
}
