import { useState } from 'react';
import type { Question } from '../content/schema';
import { emptyAnswer, isCorrect, type Answer } from '../lib/grade';
import { play } from '../lib/fx';
import { setState } from '../lib/store';
import { DAILY_GOALS } from '../logic/xp';
import { go } from '../router';
import { Badge, Button, ProgressBar } from '../ui/bits';
import { Icon } from '../ui/Icon';
import { QuestionView } from '../ui/QuestionView';
import { downloadIcs } from './Tabs';

const FIRST: Question = {
  id: 'onboard-inflation',
  concept: 'inflation-intro',
  qtype: 'mcq',
  prompt: 'You have $1,000 in a jar and prices rise 5% this year. In a year, what can that $1,000 buy?',
  options: [{ text: 'More than today' }, { text: 'Less than today' }, { text: 'The same as today' }],
  answer: 1,
  explanation: 'Your $1,000 is still $1,000, but things cost about 5% more, so it buys less. That gap is what inflation does to idle cash.',
  difficulty: 1,
};

const GOALS = [
  { id: 'pay', icon: 'Receipt', title: 'Understand my pay and tax' },
  { id: 'debt', icon: 'Lifebuoy', title: 'Stop worrying about debt' },
  { id: 'invest', icon: 'ChartLineUp', title: 'Start investing' },
  { id: 'pro', icon: 'Buildings', title: 'Go deeper (pro finance)' },
];
const CUES = ['my morning coffee', 'I sit on the train', 'lunch', 'I brush my teeth tonight'];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answer>(emptyAnswer(FIRST));
  const [checked, setChecked] = useState(false);
  const [goal, setGoal] = useState<string | null>(null);
  const [level, setLevel] = useState<'new' | 'basics'>('new');
  const [daily, setDaily] = useState(60);
  const [cue, setCue] = useState(CUES[0]);
  const [time, setTime] = useState('08:00');
  const [icsDone, setIcsDone] = useState(false);
  const total = 6;
  const next = () => setStep((s) => s + 1);

  function finish() {
    setState((s) => ({ ...s, onboarded: true, xp: s.xp + 5, profile: { ...s.profile, goal, level, dailyGoal: daily, cue: cue.trim() || CUES[0], time } }));
    go('/', true);
  }

  if (step === 0)
    return (
      <div className="onboard-welcome" data-testid="onboarding">
        <div className="welcome-glow" aria-hidden="true" />
        <img className="welcome-logo" src={`${import.meta.env.BASE_URL}icons/logo.svg`} alt="" width={88} height={88} />
        <h1 className="welcome-title">Tally</h1>
        <p className="welcome-sub">Get good with money, 10 minutes a day.</p>
        <ul className="welcome-points">
          <li><Icon name="Lightning" weight="fill" size={20} /> Short lessons, mostly questions</li>
          <li><Icon name="Flag" size={20} /> Real Australian examples</li>
          <li><Icon name="ShieldCheck" weight="fill" size={20} /> No sign-up. Your progress stays on this phone.</li>
        </ul>
        <Button variant="secondary" className="welcome-btn" onClick={next} data-testid="ob-start">
          Start <Icon name="ArrowRight" size={20} weight="bold" />
        </Button>
      </div>
    );

  return (
    <div className="page onboard" data-testid="onboarding">
      <header className="session-top">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <Icon name="ArrowCounterClockwise" size={22} />
        </button>
        <ProgressBar value={step / total} label="Setup progress" />
      </header>

      {step === 1 && (
        <section className="onboard-body enter">
          <div className="step-label">Your first question</div>
          <div className={`qcard ${checked && !isCorrect(FIRST, a) ? 'shake' : ''}`}>
            <QuestionView q={FIRST} a={a} set={setA} revealed={checked} />
          </div>
          {checked ? (
            <div className={`inline-fb ${isCorrect(FIRST, a) ? 'fb-right' : 'fb-wrong'}`} role="status">
              <strong>{isCorrect(FIRST, a) ? 'Correct! +5 XP' : 'Not quite — less'}</strong>
              <p>{FIRST.explanation}</p>
            </div>
          ) : null}
          <div className="onboard-foot">
            {checked ? (
              <Button onClick={next} data-testid="ob-next">Continue</Button>
            ) : (
              <Button
                disabled={a.v === null}
                data-testid="ob-check"
                onClick={() => {
                  setChecked(true);
                  play(isCorrect(FIRST, a) ? 'correct' : 'wrong');
                }}
              >
                Check
              </Button>
            )}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onboard-body enter">
          <h1 className="title">What brings you here?</h1>
          <p className="muted">We'll use it to point you at the right units. Nothing gets locked.</p>
          <div className="choice-list" role="radiogroup">
            {GOALS.map((g) => (
              <button key={g.id} type="button" role="radio" aria-checked={goal === g.id} className={`choice ${goal === g.id ? 'choice-on' : ''}`} onClick={() => { play('tap', 0.35); setGoal(g.id); }} data-goal={g.id}>
                <Badge icon={g.icon} tone="brand" size={44} />
                <span>{g.title}</span>
              </button>
            ))}
          </div>
          <div className="onboard-foot">
            <Button disabled={!goal} onClick={next} data-testid="ob-next">Continue</Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="onboard-body enter">
          <h1 className="title">How much do you know?</h1>
          <div className="choice-list" role="radiogroup">
            {(
              [
                ['new', 'Plant', 'New to this', 'Start at Unit 1, Money foundations.'],
                ['basics', 'Leaf', 'I know the basics', 'Unit 1 moves fast. Skip ahead by passing its check.'],
              ] as const
            ).map(([id, icon, t, sub]) => (
              <button key={id} type="button" role="radio" aria-checked={level === id} className={`choice ${level === id ? 'choice-on' : ''}`} onClick={() => setLevel(id)} data-level={id}>
                <Badge icon={icon} tone="brand" size={44} />
                <span>
                  {t}
                  <br />
                  <span className="muted small">{sub}</span>
                </span>
              </button>
            ))}
          </div>
          <h2 className="h3 mt">Daily goal</h2>
          <div className="seg seg-wide" role="radiogroup" aria-label="Daily goal">
            {DAILY_GOALS.map((g) => (
              <button key={g.xp} type="button" role="radio" aria-checked={daily === g.xp} className={`seg-btn ${daily === g.xp ? 'seg-on' : ''}`} onClick={() => setDaily(g.xp)}>
                {g.minutes} min
              </button>
            ))}
          </div>
          <div className="onboard-foot">
            <Button onClick={next} data-testid="ob-next">Continue</Button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="onboard-body enter">
          <h1 className="title">Make it a habit</h1>
          <p className="muted">Tie the lesson to something you already do every day. People who make a plan like this are far more likely to follow through.</p>
          <div className="habit-sentence">
            <span>After</span>
            <input className="input habit-input" value={cue} onChange={(e) => setCue(e.target.value)} aria-label="After what?" data-testid="habit-cue" />
            <span>, I do my lesson.</span>
          </div>
          <div className="word-bank">
            {CUES.map((c) => (
              <button key={c} type="button" className={`word ${cue === c ? 'word-sel' : ''}`} onClick={() => setCue(c)}>
                {c}
              </button>
            ))}
          </div>
          <label className="field">
            <span className="field-label">Usually around</span>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} data-testid="habit-time" />
          </label>
          <Button
            variant="secondary"
            data-testid="ob-ics"
            onClick={() => {
              downloadIcs(cue, time);
              setIcsDone(true);
            }}
          >
            <Icon name={icsDone ? 'CheckCircle' : 'CalendarPlus'} size={20} weight="bold" /> {icsDone ? 'Reminder downloaded' : 'Add a daily calendar reminder'}
          </Button>
          <p className="muted small">A repeating event at your time. Works on any phone, no notifications needed.</p>
          <div className="onboard-foot">
            <Button onClick={next} data-testid="ob-next">Continue</Button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="onboard-body enter center">
          <Badge icon="ShieldCheck" tone="brand" size={88} />
          <h1 className="title">One promise</h1>
          <p>Tally teaches how money works in Australia. It's <strong>general information, not financial advice</strong>: it doesn't know your situation and never tells you what to buy.</p>
          <div className="onboard-foot">
            <Button onClick={finish} data-testid="ob-finish">
              Show me my path
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
