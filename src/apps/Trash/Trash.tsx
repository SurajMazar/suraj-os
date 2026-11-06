import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Trash } from 'lucide-react'
import type { AppProps } from '@/types'
import { Button } from '@/components/shared/ui'
import { sounds } from '@/lib/sound'
import { useDesktop } from '@/store/desktopStore'

const junk = [
  { name: 'node_modules', note: 'Weighed more than the rest of the disk combined.' },
  { name: 'final-final-v3-REAL.psd', note: 'It was not final.' },
  { name: 'TODO.txt', note: '1. Write TODO list. 2. Lose TODO list.' },
  { name: 'works-on-my-machine.sh', note: 'It did. Only there.' },
  { name: 'console.log("here").js', note: 'Debugging, the classic way.' },
  { name: 'untitled-folder (7)', note: 'Empty. Always empty.' },
]

export default function TrashApp(_: AppProps) {
  const [items, setItems] = useState(junk)
  const [hover, setHover] = useState<string | null>(null)
  return (
    <div className="flex h-full flex-col bg-[var(--surface-solid)]">
      <div data-drag-region className="glass-strong flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--border)] pl-[86px] pr-3">
        <span className="flex-1 text-[15px] font-bold">Trash</span>
        <Button
          size="sm"
          disabled={!items.length}
          onClick={() => {
            sounds.trash()
            setItems([])
            useDesktop.getState().pushNotification({ id: 'trash', app: 'trash', title: 'Trash emptied', body: 'Six bad ideas are gone for good. Well, until the next reload.' })
          }}
        >
          Empty
        </Button>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[var(--text-3)]">
            <Trash size={44} strokeWidth={1.2} />
            <div className="text-[13px] font-semibold text-[var(--text-2)]">Trash is empty</div>
            <div className="text-[12px]">Reload the page and the bad ideas come back. They always do.</div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
            <AnimatePresence>
              {items.map((it, i) => (
                <motion.button
                  key={it.name}
                  type="button"
                  layout
                  exit={{ opacity: 0, scale: 0.4, y: 40, rotate: (i % 2 ? 1 : -1) * 20, transition: { delay: i * 0.04 } }}
                  onPointerEnter={() => setHover(it.name)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(it.name)}
                  className="flex flex-col items-center gap-1.5 rounded-[10px] p-2 text-center hover:bg-[var(--hover)]"
                >
                  <div className="grid h-12 w-10 place-items-center rounded-[4px] bg-white text-[9px] font-bold text-zinc-400 shadow-[0_1px_3px_rgba(0,0,0,.3)]">{it.name.split('.').pop()?.slice(0, 4).toUpperCase()}</div>
                  <span className="line-clamp-2 break-all text-[12px]">{it.name}</span>
                  <span className={`text-[11px] leading-snug text-[var(--text-3)] transition ${hover === it.name ? 'opacity-100' : 'opacity-0'}`}>{it.note}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
