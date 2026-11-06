import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { apps, dockOrder } from '@/apps/registry'
import { openApp, useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { useSettings } from '@/store/settingsStore'
import { useReduceMotion } from '@/hooks/system'
import { AppIcon } from '@/components/shared/AppIcon'
import type { AppId, MenuItem } from '@/types'
import { sounds } from '@/lib/sound'

function useViewportWidth() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

function launch(appId: AppId) {
  const ws = useWindows.getState()
  const app = apps[appId]
  const mine = Object.values(ws.windows).filter((w) => w.appId === appId)
  if (!app.launch && mine.length) {
    // Clicking a running app brings it forward, restoring a minimized window if that is all it has.
    const visible = mine.filter((w) => !w.minimized).sort((a, b) => b.z - a.z)
    if (visible.length) {
      if (ws.focusedId && mine.some((m) => m.id === ws.focusedId) && visible.length === mine.length) return
      ws.focus(visible[0].id)
    } else ws.restore(mine.sort((a, b) => b.z - a.z)[0].id)
    return
  }
  if (!app.launch) useDesktop.getState().bounceApp(appId)
  openApp(appId)
}

function dockMenu(appId: AppId): MenuItem[] {
  const ws = useWindows.getState()
  const app = apps[appId]
  const mine = Object.values(ws.windows).filter((w) => w.appId === appId)
  const items: MenuItem[] = []
  if (mine.length) {
    mine.forEach((w) => items.push({ label: w.title, checked: ws.focusedId === w.id, action: () => (w.minimized ? ws.restore(w.id) : ws.focus(w.id)) }))
    items.push({ label: '', separator: true })
  }
  if (app.multi) items.push({ label: 'New Window', action: () => openApp(appId) })
  if (!mine.length) items.push({ label: 'Open', action: () => launch(appId) })
  if (mine.length) {
    items.push({ label: 'Show All Windows', action: () => { ws.focus(mine[0].id); useDesktop.getState().setOverlay('expose') } })
    items.push({ label: 'Hide', action: () => mine.forEach((w) => ws.minimize(w.id)) })
    items.push({ label: '', separator: true })
    items.push({ label: 'Quit', shortcut: '⌥Q', action: () => ws.quitApp(appId) })
  }
  return items
}

interface ItemProps {
  mouseX: MotionValue<number>
  /** Where this icon's center sits when nothing is magnified. */
  center: number
  base: number
  magnify: number
  children: React.ReactNode
  label: string
  onClick: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  running?: boolean
  dataAttr?: Record<string, string>
  bounceKey?: number
}

function DockItem({ mouseX, center, base, magnify, children, label, onClick, onContextMenu, running, dataAttr, bounceKey }: ItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduce = useReduceMotion()
  // Distance to the resting center, not the live one: measuring live positions
  // feeds each icon's growth back into its neighbours and the Dock never settles.
  const distance = useTransform(mouseX, (x) => (Number.isFinite(x) ? x - center : Infinity))
  const size = useTransform(distance, [-base * 2.6, 0, base * 2.6], [base, base * magnify, base], { clamp: true })
  const spring = useSpring(size, { mass: 0.15, stiffness: 260, damping: 24 })
  const [hover, setHover] = useState(false)
  const [bouncing, setBouncing] = useState(false)

  useEffect(() => {
    if (!bounceKey || reduce) return
    setBouncing(true)
    const t = setTimeout(() => setBouncing(false), 1500)
    return () => clearTimeout(t)
  }, [bounceKey, reduce])

  // macOS-style: the slot widens so neighbours make room, while the icon itself
  // stays square and scales up from its bottom edge.
  const scale = useTransform(spring, (v) => v / base)
  const tooltipBottom = useTransform(spring, (v) => v + 12)

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={() => {
        sounds.click()
        onClick()
      }}
      onContextMenu={onContextMenu}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="relative flex shrink-0 justify-center outline-none"
      style={{ width: spring, height: base }}
      {...dataAttr}
    >
      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.14 }}
            className="menu-surface pointer-events-none absolute whitespace-nowrap px-2.5 py-[3px] text-[12px] font-medium text-[var(--text)]"
            style={{ borderRadius: 8, bottom: tooltipBottom }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      <motion.div
        className="absolute bottom-0"
        style={{ width: base, height: base, scale, originX: 0.5, originY: 1 }}
        animate={bouncing ? { y: [0, -22, 0, -12, 0, -5, 0] } : { y: 0 }}
        transition={bouncing ? { duration: 1.3, ease: 'easeOut' } : { duration: 0.2 }}
      >
        {children}
      </motion.div>
      <span
        className="absolute -bottom-[7px] h-[4px] w-[4px] rounded-full bg-[var(--menubar-text)] transition-opacity"
        style={{ opacity: running ? 0.8 : 0 }}
      />
    </motion.button>
  )
}

/** Fills whatever size the Dock item springs to. */
function Fill({ appId }: { appId: AppId }) {
  return (
    <div className="h-full w-full [&>.app-icon]:!h-full [&>.app-icon]:!w-full">
      <AppIcon appId={appId} size={64} />
    </div>
  )
}

