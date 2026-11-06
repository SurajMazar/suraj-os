import { useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { useLayout } from '@/store/layoutStore'
import { MENU_BAR_HEIGHT } from '@/store/windowStore'

/**
 * Lets a desktop item (icon or widget) be dragged anywhere on the desktop.
 * The position is stored as an offset from the item's home spot, so the default
 * layout still adapts to the screen and "Clean Up" simply clears the offsets.
 * A press that moves less than 4px is a click, so selection and double-click keep working.
 */
export function useDesktopDrag(key: string) {
  const offset = useLayout((s) => s.offsets[key]) ?? { x: 0, y: 0 }
  const z = useLayout((s) => s.stack[key])
  const [dragging, setDragging] = useState(false)
  const moved = useRef(false)

  const onPointerDown = (e: RPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    const el = e.currentTarget
    const start = { x: e.clientX, y: e.clientY }
    const base = { ...offset }
    const rect = el.getBoundingClientRect()
    moved.current = false

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x
      const dy = ev.clientY - start.y
      if (!moved.current && Math.hypot(dx, dy) < 4) return
      if (!moved.current) {
        moved.current = true
        setDragging(true)
        useLayout.getState().raise(key)
      }
      // Keep the item fully on screen, below the menu bar.
      const minDx = -rect.left + 4
      const maxDx = window.innerWidth - rect.right - 4
      const minDy = MENU_BAR_HEIGHT + 4 - rect.top
      const maxDy = window.innerHeight - rect.bottom - 4
      useLayout.getState().setOffset(key, {
        x: base.x + Math.min(maxDx, Math.max(minDx, dx)),
        y: base.y + Math.min(maxDy, Math.max(minDy, dy)),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      setDragging(false)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return {
    dragging,
    /** True right after a drag, so the click that ends it can be ignored. */
    wasDragged: () => moved.current,
    style: {
      transform: offset.x || offset.y ? `translate3d(${offset.x}px, ${offset.y}px, 0)` : undefined,
      zIndex: dragging ? 999 : z,
      position: 'relative' as const,
      touchAction: 'none' as const,
    },
    onPointerDown,
  }
}
