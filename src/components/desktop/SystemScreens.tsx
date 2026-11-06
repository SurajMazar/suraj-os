import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Power } from 'lucide-react'
import { useDesktop } from '@/store/desktopStore'
import { useWindows } from '@/store/windowStore'
import { portfolio } from '@/portfolio.config'
import { useClock, useReduceMotion } from '@/hooks/system'
import { SurajOSLogo } from '@/components/shared/BrandIcons'
import { sounds } from '@/lib/sound'
import { Wallpaper } from './Wallpaper'

export function LockScreen() {
  const now = useClock('second')
  const unlock = () => {
    useDesktop.getState().setSystem('on')
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') unlock()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <motion.div
      role="dialog"
      aria-label="Lock Screen"
      className="absolute inset-0 z-[100] overflow-hidden text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
      onClick={unlock}
    >
      <div className="absolute inset-0 scale-110 blur-[2px]">
        <Wallpaper />
      </div>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex h-full flex-col items-center pt-[9vh]">
        <div className="text-[22px] font-semibold opacity-90 drop-shadow">{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div className="text-[min(22vw,112px)] font-bold leading-none tracking-tight tabular-nums drop-shadow-lg" style={{ fontFeatureSettings: '"tnum"' }}>
          {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '')}
        </div>
        <div className="mt-auto mb-[12vh] flex flex-col items-center gap-3">
          <img src={portfolio.profileImage} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-white/50 shadow-xl" />
          <div className="text-[15px] font-semibold drop-shadow">{portfolio.name}</div>
          <button type="button" onClick={unlock} className="flex h-8 items-center gap-2 rounded-full bg-white/20 px-4 text-[13px] backdrop-blur-xl hover:bg-white/30" autoFocus>
            Click or press Return to unlock <ArrowRight size={14} />
          </button>
          <div className="text-[11px] opacity-70">No password. It’s a portfolio.</div>
        </div>
      </div>
    </motion.div>
  )
}

export function SleepScreen() {
  useEffect(() => {
    const wake = () => useDesktop.getState().setSystem('locked')
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', wake, { once: true })
      window.addEventListener('keydown', wake, { once: true })
    }, 400)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', wake)
      window.removeEventListener('keydown', wake)
    }
  }, [])
  return (
    <motion.div className="absolute inset-0 z-[110] grid place-items-center bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <motion.div className="text-[12px] text-white/25" animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 4, repeat: Infinity }}>
        Sleeping. Click or press any key to wake.
      </motion.div>
    </motion.div>
  )
}

export function OffScreen() {
  return (
    <motion.div className="absolute inset-0 z-[110] grid place-items-center bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          aria-label="Power on"
          autoFocus
          onClick={() => {
            useWindows.getState().closeAll()
            useDesktop.getState().setSystem('booting', 'power')
          }}
          className="grid h-16 w-16 place-items-center rounded-full border border-white/20 text-white/70 transition hover:border-white/50 hover:text-white"
        >
          <Power size={26} />
        </button>
        <span className="text-[12px] text-white/40">SurajOS is shut down. Press the button to start it.</span>
      </div>
    </motion.div>
  )
}

/** The optional startup sequence. Always skippable. */
export function BootScreen() {
  const reduce = useReduceMotion()
  const [progress, setProgress] = useState(0)
  const reason = useDesktop((s) => s.bootReason)
  const done = () => {
    useDesktop.getState().setSystem('locked')
  }

  useEffect(() => {
    if (reason === 'restart') useWindows.getState().closeAll()
    sounds.startup()
    const total = reduce ? 600 : 2600
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total)
      setProgress(1 - Math.pow(1 - p, 2))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTimeout(done, 250)
    }
    raf = requestAnimationFrame(tick)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && done()
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div className="absolute inset-0 z-[120] grid place-items-center bg-black text-white" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
      <div className="flex flex-col items-center gap-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <SurajOSLogo size={96} className="drop-shadow-[0_10px_30px_rgba(120,80,255,.35)]" />
        </motion.div>
        <div className="h-[5px] w-[220px] overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <button type="button" onClick={done} className="absolute bottom-8 right-8 rounded-full border border-white/20 px-4 py-1.5 text-[12px] text-white/70 hover:border-white/50 hover:text-white">
        Skip
      </button>
    </motion.div>
  )
}
