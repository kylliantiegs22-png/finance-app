/** XP rewards real practice: correct answers and finished sessions, not screens tapped. */
export const XP = {
  correctFirstTry: 5,
  correctedLater: 2,
  lessonComplete: 10,
  perfectBonus: 5,
  reviewCorrect: 5,
  reviewComplete: 5,
  checkPassed: 30,
} as const;

export const DAILY_GOALS = [
  { xp: 30, label: 'Light', minutes: 5 },
  { xp: 60, label: 'Steady', minutes: 10 },
  { xp: 100, label: 'Keen', minutes: 15 },
] as const;

export function lessonXp(firstTryCorrect: number, corrected: number, totalQuestions: number): number {
  return (
    firstTryCorrect * XP.correctFirstTry +
    corrected * XP.correctedLater +
    XP.lessonComplete +
    (firstTryCorrect === totalQuestions ? XP.perfectBonus : 0)
  );
}
