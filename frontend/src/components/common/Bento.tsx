import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <article className={`bento-card rise ${className}`}>{children}</article>
}

export function IconCircle({ children, dark = false, className = '' }: {
  children: ReactNode
  dark?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
        dark ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink'
      } ${className}`}
    >
      {children}
    </span>
  )
}

export function Pill({ children, tone = 'light', className = '' }: {
  children: ReactNode
  tone?: 'light' | 'dark' | 'ember'
  className?: string
}) {
  const tones = {
    light: 'border border-line bg-white text-ink',
    dark: 'bg-ink text-white',
    ember: 'bg-ember-50 text-ember-600',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function CardTitle({ title, caption, action }: { title: string; caption?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        {caption && <p className="mt-1 text-[13px] text-muted">{caption}</p>}
      </div>
      {action}
    </div>
  )
}

/** Banda superior de cada página: fecha/acción a la izquierda y saludo grande a la derecha. */
export function HeroBand({ left, title, subtitle, aside }: {
  left: ReactNode
  title: ReactNode
  subtitle: string
  aside?: ReactNode
}) {
  return (
    <section className="flex min-w-0 flex-col gap-6 overflow-hidden bg-band px-5 pb-8 pt-7 md:px-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full min-w-0 flex-wrap items-center gap-4 lg:w-auto">{left}</div>
      <div className="flex min-w-0 items-center gap-5">
        <div className="min-w-0 lg:text-left">
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[34px]">{title}</h1>
          <p className="font-display text-[26px] font-medium leading-tight tracking-[-0.02em] text-[#a9a4a0] md:text-[34px]">{subtitle}</p>
        </div>
        {aside}
      </div>
    </section>
  )
}

export function DateBadge({ date }: { date: Date }) {
  const weekday = new Intl.DateTimeFormat('es-PE', { weekday: 'short', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' }).format(date)
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white font-display text-[26px] font-medium">
        {date.getUTCDate()}
      </span>
      <span className="text-sm leading-tight text-ink">
        <span className="capitalize">{weekday.replace('.', '')},</span>
        <br />
        <span className="capitalize">{month}</span> {date.getUTCFullYear()}
      </span>
    </div>
  )
}
