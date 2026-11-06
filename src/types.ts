import type { ComponentType, LazyExoticComponent } from 'react'

export type AppId =
  | 'finder'
  | 'about'
  | 'projects'
  | 'experience'
  | 'skills'
  | 'resume'
  | 'terminal'
  | 'safari'
  | 'github'
  | 'contact'
  | 'settings'
  | 'trash'
  | 'textedit'
  | 'launchpad'
  | 'aboutmac'
  | 'calendar'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type WindowProps = Record<string, unknown>

export interface DesktopWindow extends Rect {
  id: string
  appId: AppId
  title: string
  z: number
  minimized: boolean
  maximized: boolean
  /** Rect to return to when a maximized or snapped window is restored. */
  restoreRect: Rect | null
  props: WindowProps
  /** Bumped when the window is opened from the Dock, so it can animate from there. */
  openedAt: number
}

export interface AppProps {
  windowId: string
  props: WindowProps
}

export interface MenuItem {
  label: string
  shortcut?: string
  action?: () => void
  disabled?: boolean
  checked?: boolean
  danger?: boolean
  separator?: boolean
}

export interface AppDefinition {
  id: AppId
  name: string
  /** Opens nothing; runs this instead (GitHub opens Safari, Launchpad opens the overlay). */
  launch?: () => void
  component?: LazyExoticComponent<ComponentType<AppProps>>
  size: { w: number; h: number }
  minSize?: { w: number; h: number }
  /** More than one window allowed (Finder, TextEdit). */
  multi?: boolean
  /** The app draws its own toolbar; the title bar becomes a transparent drag strip. */
  chromeless?: boolean
  inDock?: boolean
  inLaunchpad?: boolean
  keywords?: string[]
  description: string
}
