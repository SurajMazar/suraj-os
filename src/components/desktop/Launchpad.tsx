import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { apps, launchpadApps } from '@/apps/registry'
import { useDesktop } from '@/store/desktopStore'
import { openApp } from '@/store/windowStore'
import { AppIcon } from '@/components/shared/AppIcon'
import { SearchInput } from '@/components/shared/ui'
import { useMedia } from '@/hooks/system'

export function Launchpad() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const close = () => useDesktop.getState().setOverlay(null)
  const wide = useMedia('(min-width: 1100px)')
  const tall = useMedia('(min-height: 760px)')
  const cols = wide ? 6 : 4
  const rows = tall ? 3 : 2
  const perPage = cols * rows

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return launchpadApps.filter((id) => !t || apps[id].name.toLowerCase().includes(t) || apps[id].keywords?.some((k) => k.includes(t)))
  }, [q])
  const pages = Math.max(1, Math.ceil(list.length / perPage))

  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => setPage(0), [q, perPage])

  const go = (p: number) => {
    const next = Math.max(0, Math.min(pages - 1, p))
    setDir(next > page ? 1 : -1)
    setPage(next)
  }

  return (
    <motion.div
      className="absolute inset-0 z-[40] flex flex-col items-center"
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ background: 'rgba(10,10,20,.5)', backdropFilter: 'blur(40px) saturate(150%)', WebkitBackdropFilter: 'blur(40px) saturate(150%)' }}
      onClick={close}
      onWheel={(e) => {
        if (Math.abs(e.deltaX) > 30 || Math.abs(e.deltaY) > 60) go(page + Math.sign(e.deltaX || e.deltaY))
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && !q) go(page + 1)
        if (e.key === 'ArrowLeft' && !q) go(page - 1)
      }}
      role="dialog"
      aria-label="Launchpad"
    >
      <div className="mt-[6vh] w-[260px]" onClick={(e) => e.stopPropagation()}>
        <SearchInput
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onClear={() => setQ('')}
          placeholder="Search"
          aria-label="Search applications"
          className="!bg-white/15 text-white [&_input]:text-center [&_input]:placeholder:text-white/60"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && list[0]) {
              close()
              openApp(list[0])
            }
            if (e.key === 'Escape') close()
          }}
        />
      </div>

      <div className="relative w-full max-w-[1100px] flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={page + q}
            custom={dir}
            initial={{ x: `${dir * 30}%`, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: `${-dir * 30}%`, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="absolute inset-0 grid content-center justify-center gap-x-[min(6vw,72px)] gap-y-[min(6vh,52px)] px-8"
            style={{ gridTemplateColumns: `repeat(${cols}, 96px)` }}
          >
            {list.slice(page * perPage, page * perPage + perPage).map((id, i) => (
              <motion.button
                key={id}
                type="button"
                initial={{ opacity: 0, scale: 0.7, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.025, type: 'spring', stiffness: 400, damping: 26 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation()
                  close()
                  openApp(id)
                }}
                className="flex flex-col items-center gap-2 outline-none"
              >
                <AppIcon appId={id} size={80} />
                <span className="text-[13px] font-medium text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>
                  {apps[id].name}
                </span>
              </motion.button>
            ))}
            {!list.length && <div className="col-span-full text-center text-[15px] text-white/70">No apps match “{q}”.</div>}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mb-[14vh] flex h-4 items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {pages > 1 &&
          Array.from({ length: pages }, (_, i) => (
            <button key={i} type="button" aria-label={`Page ${i + 1}`} aria-current={i === page} onClick={() => go(i)} className={`h-[7px] w-[7px] rounded-full transition ${i === page ? 'bg-white' : 'bg-white/35'}`} />
          ))}
      </div>
    </motion.div>
  )
}
