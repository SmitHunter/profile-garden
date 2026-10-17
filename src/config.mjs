// garden.config.json: load, validate, fill defaults.
//   node src/config.mjs [--config garden.config.json] --get profileRepo
// prints one resolved value (dot paths like readme.imagesDir work), for the workflow.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { checkStack } from './readme/stack.mjs';

export const CONFIG_FILE = 'garden.config.json';

// limits that keep lettering on its board (see the renderers)
export const LIMITS = { signName: 18, bannerName: 20, bannerTitle: 42, tagline: 54, footerSign: 20, stackItem: 24 };

export const ART_NAMES = { filmstrip: 'filmSprout', python: 'seedPython', typescript: 'seedTypeScript', javascript: 'seedJavaScript', flower: 'seedOther' };

const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
const DIR = /^[A-Za-z0-9_-][A-Za-z0-9._-]*(?:\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*$/;

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const validTz = tz => { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; } };

export function defaultSignName(login) {
  const L = login.toUpperCase();
  return [`${L}'S PLOT`, `${L}'S`, L, 'MY PLOT'].find(s => s.length <= LIMITS.signName);
}

// Validates a parsed config object and returns it with every default filled in.
// Throws one Error listing every problem.
export function resolveConfig(raw) {
  const errs = [];
  const bad = (field, msg) => errs.push(`${field}: ${msg}`);
  const str = (v, field, { max, required = false, pattern, hint } = {}) => {
    if (v === undefined) { if (required) bad(field, 'is required'); return; }
    if (typeof v !== 'string') return bad(field, 'must be a string');
    if (required && !v.trim()) return bad(field, 'must not be empty');
    if (max && v.length > max) bad(field, `is ${v.length} characters; the most that fits is ${max}`);
    if (pattern && !pattern.test(v)) bad(field, hint);
  };
  const known = (obj, field, keys) => { for (const k of Object.keys(obj)) if (!keys.includes(k)) bad(field ? `${field}.${k}` : k, `unknown field (expected one of: ${keys.join(', ')})`); };

  if (!isObj(raw)) throw new Error('Invalid garden config:\n  - the config must be a JSON object');
  known(raw, '', ['$schema', 'login', 'profileRepo', 'signName', 'timezone', 'hemisphere', 'outputDir', 'readme']);
  str(raw.login, 'login', { required: true, pattern: LOGIN, hint: 'must be a GitHub username (letters, digits and dashes)' });
  str(raw.profileRepo, 'profileRepo', { pattern: REPO, hint: 'must look like "owner/repo"' });
  str(raw.signName, 'signName', { max: LIMITS.signName });
  str(raw.timezone, 'timezone', {});
  if (typeof raw.timezone === 'string' && !validTz(raw.timezone)) bad('timezone', `"${raw.timezone}" is not an IANA time zone (e.g. "Europe/London", "America/New_York")`);
  if (raw.hemisphere !== undefined && !['north', 'south'].includes(raw.hemisphere)) bad('hemisphere', 'must be "north" or "south"');
  str(raw.outputDir, 'outputDir', { pattern: DIR, hint: 'must be a relative folder path like "profile-garden" (no "..", spaces or leading "/")' });

  const r = raw.readme ?? {};
  if (!isObj(r)) bad('readme', 'must be an object');
  else {
    known(r, 'readme', ['enabled', 'imagesDir', 'banner', 'stack', 'footer', 'packets']);
    if (r.enabled !== undefined && typeof r.enabled !== 'boolean') bad('readme.enabled', 'must be true or false');
    str(r.imagesDir, 'readme.imagesDir', { pattern: DIR, hint: 'must be a relative folder path like "readme" (no "..", spaces or leading "/")' });
    const b = r.banner ?? {};
    if (!isObj(b)) bad('readme.banner', 'must be an object');
    else {
      known(b, 'readme.banner', ['name', 'title', 'tagline']);
      str(b.name, 'readme.banner.name', { max: LIMITS.bannerName });
      str(b.title, 'readme.banner.title', { max: LIMITS.bannerTitle });
      str(b.tagline, 'readme.banner.tagline', { max: LIMITS.tagline });
    }
    if (r.stack !== undefined) {
      if (!Array.isArray(r.stack)) bad('readme.stack', 'must be an array of strings');
      else {
        const before = errs.length;
        r.stack.forEach((s, i) => str(s, `readme.stack[${i}]`, { required: true, max: LIMITS.stackItem }));
        if (errs.length === before) try { checkStack(r.stack); } catch (e) { errs.push(e.message.replace(/^readme\.stack /, 'readme.stack: ')); }
      }
    }
    const f = r.footer ?? {};
    if (!isObj(f)) bad('readme.footer', 'must be an object');
    else { known(f, 'readme.footer', ['left', 'right']); str(f.left, 'readme.footer.left', { max: LIMITS.footerSign }); str(f.right, 'readme.footer.right', { max: LIMITS.footerSign }); }
    const p = r.packets ?? {};
    if (!isObj(p)) bad('readme.packets', 'must be an object');
    else {
      known(p, 'readme.packets', ['exclude', 'overrides']);
      if (p.exclude !== undefined && !(Array.isArray(p.exclude) && p.exclude.every(x => typeof x === 'string'))) bad('readme.packets.exclude', 'must be an array of repo names');
      if (p.overrides !== undefined && !isObj(p.overrides)) bad('readme.packets.overrides', 'must be an object keyed by repo name');
      else for (const [name, o] of Object.entries(p.overrides ?? {})) {
        const at = `readme.packets.overrides.${name}`;
        if (!isObj(o)) { bad(at, 'must be an object'); continue; }
        known(o, at, ['title', 'line', 'tags', 'art', 'url']);
        str(o.title, `${at}.title`, {});
        str(o.line, `${at}.line`, {});
        str(o.url, `${at}.url`, { pattern: /^https:\/\/\S+$/, hint: 'must be an https:// URL' });
        if (o.tags !== undefined && !(Array.isArray(o.tags) && o.tags.every(x => typeof x === 'string'))) bad(`${at}.tags`, 'must be an array of strings');
        if (o.art !== undefined && !Object.hasOwn(ART_NAMES, o.art)) bad(`${at}.art`, `must be one of: ${Object.keys(ART_NAMES).join(', ')}`);
      }
    }
  }
  if (errs.length) throw new Error(`Invalid garden config:\n${errs.map(e => `  - ${e}`).join('\n')}`);

  const login = raw.login, profileRepo = raw.profileRepo ?? `${login}/${login}`;
  const b = r.banner ?? {}, p = r.packets ?? {}, f = r.footer ?? {};
  const profileName = profileRepo.split('/')[1];
  return {
    login,
    profileRepo,
    signName: raw.signName ?? defaultSignName(login),
    timezone: raw.timezone ?? 'UTC',
    hemisphere: raw.hemisphere ?? 'north',
    outputDir: raw.outputDir ?? 'profile-garden',
    readme: {
      enabled: r.enabled ?? true,
      imagesDir: r.imagesDir ?? 'readme',
      banner: { name: b.name ?? login, title: b.title ?? '', tagline: b.tagline ?? '' },
      stack: r.stack ?? [],
      footer: { left: f.left ?? '', right: f.right ?? '' },
      packets: {
        exclude: [...new Set([profileName, ...(p.exclude ?? [])])],
        overrides: Object.fromEntries(Object.entries(p.overrides ?? {}).map(([k, o]) => [k, { ...o, ...(o.art ? { art: ART_NAMES[o.art] } : {}) }])),
      },
    },
  };
}

