import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Play, Trash } from 'lucide-react'
import type { AppProps } from '@/types'
import { Button } from '@/components/shared/ui'
import { sounds } from '@/lib/sound'
import { useDesktop } from '@/store/desktopStore'
import { openApp } from '@/store/windowStore'
import { useIsTouch } from '@/hooks/system'
import { discover, shake, type EggId } from '@/lib/easterEggs'

/** Each piece of junk is an Easter egg: opening it shows how it reacts. */
const junk: { name: string; note: string; egg: EggId; reaction?: string; youtube?: string }[] = [
  { name: 'spicy.mp4', note: 'Deleted for a reason. Double-click at your own risk.', egg: 'spicy', youtube: 'dQw4w9WgXcQ' },
  { name: 'node_modules', note: 'Weighed more than the rest of the disk combined.', egg: 'node_modules', reaction: 'Opening… still opening… the screen shook under the weight.' },
  { name: 'final-final-v3-REAL.psd', note: 'It was not final.', egg: 'psd', reaction: 'A newer version, final-final-v4-REAL-2.psd, is already on its way.' },
  { name: 'TODO.txt', note: '1. Write TODO list. 2. Lose TODO list.', egg: 'todo', reaction: 'Opened it. Added “read TODO.txt” to it. Closed it.' },
  { name: 'works-on-my-machine.sh', note: 'It did. Only there.', egg: 'myMachine', reaction: 'Ran fine. On this machine.' },
  { name: 'console.log("here").js', note: 'Debugging, the classic way.', egg: 'consolelog', reaction: 'Printed: here. Then: here2. Then: HERE???' },
  { name: 'untitled-folder (7)', note: 'Empty. Always empty.', egg: 'untitled', reaction: 'Inside: untitled-folder (8).' },
]

export default function TrashApp(_: AppProps) {
  const [items, setItems] = useState(junk)
  const [hover, setHover] = useState<string | null>(null)
  const touch = useIsTouch()
  const [opened, setOpened] = useState<Record<string, true>>({})
  const play = (it: (typeof junk)[number]) => {
    discover(it.egg)
    if (it.youtube) {
      sounds.open()
      openApp('player', { title: it.name, youtube: it.youtube })
      return
    }
    sounds.pop()
    if (it.egg === 'node_modules') shake()
    setOpened((o) => ({ ...o, [it.name]: true }))
  }
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
            discover('cleanslate')
            useDesktop.getState().pushNotification({ id: 'trash', app: 'trash', title: 'Trash emptied', body: `${items.length === 1 ? 'One bad idea is' : `${items.length} bad ideas are`} gone for good. Well, until the next reload.` })
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
                  // Like Finder: double-click opens, a tap on a phone opens, Return opens.
                  onDoubleClick={() => play(it)}
                  onClick={() => touch && play(it)}
                  onKeyDown={(e) => e.key === 'Enter' && play(it)}
                  aria-label={it.youtube ? `${it.name}, video` : it.name}
                  className="flex flex-col items-center gap-1.5 rounded-[10px] p-2 text-center hover:bg-[var(--hover)]"
                >
                  {it.youtube ? (
                    <div className="relative grid h-12 w-10 place-items-center overflow-hidden rounded-[4px] bg-gradient-to-b from-zinc-700 to-zinc-950 shadow-[0_1px_3px_rgba(0,0,0,.3)]">
                      <div className="absolute inset-x-0 top-0 flex h-1.5 justify-around bg-black/60">
                        {[0, 1, 2, 3].map((k) => (
                          <span key={k} className="mt-[2px] h-[2px] w-[3px] rounded-[1px] bg-white/50" />
                        ))}
                      </div>
                      <Play size={14} className="text-white/85" fill="currentColor" />
                    </div>
                  ) : (
                    <div className="grid h-12 w-10 place-items-center rounded-[4px] bg-white text-[9px] font-bold text-zinc-400 shadow-[0_1px_3px_rgba(0,0,0,.3)]">{it.name.split('.').pop()?.slice(0, 4).toUpperCase()}</div>
                  )}
                  <span className="line-clamp-2 break-all text-[12px]">{it.name}</span>
                  <span className={`text-[11px] leading-snug text-[var(--text-3)] transition ${hover === it.name || opened[it.name] ? 'opacity-100' : 'opacity-0'}`}>{opened[it.name] && it.reaction ? it.reaction : it.note}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
