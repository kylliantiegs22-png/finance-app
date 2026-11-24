import { useMemo, useState } from 'react';
import type { Question } from '../content/schema';
import { type Answer, fmtNum, seededShuffle } from '../lib/grade';
import { play } from '../lib/fx';
import { Icon } from './Icon';
import { RichText } from './RichText';
import { Visual } from './Visual';

interface Props {
  q: Question;
  a: Answer;
  set: (a: Answer) => void;
  revealed: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const tap = () => play('tap', 0.35);

export function QuestionView({ q, a, set, revealed }: Props) {
  return (
    <div className="question">
      <h2 className="q-prompt" id={`q-${q.id}`}>
        <RichText text={q.prompt} />
      </h2>
      {q.visual && q.qtype !== 'tap' && <Visual v={q.visual} />}
      <Body q={q} a={a} set={set} revealed={revealed} />
    </div>
  );
}

function Body({ q, a, set, revealed }: Props) {
  switch (q.qtype) {
    case 'mcq':
      return <Choice q={q} options={q.options.map((o) => o.text)} answer={q.answer} a={a as Extract<Answer, { qtype: 'mcq' }>} set={set} revealed={revealed} />;
    case 'blank':
      return <Blank q={q} a={a as Extract<Answer, { qtype: 'blank' }>} set={set} revealed={revealed} />;
    case 'truefalse':
      return <TrueFalse q={q} a={a as Extract<Answer, { qtype: 'truefalse' }>} set={set} revealed={revealed} />;
    case 'numeric':
      return <Numeric q={q} a={a as Extract<Answer, { qtype: 'numeric' }>} set={set} revealed={revealed} />;
    case 'slider':
      return <Slider q={q} a={a as Extract<Answer, { qtype: 'slider' }>} set={set} revealed={revealed} />;
    case 'match':
      return <Match q={q} a={a as Extract<Answer, { qtype: 'match' }>} set={set} revealed={revealed} />;
    case 'order':
      return <Order q={q} a={a as Extract<Answer, { qtype: 'order' }>} set={set} revealed={revealed} />;
    case 'sort':
      return <Sort q={q} a={a as Extract<Answer, { qtype: 'sort' }>} set={set} revealed={revealed} />;
    case 'tap':
      return (
        <>
          <p className="q-help">Tap the line on the {q.visual?.type === 'payslip' ? 'payslip' : q.visual?.type === 'statement' ? 'statement' : 'list'}.</p>
          {q.visual && (
            <Visual
              v={q.visual}
              tap={{
                onTap: (i) => {
                  tap();
                  set({ qtype: 'tap', v: i });
                },
                selected: (a as { v: number | null }).v,
                reveal: revealed ? { answer: q.answer, picked: (a as { v: number | null }).v } : null,
              }}
            />
          )}
        </>
      );
  }
}

function optClass(i: number, picked: number | null, answer: number, revealed: boolean) {
  let c = 'opt';
  if (revealed) {
    if (i === answer) c += ' opt-right';
    else if (i === picked) c += ' opt-wrong';
    else c += ' opt-dim';
  } else if (picked === i) c += ' opt-sel';
  return c;
}

function Choice({ q, options, answer, a, set, revealed }: { q: Question; options: string[]; answer: number; a: { qtype: 'mcq'; v: number | null }; set: (a: Answer) => void; revealed: boolean }) {
  const order = useMemo(() => seededShuffle(options.map((_, i) => i), q.id), [q.id, options]);
  return (
    <div className="opts" role="radiogroup" aria-labelledby={`q-${q.id}`}>
      {order.map((i, k) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={a.v === i}
          data-opt={i}
          disabled={revealed}
          className={optClass(i, a.v, answer, revealed)}
          onClick={() => {
            tap();
            set({ qtype: 'mcq', v: i });
          }}
        >
          <span className="opt-key" aria-hidden="true">
            {revealed && i === answer ? <Icon name="Check" weight="bold" size={16} /> : revealed && i === a.v ? <Icon name="X" weight="bold" size={16} /> : LETTERS[k]}
          </span>
          <span className="opt-text">
            <RichText text={options[i]} />
          </span>
        </button>
      ))}
    </div>
  );
}

