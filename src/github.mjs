const QUERY = 'query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}';

const PINNED_QUERY = 'query($login:String!){user(login:$login){pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{name description url isPrivate isFork languages(first:3,orderBy:{field:SIZE,direction:DESC}){nodes{name}}}}}}}';

// POST a GraphQL query and return data.user; any HTTP, GraphQL or missing-user problem rejects.
async function queryUser({ token, login, query, variables, fetchImpl }) {
  const res = await fetchImpl('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-garden' },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({ query, variables: { login, ...variables } }),
  });
  if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GitHub GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`);
  const user = body.data?.user;
  if (!user) throw new Error(`GitHub user not found: ${login}`);
  return user;
}

async function request({ token, login, from, to, fetchImpl }) {
  const user = await queryUser({ token, login, query: QUERY, variables: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` }, fetchImpl });
  return user.contributionsCollection.contributionCalendar;
}

// Pinned repositories in pinned order (raw nodes; filtering happens in readme/packets.mjs).
export async function fetchPinned({ token, login, fetchImpl = fetch }) {
  const user = await queryUser({ token, login, query: PINNED_QUERY, variables: {}, fetchImpl });
  const nodes = user.pinnedItems?.nodes;
  if (!Array.isArray(nodes)) throw new Error('GitHub API returned no pinnedItems');
  return nodes;
}

// Timezone note: GitHub buckets contributions by UTC (issues/PRs) or the commit's
// own timezone, while we treat those dates as dates in the configured time zone. That can put the
// newest day off by a few hours; accepted, and the next daily run corrects it.
export async function fetchCalendar({ token, login, from, to, fetchImpl = fetch }) {
  const cal = await request({ token, login, from, to, fetchImpl });
  const days = new Map();
  for (const w of cal.weeks) for (const d of w.contributionDays) days.set(d.date, d.contributionCount);
  return days;
}

export async function fetchTotal({ token, login, from, to, fetchImpl = fetch }) {
  return (await request({ token, login, from, to, fetchImpl })).totalContributions;
}
