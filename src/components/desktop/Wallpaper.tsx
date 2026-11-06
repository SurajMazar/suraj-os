import { useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSettings, type WallpaperId } from '@/store/settingsStore'
import { useUserWallpaper } from '@/lib/userWallpaper'
import { useIsDark } from '@/hooks/system'

export const wallpapers: { id: WallpaperId; name: string }[] = [
  { id: 'chameleon', name: 'Chameleon Reserve' },
  { id: 'picture', name: 'Your Picture' },
  { id: 'kathmandu', name: 'Kathmandu' },
  { id: 'kathmandu-paint', name: 'Kathmandu Dusk' },
  { id: 'liquid', name: 'Liquid' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'himalaya', name: 'Himalaya' },
  { id: 'sunset', name: 'Sunset' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'graphite', name: 'Graphite' },
  { id: 'custom', name: 'Custom Gradient' },
]

/**
 * Liquid: layered, glossy waves receding into a glow, with atmospheric depth and
 * a fine grain so the gradients never band. Original artwork, drawn as SVG.
 */
function Liquid({ dark }: { dark: boolean }) {
  const uid = useId().replace(/:/g, '')
  const sky = dark ? ['#07071a', '#1a0f3d', '#4a1a5e', '#b0406a'] : ['#7f8cf0', '#b49af0', '#ee9cc0', '#ffbe9c']
  const glow = dark ? '#ff8a5c' : '#fff6e8'
  // Back to front: each wave gets a two-stop diagonal gradient.
  const waves = dark
    ? [
        ['#5b2a86', '#c2416f'],
        ['#3b1f78', '#8e2f86'],
        ['#26176a', '#5b2a9c'],
        ['#161052', '#3a1f86'],
        ['#0b0a33', '#211763'],
      ]
    : [
        ['#ff9fb8', '#ffc29a'],
        ['#c48cf5', '#ff8fb6'],
        ['#8f7cf2', '#d57ff0'],
        ['#6370ea', '#a06cf0'],
        ['#4652d6', '#7354e6'],
      ]
  const paths = [
    'M0 520 C 220 440 420 600 700 520 S 1180 420 1600 500 V1000 H0Z',
    'M0 600 C 260 520 520 700 820 610 S 1300 520 1600 600 V1000 H0Z',
    'M0 690 C 300 600 560 790 900 700 S 1360 610 1600 700 V1000 H0Z',
    'M0 790 C 320 700 620 880 960 800 S 1400 720 1600 800 V1000 H0Z',
    'M0 880 C 340 820 640 960 1000 890 S 1420 830 1600 890 V1000 H0Z',
  ]
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`lsky${uid}`} x1="0" y1="0" x2="0" y2="1">
          {sky.map((c, i) => (
            <stop key={i} offset={i / (sky.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <radialGradient id={`lglow${uid}`} cx="0.62" cy="0.46" r="0.42">
          <stop offset="0" stopColor={glow} stopOpacity={dark ? 0.75 : 0.95} />
          <stop offset="0.35" stopColor={glow} stopOpacity={dark ? 0.25 : 0.5} />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        {waves.map(([a, b], i) => (
          <linearGradient key={i} id={`lw${i}${uid}`} x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        ))}
        <linearGradient id={`lsheen${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={dark ? 0.22 : 0.5} />
          <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`lsoft${uid}`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`lgrain${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.6 0" />
        </filter>
      </defs>
      <rect width="1600" height="1000" fill={`url(#lsky${uid})`} />
      <rect width="1600" height="1000" fill={`url(#lglow${uid})`} />
      {dark &&
        Array.from({ length: 60 }, (_, i) => (
          <circle key={i} cx={(i * 397) % 1600} cy={(i * 137) % 380} r={(i % 3) * 0.45 + 0.5} fill="#fff" opacity={0.2 + ((i * 7) % 10) / 22} />
        ))}
      {paths.map((d, i) => (
        <g key={i} filter={i < 2 ? `url(#lsoft${uid})` : undefined} opacity={i === 0 ? 0.75 : 1}>
          <path d={d} fill={`url(#lw${i}${uid})`} />
          <path d={d} fill={`url(#lsheen${uid})`} />
        </g>
      ))}
      <rect width="1600" height="1000" filter={`url(#lgrain${uid})`} opacity={dark ? 0.04 : 0.03} />
    </svg>
  )
}

/** Illustrated wallpapers (made with ChatGPT image generation). Dark mode dims them slightly. */
function Picture({ src, dark, position = '40% 60%' }: { src: string; dark: boolean; position?: string }) {
  return (
    <div className="absolute inset-0 bg-[#3b2a63]">
      <img src={src} alt="" draggable={false} decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      {dark && <div className="absolute inset-0 bg-[#0a0820]/25" />}
    </div>
  )
}

/** The visitor's own picture; falls back to Kathmandu until one is chosen. */
function UserPicture({ dark }: { dark: boolean }) {
  const url = useUserWallpaper((s) => s.url)
  return <Picture src={url ?? './wallpapers/kathmandu-storybook.jpg'} dark={dark} />
}

function Blob({ color, className, delay = 0 }: { color: string; className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full ${className}`}
      style={{ background: color, filter: 'blur(90px)', animation: `float-slow 22s ease-in-out ${delay}s infinite` }}
    />
  )
}

function Aurora({ dark }: { dark: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: dark ? 'linear-gradient(160deg,#0b1020,#151036 55%,#1d0f2b)' : 'linear-gradient(160deg,#e9ecff,#f6e8ff 55%,#ffe9f1)' }}>
      <Blob color={dark ? '#4338ca' : '#a5b4fc'} className="left-[-10%] top-[-10%] h-[70%] w-[60%] opacity-80" />
      <Blob color={dark ? '#be185d' : '#f9a8d4'} className="bottom-[-20%] right-[-10%] h-[75%] w-[60%] opacity-70" delay={-7} />
      <Blob color={dark ? '#0e7490' : '#99f6e4'} className="bottom-[0%] left-[15%] h-[45%] w-[40%] opacity-60" delay={-13} />
      <Blob color={dark ? '#7c3aed' : '#c4b5fd'} className="right-[15%] top-[10%] h-[40%] w-[35%] opacity-60" delay={-4} />
    </div>
  )
}

function Himalaya({ dark }: { dark: boolean }) {
  const uid = useId().replace(/:/g, '')
  const sky = dark ? ['#0b1026', '#2a1b4d', '#7a3f6b', '#e08a6d'] : ['#7cb7ff', '#a9cdfd', '#dbe8fb', '#fde7d3']
  const ranges = dark ? ['#3a2c5c', '#2a2147', '#1b1533', '#0f0c20'] : ['#a7b8d8', '#7f93bb', '#5b6f98', '#3d4d72']
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`hsky${uid}`} x1="0" y1="0" x2="0" y2="1">
          {sky.map((c, i) => (
            <stop key={i} offset={i / (sky.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
        <linearGradient id={`snow${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dark ? '#f3d5e6' : '#ffffff'} />
          <stop offset="1" stopColor={dark ? '#f3d5e6' : '#ffffff'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#hsky${uid})`} />
      {dark &&
        Array.from({ length: 70 }, (_, i) => (
          <circle key={i} cx={(i * 397) % 1600} cy={(i * 131) % 420} r={(i % 3) * 0.5 + 0.6} fill="#fff" opacity={0.25 + ((i * 7) % 10) / 20} />
        ))}
      <circle cx={dark ? 1180 : 1220} cy={dark ? 260 : 220} r={dark ? 46 : 70} fill={dark ? '#ffe8d6' : '#fff7e0'} opacity={dark ? 0.85 : 0.9} />
      <path d="M0 640 L180 470 L300 560 L470 330 L560 420 L720 250 L840 390 L960 300 L1100 450 L1240 320 L1380 470 L1600 380 L1600 1000 L0 1000Z" fill={ranges[0]} />
      <path d="M470 330 L520 390 L500 385 L470 410 L445 380 L430 395Z M720 250 L775 320 L748 312 L720 345 L690 318 L668 330Z M1240 320 L1290 380 L1262 372 L1240 398 L1215 375 L1198 384Z" fill={`url(#snow${uid})`} />
      <path d="M0 720 L140 600 L280 680 L420 540 L600 690 L760 560 L900 660 L1060 540 L1220 670 L1400 560 L1600 650 L1600 1000 L0 1000Z" fill={ranges[1]} />
      <path d="M0 820 L200 720 L380 790 L560 700 L760 800 L980 710 L1180 800 L1380 720 L1600 790 L1600 1000 L0 1000Z" fill={ranges[2]} />
      <path d="M0 900 L260 840 L520 900 L800 830 L1080 900 L1340 850 L1600 900 L1600 1000 L0 1000Z" fill={ranges[3]} />
    </svg>
  )
}

function Sunset({ dark }: { dark: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: dark ? 'linear-gradient(180deg,#1a0b2e 0%,#4a1942 40%,#c2410c 75%,#f59e0b 100%)' : 'linear-gradient(180deg,#fde68a 0%,#fdba74 35%,#fb7185 70%,#a855f7 100%)' }}>
      <div className="absolute left-1/2 top-[52%] h-[38vmin] w-[38vmin] -translate-x-1/2 rounded-full" style={{ background: dark ? 'radial-gradient(circle,#ffd29a,#ff8a3d 70%)' : 'radial-gradient(circle,#fff7d6,#ffb36b 70%)', boxShadow: '0 0 120px 40px rgba(255,170,90,.45)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{ background: dark ? 'linear-gradient(180deg,rgba(40,10,40,.6),#12051c)' : 'linear-gradient(180deg,rgba(120,40,120,.35),#5b2177)', backdropFilter: 'blur(2px)' }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="absolute left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#ffd29a]" style={{ bottom: `${30 - i * 5}%`, width: `${30 - i * 5}%`, opacity: 0.5 - i * 0.08 }} />
      ))}
    </div>
  )
}

function Ocean({ dark }: { dark: boolean }) {
  const uid = useId().replace(/:/g, '')
  const c = dark ? ['#020617', '#0c4a6e', '#0369a1', '#0e7490'] : ['#e0f2fe', '#7dd3fc', '#38bdf8', '#0284c7']
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`osky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill={`url(#osky${uid})`} />
      <path d="M0 560 C200 520 400 600 600 560 S1000 520 1200 560 S1500 600 1600 560 V1000 H0Z" fill={c[2]} opacity=".7" />
      <path d="M0 680 C250 640 450 720 700 680 S1150 640 1350 690 S1550 700 1600 680 V1000 H0Z" fill={c[3]} opacity=".85" />
      <path d="M0 820 C300 780 500 860 800 820 S1250 780 1600 830 V1000 H0Z" fill={dark ? '#082f49' : '#0369a1'} />
    </svg>
  )
}

function Graphite({ dark }: { dark: boolean }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: dark ? 'radial-gradient(ellipse at 30% 20%,#3f3f46 0%,#18181b 55%,#09090b 100%)' : 'radial-gradient(ellipse at 30% 20%,#fafafa 0%,#d4d4d8 60%,#a1a1aa 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-[.07]" style={{ backgroundImage: 'linear-gradient(var(--menubar-text) 1px, transparent 1px), linear-gradient(90deg, var(--menubar-text) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
    </div>
  )
}

export function WallpaperArt({ id, dark, custom }: { id: WallpaperId; dark: boolean; custom: [string, string] }) {
  switch (id) {
    case 'chameleon':
      return <Picture src="./wallpapers/chameleon-reserve.jpg" dark={dark} position="50% 45%" />
    case 'picture':
      return <UserPicture dark={dark} />
    case 'kathmandu':
      return <Picture src="./wallpapers/kathmandu-storybook.jpg" dark={dark} />
    case 'kathmandu-paint':
      return <Picture src="./wallpapers/kathmandu-dusk.jpg" dark={dark} />
    case 'liquid':
      return <Liquid dark={dark} />
    case 'aurora':
      return <Aurora dark={dark} />
    case 'himalaya':
      return <Himalaya dark={dark} />
    case 'sunset':
      return <Sunset dark={dark} />
    case 'ocean':
      return <Ocean dark={dark} />
    case 'graphite':
      return <Graphite dark={dark} />
    case 'custom':
      return <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${custom[0]}, ${custom[1]})` }} />
  }
}

export function Wallpaper() {
  const id = useSettings((s) => s.wallpaper)
  const custom = useSettings((s) => s.customGradient)
  const dark = useIsDark()
  const key = `${id}-${dark}-${id === 'custom' ? custom.join() : ''}`
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div key={key} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
          <WallpaperArt id={id} dark={dark} custom={custom} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
