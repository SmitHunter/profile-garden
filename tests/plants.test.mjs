import { test } from 'node:test'; import assert from 'node:assert/strict';
import { level, CROPS, cropFor, plant } from '../src/scene/plants.mjs';
import { rng } from '../src/rng.mjs';

test('levels', () => {
  assert.deepEqual([null,0,1,2,3,4,6,7,81].map(level), [-1,0,1,2,2,3,3,4,4]);
});
test('crops by month', () => {
  assert.equal(CROPS[0], 'tomato'); assert.equal(CROPS[5], 'broccoli');
  assert.equal(CROPS[10], 'strawberry'); assert.equal(CROPS.length, 12);
});
test('harvest tomato has red fruit, bare dirt has none', () => {
  assert.match(plant(100,100,4,'tomato',1.6,.5), /url\(#fRed\)/);
  assert.doesNotMatch(plant(100,100,0,'tomato',1.6,.5), /url\(#f/);
});
test('every crop renders at every level', () => {
  for (const c of new Set(CROPS)) for (const lv of [-1,0,1,2,3,4]) assert.ok(plant(0,0,lv,c,1.6,.3).length > 0);
});
test('rng is deterministic', () => { const a = rng(11), b = rng(11); assert.equal(a(), b()); });
test('crops by hemisphere: summer crops in Dec-Feb south, Jun-Aug north', () => {
  const summer = new Set(['tomato', 'corn']);
  for (const m of [12, 1, 2]) assert.ok(summer.has(cropFor(m, 'south')), `south ${m}`);
  for (const m of [6, 7, 8]) assert.ok(summer.has(cropFor(m, 'north')), `north ${m}`);
  for (let m = 1; m <= 12; m++) assert.equal(cropFor(m, 'north'), cropFor(((m + 5) % 12) + 1, 'south'));
});
