import { getSettings } from '@/store/settingsStore'
import { soundFiles } from '@/portfolio.config'

/**
 * System sounds in the spirit of macOS (pop, tink, glass, whoosh), synthesized
 * with Web Audio so the site ships no third-party audio. To use recorded sounds
 * you hold the rights to, put them in public/sounds and map them in
 * `soundFiles` in portfolio.config.ts. Every sound plays only after a
 * visitor's action and honours the Sound settings.
 */
export type SoundName = 'click' | 'open' | 'close' | 'minimize' | 'restore' | 'error' | 'pop' | 'notify' | 'trash' | 'toggleOn' | 'toggleOff' | 'lock' | 'unlock' | 'sent' | 'startup'

let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null
const fileCache = new Map<string, AudioBuffer | 'loading' | 'failed'>()

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function level() {
  const s = getSettings()
  return s.sound ? s.volume : 0
}

function noiseBuffer(ac: AudioContext) {
  if (noise) return noise
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
  const d = noise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return noise
}

function out(ac: AudioContext, gain: number) {
  const g = ac.createGain()
  g.gain.value = gain * level()
  g.connect(ac.destination)
  return g
}

/** One decaying partial. */
function partial(ac: AudioContext, dest: AudioNode, freq: number, t0: number, dur: number, peak: number, opts: { type?: OscillatorType; to?: number; attack?: number } = {}) {
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = opts.type ?? 'sine'
  o.frequency.setValueAtTime(freq, t0)
  if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur * 0.6)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + (opts.attack ?? 0.004))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(dest)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

/** Filtered noise, swept: whooshes and crumples. */
function sweep(ac: AudioContext, dest: AudioNode, t0: number, dur: number, from: number, to: number, peak: number, q = 1.2) {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  const f = ac.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = q
  f.frequency.setValueAtTime(from, t0)
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + dur * 0.3)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(f).connect(g).connect(dest)
  src.start(t0, Math.random() * 0.5)
  src.stop(t0 + dur + 0.05)
}

const synth: Record<SoundName, (ac: AudioContext, t: number) => void> = {
  // A light, glassy tick.
  click: (ac, t) => {
    const d = out(ac, 0.5)
    partial(ac, d, 2800, t, 0.05, 0.05)
    partial(ac, d, 4200, t, 0.03, 0.025)
  },
  // A bubble pop: a sine that drops fast.
  pop: (ac, t) => partial(ac, out(ac, 0.9), 1100, t, 0.09, 0.14, { to: 380 }),
  open: (ac, t) => {
    const d = out(ac, 0.7)
    partial(ac, d, 520, t, 0.11, 0.09, { to: 1040 })
    partial(ac, d, 1560, t + 0.03, 0.08, 0.03)
  },
  close: (ac, t) => partial(ac, out(ac, 0.7), 900, t, 0.1, 0.09, { to: 420 }),
  // The window is sucked into the Dock.
  minimize: (ac, t) => {
    const d = out(ac, 0.8)
    sweep(ac, d, t, 0.38, 2600, 300, 0.25, 0.9)
    partial(ac, d, 660, t + 0.02, 0.3, 0.025, { to: 180 })
  },
  // The minimize sweep, reversed.
  restore: (ac, t) => {
    const d = out(ac, 0.7)
    sweep(ac, d, t, 0.3, 400, 2400, 0.18, 0.9)
    partial(ac, d, 300, t + 0.02, 0.24, 0.025, { to: 700 })
  },
  // Soft tactile clicks, higher for on.
  toggleOn: (ac, t) => {
    const d = out(ac, 0.6)
    partial(ac, d, 1900, t, 0.035, 0.07, { type: 'triangle' })
    sweep(ac, d, t, 0.02, 5000, 4000, 0.05, 3)
  },
  toggleOff: (ac, t) => {
    const d = out(ac, 0.6)
    partial(ac, d, 1300, t, 0.035, 0.07, { type: 'triangle' })
    sweep(ac, d, t, 0.02, 3500, 3000, 0.05, 3)
  },
  // A latch closing, and opening.
  lock: (ac, t) => {
    const d = out(ac, 0.7)
    partial(ac, d, 520, t, 0.08, 0.1, { type: 'triangle', to: 330 })
    partial(ac, d, 1040, t + 0.05, 0.06, 0.04)
  },
  unlock: (ac, t) => {
    const d = out(ac, 0.7)
    partial(ac, d, 660, t, 0.07, 0.07, { to: 990 })
    partial(ac, d, 1320, t + 0.06, 0.12, 0.05)
  },
  // A quick upward swoosh for a sent message.
  sent: (ac, t) => {
    const d = out(ac, 0.7)
    sweep(ac, d, t, 0.32, 500, 5200, 0.2, 1.1)
    partial(ac, d, 880, t + 0.08, 0.18, 0.03, { to: 1760 })
  },
  // A bell with inharmonic partials, like a struck glass.
  notify: (ac, t) => {
    const d = out(ac, 0.7)
    ;[
      [1568, 0.07, 1.1],
      [2349, 0.04, 0.8],
      [3951, 0.025, 0.5],
      [5274, 0.012, 0.3],
    ].forEach(([f, p, dur]) => partial(ac, d, f, t, dur, p))
  },
  // A muted, woody "nope".
  error: (ac, t) => {
    const d = out(ac, 0.8)
    partial(ac, d, 196, t, 0.16, 0.12, { type: 'triangle', to: 150 })
    partial(ac, d, 196, t + 0.13, 0.2, 0.1, { type: 'triangle', to: 140 })
  },
  // Paper crumpling into the bin.
  trash: (ac, t) => {
    const d = out(ac, 0.8)
    for (let i = 0; i < 7; i++) sweep(ac, d, t + i * 0.045 + Math.random() * 0.02, 0.07, 1800 + Math.random() * 3000, 700, 0.18, 2.5)
  },
  // Original startup chord: a soft C major add 9, rolled, with a bell-like top.
  startup: (ac, t) => {
    const d = out(ac, 0.8)
    ;[261.6, 329.6, 392, 587.3, 784].forEach((f, i) => {
      partial(ac, d, f, t + i * 0.025, 2.4, 0.06, { attack: 0.04 })
      partial(ac, d, f * 2, t + i * 0.025, 1.2, 0.012, { attack: 0.04 })
    })
  },
}

