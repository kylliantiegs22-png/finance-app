import { describe, expect, it, vi, afterEach } from 'vitest';
import { BACKUP_PREFIX, KEY, backup, getStorage, loadFrom, parseSaved, pruneState, sanitize, saveTo, type StorageLike } from '../../src/lib/persistence';
import { initialState, type AppState } from '../../src/lib/state';

/** In-memory Storage that can be made full or blocked. */
class FakeStorage implements StorageLike {
  map = new Map<string, string>();
  quota = Infinity; // max total chars
  blocked = false;
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    if (this.blocked) throw Object.assign(new Error('blocked'), { name: 'SecurityError' });
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.blocked) throw Object.assign(new Error('blocked'), { name: 'SecurityError' });
    const used = [...this.map].reduce((a, [kk, vv]) => a + (kk === k ? 0 : kk.length + vv.length), 0);
    if (used + k.length + v.length > this.quota) throw Object.assign(new Error('full'), { name: 'QuotaExceededError', code: 22 });
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const progress = (): AppState => ({
  ...initialState(),
  onboarded: true,
  xp: 240,
  completed: { '1.1': { at: '2026-11-20T08:00:00.000Z', score: 90, best: 90, runs: 1 }, '1.2': { at: '2026-11-21T08:00:00.000Z', score: 100, best: 100, runs: 1 } },
  days: { '2026-11-20': { xp: 120, lessons: 1, reviews: 0, sessions: 1, seconds: 300 }, '2026-11-21': { xp: 120, lessons: 1, reviews: 0, sessions: 1, seconds: 280 } },
  cards: { 'net-worth': { concept: 'net-worth', lesson: '1.2', box: 2, due: '2026-11-24', lapses: 0, seen: 1 } },
  streak: { ...initialState().streak, current: 2, longest: 2, lastDay: '2026-11-21', sessions: { '2026-11-20': 1, '2026-11-21': 1 } },
});

afterEach(() => vi.useRealTimers());

