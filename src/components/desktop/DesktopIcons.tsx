import { motion } from 'motion/react'
import { DESKTOP_DIR, fs, type FsNode } from '@/data/fs'
import { useDesktopDrag } from '@/hooks/useDesktopDrag'
import { useDesktop } from '@/store/desktopStore'
import { useSettings } from '@/store/settingsStore'
import { openFile } from '@/lib/openFile'
import { FileIcon } from '@/components/shared/FileIcon'
import { MENU_BAR_HEIGHT } from '@/store/windowStore'

export function fileMenu(id: string) {
  return [
    { label: 'Open', action: () => openFile(id) },
    { label: 'Quick Look', shortcut: 'Space', action: () => useDesktop.getState().setQuickLook(id) },
  ]
}

function DesktopIcon({ n, i, selected }: { n: FsNode; i: number; selected: boolean }) {
  const drag = useDesktopDrag(`icon:${n.id}`)
  return (
    <div style={drag.style} onPointerDown={drag.onPointerDown} className={drag.dragging ? 'opacity-80' : ''}>
      <motion.button
        type="button"
        role="option"
        aria-selected={selected}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 + i * 0.05 }}
        whileHover={drag.dragging ? undefined : { scale: 1.04 }}
        onClick={(e) => {
          e.stopPropagation()
          useDesktop.getState().selectFile(n.id)
        }}
        onDoubleClick={() => {
          if (!drag.wasDragged()) openFile(n)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') openFile(n)
        }}
        onFocus={() => useDesktop.getState().selectFile(n.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          useDesktop.getState().selectFile(n.id)
          useDesktop.getState().openContextMenu(e, fileMenu(n.id))
        }}
        className="flex w-[104px] flex-col items-center gap-1 rounded-[6px] p-1.5 outline-none"
      >
        <div className={`grid h-[60px] w-[66px] place-items-center rounded-[6px] ${selected ? 'bg-black/25 ring-1 ring-white/20' : ''}`}>
          <FileIcon node={n} size={52} />
        </div>
        <span
          className={`line-clamp-2 max-w-full rounded-[4px] px-1 text-center text-[12px] [overflow-wrap:anywhere] font-medium leading-tight text-white ${selected ? 'bg-[var(--selection)]' : ''}`}
          style={{ textShadow: selected ? 'none' : '0 1px 2px rgba(0,0,0,.85), 0 0 10px rgba(0,0,0,.45)' }}
        >
          {n.name}
        </span>
      </motion.button>
    </div>
  )
}

export function DesktopIcons() {
  const show = useSettings((s) => s.showDesktopIcons)
  const selected = useDesktop((s) => s.selectedFile)
  const items = fs.children(DESKTOP_DIR)
  if (!show) return null
  return (
    <div
      role="listbox"
      aria-label="Desktop"
      className="absolute right-3 z-[1] flex flex-col flex-wrap-reverse content-start items-center gap-1"
      style={{ top: MENU_BAR_HEIGHT + 14, maxHeight: 'calc(100% - 140px)' }}
    >
      {items.map((n, i) => (
        <DesktopIcon key={n.id} n={n} i={i} selected={selected === n.id} />
      ))}
    </div>
  )
}
