/**
 * An information icon whose explanation appears on hover or keyboard focus.
 *
 * It replaces explanatory paragraphs, so a screen shows what it is for at a
 * glance and says more only when asked. The text stays in the document, tied to
 * the icon by `aria-describedby`, so a screen reader reads it with the icon.
 * Escape hides it.
 */

import { useId, useState } from 'react';
import { Info } from 'lucide-react';

export function InfoTip({
  text,
  side = 'right',
  className = '',
}: {
  text: string;
  /** Which way the bubble opens from the icon. */
  side?: 'right' | 'left';
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={`relative inline-flex align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label="More information"
        aria-describedby={id}
        data-infotip
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        onClick={(e) => {
          // Inside a <label>, a click would otherwise focus the field.
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full text-ink-faint transition-colors hover:text-accent focus-visible:text-accent"
      >
        <Info size={13} strokeWidth={2} />
      </span>
      <span
        id={id}
        role="tooltip"
        className={`glass-solid pointer-events-none absolute top-full z-50 mt-2 w-72 border border-edge px-3 py-2 text-left text-caption normal-case leading-relaxed tracking-normal text-ink transition-opacity duration-150 ${
          side === 'right' ? 'left-0' : 'right-0'
        } ${open ? 'opacity-100' : 'sr-only opacity-0'}`}
      >
        {text}
      </span>
    </span>
  );
}
