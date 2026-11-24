import { useMemo, useState } from 'react';
import { course, lessons } from '../lib/content';
import { nodeStates, unitNodes, unitUnlocked, type NodeState, type PathNode } from '../logic/path';
import { pickSession } from '../logic/leitner';
import { streakStatus } from '../logic/streak';
import { today, useApp, type AppState } from '../lib/store';
import { play } from '../lib/fx';
import { Badge, Button, Chip, Ring } from '../ui/bits';
import { Icon } from '../ui/Icon';
import { go } from '../router';

const OFFSETS = [0, 0.9, 1.35, 0.9, 0, -0.9, -1.35, -0.9];
const STEP_X = 46;
const STEP_Y = 104;
const TRACK_W = 320;
const CX = TRACK_W / 2;

export function nodeTitle(n: PathNode, unitTitle: string) {
  if (n.kind === 'review') return 'Unit review';
  if (n.kind === 'check') return 'Unit check';
  return course.units.find((u) => u.id === n.unit)?.lessons.find((l) => l.id === n.id)?.title ?? unitTitle;
}

export function nextAction(s: AppState) {
  const d = today();
  const done = s.days[d]?.reviews ?? 0;
  const due = pickSession(s.cards, d, done).length;
  if (due > 0 && done === 0) return { kind: 'review' as const, label: `Warm up: ${due} review${due > 1 ? 's' : ''}`, href: '/play/review' };
  for (const u of course.units) {
    if (!unitUnlocked(u, s.passedUnits)) continue;
    const st = nodeStates(u, s.completed, s.passedUnits);
    const cur = unitNodes(u).find((n) => st[n.id] === 'current');
    if (!cur) continue;
    if (cur.kind === 'lesson' && !lessons[cur.id]) continue;
    if (cur.kind === 'lesson') return { kind: 'lesson' as const, label: `Start lesson ${cur.id}`, href: `/play/lesson/${cur.id}` };
    if (cur.kind === 'review') return { kind: 'unit-review' as const, label: `Unit ${u.id} review`, href: `/play/unit-review/${u.id}` };
    return { kind: 'check' as const, label: `Take the Unit ${u.id} check`, href: `/play/check/${u.id}` };
  }
  if (due > 0) return { kind: 'review' as const, label: `Review ${due} card${due > 1 ? 's' : ''}`, href: '/play/review' };
  if (Object.keys(s.cards).length) return { kind: 'rescue' as const, label: '2-minute practice', href: '/play/rescue' };
  return null;
}

export function StatusChips() {
  const s = useApp((x) => x);
  const st = streakStatus(s.streak, today());
  return (
    <div className="chips" data-testid="chips">
      <Chip icon="Flame" tone={st === 'repair' ? 'frozen' : 'streak'} value={<span data-testid="streak">{s.streak.current}</span>} label="Day streak" onClick={() => go('/progress')} />
      <Chip icon="Snowflake" tone="freeze" value={<span data-testid="freezes">{s.streak.freezes}</span>} label="Streak freezes" />
      <Chip icon="Lightning" tone="xp" value={<span data-testid="xp">{s.xp}</span>} label="Total XP" />
    </div>
  );
}

