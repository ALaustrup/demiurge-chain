/**
 * The last line of defence against a blank window.
 *
 * # Why this exists
 *
 * A React tree that throws during render unmounts completely, and in a frameless
 * dark-themed desktop app the result is an unbroken black rectangle. No message,
 * no console the user can open, nothing to report. It is the worst failure mode
 * the launcher has, because it is simultaneously total and silent.
 *
 * That happened: a store selector returned a freshly built object on every call,
 * which `useSyncExternalStore` treats as state that never settles, so React threw
 * during the render of the shell and the window went black immediately after a
 * successful unlock. The vault was fine, the chain was fine, the session was
 * fine, and none of that was visible.
 *
 * This boundary turns that class of failure into something a person can act on
 * and a developer can be handed: what broke, where, and a way back.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, Copy, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  stack: string | null;
}

export class Boundary extends Component<Props, State> {
  state: State = { error: null, stack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ stack: info.componentStack ?? null });

    // Mirror it into the host log, which survives the window being closed.
    void import('@tauri-apps/api/core')
      .then(({ invoke }) =>
        invoke('log_diagnostic', {
          message: `UI CRASH: ${error.message}\n${info.componentStack ?? ''}`,
        }),
      )
      .catch(() => {
        /* diagnostics must never throw from inside the crash handler */
      });
  }

  private report() {
    const { error, stack } = this.state;
    const text = [
      `QOR Launcher UI crash`,
      `message: ${error?.message ?? 'unknown'}`,
      ``,
      error?.stack ?? '',
      ``,
      `component stack:${stack ?? ' unavailable'}`,
    ].join('\n');

    void navigator.clipboard.writeText(text);
  }

  render() {
    const { error, stack } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-full w-full items-center justify-center bg-base p-8">
        <div className="glass-solid cut w-[560px] p-8">
          <div className="mb-5 flex items-start gap-3">
            <AlertOctagon size={18} className="mt-0.5 flex-none text-bad" />
            <div className="min-w-0 flex-1">
              <h1 className="heading mb-1 text-title">
                The interface stopped
              </h1>
              <p className="text-ui leading-relaxed text-ink-muted">
                Your vault and your keys are unaffected. This is a rendering fault,
                not a loss of data.
              </p>
            </div>
          </div>

          <pre className="selectable mb-5 max-h-56 overflow-auto border border-edge bg-well p-3 text-caption leading-relaxed text-ink-body">
            {error.message}
            {stack ? `\n${stack.split('\n').slice(0, 12).join('\n')}` : ''}
          </pre>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={() => window.location.reload()}
            >
              <RotateCw size={13} />
              Reload
            </button>
            <button type="button" className="btn" onClick={() => this.report()}>
              <Copy size={13} />
              Copy details
            </button>
          </div>
        </div>
      </div>
    );
  }
}
