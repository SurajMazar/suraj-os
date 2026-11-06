import { create } from 'zustand'
import { motion } from 'motion/react'
import { apps } from '@/apps/registry'
import { useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { AppIcon } from '@/components/shared/AppIcon'
import type { AppId } from '@/types'

/** Running apps, most recently used first. */
export function switcherApps(): AppId[] {
  const ws = useWindows.getState()
  const sorted = Object.values(ws.windows).sort((a, b) => b.z - a.z)
  return Array.from(new Set(sorted.map((w) => w.appId)))
}

export const useSwitcher = create<{ index: number; set: (i: number) => void }>((set) => ({ index: 0, set: (index) => set({ index }) }))

export function commitSwitch(appId: AppId | undefined) {
  useDesktop.getState().setOverlay(null)
  if (!appId) return
  const ws = useWindows.getState()
  const top = Object.values(ws.windows)
    .filter((w) => w.appId === appId)
    .sort((a, b) => b.z - a.z)[0]
  if (!top) return
  if (top.minimized) ws.restore(top.id)
  else ws.focus(top.id)
}

export function AppSwitcher() {
  const index = useSwitcher((s) => s.index)
  const list = switcherApps()
  if (!list.length) return null
  const i = ((index % list.length) + list.length) % list.length
  return (
    <motion.div className="absolute inset-0 z-[45] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.08 }}>
      <div role="listbox" aria-label="Application switcher" className="liquid glass-strong flex gap-1 rounded-[22px] p-3 shadow-[0_20px_60px_rgba(0,0,0,.35),inset_0_0_0_.5px_var(--border-strong)]">
        {list.map((id, idx) => (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={idx === i}
            onPointerEnter={() => useSwitcher.getState().set(idx)}
            onClick={() => commitSwitch(id)}
            className={`flex w-[104px] flex-col items-center gap-1.5 rounded-[14px] p-2.5 ${idx === i ? 'bg-[var(--hover)]' : ''}`}
          >
            <AppIcon appId={id} size={72} />
            <span className={`max-w-full truncate text-[12px] ${idx === i ? 'font-semibold' : 'text-[var(--text-2)]'}`}>{apps[id].name}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
