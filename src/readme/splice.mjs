// Splices out/readme/packets.html into the profile README between the seed-packets
// markers and prunes packet SVGs that are no longer in the current set.
// A README with neither marker is left alone (the packets section is optional);
// one with a lone or reversed marker is an error.
//   node src/readme/splice.mjs --readme profile/README.md --html out/readme/packets.html --prune profile/readme --keep out/readme
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const START = '<!-- seed-packets:start -->';
export const END = '<!-- seed-packets:end -->';

// Replace everything between the markers with `html` (empty html leaves an empty section).
export const hasMarkers = readme => readme.includes(START) || readme.includes(END);

export function splice(readme, html) {
  const a = readme.indexOf(START), b = readme.indexOf(END);
  if (a < 0 || b < 0 || b < a) throw new Error('README is missing the seed-packets markers');
  const inner = html.trim() ? `\n${html.trim()}\n` : '\n';
  return readme.slice(0, a + START.length) + inner + readme.slice(b);
}

// packet-*.svg names in `dir` that are not in `keep`.
export function stalePackets(existing, keep) {
  const k = new Set(keep);
  return existing.filter(n => /^packet-.*\.svg$/.test(n) && !k.has(n));
}

function prune(dir, keepDir) {
  if (!fs.existsSync(dir)) return [];
  const stale = stalePackets(fs.readdirSync(dir), fs.readdirSync(keepDir));
  for (const n of stale) fs.rmSync(path.join(dir, n));
  return stale;
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const m = /^--(readme|html|prune|keep)$/.exec(argv[i]);
    if (!m) throw new Error(`Unknown argument: ${argv[i]}`);
    o[m[1]] = argv[++i];
  }
  if (!o.readme || !o.html) throw new Error('--readme and --html are required');
  if (!o.prune !== !o.keep) throw new Error('--prune and --keep go together');
  return o;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const a = parseArgs(process.argv.slice(2));
    const readme = fs.existsSync(a.readme) ? fs.readFileSync(a.readme, 'utf8') : null;
    const next = readme !== null && hasMarkers(readme) ? splice(readme, fs.readFileSync(a.html, 'utf8')) : null;
    const removed = a.prune ? prune(a.prune, a.keep) : [];
    if (next !== null) fs.writeFileSync(a.readme, next);
    console.log(`${next !== null ? `spliced seed packets into ${a.readme}` : `no seed-packets markers in ${a.readme}; README left as is`}; pruned ${removed.length ? removed.join(', ') : 'nothing'}`);
  } catch (e) { console.error(e.message); process.exit(1); }
}
