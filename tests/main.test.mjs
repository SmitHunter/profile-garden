import { test } from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run as runGarden } from '../src/main.mjs';
import { loadConfig } from '../src/config.mjs';

const config = loadConfig(new URL('./fixtures/garden.config.json', import.meta.url));
const run = (o) => runGarden({ config, ...o });

const fixture = fileURLToPath(new URL('./fixtures/calendar-2026-10-17.json', import.meta.url));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pg-'));
const svgs = (d) => fs.readdirSync(d).filter((f) => f.endsWith('.svg'));

test('writes both files', async () => {
  const outDir = tmp();
  const r = await run({ calendarFile: fixture, now: new Date('2026-10-16T18:00:00Z'), outDir });
  assert.deepEqual(svgs(outDir).sort(), ['garden-day.svg', 'garden-night.svg']);
  for (const f of svgs(outDir)) assert.ok(fs.readFileSync(path.join(outDir, f), 'utf8').startsWith('<svg'));
  assert.ok(r.day.startsWith('<svg') && r.night.startsWith('<svg'));
});

test('no files on failure', async () => {
  const outDir = tmp();
  await assert.rejects(run({ token: 't', fetchImpl: async () => { throw new Error('net'); }, now: new Date('2026-10-16T18:00:00Z'), outDir }), /net/);
  assert.equal(svgs(outDir).length, 0);
});

test('atomic: render throw leaves no files', async () => {
  const outDir = tmp();
  const m = new Map(JSON.parse(fs.readFileSync(fixture, 'utf8')));
  m.get = () => { throw new Error('boom'); };
  await assert.rejects(run({ calendar: m, now: new Date('2026-10-16T18:00:00Z'), outDir }), /boom/);
  assert.equal(svgs(outDir).length, 0);
});

test('second write failure leaves no mismatched pair', async () => {
  const outDir = tmp();
  fs.mkdirSync(path.join(outDir, 'garden-night.svg.tmp'));
  await assert.rejects(run({ calendarFile: fixture, now: new Date('2026-10-16T18:00:00Z'), outDir }));
  assert.deepEqual(fs.readdirSync(outDir), ['garden-night.svg.tmp']);
});

test('malformed fixture rejects with no files', async () => {
  const outDir = tmp();
  for (const bad of ['{"a":1}', '[["2026-10-16",-1]]', '[["nope",1]]', '[["2026-10-16",1.5]]', 'not json']) {
    const f = path.join(outDir, 'bad.json');
    fs.writeFileSync(f, bad);
    await assert.rejects(run({ calendarFile: f, now: new Date('2026-10-16T18:00:00Z'), outDir }), /Invalid calendar fixture/);
  }
  assert.equal(svgs(outDir).length, 0);
});

test('run without a config rejects', async () => {
  await assert.rejects(runGarden({ calendarFile: fixture, outDir: tmp() }), /config/);
});

test('uses the configured sign name', async () => {
  const r = await run({ calendarFile: fixture, now: new Date('2026-10-16T18:00:00Z'), outDir: tmp() });
  assert.ok(r.day.includes(`>${config.signName}</text>`) && r.night.includes(`>${config.signName}</text>`));
});