function Blank({ q, a, set, revealed }: { q: Extract<Question, { qtype: 'blank' }>; a: { qtype: 'blank'; v: number | null }; set: (a: Answer) => void; revealed: boolean }) {
  const [before, after] = q.sentence.split('___');
  const order = useMemo(() => seededShuffle(q.options.map((_, i) => i), q.id), [q]);
  const filled = a.v !== null ? q.options[a.v] : null;
  return (
    <>
      <p className="blank-sentence">
        <RichText text={before} />
        <span className={`blank-slot ${filled ? 'filled' : ''} ${revealed ? (a.v === q.answer ? 'right' : 'wrong') : ''}`}>{filled ?? ' '}</span>
        <RichText text={after} />
      </p>
      <div className="word-bank" role="radiogroup" aria-label="Word bank">
        {order.map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={a.v === i}
            data-opt={i}
            disabled={revealed}
            className={`word ${a.v === i ? 'word-sel' : ''} ${revealed && i === q.answer ? 'word-right' : ''}`}
            onClick={() => {
              tap();
              set({ qtype: 'blank', v: i });
            }}
          >
            {q.options[i]}
          </button>
        ))}
      </div>
    </>
  );
}

function TrueFalse({ q, a, set, revealed }: { q: Extract<Question, { qtype: 'truefalse' }>; a: { qtype: 'truefalse'; v: boolean | null }; set: (a: Answer) => void; revealed: boolean }) {
  return (
    <div className="tf" role="radiogroup" aria-labelledby={`q-${q.id}`}>
      {[true, false].map((val) => {
        const idx = val ? 0 : 1;
        const ans = q.answer ? 0 : 1;
        const picked = a.v === null ? null : a.v ? 0 : 1;
        return (
          <button
            key={String(val)}
            type="button"
            role="radio"
            aria-checked={a.v === val}
            data-opt={String(val)}
            disabled={revealed}
            className={`${optClass(idx, picked, ans, revealed)} tf-opt`}
            onClick={() => {
              tap();
              set({ qtype: 'truefalse', v: val });
            }}
          >
            <Icon name={val ? 'CheckCircle' : 'XCircle'} size={28} weight="duotone" />
            <span>{val ? 'True' : 'False'}</span>
          </button>
        );
      })}
    </div>
  );
}

function Numeric({ q, a, set, revealed }: { q: Extract<Question, { qtype: 'numeric' }>; a: { qtype: 'numeric'; v: string }; set: (a: Answer) => void; revealed: boolean }) {
  return (
    <label className={`numin ${revealed ? 'numin-done' : ''}`}>
      <span className="sr-only">Your answer</span>
      {q.prefix && <span className="numin-affix num">{q.prefix}</span>}
      <input
        className="num"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        placeholder="0"
        value={a.v}
        disabled={revealed}
        data-testid="numeric-input"
        onChange={(e) => set({ qtype: 'numeric', v: e.target.value.replace(/[^0-9.,-]/g, '') })}
      />
      {q.suffix && <span className="numin-affix num">{q.suffix}</span>}
    </label>
  );
}

function Slider({ q, a, set, revealed }: { q: Extract<Question, { qtype: 'slider' }>; a: { qtype: 'slider'; v: number | null }; set: (a: Answer) => void; revealed: boolean }) {
  const v = a.v ?? q.min + Math.round((q.max - q.min) / 2 / q.step) * q.step;
  const pct = ((v - q.min) / (q.max - q.min)) * 100;
  return (
    <div className="slider">
      <div className="slider-value num" aria-live="polite">
        {a.v === null ? <span className="slider-placeholder">Drag the slider to guess</span> : fmtNum(v, q.prefix, q.suffix)}
      </div>
      <input
        type="range"
        min={q.min}
        max={q.max}
        step={q.step}
        value={v}
        disabled={revealed}
        aria-label="Your estimate"
        data-testid="slider-input"
        style={{ ['--pct' as string]: `${pct}%` }}
        onChange={(e) => set({ qtype: 'slider', v: Number(e.target.value) })}
      />
      <div className="slider-ends num">
        <span>{fmtNum(q.min, q.prefix, q.suffix)}</span>
        <span>{fmtNum(q.max, q.prefix, q.suffix)}</span>
      </div>
    </div>
  );
}

