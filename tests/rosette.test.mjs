// The prize rosette must visibly belong to its own bed: centred over the best day's plant,
// inside the bed's top-face x-range, above the plant base, and drawn after (above) neighbours.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderGarden, buildScene } from '../src/scene/garden.mjs';
import { planWindow } from '../src/dates.mjs';
import { computeStats } from '../src/stats.mjs';
import { loadConfig } from '../src/config.mjs';
import { iso } from '../src/scene/draw.mjs';
import { BED, bedOrigin, spot } from '../src/scene/props.mjs';

const config = loadConfig(new URL('./fixtures/garden.config.json', import.meta.url));
const win = planWindow(new Date('2026-10-16T18:00:00Z'), config.timezone);
const pad = n => String(n).padStart(2, '0');

// spot indices: each corner of the 7x5 grid (the last two are the front-right edge) plus day 1/last
const CORNERS = [0, 6, 28, 30];

for (const night of [false, true]) {
  test(`rosette belongs to its own bed at every corner (${night ? 'night' : 'day'})`, () => {
    win.months.forEach(({ year, month, days }, m) => {
      const { bx, by } = bedOrigin(m);
      const xmin = iso(bx, by + BED.H)[0], xmax = iso(bx + BED.W, by)[0];
      for (const i of CORNERS.filter(i => i < days)) {
        const date = `${year}-${pad(month)}-${pad(i + 1)}`;
        if (date > win.drawnThrough) continue;
        for (const count of [9, 55, 120]) {
          const cal = new Map([[date, count]]);
          const stats = computeStats(cal, win);
          const svg = renderGarden({ calendar: cal, win, stats, night, signName: 'X' });
          const g = svg.match(/<g class="gr rz".*?<\/g>/)[0];
          const [, cxs, cys, rs] = g.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="#ffe08a"/);
          const { cx, cy } = spot(bx, by, i), [, baseY] = iso(cx, cy, BED.Z);
          const x = Number(cxs), y = Number(cys), r = Number(rs);
          assert.ok(x >= xmin && x <= xmax, `${date} x ${x} outside bed ${xmin}..${xmax}`);
          assert.ok(x - r >= xmin - 4 && x + r <= xmax + 4, `${date} overhangs its bed`);
          assert.ok(y < baseY, `${date} rosette centre not above plant base`);
        }
      }
    });
  });
}

test('rosette is sorted after everything in its own bed', () => {
  const { year, month } = win.months[9], date = `${year}-${pad(month)}-17`;
  const cal = new Map([[date, 40]]);
  const { items } = buildScene({ calendar: cal, win, stats: computeStats(cal, win), night: false, signName: 'X' });
  const ri = items.findIndex(i => i.svg.includes('class="gr rz"'));
  const { bx, by } = bedOrigin(9);
  for (const it of items.slice(ri + 1)) assert.ok(!(it.svg.includes('data-d=') && it.depth < bx + by + BED.W + BED.H), 'plant of own bed drawn after rosette');
});
