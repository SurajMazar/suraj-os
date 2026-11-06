import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MapPin } from 'lucide-react'
import type { AppProps } from '@/types'
import { experience, portfolio, projects } from '@/portfolio.config'
import { openApp } from '@/store/windowStore'

function duration(start: string, end: string) {
  const parse = (s: string) => (s === 'Present' ? new Date() : new Date(`1 ${s}`))
  const a = parse(start)
  const b = parse(end)
  const months = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth()
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ') || '1 mo'
}

export default function Experience({ props }: AppProps) {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!props.focus) return
    const el = scroller.current?.querySelector(`[data-exp="${props.focus as string}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [props.focus, props.nonce])

  return (
    <div ref={scroller} className="scroll-thin @container h-full overflow-y-auto bg-[var(--surface-solid)]">
      <header className="px-8 pb-4 pt-8">
        <div className="text-[12px] font-semibold uppercase tracking-[.18em] text-[var(--accent)]">Experience</div>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">{portfolio.yearsOfExperience} years, {experience.length} teams</h1>
        <p className="mt-1 max-w-[560px] text-[13px] text-[var(--text-2)]">From intern to senior engineer and team lead, building web products end to end in Kathmandu and Lalitpur.</p>
      </header>
      <ol className="relative mx-8 mb-10 border-l-2 border-[var(--border)] pl-0">
        {experience.map((e, i) => (
          <motion.li
            key={e.id}
            data-exp={e.id}
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ root: scroller, once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: i === 0 ? 0.1 : 0, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative scroll-mt-4 pb-8 pl-7"
          >
            <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-[3px] border-[var(--surface-solid)]" style={{ background: e.color, boxShadow: `0 0 0 3px ${e.color}33` }} />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h2 className="text-[17px] font-bold">{e.position}</h2>
              <span className="text-[12px] tabular-nums text-[var(--text-3)]">
                {e.start} – {e.end} · {duration(e.start, e.end)}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] text-[var(--text-2)]">
              <span className="font-semibold" style={{ color: e.color }}>
                {e.company}
              </span>
              {e.companyBlurb && <span>{e.companyBlurb}</span>}
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {e.location}
              </span>
            </div>
            <Points points={e.points} color={e.color} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.tech.map((t) => (
                <button key={t} type="button" onClick={() => openApp('skills', { focus: t })} className="rounded-full bg-[var(--surface-3)] px-2 py-[2px] text-[11px] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]">
                  {t}
                </button>
              ))}
            </div>
            {e.projects && (
              <div className="mt-3 flex flex-wrap gap-2">
                {e.projects.map((pid) => {
                  const p = projects.find((x) => x.id === pid)
                  if (!p) return null
                  return (
                    <button key={pid} type="button" onClick={() => openApp('projects', { projectId: pid })} className="flex items-center gap-2 rounded-[10px] border border-[var(--border)] py-1.5 pl-1.5 pr-3 text-[12px] font-medium hover:bg-[var(--hover)]">
                      <span className="h-6 w-6 rounded-[6px]" style={{ background: `linear-gradient(135deg, ${p.theme.from}, ${p.theme.to})` }} />
                      {p.name}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.li>
        ))}
        <li className="relative pl-7">
          <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-[var(--border-strong)]" />
          <div className="text-[13px] font-semibold">{portfolio.education.degree}</div>
          <div className="text-[12px] text-[var(--text-2)]">
            {portfolio.education.school} · {portfolio.education.year}
          </div>
        </li>
      </ol>
    </div>
  )
}

const VISIBLE = 4

/** Achievements, with long lists folded behind a "Show more" toggle. */
function Points({ points, color }: { points: string[]; color: string }) {
  const [open, setOpen] = useState(false)
  const extra = points.length - VISIBLE
  return (
    <div className="mt-3">
      <ul className="space-y-2">
        {points.slice(0, VISIBLE).map((pt) => (
          <li key={pt} className="flex gap-2.5 text-[13px] leading-relaxed">
            <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[var(--text-3)]" />
            <span>{pt}</span>
          </li>
        ))}
        <AnimatePresence initial={false}>
          {open &&
            points.slice(VISIBLE).map((pt, i) => (
              <motion.li key={pt} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', transition: { delay: i * 0.03 } }} exit={{ opacity: 0, height: 0 }} className="flex gap-2.5 overflow-hidden text-[13px] leading-relaxed">
                <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-[var(--text-3)]" />
                <span>{pt}</span>
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>
      {extra > 0 && (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2 text-[12px] font-medium hover:underline" style={{ color }}>
          {open ? 'Show less' : `Show ${extra} more`}
        </button>
      )}
    </div>
  )
}
