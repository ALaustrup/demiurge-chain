/**
 * A DRC-369 asset as a card (QFX layer two, first slice).
 *
 * # Why this file is in `src/qfx/`
 *
 * The card answers the pointer: it tilts towards it, and its registration marks
 * lift. `scripts/check-design.mjs` forbids pointer-following effects everywhere
 * except this directory, which is exempt from exactly two rules — the pointer
 * and the frame loop — and from nothing else. So there is no gradient here and
 * no glow: a holographic sheen is a gradient, and a gradient is still forbidden.
 * The sheen belongs to the next slice, where the one QFX canvas shows through
 * the card rather than a second canvas being started for it (ADR-051: one
 * canvas, owned by the chrome).
 *
 * # What it may not cost
 *
 * - **Readability.** Everything drawn here sits behind text the chrome owns, and
 *   `scripts/check-readability.mjs` measures every run of it as painted, on this
 *   surface, in every theme, over a hostile backdrop.
 * - **Stillness.** Reduced motion means no tilt and no transition — not a slower
 *   one. The setting is read from `data-motion`, which `applyA11y` writes, so
 *   this and the rest of the chrome cannot disagree.
 * - **The pointer.** No frame loop: the tilt is written straight to the element
 *   on the pointer's own events, so nothing schedules work when the pointer is
 *   still.
 *
 * # What is on the face
 *
 * What the chain holds, and nothing invented: the name, the content reference,
 * the commit it pins, and whether it is permanent. The sigil is drawn from the
 * fingerprint itself — the same asset always draws the same mark — so an asset
 * is recognisable before it has a preview image. When the manifest names a
 * Preview (ADR-047's role, which nothing sets yet), it takes the sigil's place.
 */

import { useEffect, useRef, useState } from 'react';
import { Lock, Maximize2, MoreHorizontal, X } from 'lucide-react';

import type { OwnedAsset } from '../lib/ipc';
import { Surface } from '../components/ui/Surface';
import { AssetMenu, type MenuAt } from './AssetMenu';
import { Sigil } from './Sigil';

/** How far the card leans towards the pointer, at the edges. */
const TILT_DEGREES = 5;

