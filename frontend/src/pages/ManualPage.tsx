import { ArrowRight, MapPin, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_INPUTS, VARIABLES, type InputKey } from '../app/constants'
import { useAppContext } from '../app/AppContext'
import { Pill } from '../components/common/Bento'
import { ErrorState } from '../components/common/Feedback'
import { InferenceDashboard } from '../features/dashboard/InferenceDashboard'
import { usePipelineAnimation } from '../features/dashboard/usePipelineAnimation'
import { api } from '../services/api/client'
import type { InferenceRequest, InferenceResponse } from '../types/api'

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
      <section className="overflow-hidden bg-band px-5 pb-8 pt-7 md:px-8">
        <div className="flex min-w-0 items-start justify-between gap-5">
          <div className="min-w-0">
            <Pill tone="dark" className="mb-4 px-4! py-2! text-sm!">Evaluación manual</Pill>
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-[36px]">
              ¿Qué nivel preventivo indican las condiciones?
            </h1>
            <p className="mt-1 font-display text-[24px] font-medium leading-tight tracking-[-0.02em] text-[#a9a4a0] md:text-[30px]">
              Ajusta las cuatro variables y evalúa.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
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
            </div>
          </div>
          <span
            className="hidden h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-white text-[10px] text-muted xl:flex"
            title="Chachapoyas, Amazonas, Perú"
          >
            <MapPin size={20} className="mb-0.5 text-ink" />
            Chachapoyas
          </span>
        </div>
      </section>

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
