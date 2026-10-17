import { test } from 'node:test'; import assert from 'node:assert/strict';
import { computeStats } from '../src/stats.mjs';

const win = { start: '2026-01-01', drawnThrough: '2026-01-10' };
const cal = (o) => new Map(Object.entries(o).map(([k, v]) => [k.length === 2 ? `2026-01-${k}` : k, v]));

test('basic', () => {
  const s = computeStats(cal({ '01': 2, '02': 3, '03': 0, '04': 7, '05': 7, '06': 1 }), win);
  assert.equal(s.total, 20);
  assert.equal(s.longestStreak, 3);
  assert.deepEqual(s.best, { date: '2026-01-05', count: 7 });
});
test('outside window ignored', () => {
  const s = computeStats(cal({ '2025-12-31': 50, '2026-01-11': 50, '02': 1 }), win);
  assert.equal(s.total, 1);
});
test('missing dates', () => {
  const s = computeStats(cal({ '03': 4 }), win);
  assert.equal(s.total, 4); assert.equal(s.longestStreak, 1);
  assert.deepEqual(s.best, { date: '2026-01-03', count: 4 });
});
test('empty window', () => {
  assert.deepEqual(computeStats(new Map(), win), { total: 0, longestStreak: 0, best: null, milestones: {} });
});
test('milestones', () => {
  assert.deepEqual(computeStats(cal({ '01': 60, '02': 50, '03': 95 }), win).milestones, { '2026-01-02': 100, '2026-01-03': 200 });
});
test('multi-hundred jump', () => {
  assert.deepEqual(computeStats(cal({ '01': 250 }), win).milestones, { '2026-01-01': 200 });
});