function stillnessWanted(): boolean {
  const asked = document.documentElement.dataset.motion;
  if (asked === 'reduced') return true;
  if (asked === 'full') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function short(hex: string, lead = 6, tail = 4) {
  return hex.length <= lead + tail ? hex : `${hex.slice(0, lead)}…${hex.slice(-tail)}`;
}

interface Props {
  asset: OwnedAsset;
  index: number;
  busy: boolean;
  onMakePermanent: () => void;
  onTrade: () => void;
  onSell: () => void;
}

export function AssetCard({
  asset,
  index,
  busy,
  onMakePermanent,
  onTrade,
  onSell,
}: Props) {
  const face = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const menuButton = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<MenuAt | null>(null);
  const [copied, setCopied] = useState(false);

  const id = `${asset.collection}/${asset.item}`;

  const closeMenu = () => {
    setMenu(null);
    menuButton.current?.focus();
  };

  /** The reference is what identifies this asset anywhere, so that is what is copied. */
  const share = async () => {
    const text = `${asset.current.algo} ${asset.current.root} (asset ${id})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // A webview may refuse the clipboard. Showing it beats failing silently.
      window.prompt('Copy this asset\u2019s reference', text);
    }
    closeMenu();
  };


  const lean = (event: React.PointerEvent) => {
    const node = face.current;
    if (!node || stillnessWanted()) return;
    const box = node.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    node.style.transform = `perspective(900px) rotateY(${x * TILT_DEGREES * 2}deg) rotateX(${-y * TILT_DEGREES * 2}deg) translateY(-2px)`;
  };

  const settle = () => {
    const node = face.current;
    if (node) node.style.transform = '';
  };

  return (
    <>
      <Surface
        as="article"
        cut
        className="qfx-card stagger flex min-w-0 flex-col p-5"
        style={{ '--i': index } as React.CSSProperties}
      >
        <div
          className="flex min-w-0 flex-1 flex-col"
          ref={(node) => {
            face.current = node?.parentElement ?? null;
          }}
          onPointerMove={lean}
          onPointerLeave={settle}
          onContextMenu={(event) => {
            event.preventDefault();
            setMenu({ x: event.clientX, y: event.clientY });
          }}
          data-asset={id}
        >
          <div className="flex items-baseline justify-between gap-3">
            <button
              type="button"
              ref={opener}
              className="qfx-card-open min-w-0 truncate text-left text-body font-semibold text-ink"
              onClick={() => setOpen(true)}
              aria-label={`Open ${asset.name || 'the untitled asset'}`}
              data-asset-name
            >
              {asset.name || 'Untitled'}
            </button>
            <div className="flex flex-none items-center gap-2">
              <span
                className={`eyebrow ${asset.revisable ? 'text-ink-muted' : 'text-ok'}`}
                data-asset-status
              >
                {asset.revisable ? 'Revisable' : 'Permanent'}
              </span>
              <button
                type="button"
                ref={menuButton}
                className="qfx-card-open text-ink-muted"
                aria-haspopup="menu"
                aria-expanded={menu !== null}
                aria-label={`What to do with ${asset.name || 'the untitled asset'}`}
                data-asset-more
                onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  setMenu(menu ? null : { x: box.left, y: box.bottom + 4 });
                }}
              >
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>
          <p className="numeric text-micro text-ink-faint">Asset {id}</p>

          <Sigil root={asset.current.root} className="mx-auto my-5" />

          <dl className="grid grid-cols-[5rem_1fr] items-baseline gap-x-3 gap-y-1 text-caption">
            <dt className="text-ink-muted">Reference</dt>
            <dd className="numeric min-w-0 truncate text-ink-body" data-asset-root>
              {asset.current.algo} {asset.current.root}
            </dd>
            <dt className="text-ink-muted">Commit</dt>
            <dd className="numeric min-w-0 truncate text-ink-body" data-asset-commit>
              {asset.commit ? `${asset.commit.id} (${asset.commit.kind})` : 'None'}
            </dd>
          </dl>

          {copied && (
            <p className="mt-3 text-micro text-ok" data-asset-copied>
              Reference copied
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            <button
              type="button"
              className="btn btn-ghost whitespace-nowrap"
              onClick={() => setOpen(true)}
            >
              <Maximize2 size={13} />
              Look closer
            </button>
            {asset.revisable && (
              <button
                type="button"
                className="btn whitespace-nowrap"
                onClick={onMakePermanent}
                disabled={busy}
              >
                <Lock size={13} />
                Make permanent
              </button>
            )}
          </div>
        </div>
      </Surface>

      {menu && (
        <AssetMenu
          at={menu}
          onTrade={() => {
            setMenu(null);
            onTrade();
          }}
          onSell={() => {
            setMenu(null);
            onSell();
          }}
          onShare={share}
          onClose={closeMenu}
        />
      )}

      {open && (
        <AssetCloseUp
          asset={asset}
          onClose={() => {
            setOpen(false);
            opener.current?.focus();
          }}
        />
      )}
    </>
  );
}

/**
 * The card, larger, with everything the chain holds about the asset. The place a
 * preview or a model will render when there is one; today it is the sigil at
 * size, so the surface is honest about holding no artwork yet.
 */
function AssetCloseUp({ asset, onClose }: { asset: OwnedAsset; onClose: () => void }) {
  const panel = useRef<HTMLDivElement | null>(null);
  const revised = asset.current.root !== asset.origin.root;

  useEffect(() => {
    panel.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose} data-asset-closeup>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={asset.name || 'Untitled asset'}
        tabIndex={-1}
        className="modal-panel surface cut p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <p className="heading truncate text-heading text-ink">{asset.name || 'Untitled'}</p>
            <p className="numeric text-micro text-ink-faint">
              Asset {asset.collection}/{asset.item} ·{' '}
              {asset.revisable ? 'Revisable' : 'Permanent'}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <Sigil root={asset.current.root} large className="mb-6" />

        <dl className="grid gap-x-4 gap-y-2 text-ui sm:grid-cols-[9rem_1fr]">
          <dt className="text-caption text-ink-muted">Content reference</dt>
          <dd className="min-w-0">
            <span className="numeric break-all text-ink-body">
              {asset.current.algo} {asset.current.root}
            </span>
            <span className="block text-caption text-ink-faint">
              Manifest of {asset.current.size} bytes
            </span>
          </dd>
          {revised && (
            <>
              <dt className="text-caption text-ink-muted">Minted as</dt>
              <dd className="numeric min-w-0 break-all text-ink-muted">
                {asset.origin.algo} {asset.origin.root}
              </dd>
            </>
          )}
          <dt className="text-caption text-ink-muted">Pinned commit</dt>
          <dd className="numeric min-w-0 break-all text-ink-body">
            {asset.commit ? `${asset.commit.id} (${asset.commit.kind})` : 'None'}
          </dd>
          <dt className="text-caption text-ink-muted">Short form</dt>
          <dd className="numeric min-w-0 text-ink-muted">
            {short(asset.current.root)} · {asset.commit ? short(asset.commit.id) : '—'}
          </dd>
        </dl>

        <p className="mt-6 text-caption text-ink-muted">
          No preview yet: a mint fingerprints a project's files and names none of them a preview. When
          one is named, it is shown here, and a 3D model is rendered in the backdrop's own canvas.
        </p>
      </div>
    </div>
  );
}
