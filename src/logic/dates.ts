/** Calendar-day helpers on local 'YYYY-MM-DD' keys. Pure: callers pass `now`. */
export type Day = string;

export function dayKey(d: Date): Day {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function toUTC(day: Day): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(day: Day, n: number): Day {
  const t = new Date(toUTC(day) + n * 86_400_000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** Whole days from a to b (b - a). */
export function diffDays(a: Day, b: Day): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

export function lastNDays(today: Day, n: number): Day[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}

/** Monday-start week key. */
export function weekStart(day: Day): Day {
  const [y, m, d] = day.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun
  return addDays(day, -((dow + 6) % 7));
}