const PAIR_TONES = 4;
function Match({ q, a, set, revealed }: { q: Extract<Question, { qtype: 'match' }>; a: { qtype: 'match'; v: Record<number, number> }; set: (a: Answer) => void; revealed: boolean }) {
  const [left, setLeft] = useState<number | null>(null);
  const rights = useMemo(() => seededShuffle(q.pairs.map((_, i) => i), q.id), [q]);
  const pairOfRight = (r: number) => Object.entries(a.v).find(([, rv]) => rv === r)?.[0];
  const toneOfLeft = (l: number) => Object.keys(a.v).map(Number).sort().indexOf(l) % PAIR_TONES;

  function pickRight(r: number) {
    if (left === null) return;
    const next = { ...a.v };
    for (const k of Object.keys(next)) if (next[+k] === r) delete next[+k];
    next[left] = r;
    tap();
    set({ qtype: 'match', v: next });
    setLeft(null);
  }
  return (
    <div className="match">
      <p className="q-help">Tap a term, then its match.</p>
      <div className="match-cols">
        <div className="match-col">
          {q.pairs.map((p, i) => {
            const paired = a.v[i] !== undefined;
            const ok = revealed && a.v[i] === i;
            return (
              <button
                key={i}
                type="button"
                data-left={i}
                disabled={revealed}
                aria-pressed={left === i}
                className={`mcell ${left === i ? 'mcell-sel' : ''} ${paired ? `mcell-paired pair-${toneOfLeft(i)}` : ''} ${revealed ? (ok ? 'mcell-right' : 'mcell-wrong') : ''}`}
                onClick={() => {
                  tap();
                  if (paired && left !== i) {
                    const next = { ...a.v };
                    delete next[i];
                    set({ qtype: 'match', v: next });
                  }
                  setLeft(left === i ? null : i);
                }}
              >
                {p[0]}
              </button>
            );
          })}
        </div>
        <div className="match-col">
          {rights.map((r) => {
            const l = pairOfRight(r);
            const ok = revealed && l !== undefined && +l === r;
            return (
              <button
                key={r}
                type="button"
                data-right={r}
                disabled={revealed}
                className={`mcell ${l !== undefined ? `mcell-paired pair-${toneOfLeft(+l)}` : ''} ${revealed ? (ok ? 'mcell-right' : 'mcell-wrong') : ''}`}
                onClick={() => pickRight(r)}
              >
                {q.pairs[r][1]}
              </button>
            );
          })}
        </div>
      </div>
      {revealed && (
        <ul className="match-key">
          {q.pairs.map((p, i) => (
            <li key={i}>
              <strong>{p[0]}</strong> → {p[1]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Order({ q, a, set, revealed }: { q: Extract<Question, { qtype: 'order' }>; a: { qtype: 'order'; v: number[] }; set: (a: Answer) => void; revealed: boolean }) {
  const pool = useMemo(() => seededShuffle(q.items.map((_, i) => i), q.id), [q]);
  return (
    <div className="order">
      <ol className="order-placed" aria-label="Your order">
        {q.items.map((_, slot) => {
          const item = a.v[slot];
          return (
            <li key={slot} className={`oslot ${item !== undefined ? 'oslot-filled' : ''} ${revealed ? (item === slot ? 'oslot-right' : 'oslot-wrong') : ''}`}>
              <span className="oslot-n num">{slot + 1}</span>
              {item !== undefined ? (
                <button type="button" disabled={revealed} className="oslot-item" onClick={() => set({ qtype: 'order', v: a.v.filter((x) => x !== item) })}>
                  {q.items[item]}
                </button>
              ) : (
                <span className="oslot-empty">Tap a step below</span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="word-bank">
        {pool.map((i) => (
          <button
            key={i}
            type="button"
            data-item={i}
            disabled={revealed || a.v.includes(i)}
            className={`word ${a.v.includes(i) ? 'word-used' : ''}`}
            onClick={() => {
              tap();
              set({ qtype: 'order', v: [...a.v, i] });
            }}
          >
            {q.items[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Sort({ q, a, set, revealed }: { q: Extract<Question, { qtype: 'sort' }>; a: { qtype: 'sort'; v: Record<number, 0 | 1> }; set: (a: Answer) => void; revealed: boolean }) {
  return (
    <ul className="sort">
      {q.items.map((it, i) => {
        const picked = a.v[i];
        const ok = revealed ? picked === it.bucket : null;
        return (
          <li key={i} className={`sort-row ${ok === true ? 'sort-right' : ok === false ? 'sort-wrong' : ''}`}>
            <span className="sort-text">
              {ok !== null && <Icon name={ok ? 'CheckCircle' : 'XCircle'} weight="fill" size={18} className="sort-mark" />}
              {it.text}
            </span>
            <span className="seg" role="radiogroup" aria-label={it.text}>
              {q.buckets.map((b, bi) => (
                <button
                  key={bi}
                  type="button"
                  role="radio"
                  aria-checked={picked === bi}
                  data-sort={`${i}-${bi}`}
                  disabled={revealed}
                  className={`seg-btn ${picked === bi ? 'seg-on' : ''} ${revealed && it.bucket === bi ? 'seg-answer' : ''}`}
                  onClick={() => {
                    tap();
                    set({ qtype: 'sort', v: { ...a.v, [i]: bi as 0 | 1 } });
                  }}
                >
                  {b}
                </button>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
