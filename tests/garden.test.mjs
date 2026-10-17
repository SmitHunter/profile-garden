import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderGarden } from '../src/scene/garden.mjs';
import { planWindow, addDays } from '../src/dates.mjs';
import { computeStats } from '../src/stats.mjs';
import { iso } from '../src/scene/draw.mjs';
import { PLAQUE, plaqueBoard, plaqueBounds, COOP, HENS, TREES, WHEELBARROW } from '../src/scene/props.mjs';
import { loadConfig } from '../src/config.mjs';
import { CROPS } from '../src/scene/plants.mjs';

const fixture = new Map(JSON.parse(readFileSync(new URL('./fixtures/calendar-2026-10-17.json', import.meta.url))));
const config = loadConfig(new URL('./fixtures/garden.config.json', import.meta.url));
const { signName, timezone: TZ } = config;
const win = planWindow(new Date('2026-10-16T18:00:00Z'), TZ);
const render = (calendar, w = win, night = false, opts = {}) => renderGarden({ calendar, win: w, stats: computeStats(calendar, w), night, signName, hemisphere: config.hemisphere, ...opts });
const zeros = (w) => { const m = new Map(); for (let d = w.start; d <= w.drawnThrough; d = addDays(d, 1)) m.set(d, 0); return m; };
const count = (s, needle) => s.split(needle).length - 1;

test('deterministic', () => {
  assert.equal(render(fixture), render(fixture));
});

