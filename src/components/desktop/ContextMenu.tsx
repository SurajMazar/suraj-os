import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useDesktop } from '@/store/desktopStore'
import { MenuList } from './MenuList'

export function ContextMenu() {
  const menu = useDesktop((s) => s.contextMenu)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    if (!menu || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({
      x: Math.min(menu.x, window.innerWidth - r.width - 6),
      y: menu.y + r.height > window.innerHeight - 6 ? Math.max(30, menu.y - r.height) : menu.y,
    })
  }, [menu])

  if (!menu) return null
  return (
    <div className="absolute inset-0 z-[50]" onPointerDown={() => useDesktop.getState().closeContextMenu()} onContextMenu={(e) => { e.preventDefault(); useDesktop.getState().closeContextMenu() }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.1 }}
        className="absolute origin-top-left"
        style={{ left: pos?.x ?? menu.x, top: pos?.y ?? menu.y, visibility: pos ? 'visible' : 'hidden' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MenuList items={menu.items} onDone={() => useDesktop.getState().closeContextMenu()} />
      </motion.div>
    </div>
  )
}
