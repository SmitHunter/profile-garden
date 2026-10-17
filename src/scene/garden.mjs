// Renders the allotment garden SVG from a contribution calendar.
import { DEFS, iso } from './draw.mjs';
import { level, cropFor } from './plants.mjs';
import { DAY_CSS, NIGHT_CSS, dropKeyframes } from './css.mjs';
import { nightLayer } from './night.mjs';
import { rng } from '../rng.mjs';
import * as P from './props.mjs';

const pad = n => String(n).padStart(2, '0');

// Builds the depth-sortable scene. Returns { items, glow, plaque, css }:
// `glow` is markup the night layer redraws above its overlay, `plaque` the sign.
export function buildScene({ calendar, win, stats, night, signName, hemisphere = 'south' }) {
  const items = [];
  const add = x => { for (const it of [].concat(x)) items.push(it); };
  const glow = [];
  const jitter = rng(101), lawn = rng(202), flowers = rng(303), soil = rng(404);

  add(P.ground(lawn));
  add(P.wildflowers(flowers));
  add(P.fence());
  add(P.sunflowers());
  add(P.trees());

  let idx = 0, tend = null;
  win.months.forEach(({ year, month, days }, m) => {
    const { bx, by } = P.bedOrigin(m);
    add(P.bed(m, soil));
    const sign = P.bedSign(m, month, night);
    add(sign);
    if (sign.glow) glow.push(sign.glow);
    for (let i = 0; i < days; i++, idx++) {
      const date = `${year}-${pad(month)}-${pad(i + 1)}`;
      const count = date > win.drawnThrough ? null : (calendar.get(date) ?? 0);
      const { cx, cy } = P.spot(bx, by, i);
      const prize = stats.best?.date === date;
      add(P.plantSpot({ date, idx, cx, cy, lv: level(count), crop: cropFor(month, hemisphere), prize, j: jitter() }));
      if (prize) { const r = P.rosette({ idx, cx, cy, count, bx, by, lv: level(count), crop: cropFor(month, hemisphere) }); add(r); glow.push(r.glow); }
      if (date === win.drawnThrough) tend = { cx, cy, by };
    }
  });

  add([P.shed(), P.cat(night), P.waterButt(), P.compostBin(lawn), P.wheelbarrow(), P.wateringCan(), P.gnome()]);
  const plaque = P.plaque(stats, night, signName);
  add(plaque);
  if (!night) add(P.bird());

  let css = night ? DAY_CSS + '\n' + NIGHT_CSS : DAY_CSS;
  if (tend) {
    const [px, py] = iso(tend.cx, tend.cy, P.BED.Z);
    const g = P.gardener({ x: tend.cx, y: tend.by + 5.9, px, py }, night);
    add(g);
    if (g.glow) glow.push(g.glow);
    if (g.drop) css += '\n' + dropKeyframes(g.drop.dx, g.drop.dy);
  }

  add(P.borders());
  add(P.pond());
  add(P.beehive(night));
  const coop = P.coop(night);
  add(coop);
  if (coop.glow) glow.push(coop.glow);
  add(P.hens(night));
  if (!night) { add(P.butterflies()); add(P.clouds()); }

  items.sort((p, q) => p.depth - q.depth);
  return { items, glow, plaque: plaque.svg, css };
}

// signName: the sign's top line; hemisphere: 'south' | 'north' (picks the crop for each month)
export function renderGarden({ calendar, win, stats, night, signName = 'MY PLOT', hemisphere = 'south' }) {
  const { items, glow, plaque, css } = buildScene({ calendar, win, stats, night, signName, hemisphere });
  const top = night ? nightLayer({ stats, win, glow, plaque }) : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 700" text-rendering="geometricPrecision"><style>${css}</style>${DEFS}${items.map(i => i.svg).join('')}${top}</svg>`;
}
