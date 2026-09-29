/**
 * Creating a listing for an asset (L4.6).
 *
 * # It publishes nothing, and says so before anything else
 *
 * There is no marketplace. A listing every account can see needs the royalty
 * pallet (M4.2), a priced transfer, and an indexer to serve what is listed
 * (ADR-028, M5.4), and none of them exists. What this saves is the creator's own
 * draft, on their own machine (`listings.rs`). The banner at the top of the form
 * says that in the product, not only in a comment, because a form that looks
 * like it published something is worse than no form.
 *
 * # The questions come from the host
 *
 * The categories, and the questions each one asks, are a table in
 * `src-tauri/src/listings.rs`. This view renders whatever that table says and
 * keeps no vocabulary of its own, so "choosing Gaming reveals the gaming
 * questions" is one table in one place rather than two that can disagree.
 *
 * # The price
 *
 * The creator's own number, in CGT, checked by the host exactly: excess
 * precision is refused rather than rounded, and no float touches it. What a
 * platform might take from a sale is undecided (U-15) and appears nowhere.
 */

import { useEffect, useMemo, useState } from 'react';
import { Info, Store, Trash2, X } from 'lucide-react';

import { listings as listingsApi, type Listing, type ListingCategory } from '../lib/ipc';
import type { OwnedAsset } from '../lib/ipc';
import { Sigil } from '../qfx/Sigil';

/** The host's limits, repeated only to count characters while typing. */
const TITLE_LIMIT = 30;
const NOTES_LIMIT = 600;

interface Props {
  asset: OwnedAsset;
  onClose: () => void;
  onSaved: (listing: Listing) => void;
}

