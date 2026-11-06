import type { AppId, MenuItem } from '@/types'
import { openApp, useWindows } from '@/store/windowStore'
import { useDesktop } from '@/store/desktopStore'
import { getSettings, useSettings } from '@/store/settingsStore'
import { sendAppCommand } from './appEvents'
import { useLayout } from '@/store/layoutStore'
import { portfolio } from '@/portfolio.config'
import { openFile } from './openFile'
import { ALT, MOD } from '@/hooks/system'

export interface MenuDef {
  title: string
  items: MenuItem[]
}

const sep: MenuItem = { label: '', separator: true }

function copy(text: string, what: string) {
  void navigator.clipboard?.writeText(text).then(
    () => useDesktop.getState().pushNotification({ id: `copy-${Date.now()}`, app: 'finder', title: 'Copied', body: `${what} copied to the clipboard.` }),
    () => undefined,
  )
}

export function systemMenu(): MenuItem[] {
  const d = useDesktop.getState()
  return [
    { label: 'About This Mac', action: () => openApp('aboutmac') },
    sep,
    { label: 'System Settings…', shortcut: `${ALT},`, action: () => openApp('settings') },
    sep,
    { label: 'Sleep', action: () => d.setSystem('sleep') },
    { label: 'Restart…', action: () => d.setSystem('booting', 'restart') },
    { label: 'Shut Down…', action: () => d.setSystem('off', 'power') },
    sep,
    { label: 'Lock Screen', action: () => d.setSystem('locked') },
  ]
}

/** File, Edit, View, Window and Help, adapted to the app in front. */
export function appMenus(appId: AppId): MenuDef[] {
  const ws = useWindows.getState()
  const focusedId = ws.focusedId
  const focused = focusedId ? ws.windows[focusedId] : null
  const s = getSettings()
  const set = useSettings.getState().set
  const d = useDesktop.getState()

  const file: MenuItem[] = []
  if (appId === 'finder') file.push({ label: 'New Finder Window', action: () => openApp('finder') })
  if (appId === 'safari' && focusedId) {
    file.push({ label: 'New Tab', action: () => sendAppCommand(focusedId, 'new-tab') })
    file.push({ label: 'Open Location…', action: () => sendAppCommand(focusedId, 'focus-address') })
  }
  if (appId === 'terminal' && focusedId) file.push({ label: 'Clear Screen', action: () => sendAppCommand(focusedId, 'clear') })
  if (appId === 'resume') {
    file.push({ label: 'Download PDF', action: () => downloadResume() })
    file.push({ label: 'Print…', action: () => printResume() })
  }
  file.push({ label: 'Open Welcome', action: () => openFile(`/Users/${portfolio.handle}/Desktop/Welcome.md`) })
  file.push(sep)
  file.push({ label: 'Close Window', shortcut: `${ALT}W`, disabled: !focused, action: () => focused && ws.close(focused.id) })

  const edit: MenuItem[] = [
    { label: 'Copy Email Address', action: () => copy(portfolio.email, 'Email address') },
    { label: 'Copy GitHub Link', action: () => copy(portfolio.github, 'GitHub link') },
    { label: 'Copy LinkedIn Link', action: () => copy(portfolio.linkedin, 'LinkedIn link') },
    sep,
    { label: 'Find…', shortcut: `${MOD}K`, action: () => d.setOverlay('spotlight') },
  ]

  const view: MenuItem[] = []
  if (appId === 'finder' && focusedId) {
    view.push({ label: 'as Icons', action: () => sendAppCommand(focusedId, 'view', 'grid') })
    view.push({ label: 'as List', action: () => sendAppCommand(focusedId, 'view', 'list') })
    view.push(sep)
  }
  if (appId === 'projects' && focusedId) {
    view.push({ label: 'as Grid', action: () => sendAppCommand(focusedId, 'view', 'grid') })
    view.push({ label: 'as List', action: () => sendAppCommand(focusedId, 'view', 'list') })
    view.push(sep)
  }
  if (appId === 'safari' && focusedId) {
    view.push({ label: 'Reload Page', shortcut: `${MOD}R`, action: () => sendAppCommand(focusedId, 'reload') })
    view.push(sep)
  }
  view.push(
    { label: focused?.maximized ? 'Exit Full Screen' : 'Enter Full Screen', disabled: !focused, action: () => focused && ws.toggleMaximize(focused.id) },
    sep,
    { label: 'Dark Mode', checked: s.appearance === 'dark', action: () => set('appearance', s.appearance === 'dark' ? 'light' : 'dark') },
    { label: 'Show Desktop Icons', checked: s.showDesktopIcons, action: () => set('showDesktopIcons', !s.showDesktopIcons) },
    { label: 'Show Widgets', checked: s.showWidgets, action: () => set('showWidgets', !s.showWidgets) },
    { label: 'Clean Up Desktop', action: () => useLayout.getState().cleanUp() },
    sep,
    { label: 'Mission Control', shortcut: `${ALT}↑`, action: () => d.setOverlay('mission') },
    { label: 'Launchpad', shortcut: `${ALT}L`, action: () => d.setOverlay('launchpad') },
  )

  const windowItems: MenuItem[] = [
    { label: 'Minimize', shortcut: `${ALT}M`, disabled: !focused, action: () => focused && ws.minimize(focused.id) },
    { label: 'Zoom', disabled: !focused, action: () => focused && ws.toggleMaximize(focused.id) },
    { label: 'Show All Windows', shortcut: `${ALT}↓`, disabled: !focused, action: () => d.setOverlay('expose') },
    { label: 'Bring All to Front', action: () => ws.order.forEach((id) => ws.windows[id]?.minimized && ws.restore(id)) },
  ]
  const open = ws.order.map((id) => ws.windows[id]).filter(Boolean)
  if (open.length) {
    windowItems.push(sep)
    open.forEach((w) => windowItems.push({ label: w.title, checked: w.id === focusedId, action: () => (w.minimized ? ws.restore(w.id) : ws.focus(w.id)) }))
  }

  const help: MenuItem[] = [
    { label: 'Keyboard Shortcuts', action: () => openFile(`/Users/${portfolio.handle}/Documents/Keyboard Shortcuts.md`) },
    { label: 'Terminal Commands', action: () => { const id = openApp('terminal'); if (id) setTimeout(() => sendAppCommand(id, 'run', 'help'), 350) } },
    { label: 'Welcome Tour', action: () => openFile(`/Users/${portfolio.handle}/Desktop/Welcome.md`) },
    sep,
    { label: 'View Source on GitHub', action: () => openApp('safari', { url: portfolio.github }) },
  ]

  return [
    { title: 'File', items: file },
    { title: 'Edit', items: edit },
    { title: 'View', items: view },
    { title: 'Window', items: windowItems },
    { title: 'Help', items: help },
  ]
}

export function downloadResume() {
  const a = document.createElement('a')
  a.href = portfolio.resumeUrl
  a.download = portfolio.resumeFileName
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function printResume() {
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  frame.src = portfolio.resumeUrl
  frame.onload = () => {
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } catch {
      window.open(portfolio.resumeUrl, '_blank', 'noopener')
    }
    setTimeout(() => frame.remove(), 60_000)
  }
  document.body.appendChild(frame)
}
