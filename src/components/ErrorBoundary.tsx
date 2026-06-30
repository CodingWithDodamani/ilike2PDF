import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  toolName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.toolName ? ` — ${this.props.toolName}` : ''}]`, error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card mx-auto max-w-lg text-center p-8">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-500 mb-1">
            {this.props.toolName
              ? `The "${this.props.toolName}" tool encountered an error.`
              : 'An unexpected error occurred.'}
          </p>
          {this.state.error && (
            <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-50 rounded-lg p-3 text-left overflow-auto max-h-32">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
