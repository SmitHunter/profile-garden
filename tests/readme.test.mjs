import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { growingStats, fillShare } from '../src/readme/growing.mjs';
import { build as buildReadme } from '../src/readme/build.mjs';
import { loadConfig, resolveConfig } from '../src/config.mjs';
import { selectPackets } from '../src/readme/packets.mjs';

const config = loadConfig(new URL('./fixtures/garden.config.json', import.meta.url));
const build = (o) => buildReadme({ config, ...o });
const pinned = JSON.parse(fs.readFileSync(new URL('./fixtures/pinned.json', import.meta.url), 'utf8'));

test('growingStats counts the last 7 days, the calendar month and active days in 30', () => {
  const cal = new Map([['2026-09-20', 5], ['2026-09-30', 2], ['2026-10-01', 3], ['2026-10-11', 9], ['2026-10-12', 1], ['2026-10-17', 4]]);
  assert.deepEqual(growingStats(cal, '2026-10-17'), { week: 14, month: 17, active: 6 });
});

test('fillShare is 0 for nothing and capped at 1', () => {
  assert.equal(fillShare(0, 40), 0);
  assert.equal(fillShare(400, 40), 1);
  assert.equal(fillShare(15, 30, true), 0.5);
});

test('build writes day/night pairs that obey the garden constraints', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-'));
  const { files, packets } = await build({ outDir: dir, fixture: 'tests/fixtures/calendar-2026-10-17.json', pinnedFixture: 'tests/fixtures/pinned.json' });
  // the profile repo, private repos and readme.packets.exclude are skipped
  assert.deepEqual(packets, ['weather-bot', 'todo-api', 'pixel-pets']);
  const svgs = files.filter(([n]) => n.endsWith('.svg'));
  assert.equal(svgs.length % 2, 0);
  assert.equal(svgs.filter(([n]) => n.startsWith('packet-')).length, packets.length * 2);
  const html = fs.readFileSync(path.join(dir, 'packets.html'), 'utf8');
  for (const slug of packets) assert.ok(html.includes(`${config.readme.imagesDir}/packet-${slug}-night.svg`), slug);
  const banner = fs.readFileSync(path.join(dir, 'banner-day.svg'), 'utf8');
  for (const t of Object.values(config.readme.banner)) assert.ok(banner.includes(`>${t}</text>`), t);
  const stack = fs.readFileSync(path.join(dir, 'stack-day.svg'), 'utf8');
  assert.ok(stack.includes(`aria-label="Tech stack: ${config.readme.stack.join(', ')}."`));
  const footer = fs.readFileSync(path.join(dir, 'footer-night.svg'), 'utf8');
  assert.ok(footer.includes(`>${config.readme.footer.left}</text>`) && footer.includes(`>${config.readme.footer.right}</text>`));
  for (const [name, bytes] of svgs) {
    const svg = fs.readFileSync(path.join(dir, name), 'utf8');
    assert.ok(bytes < 300 * 1024, `${name} too big`);
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), name);
    assert.ok(!/<script|var\(--/.test(svg), `${name} has script or var()`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

test('build without token or fixture rejects and writes nothing', async () => {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'readme-')), 'out');
  await assert.rejects(build({ outDir: dir }), /GITHUB_TOKEN/);
  assert.ok(!fs.existsSync(dir));
});

test('build with no pinned repos writes no packets and an empty packets.html', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-'));
  const { files } = await build({ outDir: dir, fixture: 'tests/fixtures/calendar-2026-10-17.json' });
  assert.ok(!files.some(([n]) => n.startsWith('packet-')));
  assert.equal(fs.readFileSync(path.join(dir, 'packets.html'), 'utf8'), '');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('build honours imagesDir, an empty stack and a minimal banner', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-'));
  const cfg = resolveConfig({ login: 'octocat', readme: { imagesDir: 'img/garden' } });
  const { files } = await buildReadme({ config: cfg, outDir: dir, fixture: 'tests/fixtures/calendar-2026-10-17.json', pinnedFixture: 'tests/fixtures/pinned.json' });
  assert.ok(!files.some(([n]) => n.startsWith('stack-')));
  assert.ok(fs.readFileSync(path.join(dir, 'packets.html'), 'utf8').includes('srcset="img/garden/packet-weather-bot-day.svg"'));
  const banner = fs.readFileSync(path.join(dir, 'banner-night.svg'), 'utf8');
  assert.ok(banner.includes('>octocat</text>') && banner.includes('aria-label="octocat."'));
  assert.ok(!fs.readFileSync(path.join(dir, 'footer-day.svg'), 'utf8').includes('Signposts'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('packet overrides from the config replace the generated content', () => {
  const p = selectPackets(pinned, config.readme.packets).find(x => x.name === 'todo-api');
  assert.equal(p.line, config.readme.packets.overrides['todo-api'].line);
  assert.equal(p.art, 'filmSprout');
});