export function Home() {
  const s = useApp((x) => x);
  const d = today();
  const todayXp = s.days[d]?.xp ?? 0;
  const goal = s.profile.dailyGoal;
  const action = nextAction(s);
  const st = streakStatus(s.streak, d);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="page home">
      <div className="home-mesh" aria-hidden="true" />
      <header className="home-head">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}icons/logo.svg`} alt="" width={32} height={32} />
          <span className="brand-name">Tally</span>
        </div>
        <StatusChips />
      </header>

      <section className="today-card" aria-label="Today">
        <div className="today-row">
          <Ring value={todayXp / goal} id="home-ring">
            <span className="num ring-num">{Math.min(100, Math.round((todayXp / goal) * 100))}%</span>
          </Ring>
          <div className="today-text">
            <div className="today-kicker">Today's goal · {goal} XP</div>
            <div className="today-title">
              {todayXp >= goal ? 'Goal met. Nice work.' : st === 'repair' ? 'Repair your streak today' : st === 'done-today' ? 'Streak safe for today' : 'Your 10 minutes'}
            </div>
            <div className="today-cue">
              <Icon name="Clock" size={16} /> After {s.profile.cue}, I do my lesson
            </div>
          </div>
        </div>
        {st === 'repair' && (
          <p className="today-repair">
            <Icon name="Lifebuoy" size={18} weight="duotone" /> You missed yesterday. Finish 2 sessions today and your {s.streak.current}-day streak carries on.
          </p>
        )}
        {action ? (
          <Button variant="secondary" className="today-btn" onClick={() => go(action.href)} data-testid="today-start">
            {action.label} <Icon name="ArrowRight" size={20} weight="bold" />
          </Button>
        ) : (
          <p className="today-repair">You've finished everything that's ready. More units are on the way.</p>
        )}
      </section>

      <div className="path" data-testid="path">
        {course.units.map((u) => (
          <UnitSection key={u.id} unit={u} s={s} open={open} setOpen={setOpen} />
        ))}
        <p className="disclaimer">General information only, not financial advice.</p>
      </div>
    </div>
  );
}

function UnitSection({ unit, s, open, setOpen }: { unit: (typeof course.units)[number]; s: AppState; open: string | null; setOpen: (v: string | null) => void }) {
  const unlocked = unitUnlocked(unit, s.passedUnits);
  const states = useMemo(() => nodeStates(unit, s.completed, s.passedUnits), [unit, s.completed, s.passedUnits]);
  const nodes = unitNodes(unit);
  const doneCount = unit.lessons.filter((l) => s.completed[l.id]).length;
  const passed = s.passedUnits.includes(unit.id);
  const hasContent = unit.lessons.some((l) => lessons[l.id]);
  const seasonStart = unit.id === 1 || course.units[unit.id - 2]?.season !== unit.season;

  return (
    <section className={`unit unit-${unit.season} ${unlocked ? 'unit-open' : 'unit-locked'}`} data-testid={`unit-${unit.id}`} data-unlocked={unlocked} aria-label={`Unit ${unit.id}: ${unit.title}`}>
      {seasonStart && <div className="season">{unit.season === 'personal' ? 'Season 1 · Personal finance' : unit.season === 'investing' ? 'Season 2 · Investing' : 'Season 3 · Professional finance'}</div>}
      <div className="unit-banner">
        <Badge icon={unit.icon} tone={passed ? 'success' : unlocked ? 'brand' : 'locked'} size={56} />
        <div className="unit-text">
          <div className="unit-kicker">Unit {unit.id}</div>
          <h2 className="unit-title">{unit.title}</h2>
          <div className="unit-meta">
            {passed ? (
              <>
                <Icon name="SealCheck" size={16} weight="fill" /> Mastered
              </>
            ) : unlocked ? (
              hasContent ? (
                `${doneCount} of ${unit.lessons.length} lessons`
              ) : (
                <span data-testid={`unit-${unit.id}-status`}>Unlocked · lessons coming soon</span>
              )
            ) : (
              <>
                <Icon name="Lock" size={14} weight="bold" /> {unit.focus}
              </>
            )}
          </div>
        </div>
      </div>
      {unlocked && hasContent && (
        <div className="nodes" style={{ height: nodes.length * STEP_Y, width: TRACK_W }}>
          <svg className="trail" width={TRACK_W} height={nodes.length * STEP_Y} aria-hidden="true">
            {nodes.slice(1).map((n, i) => {
              const x1 = OFFSETS[i % 8] * STEP_X;
              const x2 = OFFSETS[(i + 1) % 8] * STEP_X;
              const done = states[nodes[i].id] === 'done' && states[n.id] !== 'locked';
              return (
                <line
                  key={n.id}
                  x1={CX + x1}
                  y1={i * STEP_Y + 40}
                  x2={CX + x2}
                  y2={(i + 1) * STEP_Y + 40}
                  className={done ? 'trail-done' : 'trail-todo'}
                />
              );
            })}
          </svg>
          {nodes.map((n, i) => (
            <PathNodeView key={n.id} n={n} state={states[n.id]} x={OFFSETS[i % 8] * STEP_X} y={i * STEP_Y} unitTitle={unit.title} open={open === n.id} setOpen={setOpen} />
          ))}
        </div>
      )}
    </section>
  );
}

function PathNodeView({ n, state, x, y, unitTitle, open, setOpen }: { n: PathNode; state: NodeState; x: number; y: number; unitTitle: string; open: boolean; setOpen: (v: string | null) => void }) {
  const title = nodeTitle(n, unitTitle);
  const href = n.kind === 'lesson' ? `/play/lesson/${n.id}` : n.kind === 'review' ? `/play/unit-review/${n.unit}` : `/play/check/${n.unit}`;
  const icon = state === 'locked' ? 'Lock' : state === 'done' ? 'Check' : n.kind === 'review' ? 'Repeat' : n.kind === 'check' ? 'Trophy' : 'Star';
  const available = n.kind !== 'lesson' || !!lessons[n.id];
  const lesson = lessons[n.id];
  return (
    <div className={`node-wrap ${open ? 'node-wrap-open' : ''}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
      <button
        type="button"
        className={`node node-${state} node-${n.kind}`}
        data-node={n.id}
        data-state={state}
        aria-label={`${title}, ${state === 'current' ? 'up next' : state}`}
        aria-expanded={open}
        onClick={() => {
          play('tap', 0.35);
          setOpen(open ? null : n.id);
        }}
      >
        {state === 'current' && <span className="node-pulse" aria-hidden="true" />}
        <Icon name={icon} size={n.kind === 'check' ? 34 : 30} weight={state === 'locked' ? 'bold' : 'fill'} />
      </button>
      {state === 'current' && !open && <span className="node-tip">{n.kind === 'lesson' ? 'Start' : n.kind === 'review' ? 'Review' : 'Check'}</span>}
      {open && (
        <div className="node-card" role="dialog" aria-label={title} style={{ left: `calc(50% - ${x}px)` }}>
          <div className="node-card-kicker">{n.kind === 'lesson' ? `Lesson ${n.id}` : n.kind === 'review' ? 'Mixed review · 10 questions' : 'Unit check · 12 questions · pass at 80%'}</div>
          <div className="node-card-title">{title}</div>
          {lesson && <p className="node-card-sub">{lesson.objective}</p>}
          {state === 'locked' ? (
            <p className="node-card-sub">
              <Icon name="Lock" size={14} weight="bold" /> Finish the step before this to unlock it.
            </p>
          ) : !available ? (
            <p className="node-card-sub">Coming soon.</p>
          ) : (
            <Button variant={state === 'done' ? 'secondary' : 'primary'} onClick={() => go(href)} data-testid="node-start">
              {state === 'done' ? 'Practise again' : n.kind === 'check' ? 'Start the check' : 'Start'}
              {lesson && <span className="btn-meta">· {lesson.minutes} min</span>}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
