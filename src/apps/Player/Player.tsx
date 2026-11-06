import type { AppProps } from '@/types'

/**
 * Plays a video by its YouTube id through YouTube's own privacy-enhanced embed,
 * so the site hosts no video files. Opening it is the visitor's click, which
 * lets the browser start it with sound.
 */
export default function Player({ props }: AppProps) {
  const id = typeof props.youtube === 'string' ? props.youtube : null
  const title = typeof props.title === 'string' ? props.title : 'Video'
  if (!id) return <div className="grid h-full place-items-center bg-black text-[13px] text-white/60">No video to play.</div>
  return (
    <div className="h-full bg-black">
      <iframe
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&playsinline=1`}
        className="h-full w-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
    </div>
  )
}
