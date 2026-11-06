import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AppWindow, ArrowDownAZ, ChevronLeft, ChevronRight, Clock, Download, FileText, FolderKanban, House, LayoutGrid, List, Monitor, Radio } from 'lucide-react'
import type { AppProps } from '@/types'
import { DESKTOP_DIR, HOME_DIR, fs, kindLabel, type FsNode } from '@/data/fs'
import { useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { openFile } from '@/lib/openFile'
import { useAppCommand } from '@/lib/appEvents'
import { FileIcon } from '@/components/shared/FileIcon'
import { IconButton, SearchInput, Segmented } from '@/components/shared/ui'
import { portfolio } from '@/portfolio.config'
import { useIsMobile } from '@/hooks/system'

type Place = string // folder id, or a virtual place
const AIRDROP = 'airdrop:'
const RECENTS = 'recents:'
type SortKey = 'name' | 'kind'

const sidebar: { id: Place; label: string; icon: React.ReactNode }[] = [
  { id: AIRDROP, label: 'AirDrop', icon: <Radio size={15} /> },
  { id: RECENTS, label: 'Recents', icon: <Clock size={15} /> },
  { id: '/Applications', label: 'Applications', icon: <AppWindow size={15} /> },
  { id: DESKTOP_DIR, label: 'Desktop', icon: <Monitor size={15} /> },
  { id: `${HOME_DIR}/Documents`, label: 'Documents', icon: <FileText size={15} /> },
  { id: `${HOME_DIR}/Downloads`, label: 'Downloads', icon: <Download size={15} /> },
  { id: `${HOME_DIR}/Projects`, label: 'Projects', icon: <FolderKanban size={15} /> },
  { id: HOME_DIR, label: portfolio.handle, icon: <House size={15} /> },
]

function placeName(p: Place) {
  if (p === AIRDROP) return 'AirDrop'
  if (p === RECENTS) return 'Recents'
  return fs.get(p)?.name || 'Macintosh HD'
}

function AirDrop() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="relative grid h-36 w-36 place-items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="absolute inset-0 rounded-full border-2 border-[var(--accent)]" style={{ animation: `radar 3s ease-out ${i}s infinite` }} />
        ))}
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg">
          <Radio size={30} />
        </div>
      </div>
      <div>
        <div className="text-[15px] font-semibold">Looking for nearby devices…</div>
        <p className="mt-1 max-w-[320px] text-[12px] text-[var(--text-2)]">
          AirDrop is simulated. To send Suraj something for real, try{' '}
          <a className="text-[var(--accent)] underline" href={`mailto:${portfolio.email}`}>
            email
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export default function Finder({ windowId, props }: AppProps) {
  const initial = (props.path as string) ?? DESKTOP_DIR
  const [place, setPlace] = useState<Place>(initial)
  const [back, setBack] = useState<Place[]>([])
  const [fwd, setFwd] = useState<Place[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState<SortKey>('name')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const recents = useDesktop((s) => s.recents)
  const mobile = useIsMobile()
  const [browse, setBrowse] = useState(!props.path)
  const bodyRef = useRef<HTMLDivElement>(null)

  const go = (p: Place) => {
    if (p === place) return
    setBack((b) => [...b, place])
    setFwd([])
    setPlace(p)
    setSelected(null)
    setQuery('')
  }

  useEffect(() => {
    if (props.path && props.path !== place) go(props.path as string)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.nonce])

  useEffect(() => {
    useWindows.getState().setTitle(windowId, placeName(place))
  }, [place, windowId])

  useAppCommand(windowId, (cmd, payload) => {
    if (cmd === 'view') setView(payload as 'grid' | 'list')
  })

  const items: FsNode[] = useMemo(() => {
    let list: FsNode[]
    const q = query.trim().toLowerCase()
    if (q) list = fs.all().filter((n) => n.id !== '/' && n.name.toLowerCase().includes(q) && n.id !== `${DESKTOP_DIR}/Projects`)
    else if (place === RECENTS) list = recents.map((r) => fs.get(r)!).filter(Boolean)
    else if (place === AIRDROP) list = []
    else list = fs.children(place)
    if (place === RECENTS && !q) return list
    return [...list].sort((a, b) => {
      if (sort === 'kind') return kindLabel(a).localeCompare(kindLabel(b)) || a.name.localeCompare(b.name)
      if ((a.kind === 'folder') !== (b.kind === 'folder')) return a.kind === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [place, query, sort, recents])

  const goBack = () => {
    const prev = back[back.length - 1]
    if (prev === undefined) return
    setFwd((f) => [place, ...f])
    setBack((b) => b.slice(0, -1))
    setPlace(prev)
    setSelected(null)
  }
  const goFwd = () => {
    const next = fwd[0]
    if (next === undefined) return
    setBack((b) => [...b, place])
    setFwd((f) => f.slice(1))
    setPlace(next)
    setSelected(null)
  }

  const open = (n: FsNode) => {
    if (n.kind === 'folder') go(n.id)
    else openFile(n)
  }

  const itemMenu = (n: FsNode) => [
    { label: 'Open', action: () => open(n) },
    { label: 'Quick Look', shortcut: 'Space', action: () => useDesktop.getState().setQuickLook(n.id) },
    ...(n.kind === 'folder' ? [{ label: 'Open in New Window', action: () => openFile(n) }] : []),
    { label: '', separator: true },
    { label: 'Copy Path', action: () => void navigator.clipboard?.writeText(n.id) },
  ]
  const bgMenu = () => [
    { label: 'New Finder Window', action: () => openFile(fs.get(HOME_DIR)!) },
    { label: '', separator: true },
    { label: 'View as Icons', checked: view === 'grid', action: () => setView('grid') },
    { label: 'View as List', checked: view === 'list', action: () => setView('list') },
    { label: '', separator: true },
    { label: 'Sort by Name', checked: sort === 'name', action: () => setSort('name') },
    { label: 'Sort by Kind', checked: sort === 'kind', action: () => setSort('kind') },
  ]

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    const idx = items.findIndex((i) => i.id === selected)
    const cols = view === 'grid' ? Math.max(1, Math.floor((bodyRef.current?.clientWidth ?? 600) / 108)) : 1
    const move = (d: number) => {
      const next = items[Math.min(items.length - 1, Math.max(0, (idx < 0 ? -d : idx) + d))]
      if (next) setSelected(next.id)
      e.preventDefault()
    }
    if (e.key === 'ArrowRight' && view === 'grid') move(1)
    else if (e.key === 'ArrowLeft' && view === 'grid') move(-1)
    else if (e.key === 'ArrowDown') move(cols)
    else if (e.key === 'ArrowUp') move(-cols)
    else if (e.key === 'Enter' && selected) {
      e.preventDefault()
      open(fs.get(selected)!)
    } else if (e.code === 'Space' && selected) {
      e.preventDefault()
      const d = useDesktop.getState()
      d.setQuickLook(d.quickLook ? null : selected)
    } else if (e.key === 'Backspace' || (e.key === '[' && (e.metaKey || e.ctrlKey))) {
      e.preventDefault()
      goBack()
    }
  }

  const crumbs = place.startsWith('/') ? fs.ancestry(place) : []
  const sel = selected ? fs.get(selected) : null

  // iPhone: the Files app pattern, a Browse list that drills into folders.
  if (mobile && browse)
    return (
      <div className="scroll-thin h-full overflow-y-auto bg-[var(--surface-2)] px-4 pb-10 pt-3">
        <h1 className="mb-3 px-1 text-[28px] font-bold tracking-tight">Browse</h1>
        <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[12px] bg-[var(--surface-solid)]">
          {sidebar.map((x) => (
            <button key={x.id} type="button" onClick={() => { go(x.id); setBrowse(false) }} className="flex h-[46px] w-full items-center gap-3 px-3.5 text-left text-[15px] active:bg-[var(--hover)]">
              <span className="text-[var(--accent)]">{x.icon}</span>
              <span className="flex-1">{x.label}</span>
              <ChevronRight size={18} className="text-[var(--text-3)]" />
            </button>
          ))}
        </div>
      </div>
    )

  return (
    <div className="flex h-full" onKeyDown={onKeyDown}>
      {!mobile && <aside className="glass flex w-[178px] shrink-0 flex-col border-r border-[var(--border)] pt-[52px]" data-drag-region>
        <div className="px-4 pb-1 text-[11px] font-semibold text-[var(--text-3)]">Favorites</div>
        <nav aria-label="Favorites" className="space-y-[1px] px-2.5">
          {sidebar.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={place === s.id}
              onClick={() => go(s.id)}
              className={`flex h-[26px] w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] ${place === s.id ? 'bg-[var(--hover)] font-medium' : 'hover:bg-[var(--surface-3)]'}`}
            >
              <span className="text-[var(--accent)]">{s.icon}</span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>}

      <section className="flex min-w-0 flex-1 flex-col bg-[var(--surface-solid)]">
        <div data-drag-region className="flex h-[52px] shrink-0 items-center gap-1.5 border-b border-[var(--border)] px-3">
          {mobile && (
            <button type="button" onClick={() => setBrowse(true)} className="flex shrink-0 items-center text-[15px] text-[var(--accent)]">
              <ChevronLeft size={20} /> Browse
            </button>
          )}
          <IconButton label="Back" disabled={!back.length} onClick={goBack} className={mobile ? 'hidden' : ''}>
            <ChevronLeft size={18} />
          </IconButton>
          <IconButton label="Forward" disabled={!fwd.length} onClick={goFwd} className={mobile ? 'hidden' : ''}>
            <ChevronRight size={18} />
          </IconButton>
          <div className="ml-1 min-w-0 flex-1 truncate text-[15px] font-bold">{query ? `Searching “${query}”` : placeName(place)}</div>
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'grid', label: <LayoutGrid size={14} />, title: 'Icons' },
              { value: 'list', label: <List size={14} />, title: 'List' },
            ]}
          />
          <IconButton label={`Sort by ${sort === 'name' ? 'kind' : 'name'}`} onClick={() => setSort(sort === 'name' ? 'kind' : 'name')}>
            <ArrowDownAZ size={16} />
          </IconButton>
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} placeholder="Search" aria-label="Search files" className={mobile ? 'w-[110px]' : 'w-[150px]'} />
        </div>

        <div
          ref={bodyRef}
          tabIndex={0}
          className="scroll-thin relative min-h-0 flex-1 overflow-auto outline-none"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null)
          }}
          onContextMenu={(e) => {
            if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.bg) return
            e.preventDefault()
            useDesktop.getState().openContextMenu(e, bgMenu())
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={place + view + (query ? 'q' : '')} data-bg="1" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.14 }} className="min-h-full">
              {place === AIRDROP && !query ? (
                <AirDrop />
              ) : items.length === 0 ? (
                <div data-bg="1" className="grid h-[240px] place-items-center text-[13px] text-[var(--text-3)]">
                  {place === RECENTS ? 'Files you open show up here.' : query ? 'No matches.' : 'This folder is empty.'}
                </div>
              ) : view === 'grid' ? (
                <div role="listbox" aria-label="Files" data-bg="1" className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1 p-3">
                  {items.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      role="option"
                      aria-selected={selected === n.id}
                      onClick={() => setSelected(n.id)}
                      onDoubleClick={() => open(n)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setSelected(n.id)
                        useDesktop.getState().openContextMenu(e, itemMenu(n))
                      }}
                      className="flex flex-col items-center gap-1 rounded-[8px] p-1.5 outline-none"
                    >
                      <motion.div layout="position" className={`grid h-[62px] w-[70px] place-items-center rounded-[8px] ${selected === n.id ? 'bg-[var(--hover)]' : ''}`}>
                        <FileIcon node={n} size={54} />
                      </motion.div>
                      <span className={`line-clamp-2 max-w-full break-words rounded-[4px] px-1 text-center text-[12px] leading-tight ${selected === n.id ? 'bg-[var(--selection)] text-white' : ''}`}>{n.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead className="sticky top-0 z-10 bg-[var(--surface-solid)] text-left text-[11px] text-[var(--text-3)]">
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-1.5 pl-4 font-medium">Name</th>
                      <th className="hidden py-1.5 font-medium sm:table-cell">Date Modified</th>
                      <th className="py-1.5 pr-4 font-medium">Kind</th>
                    </tr>
                  </thead>
                  <tbody role="listbox" aria-label="Files">
                    {items.map((n, i) => (
                      <tr
                        key={n.id}
                        role="option"
                        aria-selected={selected === n.id}
                        onClick={() => setSelected(n.id)}
                        onDoubleClick={() => open(n)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          setSelected(n.id)
                          useDesktop.getState().openContextMenu(e, itemMenu(n))
                        }}
                        className={selected === n.id ? 'bg-[var(--selection)] text-white' : i % 2 ? 'bg-[var(--surface-3)]' : ''}
                      >
                        <td className="py-[3px] pl-4">
                          <span className="flex items-center gap-2">
                            <span className="grid w-5 place-items-center">
                              <FileIcon node={n} size={18} />
                            </span>
                            <span className="truncate">{n.name}</span>
                          </span>
                        </td>
                        <td className={`hidden py-[3px] sm:table-cell ${selected === n.id ? '' : 'text-[var(--text-2)]'}`}>{n.modified}</td>
                        <td className={`py-[3px] pr-4 ${selected === n.id ? '' : 'text-[var(--text-2)]'}`}>{kindLabel(n)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="flex h-[26px] shrink-0 items-center gap-1 overflow-hidden border-t border-[var(--border)] px-3 text-[11px] text-[var(--text-2)]">
          {crumbs.length > 0 && !query ? (
            crumbs.map((c, i) => (
              <span key={c.id} className="flex shrink-0 items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-[var(--text-3)]" />}
                <button type="button" onClick={() => go(c.id)} className="rounded px-1 hover:bg-[var(--hover)]">
                  {c.name || 'Macintosh HD'}
                </button>
              </span>
            ))
          ) : (
            <span>{place === AIRDROP ? 'AirDrop' : `${items.length} items`}</span>
          )}
          <span className="ml-auto shrink-0 text-[var(--text-3)]">{sel ? `${sel.name} · ${kindLabel(sel)}` : `${items.length} items`}</span>
        </footer>
      </section>
    </div>
  )
}
