import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Appearance = 'light' | 'dark' | 'auto'
export type WallpaperId = 'chameleon' | 'picture' | 'kathmandu' | 'kathmandu-paint' | 'liquid' | 'aurora' | 'himalaya' | 'sunset' | 'ocean' | 'graphite' | 'custom'

export interface SettingsState {
  appearance: Appearance
  wallpaper: WallpaperId
  customGradient: [string, string]
  dockSize: number
  dockMagnification: number
  dockMagnify: boolean
  dockAutoHide: boolean
  showDesktopIcons: boolean
  showWidgets: boolean
  sound: boolean
  volume: number
  brightness: number
  reduceMotion: boolean
  startupOnLoad: boolean
  notificationBanners: boolean
  wifi: boolean
  bluetooth: boolean
  airdrop: boolean
  focus: boolean
}

interface SettingsActions {
  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  reset: () => void
}

export const defaultSettings: SettingsState = {
  appearance: 'dark',
  wallpaper: 'chameleon',
  customGradient: ['#4f46e5', '#ec4899'],
  dockSize: 52,
  dockMagnification: 1.7,
  dockMagnify: true,
  dockAutoHide: false,
  showDesktopIcons: true,
  showWidgets: true,
  sound: true,
  volume: 0.5,
  brightness: 1,
  reduceMotion: false,
  startupOnLoad: false,
  notificationBanners: true,
  wifi: true,
  bluetooth: true,
  airdrop: false,
  focus: false,
}

export const useSettings = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      reset: () => set({ ...defaultSettings }),
    }),
    {
      name: 'surajos-settings',
      version: 4,
      // v4 made Suraj's chosen artwork the default wallpaper.
      migrate: (state, version) => {
        const s = state as SettingsState
        return version < 4 ? { ...s, wallpaper: 'chameleon' } : s
      },
    },
  ),
)

export const getSettings = () => useSettings.getState()
