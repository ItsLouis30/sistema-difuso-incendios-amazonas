import { CalendarDays, Database, LoaderCircle, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORY_META } from '../app/constants'
import { dateRangeEndingAt, formatDate, formatNumber } from '../app/format'
import { useAppContext } from '../app/AppContext'
import { HistoryChart } from '../components/charts/HistoryChart'
import { Card, CardTitle, HeroBand, IconCircle, Pill } from '../components/common/Bento'
import { ErrorState } from '../components/common/Feedback'
import { api } from '../services/api/client'
import type { HistoryPoint } from '../types/api'

const WINDOWS = [7, 14, 30]

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

  const stats = [
    { label: 'Promedio del periodo', value: summary ? formatNumber(summary.average, 2) : '--', note: 'Índice preventivo 0–100', Icon: Database },
    { label: 'Valor mínimo', value: summary ? formatNumber(summary.minimum.indice, 2) : '--', note: summary ? formatDate(summary.minimum.fecha) : 'Sin datos', Icon: TrendingDown },
    { label: 'Valor máximo', value: summary ? formatNumber(summary.maximum.indice, 2) : '--', note: summary ? formatDate(summary.maximum.fecha) : 'Sin datos', Icon: TrendingUp },
    { label: 'Cobertura consultada', value: `${series.length}/${days}`, note: 'Registros diarios', Icon: CalendarDays },
  ]

  return (
    <>
      <HeroBand
        left={
          <>
            <label className="flex items-center gap-2 rounded-full border border-line bg-white py-2 pl-4 pr-2 text-sm">
              <CalendarDays size={16} className="text-muted" />
              <span className="sr-only">Fecha final</span>
              <input
                id="history-end"
                type="date"
                className="bg-transparent outline-none"
                value={endDate}
                min={historyRange?.fecha_inicial ?? '2000-01-01'}
                max={historyRange?.fecha_final ?? '2025-12-31'}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <div className="flex rounded-full border border-line bg-white p-1" role="group" aria-label="Ventana temporal">
              {WINDOWS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDays(value)}
                  aria-pressed={days === value}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${days === value ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
                >
                  {value} días
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void loadSeries(endDate, days)}
              disabled={loading}
              aria-label="Actualizar serie"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-ember-500 text-white transition-colors hover:bg-ember-600 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </>
        }
        title="¿Cómo evolucionó el riesgo?"
        subtitle={`${days} días hasta el ${formatDate(endDate)}.`}
      />

      {error && <div className="px-4 pt-4 md:px-6"><ErrorState message={error} /></div>}

      <div className="grid grid-cols-1 gap-4 px-4 pb-6 pt-4 sm:grid-cols-2 md:px-6 xl:grid-cols-12">
        {stats.map(({ label, value, note, Icon }) => (
          <Card key={label} className="flex flex-col gap-3 xl:col-span-3">
            <IconCircle>
              <Icon size={16} />
            </IconCircle>
            <div>
              <span className="text-xs text-muted">{label}</span>
              <strong className="block text-[28px] font-semibold leading-tight tabular-nums">{value}</strong>
              <small className="text-xs text-muted">{note}</small>
            </div>
          </Card>
        ))}

        <Card className="flex flex-col gap-4 sm:col-span-2 xl:col-span-8">
          <CardTitle
            title="Índice por fecha"
            caption="Cada barra es una inferencia histórica independiente"
            action={
              <div className="hidden flex-wrap justify-end gap-2 md:flex">
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted">
                    <i className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                ))}
              </div>
            }
          />
          <div className="h-[340px]">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
                <LoaderCircle className="animate-spin" size={28} />
                <span className="text-sm">Consultando {days} inferencias históricas…</span>
              </div>
            ) : series.length ? (
              <HistoryChart data={series} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl bg-shell text-sm text-muted">
                No hay datos para mostrar.
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-3 sm:col-span-2 xl:col-span-4">
          <CardTitle title="Detalle diario" caption="Sin predicción espacial" action={<Pill>{series.length} días</Pill>} />
          <ol className="no-scrollbar max-h-[360px] space-y-1.5 overflow-y-auto">
            {[...series].reverse().map((point) => (
              <li key={point.fecha} className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2 text-sm">
                <span className="text-muted">{formatDate(point.fecha)}</span>
                <span className="flex items-center gap-3">
                  <strong className="font-medium tabular-nums">{formatNumber(point.indice, 2)}</strong>
                  <Pill className="w-24 justify-center">
                    <i className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[point.codigo].color }} />
                    {point.categoria}
                  </Pill>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}
