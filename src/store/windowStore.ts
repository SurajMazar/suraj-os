import { create } from 'zustand'
import type { AppId, DesktopWindow, Rect, WindowProps } from '@/types'
import { getApp } from '@/apps/registry'
import { getSettings } from './settingsStore'
import { sounds } from '@/lib/sound'

export const MENU_BAR_HEIGHT = 28

/** The area windows may occupy: below the menu bar, above the Dock. */
export function workArea(): Rect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const s = getSettings()
  const dockReserve = s.dockAutoHide ? 8 : s.dockSize + 28
  return { x: 0, y: MENU_BAR_HEIGHT, w: vw, h: vh - MENU_BAR_HEIGHT - dockReserve }
}

interface WindowStore {
  windows: Record<string, DesktopWindow>
  /** Window ids, oldest first. */
  order: string[]
  focusedId: string | null
  topZ: number
  open: (appId: AppId, props?: WindowProps) => string | null
  close: (id: string) => void
  quitApp: (appId: AppId) => void
  focus: (id: string) => void
  minimize: (id: string) => void
  restore: (id: string) => void
  toggleMaximize: (id: string) => void
  setRect: (id: string, rect: Partial<Rect>) => void
  snap: (id: string, rect: Rect) => void
  setTitle: (id: string, title: string) => void
  setProps: (id: string, props: WindowProps) => void
  closeAll: () => void
  /** After the browser window resizes: keep every window reachable and refit zoomed ones. */
  fitToViewport: () => void
}

let counter = 0

function clampRect(r: Rect): Rect {
  const area = workArea()
  const w = Math.min(r.w, area.w)
  const h = Math.min(r.h, area.h)
  const x = Math.min(Math.max(r.x, area.x - w + 120), area.x + area.w - 120)
  // (x may hang off either side, but at least 120px of the title bar stays visible.)
  const y = Math.min(Math.max(r.y, area.y), area.y + area.h - 40)
  return { x, y, w, h }
}

function topVisible(windows: Record<string, DesktopWindow>, exclude?: string): string | null {
  let best: DesktopWindow | null = null
  for (const w of Object.values(windows)) {
    if (w.id === exclude || w.minimized) continue
    if (!best || w.z > best.z) best = w
  }
  return best?.id ?? null
}

