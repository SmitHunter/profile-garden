// Legibility guards for every generated SVG: lettering never sits inside a filtered
// group (filters rasterise and soften glyphs), is fully opaque, and is big enough to
// read at the size GitHub shows each image.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../src/readme/build.mjs';
import { renderGarden } from '../src/scene/garden.mjs';
import { renderPacket, selectPackets } from '../src/readme/packets.mjs';
import { planWindow } from '../src/dates.mjs';
import { computeStats } from '../src/stats.mjs';
import { loadConfig } from '../src/config.mjs';

const calendar = new Map(JSON.parse(fs.readFileSync(new URL('./fixtures/calendar-2026-10-17.json', import.meta.url))));
const config = loadConfig(new URL('./fixtures/garden.config.json', import.meta.url));
const win = planWindow(new Date('2026-10-16T18:00:00Z'), config.timezone);

async function allSvgs() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legible-'));
  await build({ config, outDir: dir, fixture: 'tests/fixtures/calendar-2026-10-17.json', pinnedFixture: 'tests/fixtures/pinned.json' });
  const out = fs.readdirSync(dir).filter(f => f.endsWith('.svg')).map(f => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);
  fs.rmSync(dir, { recursive: true, force: true });
  const big = new Map(calendar); big.set('2026-10-10', 1234);
  for (const night of [false, true]) {
    for (const [tag, cal] of [['', calendar], ['-big', big]]) out.push([`garden${tag}-${night ? 'night' : 'day'}.svg`, renderGarden({ calendar: cal, win, stats: computeStats(cal, win), night, signName: config.signName })]);
    const [p] = selectPackets([{ name: 'a-rather-long-repository-name', description: 'A long description that has to wrap onto two lines and then some more words so it clips', url: 'https://github.com/octocat/a-rather-long-repository-name', languages: { nodes: [{ name: 'Jupyter Notebook' }, { name: 'TypeScript' }, { name: 'Dockerfile' }] } }]);
    out.push([`packet-long-${night ? 'night' : 'day'}.svg`, renderPacket(p, { night, index: 5 })]);
  }
  return out;
}

// walk the tags, yielding each <text>/<tspan> with its ancestor chain
function* texts(svg) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
    const [, close, name, attrs, self] = m;
    if (close) { stack.pop(); continue; }
    if (name === 'text' || name === 'tspan') yield { name, attrs, ancestors: [...stack] };
    if (!self) stack.push({ name, attrs });
  }
}

const viewW = svg => Number(svg.match(/viewBox="0 0 ([\d.]+) /)[1]);
// CSS px per SVG unit at GitHub's display size: packets ~260px wide, everything else ~700px
const scale = (name, svg) => (name.startsWith('packet-') ? 260 : 700) / viewW(svg);

test('no text inside a filtered group, no blur, no translucent lettering', async () => {
  for (const [name, svg] of await allSvgs()) {
    assert.ok(!/feGaussianBlur|stdDeviation/.test(svg), `${name} uses blur`);
    let n = 0;
    for (const t of texts(svg)) {
      n++;
      for (const el of [t, ...t.ancestors]) {
        assert.ok(!/\sfilter=/.test(el.attrs), `${name}: <${t.name}> under a filtered <${el.name}>`);
        const op = el.attrs.match(/\s(?:fill-)?opacity="([\d.]+)"/);
        assert.ok(!op || Number(op[1]) >= 1, `${name}: <${t.name}> under opacity ${op?.[1]}`);
      }
    }
    assert.ok(n > 0, `${name} has no text`);
  }
});

test('every text meets the size floor for how big GitHub shows the image', async () => {
  for (const [name, svg] of await allSvgs()) {
    const k = scale(name, svg), sizes = [];
    for (const t of texts(svg)) {
      const own = t.attrs.match(/font-size="([\d.]+)"/);
      const inherited = [...t.ancestors].reverse().map(a => a.attrs.match(/font-size="([\d.]+)"/)).find(Boolean);
      const fs = Number((own ?? inherited)?.[1]);
      assert.ok(fs > 0, `${name}: text without a font-size`);
      sizes.push(fs * k);
    }
    const min = Math.min(...sizes), median = sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
    // small print may drop to 10 CSS px (so may overlong stress-test content);
    // for the real fixture data the bulk of the lettering is >= 12
    assert.ok(min >= 10 - 1e-9, `${name}: smallest text ${min.toFixed(2)} CSS px`);
    if (!/-(?:long|big)-/.test(name)) assert.ok(median >= 12 - 0.05, `${name}: median text ${median.toFixed(2)} CSS px`);
  }
});

test('sign lettering uses real monospace faces, never ui-monospace', async () => {
  for (const [name, svg] of await allSvgs()) {
    assert.ok(!svg.includes('ui-monospace'), name);
    assert.ok(svg.includes('text-rendering="geometricPrecision"'), name);
  }
});