async function playFile(ac: AudioContext, url: string) {
  const cached = fileCache.get(url)
  if (cached === 'failed') return false
  if (cached === 'loading') return true
  if (cached) {
    const src = ac.createBufferSource()
    src.buffer = cached
    src.connect(out(ac, 1))
    src.start()
    return true
  }
  fileCache.set(url, 'loading')
  try {
    const buf = await fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    const decoded = await ac.decodeAudioData(buf)
    fileCache.set(url, decoded)
    return playFile(ac, url)
  } catch {
    fileCache.set(url, 'failed')
    return false
  }
}

const lastPlayed = new Map<SoundName, number>()

function play(name: SoundName) {
  if (level() <= 0) return
  // The same sound twice within 60ms is one sound (rapid clicks, batched opens).
  const now = performance.now()
  if (now - (lastPlayed.get(name) ?? 0) < 60) return
  lastPlayed.set(name, now)
  // Browsers block audio until the visitor has interacted with the page.
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  if (ua && !ua.hasBeenActive) return
  const ac = audio()
  if (!ac) return
  const file = soundFiles[name]
  if (file) {
    void playFile(ac, file).then((ok) => {
      if (!ok) synth[name](ac, ac.currentTime)
    })
    return
  }
  synth[name](ac, ac.currentTime + 0.005)
}

export const sounds = Object.fromEntries((Object.keys(synth) as SoundName[]).map((n) => [n, () => play(n)])) as Record<SoundName, () => void>

/** For the Sound settings preview list. */
export const soundCatalog: { name: SoundName; label: string }[] = [
  { name: 'open', label: 'Open app' },
  { name: 'close', label: 'Close window' },
  { name: 'minimize', label: 'Minimize' },
  { name: 'restore', label: 'Restore' },
  { name: 'notify', label: 'Notification' },
  { name: 'toggleOn', label: 'Toggle on' },
  { name: 'toggleOff', label: 'Toggle off' },
  { name: 'trash', label: 'Empty Trash' },
  { name: 'sent', label: 'Message sent' },
  { name: 'error', label: 'Error' },
  { name: 'lock', label: 'Lock' },
  { name: 'unlock', label: 'Unlock' },
  { name: 'startup', label: 'Startup' },
]
