// Park-Miller LCG: a tiny seeded generator so every render is deterministic.
export function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
