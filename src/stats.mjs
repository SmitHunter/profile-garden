import { addDays } from './dates.mjs';

export function computeStats(calendar, win) {
  let total = 0, run = 0, longestStreak = 0, best = null;
  const milestones = {};
  for (let d = win.start; d <= win.drawnThrough; d = addDays(d, 1)) {
    const n = calendar.get(d) ?? 0;
    const before = total;
    total += n;
    run = n > 0 ? run + 1 : 0;
    if (run > longestStreak) longestStreak = run;
    if (n > 0 && (!best || n >= best.count)) best = { date: d, count: n };
    const hundreds = Math.floor(total / 100);
    if (hundreds > Math.floor(before / 100)) milestones[d] = hundreds * 100;
  }
  return { total, longestStreak, best, milestones };
}
