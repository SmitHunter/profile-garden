import { test } from 'node:test'; import assert from 'node:assert/strict';
import { fetchCalendar, fetchPinned } from '../src/github.mjs';

const res = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test('maps days', async () => {
  let seen;
  const fetchImpl = async (url, opts) => {
    seen = { url, opts };
    return res({ data: { user: { contributionsCollection: { contributionCalendar: {
      totalContributions: 3,
      weeks: [{ contributionDays: [
        { date: '2026-10-15', contributionCount: 3 },
        { date: '2026-10-16', contributionCount: 0 },
      ] }],
    } } } } });
  };
  const m = await fetchCalendar({ token: 'tok', login: 'octocat', from: '2025-11-01', to: '2026-10-16', fetchImpl });
  assert.deepEqual([...m], [['2026-10-15', 3], ['2026-10-16', 0]]);
  assert.equal(seen.url, 'https://api.github.com/graphql');
  assert.equal(seen.opts.method, 'POST');
  assert.equal(seen.opts.headers.Authorization, 'bearer tok');
  const body = JSON.parse(seen.opts.body);
  assert.deepEqual(body.variables, { login: 'octocat', from: '2025-11-01T00:00:00Z', to: '2026-10-16T23:59:59Z' });
});

test('graphql errors', async () => {
  const fetchImpl = async () => res({ errors: [{ message: 'bad' }] });
  await assert.rejects(fetchCalendar({ token: 't', login: 'octocat', from: '2025-11-01', to: '2026-10-16', fetchImpl }), /bad/);
});

test('http error', async () => {
  const fetchImpl = async () => res({}, 401);
  await assert.rejects(fetchCalendar({ token: 't', login: 'octocat', from: '2025-11-01', to: '2026-10-16', fetchImpl }), /401/);
});

test('null user', async () => {
  const fetchImpl = async () => res({ data: { user: null } });
  await assert.rejects(fetchCalendar({ token: 't', login: 'octocat', from: '2025-11-01', to: '2026-10-16', fetchImpl }), /octocat/);
});

test('fetchPinned returns pinned nodes in order and sends the login', async () => {
  let seen;
  const nodes = [{ name: 'B' }, { name: 'A' }];
  const fetchImpl = async (url, opts) => { seen = JSON.parse(opts.body); return res({ data: { user: { pinnedItems: { nodes } } } }); };
  assert.deepEqual(await fetchPinned({ token: 't', login: 'octocat', fetchImpl }), nodes);
  assert.deepEqual(seen.variables, { login: 'octocat' });
  assert.match(seen.query, /pinnedItems\(first:6,types:REPOSITORY\)/);
  assert.match(seen.query, /isPrivate/);
});

test('fetchPinned rejects on errors and missing data', async () => {
  await assert.rejects(fetchPinned({ token: 't', login: 'octocat', fetchImpl: async () => res({}, 502) }), /502/);
  await assert.rejects(fetchPinned({ token: 't', login: 'octocat', fetchImpl: async () => res({ errors: [{ message: 'nope' }] }) }), /nope/);
  await assert.rejects(fetchPinned({ token: 't', login: 'octocat', fetchImpl: async () => res({ data: { user: {} } }) }), /pinnedItems/);
});
