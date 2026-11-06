import { useEffect, lazy, Suspense } from 'react'
import { MotionConfig } from 'motion/react'
import { Desktop } from '@/components/desktop/Desktop'
import { useIsDark, useIsMobile, useReduceMotion } from '@/hooks/system'
import { useDesktop } from '@/store/desktopStore'
import { getSettings } from '@/store/settingsStore'
import { notificationsSeed } from '@/portfolio.config'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useUserWallpaper } from '@/lib/userWallpaper'

const MobileShell = lazy(() => import('@/components/mobile/MobileShell'))

export default function App() {
  const dark = useIsDark()
  const mobile = useIsMobile()
  const reduce = useReduceMotion()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1020' : '#e9ecff')
  }, [dark])

  useEffect(() => {
    void useUserWallpaper.getState().load()
  }, [])

  useEffect(() => {
    if (getSettings().startupOnLoad) useDesktop.getState().setSystem('booting', 'load')
    // The welcome notification arrives a moment after the first unlock.
    let timer: ReturnType<typeof setTimeout> | undefined
    const welcome = () => {
      timer = setTimeout(() => useDesktop.getState().pushNotification({ ...notificationsSeed[0], app: 'finder' }), 1200)
    }
    if (useDesktop.getState().system === 'on') {
      welcome()
      return () => clearTimeout(timer)
    }
    const unsub = useDesktop.subscribe((s, prev) => {
      if (s.system === 'on' && prev.system !== 'on') {
        unsub()
        welcome()
      }
    })
    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [])

  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
      <ErrorBoundary
        fallback={(_, reset) => (
          <div className="grid h-full place-items-center bg-black p-8 text-center text-white">
            <div>
              <div className="text-[17px] font-semibold">SurajOS needs a restart.</div>
              <button type="button" onClick={() => { reset(); location.reload() }} className="mt-4 rounded-full bg-white/15 px-4 py-1.5 text-[13px] hover:bg-white/25">
                Restart
              </button>
            </div>
          </div>
        )}
      >
      {mobile ? (
        <Suspense fallback={<div className="h-full bg-black" />}>
          <MobileShell />
        </Suspense>
      ) : (
        <Desktop />
      )}
      </ErrorBoundary>
    </MotionConfig>
  )
}
