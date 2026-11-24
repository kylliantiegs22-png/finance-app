/**
 * Leitner spaced review, one card per concept.
 *   Boxes 1..6 -> next review after 1, 3, 7, 16, 35, 90 days.
 *   Right + sure  -> up one box.
 *   Right + guess -> same box (a lucky guess isn't mastery).
 *   Wrong + guess -> down per the ladder (1,2,3 -> 1; 4,5 -> 2; 6 -> 3).
 *   Wrong + sure  -> box 1 and due again today: confident misses return sooner.
 * Sessions take the most overdue cards first, max 8 a day, interleaved so
 * consecutive cards come from different lessons.
 */
import { addDays, diffDays, type Day } from './dates';

export const INTERVALS = [1, 3, 7, 16, 35, 90] as const;
export const DAILY_REVIEW_CAP = 8;
export const RESCUE_SIZE = 5;

export interface Card {
  concept: string;
  lesson: string; // e.g. "1.3" – used to interleave
  box: number; // 1..6
  due: Day;
  lapses: number;
  lastQ?: string;
  seen: number;
}

export type Cards = Record<string, Card>;

export function intervalFor(box: number): number {
  return INTERVALS[Math.min(Math.max(box, 1), 6) - 1];
}

/** Concepts from a finished lesson enter box 1, due tomorrow. Existing cards are kept. */
export function introduce(cards: Cards, concepts: { concept: string; lesson: string }[], today: Day): Cards {
  const out = { ...cards };
  for (const c of concepts) {
    if (!out[c.concept]) out[c.concept] = { concept: c.concept, lesson: c.lesson, box: 1, due: addDays(today, 1), lapses: 0, seen: 0 };
  }
  return out;
}

export function demote(box: number): number {
  if (box <= 3) return 1;
  if (box <= 5) return 2;
  return 3;
}

export function grade(card: Card, correct: boolean, sure: boolean, today: Day, qid?: string): Card {
  let box = card.box;
  let due: Day;
  let lapses = card.lapses;
  if (correct && sure) {
    box = Math.min(6, box + 1);
    due = addDays(today, intervalFor(box));
  } else if (correct) {
    due = addDays(today, intervalFor(box));
  } else if (sure) {
    box = 1;
    lapses++;
    due = today; // confident miss: comes back sooner (today)
  } else {
    box = demote(box);
    lapses++;
    due = addDays(today, intervalFor(box));
  }
  return { ...card, box, due, lapses, lastQ: qid ?? card.lastQ, seen: card.seen + 1 };
}

/** Round-robin across lessons so neighbours differ (interleaving). */
export function interleave<T extends { lesson: string }>(items: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const g = groups.get(it.lesson) ?? [];
    g.push(it);
    groups.set(it.lesson, g);
  }
  // largest groups first so they are spread out
  const queues = [...groups.values()].sort((a, b) => b.length - a.length);
  const out: T[] = [];
  let last: string | null = null;
  while (out.length < items.length) {
    queues.sort((a, b) => b.length - a.length);
    const q = queues.find((g) => g.length && g[0].lesson !== last) ?? queues.find((g) => g.length)!;
    const it = q.shift()!;
    out.push(it);
    last = it.lesson;
  }
  return out;
}

export function dueCards(cards: Cards, today: Day): Card[] {
  return Object.values(cards)
    .filter((c) => diffDays(c.due, today) >= 0)
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.box - b.box));
}

/**
 * Pick today's review session. `doneToday` counts cards already reviewed today
 * (the daily cap is 8). A rescue session wants at least `RESCUE_SIZE` cards and
 * may practise ahead with the soonest-due cards so a 2-minute session is always possible.
 */
export function pickSession(cards: Cards, today: Day, doneToday: number, opts: { rescue?: boolean } = {}): Card[] {
  const room = Math.max(0, DAILY_REVIEW_CAP - doneToday);
  let picked = dueCards(cards, today).slice(0, room);
  if (opts.rescue && picked.length < RESCUE_SIZE) {
    const ids = new Set(picked.map((c) => c.concept));
    const ahead = Object.values(cards)
      .filter((c) => !ids.has(c.concept))
      .sort((a, b) => (a.due < b.due ? -1 : 1))
      .slice(0, RESCUE_SIZE - picked.length);
    picked = [...picked, ...ahead];
  }
  if (opts.rescue) picked = picked.slice(0, RESCUE_SIZE);
  return interleave(picked);
}

export type Strength = 'strong' | 'fading' | 'weak' | 'new';
export function strength(card: Card | undefined, today: Day): Strength {
  if (!card) return 'new';
  if (card.box >= 4 && diffDays(card.due, today) < 0) return 'strong';
  if (card.lapses > 0 && card.box <= 1) return 'weak';
  if (diffDays(card.due, today) >= 0) return 'fading';
  return card.box >= 3 ? 'strong' : 'fading';
}
