import { useCallback, useEffect, useRef, useState } from 'react';
import { Backspace } from '@phosphor-icons/react';
import { answerValue, evaluate, formatResult } from '../lib/calc';
import { haptic } from '../lib/fx';
import { Button } from './bits';
import { Icon } from './Icon';
import { useModal } from './useModal';
import '../styles/calculator.css';

type Key = { k: string; label: string; aria: string; kind?: 'op' | 'fn' | 'eq'; wide?: boolean };

const KEYS: Key[] = [
  { k: 'C', label: 'C', aria: 'Clear', kind: 'fn' },
  { k: 'back', label: '⌫', aria: 'Delete', kind: 'fn' },
  { k: '%', label: '%', aria: 'Percent', kind: 'fn' },
  { k: '÷', label: '÷', aria: 'Divide', kind: 'op' },
  { k: '7', label: '7', aria: '7' },
  { k: '8', label: '8', aria: '8' },
  { k: '9', label: '9', aria: '9' },
  { k: '×', label: '×', aria: 'Times', kind: 'op' },
  { k: '4', label: '4', aria: '4' },
  { k: '5', label: '5', aria: '5' },
  { k: '6', label: '6', aria: '6' },
  { k: '−', label: '−', aria: 'Minus', kind: 'op' },
  { k: '1', label: '1', aria: '1' },
  { k: '2', label: '2', aria: '2' },
  { k: '3', label: '3', aria: '3' },
  { k: '+', label: '+', aria: 'Plus', kind: 'op' },
  { k: '0', label: '0', aria: '0', wide: true },
  { k: '.', label: '.', aria: 'Point' },
  { k: '=', label: '=', aria: 'Equals', kind: 'eq' },
];

const OPS = ['+', '−', '×', '÷'];
const KEYBOARD: Record<string, string> = { '*': '×', x: '×', '/': '÷', '-': '−', '+': '+', '%': '%', '.': '.', ',': '.', Enter: '=', '=': '=', Backspace: 'back', Delete: 'C', c: 'C', C: 'C' };

/**
 * Pop-up calculator for maths questions. Stays mounted for the whole session so a
 * sum survives closing and reopening; only the sheet is shown or hidden.
 */
export function Calculator({ open, onClose, onUse }: { open: boolean; onClose: () => void; onUse?: (value: string) => void }) {
  const [expr, setExpr] = useState('');
  const [done, setDone] = useState(false); // true right after "=", so the next digit starts a new sum
  const ref = useRef<HTMLDivElement>(null);
  useModal(ref, open, onClose);

  const value = evaluate(expr);
  const hasOp = OPS.some((o) => expr.slice(1).includes(o)) || expr.includes('%');

  const press = useCallback(
    (k: string) => {
      haptic(5);
      setExpr((e) => {
        const last = e.slice(-1);
        if (k === 'C') return '';
        if (k === 'back') return done ? '' : e.slice(0, -1);
        if (k === '=') {
          const v = evaluate(e);
          return v === null ? e : String(v);
        }
        if (OPS.includes(k)) {
          if (e === '' && k !== '−') return e;
          if (OPS.includes(last)) return e.slice(0, -1) + k; // swap the operator instead of stacking two
          return e + k;
        }
        if (k === '%') return e === '' || OPS.includes(last) || last === '%' ? e : e + k;
        if (k === '.') {
          const seg = e.split(/[+−×÷]/).pop() ?? '';
          if (done) return '0.';
          if (seg.includes('.')) return e;
          return e + (seg === '' ? '0.' : '.');
        }
        // digit
        if (done) return k;
        if (last === '%') return e;
        return e.length >= 40 ? e : e + k;
      });
      setDone(k === '=');
    },
    [done],
  );

  // Physical keyboard: digits, + − × ÷, Enter, Backspace.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = /^[0-9]$/.test(e.key) ? e.key : KEYBOARD[e.key];
      if (!k) return;
      // Enter on a focused key or the "use" button presses that button; anywhere else (even on Close) it means "=".
      if (e.key === 'Enter' && (e.target as HTMLElement)?.closest?.('.calc-key, [data-testid="calc-use"]')) return;
      e.preventDefault();
      press(k);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, press]);

  if (!open) return null;
  const showPreview = hasOp && value !== null && !done;

  return (
    <div className="scrim calc-scrim" onClick={onClose}>
      <div ref={ref} className="sheet calc-sheet" role="dialog" aria-modal="true" aria-labelledby="calc-title" onClick={(e) => e.stopPropagation()} data-testid="calculator">
        <div className="calc-head">
          <h2 className="sheet-title" id="calc-title">
            <Icon name="Calculator" size={22} weight="duotone" /> Calculator
          </h2>
          <button type="button" className="icon-btn" aria-label="Close calculator" onClick={onClose}>
            <Icon name="X" size={22} />
          </button>
        </div>

        <div className="calc-display num" data-testid="calc-display">
          <div className="calc-expr" aria-label="Sum">
            {expr || '0'}
          </div>
          <div className="calc-result" aria-live="polite" data-testid="calc-result">
            {showPreview ? `= ${formatResult(value!)}` : ' '}
          </div>
        </div>

        <div className="calc-keys">
          {KEYS.map((key) => (
            <button
              key={key.k}
              type="button"
              className={`calc-key num ${key.kind ? `calc-${key.kind}` : ''} ${key.wide ? 'calc-wide' : ''}`}
              aria-label={key.aria}
              data-key={key.k}
              onClick={() => press(key.k)}
            >
              {key.k === 'back' ? <Backspace aria-hidden="true" size={22} weight="bold" /> : key.label}
            </button>
          ))}
        </div>

        {onUse && (
          <Button
            variant="success"
            disabled={value === null}
            data-testid="calc-use"
            onClick={() => {
              if (value === null) return;
              onUse(answerValue(value));
              onClose();
            }}
          >
            <Icon name="Check" size={20} weight="bold" /> Use {value !== null ? formatResult(Math.round(value * 100) / 100) : 'this'} as my answer
          </Button>
        )}
      </div>
    </div>
  );
}
