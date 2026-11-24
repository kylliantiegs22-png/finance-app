import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Question, Screen } from '../content/schema';
import { type Answer, correctText, emptyAnswer, isComplete, isCorrect, wrongWhy } from '../lib/grade';
import { haptic, play } from '../lib/fx';
import type { AnswerLog } from '../lib/store';
import { Button, ProgressBar } from '../ui/bits';
import { Icon } from '../ui/Icon';
import { QuestionView } from '../ui/QuestionView';
import { RichText } from '../ui/RichText';
import { Visual } from '../ui/Visual';
import { Calculator } from '../ui/Calculator';
import { isMathsQuestion } from '../lib/calc';
import { useModal } from '../ui/useModal';
import { retryPosition } from '../logic/session';

export type SessionMode = 'lesson' | 'review' | 'unit-review' | 'check';
export type Item = { key: string; screen: Exclude<Screen, { kind: 'recap' }>; retry?: boolean };

export interface SessionStats {
  answers: AnswerLog[];
  seconds: number;
  firstTryCorrect: number;
  corrected: number;
  questions: number;
  missions: string[];
}

const STEP_LABEL: Record<string, string> = {
  hook: 'Quick question',
  try: 'Have a go',
  core: 'The idea',
  example: 'Worked example',
  guided: 'Practice',
  independent: 'On your own',
  apply: 'Your money',
};

export function questionItems(qs: Question[], step: Screen['step'] = 'independent'): Item[] {
  return qs.map((q, i) => ({ key: `${q.id}-${i}`, screen: { kind: 'question', step, q } }));
}

