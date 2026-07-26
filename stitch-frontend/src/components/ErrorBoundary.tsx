import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-lg border-[3px] border-primary bg-error-container p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="font-display text-3xl font-bold text-on-error-container uppercase tracking-tight mb-4">Application Error</h1>
            <p className="font-mono text-sm text-on-error-container mb-6 break-words">{this.state.error.message}</p>
            <button onClick={() => window.location.reload()}
              className="border-[3px] border-primary bg-primary text-on-primary px-6 py-3 font-mono text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
