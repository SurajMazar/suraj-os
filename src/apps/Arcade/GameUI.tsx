import type { ReactNode } from 'react'
import { Button } from '@/components/shared/ui'

/** The row of numbers above a board: score, best, time. */
export function StatBar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2.5">
      {children}
      {right ? <div className="ml-auto flex items-center gap-2">{right}</div> : null}
    </div>
  )
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-[var(--text-3)]">{label}</div>
      <div className="font-mono text-[17px] font-semibold tabular-nums leading-tight">{value}</div>
    </div>
  )
}

/** The card laid over a board before a round starts and after it ends. */
export function GameOverlay({ title, body, action, onAction, secondary }: { title: string; body?: ReactNode; action: string; onAction: () => void; secondary?: ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-[color-mix(in_srgb,var(--surface-solid)_55%,transparent)] p-4">
      <div className="w-full max-w-[300px] rounded-[14px] border border-[var(--border)] bg-[var(--surface-solid)] p-5 text-center shadow-[0_12px_40px_rgba(0,0,0,.25)]">
        <div className="text-[17px] font-bold">{title}</div>
        {body ? <div className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-2)]">{body}</div> : null}
        <Button variant="primary" className="mt-4 w-full" onClick={onAction} autoFocus>
          {action}
        </Button>
        {secondary ? <div className="mt-2.5 text-[11.5px] text-[var(--text-3)]">{secondary}</div> : null}
      </div>
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-[4px] border border-[var(--border-strong)] bg-[var(--surface-3)] px-1 py-px font-sans text-[11px] text-[var(--text-2)]">{children}</kbd>
}
