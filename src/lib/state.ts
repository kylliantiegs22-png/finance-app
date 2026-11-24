/** The saved app state shape (schema v1) and its defaults. */
import type { Day } from '../logic/dates';
import { newStreak, type StreakState } from '../logic/streak';
import type { Cards } from '../logic/leitner';

export const SCHEMA_VERSION = 1;

export interface DayLog {
  xp: number;
  lessons: number;
  reviews: number; // review cards answered
  sessions: number;
  seconds: number;
}

export interface NodeRecord {
  at: string;
  score: number; // 0..100
  best: number;
  runs: number;
}

export interface AppState {
  v: 1;
  onboarded: boolean;
  profile: {
    goal: string | null;
    level: 'new' | 'basics';
    cue: string;
    time: string;
    dailyGoal: number;
  };
  settings: {
    theme: 'system' | 'light' | 'dark';
    sound: boolean;
    haptics: boolean;
    motion: 'system' | 'reduced';
  };
  xp: number;
  days: Record<Day, DayLog>;
  completed: Record<string, NodeRecord>;
  passedUnits: number[];
  streak: StreakState;
  cards: Cards;
  missions: Record<string, 'planned' | 'done'>;
  celebrated: string[];
}

export function initialState(): AppState {
  return {
    v: 1,
    onboarded: false,
    profile: { goal: null, level: 'new', cue: 'my morning coffee', time: '08:00', dailyGoal: 60 },
    settings: { theme: 'system', sound: true, haptics: true, motion: 'system' },
    xp: 0,
    days: {},
    completed: {},
    passedUnits: [],
    streak: newStreak(),
    cards: {},
    missions: {},
    celebrated: [],
  };
}