describe('loading saved progress', () => {
  it('missing data starts fresh', () => {
    const r = loadFrom(new FakeStorage());
    expect(r.status).toBe('empty');
    expect(r.state.onboarded).toBe(false);
  });

  it('valid data round-trips unchanged', () => {
    const s = new FakeStorage();
    s.setItem(KEY, JSON.stringify(progress()));
    const r = loadFrom(s);
    expect(r.status).toBe('ok');
    expect(r.state).toEqual(progress());
  });

  it('unreadable JSON starts fresh but asks for a backup of the raw text', () => {
    const r = parseSaved('{"v":1,"xp":24');
    expect(r.status).toBe('unreadable');
    expect(r.backupRaw).toBe('{"v":1,"xp":24');
    expect(r.state.xp).toBe(0);
  });

  it('partly corrupt data keeps every valid field and repairs the rest', () => {
    const bad = { ...progress(), days: null, cards: 'oops', streak: { current: 'two', lastDay: 'yesterday' }, settings: 7, profile: { cue: 42, dailyGoal: -5 } };
    const r = parseSaved(JSON.stringify(bad));
    expect(r.status).toBe('repaired');
    expect(r.backupRaw).toBeDefined();
    expect(r.state.xp).toBe(240);
    expect(Object.keys(r.state.completed)).toEqual(['1.1', '1.2']);
    expect(r.state.onboarded).toBe(true);
    expect(r.state.days).toEqual({});
    expect(r.state.cards).toEqual({});
    expect(r.state.streak.current).toBe(0);
    expect(r.state.profile.cue).toBe('my morning coffee');
    expect(r.state.profile.dailyGoal).toBe(60);
    expect(r.repaired).toEqual(expect.arrayContaining(['days', 'cards', 'streak.current', 'streak.lastDay']));
  });

  it('drops individual bad entries but keeps their neighbours', () => {
    const p = progress();
    const bad = { ...p, cards: { ...p.cards, broken: { box: 9, due: 'never' } }, days: { ...p.days, 'not-a-day': { xp: 5 } } };
    const r = parseSaved(JSON.stringify(bad));
    expect(Object.keys(r.state.cards)).toEqual(['net-worth']);
    expect(Object.keys(r.state.days)).toEqual(['2026-11-20', '2026-11-21']);
  });

  it('migrates older saved data (no version, missing newer fields)', () => {
    const old = { onboarded: true, xp: 80, completed: { '1.1': { at: '2026-11-01T00:00:00Z', score: 80 } } };
    const r = parseSaved(JSON.stringify(old));
    expect(r.status).toBe('migrated');
    expect(r.state.v).toBe(1);
    expect(r.state.xp).toBe(80);
    expect(r.state.completed['1.1']).toEqual({ at: '2026-11-01T00:00:00Z', score: 80, best: 80, runs: 1 });
    expect(r.state.streak).toEqual(initialState().streak);
    expect(r.state.missions).toEqual({});
  });

  it('a lost onboarded flag is restored when there is progress', () => {
    const r = parseSaved(JSON.stringify({ v: 1, xp: 50, completed: { '1.1': { at: 'x', score: 100, best: 100, runs: 1 } } }));
    expect(r.state.onboarded).toBe(true);
  });

  it('data from a newer app version is loaded best-effort and backed up', () => {
    const r = parseSaved(JSON.stringify({ ...progress(), v: 2, newThing: true }));
    expect(r.status).toBe('newer');
    expect(r.backupRaw).toContain('newThing');
    expect(r.state.xp).toBe(240);
  });

  it('a passed unit check restores the passed unit', () => {
    const r = sanitize({ ...progress(), completed: { '1.check': { at: 'x', score: 83, best: 83, runs: 1 } }, passedUnits: 'nope' });
    expect(r.state.passedUnits).toEqual([1]);
  });

  it('blocked storage (private mode) reports unavailable without throwing', () => {
    const s = new FakeStorage();
    s.blocked = true;
    expect(loadFrom(s).status).toBe('unavailable');
    expect(saveTo(s, progress(), '2026-11-24')).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('getStorage returns null when touching localStorage throws', () => {
    const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError'); } });
    try {
      expect(getStorage()).toBeNull();
    } finally {
      if (desc) Object.defineProperty(globalThis, 'localStorage', desc);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });
});

describe('saving progress', () => {
  it('writes and reads back', () => {
    const s = new FakeStorage();
    expect(saveTo(s, progress(), '2026-11-24')).toEqual({ ok: true, pruned: false });
    expect(loadFrom(s).state.xp).toBe(240);
  });

  it('on a full quota, frees old backups and prunes old day logs, then saves', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-24T09:00:00'));
    const s = new FakeStorage();
    const p = progress();
    for (let i = 0; i < 300; i++) {
      const d = new Date(Date.UTC(2025, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
      p.days[d] = { xp: 10, lessons: 0, reviews: 1, sessions: 1, seconds: 60 };
    }
    s.setItem(BACKUP_PREFIX + '2026-01-01', 'x'.repeat(2000));
    s.setItem(BACKUP_PREFIX + '2026-02-01', 'x'.repeat(2000));
    s.quota = JSON.stringify(pruneState(p, '2026-11-24')).length + KEY.length + 2000 + 40;
    const r = saveTo(s, p, '2026-11-24');
    expect(r).toEqual({ ok: true, pruned: true });
    const back = loadFrom(s).state;
    expect(back.xp).toBe(240);
    expect(Object.keys(back.completed)).toEqual(['1.1', '1.2']);
    expect(back.days['2026-11-21']).toBeDefined(); // recent days kept
    expect(back.days['2025-01-01']).toBeUndefined(); // old days pruned
    expect(s.getItem(BACKUP_PREFIX + '2026-02-01')).not.toBeNull(); // newest backup kept
    expect(s.getItem(BACKUP_PREFIX + '2026-01-01')).toBeNull();
  });

  it('when storage stays full, reports quota and leaves the old save intact', () => {
    const s = new FakeStorage();
    s.setItem(KEY, JSON.stringify(progress()));
    s.quota = s.map.get(KEY)!.length + KEY.length; // exactly full
    const bigger = { ...progress(), xp: 9999, missions: Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`m${i}`, 'planned' as const])) };
    expect(saveTo(s, bigger, '2026-11-24')).toEqual({ ok: false, reason: 'quota' });
    expect(loadFrom(s).state.xp).toBe(240);
  });

  it('backup copies raw text under a dated key', () => {
    const s = new FakeStorage();
    const k = backup(s, '{broken', new Date('2026-11-24T09:00:00Z'));
    expect(k).toMatch(/^tally\.backup\.2026-11-24T09-00-00-000Z$/);
    expect(s.getItem(k!)).toBe('{broken');
  });

  it('keeps at most 3 backups, removing the oldest', () => {
    const s = new FakeStorage();
    for (let d = 1; d <= 5; d++) backup(s, `raw${d}`, new Date(Date.UTC(2026, 10, d)));
    const keys = [...s.map.keys()].filter((k) => k.startsWith(BACKUP_PREFIX)).sort();
    expect(keys).toHaveLength(3);
    expect(keys.map((k) => s.getItem(k))).toEqual(['raw3', 'raw4', 'raw5']);
  });
});
