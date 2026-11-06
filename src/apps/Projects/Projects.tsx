import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Briefcase, ChevronLeft, Code, FolderGit2, Globe, LayoutGrid, List, Sparkles } from 'lucide-react'
import type { AppProps } from '@/types'
import { projects, type Project, type ProjectCategory } from '@/portfolio.config'
import { useAppCommand } from '@/lib/appEvents'
import { openApp, useWindows } from '@/store/windowStore'
import { Badge, Button, SearchInput, Segmented } from '@/components/shared/ui'
import { GitHubMark } from '@/components/shared/BrandIcons'
import { ProjectArt } from './ProjectArt'

type Filter = 'all' | 'work' | 'open-source' | ProjectCategory
const categories: ProjectCategory[] = ['AI & Machine Learning', 'Document Automation', 'Full Stack Applications', 'Developer Tools', 'Experiments']

function count(f: Filter) {
  return projects.filter((p) => matches(p, f)).length
}
function matches(p: Project, f: Filter) {
  if (f === 'all') return true
  if (f === 'work' || f === 'open-source') return p.kind === f
  return p.category === f
}

function Detail({ p, onBack }: { p: Project; onBack: () => void }) {
  return (
    <motion.div
      key={p.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="scroll-thin @container absolute inset-0 overflow-y-auto bg-[var(--surface-solid)]"
    >
      <div className="sticky top-0 z-10 flex h-[44px] items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ChevronLeft size={14} /> All Projects
        </Button>
        <span className="truncate text-[13px] font-semibold">{p.name}</span>
      </div>
      <motion.div layoutId={`art-${p.id}`} className="mx-6 mt-5 overflow-hidden rounded-[18px]">
        <ProjectArt p={p} className="h-[220px]" />
      </motion.div>
      <div className="grid gap-8 px-6 py-6 @[640px]:grid-cols-[1fr_230px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={p.theme.from}>{p.category}</Badge>
            <Badge>{p.kind === 'work' ? 'Work project' : 'Open source'}</Badge>
          </div>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight">{p.name}</h1>
          <p className="mt-1 text-[15px] text-[var(--text-2)]">{p.tagline}</p>
          <p className="mt-4 text-[13px] leading-relaxed">{p.description}</p>

          {p.highlights.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[.14em] text-[var(--text-3)]">What was built</h2>
              <ul className="space-y-2">
                {p.highlights.map((h, i) => (
                  <motion.li key={h} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="flex gap-2.5 text-[13px] leading-relaxed">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: p.theme.from }} />
                    {h}
                  </motion.li>
                ))}
              </ul>
            </section>
          )}
          {p.impact && p.impact.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[.14em] text-[var(--text-3)]">Impact</h2>
              <div className="grid gap-2 @[480px]:grid-cols-2">
                {p.impact.map((h) => (
                  <div key={h} className="rounded-[12px] p-3 text-[13px] font-medium leading-snug" style={{ background: `${p.theme.from}18`, color: 'var(--text)' }}>
                    {h}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-5">
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-3)]">Role</div>
            <div className="text-[13px]">{p.role}</div>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-3)]">Stack</div>
            <div className="flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <button key={t} type="button" onClick={() => openApp('skills', { focus: t })} className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-[12px] hover:bg-[var(--hover)]">
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {p.live && (
              <Button variant="primary" className="w-full" onClick={() => openApp('safari', { url: p.live })}>
                <Globe size={14} /> Live demo
              </Button>
            )}
            {p.github && (
              <Button className="w-full" onClick={() => openApp('safari', { url: p.github })}>
                <GitHubMark size={13} /> Source on GitHub
              </Button>
            )}
            {!p.live && !p.github && <p className="text-[12px] leading-relaxed text-[var(--text-3)]">A client or employer product, so there is no public source or demo link.</p>}
          </div>
        </aside>
      </div>
    </motion.div>
  )
}

