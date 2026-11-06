import { useEffect, useState, useSyncExternalStore } from 'react'
import { useSettings } from '@/store/settingsStore'

/** Current time, ticking on the second (or minute) boundary. */
export function useClock(granularity: 'second' | 'minute' = 'second') {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const d = new Date()
      setNow(d)
      const ms = granularity === 'second' ? 1000 - d.getMilliseconds() : 60000 - d.getSeconds() * 1000 - d.getMilliseconds()
      timer = setTimeout(tick, ms + 5)
    }
    tick()
    return () => clearTimeout(timer)
  }, [granularity])
  return now
}

function mediaStore(query: string) {
  return {
    subscribe: (cb: () => void) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    get: () => window.matchMedia(query).matches,
  }
}

export function useMedia(query: string) {
  const [store] = useState(() => mediaStore(query))
  return useSyncExternalStore(store.subscribe, store.get, () => false)
}

/** Phones get the launcher shell instead of the desktop. */
export function useIsMobile() {
  return useMedia('(max-width: 767px), (max-height: 500px) and (pointer: coarse)')
}

export function useIsTouch() {
  return useMedia('(pointer: coarse)')
}

/** True when the visitor's OS asks for less motion or Settings turns it off. */
export function useReduceMotion() {
  const os = useMedia('(prefers-reduced-motion: reduce)')
  const setting = useSettings((s) => s.reduceMotion)
  return os || setting
}

export function useIsDark() {
  const appearance = useSettings((s) => s.appearance)
  const osDark = useMedia('(prefers-color-scheme: dark)')
  return appearance === 'dark' || (appearance === 'auto' && osDark)
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
export const MOD = isMac ? '⌘' : 'Ctrl+'
export const ALT = isMac ? '⌥' : 'Alt+'

export function formatTime(d: Date, opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }) {
  return d.toLocaleTimeString(undefined, opts)
}
