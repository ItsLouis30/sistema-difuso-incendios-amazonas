import { ArrowRight, MapPin, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_INPUTS, VARIABLES, type InputKey } from '../app/constants'
import { useAppContext } from '../app/AppContext'
import { DateBadge, HeroBand } from '../components/common/Bento'
import { ErrorState } from '../components/common/Feedback'
import { InferenceDashboard } from '../features/dashboard/InferenceDashboard'
import { usePipelineAnimation } from '../features/dashboard/usePipelineAnimation'
import { api } from '../services/api/client'
import type { InferenceRequest, InferenceResponse } from '../types/api'

/** DateBadge formatea en UTC; se fija la fecha local para que no se adelante de noche. */
function todayAsUtc() {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

export function ManualPage() {
  const { bootError } = useAppContext()
  const [inputs, setInputs] = useState<InferenceRequest>(DEFAULT_INPUTS)
  const [result, setResult] = useState<InferenceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { pipeline, start, play, reset } = usePipelineAnimation()
  const running = pipeline?.running ?? false

  function updateInput(key: InputKey, value: number) {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    const invalid = VARIABLES.find((variable) => {
      const value = inputs[variable.key]
      return !Number.isFinite(value) || value < variable.minimum || value > variable.maximum
    })
    if (invalid) {
      setError(`${invalid.label} debe estar entre ${invalid.minimum} y ${invalid.maximum} ${invalid.unit}.`)
      return
    }
    if (!Number.isInteger(inputs.dias_secos)) {
      setError('Los días secos deben ingresarse como un número entero.')
      return
    }
    setError(null)
    start()
    try {
      setResult(await api.manualInference(inputs))
      play()
    } catch (caught) {
      reset()
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar la inferencia.')
    }
  }

  function restore() {
    reset()
    setError(null)
    setInputs(DEFAULT_INPUTS)
    setResult(null)
  }

  return (
    <>
      <HeroBand
        left={
          <>
            <DateBadge date={todayAsUtc()} />
            <span className="hidden h-10 w-px bg-line sm:block" />
            <button
              type="button"
              onClick={() => void submit()}
              disabled={running}
              className="inline-flex max-w-full items-center gap-3 rounded-full bg-ember-500 py-3 pl-6 pr-5 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(226,96,58,0.9)] transition-colors hover:bg-ember-600 disabled:opacity-60 sm:gap-6"
            >
              {running ? 'Evaluando…' : 'Calcular nivel preventivo'}
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={restore}
              disabled={running}
              title="Restablecer valores por defecto"
              aria-label="Restablecer valores por defecto"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white transition-colors hover:bg-[#f0f0f0] disabled:opacity-60"
            >
              <RotateCcw size={17} />
            </button>
          </>
        }
        title="¿Qué nivel preventivo indican las condiciones?"
        subtitle="Ajusta las cuatro variables y evalúa."
        aside={
          <span
            className="hidden h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-white text-[10px] text-muted xl:flex"
            title="Chachapoyas, Amazonas, Perú"
          >
            <MapPin size={20} className="mb-0.5 text-ink" />
            Chachapoyas
          </span>
        }
      />

      {(bootError || error) && (
        <div className="space-y-2 px-4 pt-4 md:px-6">
          {bootError && <ErrorState message={bootError} />}
          {error && <ErrorState message={error} />}
        </div>
      )}

      <InferenceDashboard inputs={inputs} result={result} onInputChange={updateInput} pipeline={pipeline} />
    </>
  )
}
