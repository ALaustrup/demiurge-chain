/**
 * Projects: Qontrol's first surface.
 *
 * # What this view is allowed to know
 *
 * Nothing it was not told by the repository on disk. Every list here — the
 * changes, the history, the branches — comes from a `qontrol_read` that ran
 * after the last thing that could have altered it. The view keeps no running
 * picture of the repository and never adjusts one optimistically.
 *
 * That is not caution for its own sake. A version-control interface that shows
 * what it believes rather than what is there is the failure that matters: the
 * creator sees a commit that did not happen, or a clean tree that is not clean,
 * and finds out much later. So after a commit the surface throws away what it
 * had and draws what came back.
 *
 * # Diffs (P1.1)
 *
 * Choosing a change asks the host for that one file's diff, and draws what came
 * back. The host reads both sides as git does — line endings and
 * `.gitattributes` first — so a file whose only difference is a conversion says
 * so instead of showing every line rewritten. The view never computes a diff of
 * its own, and throws away the one it holds whenever the project is redrawn.
 *
 * # The git layer (P1.2)
 *
 * Each change has a box that says whether it goes into the next commit; all are
 * ticked until the person unticks one. A commit first asks the host's guard
 * what it would hold that needs a yes — a file over 50 MiB, anything shaped
 * like a credential — and shows that list before anything is staged. "Commit
 * anyway" sends the yes back; the host runs the guard again and does not take
 * the view's word for it.
 *
 * Discarding puts a modified or removed file back as it was last committed. It
 * asks first, in the view, because the change is lost. A new file is never
 * offered a discard: that would be deleting it.
 *
 * Switching branches is offered on every branch that is not the current one. The
 * host refuses, touching nothing, when an uncommitted change would be
 * overwritten, and the refusal is shown as it came.
 *
 * # Minting (M4.1)
 *
 * The Mint panel sends a project path and an account, nothing else. The host
 * reads the commit HEAD points at, fingerprints its files, builds the manifest
 * and its reference (ADR-047), draws the approval dialog and signs; the view
 * only shows the commit it will pin, by its full hash, and what came back.
 */

import { useCallback, useRef, useState } from 'react';
import { FolderGit2, GitBranch, GitCommitHorizontal, Loader2, Plus, Stamp, Undo2 } from 'lucide-react';

import {
  assets,
  explain,
  qontrol,
  type FileDiff,
  type GuardWarning,
  type MintReceipt,
  type QontrolProject,
  type ScaffoldKind,
} from '../lib/ipc';
import { selectActiveAccount, useQor } from '../state/store';
import { Field, Panel, ViewHeader } from './parts';

const SCAFFOLDS: { kind: ScaffoldKind; label: string; note: string }[] = [
  { kind: 'code', label: 'Code', note: 'src, tests, docs. Build output ignored.' },
  { kind: 'music', label: 'Music', note: 'sessions, stems, samples. Renders ignored.' },
  { kind: 'game', label: 'Game', note: 'scenes, assets, scripts. Builds ignored.' },
];

