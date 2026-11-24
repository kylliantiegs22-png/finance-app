import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes, type Ref } from 'react';
import { Icon } from './Icon';
import { reducedMotion } from '../lib/fx';

export function Button({ variant = 'primary', className = '', children, ref, ...p }: { variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'reward'; ref?: Ref<HTMLButtonElement> } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" ref={ref} className={`btn btn-${variant} ${className}`} {...p}>
      {children}
    </button>
  );
}

export function Chip({ icon, value, label, tone, onClick }: { icon: string; value: ReactNode; label: string; tone: 'streak' | 'xp' | 'freeze' | 'goal' | 'frozen'; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`chip chip-${tone}`} aria-label={`${label}: ${typeof value === 'number' ? value : ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <Icon name={icon} weight="fill" size={20} className="chip-icon" />
      <span className="num">{value}</span>
    </Tag>
  );
}

/** Animated number that counts up when it changes (tabular digits). */
export function CountUp({ value, duration = 900, delay = 0, prefix = '', suffix = '' }: { value: number; duration?: number; delay?: number; prefix?: string; suffix?: string }) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reducedMotion()) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now() + delay;
    const a = from.current;
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - start) / duration));
      const e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (value - a) * e));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);
  return (
    <span className="num">
      {prefix}
      {shown.toLocaleString('en-AU')}
      {suffix}
    </span>
  );
}

/** Lesson progress bar: transform-only fill with a shine sweep on change. */
export function ProgressBar({ value, tone = 'growth', label }: { value: number; tone?: 'growth' | 'reward'; label: string }) {
  const pct = Math.max(0, Math.min(1, value));
  const [shine, setShine] = useState(0);
  const prev = useRef(pct);
  useEffect(() => {
    if (pct > prev.current) setShine((s) => s + 1);
    prev.current = pct;
  }, [pct]);
  return (
    <div className={`pbar pbar-${tone}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
      <div className="pbar-fill" style={{ transform: `scaleX(${pct})` }}>
        <span key={shine} className="pbar-shine" />
      </div>
    </div>
  );
}

/** Daily goal ring (SVG). */
export function Ring({ value, size = 76, stroke = 8, children, id = 'ring' }: { value: number; size?: number; stroke?: number; children?: ReactNode; id?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className={`ring ${pct >= 1 ? 'ring-done' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#10B981" />
            <stop offset="1" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-inner">{children}</div>
    </div>
  );
}

export function Badge({ icon, tone = 'brand', size = 64 }: { icon: string; tone?: 'brand' | 'reward' | 'success' | 'locked'; size?: number }) {
  return (
    <div className={`badge badge-${tone}`} style={{ width: size, height: size }}>
      <Icon name={icon} weight="duotone" size={Math.round(size * 0.56)} />
    </div>
  );
}

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
          <Icon name="X" size={24} />
        </button>
      ) : (
        <span />
      )}
      {title && <h1 className="topbar-title">{title}</h1>}
      <div className="topbar-right">{right}</div>
    </header>
  );
}
