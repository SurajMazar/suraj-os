import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, ExternalLink, GitFork, Globe, House, Lock, Plus, RotateCw, Search, Star, X } from 'lucide-react'
import type { AppProps } from '@/types'
import { portfolio, projects } from '@/portfolio.config'
import { useAppCommand } from '@/lib/appEvents'
import { useWindows } from '@/store/windowStore'
import { search } from '@/lib/search'
import { languageColors, timeAgo, useGitHub } from '@/lib/github'
import { Button, IconButton, Spinner } from '@/components/shared/ui'
import { GitHubMark, LinkedInMark } from '@/components/shared/BrandIcons'

const HOME = 'surajos://start'

interface Tab {
  id: number
  history: string[]
  index: number
  reloadKey: number
}

let tabSeq = 1
const newTab = (url = HOME): Tab => ({ id: tabSeq++, history: [url], index: 0, reloadKey: 0 })

/** Sites known to allow embedding; everything else gets a preview card. */
const embeddable = (url: string) => /^https:\/\/[^/]+\.vercel\.app/.test(url)

function normalize(input: string): string {
  const t = input.trim()
  if (!t) return HOME
  if (t.startsWith('surajos://')) return t
  if (/^https?:\/\//i.test(t)) return t
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(t)) return `https://${t}`
  return `surajos://search?q=${encodeURIComponent(t)}`
}

