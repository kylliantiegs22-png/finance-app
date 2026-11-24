import { useRef, useState } from 'react';
import { conceptBank, conceptLabels, course, lessons, conceptsOfLesson } from '../lib/content';
import { addDays, diffDays, lastNDays, weekStart } from '../logic/dates';
import { DAILY_REVIEW_CAP, dueCards, pickSession, strength, type Strength } from '../logic/leitner';
import { buildIcs } from '../logic/ics';
import { DAILY_GOALS } from '../logic/xp';
import { exportProgress, importProgress, resetProgress, setState, today, useApp } from '../lib/store';
import { play } from '../lib/fx';
import { go } from '../router';
import { Badge, Button } from '../ui/bits';
import { Icon } from '../ui/Icon';
import { StatusChips } from './Home';

function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="title">{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      <StatusChips />
    </header>
  );
}

export function ReviewTab() {
  const s = useApp((x) => x);
  const d = today();
  const doneToday = s.days[d]?.reviews ?? 0;
  const session = pickSession(s.cards, d, doneToday);
  const allDue = dueCards(s.cards, d).length;
  const total = Object.keys(s.cards).length;
  const nextDue = Object.values(s.cards)
    .map((c) => c.due)
    .filter((x) => x > d)
    .sort()[0];

  return (
    <div className="page">
      <PageHead title="Review" sub="Short, mixed practice that makes lessons stick." />
      {total === 0 ? (
        <div className="empty">
          <Badge icon="Brain" tone="brand" size={80} />
          <h2 className="h2">Nothing to review yet</h2>
          <p className="muted">Finish your first lesson and its ideas will come back here at growing gaps: 1, 3, 7, 16, 35 and 90 days.</p>
          <Button onClick={() => go('/')}>Go to your path</Button>
        </div>
      ) : session.length > 0 ? (
        <section className="review-hero">
          <div className="review-count">
            <span className="num big-num" data-testid="due-count">
              {session.length}
            </span>
            <span>due today</span>
          </div>
          <p className="muted">
            Mixed across lessons, most overdue first. Up to {DAILY_REVIEW_CAP} a day{allDue > session.length ? ` — ${allDue - session.length} more wait for tomorrow` : ''}.
          </p>
          <Button onClick={() => go('/play/review')} data-testid="start-review">
            Start review <Icon name="ArrowRight" size={20} weight="bold" />
          </Button>
        </section>
      ) : (
        <div className="empty">
          <Badge icon="SealCheck" tone="success" size={80} />
          <h2 className="h2">All caught up</h2>
          <p className="muted">{nextDue ? `Next cards are due in ${diffDays(d, nextDue)} day${diffDays(d, nextDue) > 1 ? 's' : ''}.` : 'Nothing due.'}</p>
        </div>
      )}
      {total > 0 && (
        <section className="card rescue">
          <Icon name="Hourglass" size={28} weight="duotone" />
          <div>
            <h2 className="h3">Busy day? 2-minute practice</h2>
            <p className="muted small">Five quick cards. It counts for your streak.</p>
          </div>
          <Button variant="secondary" onClick={() => go('/play/rescue')} data-testid="start-rescue">
            Go
          </Button>
        </section>
      )}
    </div>
  );
}

const STRENGTH: Record<Strength, { icon: string; label: string }> = {
  strong: { icon: 'SealCheck', label: 'Strong' },
  fading: { icon: 'Hourglass', label: 'Fading' },
  weak: { icon: 'Barbell', label: 'Needs work' },
  new: { icon: 'Lock', label: 'Not started' },
};

