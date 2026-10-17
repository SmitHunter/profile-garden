import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { planWindow, addDays } from './dates.mjs';
import { fetchCalendar, fetchTotal } from './github.mjs';
import { computeStats } from './stats.mjs';
import { loadConfig, takeConfigArg } from './config.mjs';
import { renderGarden } from './scene/garden.mjs';

function parseCalendar(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error(`Invalid calendar fixture: ${e.message}`); }
  const ok = Array.isArray(data) && data.every((p) => Array.isArray(p) && p.length === 2
    && typeof p[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p[0]) && Number.isInteger(p[1]) && p[1] >= 0);
  if (!ok) throw new Error('Invalid calendar fixture: expected an array of [YYYY-MM-DD, non-negative integer] pairs');
  return new Map(data);
}

// config: a resolved config (see config.mjs); login, timezone, hemisphere and signName are used here.
export async function run({ config, now = new Date(), outDir = 'out', token, fetchImpl, calendarFile, calendar: given } = {}) {
  if (!config) throw new Error('run() needs a resolved config');
  const { login, timezone, hemisphere, signName } = config;
  const win = planWindow(now, timezone);
  let calendar = given;
  if (!calendar) {
    calendar = calendarFile
      ? parseCalendar(fs.readFileSync(calendarFile, 'utf8'))
      : await fetchCalendar({ token, login, from: win.start, to: win.drawnThrough, fetchImpl });
  }
  const stats = computeStats(calendar, win);
  // Render both in memory first; write only if both succeed.
  const day = renderGarden({ calendar, win, stats, night: false, signName, hemisphere });
  const night = renderGarden({ calendar, win, stats, night: true, signName, hemisphere });
  fs.mkdirSync(outDir, { recursive: true });
  const files = [['garden-day.svg', day], ['garden-night.svg', night]];
  const tmps = files.map(([n]) => path.join(outDir, n + '.tmp'));
  const finals = files.map(([n]) => path.join(outDir, n));
  const renamed = [];
  try {
    files.forEach(([, content], i) => fs.writeFileSync(tmps[i], content));
    tmps.forEach((t, i) => { fs.renameSync(t, finals[i]); renamed.push(finals[i]); });
  } catch (e) {
    for (const f of renamed) fs.rmSync(f, { force: true });
    throw e;
  } finally {
    for (const t of tmps) { try { fs.rmSync(t, { force: true }); } catch {} }
  }
  return { day, night };
}

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') o.out = argv[++i];
    else if (argv[i] === '--fixture') o.fixture = argv[++i];
    else if (argv[i] === '--check-total') o.checkTotal = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return o;
}

async function cli() {
  const [configFile, argv] = takeConfigArg(process.argv.slice(2));
  const config = loadConfig(configFile);
  const args = parseArgs(argv);
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (args.checkTotal) {
    if (!token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required');
    const { today } = planWindow(new Date(), config.timezone);
    const total = await fetchTotal({ token, login: config.login, from: addDays(today, -365), to: today });
    console.log(total);
    return;
  }
  if (!args.fixture && !token) throw new Error('GITHUB_TOKEN or GH_TOKEN is required');
  await run({ config, token, outDir: args.out ?? 'out', calendarFile: args.fixture });
  console.log(`Wrote garden-day.svg and garden-night.svg to ${args.out ?? 'out'}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((e) => { console.error(e.message); process.exit(1); });
}
