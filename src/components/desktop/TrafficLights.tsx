import { useWindows } from '@/store/windowStore'

export function TrafficLights({ id, focused }: { id: string; focused: boolean }) {
  const { close, minimize, toggleMaximize } = useWindows.getState()
  const off = 'var(--traffic-off)'
  return (
    <div className="traffic-group flex items-center gap-2" data-no-drag>
      <button type="button" aria-label="Close window" className="traffic" style={{ background: focused ? '#ff5f57' : off }} onClick={() => close(id)}>
        <svg width="6" height="6" viewBox="0 0 6 6" stroke="#4d0000" strokeWidth="1.2" strokeLinecap="round">
          <path d="M1 1l4 4M5 1L1 5" />
        </svg>
      </button>
      <button type="button" aria-label="Minimize window" className="traffic" style={{ background: focused ? '#febc2e' : off }} onClick={() => minimize(id)}>
        <svg width="6" height="6" viewBox="0 0 6 6" stroke="#5a3a00" strokeWidth="1.2" strokeLinecap="round">
          <path d="M.8 3h4.4" />
        </svg>
      </button>
      <button type="button" aria-label="Zoom window" className="traffic" style={{ background: focused ? '#28c840' : off }} onClick={() => toggleMaximize(id)}>
        <svg width="6" height="6" viewBox="0 0 6 6" fill="#004d00">
          <path d="M1 1h2.6L1 3.6zM5 5H2.4L5 2.4z" />
        </svg>
      </button>
    </div>
  )
}
