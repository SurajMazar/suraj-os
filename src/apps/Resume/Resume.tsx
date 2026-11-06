import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Download, Printer, ZoomIn, ZoomOut } from 'lucide-react'
import type { AppProps } from '@/types'
import { portfolio } from '@/portfolio.config'
import { downloadResume, printResume } from '@/lib/menus'
import { IconButton, Spinner } from '@/components/shared/ui'
import type { PDFDocumentProxy } from 'pdfjs-dist'

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default
    return lib
  })
  return pdfjsPromise
}

function Page({ doc, n, scale }: { doc: PDFDocumentProxy; n: number; scale: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    let cancelled = false
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null
    doc.getPage(n).then((page) => {
      if (cancelled || !ref.current) return
      const viewport = page.getViewport({ scale })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const canvas = ref.current
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      setSize({ w: viewport.width, h: viewport.height })
      task = page.render({ canvas, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined })
      task.promise.catch(() => undefined)
    })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [doc, n, scale])
  return (
    <canvas
      ref={ref}
      data-page={n}
      role="img"
      aria-label={`Resume page ${n}`}
      className="mx-auto block bg-white shadow-[0_4px_24px_rgba(0,0,0,.25)]"
      style={size ? { width: size.w, height: size.h } : { width: 612 * scale, height: 792 * scale }}
    />
  )
}

export default function Resume(_: AppProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [page, setPage] = useState(1)
  const scroller = useRef<HTMLDivElement>(null)
  const fitted = useRef(false)

  useEffect(() => {
    let alive = true
    loadPdfjs()
      .then((lib) => lib.getDocument({ url: portfolio.resumeUrl }).promise)
      .then((d) => alive && setDoc(d))
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [])

  // Fit the page width to the window the first time.
  useEffect(() => {
    if (!doc || fitted.current || !scroller.current) return
    fitted.current = true
    doc.getPage(1).then((p) => {
      const w = p.getViewport({ scale: 1 }).width
      const avail = (scroller.current?.clientWidth ?? 700) - 48
      setScale(Math.max(0.5, Math.min(1.6, avail / w)))
    })
  }, [doc])

  const onScroll = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const pages = Array.from(el.querySelectorAll<HTMLCanvasElement>('[data-page]'))
    const mid = el.scrollTop + el.clientHeight / 3
    let current = 1
    for (const c of pages) if (c.offsetTop <= mid) current = Number(c.dataset.page)
    setPage(current)
  }, [])

  const goTo = (n: number) => {
    const c = scroller.current?.querySelector<HTMLCanvasElement>(`[data-page="${n}"]`)
    if (c && scroller.current) scroller.current.scrollTo({ top: c.offsetTop - 16, behavior: 'smooth' })
  }
  const total = doc?.numPages ?? 0
  const zoom = (f: number) => setScale((s) => Math.max(0.5, Math.min(2.5, +(s * f).toFixed(2))))

  return (
    <div
      className="flex h-full flex-col"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
          e.preventDefault()
          zoom(1.15)
        } else if ((e.metaKey || e.ctrlKey) && e.key === '-') {
          e.preventDefault()
          zoom(1 / 1.15)
        }
      }}
    >
      <div data-drag-region className="glass-strong flex h-[52px] shrink-0 items-center gap-1 border-b border-[var(--border)] pl-[86px] pr-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{portfolio.resumeFileName}</div>
          <div className="text-[11px] text-[var(--text-3)]">{total ? `Page ${page} of ${total}` : 'Loading…'}</div>
        </div>
        <IconButton label="Previous page" disabled={page <= 1} onClick={() => goTo(page - 1)}>
          <ChevronUp size={16} />
        </IconButton>
        <IconButton label="Next page" disabled={page >= total} onClick={() => goTo(page + 1)}>
          <ChevronDown size={16} />
        </IconButton>
        <div className="mx-1 h-5 w-px bg-[var(--border)]" />
        <IconButton label="Zoom out" onClick={() => zoom(1 / 1.15)}>
          <ZoomOut size={16} />
        </IconButton>
        <span className="w-[42px] text-center text-[11px] tabular-nums text-[var(--text-2)]">{Math.round(scale * 100)}%</span>
        <IconButton label="Zoom in" onClick={() => zoom(1.15)}>
          <ZoomIn size={16} />
        </IconButton>
        <div className="mx-1 h-5 w-px bg-[var(--border)]" />
        <IconButton label="Print" onClick={() => printResume()}>
          <Printer size={16} />
        </IconButton>
        <IconButton label="Download PDF" onClick={() => downloadResume()}>
          <Download size={16} />
        </IconButton>
      </div>
      <div ref={scroller} onScroll={onScroll} tabIndex={0} className="scroll-thin min-h-0 flex-1 space-y-4 overflow-auto bg-[#8e8e93] p-6 outline-none dark:bg-[#2a2a2e]">
        {error && (
          <div className="mx-auto max-w-[360px] rounded-[12px] bg-[var(--surface-solid)] p-5 text-center text-[13px]">
            The PDF viewer could not load ({error}).{' '}
            <a className="text-[var(--accent)] underline" href={portfolio.resumeUrl} target="_blank" rel="noopener">
              Open the PDF directly
            </a>
            .
          </div>
        )}
        {!doc && !error && (
          <div className="grid h-full place-items-center">
            <Spinner size={26} className="text-white/70" />
          </div>
        )}
        {doc && Array.from({ length: total }, (_, i) => <Page key={i} doc={doc} n={i + 1} scale={scale} />)}
      </div>
    </div>
  )
}