function titleFor(url: string) {
  if (url === HOME) return 'Start Page'
  if (url.startsWith('surajos://search')) return `Search: ${decodeURIComponent(url.split('q=')[1] ?? '')}`
  if (url.startsWith(portfolio.github)) return `${portfolio.githubUser} · GitHub`
  if (url.startsWith(portfolio.linkedin)) return `${portfolio.name} · LinkedIn`
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function Favicon({ url }: { url: string }) {
  if (url.startsWith(portfolio.github) || url.includes('github.com')) return <GitHubMark size={13} />
  if (url.includes('linkedin.com')) return <LinkedInMark size={13} />
  return <Globe size={13} />
}

function StartPage({ go }: { go: (u: string) => void }) {
  const favorites = [
    { label: 'GitHub', url: portfolio.github, bg: '#24292f', icon: <GitHubMark size={26} /> },
    { label: 'LinkedIn', url: portfolio.linkedin, bg: '#0a66c2', icon: <LinkedInMark size={24} /> },
    ...projects
      .filter((p) => p.live)
      .map((p) => ({ label: p.name, url: p.live!, bg: `linear-gradient(135deg, ${p.theme.from}, ${p.theme.to})`, icon: <span className="text-[22px] font-bold">{p.name[0]}</span> })),
  ]
  return (
    <div className="scroll-thin h-full overflow-y-auto bg-[var(--surface-solid)]">
      <div className="mx-auto max-w-[760px] px-8 py-12">
        <h1 className="text-[22px] font-bold">Favorites</h1>
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-5">
          {favorites.map((f) => (
            <button key={f.url} type="button" onClick={() => go(f.url)} className="group flex flex-col items-center gap-2">
              <span className="grid h-[68px] w-[68px] place-items-center rounded-[16px] text-white shadow-[0_2px_8px_rgba(0,0,0,.18)] transition group-hover:scale-105" style={{ background: f.bg }}>
                {f.icon}
              </span>
              <span className="line-clamp-2 text-center text-[12px] leading-tight text-[var(--text-2)]">{f.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-10 rounded-[14px] bg-[var(--surface-3)] p-4 text-[13px] leading-relaxed text-[var(--text-2)]">
          <span className="font-semibold text-[var(--text)]">This browser is simulated.</span> Live demos on Vercel load right here. Sites that don’t allow embedding, like GitHub and LinkedIn, show a preview with a button that opens the real page in a new tab.
        </div>
      </div>
    </div>
  )
}

function SearchPage({ q }: { q: string }) {
  const results = search(q, 12)
  return (
    <div className="scroll-thin h-full overflow-y-auto bg-[var(--surface-solid)]">
      <div className="mx-auto max-w-[680px] px-8 py-8">
        <div className="text-[13px] text-[var(--text-3)]">Results in this portfolio for “{q}”</div>
        <div className="mt-4 space-y-4">
          {results.map((r) => (
            <button key={r.id} type="button" onClick={() => r.run()} className="block w-full text-left">
              <div className="text-[11px] text-[var(--text-3)]">surajos › {r.group.toLowerCase()}</div>
              <div className="text-[17px] text-[var(--accent)] hover:underline">{r.title}</div>
              <div className="line-clamp-2 text-[13px] text-[var(--text-2)]">{r.preview ?? r.subtitle}</div>
            </button>
          ))}
          {!results.length && <div className="text-[13px]">Nothing in the portfolio matches.</div>}
        </div>
        <div className="mt-8 border-t border-[var(--border)] pt-4">
          <Button onClick={() => window.open(`https://duckduckgo.com/?q=${encodeURIComponent(q)}`, '_blank', 'noopener')}>
            <Search size={13} /> Search the web for “{q}” in a new tab
          </Button>
        </div>
      </div>
    </div>
  )
}

function GitHubPage() {
  const gh = useGitHub()
  if (gh.status === 'loading')
    return (
      <div className="grid h-full place-items-center bg-[var(--surface-solid)]">
        <Spinner size={24} />
      </div>
    )
  if (gh.status === 'error')
    return (
      <div className="grid h-full place-items-center bg-[var(--surface-solid)] p-8 text-center text-[13px] text-[var(--text-2)]">
        <div>
          GitHub’s API didn’t answer ({gh.message}).
          <div className="mt-3">
            <Button variant="primary" onClick={() => window.open(portfolio.github, '_blank', 'noopener')}>
              <ExternalLink size={13} /> Open github.com/{portfolio.githubUser}
            </Button>
          </div>
        </div>
      </div>
    )
  const { user, repos } = gh.data
  return (
    <div className="scroll-thin @container h-full overflow-y-auto bg-[var(--surface-solid)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-3">
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <GitHubMark size={20} /> {user.login}
        </span>
        <Button size="sm" variant="primary" onClick={() => window.open(user.html_url, '_blank', 'noopener')}>
          <ExternalLink size={12} /> Open on GitHub
        </Button>
      </div>
      <div className="grid gap-8 px-6 py-6 @[720px]:grid-cols-[220px_1fr]">
        <aside>
          <img src={user.avatar_url} alt="" className="h-28 w-28 rounded-full ring-1 ring-[var(--border)] @[720px]:h-[200px] @[720px]:w-[200px]" />
          <div className="mt-3 text-[22px] font-bold">{user.name ?? portfolio.name}</div>
          <div className="text-[15px] text-[var(--text-3)]">{user.login}</div>
          {user.bio && <p className="mt-2 text-[13px]">{user.bio}</p>}
          <div className="mt-2 text-[12px] text-[var(--text-2)]">
            <b>{user.followers}</b> followers · <b>{user.following}</b> following
          </div>
        </aside>
        <section>
          <div className="mb-2 text-[13px] font-semibold">
            Repositories <span className="rounded-full bg-[var(--surface-3)] px-1.5 text-[11px]">{user.public_repos}</span>
          </div>
          <div className="grid gap-3 @[560px]:grid-cols-2">
            {repos.slice(0, 12).map((r) => (
              <a key={r.id} href={r.html_url} target="_blank" rel="noopener noreferrer" className="block rounded-[10px] border border-[var(--border)] p-3 hover:bg-[var(--hover)]">
                <div className="truncate text-[13px] font-semibold text-[var(--accent)]">{r.name}</div>
                <p className="mt-1 line-clamp-2 min-h-[32px] text-[12px] text-[var(--text-2)]">{r.description ?? 'No description'}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--text-3)]">
                  {r.language && (
                    <span className="flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: languageColors[r.language] ?? '#888' }} />
                      {r.language}
                    </span>
                  )}
                  {r.stargazers_count > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star size={11} /> {r.stargazers_count}
                    </span>
                  )}
                  {r.forks_count > 0 && (
                    <span className="flex items-center gap-0.5">
                      <GitFork size={11} /> {r.forks_count}
                    </span>
                  )}
                  <span>Updated {timeAgo(r.pushed_at)}</span>
                </div>
              </a>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-[var(--text-3)]">Live data from the public GitHub API. Links open github.com in a new tab.</p>
        </section>
      </div>
    </div>
  )
}

function ExternalCard({ url }: { url: string }) {
  const isLinkedIn = url.includes('linkedin.com')
  return (
    <div className="grid h-full place-items-center bg-[var(--surface-solid)] p-8">
      <div className="max-w-[420px] text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[16px] text-white" style={{ background: isLinkedIn ? '#0a66c2' : '#64748b' }}>
          {isLinkedIn ? <LinkedInMark size={30} /> : <Globe size={30} />}
        </div>
        <div className="mt-4 text-[17px] font-semibold">{isLinkedIn ? `${portfolio.name} on LinkedIn` : titleFor(url)}</div>
        <p className="mt-1 break-all text-[12px] text-[var(--text-3)]">{url}</p>
        <p className="mt-3 text-[13px] text-[var(--text-2)]">This site doesn’t allow being shown inside another page, so it opens safely in a new browser tab.</p>
        <Button variant="primary" className="mt-4" onClick={() => window.open(url, '_blank', 'noopener')}>
          <ExternalLink size={13} /> Open in new tab
        </Button>
      </div>
    </div>
  )
}

function Page({ url, reloadKey, onLoad, go }: { url: string; reloadKey: number; onLoad: () => void; go: (u: string) => void }) {
  useEffect(() => {
    if (!embeddable(url)) {
      const t = setTimeout(onLoad, 350)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey])
  if (url === HOME) return <StartPage go={go} />
  if (url.startsWith('surajos://search')) return <SearchPage q={decodeURIComponent(url.split('q=')[1] ?? '')} />
  if (url.replace(/\/$/, '').toLowerCase() === portfolio.github.toLowerCase()) return <GitHubPage key={reloadKey} />
  if (embeddable(url)) return <iframe key={reloadKey} title={titleFor(url)} src={url} onLoad={onLoad} className="h-full w-full border-0 bg-white" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads" />
  return <ExternalCard url={url} />
}

export default function Safari({ windowId, props }: AppProps) {
  const [tabs, setTabs] = useState<Tab[]>(() => [newTab((props.url as string) ?? HOME)])
  const [activeId, setActiveId] = useState(tabs[0].id)
  const [address, setAddress] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const addressRef = useRef<HTMLInputElement>(null)
  const tab = tabs.find((t) => t.id === activeId) ?? tabs[0]
  const url = tab.history[tab.index]

  useEffect(() => {
    if (!editing) setAddress(url === HOME ? '' : url)
  }, [url, editing])
  useEffect(() => {
    setLoading(true)
  }, [url, tab.reloadKey, activeId])
  useEffect(() => {
    useWindows.getState().setTitle(windowId, titleFor(url))
  }, [url, windowId])

  // Opening Safari again with a URL opens it in a new tab.
  const firstNonce = useRef(props.nonce)
  useEffect(() => {
    if (props.nonce === firstNonce.current || !props.url) return
    const t = newTab(props.url as string)
    setTabs((ts) => [...ts, t])
    setActiveId(t.id)
  }, [props.nonce, props.url])

  const update = (fn: (t: Tab) => Tab) => setTabs((ts) => ts.map((t) => (t.id === tab.id ? fn(t) : t)))
  const go = (raw: string) => {
    const next = normalize(raw)
    update((t) => ({ ...t, history: [...t.history.slice(0, t.index + 1), next], index: t.index + 1 }))
  }
  const reload = () => update((t) => ({ ...t, reloadKey: t.reloadKey + 1 }))
  const addTab = () => {
    const t = newTab()
    setTabs((ts) => [...ts, t])
    setActiveId(t.id)
    setTimeout(() => addressRef.current?.focus(), 50)
  }
  const closeTab = (id: number) => {
    if (tabs.length === 1) {
      useWindows.getState().close(windowId)
      return
    }
    const i = tabs.findIndex((t) => t.id === id)
    const rest = tabs.filter((t) => t.id !== id)
    setTabs(rest)
    if (id === activeId) setActiveId(rest[Math.max(0, i - 1)].id)
  }

  useAppCommand(windowId, (cmd) => {
    if (cmd === 'reload') reload()
    if (cmd === 'new-tab') addTab()
    if (cmd === 'focus-address') addressRef.current?.select()
  })

  const secure = url.startsWith('https://')

  return (
    <div className="flex h-full flex-col bg-[var(--surface-solid)]">
      <div data-drag-region className="glass-strong flex h-[52px] shrink-0 items-center gap-1 border-b border-[var(--border)] pl-[86px] pr-3">
        <IconButton label="Back" disabled={tab.index === 0} onClick={() => update((t) => ({ ...t, index: t.index - 1 }))}>
          <ChevronLeft size={18} />
        </IconButton>
        <IconButton label="Forward" disabled={tab.index >= tab.history.length - 1} onClick={() => update((t) => ({ ...t, index: t.index + 1 }))}>
          <ChevronRight size={18} />
        </IconButton>
        <IconButton label="Home" onClick={() => go(HOME)}>
          <House size={15} />
        </IconButton>
        <form
          className="relative mx-2 flex h-[30px] min-w-0 flex-1 items-center rounded-[8px] bg-[var(--surface-3)] shadow-[inset_0_0_0_.5px_var(--border)] focus-within:shadow-[0_0_0_3px_var(--accent-soft),inset_0_0_0_1px_var(--accent)]"
          onSubmit={(e) => {
            e.preventDefault()
            go(address)
            addressRef.current?.blur()
          }}
        >
          <span className="pl-2.5 text-[var(--text-3)]">{secure ? <Lock size={12} /> : <Search size={12} />}</span>
          <input
            ref={addressRef}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => {
              setEditing(true)
              e.target.select()
            }}
            onBlur={() => setEditing(false)}
            placeholder="Search or enter website name"
            aria-label="Address and search"
            className={`h-full min-w-0 flex-1 bg-transparent px-2 text-[13px] outline-none placeholder:text-[var(--text-3)] ${editing ? 'text-left' : 'text-center'}`}
          />
          <button type="button" aria-label="Reload page" onClick={reload} className="px-2.5 text-[var(--text-3)] hover:text-[var(--text)]">
            <RotateCw size={13} />
          </button>
          <AnimatePresence>
            {loading && (
              <motion.div className="absolute bottom-0 left-0 h-[2px] rounded-full bg-[var(--accent)]" initial={{ width: '0%', opacity: 1 }} animate={{ width: '85%' }} exit={{ width: '100%', opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
            )}
          </AnimatePresence>
        </form>
        <IconButton label="Open in new browser tab" disabled={!url.startsWith('http')} onClick={() => window.open(url, '_blank', 'noopener')}>
          <ExternalLink size={15} />
        </IconButton>
        <IconButton label="New tab" onClick={addTab}>
          <Plus size={17} />
        </IconButton>
      </div>

      {tabs.length > 1 && (
        <div role="tablist" className="flex h-[30px] shrink-0 gap-px border-b border-[var(--border)] bg-[var(--surface-2)] px-1">
          {tabs.map((t) => {
            const u = t.history[t.index]
            return (
              <div
                key={t.id}
                role="tab"
                aria-selected={t.id === activeId}
                onClick={() => setActiveId(t.id)}
                className={`group relative flex min-w-0 flex-1 items-center justify-center gap-1.5 px-6 text-[12px] ${t.id === activeId ? 'bg-[var(--surface-solid)] font-medium' : 'text-[var(--text-2)] hover:bg-[var(--hover)]'}`}
              >
                <button
                  type="button"
                  aria-label="Close tab"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(t.id)
                  }}
                  className="absolute left-1.5 grid h-4 w-4 place-items-center rounded-[4px] opacity-0 hover:bg-[var(--hover)] group-hover:opacity-100"
                >
                  <X size={11} />
                </button>
                <Favicon url={u} />
                <span className="truncate">{titleFor(u)}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <Page key={`${tab.id}-${url}`} url={url} reloadKey={tab.reloadKey} onLoad={() => setLoading(false)} go={go} />
      </div>
    </div>
  )
}