export function Session({ mode, items, onExit, onDone, lessonId, title }: { mode: SessionMode; items: Item[]; onExit: () => void; onDone: (s: SessionStats) => void; lessonId?: string; title: string }) {
  const [queue, setQueue] = useState<Item[]>(items);
  const [pos, setPos] = useState(0);
  const item = queue[pos];
  // Answer and feedback are keyed to the item they belong to, so a new screen never sees the last one's state.
  const [ansState, setAnsState] = useState<{ k: string; a: Answer } | null>(null);
  const [fbState, setFbState] = useState<{ k: string; correct: boolean; sure: boolean } | null>(null);
  const answer: Answer | null = item?.screen.kind === 'question' ? (ansState && ansState.k === item.key ? ansState.a : emptyAnswer(item.screen.q)) : null;
  const fb = fbState && item && fbState.k === item.key ? fbState : null;
  const setAnswer = (a: Answer) => item && setAnsState({ k: item.key, a });
  const setFb = (f: { correct: boolean; sure: boolean } | null) => setFbState(f && item ? { k: item.key, ...f } : null);
  const [log, setLog] = useState<AnswerLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [roll, setRoll] = useState(0);
  const [missions, setMissions] = useState<string[]>([]);
  const [confirmExit, setConfirmExit] = useState(false);
  const exitRef = useRef<HTMLDivElement>(null);
  const closeExit = useCallback(() => setConfirmExit(false), []);
  useModal(exitRef, confirmExit, closeExit);
  const [hint, setHint] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const closeCalc = useCallback(() => setCalcOpen(false), []);
  const started = useRef(Date.now());
  const questionsTotal = useMemo(() => items.filter((i) => i.screen.kind === 'question').length, [items]);
  const live = useRef<HTMLDivElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLElement>(null);

  const firstScreen = useRef(true);
  useEffect(() => {
    setHint(false);
    bodyRef.current?.scrollTo({ top: 0 });
    // Move focus to the new screen's heading so keyboard and screen-reader users land on it.
    if (!firstScreen.current) bodyRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    firstScreen.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, queue[pos]?.key]);

  useEffect(() => {
    if (fb) continueRef.current?.focus({ preventScroll: true });
  }, [fb]);

  // Make room under the question for the feedback sheet, so marked answers can be scrolled into view.
  const sheetRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const sheet = sheetRef.current;
    if (!body) return;
    if (!sheet) {
      body.style.paddingBottom = '';
      return;
    }
    const foot = body.parentElement?.querySelector('.session-foot') as HTMLElement | null;
    const apply = () => {
      body.style.paddingBottom = `${Math.max(0, sheet.offsetHeight - (foot?.offsetHeight ?? 0)) + 16}px`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [fb]);

  if (!item) return null;
  const s = item.screen;
  const q = s.kind === 'question' ? s.q : null;
  const allowRetry = mode !== 'check';

  function check(sure: boolean) {
    if (!q || !answer) return;
    const correct = isCorrect(q, answer);
    setFb({ correct, sure });
    setLog((l) => [...l, { concept: q.concept, qid: q.id, correct, sure, firstTry: !item.retry }]);
    if (correct) {
      play('correct');
      haptic(15);
      const n = streak + 1;
      setStreak(n);
      if (n === 3 || n === 6) setRoll((r) => r + 1);
    } else {
      play('wrong', 0.5);
      haptic([20, 60, 20]);
      setStreak(0);
      if (allowRetry) {
        // Re-ask later in the session (confident misses come back sooner), but before any "apply" screen.
        setQueue((qq) => {
          const at = retryPosition(qq.map((i) => i.screen), pos, sure);
          const copy: Item = { key: item.key + '-r' + pos, screen: item.screen, retry: true };
          return [...qq.slice(0, at), copy, ...qq.slice(at)];
        });
      }
    }
  }

  function next() {
    if (pos + 1 >= queue.length) {
      const answers = log;
      const firstTry = answers.filter((a) => a.firstTry);
      const firstTryCorrect = firstTry.filter((a) => a.correct).length;
      const corrected = answers.filter((a) => !a.firstTry && a.correct).length;
      onDone({ answers, seconds: Math.round((Date.now() - started.current) / 1000), firstTryCorrect, corrected, questions: questionsTotal, missions });
      return;
    }
    setPos(pos + 1);
  }

  const progress = (pos + (fb || s.kind !== 'question' ? 1 : 0)) / queue.length;
  const ready = q && answer ? isComplete(q, answer) : false;
  const why = fb && q && answer ? (!fb.correct && wrongWhy(q, answer)) || q.explanation : '';
  const right = fb && q && !fb.correct ? correctText(q) : null;
  const showCalc = !!q && isMathsQuestion(q);

  return (
    <div className={`session mode-${mode}`} data-testid="session" data-step={s.step} data-kind={s.kind}>
      <h1 className="sr-only">{title}</h1>
      <header className="session-top">
        <button type="button" className="icon-btn" aria-label="Close" onClick={() => setConfirmExit(true)}>
          <Icon name="X" size={24} />
        </button>
        <ProgressBar value={progress} tone={mode === 'review' || mode === 'unit-review' ? 'reward' : 'growth'} label="Session progress" />
        {showCalc && (
          <button type="button" className="calc-open" aria-haspopup="dialog" onClick={() => setCalcOpen(true)} data-testid="calc-open">
            <Icon name="Calculator" size={20} weight="duotone" />
            <span className="calc-open-label">Calculator</span>
          </button>
        )}
        {roll > 0 && (
          <span key={roll} className="roll-chip" aria-live="polite">
            <Icon name="Lightning" weight="fill" size={14} /> On a roll
          </span>
        )}
      </header>

      <main className="session-body" key={item.key} ref={bodyRef}>
        <div className="step-label">
          {item.retry ? (
            <>
              <Icon name="ArrowCounterClockwise" size={14} weight="bold" /> One more try
            </>
          ) : mode === 'lesson' ? (
            STEP_LABEL[s.step]
          ) : mode === 'check' ? (
            `Question ${log.length + (fb ? 0 : 1)} of ${questionsTotal}`
          ) : (
            'Review'
          )}
        </div>

        {s.kind === 'teach' && (
          <section className="teach enter">
            <h2 className="teach-title" tabIndex={-1}>
              <RichText text={s.title} />
            </h2>
            <p className="teach-body">
              <RichText text={s.body} />
            </p>
            {s.visual && <Visual v={s.visual} />}
          </section>
        )}

        {s.kind === 'apply' && (
          <section className="teach enter">
            <h2 className="teach-title" tabIndex={-1}>
              <RichText text={s.title} />
            </h2>
            <p className="teach-body">
              <RichText text={s.body} />
            </p>
            <button
              type="button"
              className={`mission ${missions.includes(lessonId ?? '') ? 'mission-done' : ''}`}
              aria-pressed={missions.includes(lessonId ?? '')}
              onClick={() => {
                play('tap');
                setMissions((m) => (m.includes(lessonId ?? '') ? m.filter((x) => x !== lessonId) : [...m, lessonId ?? '']));
              }}
            >
              <span className="mission-icon">
                <Icon name={missions.includes(lessonId ?? '') ? 'CheckCircle' : 'Target'} size={28} weight="duotone" />
              </span>
              <span className="mission-text">
                <span className="mission-kicker">Real-money move</span>
                <RichText text={s.action} />
                <span className="mission-cta">{missions.includes(lessonId ?? '') ? "Saved. Tick it off in Profile once you've done it" : "Tap to plan it. It isn't graded"}</span>
              </span>
            </button>
          </section>
        )}

        {q && answer && (
          <section className={`qcard enter ${fb && !fb.correct ? 'shake' : ''}`} data-qid={q.id}>
            <QuestionView q={q} a={answer} set={setAnswer} revealed={!!fb} />
            {q.hint && !fb && mode === 'lesson' && (
              <div className="hint">
                {hint ? (
                  <p className="hint-text">
                    <Icon name="Lightbulb" size={18} weight="duotone" /> <RichText text={q.hint} />
                  </p>
                ) : (
                  <button type="button" className="link-btn" onClick={() => setHint(true)}>
                    <Icon name="Lightbulb" size={18} weight="duotone" /> Show a hint
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="session-foot">
        {s.kind !== 'question' && (
          <Button onClick={next} data-testid="continue">
            Continue
          </Button>
        )}
        {q && !fb && (
          <div className="confidence">
            <span className="confidence-label" id="confidence-label">
              {ready
                ? 'How sure are you?'
                : q.qtype === 'match'
                  ? 'Match every pair, then check'
                  : q.qtype === 'order'
                    ? 'Place every step, then check'
                    : q.qtype === 'sort'
                      ? 'Sort every item, then check'
                      : q.qtype === 'numeric'
                        ? 'Type a number, then check'
                        : q.qtype === 'slider'
                          ? 'Move the slider, then check'
                          : 'Choose an answer, then check'}
            </span>
            <div className="confidence-btns">
              <Button variant="secondary" disabled={!ready} onClick={() => check(false)} data-testid="check-guess">
                <Icon name="Question" size={20} weight="bold" /> Guessing
              </Button>
              <Button disabled={!ready} onClick={() => check(true)} data-testid="check-sure">
                <Icon name="SealCheck" size={20} weight="bold" /> I'm sure
              </Button>
            </div>
          </div>
        )}
      </footer>

      <div ref={live} className="sr-only" aria-live="assertive">
        {fb ? (fb.correct ? 'Correct. ' : 'Not quite. ') + (right ? `The answer is ${right}. ` : '') + why : ''}
      </div>

      {fb && (
        <div ref={sheetRef} className={`sheet fb ${fb.correct ? 'fb-right' : 'fb-wrong'}`} role="dialog" aria-label={fb.correct ? 'Correct' : 'Not quite'} data-testid="feedback">
          <div className="fb-head">
            <span className="fb-icon">
              {fb.correct ? (
                <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
                  <circle cx="16" cy="16" r="16" className="tick-bg" />
                  <path d="M9 16.5l4.5 4.5L23 11.5" className="tick-path" />
                </svg>
              ) : (
                <Icon name="XCircle" size={32} weight="fill" />
              )}
            </span>
            <strong className="fb-title">{fb.correct ? (item.retry ? 'Got it this time' : pickPraise(q?.id ?? '')) : 'Not quite'}</strong>
            {mode !== 'check' && fb.correct && !item.retry && <span className="fb-xp num">+5 XP</span>}
          </div>
          {right && (
            <p className="fb-answer">
              Answer: <strong>{right}</strong>
            </p>
          )}
          <p className="fb-why">
            <RichText text={why} />
          </p>
          {!fb.correct && fb.sure && allowRetry && <p className="fb-note">You felt sure, so this one comes back a little sooner.</p>}
          {fb.correct && !fb.sure && <p className="fb-note">Nice guess. We'll check it again soon to make it stick.</p>}
          <Button ref={continueRef} variant={fb.correct ? 'success' : 'danger'} onClick={next} data-testid="continue">
            Continue
          </Button>
        </div>
      )}

      <Calculator
        open={calcOpen && showCalc}
        onClose={closeCalc}
        onUse={q?.qtype === 'numeric' && !fb ? (v) => setAnswer({ qtype: 'numeric', v }) : undefined}
      />

      {confirmExit && (
        <div className="scrim" onClick={() => setConfirmExit(false)}>
          <div ref={exitRef} className="sheet" role="dialog" aria-modal="true" aria-label="Leave session" onClick={(e) => e.stopPropagation()}>
            <h2 className="sheet-title">Take a break?</h2>
            <p className="muted">You can start it again any time. Answers from this round won't be saved.</p>
            <div className="stack">
              <Button onClick={() => setConfirmExit(false)}>Keep going</Button>
              <Button variant="ghost" onClick={onExit} data-testid="leave">
                Leave for now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PRAISE = ['Correct!', 'Nailed it', 'Spot on', 'Exactly right', 'Correct!'];
function pickPraise(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PRAISE[Math.abs(h) % PRAISE.length];
}
