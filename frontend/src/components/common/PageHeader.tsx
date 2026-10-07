import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 mb-8">
      <div className="flex-1">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-2">{eyebrow}</span>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
        <p className="text-gray-500 mt-2 max-w-2xl">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
