import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  /** Section number (1-indexed) for the fallback label. */
  index: number;
  /** Human-readable name for the fallback label. */
  name?: string;
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Wraps a single gallery section. If the section throws during render or
 * inside an effect that propagates to React, we show a small inline notice
 * instead of letting the entire app crash. The user can keep scrolling.
 *
 * Class component because React still doesn't ship a hook for error
 * boundaries (and likely never will, given the semantics).
 */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console so devs can copy-paste the trace, with the section
    // name baked in so it's clear which one blew up.
    console.error(
      `[gallery] Section ${this.props.index}` +
        (this.props.name ? ` (${this.props.name})` : "") +
        " crashed:",
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.error) {
      return (
        <section className="snap-section bg-black flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-400/80 mb-3 font-mono">
              Section {String(this.props.index).padStart(2, "0")}
              {this.props.name ? ` · ${this.props.name}` : ""} · crashed
            </p>
            <p className="text-white/70 text-sm font-mono leading-relaxed break-words">
              {this.state.error.message}
            </p>
            <p className="text-white/30 text-xs mt-6 font-mono">
              Other sections still work — keep scrolling. Stack trace logged
              to the browser console.
            </p>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
