// Builds the themed README images (day/night pairs) into --out.
//   node src/readme/build.mjs [--config garden.config.json] --out out/readme [--fixture tests/fixtures/calendar-2026-10-17.json [--pinned tests/fixtures/pinned.json]]
// Also writes packets.html: the README section for the seed-packets markers (see splice.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { localDate, addDays } from '../dates.mjs';
import { loadConfig, takeConfigArg } from '../config.mjs';
import { fetchCalendar, fetchPinned } from '../github.mjs';
import { renderBanner } from './banner.mjs';
import { renderLegend } from './legend.mjs';
import { renderPacket, selectPackets, packetsHtml, SPACER_SVG } from './packets.mjs';
import { renderGrowing, growingStats } from './growing.mjs';
import { renderStack } from './stack.mjs';
import { renderFooter } from './footer.mjs';

function readFixture(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return new Map(data);
}

// config: a resolved config (see config.mjs)
export async function build({ config, outDir, fixture, pinnedFixture, token, now = new Date(), log = () => {} }) {
  if (!config) throw new Error('build() needs a resolved config');
  const { login, timezone, readme } = config;
  let calendar, pinned, today = localDate(now, timezone), source;
  if (fixture) {
    calendar = readFixture(fixture);
    const last = [...calendar.keys()].sort().at(-1);
    if (last < today) today = last;
    pinned = pinnedFixture ? JSON.parse(fs.readFileSync(pinnedFixture, 'utf8')) : [];
    source = 'fixture';
  } else {
    if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required (pass --fixture to use fixture data)');
    calendar = await fetchCalendar({ token, login, from: addDays(today, -40), to: today });
    pinned = await fetchPinned({ token, login });
    source = 'live';
  }
  const stats = growingStats(calendar, today);
  const packets = selectPackets(pinned, { overrides: readme.packets.overrides, exclude: readme.packets.exclude, log });
  const out = [];
  for (const night of [false, true]) {
    const t = night ? 'night' : 'day';
    out.push([`banner-${t}.svg`, renderBanner({ night, banner: readme.banner })]);
    out.push([`legend-${t}.svg`, renderLegend({ night })]);
    packets.forEach((p, index) => out.push([`packet-${p.slug}-${t}.svg`, renderPacket(p, { night, index })]));
    out.push([`growing-${t}.svg`, renderGrowing(stats, { night })]);
    if (readme.stack.length) out.push([`stack-${t}.svg`, renderStack({ night, stack: readme.stack })]);
    out.push([`footer-${t}.svg`, renderFooter({ night, footer: readme.footer })]);
  }
  if (packets.length) out.push(['spacer.svg', SPACER_SVG]);
  out.push(['packets.html', packetsHtml(packets, readme.imagesDir)]);
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, svg] of out) fs.writeFileSync(path.join(outDir, name), svg);
  return { source, today, stats, files: out.map(([n, s]) => [n, Buffer.byteLength(s)]), packets: packets.map(p => p.slug) };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') o.out = argv[++i];
    else if (argv[i] === '--fixture') o.fixture = argv[++i];
    else if (argv[i] === '--pinned') o.pinned = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return o;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let config, args;
  try {
    const [configFile, argv] = takeConfigArg(process.argv.slice(2));
    config = loadConfig(configFile);
    args = parseArgs(argv);
  } catch (e) { console.error(e.message); process.exit(1); }
  build({ config, outDir: args.out ?? 'out/readme', fixture: args.fixture, pinnedFixture: args.pinned, log: m => console.log(m), token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN })
    .then(({ source, today, stats, files, packets }) => {
      console.log(`seed packets: ${packets.length ? packets.join(', ') : 'none (no eligible pinned repos)'}`);
      console.log(`data: ${source} through ${today}; week ${stats.week}, month ${stats.month}, active ${stats.active}/30`);
      for (const [n, b] of files) console.log(`${n}\t${(b / 1024).toFixed(1)} KB`);
    })
    .catch(e => { console.error(e.message); process.exit(1); });
}
