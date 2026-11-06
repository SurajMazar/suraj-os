import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Command, Search } from 'lucide-react'
import { search, type SearchItem } from '@/lib/search'
import { useDesktop } from '@/store/desktopStore'
import { AppIcon } from '@/components/shared/AppIcon'
import { FileIcon } from '@/components/shared/FileIcon'
import { fs } from '@/data/fs'
import type { AppId } from '@/types'

const suggestions: AppId[] = ['projects', 'about', 'experience', 'resume', 'terminal', 'contact']

function ResultIcon({ item, size = 22 }: { item: SearchItem; size?: number }) {
  if (item.fileId) {
    const n = fs.get(item.fileId)
    return n ? <FileIcon node={n} size={size} /> : null
  }
  if (item.group === 'Commands')
    return (
      <div className="grid place-items-center rounded-[6px] bg-[var(--surface-3)] text-[var(--text-2)]" style={{ width: size, height: size }}>
        <Command size={size * 0.6} />
      </div>
    )
  if (item.color && item.group !== 'Applications')
    return (
      <div className="grid place-items-center rounded-[6px] text-[11px] font-bold text-white" style={{ width: size, height: size, background: item.color }}>
        {item.title.slice(0, 1)}
      </div>
    )
  return item.appId ? <AppIcon appId={item.appId} size={size} /> : null
}

export function Spotlight() {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const close = () => useDesktop.getState().setOverlay(null)

  const results = useMemo(() => {
    if (q.trim()) return search(q)
    return search('') // empty
  }, [q])
  const shown: SearchItem[] = q.trim() ? results : suggestions.map((id) => search(id === 'about' ? 'About Me' : id).find((r) => r.appId === id && r.group === 'Applications')!).filter(Boolean)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => setActive(0), [q])
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (item?: SearchItem) => {
    if (!item) return
    close()
    item.run()
  }

  const groups: { name: string; items: { item: SearchItem; idx: number }[] }[] = []
  shown.forEach((item, idx) => {
    const name = q.trim() ? item.group : 'Suggestions'
    let g = groups.find((x) => x.name === name)
    if (!g) groups.push((g = { name, items: [] }))
    g.items.push({ item, idx })
  })
  // Keep keyboard order consistent with the grouped display order.
  const flat = groups.flatMap((g) => g.items)
  const current = flat[active]?.item

  return (
    <motion.div className="absolute inset-0 z-[40]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} onPointerDown={close}>
      <motion.div
        role="dialog"
        aria-label="Spotlight Search"
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        className="liquid glass-strong absolute left-1/2 top-[18%] w-[min(680px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[16px] shadow-[0_30px_80px_rgba(0,0,0,.4),0_0_0_.5px_var(--border-strong)]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex h-[54px] items-center gap-3 px-4">
          <Search size={22} className="text-[var(--text-3)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Spotlight Search"
            aria-label="Spotlight Search"
            aria-controls="spotlight-results"
            aria-activedescendant={current ? `sr-${active}` : undefined}
            className="h-full flex-1 bg-transparent text-[22px] font-light outline-none placeholder:text-[var(--text-3)]"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(flat.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                run(current)
              } else if (e.key === 'Escape') {
                e.preventDefault()
                close()
              }
            }}
          />
        </div>
        {flat.length > 0 && (
          <div className="flex h-[min(380px,50vh)] border-t border-[var(--border)]">
            <div ref={listRef} id="spotlight-results" role="listbox" className="scroll-thin w-full overflow-y-auto p-1.5 sm:w-[46%] sm:border-r sm:border-[var(--border)]">
              {groups.map((g) => (
                <div key={g.name} role="group" aria-label={g.name}>
                  <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold text-[var(--text-3)]">{g.name}</div>
                  {g.items.map(({ item }) => {
                    const idx = flat.findIndex((f) => f.item === item)
                    return (
                      <button
                        key={item.id}
                        id={`sr-${idx}`}
                        data-idx={idx}
                        type="button"
                        role="option"
                        aria-selected={idx === active}
                        onPointerMove={() => setActive(idx)}
                        onClick={() => run(item)}
                        className={`flex w-full items-center gap-2.5 rounded-[7px] px-2.5 py-[5px] text-left ${idx === active ? 'bg-[var(--selection)] text-white' : ''}`}
                      >
                        <span className="grid h-[22px] w-[22px] shrink-0 place-items-center">
                          <ResultIcon item={item} />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13px]">{item.title}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="hidden min-w-0 flex-1 flex-col items-center overflow-hidden p-6 text-center sm:flex">
              {current && (
                <motion.div key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }} className="flex w-full flex-col items-center">
                  <div className="mb-3 mt-4">
                    <ResultIcon item={current} size={72} />
                  </div>
                  <div className="text-[17px] font-semibold">{current.title}</div>
                  <div className="mt-0.5 text-[12px] text-[var(--text-3)]">{current.subtitle}</div>
                  {current.preview && <p className="mt-4 line-clamp-[8] whitespace-pre-line text-left text-[12px] leading-relaxed text-[var(--text-2)]">{current.preview}</p>}
                  <div className="mt-4 text-[11px] text-[var(--text-3)]">Press Return to open</div>
                </motion.div>
              )}
            </div>
          </div>
        )}
        {q.trim() && flat.length === 0 && <div className="border-t border-[var(--border)] px-5 py-6 text-center text-[13px] text-[var(--text-3)]">No results for “{q}”. Try “react”, “docsumo” or “resume”.</div>}
      </motion.div>
    </motion.div>
  )
}
