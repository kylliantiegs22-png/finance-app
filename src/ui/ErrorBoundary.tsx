import { Component, type ReactNode } from 'react';

/**
 * Last line of defence: a render error shows a calm recovery screen instead of a
 * blank page. It never touches saved progress.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.warn('Tally recovered from a screen error:', error.message);
  }

  private home = () => {
    history.replaceState(null, '', '#/');
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page center-page" role="alert" data-testid="error-screen">
        <h1 className="title">Something went wrong on this screen</h1>
        <p className="muted">Your progress is saved on this device and hasn't been touched.</p>
        <div className="stack" style={{ width: '100%', maxWidth: 360 }}>
          <button type="button" className="btn btn-primary" onClick={this.home} data-testid="error-home">
            Back to my path
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => location.reload()}>
            Reload Tally
          </button>
        </div>
      </div>
    );
  }
}
