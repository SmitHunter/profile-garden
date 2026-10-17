// Renders the preview images shown in this repo's README from the synthetic
// fixtures, with a generic example config (not the committed garden.config.json).
//   npm run preview
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from '../src/config.mjs';
import { run } from '../src/main.mjs';
import { build } from '../src/readme/build.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const at = (...p) => path.join(root, ...p);
const outDir = at('docs', 'preview');
const fixture = at('tests', 'fixtures', 'calendar-2026-10-17.json');

export const EXAMPLE = {
  login: 'octocat',
  timezone: 'UTC',
  hemisphere: 'north',
  readme: {
    banner: { name: 'Your Name', title: 'Software Engineer · Your City', tagline: 'what you build · what you like' },
    stack: ['Python', 'TypeScript', 'Rust', 'Postgres', 'Docker', 'GitHub Actions'],
    footer: { left: 'Thanks for visiting!', right: 'your-site.dev' },
    packets: { overrides: { 'todo-api': { line: 'Todo lists over plain HTTP', tags: ['TypeScript', 'Express'], art: 'filmstrip' } } },
  },
};

const config = resolveConfig(EXAMPLE);
const now = new Date('2026-10-17T12:00:00Z'); // the fixture runs through 2026-10-17
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith('.svg')) fs.rmSync(path.join(outDir, f));
await run({ config, calendarFile: fixture, now, outDir });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'garden-preview-'));
const { packets } = await build({ config, outDir: tmp, fixture, pinnedFixture: at('tests', 'fixtures', 'pinned.json'), now });
const keep = ['banner', ...packets.map(s => `packet-${s}`)];
for (const name of fs.readdirSync(tmp)) {
  if (keep.some(k => name === `${k}-day.svg` || name === `${k}-night.svg`)) fs.copyFileSync(path.join(tmp, name), path.join(outDir, name));
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`wrote previews to ${path.relative(root, outDir)}: ${fs.readdirSync(outDir).join(', ')}`);
