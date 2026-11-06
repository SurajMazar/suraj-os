/** Brand marks, used only to link to the matching profile. */
export function GitHubMark({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

export function LinkedInMark({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  )
}

/** The SurajOS mark for the menu bar: a coin with the S monogram cut out of it. */
export function SystemMark({ size = 15 }: { size?: number }) {
  const id = 'sm-cut'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <mask id={id}>
          <rect width="24" height="24" fill="#fff" />
          <path d="M15.6 7.9c-.8-1.1-2.1-1.8-3.7-1.8-2.2 0-3.8 1.2-3.8 3 0 1.7 1.3 2.5 3.7 3.1 2.6.6 4.1 1.5 4.1 3.5 0 2-1.7 3.3-4.2 3.3-1.8 0-3.2-.7-4.1-2" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="11" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  )
}

/** The full-color SurajOS logo (same artwork as the favicon). */
export function SurajOSLogo({ size = 64, className = '' }: { size?: number; className?: string }) {
  return <img src="./favicon.svg" alt="" width={size} height={size} draggable={false} className={className} />
}

/** The Control Center glyph: two stacked toggle switches, knobs on opposite sides. */
export function ControlCenterGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="1.9" />
      <rect x="3" y="13" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17" cy="7" r="2.3" fill="currentColor" />
      <circle cx="7" cy="17" r="2.3" fill="currentColor" />
    </svg>
  )
}