export function SellDialog({ asset, onClose, onSaved }: Props) {
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [title, setTitle] = useState(asset.name || '');
  const [category, setCategory] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [existing, setExisting] = useState<Listing | null>(null);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const chosen = useMemo(
    () => categories.find((one) => one.id === category) ?? null,
    [categories, category],
  );

  useEffect(() => {
    void listingsApi
      .vocabulary()
      .then(setCategories)
      .catch(() => setCategories([]));
    void listingsApi
      .drafts()
      .then((drafts) => {
        const mine = drafts.find(
          (draft) => draft.collection === asset.collection && draft.item === asset.item,
        );
        if (!mine) return;
        setExisting(mine);
        setTitle(mine.title);
        setCategory(mine.category);
        setAnswers(Object.fromEntries(mine.details.map((detail) => [detail.field, detail.value])));
        setPrice(mine.price_cgt);
        setNotes(mine.notes);
      })
      .catch(() => undefined);
  }, [asset.collection, asset.item]);

  const answer = (field: string, value: string) =>
    setAnswers((was) => ({ ...was, [field]: was[field] === value ? '' : value }));

  const save = async () => {
    setBusy(true);
    setRefusal(null);
    try {
      const listing = await listingsApi.save({
        collection: asset.collection,
        item: asset.item,
        title,
        category,
        details: Object.entries(answers)
          .filter(([, value]) => value.trim().length > 0)
          .map(([field, value]) => ({ field, value })),
        price_cgt: price,
        notes,
      });
      setExisting(listing);
      setSaved(true);
      onSaved(listing);
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    setBusy(true);
    try {
      await listingsApi.discard(asset.collection, asset.item);
      onClose();
    } catch (error) {
      setRefusal(error instanceof Error ? error.message : String(error));
      setBusy(false);
    }
  };

  const ready = title.trim().length > 0 && category !== '' && price.trim().length > 0;

  return (
    <div className="modal" data-sell-dialog onClick={busy ? undefined : onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create a listing"
        className="modal-panel surface cut p-7"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !busy) onClose();
        }}
      >
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Sell</p>
            <p className="heading text-heading text-ink">
              {existing ? 'Your draft listing' : 'Create a listing'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Said first, in the product, and not only in a comment. */}
        <div className="mb-5 flex items-start gap-2 border border-edge p-3" data-sell-unpublished>
          <Info size={14} className="mt-0.5 flex-none text-ink-faint" />
          <p className="text-caption text-ink-body">
            <span className="text-ink">Nothing here is published.</span> There is no marketplace
            yet: a listing every account can see needs the royalty pallet (M4.2) and an indexer
            (M5.4). This draft is saved on this machine only, and goes nowhere until Market exists.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[13rem_1fr]">
          {/* The asset, as a container beside its details. */}
          <section className="trade-side" data-sell-asset>
            <p className="eyebrow text-ink-muted">What you are listing</p>
            <Sigil root={asset.current.root} className="mx-auto my-4" />
            <p className="truncate text-body font-semibold text-ink">{asset.name || 'Untitled'}</p>
            <p className="numeric text-micro text-ink-faint">
              Asset {asset.collection}/{asset.item} · {asset.revisable ? 'Revisable' : 'Permanent'}
            </p>
            <p className="numeric mt-2 break-all text-micro text-ink-muted">
              {asset.current.algo} {asset.current.root.slice(0, 16)}…
            </p>
            {asset.revisable && (
              <p className="mt-3 text-micro text-ink-faint">
                This asset can still be revised. A buyer sees whatever it points at then, not what
                it points at now.
              </p>
            )}
          </section>

          <section className="min-w-0">
            <label className="block text-caption text-ink-muted" htmlFor="sell-title">
              Title
            </label>
            <input
              id="sell-title"
              className="field mt-1"
              value={title}
              maxLength={TITLE_LIMIT}
              onChange={(event) => setTitle(event.target.value)}
              data-sell-title
            />
            <p className="mt-1 text-micro text-ink-faint">
              {title.length} of {TITLE_LIMIT} characters
            </p>

            <p className="mt-4 text-caption text-ink-muted">What kind of thing is it?</p>
            <div className="mt-2 flex flex-wrap gap-2" data-sell-categories>
              {categories.map((one) => (
                <button
                  key={one.id}
                  type="button"
                  className={`btn whitespace-nowrap ${category === one.id ? 'btn-primary' : ''}`}
                  aria-pressed={category === one.id}
                  onClick={() => {
                    setCategory(one.id);
                    setAnswers({});
                  }}
                  data-sell-category={one.id}
                >
                  {one.name}
                </button>
              ))}
            </div>

            {chosen?.note && (
              <p className="mt-3 border border-edge p-3 text-caption text-ink-body" data-sell-note>
                {chosen.note}
              </p>
            )}

            {/* Whatever the chosen category asks, and nothing this view invents. */}
            {chosen && (
              <div className="mt-4 space-y-4" data-sell-fields>
                {chosen.fields.map((field) => (
                  <div key={field.id} data-sell-field={field.id}>
                    <p className="text-caption text-ink-muted">{field.label}</p>
                    {field.options.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {field.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`btn whitespace-nowrap ${
                              answers[field.id] === option ? 'btn-primary' : 'btn-ghost'
                            }`}
                            aria-pressed={answers[field.id] === option}
                            onClick={() => answer(field.id, option)}
                            data-sell-option={`${field.id}:${option}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        className="field mt-1"
                        value={answers[field.id] ?? ''}
                        onChange={(event) => answer(field.id, event.target.value)}
                        data-sell-answer={field.id}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <label className="mt-5 block text-caption text-ink-muted" htmlFor="sell-price">
              Price, in CGT
            </label>
            <input
              id="sell-price"
              className="field numeric mt-1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="0.00"
              spellCheck={false}
              data-sell-price
            />
            <p className="mt-1 text-micro text-ink-faint">
              Your own number. Nothing here suggests one, and nothing takes a share of it — what a
              platform would take is undecided.
            </p>

            <label className="mt-5 block text-caption text-ink-muted" htmlFor="sell-notes">
              Description (optional)
            </label>
            <textarea
              id="sell-notes"
              className="field mt-1"
              rows={3}
              value={notes}
              maxLength={NOTES_LIMIT}
              onChange={(event) => setNotes(event.target.value)}
              data-sell-notes
            />
            <p className="mt-1 text-micro text-ink-faint">
              {notes.length} of {NOTES_LIMIT} characters
            </p>
          </section>
        </div>

        {refusal && (
          <p className="mt-4 text-caption text-bad" data-sell-refusal>
            {refusal}
          </p>
        )}
        {saved && !refusal && (
          <p className="mt-4 text-caption text-ok" data-sell-saved>
            Saved on this machine. It is not published anywhere.
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-primary whitespace-nowrap"
            disabled={!ready || busy}
            onClick={() => void save()}
            data-sell-save
          >
            <Store size={13} />
            {existing ? 'Save changes' : 'Save this draft'}
          </button>
          {existing && (
            <button
              type="button"
              className="btn btn-ghost whitespace-nowrap"
              onClick={() => void discard()}
              disabled={busy}
              data-sell-discard
            >
              <Trash2 size={13} />
              Delete draft
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
