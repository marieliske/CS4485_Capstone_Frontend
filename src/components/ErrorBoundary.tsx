import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="empty" style={{ margin: '4rem auto' }}>
          <h4>Something went wrong.</h4>
          <p>{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
