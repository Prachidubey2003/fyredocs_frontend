import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * App-wide error boundary, mounted inside the router and auth provider.
 *
 * KNOWN LIMITATION: "Try again" only resets `hasError`. It does not remount the
 * subtree or reset router state, so if the failing component re-renders from the
 * same props and state it will throw again immediately and the button appears to
 * do nothing. Genuinely recovering needs a key change on the boundary or a
 * navigation; this is a stopgap, not a fix.
 *
 * It also reports via console.error rather than to an error-tracking service, so
 * production crashes are only visible in a user's own devtools. Both gaps are
 * tracked as follow-up work.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
          <div className="max-w-lg space-y-4 text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
