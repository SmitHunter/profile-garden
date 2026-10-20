import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectPackets, packetsHtml, renderPacket, artFor, SPACER_SVG } from '../src/readme/packets.mjs';
import { splice, stalePackets, START, END } from '../src/readme/splice.mjs';

const repo = (name, extra = {}) => ({ name, description: `${name} does things`, url: `https://github.com/octocat/${name}`, isPrivate: false, isFork: false, languages: { nodes: [{ name: 'Python' }] }, ...extra });

const OVERRIDES = { 'todo-api': { line: 'Todo lists over plain HTTP', tags: ['TypeScript', 'Express', 'Postgres'], art: 'filmSprout' } };

test('eligibility drops private, excluded repos and repos without description or override', () => {
  const notes = [];
  const got = selectPackets([
    repo('keep-a'), repo('secret', { isPrivate: true }), repo('octocat'), repo('sandbox'),
    repo('blank', { description: null }), repo('spaces', { description: '   ' }), repo('keep-b'),
  ], { exclude: ['octocat', 'sandbox'], log: m => notes.push(m) });
  assert.deepEqual(got.map(p => p.name), ['keep-a', 'keep-b']);
  assert.equal(notes.length, 2);
  assert.match(notes[0], /blank/);
});

test('override wins over repo data', () => {
  const [p] = selectPackets([repo('todo-api', { description: 'something else', languages: { nodes: [{ name: 'Python' }] } })], { overrides: OVERRIDES });
  assert.deepEqual(p, { name: 'todo-api', slug: 'todo-api', title: 'TODO-API', ...OVERRIDES['todo-api'], url: 'https://github.com/octocat/todo-api' });
  // an override also rescues a repo with no description
  assert.equal(selectPackets([repo('todo-api', { description: null })], { overrides: OVERRIDES }).length, 1);
  assert.equal(selectPackets([repo('todo-api', { description: null })]).length, 0);
  // inherited object keys are not overrides
  assert.equal(selectPackets([repo('constructor')])[0].line, 'constructor does things');
});

test('generated packets: uppercase title, description line, top 3 languages, art by primary language', () => {
  const [p] = selectPackets([repo('my_tool.js', { languages: { nodes: [{ name: 'TypeScript' }, { name: 'CSS' }, { name: 'HTML' }, { name: 'Shell' }] } })]);
  assert.equal(p.title, 'MY_TOOL.JS');
  assert.equal(p.slug, 'my-tool-js');
  assert.equal(p.line, 'my_tool.js does things');
  assert.deepEqual(p.tags, ['TypeScript', 'CSS', 'HTML']);
  assert.equal(p.art, 'seedTypeScript');
  assert.equal(artFor('Python'), 'seedPython');
  assert.equal(artFor('JavaScript'), 'seedJavaScript');
  assert.equal(artFor('Go'), 'seedOther');
  assert.equal(artFor(undefined), 'seedOther');
});

test('pinned order is kept and capped at 6', () => {
  const names = ['g', 'b', 'f', 'a', 'e', 'c', 'd'];
  assert.deepEqual(selectPackets(names.map(n => repo(n))).map(p => p.name), names.slice(0, 6));
});

test('every art variant renders day and night with the packet number', () => {
  for (const [i, lang] of ['Python', 'TypeScript', 'JavaScript', 'Rust'].entries()) {
    const [p] = selectPackets([repo(`r${i}`, { languages: { nodes: [{ name: lang }] } })]);
    for (const night of [false, true]) {
      const svg = renderPacket(p, { night, index: i });
      assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
      assert.ok(svg.includes(`No. 0${i + 1}`));
      assert.ok(!svg.includes('undefined') && !svg.includes('NaN'));
    }
  }
  for (const art of ['filmSprout', 'radarSprout']) {
    const [p] = selectPackets([repo('custom')], { overrides: { custom: { line: 'A custom packet', tags: ['Python'], art } } });
    for (const night of [false, true]) {
      const svg = renderPacket(p, { night });
      assert.ok(svg.endsWith('</svg>') && !svg.includes('undefined') && !svg.includes('NaN'));
    }
  }
  const [bare] = selectPackets([repo('bare', { languages: { nodes: [] } })]);
  assert.deepEqual(bare.tags, []);
  assert.ok(!renderPacket(bare, { night: false }).includes('NaN'));
});

