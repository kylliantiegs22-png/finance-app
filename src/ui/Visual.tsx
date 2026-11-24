import type { Visual as V } from '../content/schema';
import { Icon } from './Icon';
import { RichText } from './RichText';
import { resolveFacts } from '../content/text';
import { facts } from '../lib/content';

const rf = (t: string) => resolveFacts(t, facts);

const aud = (n: number, cents = false) =>
  (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });

export interface TapProps {
  onTap?: (i: number) => void;
  selected?: number | null;
  /** After checking: which row is right and whether the pick was right. */
  reveal?: { answer: number; picked: number | null } | null;
}

/** One-line text description for screen readers. */
function describe(v: V): string {
  switch (v.type) {
    case 'ledger':
      return `${v.title ?? 'List'}: ${v.rows.map((r) => `${r.label} ${aud(r.amount)}`).join(', ')}${v.total ? `. ${v.total.label} ${aud(v.total.amount)}` : ''}`;
    case 'payslip':
      return `Payslip from ${v.employer}, ${v.period}: ${v.rows.map((r) => `${r.label} ${aud(r.amount)}`).join(', ')}. Net pay ${aud(v.net)}`;
    case 'statement':
      return `${v.title}: ${v.rows.map((r) => `${r.date} ${r.desc} ${aud(r.amount, true)}`).join(', ')}`;
    case 'split':
      return `${v.title ?? 'Split'}: ${v.segments.map((s) => `${s.label} ${s.pct}%`).join(', ')}`;
    case 'stat':
      return `${rf(v.value)} ${rf(v.label)}`;
    case 'compare':
      return v.items.map((i) => `${i.title}: ${i.points.join('; ')}`).join('. ');
    case 'steps':
      return v.lines.join('. ');
    case 'icon':
      return v.caption ?? '';
  }
}

function rowClass(i: number, t?: TapProps) {
  if (!t?.onTap && !t?.reveal) return 'vrow';
  let c = 'vrow vrow-tap';
  if (t.reveal) {
    if (i === t.reveal.answer) c += ' vrow-right';
    else if (i === t.reveal.picked) c += ' vrow-wrong';
  } else if (t.selected === i) c += ' vrow-sel';
  return c;
}

function Row({ i, t, children }: { i: number; t?: TapProps; children: React.ReactNode }) {
  if (t?.onTap || t?.reveal)
    return (
      <button type="button" className={rowClass(i, t)} data-row={i} aria-pressed={t.selected === i} disabled={!!t.reveal} onClick={() => t.onTap?.(i)}>
        {children}
      </button>
    );
  return <div className="vrow">{children}</div>;
}

export function Visual({ v, tap }: { v: V; tap?: TapProps }) {
  const label = describe(v);
  switch (v.type) {
    case 'ledger':
      return (
        <figure className="vis vis-ledger" aria-label={label}>
          {v.title && <figcaption className="vis-title">{v.title}</figcaption>}
          {v.rows.map((r, i) => (
            <Row key={i} i={i} t={tap}>
              <span className={`dot dot-${r.tone ?? 'neutral'}`} aria-hidden="true" />
              <span className="vrow-label">
                {r.label}
                {r.note && <small>{r.note}</small>}
              </span>
              <span className={`num vrow-amt amt-${r.tone ?? 'neutral'}`}>{r.tone === 'debt' || r.tone === 'cost' ? '−' + aud(Math.abs(r.amount)).replace('−', '') : aud(r.amount)}</span>
            </Row>
          ))}
          {v.total && (
            <div className="vrow vrow-total">
              <span className="vrow-label">{v.total.label}</span>
              <span className="num vrow-amt">{aud(v.total.amount)}</span>
            </div>
          )}
        </figure>
      );
    case 'payslip':
      return (
        <figure className="vis vis-payslip" aria-label={label}>
          <div className="payslip-head">
            <div>
              <div className="vis-title">{v.employer}</div>
              <div className="vis-sub">{v.period}</div>
            </div>
            <Icon name="Receipt" size={24} weight="duotone" />
          </div>
          {v.rows.map((r, i) => (
            <Row key={i} i={i} t={tap}>
              <span className="vrow-label">{r.label}</span>
              <span className={`num vrow-amt ${r.kind === 'deduct' ? 'amt-cost' : r.kind === 'info' ? 'amt-info' : ''}`}>
                {r.kind === 'deduct' ? '−' : ''}
                {aud(r.amount, true)}
              </span>
            </Row>
          ))}
          <div className="vrow vrow-total">
            <span className="vrow-label">Net pay</span>
            <span className="num vrow-amt">{aud(v.net, true)}</span>
          </div>
        </figure>
      );
    case 'statement':
      return (
        <figure className="vis vis-statement" aria-label={label}>
          <div className="payslip-head">
            <div className="vis-title">{v.title}</div>
            <Icon name="Bank" size={24} weight="duotone" />
          </div>
          {v.rows.map((r, i) => (
            <Row key={i} i={i} t={tap}>
              <span className="stmt-date">{r.date}</span>
              <span className="vrow-label">{r.desc}</span>
              <span className={`num vrow-amt ${r.amount < 0 ? '' : 'amt-income'}`}>{r.amount > 0 ? '+' : ''}{aud(r.amount, true)}</span>
            </Row>
          ))}
        </figure>
      );
    case 'split':
      return (
        <figure className="vis vis-split" aria-label={label}>
          {v.title && <figcaption className="vis-title">{v.title}</figcaption>}
          <div className="split-bar" aria-hidden="true">
            {v.segments.map((s, i) => (
              <span key={i} className={`split-seg seg-${i}`} style={{ flexGrow: s.pct }} />
            ))}
          </div>
          <ul className="split-legend">
            {v.segments.map((s, i) => (
              <li key={i}>
                <span className={`dot seg-${i}`} aria-hidden="true" />
                <span className="vrow-label">{s.label}</span>
                <span className="num">{s.pct}%</span>
                {s.amount !== undefined && <span className="num split-amt">{aud(s.amount)}</span>}
              </li>
            ))}
          </ul>
        </figure>
      );
    case 'steps':
      return (
        <ol className="vis vis-steps" aria-label={label}>
          {v.lines.map((l, i) => (
            <li key={i}>
              <span className="step-n num" aria-hidden="true">
                {i + 1}
              </span>
              <RichText text={l} />
            </li>
          ))}
        </ol>
      );
    case 'stat':
      return (
        <figure className="vis vis-stat" aria-label={label}>
          <div className="stat-value num">{rf(v.value)}</div>
          <div className="stat-label">{rf(v.label)}</div>
        </figure>
      );
    case 'compare':
      return (
        <div className={`vis vis-compare cols-${v.items.length}`} aria-label={label} role="group">
          {v.items.map((it, i) => (
            <div key={i} className="cmp-card">
              {it.icon && <Icon name={it.icon} size={28} weight="duotone" className="cmp-icon" />}
              <div className="cmp-title">{it.title}</div>
              <ul>
                {it.points.map((p, j) => (
                  <li key={j}>
                    <RichText text={p} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case 'icon':
      return (
        <figure className="vis vis-icon" aria-label={label}>
          <div className="hero-icon">
            <Icon name={v.name} size={56} weight="duotone" />
          </div>
          {v.caption && <figcaption className="vis-sub">{v.caption}</figcaption>}
        </figure>
      );
  }
}
