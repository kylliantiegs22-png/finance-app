/** Where a missed question is asked again inside a session queue. */
export function retryPosition(items: { kind: string }[], pos: number, sure: boolean): number {
  // 3 to 5 screens later; a confident miss returns sooner
  const gap = sure ? 2 : 4;
  let at = Math.min(items.length, pos + 1 + gap);
  // Never after the real-world "apply" screen: a lesson ends on apply then recap.
  const apply = items.findIndex((it, i) => i > pos && it.kind === 'apply');
  if (apply !== -1) at = Math.min(at, apply);
  return at;
}