test('packets.html lists each packet twice: 31% for wide screens, 48% for phones, each hiding on the other', () => {
  const html = packetsHtml(selectPackets([repo('todo-api'), repo('x')], { overrides: OVERRIDES }));
  assert.equal((html.match(/width="31%"/g) || []).length, 2);
  assert.equal((html.match(/width="48%"/g) || []).length, 2);
  // the wide row swaps to the spacer on phones, the phone row swaps to it on wide screens
  const [wide, phone] = [html.slice(0, html.indexOf('width="48%"')), html.slice(html.indexOf('width="31%"') + 1)];
  assert.ok(wide.includes('media="(max-width: 600px)" srcset="readme/spacer.svg"'));
  assert.ok(phone.includes('media="(min-width: 601px)" srcset="readme/spacer.svg"'));
  assert.equal((html.match(/srcset="readme\/spacer\.svg"/g) || []).length, 4);
  // the spacer must come first so it wins over the colour-scheme sources
  for (const block of html.split('<picture>').slice(1)) assert.ok(block.indexOf('spacer.svg') < block.indexOf('prefers-color-scheme'));
});

test('spacer.svg is a sliver: wide enough to hold a place, about zero tall', () => {
  assert.match(SPACER_SVG, /viewBox="0 0 1000 1"/);
  assert.ok(!/<(path|rect|circle|text|image)\b/.test(SPACER_SVG), 'draws nothing');
});

test('packets.html links each packet with day/night sources, escaped alt and 31% width', () => {
  const html = packetsHtml(selectPackets([repo('todo-api'), repo('x', { description: 'Say "hi" & <go>' })], { overrides: OVERRIDES }));
  assert.ok(html.startsWith('<p align="center">') && html.endsWith('</p>'));
  assert.equal((html.match(/<a href=/g) || []).length, 4);
  assert.ok(html.includes('<a href="https://github.com/octocat/todo-api">'));
  assert.ok(html.includes('srcset="readme/packet-todo-api-night.svg"') && html.includes('srcset="readme/packet-todo-api-day.svg"'));
  assert.ok(html.includes('alt="todo-api seed packet: Todo lists over plain HTTP. TypeScript, Express, Postgres."'));
  assert.ok(html.includes('alt="x seed packet: Say &quot;hi&quot; &amp; &lt;go&gt;. Python."'));
  assert.equal((html.match(/width="31%"/g) || []).length, 2);
  assert.ok(html.indexOf('packet-todo-api') < html.indexOf('packet-x'));
  assert.ok(packetsHtml(selectPackets([repo('x')]), 'img').includes('srcset="img/packet-x-day.svg"'));
  assert.equal(packetsHtml([]), '');
});

test('splice replaces only the marked section', () => {
  const readme = `top\n${START}\nold stuff\n${END}\nbottom\n`;
  assert.equal(splice(readme, '<p>new</p>\n'), `top\n${START}\n<p>new</p>\n${END}\nbottom\n`);
  assert.equal(splice(readme, ''), `top\n${START}\n${END}\nbottom\n`);
  assert.equal(splice(splice(readme, '<p>a</p>'), '<p>a</p>'), splice(readme, '<p>a</p>'));
});

test('splice throws when markers are missing or reversed', () => {
  assert.throws(() => splice('no markers here', '<p>x</p>'), /markers/);
  assert.throws(() => splice(`${START} only`, '<p>x</p>'), /markers/);
  assert.throws(() => splice(`${END}\n${START}`, '<p>x</p>'), /markers/);
});

test('stalePackets lists packet SVGs not in the current set and nothing else', () => {
  assert.deepEqual(
    stalePackets(['packet-todo-api-day.svg', 'packet-old-day.svg', 'packet-old-night.svg', 'banner-day.svg', 'packets.html'], ['packet-todo-api-day.svg', 'packet-todo-api-night.svg']),
    ['packet-old-day.svg', 'packet-old-night.svg'],
  );
});

test('splice CLI leaves a README without markers alone, but rejects a lone marker', async () => {
  const { execFileSync } = await import('node:child_process');
  const fs = await import('node:fs'), os = await import('node:os'), path = await import('node:path');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'splice-'));
  const readme = path.join(dir, 'README.md'), html = path.join(dir, 'packets.html');
  fs.writeFileSync(html, '<p>x</p>');
  fs.writeFileSync(readme, '# hi\n');
  const run = () => execFileSync(process.execPath, ['src/readme/splice.mjs', '--readme', readme, '--html', html], { encoding: 'utf8', stdio: 'pipe' });
  assert.match(run(), /no seed-packets markers/);
  assert.equal(fs.readFileSync(readme, 'utf8'), '# hi\n');
  fs.writeFileSync(readme, `# hi\n${START}\n`);
  assert.throws(run);
  fs.writeFileSync(readme, `# hi\n${START}\n${END}\n`);
  run();
  assert.equal(fs.readFileSync(readme, 'utf8'), `# hi\n${START}\n<p>x</p>\n${END}\n`);
  fs.rmSync(dir, { recursive: true, force: true });
});
