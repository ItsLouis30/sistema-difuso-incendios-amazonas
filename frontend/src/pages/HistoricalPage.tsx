import { ArrowRight, CalendarDays, Check, CloudRain, Info, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { formatDate, formatNumber } from '../app/format'
import { useAppContext } from '../app/AppContext'
import { DateBadge, HeroBand, Pill } from '../components/common/Bento'
import { ErrorState } from '../components/common/Feedback'
import { InferenceDashboard } from '../features/dashboard/InferenceDashboard'
import { PipelineStrip } from '../features/dashboard/ResultCards'
import { usePipelineAnimation } from '../features/dashboard/usePipelineAnimation'
import { api } from '../services/api/client'
import type { InferenceResponse } from '../types/api'

export function HistoricalPage() {
  const { historyRange, bootError } = useAppContext()
  const [selectedDate, setSelectedDate] = useState('2025-09-01')
  const [result, setResult] = useState<InferenceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { pipeline, start, play, reset } = usePipelineAnimation()
  const running = pipeline?.running ?? false
  const source = result?.fuente.tipo === 'historical' ? result.fuente : null
  const actionLabel = !pipeline
    ? 'Evaluar fecha'
    : running
      ? pipeline.step <= 0
        ? 'Recuperando datos…'
        : pipeline.step === 1
          ? 'Fuzzificando…'
          : pipeline.step <= 3
            ? 'Evaluando reglas…'
            : pipeline.step <= 5
              ? 'Calculando centroide…'
              : 'Generando resultado…'
      : 'Resultado listo'

  async function submit() {
    setError(null)
    start()
    try {
      setResult(await api.historicalInference(selectedDate))
      play()
    } catch (caught) {
      reset()
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar la inferencia.')
    }
  }

  return (
    <>
      <HeroBand
        left={
          <>
            <DateBadge date={new Date(`${selectedDate}T00:00:00Z`)} />
            <span className="hidden h-10 w-px bg-line sm:block" />
            <label className="flex items-center gap-2 rounded-full border border-line bg-white py-2 pl-4 pr-2 text-sm">
              <CalendarDays size={16} className="text-muted" />
              <span className="sr-only">Fecha de consulta</span>
              <input
                id="historical-date"
                type="date"
                className="bg-transparent outline-none"
                value={selectedDate}
                min={historyRange?.fecha_inicial ?? '2000-01-01'}
                max={historyRange?.fecha_final ?? '2025-12-31'}
                onChange={(event) => setSelectedDate(event.target.value)}
                disabled={running}
              />
            </label>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={running || !selectedDate}
              className="pressable focus-ring inline-flex min-w-[190px] max-w-full items-center justify-between gap-3 rounded-full bg-ember-500 py-3 pl-6 pr-5 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(226,96,58,0.9)] hover:bg-ember-600 disabled:cursor-wait disabled:opacity-80 sm:gap-6"
            >
              {actionLabel}
              {running ? <LoaderCircle size={18} className="animate-spin" /> : result ? <Check size={18} /> : <ArrowRight size={18} />}
            </button>
          </>
        }
        title="Volvamos a un día del pasado."
        subtitle={
          historyRange
            ? `ERA5 · ${formatDate(historyRange.fecha_inicial)} – ${formatDate(historyRange.fecha_final)}`
            : 'Datos ERA5 y ERA5-Land, 2000–2025.'
        }
      />

      <div className="px-4 pt-4 md:px-6">
        <div className="flex items-start gap-3 rounded-3xl border border-line bg-white px-4 py-3 text-xs leading-relaxed text-muted">
          <Info size={16} className="mt-0.5 shrink-0 text-ember-500" />
          <p>
            <strong className="text-ink">Fuente histórica:</strong> reanálisis ERA5 y ERA5-Land del ECMWF, consultados mediante Open-Meteo. SENAMHI también emplea ERA5 en estudios climáticos; no es proveedor ni validador de los registros usados aquí.
          </p>
        </div>
      </div>

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

      {source && !running && (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-4 md:px-6">
          <Pill tone={source.dentro_periodo_calibracion ? 'dark' : 'ember'}>
            <Info size={13} />
            {source.nota_interpretacion}
          </Pill>
          <Pill>
            <CloudRain size={13} />
            Precipitación {formatNumber(source.registro.pp_mm, 1)} mm
          </Pill>
          <Pill>Viento medio {formatNumber(source.registro.viento_medio_ms, 2)} m/s</Pill>
          <Pill>{source.dataset}</Pill>
        </div>
      )}

      <InferenceDashboard inputs={result?.entradas ?? null} result={result} pipeline={pipeline} />
    </>
  )
}
