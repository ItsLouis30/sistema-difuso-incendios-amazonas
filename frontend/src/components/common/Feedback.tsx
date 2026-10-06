import { AlertCircle, LoaderCircle } from 'lucide-react'

export function LoadingState({ message = 'Procesando con el motor Mamdani…' }: { message?: string }) {
  return <div className="feedback loading"><LoaderCircle className="spin" size={20} /><span>{message}</span></div>
}

export function ErrorState({ message }: { message: string }) {
  return <div className="feedback error" role="alert"><AlertCircle size={20} /><span>{message}</span></div>
}
