import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** What to show instead of the crashed subtree. */
  fallback: (error: Error, reset: () => void) => ReactNode
}

/** Contains a crash to one app (or one screen) so the rest of SurajOS keeps running. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[SurajOS]', error)
  }

  reset = () => this.setState({ error: null })

  render() {
    return this.state.error ? this.props.fallback(this.state.error, this.reset) : this.props.children
  }
}

export function AppCrashed({ name, onReopen }: { name: string; onReopen: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--surface-solid)] p-6 text-center">
      <div className="text-[15px] font-semibold">{name} quit unexpectedly.</div>
      <p className="max-w-[300px] text-[12px] text-[var(--text-2)]">The rest of SurajOS is fine. You can reopen the app.</p>
      <button type="button" onClick={onReopen} className="h-[28px] rounded-[7px] bg-[var(--accent)] px-3 text-[13px] font-medium text-white">
        Reopen
      </button>
    </div>
  )
}
