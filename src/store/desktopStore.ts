import { create } from 'zustand'
import type { AppId, MenuItem, Rect } from '@/types'
import { notificationsSeed } from '@/portfolio.config'
import { sounds } from '@/lib/sound'

export type Overlay = 'spotlight' | 'launchpad' | 'mission' | 'expose' | 'switcher' | null
export type Panel = 'control' | 'notifications' | 'wifi' | 'bluetooth' | 'battery' | 'sound' | null
export type SystemState = 'on' | 'locked' | 'sleep' | 'booting' | 'off'

export interface Notification {
  id: string
  app: AppId
  title: string
  body: string
  time: number
}

interface ContextMenuState {
  x: number
  y: number
  items: MenuItem[]
}

interface DesktopStore {
  overlay: Overlay
  panel: Panel
  system: SystemState
  contextMenu: ContextMenuState | null
  quickLook: string | null
  selectedFile: string | null
  notifications: Notification[]
  banner: Notification | null
  recents: string[]
  snapPreview: Rect | null
  bounce: { appId: AppId; key: number } | null
  /** Bumped by "Restart" so the boot screen knows it is a restart. */
  bootReason: 'load' | 'restart' | 'power'
  setOverlay: (o: Overlay) => void
  toggleOverlay: (o: Exclude<Overlay, null>) => void
  setPanel: (p: Panel) => void
  togglePanel: (p: Exclude<Panel, null>) => void
  setSystem: (s: SystemState, reason?: DesktopStore['bootReason']) => void
  openContextMenu: (e: { clientX: number; clientY: number }, items: MenuItem[]) => void
  closeContextMenu: () => void
  setQuickLook: (fileId: string | null) => void
  selectFile: (fileId: string | null) => void
  addRecent: (fileId: string) => void
  pushNotification: (n: Omit<Notification, 'time'>, banner?: boolean) => void
  dismissNotification: (id: string) => void
  clearNotifications: () => void
  setBanner: (n: Notification | null) => void
  setSnapPreview: (r: Rect | null) => void
  bounceApp: (appId: AppId) => void
}

export const useDesktop = create<DesktopStore>((set, get) => ({
  overlay: null,
  panel: null,
  // Visitors arrive at the lock screen; one click or Return unlocks.
  system: 'locked',
  contextMenu: null,
  quickLook: null,
  selectedFile: null,
  notifications: notificationsSeed.map((n, i) => ({ ...n, app: n.app as AppId, time: Date.now() - i * 1000 * 60 * 7 })),
  banner: null,
  recents: [],
  snapPreview: null,
  bounce: null,
  bootReason: 'load',

  setOverlay: (overlay) => set({ overlay, panel: null, contextMenu: null }),
  toggleOverlay: (o) => set({ overlay: get().overlay === o ? null : o, panel: null, contextMenu: null }),
  setPanel: (panel) => set({ panel, contextMenu: null }),
  togglePanel: (p) => set({ panel: get().panel === p ? null : p, contextMenu: null }),
  setSystem: (system, reason) => {
    if (system === 'locked' && get().system === 'on') sounds.lock()
    if (system === 'on' && get().system === 'locked') sounds.unlock()
    set({ system, overlay: null, panel: null, contextMenu: null, bootReason: reason ?? get().bootReason })
  },
  openContextMenu: (e, items) => set({ contextMenu: { x: e.clientX, y: e.clientY, items }, panel: null }),
  closeContextMenu: () => set({ contextMenu: null }),
  setQuickLook: (quickLook) => set({ quickLook }),
  selectFile: (selectedFile) => set({ selectedFile }),
  addRecent: (id) => set({ recents: [id, ...get().recents.filter((r) => r !== id)].slice(0, 12) }),
  pushNotification: (n, banner = true) => {
    const full = { ...n, time: Date.now() }
    if (banner) sounds.notify()
    set({ notifications: [full, ...get().notifications.filter((x) => x.id !== n.id)], banner: banner ? full : get().banner })
  },
  dismissNotification: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),
  clearNotifications: () => set({ notifications: [] }),
  setBanner: (banner) => set({ banner }),
  setSnapPreview: (snapPreview) => set({ snapPreview }),
  bounceApp: (appId) => set({ bounce: { appId, key: Date.now() } }),
}))
