/** The unit path: node order, unlock rules and the unit-check pass mark. */
export const PASS_PCT = 80;

export interface UnitLike {
  id: number;
  prereqs: number[];
  lessons: { id: string }[];
}

export type NodeKind = 'lesson' | 'review' | 'check';
export interface PathNode {
  id: string; // "1.3", "1.review", "1.check"
  unit: number;
  kind: NodeKind;
}
export type NodeState = 'locked' | 'current' | 'done' | 'available';

export function unitNodes(u: UnitLike): PathNode[] {
  return [
    ...u.lessons.map((l) => ({ id: l.id, unit: u.id, kind: 'lesson' as const })),
    { id: `${u.id}.review`, unit: u.id, kind: 'review' },
    { id: `${u.id}.check`, unit: u.id, kind: 'check' },
  ];
}

export function unitUnlocked(u: UnitLike, passedUnits: number[]): boolean {
  return u.prereqs.every((p) => passedUnits.includes(p));
}

/**
 * Node states inside a unit: done nodes stay replayable; the first not-done
 * node is "current"; everything after it is locked. A locked unit is all locked.
 */
export function nodeStates(u: UnitLike, completed: Record<string, unknown>, passedUnits: number[]): Record<string, NodeState> {
  const out: Record<string, NodeState> = {};
  const open = unitUnlocked(u, passedUnits);
  let currentFound = false;
  for (const n of unitNodes(u)) {
    if (!open) out[n.id] = 'locked';
    else if (completed[n.id]) out[n.id] = 'done';
    else if (!currentFound) {
      out[n.id] = 'current';
      currentFound = true;
    } else out[n.id] = 'locked';
  }
  return out;
}

export function passed(correct: number, total: number, passPct = PASS_PCT): boolean {
  return total > 0 && (correct / total) * 100 >= passPct;
}
