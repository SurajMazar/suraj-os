import { useEffect, useRef } from 'react'

/**
 * Commands from the menu bar and keyboard shortcuts to a specific window's app,
 * for example "reload" for Safari or "clear" for Terminal.
 */
type Handler = (command: string, payload?: unknown) => void
const handlers = new Map<string, Set<Handler>>()

export function sendAppCommand(windowId: string, command: string, payload?: unknown) {
  handlers.get(windowId)?.forEach((h) => h(command, payload))
}

export function useAppCommand(windowId: string, handler: Handler) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const h: Handler = (c, p) => ref.current(c, p)
    if (!handlers.has(windowId)) handlers.set(windowId, new Set())
    handlers.get(windowId)!.add(h)
    return () => {
      handlers.get(windowId)?.delete(h)
    }
  }, [windowId])
}