export default function Projects({ windowId, props }: AppProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [openId, setOpenId] = useState<string | null>((props.projectId as string) ?? null)

  useEffect(() => {
    if (props.projectId) setOpenId(props.projectId as string)
  }, [props.projectId, props.nonce])
  useAppCommand(windowId, (cmd, payload) => {
    if (cmd === 'view') setView(payload as 'grid' | 'list')
  })
  const opened = projects.find((p) => p.id === openId)
  useEffect(() => {
    useWindows.getState().setTitle(windowId, opened ? opened.name : 'Projects')
  }, [opened, windowId])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => matches(p, filter) && (!q || [p.name, p.tagline, p.description, ...p.tech].join(' ').toLowerCase().includes(q)))
  }, [filter, query])

  const nav: { id: Filter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Projects', icon: <LayoutGrid size={14} /> },
    { id: 'work', label: 'Work', icon: <Briefcase size={14} /> },
    { id: 'open-source', label: 'Open Source', icon: <FolderGit2 size={14} /> },
  ]

  return (
    <div className="flex h-full">
      <aside className="glass hidden w-[232px] shrink-0 flex-col border-r border-[var(--border)] pt-[52px] sm:flex" data-drag-region>
        <nav aria-label="Project filters" className="space-y-[1px] px-2.5">
          {nav.map((n) => (
            <FilterButton key={n.id} active={filter === n.id} onClick={() => { setFilter(n.id); setOpenId(null) }} icon={n.icon} label={n.label} count={count(n.id)} />
          ))}
          <div className="px-2 pb-1 pt-4 text-[11px] font-semibold text-[var(--text-3)]">Categories</div>
          {categories.map((c) => (
            <FilterButton key={c} active={filter === c} onClick={() => { setFilter(c); setOpenId(null) }} icon={c.startsWith('AI') ? <Sparkles size={14} /> : <Code size={14} />} label={c} count={count(c)} />
          ))}
        </nav>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col bg-[var(--surface-solid)]">
        <div data-drag-region className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--border)] pl-[86px] pr-3 sm:pl-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold">{nav.find((n) => n.id === filter)?.label ?? filter}</div>
          </div>
          <Segmented
            label="Layout"
            value={view}
            onChange={setView}
            options={[
              { value: 'grid', label: <LayoutGrid size={14} />, title: 'Grid' },
              { value: 'list', label: <List size={14} />, title: 'List' },
            ]}
          />
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search projects" aria-label="Search projects" className="w-[170px]" />
        </div>

        <div className="scroll-thin @container min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex gap-1.5 overflow-x-auto sm:hidden">
            {(['all', 'work', 'open-source', ...categories] as Filter[]).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] ${filter === f ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-3)]'}`}>
                {f === 'all' ? 'All' : f === 'open-source' ? 'Open Source' : f === 'work' ? 'Work' : f}
              </button>
            ))}
          </div>
          {list.length === 0 && <div className="py-16 text-center text-[13px] text-[var(--text-3)]">No projects match. Try another filter.</div>}
          {view === 'grid' ? (
            <motion.div layout className="grid gap-4 @[560px]:grid-cols-2 @[880px]:grid-cols-3">
              <AnimatePresence>
                {list.map((p, i) => (
                  <motion.button
                    layout
                    key={p.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    onClick={() => setOpenId(p.id)}
                    className="group overflow-hidden rounded-[16px] bg-[var(--surface-3)] text-left shadow-[inset_0_0_0_.5px_var(--border)] transition hover:shadow-[0_10px_30px_rgba(0,0,0,.14),inset_0_0_0_.5px_var(--border)]"
                  >
                    <motion.div layoutId={`art-${p.id}`}>
                      <ProjectArt p={p} className="h-[140px]" />
                    </motion.div>
                    <div className="p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold">{p.name}</span>
                        <ArrowUpRight size={14} className="shrink-0 text-[var(--text-3)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--text)]" />
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--text-2)]">{p.tagline}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {p.tech.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-[var(--surface-solid)] px-2 py-[1px] text-[11px] text-[var(--text-2)]">
                            {t}
                          </span>
                        ))}
                        {p.tech.length > 3 && <span className="px-1 text-[11px] text-[var(--text-3)]">+{p.tech.length - 3}</span>}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[12px] border border-[var(--border)]">
              {list.map((p) => (
                <button key={p.id} type="button" onClick={() => setOpenId(p.id)} className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-[var(--hover)]">
                  <ProjectArt p={p} className="h-10 w-14 shrink-0 rounded-[8px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                    <span className="block truncate text-[12px] text-[var(--text-2)]">{p.tagline}</span>
                  </span>
                  <span className="hidden shrink-0 text-[12px] text-[var(--text-3)] @[560px]:block">{p.category}</span>
                  <span className="flex shrink-0 gap-1 text-[var(--text-3)]">
                    {p.github && <GitHubMark size={13} />}
                    {p.live && <Globe size={13} />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence>{opened && <Detail p={opened} onBack={() => setOpenId(null)} />}</AnimatePresence>
      </section>
    </div>
  )
}

function FilterButton({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number }) {
  return (
    <button type="button" aria-current={active} onClick={onClick} className={`flex min-h-[28px] w-full items-center gap-2 rounded-[6px] px-2 py-1 text-left text-[13px] leading-tight ${active ? 'bg-[var(--hover)] font-medium' : 'hover:bg-[var(--surface-3)]'}`}>
      <span className="shrink-0 text-[var(--accent)]">{icon}</span>
      <span className="min-w-0 flex-1">{label}</span>
      <span className="text-[11px] text-[var(--text-3)]">{count}</span>
    </button>
  )
}

