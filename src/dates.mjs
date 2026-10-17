// Calendar dates in the configured IANA time zone.
const fmts = new Map();
const fmtFor = (timeZone) => {
  if (!fmts.has(timeZone)) fmts.set(timeZone, new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }));
  return fmts.get(timeZone);
};

const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

// YYYY-MM-DD for `now` in `timeZone`
export function localDate(now, timeZone = 'UTC') {
  const p = Object.fromEntries(fmtFor(timeZone).formatToParts(now).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

export function addDays(date, n) {
  return iso(parse(date) + n * 86400000);
}

export function planWindow(now, timeZone = 'UTC') {
  const today = localDate(now, timeZone);
  const drawnThrough = addDays(today, -1);
  const [ty, tm] = today.split('-').map(Number);
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const idx = ty * 12 + (tm - 1) - i;
    const year = Math.floor(idx / 12), month = (idx % 12) + 1;
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    months.push({ year, month, days });
  }
  const start = `${months[0].year}-${pad(months[0].month)}-01`;
  return { today, drawnThrough, start, months };
}
