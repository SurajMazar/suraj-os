import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { MenuItem } from '@/types'

/** The dropdown used by the menu bar, context menus and Dock menus. Arrow keys move, Enter runs. */
export function MenuList({ items, onDone, className = '', autoFocus = true }: { items: MenuItem[]; onDone: () => void; className?: string; autoFocus?: boolean }) {
  const [active, setActive] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const actionable = items.map((it, i) => (!it.separator && !it.disabled ? i : -1)).filter((i) => i >= 0)

  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true })
  }, [autoFocus])

  const run = (it: MenuItem) => {
    if (it.disabled || it.separator) return
    onDone()
    it.action?.()
  }

  return (
    <div
      ref={ref}
      role="menu"
      tabIndex={-1}
      className={`menu-surface min-w-[220px] p-[5px] text-[13px] text-[var(--text)] outline-none ${className}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          const pos = actionable.indexOf(active)
          const next = e.key === 'ArrowDown' ? actionable[(pos + 1) % actionable.length] : actionable[(pos - 1 + actionable.length) % actionable.length]
          setActive(next ?? -1)
        } else if (e.key === 'Enter' && active >= 0) {
          e.preventDefault()
          run(items[active])
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          onDone()
        }
      }}
    >
      {items.map((it, i) =>
        it.separator ? (
          <div key={i} role="separator" className="mx-2 my-[5px] h-px bg-[var(--border)]" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={it.disabled}
            onPointerEnter={() => setActive(i)}
            onClick={() => run(it)}
            className={`flex h-[24px] w-full items-center gap-2 rounded-[5px] pl-[22px] pr-2 text-left disabled:opacity-40 ${active === i && !it.disabled ? 'bg-[var(--selection)] text-white' : ''} ${it.danger && active !== i ? 'text-[var(--sys-red)]' : ''}`}
          >
            {it.checked ? <Check size={12} strokeWidth={3} className="-ml-[16px] mr-[4px]" /> : null}
            <span className="flex-1 truncate">{it.label}</span>
            {it.shortcut ? <span className={`text-[12px] tracking-wide ${active === i ? 'text-white/80' : 'text-[var(--text-3)]'}`}>{it.shortcut}</span> : null}
          </button>
        ),
      )}
    </div>
  )
}
