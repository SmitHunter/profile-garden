import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveConfig, loadConfig, defaultSignName, getPath, LIMITS } from '../src/config.mjs';

const fixtureConfig = new URL('./fixtures/garden.config.json', import.meta.url);
const cli = (...args) => execFileSync(process.execPath, ['src/config.mjs', ...args], { encoding: 'utf8' }).trim();

test('the committed garden.config.json is valid', () => {
  const c = loadConfig('garden.config.json');
  assert.ok(c.login && c.profileRepo.includes('/'));
  assert.ok(c.readme.packets.exclude.includes(c.profileRepo.split('/')[1]));
});

test('defaults from just a login', () => {
  const c = resolveConfig({ login: 'octocat' });
  assert.deepEqual(c, {
    login: 'octocat', profileRepo: 'octocat/octocat', signName: "OCTOCAT'S PLOT", timezone: 'UTC', hemisphere: 'north', outputDir: 'profile-garden',
    readme: {
      enabled: true, imagesDir: 'readme',
      banner: { name: 'octocat', title: '', tagline: '' },
      stack: [], footer: { left: '', right: '' },
      packets: { exclude: ['octocat'], overrides: {} },
    },
  });
});

test('the profile repo is always excluded, once', () => {
  assert.deepEqual(resolveConfig({ login: 'a', profileRepo: 'a/profile', readme: { packets: { exclude: ['x', 'profile'] } } }).readme.packets.exclude, ['profile', 'x']);
});

test('override art names map to the packet illustrations', () => {
  const c = resolveConfig({ login: 'a', readme: { packets: { overrides: { r: { art: 'filmstrip' }, s: { line: 'hi' } } } } });
  assert.deepEqual(c.readme.packets.overrides, { r: { art: 'filmSprout' }, s: { line: 'hi' } });
});

test('default sign name falls back for long logins', () => {
  assert.equal(defaultSignName('octocat'), "OCTOCAT'S PLOT");
  for (const login of ['abcdefghijklmn', 'abcdefghijklmnopq', 'a'.repeat(30)]) assert.ok(defaultSignName(login).length <= LIMITS.signName, login);
  assert.equal(defaultSignName('a'.repeat(30)), 'MY PLOT');
});

test('every problem is reported at once, by field', () => {
  let err;
  try {
    resolveConfig({
      login: 'not a login', profileRepo: 'nope', timezone: 'Mars/Olympus', hemisphere: 'east', outputDir: '../escape', colour: 'red',
      signName: 'X'.repeat(LIMITS.signName + 1),
      readme: { enabled: 'yes', imagesDir: '/abs', banner: { title: 'T'.repeat(LIMITS.bannerTitle + 1) }, stack: [1], packets: { exclude: 'a', overrides: { r: { art: 'crayon', tags: 'x' } } } },
    });
  } catch (e) { err = e.message; }
  assert.ok(err?.startsWith('Invalid garden config:'));
  for (const field of ['login:', 'profileRepo:', 'timezone:', 'hemisphere:', 'outputDir:', 'colour:', 'signName:', 'readme.enabled:', 'readme.imagesDir:', 'readme.banner.title:', 'readme.stack[0]:', 'readme.packets.exclude:', 'readme.packets.overrides.r.art:', 'readme.packets.overrides.r.tags:']) assert.ok(err.includes(field), `missing ${field}\n${err}`);
});

test('login is required and the config must be an object', () => {
  assert.throws(() => resolveConfig({}), /login: is required/);
  assert.throws(() => resolveConfig([]), /JSON object/);
});

test('a stack too wide for the bed is rejected', () => {
  assert.throws(() => resolveConfig({ login: 'a', readme: { stack: Array(20).fill('Something') } }), /readme\.stack: .*too wide/);
});

test('loadConfig explains a missing or broken file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfg-'));
  assert.throws(() => loadConfig(path.join(dir, 'none.json')), /file not found/);
  fs.writeFileSync(path.join(dir, 'bad.json'), '{ nope');
  assert.throws(() => loadConfig(path.join(dir, 'bad.json')), /not valid JSON/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('getPath reads dotted fields and rejects unknown ones', () => {
  const c = loadConfig(fixtureConfig);
  assert.equal(getPath(c, 'readme.imagesDir'), 'readme');
  assert.throws(() => getPath(c, 'readme.nope'), /Unknown config field/);
});

test('CLI --get prints one resolved value for the workflow', () => {
  const file = fileURLToPath(fixtureConfig);
  assert.equal(cli('--config', file, '--get', 'profileRepo'), 'octocat/octocat');
  assert.equal(cli('--config', file, '--get', 'readme.enabled'), 'true');
  assert.equal(cli('--config', file, '--get', 'outputDir'), 'profile-garden');
});
