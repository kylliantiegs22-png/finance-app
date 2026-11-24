import { useState } from 'react';
import { tokenize } from '../content/text';
import { facts, glossary } from '../lib/content';

/** Renders lesson markup: **bold**, [[glossary term]] (tap to define), {{fact}}. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const toks = tokenize(text, facts);
  return (
    <span className={className}>
      {toks.map((t, i) =>
        t.t === 'text' ? (
          <span key={i}>{t.v}</span>
        ) : t.t === 'bold' ? (
          <strong key={i}>{t.v}</strong>
        ) : (
          <span key={i} className="term-wrap">
            <button type="button" className="term" aria-expanded={open === t.key + i} onClick={() => setOpen(open === t.key + i ? null : t.key + i)}>
              {t.v}
            </button>
            {open === t.key + i && (
              <span role="tooltip" className="term-pop" onClick={() => setOpen(null)}>
                <strong>{t.v}</strong> {glossary[t.key]}
              </span>
            )}
          </span>
        ),
      )}
    </span>
  );
}