export const useWindows = create<WindowStore>((set, get) => ({
  windows: {},
  order: [],
  focusedId: null,
  topZ: 10,

  open: (appId, props = {}) => {
    const app = getApp(appId)
    if (app.launch) {
      app.launch()
      return null
    }
    const state = get()
    if (!app.multi) {
      const existing = Object.values(state.windows).find((w) => w.appId === appId)
      if (existing) {
        if (Object.keys(props).length) get().setProps(existing.id, props)
        if (existing.minimized) get().restore(existing.id)
        else get().focus(existing.id)
        return existing.id
      }
    }
    // TextEdit opens one window per file.
    if (appId === 'textedit' && props.fileId) {
      const existing = Object.values(state.windows).find((w) => w.appId === 'textedit' && w.props.fileId === props.fileId)
      if (existing) {
        if (existing.minimized) get().restore(existing.id)
        else get().focus(existing.id)
        return existing.id
      }
    }

    const area = workArea()
    const sameApp = Object.values(state.windows).filter((w) => w.appId === appId).length
    const cascade = (Object.keys(state.windows).length % 6) * 26 + sameApp * 8
    // Small screens (tablets): windows open nearly full width, cascading downward only.
    const compact = area.w < 1024
    const w = compact ? area.w - 16 : Math.min(app.size.w, area.w - 24)
    const h = Math.min(app.size.h, area.h - 16)
    const rawX = compact ? 8 : Math.round(area.x + (area.w - w) / 2 + cascade - 60)
    const rawY = Math.round(area.y + (compact ? 8 + (cascade % 120) : Math.max(12, (area.h - h) / 2 - 20) + cascade * 0.6))
    const rect = {
      x: Math.min(Math.max(8, rawX), Math.max(8, area.w - w - 8)),
      y: Math.min(Math.max(area.y + 4, rawY), Math.max(area.y + 4, area.y + area.h - h - 4)),
      w,
      h,
    }
    const id = `${appId}-${++counter}`
    const z = state.topZ + 1
    const win: DesktopWindow = {
      id,
      appId,
      title: (props.title as string) ?? app.name,
      ...rect,
      z,
      minimized: false,
      maximized: false,
      restoreRect: null,
      props,
      openedAt: Date.now(),
    }
    sounds.open()
    set({ windows: { ...state.windows, [id]: win }, order: [...state.order, id], focusedId: id, topZ: z })
    return id
  },

  close: (id) => {
    const { windows, order, focusedId } = get()
    if (!windows[id]) return
    const next = { ...windows }
    delete next[id]
    sounds.close()
    set({
      windows: next,
      order: order.filter((o) => o !== id),
      focusedId: focusedId === id ? topVisible(next) : focusedId,
    })
  },

  quitApp: (appId) => {
    const { windows, order, focusedId } = get()
    const next = Object.fromEntries(Object.entries(windows).filter(([, w]) => w.appId !== appId))
    if (Object.keys(next).length === Object.keys(windows).length) return
    sounds.close()
    set({
      windows: next,
      order: order.filter((o) => next[o]),
      focusedId: focusedId && next[focusedId] ? focusedId : topVisible(next),
    })
  },

  focus: (id) => {
    const { windows, topZ, focusedId } = get()
    const w = windows[id]
    if (!w) return
    if (focusedId === id && w.z === topZ && !w.minimized) return
    const z = topZ + 1
    set({ windows: { ...windows, [id]: { ...w, z, minimized: false } }, focusedId: id, topZ: z })
  },

  minimize: (id) => {
    const { windows } = get()
    const w = windows[id]
    if (!w || w.minimized) return
    const next = { ...windows, [id]: { ...w, minimized: true } }
    sounds.minimize()
    set({ windows: next, focusedId: topVisible(next) })
  },

  restore: (id) => {
    const { windows, topZ } = get()
    const w = windows[id]
    if (!w) return
    const z = topZ + 1
    sounds.restore()
    set({ windows: { ...windows, [id]: { ...w, minimized: false, z } }, focusedId: id, topZ: z })
  },

  toggleMaximize: (id) => {
    const { windows, topZ } = get()
    const w = windows[id]
    if (!w) return
    const z = topZ + 1
    if (w.maximized || w.restoreRect) {
      const r = w.restoreRect ?? { x: w.x, y: w.y, w: w.w, h: w.h }
      set({ windows: { ...windows, [id]: { ...w, ...r, maximized: false, restoreRect: null, z } }, focusedId: id, topZ: z })
    } else {
      const area = workArea()
      set({
        windows: {
          ...windows,
          [id]: { ...w, ...area, maximized: true, restoreRect: { x: w.x, y: w.y, w: w.w, h: w.h }, z },
        },
        focusedId: id,
        topZ: z,
      })
    }
  },

  setRect: (id, rect) => {
    const { windows } = get()
    const w = windows[id]
    if (!w) return
    set({ windows: { ...windows, [id]: { ...w, ...rect } } })
  },

  snap: (id, rect) => {
    const { windows } = get()
    const w = windows[id]
    if (!w) return
    const area = workArea()
    const isFull = rect.w >= area.w && rect.h >= area.h
    set({
      windows: {
        ...windows,
        [id]: {
          ...w,
          ...rect,
          maximized: isFull,
          restoreRect: w.restoreRect ?? { x: w.x, y: w.y, w: w.w, h: w.h },
        },
      },
    })
  },

  setTitle: (id, title) => {
    const { windows } = get()
    const w = windows[id]
    if (!w || w.title === title) return
    set({ windows: { ...windows, [id]: { ...w, title } } })
  },

  setProps: (id, props) => {
    const { windows } = get()
    const w = windows[id]
    if (!w) return
    set({ windows: { ...windows, [id]: { ...w, props: { ...w.props, ...props, nonce: Date.now() } } } })
  },

  closeAll: () => set({ windows: {}, order: [], focusedId: null }),

  fitToViewport: () => {
    const { windows } = get()
    const area = workArea()
    const next: Record<string, DesktopWindow> = {}
    for (const [id, w] of Object.entries(windows)) {
      next[id] = w.maximized ? { ...w, ...area } : { ...w, ...clampRect(w) }
    }
    set({ windows: next })
  },
}))

export const openApp = (appId: AppId, props?: WindowProps) => useWindows.getState().open(appId, props)

/** The app whose name shows in the menu bar. Finder when nothing is focused. */
export function useActiveAppId(): AppId {
  return useWindows((s) => (s.focusedId ? s.windows[s.focusedId]?.appId : undefined) ?? 'finder')
}
