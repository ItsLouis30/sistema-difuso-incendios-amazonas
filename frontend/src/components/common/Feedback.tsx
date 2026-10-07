import { AlertCircle, LoaderCircle } from 'lucide-react'

export function LoadingState({ message = 'Procesando con el motor Mamdani…' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm text-muted">
      <LoaderCircle className="animate-spin" size={16} />
      <span>{message}</span>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-3xl border border-ember-200 bg-ember-50 px-4 py-3 text-sm text-ember-700" role="alert">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
