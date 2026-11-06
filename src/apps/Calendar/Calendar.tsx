import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AppProps } from '@/types'
import { experience, portfolio } from '@/portfolio.config'
import { openApp } from '@/store/windowStore'
import { Button, IconButton } from '@/components/shared/ui'

interface Milestone {
  year: number
  month: number
  label: string
  color: string
  run: () => void
}

/** Career milestones from the CV, placed on the month they happened. */
function milestones(): Milestone[] {
  const parse = (s: string) => {
    const d = new Date(`1 ${s}`)
    return { year: d.getFullYear(), month: d.getMonth() }
  }
  const out: Milestone[] = []
  for (const e of experience) {
    out.push({ ...parse(e.start), label: `Started at ${e.company} as ${e.position}`, color: e.color, run: () => openApp('experience', { focus: e.id }) })
  }
  return out
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar(_: AppProps) {
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const all = useMemo(milestones, [])

  const first = new Date(cursor.year, cursor.month, 1)
  const days = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const lead = first.getDay()
  const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => {
    const d = i - lead + 1
    return d >= 1 && d <= days ? d : null
  })
  const thisMonth = all.filter((m) => m.year === cursor.year && m.month === cursor.month)
  const move = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
  }
  const isToday = (d: number | null) => d === today.getDate() && cursor.month === today.getMonth() && cursor.year === today.getFullYear()

  return (
    <div className="flex h-full bg-[var(--surface-solid)]">
      <aside className="glass hidden w-[220px] shrink-0 flex-col border-r border-[var(--border)] px-3 pt-[52px] sm:flex" data-drag-region>
        <div className="px-1 text-[11px] font-semibold text-[var(--text-3)]">Milestones</div>
        <ul className="scroll-thin mt-1.5 space-y-0.5 overflow-y-auto pb-4">
          {all.map((m) => (
            <li key={m.label}>
              <button
                type="button"
                onClick={() => setCursor({ year: m.year, month: m.month })}
                className="flex w-full gap-2 rounded-[6px] px-1.5 py-1.5 text-left hover:bg-[var(--hover)]"
              >
                <span className="mt-[5px] h-2 w-2 shrink-0 rounded-full" style={{ background: m.color }} />
                <span className="min-w-0">
                  <span className="block text-[12px] leading-snug">{m.label}</span>
                  <span className="block text-[11px] text-[var(--text-3)]">{new Date(m.year, m.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <div data-drag-region className="flex h-[52px] shrink-0 items-center gap-1 border-b border-[var(--border)] pl-[86px] pr-3 sm:pl-4">
          <div className="min-w-0 flex-1 truncate text-[22px] font-bold">
            {first.toLocaleDateString(undefined, { month: 'long' })} <span className="font-normal text-[var(--text-2)]">{cursor.year}</span>
          </div>
          <IconButton label="Previous month" onClick={() => move(-1)}>
            <ChevronLeft size={16} />
          </IconButton>
          <Button size="sm" onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}>
            Today
          </Button>
          <IconButton label="Next month" onClick={() => move(1)}>
            <ChevronRight size={16} />
          </IconButton>
        </div>
        <div className="grid shrink-0 grid-cols-7 border-b border-[var(--border)]">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-1.5 text-right text-[11px] font-semibold text-[var(--text-3)]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridAutoRows: '1fr' }}>
          {cells.map((d, i) => (
            <div key={i} className={`min-h-0 border-b border-r border-[var(--border)] p-1.5 ${d ? '' : 'bg-[var(--surface-3)]'}`}>
              {d && (
                <div className="flex justify-end">
                  <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-[12px] tabular-nums ${isToday(d) ? 'bg-[var(--sys-red)] font-semibold text-white' : ''}`}>{d}</span>
                </div>
              )}
              {d === 1 &&
                thisMonth.map((m) => (
                  <button key={m.label} type="button" onClick={m.run} className="mt-1 block w-full truncate rounded-[4px] px-1.5 py-[2px] text-left text-[11px] font-medium" style={{ background: `${m.color}26`, color: m.color }}>
                    {m.label}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <div className="flex h-[26px] shrink-0 items-center px-3 text-[11px] text-[var(--text-3)]">
          {thisMonth.length ? 'Milestones are dated by month on the CV, so they sit on the 1st.' : `${portfolio.location} · ${portfolio.timezoneLabel}`}
        </div>
      </section>
    </div>
  )
}
