import { Fragment, type ReactNode } from 'react'

/**
 * A small Markdown renderer for the portfolio's own documents: headings,
 * paragraphs, lists, tables, **bold**, `keys` (drawn as keycaps) and links.
 * The content is ours, so there is no HTML passthrough.
 */

function inline(text: string, key: string): ReactNode {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('**')) out.push(<strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith('`'))
      out.push(
        <kbd key={`${key}-${i++}`} className="mx-[1px] inline-flex min-w-[22px] items-center justify-center rounded-[5px] bg-[var(--surface-3)] px-1.5 py-[1px] font-sans text-[0.86em] font-medium shadow-[inset_0_-1px_0_var(--border-strong),0_0_0_.5px_var(--border-strong)]">
          {t.slice(1, -1)}
        </kbd>,
      )
    else
      out.push(
        <a key={`${key}-${i++}`} href={t} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2 hover:decoration-[var(--accent)]">
          {t.replace(/^https?:\/\//, '')}
        </a>,
      )
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ source, className = '' }: { source: string; className?: string }) {
  const lines = source.replace(/\r/g, '').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const cls = level === 1 ? 'mb-3 mt-1 text-[1.9em] font-bold tracking-tight leading-tight' : level === 2 ? 'mb-2 mt-7 text-[1.25em] font-semibold' : 'mb-1 mt-5 text-[1.02em] font-semibold'
      const Tag = (`h${level}` as 'h1' | 'h2' | 'h3')
      blocks.push(<Tag key={k++} className={cls}>{inline(h[2], `h${k}`)}</Tag>)
      i++
      continue
    }
    if (line.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim())
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells)
        i++
      }
      const [head, ...body] = rows
      blocks.push(
        <div key={k++} className="my-4 overflow-hidden rounded-[10px] border border-[var(--border)]">
          <table className="w-full border-collapse text-[0.95em]">
            <thead className="bg-[var(--surface-3)] text-left text-[0.85em] text-[var(--text-2)]">
              <tr>
                {head.map((c, ci) => (
                  <th key={ci} className="px-3 py-2 font-semibold">
                    {inline(c, `th${k}${ci}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-[var(--border)]">
                  {r.map((c, ci) => (
                    <td key={ci} className={`px-3 py-2 align-top ${ci === 0 ? 'font-medium' : 'text-[var(--text-2)]'}`}>
                      {inline(c, `td${k}${ri}${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''))
      blocks.push(
        <ul key={k++} className="my-2 space-y-1.5 pl-1">
          {items.map((it, ii) => (
            <li key={ii} className="flex gap-2.5">
              <span className="mt-[0.62em] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--text-3)]" />
              <span>{inline(it, `li${k}${ii}`)}</span>
            </li>
          ))}
        </ul>,
      )
      continue
    }
    if (line.startsWith('> ')) {
      blocks.push(
        <p key={k++} className="my-3 border-l-[3px] border-[var(--accent)] pl-3 text-[var(--text-2)]">
          {inline(line.slice(2), `q${k}`)}
        </p>,
      )
      i++
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#|\||\s*[-*]\s|> )/.test(lines[i])) para.push(lines[i++])
    blocks.push(
      <p key={k++} className="my-2.5">
        {para.map((p, pi) => (
          <Fragment key={pi}>
            {pi > 0 && <br />}
            {inline(p, `p${k}${pi}`)}
          </Fragment>
        ))}
      </p>,
    )
  }
  return <div className={`selectable leading-[1.65] ${className}`}>{blocks}</div>
}
