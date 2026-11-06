import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleCheck, Copy, Mail, MapPin, Send } from 'lucide-react'
import type { AppProps } from '@/types'
import { portfolio } from '@/portfolio.config'
import { Button, Spinner } from '@/components/shared/ui'
import { GitHubMark, LinkedInMark } from '@/components/shared/BrandIcons'
import { openApp } from '@/store/windowStore'
import { sounds } from '@/lib/sound'

/** Set VITE_CONTACT_ENDPOINT (e.g. a Formspree form URL) to send messages for real. */
const ENDPOINT = (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined)?.trim() || ''

type Field = 'name' | 'email' | 'subject' | 'message'
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string }

function validate(v: Record<Field, string>) {
  const e: Partial<Record<Field, string>> = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (v.subject.trim().length < 3) e.subject = 'Please add a short subject.'
  if (v.message.trim().length < 10) e.message = 'Please write at least 10 characters.'
  return e
}

export default function Contact(_: AppProps) {
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', subject: '', message: '' })
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [copied, setCopied] = useState(false)
  const errors = validate(values)
  const valid = Object.keys(errors).length === 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, subject: true, message: true })
    if (!valid) return
    if (!ENDPOINT) {
      // No backend configured: hand the message to the visitor's own email app. Nothing is "sent" here.
      const body = `${values.message}\n\n— ${values.name} (${values.email})`
      window.location.href = `mailto:${portfolio.email}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(body)}`
      return
    }
    setStatus({ kind: 'sending' })
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error(`The form service answered ${res.status}.`)
      sounds.sent()
      setStatus({ kind: 'sent' })
      setValues({ name: '', email: '', subject: '', message: '' })
      setTouched({})
    } catch (err) {
      sounds.error()
      setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'The message could not be sent.' })
    }
  }

  const input = (f: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-[var(--text-2)]">{label}</span>
      <input
        value={values[f]}
        onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}
        onBlur={() => setTouched((t) => ({ ...t, [f]: true }))}
        aria-invalid={!!(touched[f] && errors[f])}
        className={`h-[32px] w-full rounded-[8px] bg-[var(--surface-3)] px-2.5 text-[13px] outline-none shadow-[inset_0_0_0_.5px_var(--border)] focus:shadow-[0_0_0_3px_var(--accent-soft),inset_0_0_0_1px_var(--accent)] ${touched[f] && errors[f] ? 'shadow-[inset_0_0_0_1px_var(--sys-red)]' : ''}`}
        {...props}
      />
      {touched[f] && errors[f] && <span className="mt-1 block text-[11px] text-[var(--sys-red)]">{errors[f]}</span>}
    </label>
  )

  return (
    <div className="scroll-thin @container h-full overflow-y-auto bg-[var(--surface-solid)]">
      <div className="grid min-h-full @[620px]:grid-cols-[250px_1fr]">
        <aside className="space-y-4 border-b border-[var(--border)] bg-[var(--surface-2)] p-6 @[620px]:border-b-0 @[620px]:border-r">
          <img src={portfolio.profileImage} alt="" className="h-16 w-16 rounded-full object-cover" />
          <div>
            <div className="text-[17px] font-bold">{portfolio.name}</div>
            <div className="text-[12px] text-[var(--text-2)]">{portfolio.title}</div>
          </div>
          <div className="space-y-2 text-[13px]">
            <div className="flex items-center gap-2">
              <Mail size={14} className="shrink-0 text-[var(--text-3)]" />
              <a className="selectable truncate text-[var(--accent)] hover:underline" href={`mailto:${portfolio.email}`}>
                {portfolio.email}
              </a>
              <button
                type="button"
                aria-label="Copy email address"
                onClick={() => {
                  void navigator.clipboard?.writeText(portfolio.email).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  })
                }}
                className="text-[var(--text-3)] hover:text-[var(--text)]"
              >
                {copied ? <CircleCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </button>
            </div>
            <a className="flex items-center gap-2 hover:underline" href={portfolio.linkedin} target="_blank" rel="noopener noreferrer">
              <LinkedInMark size={14} /> LinkedIn
            </a>
            <button type="button" className="flex items-center gap-2 hover:underline" onClick={() => openApp('safari', { url: portfolio.github })}>
              <GitHubMark size={14} /> github.com/{portfolio.githubUser}
            </button>
            <div className="flex items-center gap-2 text-[var(--text-2)]">
              <MapPin size={14} className="text-[var(--text-3)]" /> {portfolio.location}
            </div>
          </div>
          <div className="rounded-[10px] bg-emerald-500/10 p-2.5 text-[12px] text-emerald-700 dark:text-emerald-300">
            {portfolio.availability} · {portfolio.timezoneLabel}
          </div>
        </aside>

        <section className="p-6">
          <h1 className="text-[22px] font-bold">Send a message</h1>
          <p className="mt-1 text-[13px] text-[var(--text-2)]">
            {ENDPOINT ? 'Your message goes straight to Suraj’s inbox.' : 'This opens your email app with the message filled in, ready to send.'}
          </p>
          <AnimatePresence mode="wait">
            {status.kind === 'sent' ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 flex flex-col items-center gap-3 rounded-[16px] bg-emerald-500/10 p-8 text-center">
                <CircleCheck size={40} className="text-emerald-500" />
                <div className="text-[15px] font-semibold">Message sent</div>
                <p className="text-[13px] text-[var(--text-2)]">Thanks for reaching out. Suraj will reply to the email you gave.</p>
                <Button onClick={() => setStatus({ kind: 'idle' })}>Write another</Button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} noValidate className="mt-5 space-y-3.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid gap-3.5 @[480px]:grid-cols-2">
                  {input('name', 'Name', { autoComplete: 'name', placeholder: 'Your name' })}
                  {input('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@company.com' })}
                </div>
                {input('subject', 'Subject', { placeholder: 'What is it about?' })}
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-[var(--text-2)]">Message</span>
                  <textarea
                    value={values.message}
                    onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                    rows={6}
                    aria-invalid={!!(touched.message && errors.message)}
                    placeholder="Hi Suraj, …"
                    className={`w-full resize-none rounded-[8px] bg-[var(--surface-3)] px-2.5 py-2 text-[13px] leading-relaxed outline-none shadow-[inset_0_0_0_.5px_var(--border)] focus:shadow-[0_0_0_3px_var(--accent-soft),inset_0_0_0_1px_var(--accent)] ${touched.message && errors.message ? 'shadow-[inset_0_0_0_1px_var(--sys-red)]' : ''}`}
                  />
                  {touched.message && errors.message && <span className="mt-1 block text-[11px] text-[var(--sys-red)]">{errors.message}</span>}
                </label>
                {status.kind === 'error' && (
                  <div role="alert" className="rounded-[8px] bg-[var(--sys-red)]/10 p-2.5 text-[12px] text-[var(--sys-red)]">
                    {status.message} You can also email{' '}
                    <a className="underline" href={`mailto:${portfolio.email}`}>
                      {portfolio.email}
                    </a>
                    .
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <span className="mr-auto text-[11px] text-[var(--text-3)]">{values.message.length} characters</span>
                  <Button type="submit" variant="primary" disabled={status.kind === 'sending'}>
                    {status.kind === 'sending' ? <Spinner size={14} className="!text-white" /> : <Send size={13} />}
                    {status.kind === 'sending' ? 'Sending…' : ENDPOINT ? 'Send message' : 'Open in email app'}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}
