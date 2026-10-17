// Writes the synthetic contribution calendar used by the tests and previews:
// about a year ending 2026-10-17 that starts sparse and gets busy, with a quiet
// holiday fortnight and one 100+ day. Deterministic (seeded rng), so re-running
// it reproduces the committed file exactly.
//   node scripts/make-fixture.mjs [out.json]
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { rng } from '../src/rng.mjs';
import { addDays } from '../src/dates.mjs';

export const FIRST = '2025-10-12', LAST = '2026-10-17';
export const BIG_DAY = ['2026-08-22', 112];
const HOLIDAY = ['2026-01-05', '2026-01-18'];

export function makeCalendar() {
  const r = rng(20261017);
  const days = [];
  let total = 0;
  for (let d = FIRST; d <= LAST; d = addDays(d, 1)) total++;
  let i = 0;
  for (let d = FIRST; d <= LAST; d = addDays(d, 1), i++) {
    const t = i / (total - 1);                       // 0 .. 1 through the year
    const weekend = [0, 6].includes(new Date(d + 'T00:00:00Z').getUTCDay());
    let p = 0.12 + 0.72 * t ** 1.3;                    // chance of any activity
    if (weekend) p *= 0.45;
    const mean = 1.2 + 6 * t ** 1.5;                   // typical size of an active day
    let n = 0;
    if (r() < p) n = 1 + Math.floor(-Math.log(1 - r()) * mean);
    if (d >= HOLIDAY[0] && d <= HOLIDAY[1]) n = 0;
    if (d === BIG_DAY[0]) n = BIG_DAY[1];
    days.push([d, d === BIG_DAY[0] ? n : Math.min(n, 60)]);
  }
  return days;
}

export const toJson = days => '[\n' + days.map(p => JSON.stringify(p)).join(',\n') + '\n]\n';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = process.argv[2] ?? fileURLToPath(new URL('../tests/fixtures/calendar-2026-10-17.json', import.meta.url));
  fs.writeFileSync(out, toJson(makeCalendar()));
  console.log(`wrote ${out}`);
}