export function loadConfig(file = CONFIG_FILE) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { throw new Error(`Cannot read garden config ${file}: ${e.code === 'ENOENT' ? 'file not found (copy garden.config.json from the template and set your login)' : e.message}`); }
  let raw;
  try { raw = JSON.parse(text); } catch (e) { throw new Error(`Invalid garden config ${file}: not valid JSON (${e.message})`); }
  return resolveConfig(raw);
}

// --config <file> from an argv list, removing it; returns [file, rest]
export function takeConfigArg(argv) {
  const i = argv.indexOf('--config');
  if (i < 0) return [CONFIG_FILE, argv];
  if (!argv[i + 1]) throw new Error('--config needs a file path');
  return [argv[i + 1], [...argv.slice(0, i), ...argv.slice(i + 2)]];
}

export function getPath(cfg, dotted) {
  let v = cfg;
  for (const k of dotted.split('.')) {
    if (!isObj(v) || !Object.hasOwn(v, k)) throw new Error(`Unknown config field: ${dotted}`);
    v = v[k];
  }
  return v;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [file, rest] = takeConfigArg(process.argv.slice(2));
    const cfg = loadConfig(file);
    if (rest[0] === '--get' && rest[1] && rest.length === 2) {
      const v = getPath(cfg, rest[1]);
      console.log(typeof v === 'object' ? JSON.stringify(v) : String(v));
    } else if (rest.length === 0) {
      console.log(JSON.stringify(cfg, null, 2));
    } else throw new Error('usage: node src/config.mjs [--config file] [--get field.path]');
  } catch (e) { console.error(e.message); process.exit(1); }
}
