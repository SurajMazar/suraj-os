import { useEffect } from 'react'
import { useDesktop } from '@/store/desktopStore'
import { openApp, useWindows } from '@/store/windowStore'
import { sendAppCommand } from '@/lib/appEvents'
import { commitSwitch, switcherApps, useSwitcher } from '@/components/desktop/AppSwitcher'
import { isMac } from './system'

function isTyping(t: EventTarget | null) {
  const el = t as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

/** Terminal has no use for Option characters, so window shortcuts still work there. */
const inTerminal = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.('[data-terminal]')

/**
 * Global shortcuts. Browsers and operating systems reserve several macOS combos
 * (⌘Space, ⌘W, ⌘Q, ⌘Tab, Ctrl+↑), so each action also has an Option/Alt binding.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const d = useDesktop.getState()
      if (d.system !== 'on') return
      const ws = useWindows.getState()
      const focused = ws.focusedId ? ws.windows[ws.focusedId] : null
      const mod = isMac ? e.metaKey : e.ctrlKey
      const typing = isTyping(e.target)

      // Spotlight
      if ((mod && !e.shiftKey && e.code === 'KeyK') || (e.ctrlKey && e.code === 'Space') || (e.metaKey && e.code === 'Space')) {
        e.preventDefault()
        d.toggleOverlay('spotlight')
        return
      }

      if (e.key === 'Escape') {
        if (d.quickLook) d.setQuickLook(null)
        else if (d.contextMenu) d.closeContextMenu()
        else if (d.overlay) d.setOverlay(null)
        else if (d.panel) d.setPanel(null)
        else return
        e.preventDefault()
        return
      }

      // Application switcher: hold ⌥ and press Tab (or `).
      if (e.altKey && (e.code === 'Tab' || e.code === 'Backquote')) {
        e.preventDefault()
        const list = switcherApps()
        if (!list.length) return
        const sw = useSwitcher.getState()
        if (d.overlay !== 'switcher') {
          sw.set(list.length > 1 ? (e.shiftKey ? list.length - 1 : 1) : 0)
          d.setOverlay('switcher')
        } else sw.set(sw.index + (e.shiftKey ? -1 : 1))
        return
      }

      // Reload the browser app.
      if (mod && e.code === 'KeyR' && focused?.appId === 'safari') {
        e.preventDefault()
        sendAppCommand(focused.id, 'reload')
        return
      }

      if (typing && !(e.altKey && inTerminal(e.target))) return

      if (e.altKey && !mod) {
        let handled = true
        switch (e.code) {
          case 'KeyW':
            if (focused) ws.close(focused.id)
            break
          case 'KeyM':
            if (focused) ws.minimize(focused.id)
            break
          case 'KeyQ':
            if (focused) ws.quitApp(focused.appId)
            break
          case 'Comma':
            openApp('settings')
            break
          case 'ArrowUp':
            d.toggleOverlay('mission')
            break
          case 'ArrowDown':
            if (focused) d.toggleOverlay('expose')
            break
          case 'KeyL':
            d.toggleOverlay('launchpad')
            break
          default:
            handled = false
        }
        if (handled) {
          e.preventDefault()
          return
        }
      }
      if (typing) return

      if (e.ctrlKey && !e.metaKey && e.code === 'ArrowUp') {
        e.preventDefault()
        d.toggleOverlay('mission')
        return
      }
      if (e.ctrlKey && !e.metaKey && e.code === 'ArrowDown' && focused) {
        e.preventDefault()
        d.toggleOverlay('expose')
        return
      }
      if (mod && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault()
        d.toggleOverlay('launchpad')
        return
      }
      if (mod && e.code === 'Comma') {
        e.preventDefault()
        openApp('settings')
        return
      }

      // Quick Look for the file selected on the desktop.
      if (e.code === 'Space' && d.selectedFile && !d.overlay) {
        const active = document.activeElement
        if (!active || active === document.body || active.closest('[aria-label="Desktop"]')) {
          e.preventDefault()
          d.setQuickLook(d.quickLook ? null : d.selectedFile)
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (useDesktop.getState().overlay !== 'switcher') return
      if (e.key === 'Alt' || e.key === 'Meta' || e.key === 'Control') {
        const list = switcherApps()
        const i = useSwitcher.getState().index
        commitSwitch(list[((i % list.length) + list.length) % list.length])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])
}
