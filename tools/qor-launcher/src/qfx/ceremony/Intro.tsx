/**
 * The intro: a short splash each time the launcher opens, and a longer
 * first-run animation after it is installed or updated.
 *
 * - The splash is about two seconds, and any click or key skips it.
 * - The first-run animation plays the owner's own visuals when a file is in
 *   `src/assets/first-run/` (see the README there), and a longer version of the
 *   splash when there is none. It plays once per launcher version.
 * - Asking for less motion, in the launcher or the operating system, skips both.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { wantsLessMotion } from '../../lib/a11y';
import './ceremony.css';
import { useQor } from '../../state/store';

const SPLASH_MS = 2000;
const FIRST_RUN_FALLBACK_MS = 4200;
/** An image has no end of its own; this is how long one is shown. */
const FIRST_RUN_IMAGE_MS = 6000;

const firstRunMedia = Object.entries(
  import.meta.glob('../../assets/first-run/*.{webm,mp4,gif,webp,png,apng,svg}', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
).sort(([a], [b]) => a.localeCompare(b));

const SEEN = 'qor.first-run.seen';

function firstRunDue(version: string | null): boolean {
  if (!version) return false;
  try {
    return localStorage.getItem(SEEN) !== version;
  } catch {
    return false;
  }
}

function markFirstRun(version: string | null) {
  if (!version) return;
  try {
    localStorage.setItem(SEEN, version);
  } catch {
    /* it plays again next time; nothing else depends on it */
  }
}

/** Shows whichever intro is due once the launcher is ready, then gets out of the way. */
export function Intro() {
  const ready = useQor((s) => s.ready);
  const version = useQor((s) => s.version);
  const a11y = useQor((s) => s.a11y);

  // Decided once, when the launcher is ready: later setting changes do not
  // replay or cut an intro that is already over.
  const [kind, setKind] = useState<'splash' | 'first-run' | null | undefined>(undefined);
  useEffect(() => {
    if (!ready || kind !== undefined) return;
    if (wantsLessMotion(a11y)) {
      markFirstRun(version);
      setKind(null);
    } else {
      setKind(firstRunDue(version) ? 'first-run' : 'splash');
    }
  }, [ready, kind, a11y, version]);

  const end = useCallback(() => {
    if (kind === 'first-run') markFirstRun(version);
    setKind(null);
  }, [kind, version]);

  return (
    <AnimatePresence>
      {kind === 'splash' && <Splash key="splash" duration={SPLASH_MS} onDone={end} />}
      {kind === 'first-run' &&
        (firstRunMedia.length > 0 ? (
          <FirstRunMedia key="first-run" url={firstRunMedia[0]![1]} onDone={end} />
        ) : (
          <Splash key="first-run" duration={FIRST_RUN_FALLBACK_MS} welcome onDone={end} />
        ))}
    </AnimatePresence>
  );
}

/** Skip on any click or key. */
function useSkip(onDone: () => void) {
  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [onDone]);
}

function Layer({ children, onDone }: { children: React.ReactNode; onDone: () => void }) {
  useSkip(onDone);
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={onDone}
      aria-hidden="true"
      data-intro
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-void"
    >
      {children}
    </motion.div>
  );
}

function Splash({
  duration,
  welcome = false,
  onDone,
}: {
  duration: number;
  welcome?: boolean;
  onDone: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDone, duration);
    return () => clearTimeout(id);
  }, [duration, onDone]);

  // The ring's length, so it can be drawn from nothing.
  const ring = 2 * Math.PI * 38;
  const pace = duration / SPLASH_MS;
  const t = (s: number) => `${(s * pace).toFixed(2)}s`;

  return (
    <Layer onDone={onDone}>
      {/* A soft bloom behind the mark. */}
      <div
        className="absolute h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 65%)' }}
      />

      <div className="relative flex flex-col items-center">
        <svg width="150" height="150" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="var(--accent-dim)"
            strokeWidth="0.6"
            opacity="0.6"
          />
          <path
            d="M50 12 a38 38 0 1 0 26.87 64.87"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
            style={
              {
                '--ring-length': `${ring}`,
                strokeDasharray: ring,
                animation: `splash-ring ${t(1.05)} cubic-bezier(0.16,1,0.3,1) both`,
              } as React.CSSProperties
            }
          />
          <path
            d="M61 61 L84 84"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
            style={
              {
                '--ring-length': '33',
                strokeDasharray: 33,
                animation: `splash-ring ${t(0.5)} ${t(0.7)} cubic-bezier(0.16,1,0.3,1) both`,
              } as React.CSSProperties
            }
          />
          <circle
            cx="50"
            cy="50"
            r="6"
            fill="var(--accent-bright)"
            style={{
              transformOrigin: '50px 50px',
              animation: `splash-core ${t(1.2)} cubic-bezier(0.34,1.56,0.64,1) both`,
              filter: 'drop-shadow(0 0 6px var(--accent-bright))',
            }}
          />
        </svg>

        <div className="relative mt-8 overflow-hidden">
          <p
            className="heading pl-[0.5em] text-title text-ink"
            style={{ animation: `splash-word ${t(1.3)} cubic-bezier(0.16,1,0.3,1) both` }}
          >
            QOR
          </p>
          <span
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ animation: `splash-sweep ${t(0.7)} ${t(1.2)} ease-in-out both` }}
          />
        </div>

        {welcome && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 0.8 }}
            className="eyebrow mt-6 text-accent-bright"
          >
            Installed. Welcome to the Nexus.
          </motion.p>
        )}
      </div>
    </Layer>
  );
}

function FirstRunMedia({ url, onDone }: { url: string; onDone: () => void }) {
  const video = useMemo(() => /\.(webm|mp4)(\?|$)/i.test(url), [url]);

  useEffect(() => {
    if (video) return;
    const id = setTimeout(onDone, FIRST_RUN_IMAGE_MS);
    return () => clearTimeout(id);
  }, [video, onDone]);

  return (
    <Layer onDone={onDone}>
      {video ? (
        <video
          src={url}
          autoPlay
          muted
          playsInline
          onEnded={onDone}
          onError={onDone}
          className="h-full w-full object-cover"
        />
      ) : (
        <img src={url} alt="" onError={onDone} className="max-h-full max-w-full object-contain" />
      )}
    </Layer>
  );
}
