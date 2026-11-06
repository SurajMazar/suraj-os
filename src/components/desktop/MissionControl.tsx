import { motion } from 'motion/react'
import { useDesktop } from '@/store/desktopStore'
import { useWindows } from '@/store/windowStore'
import { apps } from '@/apps/registry'
import { AppIcon } from '@/components/shared/AppIcon'
import { useMissionCells } from './WindowManager'

/** The dimmed backdrop behind windows during Mission Control and App Exposé. */
export function MissionBackdrop() {
  const overlay = useDesktop((s) => s.overlay)
  const { exposeApp } = useMissionCells()
  const count = useWindows((s) => Object.values(s.windows).filter((w) => !w.minimized && (!exposeApp || w.appId === exposeApp)).length)
  return (
    <motion.div
      className="absolute inset-0 z-[2]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ background: 'rgba(0,0,0,.38)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      onClick={() => useDesktop.getState().setOverlay(null)}
    >
      <div className="flex justify-center pt-9">
        <div className="rounded-[10px] bg-white/10 px-4 py-1.5 text-[12px] font-semibold text-white/85 shadow-[inset_0_0_0_.5px_rgba(255,255,255,.25)]">
          {overlay === 'expose' && exposeApp ? `${apps[exposeApp].name} windows` : 'Mission Control'}
        </div>
      </div>
      {count === 0 && <div className="absolute inset-0 grid place-items-center text-[15px] font-medium text-white/70">No open windows. Click anywhere to go back.</div>}
    </motion.div>
  )
}

/** Window titles under each thumbnail; drawn above the window layer. */
export function MissionLabels() {
  const { cells } = useMissionCells()
  const windows = useWindows((s) => s.windows)
  if (!cells) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-[4]">
      {Object.entries(cells).map(([id, c]) => {
        const w = windows[id]
        if (!w) return null
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.15 }}
            className="absolute flex -translate-x-1/2 items-center gap-1.5 rounded-[7px] bg-black/45 px-2 py-1 text-[12px] font-medium text-white"
            style={{ left: c.cx, top: c.cy + c.sh / 2 + 10 }}
          >
            <AppIcon appId={w.appId} size={16} />
            <span className="max-w-[220px] truncate">{w.title}</span>
          </motion.div>
        )
      })}
    </div>
  )
}
