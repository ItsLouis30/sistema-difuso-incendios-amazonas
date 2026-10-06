import { CalendarRange, Database, LoaderCircle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORY_META } from '../app/constants'
import { dateRangeEndingAt, formatDate, formatNumber } from '../app/format'
import { useAppContext } from '../app/AppContext'
import { HistoryChart } from '../components/charts/HistoryChart'
import { ErrorState } from '../components/common/Feedback'
import { PageHeader } from '../components/common/PageHeader'
import { api } from '../services/api/client'
import type { HistoryPoint } from '../types/api'

export function HistoryPage() {
  const { historyRange } = useAppContext()
  const [endDate, setEndDate] = useState('2025-09-30')
  const [days, setDays] = useState(14)
  const [series, setSeries] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSeries = useCallback(async (date: string, windowDays: number) => {
    setLoading(true)
    setError(null)
    try {
      const dates = dateRangeEndingAt(date, windowDays)
      const responses = await Promise.all(dates.map((item) => api.historicalInference(item)))
      setSeries(responses.map((response) => ({
        fecha: response.fuente.tipo === 'historical' ? response.fuente.fecha : '',
        indice: response.resultado.indice,
        categoria: response.resultado.categoria,
        codigo: response.resultado.codigo_categoria,
      })))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo construir la serie histórica.')
      setSeries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSeries(endDate, days)
  }, [days, endDate, loadSeries])

  const summary = useMemo(() => {
    if (!series.length) return null
    const ordered = [...series].sort((a, b) => a.indice - b.indice)
    return {
      average: series.reduce((sum, point) => sum + point.indice, 0) / series.length,
      minimum: ordered[0],
      maximum: ordered.at(-1)!,
    }
  }, [series])

  return (
    <div className="history-page">
      <PageHeader
        eyebrow="Serie histórica · ERA5 / ERA5-Land"
        title="Evolución del índice preventivo"
        description="Explora cómo respondió el mismo modelo Mamdani a condiciones diarias históricas. Cada punto es calculado por el backend."
        action={<span className="soft-badge"><Database size={15} /> 9 497 días disponibles</span>}
      />

      <section className="history-controls card">
        <div className="control-group"><label htmlFor="history-end"><CalendarRange size={16} /> Fecha final</label><input id="history-end" type="date" value={endDate} min={historyRange?.fecha_inicial ?? '2000-01-01'} max={historyRange?.fecha_final ?? '2025-12-31'} onChange={(event) => setEndDate(event.target.value)} /></div>
        <div className="control-group"><span>Ventana temporal</span><div className="segmented-small">{[7, 14, 30].map((value) => <button key={value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} días</button>)}</div></div>
        <button className="secondary-button refresh-button" onClick={() => void loadSeries(endDate, days)} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={16} /> Actualizar</button>
      </section>

      {error && <ErrorState message={error} />}

      <section className="history-summary-grid">
        <article className="metric-card card"><span>Promedio del periodo</span><strong>{summary ? formatNumber(summary.average, 2) : '—'}</strong><small>Índice preventivo 0–100</small></article>
        <article className="metric-card card"><span><TrendingDown size={15} /> Valor mínimo</span><strong>{summary ? formatNumber(summary.minimum.indice, 2) : '—'}</strong><small>{summary ? formatDate(summary.minimum.fecha) : 'Sin datos'}</small></article>
        <article className="metric-card card"><span><TrendingUp size={15} /> Valor máximo</span><strong>{summary ? formatNumber(summary.maximum.indice, 2) : '—'}</strong><small>{summary ? formatDate(summary.maximum.fecha) : 'Sin datos'}</small></article>
        <article className="metric-card card"><span>Cobertura consultada</span><strong>{series.length}/{days}</strong><small>Registros diarios procesados</small></article>
      </section>

      <section className="card history-chart-card">
        <div className="card-heading">
          <div><span className="section-kicker">Índice por fecha</span><h2>{days} días hasta el {formatDate(endDate)}</h2></div>
          <div className="category-legend">{Object.entries(CATEGORY_META).map(([key, meta]) => <span key={key}><i style={{ background: meta.color }} />{meta.label}</span>)}</div>
        </div>
        {loading ? <div className="chart-loading"><LoaderCircle className="spin" /><span>Consultando {days} inferencias históricas…</span></div> : series.length ? <HistoryChart data={series} /> : <div className="chart-loading">No hay datos para mostrar.</div>}
      </section>

      <section className="history-table card">
        <div className="card-heading compact"><div><span className="section-kicker">Detalle diario</span><h2>Resultados calculados</h2></div><span className="soft-badge">Sin predicción espacial</span></div>
        <div className="table-scroll"><table><thead><tr><th>Fecha</th><th>Índice</th><th>Categoría</th></tr></thead><tbody>{[...series].reverse().map((point) => { const meta = CATEGORY_META[point.codigo]; return <tr key={point.fecha}><td>{formatDate(point.fecha)}</td><td><strong>{formatNumber(point.indice, 2)}</strong></td><td><span className="table-level"><i style={{ background: meta.color }} />{point.categoria}</span></td></tr> })}</tbody></table></div>
      </section>
    </div>
  )
}