export function ProgressTab() {
  const s = useApp((x) => x);
  const d = today();
  const days = lastNDays(d, 66);
  const frozen = new Set(s.streak.frozenDays);
  const repaired = new Set(s.streak.repairedDays);
  const wk = weekStart(d);
  const sum = (from: string, to: string) => {
    const out = { lessons: 0, reviews: 0, minutes: 0 };
    for (const [k, v] of Object.entries(s.days)) if (k >= from && k < to) {
      out.lessons += v.lessons;
      out.reviews += v.reviews;
      out.minutes += v.seconds / 60;
    }
    return out;
  };
  const thisWeek = sum(wk, addDays(wk, 7));
  const lastWeek = sum(addDays(wk, -7), wk);
  const activeDays = days.filter((x) => (s.days[x]?.sessions ?? 0) > 0).length;

  return (
    <div className="page">
      <PageHead title="Progress" />
      <section className="card">
        <div className="card-head">
          <h2 className="h3">66-day habit</h2>
          <span className="muted small num">{activeDays} of 66 days</span>
        </div>
        <p className="muted small">Habits take about 66 days to feel automatic. A missed day is a blip, not a reset.</p>
        <div className="habit-grid" role="img" aria-label={`Habit grid: active on ${activeDays} of the last 66 days`}>
          {days.map((day) => {
            const log = s.days[day];
            const lvl = !log?.sessions ? 0 : log.xp >= s.profile.dailyGoal ? 3 : log.sessions > 1 ? 2 : 1;
            const cls = frozen.has(day) ? 'hg-frozen' : repaired.has(day) ? 'hg-repaired' : `hg-${lvl}`;
            return (
              <span key={day} className={`hg ${cls} ${day === d ? 'hg-today' : ''}`} title={day}>
                {frozen.has(day) && <Icon name="Snowflake" size={12} weight="bold" />}
              </span>
            );
          })}
        </div>
        <div className="legend small muted">
          <span><i className="hg hg-1" /> Practised</span>
          <span><i className="hg hg-3" /> Goal met</span>
          <span><i className="hg hg-frozen"><Icon name="Snowflake" size={10} weight="bold" /></i> Freeze</span>
        </div>
      </section>

      <section className="stat-row">
        <div className="mini"><Icon name="Flame" weight="fill" className="flame" size={22} /><span className="num">{s.streak.current}</span><span className="small muted">Streak</span></div>
        <div className="mini"><Icon name="Crown" weight="duotone" size={22} /><span className="num">{s.streak.longest}</span><span className="small muted">Longest</span></div>
        <div className="mini"><Icon name="Snowflake" weight="duotone" size={22} className="ice" /><span className="num">{s.streak.freezes}/2</span><span className="small muted">Freezes</span></div>
        <div className="mini"><Icon name="Lightning" weight="fill" size={22} className="gold" /><span className="num">{s.xp}</span><span className="small muted">XP</span></div>
      </section>

      <section className="card">
        <h2 className="h3">You vs last week</h2>
        <table className="vs">
          <thead>
            <tr><th scope="col"><span className="sr-only">Measure</span></th><th scope="col">This week</th><th scope="col">Last week</th></tr>
          </thead>
          <tbody>
            {(
              [
                ['Lessons', thisWeek.lessons, lastWeek.lessons],
                ['Review cards', thisWeek.reviews, lastWeek.reviews],
                ['Minutes', Math.round(thisWeek.minutes), Math.round(lastWeek.minutes)],
              ] as const
            ).map(([k, a, b]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td className="num">
                  {a} {a > b && <Icon name="TrendUp" size={16} weight="bold" className="up" aria-label="up" />}
                </td>
                <td className="num muted">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="h3">Skill map</h2>
        {course.units
          .filter((u) => u.lessons.some((l) => lessons[l.id]))
          .map((u) => (
            <div key={u.id} className="skills">
              {u.lessons.map((l) => {
                const lesson = lessons[l.id];
                if (!lesson) return null;
                return (
                  <div key={l.id} className="skill-lesson">
                    <div className="skill-lesson-title small">
                      {l.id} · {l.title}
                    </div>
                    <ul>
                      {conceptsOfLesson(lesson).filter((c) => conceptBank[c]?.lesson === l.id).map((c) => {
                        const st = strength(s.cards[c], d);
                        return (
                          <li key={c} className={`skill skill-${st}`}>
                            <Icon name={STRENGTH[st].icon} size={16} weight="fill" />
                            <span>{conceptLabels[c] ?? c}</span>
                            <span className="sr-only">: {STRENGTH[st].label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          ))}
        <div className="legend small muted">
          {(['strong', 'fading', 'weak', 'new'] as Strength[]).map((k) => (
            <span key={k} className={`skill-${k}`}>
              <Icon name={STRENGTH[k].icon} size={14} weight="fill" /> {STRENGTH[k].label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

export function downloadIcs(cue: string, time: string) {
  const ics = buildIcs({ cue, time, now: new Date(), url: location.origin + location.pathname });
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tally-daily-lesson.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function Toggle({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon: string }) {
  return (
    <label className="setting">
      <Icon name={icon} size={22} weight="duotone" />
      <span className="setting-label">{label}</span>
      <input type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function ProfileTab() {
  const s = useApp((x) => x);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (patch: Partial<typeof s.settings>) => setState((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const missions = Object.entries(s.missions);

  return (
    <div className="page">
      <PageHead title="Profile" />
      <section className="card">
        <h2 className="h3">Your habit</h2>
        <label className="field">
          <span className="field-label">After…</span>
          <input className="input" value={s.profile.cue} onChange={(e) => setState((x) => ({ ...x, profile: { ...x.profile, cue: e.target.value } }))} />
        </label>
        <label className="field">
          <span className="field-label">Around</span>
          <input className="input" type="time" value={s.profile.time} onChange={(e) => setState((x) => ({ ...x, profile: { ...x.profile, time: e.target.value } }))} />
        </label>
        <Button variant="secondary" onClick={() => downloadIcs(s.profile.cue, s.profile.time)}>
          <Icon name="CalendarPlus" size={20} weight="bold" /> Add daily reminder to calendar
        </Button>
        <div className="field">
          <span className="field-label">Daily goal</span>
          <div className="seg seg-wide" role="radiogroup" aria-label="Daily goal">
            {DAILY_GOALS.map((g) => (
              <button key={g.xp} type="button" role="radio" aria-checked={s.profile.dailyGoal === g.xp} className={`seg-btn ${s.profile.dailyGoal === g.xp ? 'seg-on' : ''}`} onClick={() => setState((x) => ({ ...x, profile: { ...x.profile, dailyGoal: g.xp } }))}>
                {g.label} · {g.xp} XP
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="h3">Settings</h2>
        <div className="field">
          <span className="field-label">Theme</span>
          <div className="seg seg-wide" role="radiogroup" aria-label="Theme">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={s.settings.theme === t} data-theme-opt={t} className={`seg-btn ${s.settings.theme === t ? 'seg-on' : ''}`} onClick={() => set({ theme: t })}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Sounds" icon={s.settings.sound ? 'SpeakerHigh' : 'SpeakerSlash'} checked={s.settings.sound} onChange={(v) => { set({ sound: v }); if (v) play('tap'); }} />
        <Toggle label="Haptics (Android)" icon="Bell" checked={s.settings.haptics} onChange={(v) => set({ haptics: v })} />
        <Toggle label="Reduce motion" icon="Sparkle" checked={s.settings.motion === 'reduced'} onChange={(v) => set({ motion: v ? 'reduced' : 'system' })} />
      </section>

      {missions.length > 0 && (
        <section className="card">
          <h2 className="h3">Real-money moves</h2>
          <ul className="missions">
            {missions.map(([id, st]) => {
              const l = lessons[id];
              const action = l?.screens.find((x) => x.kind === 'apply');
              return (
                <li key={id}>
                  <button type="button" className={`mission-row ${st === 'done' ? 'mission-row-done' : ''}`} aria-pressed={st === 'done'} onClick={() => setState((x) => ({ ...x, missions: { ...x.missions, [id]: st === 'done' ? 'planned' : 'done' } }))}>
                    <Icon name={st === 'done' ? 'CheckCircle' : 'Target'} size={22} weight={st === 'done' ? 'fill' : 'duotone'} />
                    <span>{action?.kind === 'apply' ? action.action.replace(/\*\*|\[\[|\]\]/g, '') : id}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="h3">Your data</h2>
        <p className="muted small">Progress lives only on this device. Save a backup now and then; browsers can clear site data.</p>
        <div className="stack">
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([exportProgress()], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `tally-progress-${today()}.json`;
              a.click();
            }}
          >
            <Icon name="DownloadSimple" size={20} weight="bold" /> Export progress
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="UploadSimple" size={20} weight="bold" /> Import progress
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMsg(importProgress(await f.text()) ? 'Progress imported.' : "That file isn't a Tally backup.");
            }}
          />
          {msg && <p className="small" role="status">{msg}</p>}
          {confirmReset ? (
            <div className="stack">
              <p className="small">This clears XP, streak and lessons on this device.</p>
              <Button variant="danger" onClick={() => { resetProgress(); go('/', true); }}>Yes, start over</Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>Start over</Button>
          )}
        </div>
      </section>

      <section className="card about">
        <h2 className="h3">About</h2>
        <p className="small">
          <Icon name="Info" size={16} weight="bold" /> Tally gives general information only, not financial advice. It doesn't know your situation and never recommends products.
        </p>
        <p className="small muted">
          Figures that change each year (tax, super, deposit guarantees) are kept in one dated facts file with their government source. Fonts: Plus Jakarta Sans and Inter (SIL OFL). Icons: Phosphor (MIT). Confetti: canvas-confetti (ISC). Sounds: original, CC0.
        </p>
      </section>
    </div>
  );
}
