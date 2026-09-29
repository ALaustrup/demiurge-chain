/**
 * Release gates: progress towards Alpha, Beta and Public Release (roadmap L2.2).
 *
 * The host computes everything from `docs/GATES.toml` and the signals it names.
 * This view adds nothing to that: no estimate, no weighting, no percentage. A
 * gate shows its raw counts, and a bar only when the host sends one, which it
 * does only when no unit in the gate is unmeasurable.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Play, RefreshCw } from 'lucide-react';

import {
  explain,
  gates,
  type GateCriterion,
  type GateReport,
  type GatesReport,
  type SuiteView,
  type UnitState,
} from '../lib/ipc';
import { useQor } from '../state/store';
import { Panel, ViewHeader } from './parts';

/** How often the open view re-reads. The host caches CI and service readings. */
const POLL_MS = 30_000;

const STATE_TEXT: Record<UnitState, string> = {
  met: 'Met',
  not_met: 'Not met',
  unmeasurable: 'Unmeasurable',
};

const STATE_DOT: Record<UnitState, string> = {
  met: 'dot-ok',
  not_met: 'dot-warn',
  unmeasurable: 'bg-ink-faint',
};

export function GatesView() {
  const notify = useQor((s) => s.notify);

  const [report, setReport] = useState<GatesReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    try {
      setReport(await gates.report(refresh));
      setError(null);
    } catch (e) {
      setError(explain(e));
    }
  }, []);

  useEffect(() => {
    void load(false);
    const id = setInterval(() => void load(false), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const run = async (suite: SuiteView) => {
    setStarting(suite.id);
    try {
      const result = await gates.runSuite(suite.id);
      const clean = result.exit_code === 0 && result.failed.length === 0;
      notify(
        clean ? 'ok' : 'bad',
        clean
          ? `Suite ${suite.id}: ${result.passed.length} tests passed.`
          : `Suite ${suite.id} did not pass. Its output is under Suites.`,
      );
    } catch (e) {
      notify('bad', explain(e));
    } finally {
      setStarting(null);
      await load(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <ViewHeader
        eyebrow="Development"
        title="Release gates"
        body="Progress towards Alpha, Beta and Public Release, computed only from the signals docs/GATES.toml defines. Nothing is estimated or weighted. A bar appears only when every unit in a gate can be measured."
        action={
          <button
            type="button"
            className="btn"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            {refreshing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Refresh
          </button>
        }
      />

      {error && (
        <div className="px-8 pt-6">
          <p className="selectable border-l-2 border-bad bg-bad/5 px-4 py-3 text-ui text-bad">
            {error}
          </p>
        </div>
      )}

      {!report && !error && (
        <p className="px-8 py-6 text-ui text-ink-muted">Reading docs/GATES.toml…</p>
      )}

      {report && (
        <>
          <div className="px-8 pt-6">
            <p className="numeric selectable text-caption text-ink-muted">
              {report.repo ?? '—'}
              {report.status && (
                <>
                  {' · '}
                  {report.status}
                  {report.accepted && ` ${report.accepted}`}
                </>
              )}
            </p>
          </div>

          {report.problems.length > 0 && (
            <div className="px-8 pt-4">
              <div className="border-l-2 border-bad bg-bad/5 px-4 py-3">
                {report.problems.map((problem) => (
                  <p key={problem} className="selectable text-ui text-bad">
                    {problem}
                  </p>
                ))}
              </div>
            </div>
          )}

          {report.gates.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 px-8 pt-6">
              {report.gates.map((gate) => (
                <GateSummary key={gate.id} gate={gate} />
              ))}
            </div>
          )}

          {report.suites.length > 0 && (
            <section className="px-8 pt-8">
              <h2 className="eyebrow mb-3 text-accent">Suites</h2>
              <Panel className="p-0">
                <ul>
                  {report.suites.map((suite) => (
                    <SuiteRow
                      key={suite.id}
                      suite={suite}
                      starting={starting === suite.id}
                      onRun={() => void run(suite)}
                    />
                  ))}
                </ul>
              </Panel>
            </section>
          )}

          {report.gates.map((gate) => (
            <section key={gate.id} className="px-8 pt-8 last:pb-8">
              <h2 className="heading mb-1 text-title">{gate.name}</h2>
              <p className="mb-4 max-w-2xl text-ui leading-relaxed text-ink-muted">{gate.means}</p>
              <Panel className="p-0">
                <ul>
                  {gate.criteria.map((criterion) => (
                    <CriterionRow key={criterion.id} criterion={criterion} />
                  ))}
                </ul>
              </Panel>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function GateSummary({ gate }: { gate: GateReport }) {
  return (
    <Panel className="p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="eyebrow">{gate.name}</p>
        <p className={`eyebrow text-micro ${gate.passed ? 'text-ok' : 'text-ink-faint'}`}>
          {gate.passed ? 'Passed' : 'Not passed'}
        </p>
      </div>

      <dl className="mb-3 grid grid-cols-3 gap-2">
        <Count label="Met" value={gate.met} />
        <Count label="Not met" value={gate.not_met} />
        <Count label="Unmeasurable" value={gate.unmeasurable} />
      </dl>

      {gate.bar ? (
        <div
          className="rail"
          role="progressbar"
          aria-label={`${gate.name}: ${gate.bar.met} of ${gate.bar.total} units met`}
          aria-valuemin={0}
          aria-valuemax={gate.bar.total}
          aria-valuenow={gate.bar.met}
        >
          <div className="rail-fill" style={{ width: `${(gate.bar.met / gate.bar.total) * 100}%` }} />
        </div>
      ) : (
        <p className="text-caption text-ink-faint">
          No bar while any unit cannot be measured.
        </p>
      )}
    </Panel>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="eyebrow mb-1 text-micro">{label}</dt>
      <dd className="numeric text-title text-ink">{value}</dd>
    </div>
  );
}

function CriterionRow({ criterion }: { criterion: GateCriterion }) {
  return (
    <li className="border-b border-edge px-4 py-3 last:border-b-0">
      <div className="mb-1 flex items-baseline gap-3">
        <span className="numeric text-ui text-ink">{criterion.id}</span>
        <span className="eyebrow text-micro text-ink-faint">{criterion.kind}</span>
      </div>
      {criterion.says && (
        <p className="mb-2 max-w-3xl text-ui leading-relaxed text-ink-body">{criterion.says}</p>
      )}
      <ul className="space-y-1.5">
        {criterion.units.map((unit, i) => (
          <li key={`${unit.label}-${i}`} className="flex items-start gap-2.5">
            <span className={`dot mt-[5px] ${STATE_DOT[unit.state]}`} aria-hidden="true" />
            <span className="w-24 flex-none text-caption text-ink-muted">
              {STATE_TEXT[unit.state]}
            </span>
            <span className="min-w-0 flex-1 text-caption leading-relaxed">
              <span className="numeric text-ink-body">{unit.label}</span>
              {unit.asserted && (
                <span className="eyebrow ml-2 text-micro text-accent">Asserted</span>
              )}
              <span className="selectable block text-ink-faint">{unit.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

function SuiteRow({
  suite,
  starting,
  onRun,
}: {
  suite: SuiteView;
  starting: boolean;
  onRun: () => void;
}) {
  const last = suite.last_run;
  const busy = starting || suite.running;
  const clean = last ? last.exit_code === 0 && last.failed.length === 0 : false;

  return (
    <li className="border-b border-edge px-4 py-3 last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 flex items-baseline gap-3">
            <span className="numeric text-ui text-ink">{suite.id}</span>
            <span className="numeric truncate text-caption text-ink-muted">
              {suite.dir || 'no directory yet'} · {suite.command}
            </span>
          </p>
          {suite.needs && <p className="text-caption text-ink-faint">Needs {suite.needs}</p>}
          <p className={`text-caption ${last && !clean ? 'text-bad' : 'text-ink-muted'}`}>
            {last
              ? `Last run ${last.finished_at}${last.commit ? ` on ${last.commit}` : ''}: exit ${
                  last.exit_code ?? '—'
                }, ${last.passed.length} passed, ${last.failed.length} failed`
              : 'Never run'}
          </p>
        </div>
        <button
          type="button"
          className="btn flex-none"
          disabled={busy || !suite.dir.trim()}
          onClick={onRun}
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          {busy ? 'Running' : 'Run'}
        </button>
      </div>

      {last && last.output_tail && (
        <details className="mt-2">
          <summary className="cursor-pointer text-caption text-ink-muted">Output</summary>
          <pre className="numeric selectable mt-2 max-h-72 overflow-auto bg-well p-3 text-micro text-ink-body">
            {last.output_tail}
          </pre>
        </details>
      )}
    </li>
  );
}
