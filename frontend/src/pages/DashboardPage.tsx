import { CalendarDays, Database, Info, Play, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_INPUTS, VARIABLES, type InputKey } from '../app/constants'
import { formatDate } from '../app/format'
import { useAppContext } from '../app/AppContext'
import { ErrorState, LoadingState } from '../components/common/Feedback'
import { PageHeader } from '../components/common/PageHeader'
import { VariableControl } from '../features/manual_inference/VariableControl'
import { Explainability } from '../features/model_explanation/Explainability'
import { InferencePipeline } from '../features/model_explanation/InferencePipeline'
import { ResultPanel, ResultPlaceholder } from '../features/model_explanation/ResultPanel'
import { api } from '../services/api/client'
import type { InferenceRequest, InferenceResponse } from '../types/api'

type Mode = 'manual' | 'historical'

export function DashboardPage() {
  const { historyRange, model, bootError } = useAppContext()
  const [mode, setMode] = useState<Mode>('manual')
  const [inputs, setInputs] = useState<InferenceRequest>(DEFAULT_INPUTS)
  const [selectedDate, setSelectedDate] = useState('2025-09-01')
  const [result, setResult] = useState<InferenceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeManual = useCallback(async (payload: InferenceRequest) => {
    setLoading(true)
    setError(null)
    try {
      setResult(await api.manualInference(payload))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar la inferencia.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void executeManual(DEFAULT_INPUTS)
  }, [executeManual])

  const visibleInputs = useMemo(
    () => result?.modo === 'historical' ? result.entradas : inputs,
    [inputs, result],
  )

  function updateInput(key: InputKey, value: number) {
    setInputs((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    const invalid = VARIABLES.find((variable) => {
      const value = inputs[variable.key]
      return !Number.isFinite(value) || value < variable.minimum || value > variable.maximum
    })
    if (mode === 'manual' && invalid) {
      setError(`${invalid.label} debe estar entre ${invalid.minimum} y ${invalid.maximum} ${invalid.unit}.`)
      return
    }
    if (mode === 'manual' && !Number.isInteger(inputs.dias_secos)) {
      setError('Los días secos deben ingresarse como un número entero.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      setResult(mode === 'manual' ? await api.manualInference(inputs) : await api.historicalInference(selectedDate))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar la inferencia.')
    } finally {
      setLoading(false)
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setResult(null)
    setError(null)
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow="Apoyo preventivo · ODS 13"
        title="Evaluación de condiciones"
        description="Transforma datos climáticos en un nivel comprensible de preparación preventiva mediante inferencia difusa Mamdani."
        action={<div className="model-version"><span>Motor</span><strong>Mamdani {model?.version ?? '1.1.0'}</strong></div>}
      />

      {bootError && <ErrorState message={bootError} />}

      <section className="evaluation-toolbar card">
        <div className="mode-switch" role="tablist" aria-label="Modalidad de evaluación">
          <button className={mode === 'manual' ? 'active' : ''} onClick={() => changeMode('manual')} role="tab" aria-selected={mode === 'manual'}><SlidersHorizontal size={17} /> Evaluación manual</button>
          <button className={mode === 'historical' ? 'active' : ''} onClick={() => changeMode('historical')} role="tab" aria-selected={mode === 'historical'}><CalendarDays size={17} /> Evaluación histórica</button>
        </div>
        <div className="source-note"><Database size={16} /><span>{mode === 'manual' ? 'Valores ingresados por el usuario' : 'ERA5 + ERA5-Land · 2000–2025'}</span></div>
      </section>

      <section className="workspace-grid">
        <div className="input-workspace">
          <div className="section-title-row compact-title">
            <div><span className="eyebrow">01 · Entradas crisp</span><h2>{mode === 'manual' ? 'Configura las cuatro variables' : 'Selecciona una fecha histórica'}</h2><p>{mode === 'manual' ? 'Ajusta los valores. Cada control indica su unidad y su efecto en el contexto del modelo.' : 'El backend recuperará las cuatro variables de la serie diaria preparada.'}</p></div>
          </div>

          {mode === 'historical' && <div className="date-selector card">
            <div className="date-icon"><CalendarDays size={22} /></div>
            <div><label htmlFor="historical-date">Fecha de consulta</label><span>Disponibilidad: {historyRange ? `${formatDate(historyRange.fecha_inicial)} – ${formatDate(historyRange.fecha_final)}` : '2000–2025'}</span></div>
            <input id="historical-date" type="date" value={selectedDate} min={historyRange?.fecha_inicial ?? '2000-01-01'} max={historyRange?.fecha_final ?? '2025-12-31'} onChange={(event) => setSelectedDate(event.target.value)} />
          </div>}

          <div className="variables-grid">
            {VARIABLES.map((variable) => (
              <VariableControl
                key={variable.key}
                info={variable}
                value={visibleInputs[variable.key]}
                onChange={(value) => updateInput(variable.key, value)}
                memberships={result?.pertenencias_entrada[variable.key]}
                readOnly={mode === 'historical'}
              />
            ))}
          </div>

          {mode === 'historical' && !result && <div className="historical-hint"><Info size={16} /><span>Las tarjetas mostrarán los valores reales después de consultar la fecha.</span></div>}
          {error && <ErrorState message={error} />}
          {loading && <LoadingState message={mode === 'manual' ? 'Fuzzificando entradas y evaluando reglas…' : 'Recuperando la fecha y ejecutando Mamdani…'} />}

          <div className="form-actions">
            {mode === 'manual' && <button className="secondary-button" type="button" onClick={() => { setInputs(DEFAULT_INPUTS); setResult(null) }}><RotateCcw size={16} /> Restablecer</button>}
            <button className="primary-button" type="button" onClick={() => void submit()} disabled={loading}><Play size={17} fill="currentColor" /> {mode === 'manual' ? 'Calcular nivel preventivo' : 'Evaluar esta fecha'}</button>
          </div>
        </div>

        <aside className="result-column">
          {result ? <ResultPanel result={result} /> : <ResultPlaceholder />}
        </aside>
      </section>

      <section className="pipeline-section card">
        <div className="card-heading compact"><div><span className="section-kicker">Proceso transparente</span><h2>Cómo se construyó el resultado</h2></div><span className="soft-badge">Mínimo · Máximo · Centroide</span></div>
        <InferencePipeline active={Boolean(result)} />
      </section>

      {result && <>
        {result.fuente.tipo === 'historical' && <div className="source-banner"><Database size={18} /><div><strong>Resultado histórico del {formatDate(result.fuente.fecha)}</strong><span>{result.fuente.nota_interpretacion} Fuente: {result.fuente.dataset}.</span></div></div>}
        <Explainability result={result} />
      </>}
    </div>
  )
}
