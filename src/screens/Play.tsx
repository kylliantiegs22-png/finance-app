import { useEffect, useMemo, useState } from 'react';
import type { Question } from '../content/schema';
import { checks, conceptBank, conceptsOfLesson, course, lessons, unitById } from '../lib/content';
import { commitSession, getState, today, useApp, type AppState, type SessionResult } from '../lib/store';
import { interleave, pickSession, RESCUE_SIZE } from '../logic/leitner';
import { passed as passedCheck, PASS_PCT } from '../logic/path';
import { lessonXp, XP } from '../logic/xp';
import { confettiBurst, confettiCannons, haptic, play } from '../lib/fx';
import { go } from '../router';
import { Badge, Button, CountUp } from '../ui/bits';
import { Icon } from '../ui/Icon';
import { RichText } from '../ui/RichText';
import { questionItems, Session, type Item, type SessionMode, type SessionStats } from './Session';

type Done = { result: SessionResult; before: AppState; after: AppState; stats: SessionStats; bullets?: string[]; mission?: string };

function pickQuestion(concept: string, lastQ?: string, seen = 0): Question | null {
  const bank = conceptBank[concept];
  if (!bank || !bank.questions.length) return null;
  const qs = bank.questions;
  let q = qs[seen % qs.length];
  if (q.id === lastQ && qs.length > 1) q = qs[(seen + 1) % qs.length];
  return q;
}

function buildUnitReview(unit: number): Question[] {
  const u = unitById(unit);
  const per = u.lessons.map((l) => lessons[l.id]).filter(Boolean);
  const out: { lesson: string; q: Question }[] = [];
  for (const l of per) if (l.reviewBank[0]) out.push({ lesson: l.id, q: l.reviewBank[0] });
  for (const l of per) if (out.length < 10 && l.reviewBank[1]) out.push({ lesson: l.id, q: l.reviewBank[1] });
  return interleave(out).map((x) => x.q);
}

