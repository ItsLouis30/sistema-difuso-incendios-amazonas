import { CalendarRange, Database, LoaderCircle, RefreshCw, TrendingDown, TrendingUp, CalendarDays } from 'lucide-react'
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
    <div className="max-w-[1600px] mx-auto pb-12">
      <PageHeader
        eyebrow="Serie histórica • ERA5 / ERA5-Land"
        title="Evolución del índice preventivo"
        description="Explora cómo respondió el modelo a condiciones diarias históricas."
        action={
          <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
            <Database size={16} /> 9 497 días
          </span>
        }
      />

      <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row md:items-end gap-6">
        <div className="flex-1">
          <label htmlFor="history-end" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
            <CalendarRange size={16} className="text-emerald-600" /> Fecha final
          </label>
          <input 
            id="history-end" 
            type="date" 
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-gray-800 font-medium"
            value={endDate} 
            min={historyRange?.fecha_inicial ?? '2000-01-01'} 
            max={historyRange?.fecha_final ?? '2025-12-31'} 
            onChange={(event) => setEndDate(event.target.value)} 
          />
        </div>
        <div className="flex-1">
          <span className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
            <CalendarDays size={16} className="text-emerald-600" /> Ventana temporal
          </span>
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
            {[7, 14, 30].map((value) => (
              <button 
                key={value} 
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${days === value ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setDays(value)}
              >
                {value} días
              </button>
            ))}
          </div>
        </div>
        <button 
          className="md:w-auto w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50"
          onClick={() => void loadSeries(endDate, days)} 
          disabled={loading}
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={18} /> 
          <span>Actualizar</span>
        </button>
      </section>

      {error && <div className="mb-8"><ErrorState message={error} /></div>}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <article className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-sm font-bold text-gray-500 mb-2 block">Promedio del periodo</span>
          <strong className="text-3xl font-black text-gray-900 block mb-1">{summary ? formatNumber(summary.average, 2) : '--'}</strong>
          <small className="text-xs text-gray-400 font-medium">Índice preventivo 0-100</small>
        </article>
        <article className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-1.5"><TrendingDown size={16} className="text-green-500" /> Valor mínimo</span>
          <strong className="text-3xl font-black text-gray-900 block mb-1">{summary ? formatNumber(summary.minimum.indice, 2) : '--'}</strong>
          <small className="text-xs text-gray-400 font-medium">{summary ? formatDate(summary.minimum.fecha) : 'Sin datos'}</small>
        </article>
        <article className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-1.5"><TrendingUp size={16} className="text-red-500" /> Valor máximo</span>
          <strong className="text-3xl font-black text-gray-900 block mb-1">{summary ? formatNumber(summary.maximum.indice, 2) : '--'}</strong>
          <small className="text-xs text-gray-400 font-medium">{summary ? formatDate(summary.maximum.fecha) : 'Sin datos'}</small>
        </article>
        <article className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <span className="text-sm font-bold text-gray-500 mb-2 block">Cobertura consultada</span>
          <strong className="text-3xl font-black text-gray-900 block mb-1">{series.length}/{days}</strong>
          <small className="text-xs text-gray-400 font-medium">Registros diarios</small>
        </article>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">Índice por fecha</span>
            <h2 className="text-lg font-bold text-gray-900">{days} días hasta el {formatDate(endDate)}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <span key={key} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <i className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </span>
            ))}
          </div>
        </div>
        
        <div className="h-[350px]">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <LoaderCircle className="animate-spin" size={32} />
              <span className="text-sm font-medium">Consultando {days} inferencias históricas...</span>
            </div>
          ) : series.length ? (
            <HistoryChart data={series} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium text-sm bg-gray-50 rounded-xl">
              No hay datos para mostrar.
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Detalle diario</span>
            <h2 className="text-base font-bold text-gray-900">Resultados calculados</h2>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
            Sin predicción espacial
          </span>
        </div>
        
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead className="bg-white sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Fecha</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Índice</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Categoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...series].reverse().map((point) => { 
                const meta = CATEGORY_META[point.codigo]; 
                return (
                  <tr key={point.fecha} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-600 font-medium">{formatDate(point.fecha)}</td>
                    <td className="px-5 py-3 text-sm"><strong className="text-gray-900">{formatNumber(point.indice, 2)}</strong></td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white px-2.5 py-1 rounded-full border border-gray-100 shadow-sm">
                        <i className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                        {point.categoria}
                      </span>
                    </td>
                  </tr>
                ) 
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
