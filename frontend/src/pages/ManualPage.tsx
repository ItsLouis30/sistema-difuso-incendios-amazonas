import { ArrowRight, MapPin, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { DEFAULT_INPUTS, VARIABLES, type InputKey } from '../app/constants'
import { useAppContext } from '../app/AppContext'
import { Pill } from '../components/common/Bento'
import { ErrorState } from '../components/common/Feedback'
import { InferenceDashboard } from '../features/dashboard/InferenceDashboard'
import { PipelineStrip } from '../features/dashboard/ResultCards'
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
          <aside className="hidden w-[470px] shrink-0 overflow-hidden rounded-[28px] border border-line bg-white xl:grid xl:grid-cols-[145px_1fr]">
            <div
              className="relative min-h-[210px] overflow-hidden bg-[linear-gradient(145deg,#14352f,#2b5b4f)] text-white"
              role="img"
              aria-label="Referencia geográfica estilizada de Chachapoyas"
            >
              <svg viewBox="0 0 145 210" className="absolute inset-0 h-full w-full opacity-55" fill="none" aria-hidden>
                <path d="M-15 34C18 12 47 16 69 34s50 22 86-1" stroke="#76c79e" strokeWidth="1.2" />
                <path d="M-18 55C13 34 43 36 65 54s54 25 91 0" stroke="#76c79e" strokeWidth="1.2" />
                <path d="M-12 78C20 56 48 60 70 77s50 20 84-2" stroke="#76c79e" strokeWidth="1.2" />
                <path d="M-20 105C16 81 47 84 69 104s51 22 91-5" stroke="#76c79e" strokeWidth="1.2" />
                <path d="M-8 132C19 111 47 112 68 128s47 21 78 2" stroke="#76c79e" strokeWidth="1.2" />
                <path d="M-16 161C18 137 48 142 72 159s48 20 84-4" stroke="#76c79e" strokeWidth="1.2" />
                <path d="M-12 192C20 170 49 173 71 190s48 18 82-3" stroke="#76c79e" strokeWidth="1.2" />
                <circle cx="76" cy="70" r="28" stroke="#a7e6c2" strokeWidth="1" />
                <circle cx="76" cy="70" r="18" stroke="#a7e6c2" strokeWidth="1" />
              </svg>
              <span className="absolute left-[61px] top-[73px] flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/80 bg-ember-500 shadow-lg">
                <MapPin size={18} />
              </span>
              <span className="absolute bottom-3 left-3 rounded-full bg-black/25 px-2.5 py-1 text-[9px] font-medium backdrop-blur-sm">
                6.21° S · 77.87° W
              </span>
            </div>
            <div className="flex min-w-0 flex-col justify-center p-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Ámbito del modelo</span>
              <strong className="mt-1 text-base leading-tight text-ink">Chachapoyas, Amazonas</strong>
              <span className="mt-1 text-[11px] leading-snug text-muted">Punto geográfico de referencia</span>
              <div className="mt-3 border-t border-line pt-3">
                <strong className="block text-[13px] leading-snug text-ink">6 250 hectáreas afectadas</strong>
                <span className="mt-0.5 block text-[10px] text-muted">Equivale aproximadamente a 62,5 km²</span>
                <a
                  href="https://www.gob.pe/institucion/contraloria/noticias/1078508-contraloria-entidades-publicas-de-amazonas-carecen-de-plan-de-contingencia-ante-incendios-forestales"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block text-[10px] leading-snug text-muted underline decoration-line underline-offset-2 hover:text-ink"
                >
                  Provincia de Chachapoyas · hasta 29 sep. 2024
                </a>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">Incendios reportados en 2025</span>
                <div className="mt-1.5 grid gap-1">
                  <a
                    href="https://www.congreso.gob.pe/Docs/riesgodesastres/files/resumenemergenciasfinal_n%C2%B0175_06_octubre_2025.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] leading-snug text-ink underline decoration-line underline-offset-2 hover:text-ember-600"
                  >
                    1 oct. · Granada: 2 hectáreas de cobertura natural destruidas
                  </a>
                  <a
                    href="https://portal.indeci.gob.pe/emergencias/reporte-preliminar-n-1280-4-9-2025-coen-indeci-1130-horas-incendio-forestal-en-el-distrito-de-levanto-amazonas/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] leading-snug text-ink underline decoration-line underline-offset-2 hover:text-ember-600"
                  >
                    3 sep. · Levanto: incendio con daños a la cobertura natural
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {pipeline && (
        <div className="px-4 pt-4 md:px-6">
          <PipelineStrip step={pipeline.step} done={!pipeline.running} />
        </div>
      )}

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