export function Dock() {
  const mouseX = useMotionValue(Infinity)
  const preferred = useSettings((s) => s.dockSize)
  const vw = useViewportWidth()
  const magnifyOn = useSettings((s) => s.dockMagnify)
  const magnification = useSettings((s) => s.dockMagnification)
  const autoHide = useSettings((s) => s.dockAutoHide)
  const running = useWindows(useShallow((s) => Array.from(new Set(Object.values(s.windows).map((w) => w.appId)))))
  const minimized = useWindows(useShallow((s) => s.order.filter((id) => s.windows[id]?.minimized)))
  const windows = useWindows((s) => s.windows)
  const bounce = useDesktop((s) => s.bounce)
  const overlay = useDesktop((s) => s.overlay)
  const anyMaximized = useWindows((s) => Object.values(s.windows).some((w) => w.maximized && !w.minimized))
  const [revealed, setRevealed] = useState(false)
  const reduce = useReduceMotion()
  const magnify = magnifyOn && !reduce ? magnification : 1

  // Auto-hide: show when the pointer reaches the bottom edge.
  useEffect(() => {
    if (!autoHide) return
    const onMove = (e: PointerEvent) => {
      if (e.clientY >= window.innerHeight - 6) setRevealed(true)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [autoHide])

  const hidden = (autoHide && !revealed) || overlay === 'launchpad'
  const extraRunning = running.filter((id) => !dockOrder.includes(id) && id !== 'trash')
  // Shrink icons so the Dock always fits the screen, like macOS does.
  const count = dockOrder.length + extraRunning.length + minimized.length + 1
  const base = Math.max(28, Math.min(preferred, Math.floor((vw - 48 - count * 6) / count), Math.floor(window.innerHeight * 0.09)))

  // Resting layout: 7px padding, 6px gaps, and a 7px divider between apps and minimized windows.
  const GAP = 6
  const DIVIDER = 7
  const apps_ = dockOrder.length + extraRunning.length
  const icons = apps_ + minimized.length + 1
  const restWidth = 14 + icons * base + DIVIDER + icons * GAP
  const centers: number[] = []
  let x = (vw - restWidth) / 2 + 7
  for (let i = 0; i < icons; i++) {
    if (i === apps_) x += DIVIDER + GAP
    centers.push(x + base / 2)
    x += base + GAP
  }

  return (
    <motion.nav
      aria-label="Dock"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] flex justify-center"
      initial={false}
      animate={{ y: hidden ? base + 40 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 36 }}
      onPointerLeave={() => setRevealed(false)}
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
      data-maximized={anyMaximized || undefined}
    >
      <div
        className="liquid glass glass-edge pointer-events-auto flex items-end gap-[6px] rounded-[20px] px-[7px] pb-[6px] pt-[6px]"
        style={{ boxShadow: '0 10px 36px rgba(0,0,0,.22), inset 0 .5px 0 rgba(255,255,255,.45), inset 0 0 0 .5px rgba(255,255,255,.2), 0 0 0 .5px rgba(0,0,0,.22)', height: base + 12 }}
        onPointerMove={(e) => mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(Infinity)}
      >
        {[...dockOrder, ...extraRunning].map((id, i) => (
          <DockItem
            key={id}
            center={centers[i]}
            mouseX={mouseX}
            base={base}
            magnify={magnify}
            label={apps[id].name}
            running={running.includes(id)}
            onClick={() => launch(id)}
            onContextMenu={(e) => {
              e.preventDefault()
              useDesktop.getState().openContextMenu(e, dockMenu(id))
            }}
            dataAttr={{ 'data-dock-app': id }}
            bounceKey={bounce?.appId === id ? bounce.key : undefined}
          >
            <Fill appId={id} />
          </DockItem>
        ))}

        <div data-dock-divider className="mx-[3px] w-px self-stretch bg-[var(--menubar-text)] opacity-20" style={{ marginBottom: 4, marginTop: 4 }} />

        {minimized.map((wid, mi) => {
          const w = windows[wid]
          if (!w) return null
          return (
            <DockItem
              key={wid}
              center={centers[apps_ + mi]}
              mouseX={mouseX}
              base={base}
              magnify={magnify}
              label={w.title}
              onClick={() => useWindows.getState().restore(wid)}
              onContextMenu={(e) => {
                e.preventDefault()
                useDesktop.getState().openContextMenu(e, [
                  { label: 'Restore', action: () => useWindows.getState().restore(wid) },
                  { label: 'Close', action: () => useWindows.getState().close(wid) },
                ])
              }}
            >
              <div data-dock-window={wid} className="relative h-full w-full rounded-[10px] bg-[var(--surface-solid)] p-[12%] shadow-[0_2px_8px_rgba(0,0,0,.3)]">
                <div className="grid h-full w-full place-items-center rounded-[6px] bg-[var(--surface-3)] text-[9px] font-semibold text-[var(--text-2)]">
                  <span className="line-clamp-2 px-0.5 text-center leading-tight">{w.title}</span>
                </div>
                <div className="absolute -bottom-[2px] -right-[2px] h-[45%] w-[45%] [&>.app-icon]:!h-full [&>.app-icon]:!w-full">
                  <AppIcon appId={w.appId} size={24} />
                </div>
              </div>
            </DockItem>
          )
        })}

        <DockItem
          center={centers[icons - 1]}
          mouseX={mouseX}
          base={base}
          magnify={magnify}
          label="Trash"
          running={running.includes('trash')}
          onClick={() => openApp('trash')}
          onContextMenu={(e) => {
            e.preventDefault()
            useDesktop.getState().openContextMenu(e, [{ label: 'Open', action: () => openApp('trash') }])
          }}
          dataAttr={{ 'data-dock-app': 'trash' }}
        >
          <Fill appId="trash" />
        </DockItem>
      </div>
    </motion.nav>
  )
}
