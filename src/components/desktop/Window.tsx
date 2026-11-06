import { memo, Suspense, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { motion, type TargetAndTransition, type Transition } from 'motion/react'
import { MENU_BAR_HEIGHT, useWindows, workArea } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { getApp } from '@/apps/registry'
import { useReduceMotion } from '@/hooks/system'
import type { MissionCell } from '@/lib/missionLayout'
import type { Rect } from '@/types'
import { TrafficLights } from './TrafficLights'
import { Spinner } from '@/components/shared/ui'
import { AppCrashed, ErrorBoundary } from '@/components/shared/ErrorBoundary'

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const DIRS: Dir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

const handleClass: Record<Dir, string> = {
  n: 'top-[-3px] left-2 right-2 h-[7px] cursor-ns-resize',
  s: 'bottom-[-3px] left-2 right-2 h-[7px] cursor-ns-resize',
  e: 'right-[-3px] top-2 bottom-2 w-[7px] cursor-ew-resize',
  w: 'left-[-3px] top-2 bottom-2 w-[7px] cursor-ew-resize',
  ne: 'right-[-4px] top-[-4px] h-3 w-3 cursor-nesw-resize',
  sw: 'left-[-4px] bottom-[-4px] h-3 w-3 cursor-nesw-resize',
  nw: 'left-[-4px] top-[-4px] h-3 w-3 cursor-nwse-resize',
  se: 'right-[-4px] bottom-[-4px] h-3 w-3 cursor-nwse-resize',
}

function centerOf(selector: string): { x: number; y: number } | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

interface Props {
  id: string
  /** Set while Mission Control or App Exposé is open. */
  cell?: MissionCell
  /** Hidden by App Exposé because it belongs to another app. */
  dimmed?: boolean
}

export const Window = memo(function Window({ id, cell, dimmed }: Props) {
  const live = useWindows((s) => s.windows[id])
  // After close, the window stays mounted for its exit animation but is gone from the store.
  // Keep rendering its last known state instead of crashing the whole desktop.
  const last = useRef(live)
  if (live) last.current = live
  const win = live ?? last.current
  const closing = !live
  const focused = useWindows((s) => s.focusedId === id)
  const overlay = useDesktop((s) => s.overlay)
  const reduce = useReduceMotion()
  const [rectAnim, setRectAnim] = useState(false)
  const [hidden, setHidden] = useState(false)
  const dragging = useRef(false)
  const app = getApp(win.appId)
  const inMission = overlay === 'mission' || overlay === 'expose'

  // Animate the frame when it maximizes, snaps or restores, but not while dragging.
  const shapeKey = `${win.maximized}-${win.restoreRect ? 1 : 0}`
  const prevShape = useRef(shapeKey)
  useEffect(() => {
    if (prevShape.current === shapeKey) return
    prevShape.current = shapeKey
    if (dragging.current || reduce) return
    setRectAnim(true)
    const t = setTimeout(() => setRectAnim(false), 340)
    return () => clearTimeout(t)
  }, [shapeKey, reduce])

  useEffect(() => {
    if (!win.minimized) setHidden(false)
  }, [win.minimized])

  // Keyboard focus follows window focus, so shortcuts never stay stuck in a window behind.
  const frameRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!focused) return
    const el = frameRef.current
    const active = document.activeElement
    if (el && !el.contains(active)) {
      // Let the app autofocus its own field first (Terminal, Spotlight-like inputs).
      const t = setTimeout(() => {
        if (!el.contains(document.activeElement)) el.focus({ preventScroll: true })
      }, 60)
      return () => clearTimeout(t)
    }
  }, [focused])

  const cx = win.x + win.w / 2
  const cy = win.y + win.h / 2

  // Where the window comes from: its Dock icon, if it has one.
  const [initial] = useState<TargetAndTransition>(() => {
    if (reduce) return { opacity: 0 }
    const from = centerOf(`[data-dock-app="${win.appId}"]`)
    if (!from) return { opacity: 0, scale: 0.92, y: 12 }
    return { opacity: 0, scale: 0.15, x: from.x - cx, y: from.y - cy }
  })

  let target: TargetAndTransition
  if (win.minimized) {
    const to = centerOf('[data-dock-divider]') ?? { x: window.innerWidth - 120, y: window.innerHeight - 30 }
    target = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.06, x: to.x - cx, y: to.y - cy }
  } else if (cell) {
    target = { opacity: 1, scale: cell.scale, x: cell.dx, y: cell.dy }
  } else if (dimmed) {
    target = { opacity: 0, scale: 0.92, x: 0, y: 0 }
  } else {
    target = { opacity: 1, scale: 1, x: 0, y: 0 }
  }

  const transition: Transition = reduce
    ? { duration: 0.12 }
    : win.minimized
      ? { duration: 0.42, ease: [0.4, 0, 0.2, 1] }
      : { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }

  const store = useWindows.getState

  const startDrag = (e: RPointerEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement
    if (e.button !== 0 || inMission) return
    if (!t.closest('[data-drag-region]') || t.closest('button, input, textarea, select, a, [data-no-drag]')) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const w0 = store().windows[id]
    let origin = { x: w0.x, y: w0.y }
    let restored = false
    let moved = false
    dragging.current = true
    const vw = window.innerWidth

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return
      moved = true
      const cur = store().windows[id]
      // Dragging a zoomed or snapped window restores its size under the cursor.
      if (!restored && (cur.maximized || cur.restoreRect)) {
        restored = true
        const r = cur.restoreRect ?? cur
        const ratio = (startX - cur.x) / cur.w
        origin = { x: startX - r.w * ratio, y: cur.y }
        store().setRect(id, { w: r.w, h: r.h })
        useWindows.setState((s) => ({
          windows: { ...s.windows, [id]: { ...s.windows[id], maximized: false, restoreRect: null } },
        }))
      }
      const x = Math.round(origin.x + dx)
      const y = Math.round(Math.max(MENU_BAR_HEIGHT, origin.y + dy))
      store().setRect(id, { x, y })

      const area = workArea()
      let preview: Rect | null = null
      if (ev.clientX <= 3) preview = { x: 0, y: area.y, w: Math.round(area.w / 2), h: area.h }
      else if (ev.clientX >= vw - 3) preview = { x: Math.round(area.w / 2), y: area.y, w: Math.round(area.w / 2), h: area.h }
      else if (ev.clientY <= MENU_BAR_HEIGHT + 1) preview = area
      if (JSON.stringify(preview) !== JSON.stringify(useDesktop.getState().snapPreview)) useDesktop.getState().setSnapPreview(preview)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      dragging.current = false
      const preview = useDesktop.getState().snapPreview
      if (preview) {
        setRectAnim(true)
        setTimeout(() => setRectAnim(false), 340)
        store().snap(id, preview)
        useDesktop.getState().setSnapPreview(null)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const startResize = (dir: Dir) => (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || inMission) return
    e.preventDefault()
    e.stopPropagation()
    const start = { ...store().windows[id] }
    const min = app.minSize ?? { w: 320, h: 220 }
    const sx = e.clientX
    const sy = e.clientY
    dragging.current = true
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      let { x, y, w, h } = start
      if (dir.includes('e')) w = Math.max(min.w, start.w + dx)
      if (dir.includes('s')) h = Math.max(min.h, start.h + dy)
      if (dir.includes('w')) {
        w = Math.max(min.w, start.w - dx)
        x = start.x + (start.w - w)
      }
      if (dir.includes('n')) {
        const maxUp = start.y - MENU_BAR_HEIGHT
        h = Math.max(min.h, start.h - Math.max(dy, -maxUp))
        y = start.y + (start.h - h)
      }
      useWindows.setState((s) => ({
        windows: { ...s.windows, [id]: { ...s.windows[id], x, y, w, h, maximized: false, restoreRect: null } },
      }))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (!t.closest('[data-drag-region]') || t.closest('button, input, a, [data-no-drag]')) return
    store().toggleMaximize(id)
  }

  const onContextMenu = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement
    if (!t.closest('[data-drag-region]') || t.closest('input, textarea')) return
    e.preventDefault()
    const area = workArea()
    useDesktop.getState().openContextMenu(e, [
      { label: 'Minimize', shortcut: '⌥M', action: () => store().minimize(id) },
      { label: win.maximized ? 'Restore' : 'Zoom', action: () => store().toggleMaximize(id) },
      { label: 'Tile Window to Left of Screen', action: () => store().snap(id, { x: 0, y: area.y, w: Math.round(area.w / 2), h: area.h }) },
      { label: 'Tile Window to Right of Screen', action: () => store().snap(id, { x: Math.round(area.w / 2), y: area.y, w: Math.round(area.w / 2), h: area.h }) },
      { label: '', separator: true },
      { label: 'Close Window', shortcut: '⌥W', action: () => store().close(id) },
    ])
  }

  const Content = app.component!
  const radius = win.maximized ? 0 : 10

  return (
    <motion.div
      role="dialog"
      aria-label={win.title}
      aria-hidden={win.minimized || undefined}
      data-window-id={id}
      data-closing={closing || undefined}
      data-focused={focused || undefined}
      ref={frameRef}
      tabIndex={-1}
      initial={initial}
      animate={target}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
      transition={transition}
      onAnimationComplete={() => {
        if (useWindows.getState().windows[id]?.minimized) setHidden(true)
      }}
      onPointerDownCapture={() => {
        if (!inMission) store().focus(id)
      }}
      onPointerDown={startDrag}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className="absolute flex flex-col outline-none"
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: win.z,
        borderRadius: radius,
        boxShadow: focused ? 'var(--window-shadow)' : 'var(--window-shadow-inactive)',
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: win.minimized || dimmed || closing ? 'none' : 'auto',
        transition: rectAnim ? 'left .32s cubic-bezier(.2,.8,.2,1), top .32s cubic-bezier(.2,.8,.2,1), width .32s cubic-bezier(.2,.8,.2,1), height .32s cubic-bezier(.2,.8,.2,1)' : 'box-shadow .2s',
        willChange: 'transform',
      }}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden" style={{ borderRadius: radius }}>
        {app.chromeless ? (
          <div className="absolute left-0 top-0 z-30 flex h-[52px] items-center pl-[18px]" data-drag-region>
            <TrafficLights id={id} focused={focused} />
          </div>
        ) : (
          <div
            data-drag-region
            className="glass-strong relative z-20 flex h-[38px] shrink-0 items-center border-b border-[var(--border)] px-[14px]"
          >
            <TrafficLights id={id} focused={focused} />
            <div className={`pointer-events-none absolute inset-x-24 truncate text-center text-[13px] font-semibold ${focused ? 'text-[var(--text)]' : 'text-[var(--text-3)]'}`}>
              {win.title}
            </div>
          </div>
        )}
        <div className="relative min-h-0 flex-1 bg-[var(--surface-solid)]" style={app.chromeless ? { background: 'transparent' } : undefined}>
          <Suspense
            fallback={
              <div className="grid h-full place-items-center bg-[var(--surface-solid)]">
                <Spinner />
              </div>
            }
          >
            <ErrorBoundary fallback={(_, reset) => <AppCrashed name={app.name} onReopen={reset} />}>
              <Content windowId={id} props={win.props} />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>

      {inMission && !dimmed && (
        <button
          type="button"
          aria-label={`Show ${win.title}`}
          className="absolute inset-0 z-50 rounded-[12px] outline-none ring-[var(--accent)] transition hover:ring-[6px]"
          onClick={() => {
            store().focus(id)
            useDesktop.getState().setOverlay(null)
          }}
        />
      )}

      {!win.maximized &&
        !inMission &&
        DIRS.map((d) => <div key={d} aria-hidden className={`absolute z-40 touch-none ${handleClass[d]}`} onPointerDown={startResize(d)} />)}
    </motion.div>
  )
})