function when(seconds: number) {
  if (!seconds) return '';
  const date = new Date(seconds * 1000);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function bytes(n: number | null) {
  if (n === null) return 'none';
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const MARK = { add: '+', remove: '−', context: ' ' } as const;
// The line's text stays in ink on every row: colour marks the row, the sign
// says what it is to the eye and `<ins>` / `<del>` to assistive technology, and
// no reading depends on green or red. The strike-through `<del>` draws by
// default is removed: a struck line is harder to read, and it is read to see
// what was there.
const ROW = {
  add: 'border-l-2 border-ok bg-ok/10',
  remove: 'border-l-2 border-bad bg-bad/10',
  context: 'border-l-2 border-transparent',
} as const;

/** One file's diff, exactly as the host returned it. */
function DiffPanel({ diff }: { diff: FileDiff }) {
  const { body } = diff;
  return (
    <div className="mb-5" data-diff={diff.path}>
      <p className="mb-2 text-caption text-ink-muted">
        <span className="numeric text-ink">{diff.path}</span>
        {diff.from ? (
          <>
            {' '}moved from <span className="numeric">{diff.from}</span>
          </>
        ) : null}
      </p>
      {body.kind === 'text' && (
        <div className="overflow-x-auto border border-edge bg-well" aria-label={`Changes in ${diff.path}`} role="group">
          {body.lines.map((line, i) =>
            line.kind === 'hunk' ? (
              <p key={i} className="numeric border-y border-edge-soft px-3 py-1 text-caption text-ink-muted" data-diff-hunk>
                {line.text}
              </p>
            ) : (
              <p
                key={i}
                className={`numeric flex gap-3 whitespace-pre px-3 text-caption text-ink ${ROW[line.kind]}`}
                data-diff-line={line.kind}
              >
                <span className="w-8 flex-none text-right text-ink-muted" aria-hidden="true">{line.old ?? ''}</span>
                <span className="w-8 flex-none text-right text-ink-muted" aria-hidden="true">{line.new ?? ''}</span>
                <span className="w-3 flex-none text-ink-muted" aria-hidden="true">{MARK[line.kind]}</span>
                {line.kind === 'add' ? (
                  <ins className="no-underline">{line.text}</ins>
                ) : line.kind === 'remove' ? (
                  <del className="no-underline">{line.text}</del>
                ) : (
                  <span>{line.text}</span>
                )}
              </p>
            ),
          )}
          {body.truncated && (
            <p className="border-t border-edge-soft px-3 py-2 text-caption text-ink-muted" data-diff-truncated>
              Cut short here: the rest of this file&apos;s changes are too long to show.
            </p>
          )}
        </div>
      )}
      {body.kind === 'binary' && (
        <p className="text-ui text-ink-muted" data-diff-binary>
          Not shown as lines: git treats this file as binary. Before: {bytes(body.old_size)}. Now:{' '}
          {bytes(body.new_size)}.
        </p>
      )}
      {body.kind === 'same' && (
        <p className="text-ui text-ink-muted" data-diff-same>
          No difference in content once it is read as git reads it. The usual reason is line endings
          this project converts, or a change to the file&apos;s permissions.
        </p>
      )}
      {body.kind === 'empty' && (
        <p className="text-ui text-ink-muted" data-diff-empty>
          An empty file: there are no lines to show.
        </p>
      )}
      {body.kind === 'not_a_file' && (
        <p className="text-ui text-ink-muted" data-diff-not-a-file>
          {body.reason}
        </p>
      )}
    </div>
  );
}

export function Projects() {
  const notify = useQor((s) => s.notify);
  const account = useQor(selectActiveAccount);

  const [project, setProject] = useState<QontrolProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<ScaffoldKind>('code');
  const [minted, setMinted] = useState<MintReceipt | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState<FileDiff | null>(null);
  // The path whose diff is wanted now. An answer for any other path arrived
  // after the person moved on, and is dropped rather than drawn.
  const wanted = useRef<string | null>(null);
  // Changes left out of the next commit. Kept as what is excluded, so a change
  // that appears later is included until someone says otherwise.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  // What the guard held back from the commit being attempted, if anything.
  const [held, setHeld] = useState<GuardWarning[] | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [branchName, setBranchName] = useState('');

  const run = useCallback(
    async (what: () => Promise<QontrolProject | null>, done?: string) => {
      setBusy(true);
      try {
        const next = await what();
        if (next) {
          setProject(next);
          setMinted(null);
          // A diff belongs to the tree it was read from, and this is a new one.
          wanted.current = null;
          setSelected(null);
          setFileDiff(null);
          setHeld(null);
          setConfirmDiscard(false);
          // Only exclusions that still name a change mean anything.
          setExcluded((was) => new Set([...was].filter((p) => next.changes.some((c) => c.path === p))));
          if (done) notify('ok', done);
        }
      } catch (e) {
        notify('bad', explain(e));
      } finally {
        setBusy(false);
      }
    },
    [notify],
  );

  const openFolder = () =>
    run(async () => {
      const picked = await qontrol.pickFolder();
      if (!picked) return null;
      return qontrol.open(picked);
    });

  const createProject = () =>
    run(async () => {
      const parent = await qontrol.pickFolder();
      if (!parent) return null;
      const made = await qontrol.create(parent, newName, newKind);
      setCreating(false);
      setNewName('');
      return made;
    }, 'Project created.');

  const included = project ? project.changes.filter((c) => !excluded.has(c.path)) : [];
  // Everything, when nothing is left out: the host then stages as `git add -A`
  // would, which is what "commit" meant before per-file commits existed.
  const chosen = () =>
    project && included.length < project.changes.length ? included.map((c) => c.path) : undefined;

  const toggle = (path: string) =>
    setExcluded((was) => {
      const next = new Set(was);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  // Ask the guard first. Nothing held back: commit. Something held back: show
  // it and wait for the person, before anything is staged.
  const commit = async () => {
    if (!project) return;
    setBusy(true);
    let warnings: GuardWarning[];
    try {
      warnings = await qontrol.check(project.path, chosen());
    } catch (e) {
      notify('bad', explain(e));
      setBusy(false);
      return;
    }
    setBusy(false);
    if (warnings.length > 0) {
      setHeld(warnings);
      return;
    }
    await commitNow([]);
  };

  const commitNow = (accepted: GuardWarning[]) =>
    run(async () => {
      if (!project) return null;
      const next = await qontrol.commit(
        project.path,
        message,
        chosen(),
        accepted.map(({ path, concern }) => ({ path, concern })),
      );
      setMessage('');
      return next;
    }, 'Committed.');

  const discard = (path: string) =>
    run(async () => (project ? qontrol.discard(project.path, [path]) : null), `${path} is back as it was last committed.`);

  const newBranch = () =>
    run(async () => {
      if (!project) return null;
      const name = branchName.trim();
      const next = await qontrol.branch(project.path, name);
      setBranchName('');
      return next;
    }, 'Branch made. Switch to it when you want to work there.');

  const switchTo = (name: string) =>
    run(async () => (project ? qontrol.switchTo(project.path, name) : null), `Now on ${name}.`);

  const showDiff = async (path: string) => {
    if (!project) return;
    if (selected === path) {
      wanted.current = null;
      setSelected(null);
      setFileDiff(null);
      return;
    }
    wanted.current = path;
    setSelected(path);
    setFileDiff(null);
    setConfirmDiscard(false);
    try {
      const diffs = await qontrol.diff(project.path, path);
      if (wanted.current !== path) return;
      // Nothing back means the file stopped differing after the list was read.
      setFileDiff(
        diffs.find((d) => d.path === path) ?? { path, state: '', from: null, body: { kind: 'same' } },
      );
    } catch (e) {
      if (wanted.current !== path) return;
      notify('bad', explain(e));
      wanted.current = null;
      setSelected(null);
    }
  };

  const mint = async () => {
    if (!project || !account) return;
    setBusy(true);
    try {
      const receipt = await assets.mint(project.path, account.address);
      setMinted(receipt);
      notify('ok', `Minted "${receipt.name}". It is in your Inventory.`);
    } catch (e) {
      notify('bad', explain(e));
    } finally {
      setBusy(false);
    }
  };

  const head = project?.history[0] ?? null;

  return (
    <div className="flex h-full flex-col">
      <ViewHeader
        eyebrow="Qontrol"
        title="Projects"
        body="Version your work on this machine. Nothing leaves it, and no account is needed beyond this launcher."
        action={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setCreating((c) => !c)} disabled={busy}>
              <Plus className="size-4" aria-hidden="true" />
              New
            </button>
            <button type="button" className="btn btn-primary" onClick={openFolder} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FolderGit2 className="size-4" aria-hidden="true" />}
              Open a folder
            </button>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {creating && (
          <Panel className="mb-6 p-6">
            <p className="eyebrow mb-4">A new project</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" hint="One folder, created inside the folder you choose next.">
                <input
                  className="field"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="my-project"
                />
              </Field>
              <Field label="Kind" hint="Decides the folders and what is ignored.">
                <div className="flex gap-2">
                  {SCAFFOLDS.map((s) => (
                    <button
                      key={s.kind}
                      type="button"
                      className={newKind === s.kind ? 'btn btn-primary' : 'btn btn-ghost'}
                      onClick={() => setNewKind(s.kind)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <p className="mt-3 text-caption text-ink-muted">
              {SCAFFOLDS.find((s) => s.kind === newKind)?.note}
            </p>
            <button type="button" className="btn btn-primary mt-4" onClick={createProject} disabled={busy || !newName.trim()}>
              Choose a folder and create
            </button>
          </Panel>
        )}

        {!project && !creating && (
          <Panel className="p-8">
            <p className="heading mb-2 text-heading">No project open</p>
            <p className="max-w-xl text-ui leading-relaxed text-ink-muted">
              Open a folder to see its history and what has changed. If the folder is not yet a
              repository, Qontrol makes it one. Everything stays on this machine.
            </p>
          </Panel>
        )}

        {project && (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="min-w-0 space-y-6">
              <Panel className="p-6">
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <p className="heading text-heading">{project.name}</p>
                  <p className="text-caption text-ink-muted">{project.path}</p>
                </div>

                {!project.can_commit && (
                  <p className="mb-4 text-caption text-ink-muted">
                    The staging helper is not available, so committing is off. Build it with{' '}
                    <span className="numeric">cargo build</span> in{' '}
                    <span className="numeric">tools/qor-launcher/qontrol-git</span>.
                  </p>
                )}

                <p className="eyebrow mb-3">
                  {project.changes.length === 0
                    ? 'Nothing has changed'
                    : `${project.changes.length} changed`}
                </p>

                {project.changes.length > 0 && (
                  <>
                    <p className="mb-2 text-caption text-ink-muted">
                      Choose a change to see what changed inside it. Untick one to leave it out of
                      the next commit.
                    </p>
                    <ul className="mb-5 space-y-1">
                      {project.changes.map((c) => (
                        <li key={c.path} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="size-4 flex-none accent-accent"
                            checked={!excluded.has(c.path)}
                            onChange={() => toggle(c.path)}
                            aria-label={`Include ${c.path} in the next commit`}
                            data-include={c.path}
                            disabled={busy}
                          />
                          <button
                            type="button"
                            className={`flex w-full items-baseline gap-3 px-1 text-left text-ui hover:bg-raised ${
                              selected === c.path ? 'bg-raised' : ''
                            }`}
                            aria-pressed={selected === c.path}
                            onClick={() => showDiff(c.path)}
                            data-change={c.path}
                          >
                            <span className="w-20 flex-none text-caption text-ink-muted">{c.state}</span>
                            <span className="numeric min-w-0 truncate text-ink">{c.path}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {selected && !fileDiff && (
                  <p className="mb-5 flex items-center gap-2 text-caption text-ink-muted" role="status">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Reading {selected}
                  </p>
                )}
                {fileDiff && <DiffPanel diff={fileDiff} />}

                {fileDiff &&
                  project.can_commit &&
                  ['modified', 'removed'].includes(
                    project.changes.find((c) => c.path === fileDiff.path)?.state ?? '',
                  ) &&
                  (confirmDiscard ? (
                    <div className="mb-5 border border-edge bg-well p-4" role="alertdialog" aria-label="Discard this change" data-discard-confirm>
                      <p className="mb-3 text-ui text-ink">
                        Put <span className="numeric">{fileDiff.path}</span> back as it was last
                        committed? The change shown above is lost, and there is no undo.
                      </p>
                      <div className="flex gap-2">
                        <button type="button" className="btn btn-primary" onClick={() => discard(fileDiff.path)} disabled={busy}>
                          Discard the change
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setConfirmDiscard(false)} disabled={busy}>
                          Keep it
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost mb-5"
                      onClick={() => setConfirmDiscard(true)}
                      disabled={busy}
                      data-discard={fileDiff.path}
                    >
                      <Undo2 className="size-4" aria-hidden="true" />
                      Discard this change
                    </button>
                  ))}

                {held ? (
                  <div className="border border-edge bg-well p-4" role="alertdialog" aria-label="Before this is committed" data-held>
                    <p className="heading mb-2 text-ui text-ink">Before this is committed</p>
                    <p className="mb-3 text-ui leading-relaxed text-ink-muted">
                      A commit stays in the history for good, in every copy anyone makes of this
                      project. Look at these first.
                    </p>
                    <ul className="mb-4 space-y-1">
                      {held.map((w) => (
                        <li key={`${w.concern}:${w.path}`} className="flex items-baseline gap-3 text-ui" data-held-file={w.path}>
                          <span className="numeric min-w-0 truncate text-ink">{w.path}</span>
                          <span className="flex-none text-caption text-ink-muted">
                            {w.concern === 'large' ? `large, ${w.reason}` : w.reason}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mb-4 text-caption text-ink-muted">
                      To leave a file out, go back and untick it, or add it to the project&apos;s
                      .gitignore.
                    </p>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-ghost" onClick={() => setHeld(null)} disabled={busy}>
                        Go back
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => commitNow(held)} disabled={busy}>
                        Commit anyway
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Field label="Commit message" hint="What changed, and why. It is written into the history.">
                      <input
                        className="field"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="What did you change?"
                        disabled={!project.can_commit}
                      />
                    </Field>
                    <button
                      type="button"
                      className="btn btn-primary mt-4"
                      onClick={commit}
                      disabled={busy || !message.trim() || included.length === 0 || !project.can_commit}
                    >
                      <GitCommitHorizontal className="size-4" aria-hidden="true" />
                      {included.length === project.changes.length
                        ? 'Commit'
                        : `Commit ${included.length} of ${project.changes.length}`}
                    </button>
                  </>
                )}
              </Panel>

              <Panel className="p-6">
                <p className="eyebrow mb-3">History</p>
                {project.history.length === 0 ? (
                  <p className="text-ui text-ink-muted">
                    No commits yet. The first one is the one above.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {project.history.map((c) => (
                      <li key={c.id} className="flex items-baseline gap-3">
                        <span className="numeric w-16 flex-none text-caption text-ink-muted">{c.short}</span>
                        <span className="min-w-0 flex-1 truncate text-ui text-ink">{c.summary}</span>
                        <span className="flex-none text-caption text-ink-muted">{when(c.time)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <Panel className="h-fit p-6">
              <p className="eyebrow mb-3">Branches</p>
              {project.branches.length === 0 ? (
                <p className="text-ui text-ink-muted">None yet. A branch appears with the first commit.</p>
              ) : (
                <ul className="space-y-2">
                  {project.branches.map((b) => (
                    <li key={b.name} className="flex items-center gap-2 text-ui" data-branch={b.name}>
                      <GitBranch className="size-4 flex-none text-ink-muted" aria-hidden="true" />
                      <span className={`min-w-0 flex-1 truncate ${b.head ? 'text-ink' : 'text-ink-muted'}`}>{b.name}</span>
                      {b.head ? (
                        <span className="flex-none text-caption text-ink-muted">on this one</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost flex-none"
                          onClick={() => switchTo(b.name)}
                          disabled={busy || !project.can_commit}
                          aria-label={`Switch to ${b.name}`}
                          data-switch={b.name}
                        >
                          Switch
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {head && (
                <div className="mt-4">
                  <Field label="New branch" hint="Made at the latest commit. Your changes stay where they are.">
                    <input
                      className="field"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="a-new-idea"
                      disabled={!project.can_commit}
                      data-branch-name
                    />
                  </Field>
                  <button
                    type="button"
                    className="btn btn-ghost mt-2"
                    onClick={newBranch}
                    disabled={busy || !branchName.trim() || !project.can_commit}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Make the branch
                  </button>
                </div>
              )}

              <p className="eyebrow mb-3 mt-8">Mint</p>
              {!head ? (
                <p className="text-ui text-ink-muted">
                  Nothing to mint yet. A mint pins a commit, and this project has none.
                </p>
              ) : project.changes.length > 0 ? (
                <p className="text-ui text-ink-muted">
                  Commit first. A mint pins a commit, so what is not committed would not be in the
                  asset.
                </p>
              ) : (
                <>
                  <p className="mb-3 text-ui leading-relaxed text-ink-muted">
                    Mint this commit as a DRC-369 asset. It is pinned by its hash, never by a
                    branch, and can be revised until you make it permanent.
                  </p>
                  <p className="text-caption text-ink-muted">
                    Commit{project.branch ? `, on ${project.branch}` : ''}
                  </p>
                  <p className="numeric mb-4 break-all text-caption text-ink" data-mint-commit>
                    {head.id}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={mint}
                    disabled={busy || !account}
                  >
                    <Stamp className="size-4" aria-hidden="true" />
                    Mint this commit
                  </button>
                </>
              )}
              {minted && (
                <p className="mt-4 text-caption text-ink-muted" role="status">
                  Minted as asset {minted.collection}/{minted.item}, in the finalised block{' '}
                  <span className="numeric break-all text-ink">{minted.block_hash}</span>. It is in
                  your Inventory.
                </p>
              )}
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