export function Play({ path }: { path: string }) {
  const [, , kind, arg] = path.split('/'); // /play/<kind>/<arg>
  const [done, setDone] = useState<Done | null>(null);
  const [runId, setRunId] = useState(0);

  const setup = useMemo(() => {
    const s = getState();
    const d = today();
    if (kind === 'lesson') {
      const l = lessons[arg];
      if (!l) return null;
      const items: Item[] = l.screens.flatMap((sc, i) => (sc.kind === 'recap' ? [] : [{ key: `${l.id}-${i}`, screen: sc }]));
      const recap = l.screens.find((sc) => sc.kind === 'recap');
      const apply = l.screens.find((sc) => sc.kind === 'apply');
      return { mode: 'lesson' as SessionMode, items, title: l.title, bullets: recap?.kind === 'recap' ? recap.bullets : [], mission: apply?.kind === 'apply' ? apply.action : undefined };
    }
    if (kind === 'review' || kind === 'rescue') {
      const cards = pickSession(s.cards, d, s.days[d]?.reviews ?? 0, { rescue: kind === 'rescue' });
      const qs = cards.map((c) => pickQuestion(c.concept, c.lastQ, c.seen)).filter((q): q is Question => !!q);
      return { mode: 'review' as SessionMode, items: questionItems(qs), title: kind === 'rescue' ? '2-minute practice' : 'Review' };
    }
    if (kind === 'unit-review') return { mode: 'unit-review' as SessionMode, items: questionItems(buildUnitReview(+arg)), title: `Unit ${arg} review` };
    if (kind === 'check') {
      const c = checks[+arg];
      if (!c) return null;
      return { mode: 'check' as SessionMode, items: questionItems(c.questions), title: c.title };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, arg, runId]);

  if (!setup || !setup.items.length) {
    return (
      <div className="page center-page">
        <Badge icon="SealCheck" tone="success" size={80} />
        <h1 className="title">All caught up</h1>
        <p className="muted">Nothing to practise here right now.</p>
        <Button onClick={() => go('/', true)}>Back to your path</Button>
      </div>
    );
  }

  if (done) {
    if (done.result.kind === 'check') {
      return done.result.passed ? (
        <UnitWin done={done} />
      ) : (
        <CheckRetry
          done={done}
          onRetry={() => {
            setDone(null);
            setRunId((r) => r + 1);
          }}
        />
      );
    }
    return <Complete done={done} />;
  }

  function finish(stats: SessionStats) {
    let result: SessionResult;
    const firstTry = stats.answers.filter((a) => a.firstTry);
    const correct = firstTry.filter((a) => a.correct).length;
    if (setup!.mode === 'lesson') {
      const l = lessons[arg];
      result = {
        kind: 'lesson',
        nodeId: l.id,
        xp: lessonXp(stats.firstTryCorrect, stats.corrected, stats.questions),
        seconds: stats.seconds,
        correct,
        total: stats.questions,
        answers: stats.answers,
        concepts: conceptsOfLesson(l).map((c) => ({ concept: c, lesson: l.id })),
      };
    } else if (setup!.mode === 'check') {
      const ok = passedCheck(correct, stats.questions, checks[+arg].passPct ?? PASS_PCT);
      result = { kind: 'check', nodeId: `${arg}.check`, unit: +arg, passed: ok, xp: correct * XP.reviewCorrect + (ok ? XP.checkPassed : 0), seconds: stats.seconds, correct, total: stats.questions, answers: stats.answers };
    } else {
      result = {
        kind: setup!.mode === 'unit-review' ? 'unit-review' : 'review',
        nodeId: setup!.mode === 'unit-review' ? `${arg}.review` : undefined,
        xp: correct * XP.reviewCorrect + XP.reviewComplete,
        seconds: stats.seconds,
        correct,
        total: stats.questions,
        answers: stats.answers,
      };
    }
    result.missions = stats.missions;
    const { before, after } = commitSession(result);
    setDone({ result, before, after, stats, bullets: setup!.bullets, mission: setup!.mission });
  }

  return <Session key={`${path}-${runId}`} mode={setup.mode} items={setup.items} lessonId={kind === 'lesson' ? arg : undefined} onExit={() => go('/', true)} onDone={finish} />;
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Complete({ done }: { done: Done }) {
  const { result, before, after, bullets, mission, stats } = done;
  const d = today();
  const goal = after.profile.dailyGoal;
  const goalMet = (before.days[d]?.xp ?? 0) < goal && (after.days[d]?.xp ?? 0) >= goal;
  const streakUp = after.streak.current > before.streak.current;
  const freezeEarned = after.streak.freezes > before.streak.freezes;
  const acc = Math.round((result.correct / Math.max(1, result.total)) * 100);
  const milestone = [3, 7, 30, 66, 100].includes(after.streak.current) && streakUp;
  const isLesson = result.kind === 'lesson';
  const nextLesson = isLesson ? course.units.flatMap((u) => u.lessons).find((_, i, arr) => arr[i - 1]?.id === result.nodeId) : undefined;
  const missionPlanned = isLesson && stats.missions.length > 0;
  const live = useApp((s) => s.streak.current);

  useEffect(() => {
    play('complete');
    haptic([30, 40, 60]);
    confettiBurst();
    if (streakUp || goalMet) setTimeout(() => play('streak', 0.5), 900);
  }, [streakUp, goalMet]);

  return (
    <div className="page complete" data-testid="complete">
      <div className="complete-hero enter">
        <Badge icon={isLesson ? 'Trophy' : 'Repeat'} tone="reward" size={88} />
        <h1 className="title">{isLesson ? 'Lesson complete!' : result.kind === 'unit-review' ? 'Unit review done' : 'Review done'}</h1>
        <p className="muted">{isLesson ? lessons[result.nodeId!]?.title : `${result.total} cards strengthened`}</p>
      </div>

      <div className="stat-tiles">
        <div className="tile tile-xp stagger-1">
          <Icon name="Lightning" weight="fill" size={22} />
          <div className="tile-num">
            <CountUp value={result.xp} prefix="+" delay={200} />
          </div>
          <div className="tile-label">XP earned</div>
        </div>
        <div className="tile tile-acc stagger-2">
          <Icon name="Target" weight="fill" size={22} />
          <div className="tile-num">
            <CountUp value={acc} suffix="%" delay={450} />
          </div>
          <div className="tile-label">Accuracy</div>
        </div>
        <div className="tile tile-time stagger-3">
          <Icon name="Timer" weight="fill" size={22} />
          <div className="tile-num num">{fmtTime(result.seconds)}</div>
          <div className="tile-label">Time</div>
        </div>
      </div>

      <div className={`streak-line stagger-3 ${milestone ? 'streak-milestone' : ''}`} data-testid="streak-line">
        <Icon name="Flame" weight="fill" size={28} className="flame" />
        <div>
          <strong className="num">{live}-day streak</strong>
          <div className="muted small">
            {milestone
              ? `${after.streak.current} days. That's a real habit forming.`
              : streakUp
                ? 'Streak extended. See you tomorrow.'
                : after.streak.repair
                  ? 'One more session today repairs your streak.'
                  : 'Today already counts. Extra practice still helps.'}
          </div>
        </div>
        {goalMet && (
          <span className="goal-pill">
            <Icon name="Target" weight="fill" size={14} /> Daily goal met
          </span>
        )}
      </div>
      {freezeEarned && (
        <p className="freeze-line stagger-3">
          <Icon name="Snowflake" weight="duotone" size={22} /> You earned a streak freeze. It covers a day you miss, automatically.
        </p>
      )}

      {bullets && bullets.length > 0 && (
        <section className="recap stagger-4" aria-label="You learned">
          <h2 className="recap-title">You learned</h2>
          <ul>
            {bullets.map((b, i) => (
              <li key={i}>
                <Icon name="CheckCircle" weight="fill" size={20} />
                <RichText text={b} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {mission && missionPlanned && (
        <section className="mission-recap stagger-4">
          <Icon name="Target" weight="duotone" size={24} />
          <div>
            <div className="mission-kicker">Your real-money move</div>
            <RichText text={mission} />
          </div>
        </section>
      )}

      <div className="complete-foot">
        <Button onClick={() => go('/', true)} data-testid="complete-continue">
          Continue
        </Button>
        {nextLesson && lessons[nextLesson.id] && (
          <Button variant="ghost" onClick={() => go(`/play/lesson/${nextLesson.id}`, true)}>
            Next: {nextLesson.title}
          </Button>
        )}
      </div>
    </div>
  );
}

function UnitWin({ done }: { done: Done }) {
  const unit = unitById(done.result.unit!);
  const unlocked = course.units.filter((u) => u.prereqs.includes(unit.id) && u.prereqs.every((p) => done.after.passedUnits.includes(p)));
  const pct = Math.round((done.result.correct / done.result.total) * 100);
  useEffect(() => {
    play('badge');
    haptic([40, 60, 40, 60, 120]);
    confettiCannons();
  }, []);
  return (
    <div className="unit-win" data-testid="unit-win" role="dialog" aria-label={`Unit ${unit.id} mastered`}>
      <div className="win-rays" aria-hidden="true" />
      <div className="win-medal">
        <div className="win-medal-ring">
          <Badge icon={unit.icon} tone="reward" size={120} />
        </div>
      </div>
      <div className="win-kicker">Unit {unit.id} mastered</div>
      <h1 className="win-title">{unit.title}</h1>
      <p className="win-score">
        <CountUp value={pct} suffix="%" delay={300} /> on the unit check · <CountUp value={done.result.xp} prefix="+" suffix=" XP" delay={500} />
      </p>
      {unlocked.length > 0 && (
        <div className="win-unlock" data-testid="win-unlock">
          <Icon name="Rocket" weight="duotone" size={28} />
          <div>
            <div className="win-unlock-k">Now unlocked</div>
            {unlocked.map((u) => (
              <div key={u.id} className="win-unlock-t">
                Unit {u.id} · {u.title}
              </div>
            ))}
          </div>
        </div>
      )}
      <Button variant="secondary" className="win-btn" onClick={() => go('/', true)} data-testid="win-continue">
        Back to my path
      </Button>
    </div>
  );
}

function CheckRetry({ done, onRetry }: { done: Done; onRetry: () => void }) {
  const pct = Math.round((done.result.correct / done.result.total) * 100);
  const missedConcepts = new Set(done.result.answers.filter((a) => !a.correct).map((a) => a.concept));
  const weak = [...new Set([...missedConcepts].map((c) => conceptBank[c]?.lesson).filter(Boolean))].sort();
  return (
    <div className="page complete" data-testid="check-retry">
      <div className="complete-hero enter">
        <Badge icon="Barbell" tone="brand" size={88} />
        <h1 className="title">
          <CountUp value={pct} suffix="%" /> — nearly there
        </h1>
        <p className="muted">The check opens Unit {done.result.unit! + 1} at {PASS_PCT}%. A quick look at these lessons should get you over the line.</p>
      </div>
      <ul className="weak-list">
        {weak.map((id) => (
          <li key={id}>
            <button type="button" className="weak-item" onClick={() => go(`/play/lesson/${id}`, true)}>
              <Icon name="BookOpen" size={22} weight="duotone" />
              <span>
                <span className="muted small">Lesson {id}</span>
                <br />
                {lessons[id!]?.title}
              </span>
              <Icon name="CaretRight" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <div className="complete-foot">
        <Button onClick={onRetry} data-testid="check-again">
          Try the check again
        </Button>
        <Button variant="ghost" onClick={() => go('/', true)}>
          Back to my path
        </Button>
      </div>
    </div>
  );
}

export { RESCUE_SIZE };
