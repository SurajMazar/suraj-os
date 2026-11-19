import { useEffect } from 'react'
import { Check, Lock, RotateCcw } from 'lucide-react'
import type { AppProps } from '@/types'
import { Button } from '@/components/shared/ui'
import { useIsMobile } from '@/hooks/system'
import { BitSprite } from '@/quest/Bit'
import { chapters } from '@/quest/story'
import { questDone, useQuest } from '@/quest/questStore'

/** Bit's journal: the story so far, the recovered memories, and the controls for the adventure. */
export default function Quest(_: AppProps) {
  const q = useQuest()
  const mobile = useIsMobile()
  const done = questDone(q.chapter)

  // Opening the journal wakes Bit up (or starts the story the first time).
  useEffect(() => {
    const s = useQuest.getState()
    if (!s.started || s.away) s.wake()
  }, [])

  return (
    <div className="flex h-full flex-col bg-[var(--surface-solid)]">
      <div data-drag-region className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[var(--border)] pl-[86px] pr-3">
        <span className="flex-1 truncate text-[15px] font-semibold">Lost Bit</span>
        <span className="text-[12px] text-[var(--text-3)]">
          {q.found.length} of {chapters.length} memories
        </span>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-4 rounded-[14px] p-4 text-white" style={{ background: 'linear-gradient(135deg, #312e81, #7c3aed 55%, #0891b2)' }}>
          <div className="shrink-0 rounded-full bg-white/10 p-2">
            <BitSprite mood={done ? 'happy' : q.started ? 'thinking' : 'sad'} size={64} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-bold leading-tight">{done ? 'Memory restored' : 'A desktop adventure'}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/80">
              {done
                ? 'Bit remembers everything now, and stays on the desktop as your guide. Click Bit any time for a fact about this computer’s builder.'
                : `Bit, this computer’s little helper, lost its memory in a bad update. Guide it around ${mobile ? 'the phone' : 'the desktop'}, open the apps it points at, and piece its story back together.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {q.away || !q.started ? (
                <Button variant="primary" size="sm" onClick={() => q.wake()}>
                  {q.started ? 'Wake Bit up' : 'Start the story'}
                </Button>
              ) : (
                <Button size="sm" onClick={() => q.putAway()}>
                  Put Bit away
                </Button>
              )}
              {q.started ? (
                <Button size="sm" variant="ghost" className="!text-white/80 hover:!bg-white/10" onClick={() => q.restart()}>
                  <RotateCcw size={13} /> Start over
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <h2 className="mt-5 text-[13px] font-semibold text-[var(--text-2)]">Memories</h2>
        <ol className="mt-2 space-y-2">
          {chapters.map((ch, i) => {
            const got = q.found.includes(ch.id)
            const current = !got && q.chapter === i + 1
            return (
              <li key={ch.id} className={`rounded-[12px] border p-3 ${current ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface-2)]'}`}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${got ? 'bg-[var(--sys-green)] text-white' : current ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface-3)] text-[var(--text-3)]'}`}
                  >
                    {got ? <Check size={13} strokeWidth={3} /> : current ? i + 1 : <Lock size={11} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold">{got || current ? `${i + 1}. ${ch.title}` : `${i + 1}. ???`}</div>
                    {current ? <div className="text-[12px] text-[var(--accent)]">Goal: {ch.objective}</div> : null}
                  </div>
                </div>
                {got ? (
                  <div className="mt-2 border-l-2 border-[var(--sys-green)] pl-3 text-[12.5px] leading-relaxed text-[var(--text-2)]">
                    <span className="font-semibold text-[var(--text)]">{ch.fragment.title}. </span>
                    {ch.fragment.text}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
        <p className="mt-4 text-[11.5px] leading-relaxed text-[var(--text-3)]">Lost Bit is an original story written for SurajOS. Every fact Bit remembers comes from the CV. Progress is saved in this browser.</p>
      </div>
    </div>
  )
}