test('svg root', () => {
  assert.ok(render(fixture).startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 700" text-rendering="geometricPrecision">'));
});

test('plant count per bed', () => {
  const out = render(fixture);
  assert.equal(count(out, 'class="gr"'), 365);
  assert.equal(count(out, 'data-d="2026-10-'), 31);
  const w = planWindow(new Date('2028-03-10T00:00:00Z'), TZ);
  assert.equal(count(render(new Map(), w), 'data-d="2028-02-'), 29);
});

test('decorations stable', () => {
  const grab = s => s.match(/<g id="wildflowers">.*?<\/g>/s)[0]; // flowers hold no nested <g>
  const a = grab(render(fixture)), b = grab(render(zeros(win)));
  assert.ok(a.length > 1000);
  assert.equal(a, b);
});

test('sign text', () => {
  const stats = computeStats(fixture, win);
  const out = render(fixture);
  assert.equal(signName, "OCTOCAT'S PLOT");
  assert.ok(out.includes(`>${signName}</text>`));
  assert.ok(out.includes(`>${stats.total} contributions</text>`) && out.includes(`>${stats.longestStreak}-day streak</text>`));
});

test('no script, no custom props', () => {
  const out = render(fixture);
  assert.ok(!out.includes('<script'));
  assert.ok(!out.includes('var(--'));
  assert.ok(!/--[a-z]+:/.test(out));
});

test('day has no milestone stars', () => {
  assert.ok(!render(fixture).includes('class="ms"'));
});

test('empty garden', () => {
  const out = render(zeros(win));
  assert.ok(out.includes('>0 contributions</text>') && out.includes('>0-day streak</text>'));
  assert.ok(!out.includes('#2f6fd6'));
});

test('prize rosette (2-digit)', () => {
  const out = render(fixture);
  const stats = computeStats(fixture, win);
  assert.ok(out.includes(`>${stats.best.count}</text>`));
  assert.ok(/<g class="gr rz"[^>]*>.*font-size="18.5"[^>]*>\d+<\/text><\/g>/.test(out));
});

const rosetteDisc = out => Number(out.match(/<g class="gr rz".*?r="([\d.]+)" fill="#ffe08a"/)[1]);

test('3-digit rosette', () => {
  const out = render(new Map([['2026-10-10', 120]]));
  assert.ok(out.includes('>120</text>'));
  // the count keeps its 18.5 size; the rosette grows to hold three digits
  assert.ok(rosetteDisc(out) > rosetteDisc(render(new Map([['2026-10-10', 12]]))));
});

test('gardener stands at the drawnThrough spot', () => {
  const out = render(fixture);
  assert.equal(count(out, 'id="gardener"'), 1);
  // drawnThrough 2026-10-16: bed m=11 (bx=21, by=15.2), spot i=15
  const cx = 21 + (15 % 7 + .5) * 6 / 7, [a, b] = iso(cx, 15.2 + 5.9);
  assert.ok(out.includes(`<g id="gardener"><ellipse cx="${(a + 3).toFixed(1)}" cy="${(b + 1).toFixed(1)}"`));
});

test('gardener on the 1st', () => {
  const w = planWindow(new Date('2026-10-31T14:00:00Z'), TZ);
  const out = render(fixture, w);
  assert.equal(count(out, 'id="gardener"'), 1);
  // drawnThrough 2026-10-31: bed m=10 (bx=14, by=15.2), spot i=30
  const cx = 14 + (30 % 7 + .5) * 6 / 7, [a, b] = iso(cx, 15.2 + 5.9);
  assert.ok(out.includes(`<g id="gardener"><ellipse cx="${(a + 3).toFixed(1)}" cy="${(b + 1).toFixed(1)}"`));
});

test('day has 3 hens', () => {
  assert.equal(count(render(fixture), 'class="hen'), 3);
});

test('size', () => {
  const m = new Map(); for (let d = win.start; d <= win.drawnThrough; d = addDays(d, 1)) m.set(d, 10);
  assert.ok(render(m).length < 1_000_000);
});

// ---------- night ----------
const night = (calendar, w = win) => render(calendar, w, true);

test('night overlay', () => {
  assert.ok(night(fixture).includes('fill="#0d1117" opacity=".62"'));
  assert.ok(!render(fixture).includes('fill="#0d1117" opacity=".62"'));
});

test('no hens at night', () => {
  assert.equal(count(night(fixture), 'class="hen'), 0);
  assert.equal(count(render(fixture), 'class="hen'), 3);
});

test('milestones at night', () => {
  const stats = computeStats(fixture, win);
  const out = night(fixture);
  const n = Object.keys(stats.milestones).length;
  assert.ok(n > 0);
  assert.equal(count(out, 'class="ms"'), n);
  const small = new Map([['2026-10-10', 40]]);
  assert.equal(count(night(small), 'class="ms"'), 0);
});

test('sign above overlay', () => {
  const out = night(fixture);
  const o = out.indexOf('fill="#0d1117" opacity=".62"');
  assert.ok(o > 0);
  assert.ok(out.lastIndexOf(`>${signName}</text>`) > o);
});

test('night omits day-only life', () => {
  const out = night(fixture);
  for (const c of ['class="bee"', 'class="bf"', 'class="cl"', 'class="hop"', 'class="drop"']) assert.ok(!out.includes(c), c);
  assert.ok(out.includes('class="tail"'));
  assert.ok(out.includes('id="gWarm"'));
  assert.ok(count(out, 'class="ff"') >= 40);
});

test('night: no script, no custom props', () => {
  const out = night(fixture);
  assert.ok(!out.includes('<script'));
  assert.ok(!out.includes('var(--'));
  assert.ok(!/--[a-z]+:/.test(out));
});

test('night deterministic', () => {
  assert.equal(night(fixture), night(fixture));
});

test('night size', () => {
  const m = new Map(); for (let d = win.start; d <= win.drawnThrough; d = addDays(d, 1)) m.set(d, 10);
  assert.ok(night(m).length < 1_000_000);
});

// ---------- review fixes ----------

test('sign lines fit the board and stay readable at 700px', () => {
  const big = new Map(zeros(win)); big.set('2026-10-10', 1234); big.set('2026-10-11', 1);
  const out = render(big);
  for (const m of out.matchAll(/<text[^>]*font-size="([0-9.]+)"[^>]*>([^<>]*(?:contributions?|-day streak|PLOT))<[/]text>/g)) {
    const fs = Number(m[1]);
    assert.ok(fs * 700 / 1080 >= 10, `${m[2]} is ${fs} svg px`);
    assert.ok(m[2].length * 0.62 * fs <= PLAQUE.w - 12, `${m[2]} too wide for the board`);
  }
  assert.equal(count(out, '-day streak</text>'), 1);
});

test('singular contribution', () => {
  const out = render(new Map([['2026-10-10', 1]]));
  assert.ok(out.includes('>1 contribution</text>') && out.includes('>1-day streak</text>'));
});

test('night milestone stars grow in with their plant', () => {
  const stats = computeStats(fixture, win);
  const out = night(fixture);
  assert.equal(count(out, 'class="gr mg"'), Object.keys(stats.milestones).length);
  assert.equal(count(out, 'class="gr"'), 365);
  assert.ok(/<g class="gr mg" style="animation-delay:\d+ms"><g class="ms"/.test(out));
});

test('days after drawnThrough stay unplanted', () => {
  const spot = out => out.match(/<g class="gr" data-d="2026-10-20"[^>]*>.*?<\/g>/s)[0];
  const withFuture = new Map(fixture); withFuture.set('2026-10-20', 99);
  const out = render(withFuture);
  assert.equal(spot(out), spot(render(fixture)));
  assert.ok(!out.includes('>99</text>'));
});

// ---- sign + coop placement (screen space, viewBox 0 0 1080 700) ----
const lawn = [iso(-7, -6), iso(40, -6), iso(40, 25), iso(-7, 25)];
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [ax, ay] = poly[i], [bx, by] = poly[j]; if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) c = !c; } return c; };
const corners = (r, m = 0) => [[r.x0 - m, r.y0 - m], [r.x1 + m, r.y0 - m], [r.x0 - m, r.y1 + m], [r.x1 + m, r.y1 + m]];
const overlap = (p, q) => !(p.x1 < q.x0 || p.x0 > q.x1 || p.y1 < q.y0 || p.y0 > q.y1);
const bboxOf = pts => ({ x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) });
const coopBox = () => { const { x, y, W, H, Z, lg } = COOP; return bboxOf([iso(x - .3, y - .3, lg + Z + .7), iso(x + W + .3, y - .3, lg + Z + .7), iso(x, y + H + 1.4), iso(x + W, y + H + 1.4), iso(x, y), iso(x + W, y)]); };
const henBoxes = () => HENS.map(({ x, y }) => { const [a, b] = iso(x, y); return { x0: a - 9, x1: a + 9, y0: b - 16, y1: b + 3 }; });
const treeBox = ([x, y, s]) => { const [a, b] = iso(x, y); return { x0: a - 21 * s, x1: a + 21 * s, y0: b - 59 * s, y1: b }; };

