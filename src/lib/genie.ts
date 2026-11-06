/**
 * The macOS genie effect for minimizing a window into the Dock.
 *
 * The window is tipped back in 3D so it tapers like a funnel toward the Dock,
 * then it pours into its thumbnail, narrowing faster than it shortens, the
 * way the genie stretches a window into the icon. Everything is a transform,
 * so the content keeps its proportions (no clipping or skew) and the GPU
 * runs it smoothly while the app inside stays live.
 */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const FRAMES = 24
/** How far the window tips back, in degrees. More reads as a stronger funnel. */
const TILT = 28

/** Keyframes that take `win` (the window's box on screen) into `dock` (the thumbnail's box). */
export function genieKeyframes(win: Box, dock: Box): Keyframe[] {
  // Everything pivots on the middle of the window's bottom edge, which travels to the thumbnail.
  const ox = win.x + win.w / 2
  const oy = win.y + win.h
  const dx = dock.x + dock.w / 2 - ox
  const dy = dock.y + dock.h * 0.6 - oy
  const end = Math.min(1, Math.max(0.04, (dock.w * 0.9) / win.w))
  const perspective = Math.max(900, win.h * 2.6)

  const frames: Keyframe[] = []
  for (let i = 0; i < FRAMES; i++) {
    const t = i / (FRAMES - 1)
    // The funnel forms first, then the window pours down into the Dock.
    const taper = easeOut(clamp01(t / 0.38))
    const move = easeInOut(clamp01((t - 0.12) / 0.88))
    // Narrower sooner than shorter, so it stretches into the icon.
    const sx = lerp(1, end, Math.pow(move, 0.75))
    const sy = lerp(1, end, Math.pow(move, 1.7))
    frames.push({
      offset: t,
      transformOrigin: '50% 100%',
      transform: `translate(${(dx * move).toFixed(1)}px, ${(dy * move).toFixed(1)}px) perspective(${perspective.toFixed(0)}px) rotateX(${(TILT * taper * (1 - move * 0.35)).toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
      opacity: t < 0.82 ? 1 : lerp(1, 0, (t - 0.82) / 0.18),
    })
  }
  return frames
}

export const GENIE_MS = 520
export const UNGENIE_MS = 460
