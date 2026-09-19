import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorState from "./ErrorState";

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  render() {
    if (this.state.failed) {
      return (
        <main id="main-content" className="mx-auto max-w-3xl p-6">
          <ErrorState
            message="The page could not be displayed. Reload to try again."
            onRetry={() => window.location.reload()}
          />
        </main>
      );
    }
    return this.props.children;
  }
}
