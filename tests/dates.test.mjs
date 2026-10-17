import { test } from 'node:test'; import assert from 'node:assert/strict';
import { planWindow, localDate } from '../src/dates.mjs';

const TZ = 'Pacific/Auckland'; // UTC+13 in summer (NZDT), UTC+12 in winter (NZST)

test('18:00 UTC run is the next morning in a UTC+13 zone', () => {
  assert.equal(localDate(new Date('2026-10-16T18:00:00Z'), TZ), '2026-10-17');
});
test('window on 2026-10-17', () => {
  const w = planWindow(new Date('2026-10-16T18:00:00Z'), TZ);
  assert.equal(w.today, '2026-10-17'); assert.equal(w.drawnThrough, '2026-10-16');
  assert.equal(w.start, '2025-11-01');
  assert.deepEqual(w.months[0], { year: 2025, month: 11, days: 30 });
  assert.deepEqual(w.months[11], { year: 2026, month: 10, days: 31 });
});
test('rollover: on the 1st the new month is empty and drawnThrough is last month', () => {
  const w = planWindow(new Date('2026-10-31T14:00:00Z'), TZ); // 03:00 1 Nov NZDT
  assert.equal(w.today, '2026-11-01'); assert.equal(w.drawnThrough, '2026-10-31');
  assert.deepEqual(w.months[11], { year: 2026, month: 11, days: 30 });
  assert.equal(w.start, '2025-12-01');
});
test('month lengths incl. leap Feb', () => {
  const w = planWindow(new Date('2028-03-10T00:00:00Z'), TZ);
  assert.equal(w.months.find(m => m.year === 2028 && m.month === 2).days, 29);
});
test('daylight saving: winter and summer offsets differ', () => {
  assert.equal(localDate(new Date('2026-06-30T11:30:00Z'), TZ), '2026-06-30'); // 23:30 NZST
  assert.equal(localDate(new Date('2026-12-31T11:30:00Z'), TZ), '2027-01-01'); // 00:30 NZDT
});
test('timezone defaults to UTC and west-of-UTC zones lag', () => {
  assert.equal(localDate(new Date('2026-10-17T02:00:00Z')), '2026-10-17');
  assert.equal(localDate(new Date('2026-10-17T02:00:00Z'), 'America/New_York'), '2026-10-16');
});
