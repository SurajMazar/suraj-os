import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { missionLayout } from '@/lib/missionLayout'
import { Window } from './Window'

/** Hook shared by the window layer and the Mission Control labels. */
export function useMissionCells() {
  const overlay = useDesktop((s) => s.overlay)
  const windows = useWindows((s) => s.windows)
  const order = useWindows((s) => s.order)
  const focusedId = useWindows((s) => s.focusedId)
  return useMemo(() => {
    if (overlay !== 'mission' && overlay !== 'expose') return { cells: null, exposeApp: null }
    const exposeApp = overlay === 'expose' && focusedId ? windows[focusedId]?.appId : null
    const list = order
      .map((id) => windows[id])
      .filter((w) => w && !w.minimized && (!exposeApp || w.appId === exposeApp))
    return { cells: missionLayout(list, window.innerWidth, window.innerHeight), exposeApp }
    // Positions are frozen when the overlay opens; windows do not move while it is up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay, order.length])
}

export function WindowManager() {
  const order = useWindows((s) => s.order)
  const windows = useWindows((s) => s.windows)
  const snapPreview = useDesktop((s) => s.snapPreview)
  const { cells, exposeApp } = useMissionCells()

  return (
    <div className="pointer-events-none absolute inset-0 z-[3] [&>*]:pointer-events-auto">
      <AnimatePresence>
        {snapPreview && (
          <motion.div
            key="snap"
            className="pointer-events-none absolute rounded-[12px] border border-white/40 bg-white/15 backdrop-blur-md"
            style={{ zIndex: 1 }}
            initial={{ opacity: 0, left: snapPreview.x + 40, top: snapPreview.y + 40, width: snapPreview.w - 80, height: snapPreview.h - 80 }}
            animate={{ opacity: 1, left: snapPreview.x + 6, top: snapPreview.y + 6, width: snapPreview.w - 12, height: snapPreview.h - 12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {order.map((id) => (
          <Window
            key={id}
            id={id}
            cell={cells?.[id]}
            dimmed={!!cells && !!exposeApp && windows[id]?.appId !== exposeApp}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