test('sign board, posts and lantern sit inside the lawn with a margin', () => {
  const board = plaqueBoard(), all = plaqueBounds();
  assert.equal(board.x1 - board.x0, PLAQUE.w);
  for (const r of [board, all]) for (const [x, y] of corners(r, 6)) assert.ok(inPoly(lawn, x, y), `corner ${x},${y} outside lawn`);
});

test('sign clears the pond, wheelbarrow, gravel and lavender', () => {
  const all = plaqueBounds(), [pa, pb] = iso(37.4, 13.4), [wa, wb] = iso(WHEELBARROW.x, WHEELBARROW.y);
  assert.ok(!overlap(all, { x0: pa - 34, x1: pa + 34, y0: pb - 17, y1: pb + 17 }), 'pond');
  assert.ok(!overlap(all, { x0: wa - 24, x1: wa + 20, y0: wb - 20, y1: wb + 6 }), 'wheelbarrow');
  // post feet stand on lawn: outside the gravel (-1.5..28.5, -1.5..22.5) and its lavender border
  const feet = [PLAQUE.a - PLAQUE.w / 2 + PLAQUE.post, PLAQUE.a + PLAQUE.w / 2 - PLAQUE.post];
  for (const fx of feet) { const u = (fx - 450) / (0.866 * 16), v = (PLAQUE.b - 175) / 8, x = (u + v) / 2, y = (v - u) / 2; assert.ok(x > 29.2 || y > 24, `foot at ${x.toFixed(1)},${y.toFixed(1)} on gravel/lavender`); }
});

test('wildflowers do not render under the sign or coop strip', () => {
  const g = render(fixture).match(/<g id="wildflowers">.*?<\/g>/s)[0], r = plaqueBounds();
  const stems = [...g.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)"/g)].map(m => [+m[1], +m[2]]);
  assert.ok(stems.length > 200);
  assert.ok(stems.every(([x, y]) => !(x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1)));
});

test('chicken coop and hens sit inside the lawn, clear of the apple trees', () => {
  const coop = coopBox(), hens = henBoxes();
  const { x, y, W, H } = COOP;
  for (const [px, py] of [[x, y], [x + W, y], [x, y + H + 1.4], [x + W, y + H + 1.4], ...HENS.map(h => [h.x, h.y])]) assert.ok(inPoly(lawn, ...iso(px, py)), 'coop/hen outside lawn');
  assert.ok(coop.x0 > 0 && coop.y0 > 0);
  for (const t of TREES.map(treeBox)) for (const r of [coop, ...hens]) assert.ok(!overlap(r, t), 'coop/hen overlaps a tree');
  assert.ok(COOP.x >= -5.4 && COOP.x + COOP.W <= -2.6);
});

test('sign name is escaped', () => {
  const out = render(new Map(), win, false, { signName: 'A&B <PLOT>' });
  assert.ok(out.includes('>A&amp;B &lt;PLOT&gt;</text>'));
});

// each bed's harvest-level plant draws its month's crop; the north shifts crops by 6 months
const cropMarks = { tomato: 'url(#fRed)', corn: 'url(#fYellow)' };
test('hemisphere moves the summer crops', () => {
  const july = new Map(); for (let d = 1; d <= 31; d++) july.set(`2026-07-${String(d).padStart(2, '0')}`, 9);
  const bed = (out) => [...out.matchAll(/<g class="gr" data-d="2026-07-[^"]*"[^>]*>(.*?)<\/g>/gs)].map(m => m[1]).join('');
  const north = bed(render(july, win, false, { hemisphere: 'north' })), south = bed(render(july, win, false, { hemisphere: 'south' }));
  assert.equal(CROPS[6], 'garlic');
  assert.ok(north.includes(cropMarks.tomato), 'north July grows tomatoes');
  assert.ok(!south.includes(cropMarks.tomato) && !south.includes(cropMarks.corn), 'south July grows garlic');
});
