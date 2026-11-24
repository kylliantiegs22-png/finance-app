/** Which units serve each onboarding goal (so the path can show where a learner's goal lives). */
export const GOAL_UNITS: Record<string, number[]> = {
  pay: [4],
  debt: [3],
  invest: [6, 7],
  pro: [9, 10, 11, 12],
};

export function isGoalUnit(goal: string | null, unit: number): boolean {
  return !!goal && (GOAL_UNITS[goal] ?? []).includes(unit);
}
