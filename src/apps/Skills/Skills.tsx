import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { AppProps } from '@/types'
import { experience, projects, skillGroups, skillNotes } from '@/portfolio.config'
import { openApp } from '@/store/windowStore'
import { SearchInput } from '@/components/shared/ui'

const groupColor: Record<string, string> = {
  ai: '#8b5cf6',
  agentic: '#ec4899',
  frontend: '#0ea5e9',
  backend: '#10b981',
  data: '#f59e0b',
  devops: '#64748b',
  practices: '#ef4444',
}

const norm = (s: string) => s.toLowerCase().replace(/\s*\(.*\)/, '').trim()

/** Where the CV mentions a skill: roles and projects whose stack lists it. */
function usedIn(skill: string) {
  const k = norm(skill)
  const roles = experience.filter((e) => e.tech.some((t) => norm(t) === k)).map((e) => ({ label: e.company, run: () => openApp('experience', { focus: e.id }) }))
  const projs = projects.filter((p) => p.tech.some((t) => norm(t) === k)).map((p) => ({ label: p.name, run: () => openApp('projects', { projectId: p.id }) }))
  return [...roles, ...projs]
}

export default function Skills({ props }: AppProps) {
  const [group, setGroup] = useState<string>((props.group as string) ?? 'all')
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<string | null>((props.focus as string) ?? null)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!props.focus) return
    const f = props.focus as string
    const match = skillGroups.flatMap((g) => g.skills).find((s) => norm(s) === norm(f)) ?? f
    setGroup('all')
    setQuery('')
    setFocus(match)
    setTimeout(() => scroller.current?.querySelector(`[data-skill="${CSS.escape(match)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
  }, [props.focus, props.nonce])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return skillGroups
      .filter((g) => group === 'all' || g.id === group)
      .map((g) => ({ ...g, skills: g.skills.filter((s) => !q || s.toLowerCase().includes(q) || skillNotes[s]?.toLowerCase().includes(q)) }))
      .filter((g) => g.skills.length)
  }, [group, query])

  return (
    <div className="flex h-full flex-col bg-[var(--surface-solid)]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {[{ id: 'all', name: 'All' }, ...skillGroups].map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition ${group === g.id ? 'text-white' : 'bg-[var(--surface-3)] text-[var(--text-2)] hover:text-[var(--text)]'}`}
              style={group === g.id ? { background: groupColor[g.id] ?? 'var(--accent)' } : undefined}
            >
              {g.name}
            </button>
          ))}
        </div>
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Filter skills" aria-label="Filter skills" className="w-[160px]" />
      </div>
      <div ref={scroller} className="scroll-thin @container min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <p className="mb-4 text-[12px] text-[var(--text-3)]">Hover or tap a skill to see what it is and where it shows up in this portfolio. No made-up percentages.</p>
        {groups.length === 0 && <div className="py-12 text-center text-[13px] text-[var(--text-3)]">No skills match “{query}”.</div>}
        <div key={group + query}>
          {groups.map((g, gi) => (
            <motion.section key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(gi, 4) * 0.03 }} className="mb-6">
              <h2 className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: groupColor[g.id] }} />
                {g.name}
                <span className="font-normal text-[var(--text-3)]">{g.skills.length}</span>
              </h2>
              <div className="grid grid-cols-2 gap-2 @[520px]:grid-cols-3 @[760px]:grid-cols-4">
                {g.skills.map((s) => {
                  const active = focus === s
                  const uses = active ? usedIn(s) : []
                  return (
                    <div
                      key={s}
                      data-skill={s}
                      onPointerEnter={(e) => e.pointerType === 'mouse' && setFocus(s)}
                      onPointerLeave={(e) => e.pointerType === 'mouse' && setFocus((f) => (f === s ? null : f))}
                      onClick={() => setFocus(active ? null : s)}
                      tabIndex={0}
                      onFocus={() => setFocus(s)}
                      className="relative cursor-default self-start overflow-hidden rounded-[12px] border p-3 outline-none transition-colors duration-150"
                      style={{ borderColor: active ? groupColor[g.id] : 'var(--border)', background: active ? `${groupColor[g.id]}14` : 'var(--surface-3)' }}
                    >
                      <div className="text-[13px] font-semibold leading-snug">{s}</div>
                      <AnimatePresence initial={false}>
                        {active && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
                            <p className="pt-1.5 text-[12px] leading-snug text-[var(--text-2)]">{skillNotes[s] ?? 'Listed on the CV.'}</p>
                            {uses.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {uses.map((u) => (
                                  <button
                                    key={u.label}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      u.run()
                                    }}
                                    className="rounded-full bg-[var(--surface-solid)] px-1.5 py-[1px] text-[11px] text-[var(--text-2)] hover:text-[var(--text)]"
                                  >
                                    {u.label} →
                                  </button>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  )
}
