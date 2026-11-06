import { useEffect, useState } from 'react'
import { portfolio } from '@/portfolio.config'

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  html_url: string
  location: string | null
}

export interface GitHubRepo {
  id: number
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  pushed_at: string
  fork: boolean
}

export interface GitHubData {
  user: GitHubUser
  repos: GitHubRepo[]
}

type State = { status: 'loading' } | { status: 'ready'; data: GitHubData } | { status: 'error'; message: string }

let inflight: Promise<GitHubData> | null = null
const KEY = 'surajos-github-v1'

function load(): Promise<GitHubData> {
  try {
    const cached = sessionStorage.getItem(KEY)
    if (cached) return Promise.resolve(JSON.parse(cached) as GitHubData)
  } catch {
    // Storage can be unavailable (private mode); fetch instead.
  }
  inflight ??= Promise.all([
    fetch(`https://api.github.com/users/${portfolio.githubUser}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`GitHub answered ${r.status}`)))),
    fetch(`https://api.github.com/users/${portfolio.githubUser}/repos?sort=pushed&per_page=30`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`GitHub answered ${r.status}`)))),
  ]).then(([user, repos]) => {
    const data = { user, repos: (repos as GitHubRepo[]).filter((r) => !r.fork) }
    try {
      sessionStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      // Not cached; fine.
    }
    return data
  })
  inflight.catch(() => {
    inflight = null
  })
  return inflight
}

/** Live public data from the GitHub API, cached for the session. */
export function useGitHub(): State {
  const [state, setState] = useState<State>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    load().then(
      (data) => alive && setState({ status: 'ready', data }),
      (e: Error) => alive && setState({ status: 'error', message: e.message }),
    )
    return () => {
      alive = false
    }
  }, [])
  return state
}

export const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  PHP: '#4F5D95',
  Go: '#00ADD8',
  Python: '#3572A5',
  Vue: '#41b883',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Blade: '#f7523f',
  Shell: '#89e051',
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  const units: [number, string][] = [
    [60 * 60 * 24 * 365, 'year'],
    [60 * 60 * 24 * 30, 'month'],
    [60 * 60 * 24 * 7, 'week'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ]
  for (const [n, label] of units) {
    const v = Math.floor(s / n)
    if (v >= 1) return `${v} ${label}${v > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
