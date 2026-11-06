import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Offset = { x: number; y: number }

interface LayoutStore {
  /** How far each desktop icon or widget has been dragged from its home spot. */
  offsets: Record<string, Offset>
  /** Stacking order: the item moved last sits on top. */
  stack: Record<string, number>
  setOffset: (key: string, o: Offset) => void
  raise: (key: string) => void
  cleanUp: () => void
}

export const useLayout = create<LayoutStore>()(
  persist(
    (set) => ({
      offsets: {},
      stack: {},
      setOffset: (key, o) => set((s) => ({ offsets: { ...s.offsets, [key]: o } })),
      raise: (key) => set((s) => ({ stack: { ...s.stack, [key]: Math.max(0, ...Object.values(s.stack)) + 1 } })),
      cleanUp: () => set({ offsets: {}, stack: {} }),
    }),
    { name: 'surajos-layout', version: 1 },
  ),
)
