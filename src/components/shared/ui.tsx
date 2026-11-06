import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle, Search, X } from 'lucide-react'
import { sounds } from '@/lib/sound'

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <LoaderCircle size={size} className={`animate-spin text-[var(--text-3)] ${className}`} aria-label="Loading" />
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' }>(
  function Button({ variant = 'secondary', size = 'md', className = '', ...rest }, ref) {
    const base =
      'inline-flex items-center justify-center gap-1.5 rounded-[7px] font-medium transition active:scale-[.97] disabled:opacity-50 disabled:active:scale-100 select-none whitespace-nowrap'
    const sizes = { sm: 'h-[24px] px-2.5 text-[12px]', md: 'h-[30px] px-3.5 text-[13px]' }
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-[var(--accent)] text-white shadow-[0_1px_2px_rgba(0,0,0,.2)] hover:brightness-110',
      secondary: 'bg-[var(--surface-3)] text-[var(--text)] shadow-[inset_0_0_0_.5px_var(--border-strong)] hover:bg-[var(--hover)]',
      ghost: 'text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text)]',
      danger: 'bg-[var(--sys-red)] text-white hover:brightness-110',
    }
    return <button ref={ref} type="button" className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest} />
  },
)

export function IconButton({ label, children, active, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-[28px] min-w-[28px] place-items-center rounded-[6px] px-1 text-[var(--text-2)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-35 disabled:hover:bg-transparent ${active ? 'bg-[var(--hover)] text-[var(--text)]' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { onClear?: () => void }>(function SearchInput(
  { className = '', onClear, value, ...rest },
  ref,
) {
  return (
    <label className={`relative flex h-[28px] items-center rounded-[7px] bg-[var(--surface-3)] shadow-[inset_0_0_0_.5px_var(--border)] focus-within:shadow-[0_0_0_3px_var(--accent-soft),inset_0_0_0_1px_var(--accent)] ${className}`}>
      <Search size={13} className="pointer-events-none absolute left-2 text-[var(--text-3)]" />
      <input ref={ref} value={value} type="search" className="h-full w-full bg-transparent pl-7 pr-6 text-[13px] outline-none placeholder:text-[var(--text-3)] [&::-webkit-search-cancel-button]:hidden" {...rest} />
      {onClear && value ? (
        <button type="button" aria-label="Clear search" onClick={onClear} className="absolute right-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--text-3)] text-[var(--surface-solid)]">
          <X size={10} strokeWidth={3} />
        </button>
      ) : null}
    </label>
  )
})

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; title?: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-[26px] items-center rounded-[7px] bg-[var(--surface-3)] p-[2px] shadow-[inset_0_0_0_.5px_var(--border)]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          aria-label={o.title}
          onClick={() => onChange(o.value)}
          className={`flex h-full items-center justify-center rounded-[5px] px-2 text-[12px] font-medium transition ${value === o.value ? 'bg-[var(--surface-solid)] text-[var(--text)] shadow-[0_1px_2px_rgba(0,0,0,.18)]' : 'text-[var(--text-2)] hover:text-[var(--text)]'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        if (checked) sounds.toggleOff()
        else sounds.toggleOn()
        onChange(!checked)
      }}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${checked ? 'bg-[var(--sys-green)]' : 'bg-[var(--border-strong)]'}`}
    >
      <span className={`absolute left-0 top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
    </button>
  )
}

export function Slider({ value, onChange, min = 0, max = 1, step = 0.01, label, className = '' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string; className?: string }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`os-slider h-[6px] w-full cursor-pointer appearance-none rounded-full ${className}`}
      style={{ background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border-strong) ${pct}%)` }}
    />
  )
}

export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex h-[20px] items-center rounded-full px-2 text-[11px] font-medium"
      style={color ? { background: `${color}22`, color } : { background: 'var(--surface-3)', color: 'var(--text-2)' }}
    >
      {children}
    </span>
  )
}

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-[var(--text-3)]">
      <div className="opacity-70">{icon}</div>
      <div className="text-[13px] font-semibold text-[var(--text-2)]">{title}</div>
      {body ? <div className="max-w-[320px] text-[12px] leading-relaxed">{body}</div> : null}
    </div>
  )
}
