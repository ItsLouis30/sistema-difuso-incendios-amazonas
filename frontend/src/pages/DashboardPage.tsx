import { CalendarDays, Database, Info, Play, RotateCcw, SlidersHorizontal, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle, Globe } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_INPUTS, VARIABLES, type InputKey } from '../app/constants'
import { formatDate } from '../app/format'
import { useAppContext } from '../app/AppContext'
import { ErrorState, LoadingState } from '../components/common/Feedback'
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

  const getCategoryColor = (category: string) => {
    switch(category?.toLowerCase()) {
      case 'muy bajo': return 'text-green-500 bg-green-50';
      case 'bajo': return 'text-teal-500 bg-teal-50';
      case 'moderado': return 'text-yellow-500 bg-yellow-50';
      case 'alto': return 'text-emerald-600 bg-emerald-50';
      case 'muy alto': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  }

  const getCategoryIcon = (category: string) => {
    switch(category?.toLowerCase()) {
      case 'muy bajo': return <CheckCircle2 size={24} />;
      case 'bajo': return <ShieldAlert size={24} />;
      case 'moderado': return <AlertCircle size={24} />;
      case 'alto': return <AlertTriangle size={24} />;
      case 'muy alto': return <AlertTriangle size={24} />;
      default: return <Info size={24} />;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#451a03]"></div>
        
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 w-full opacity-30">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto text-white" fill="currentColor"><path d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </div>

        <div className="relative z-10 px-6 py-8 md:py-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-900/30 text-teal-300 text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-sm gap-2">
            <Globe className="w-3.5 h-3.5" />
            Chachapoyas, Amazonas &bull; Perú
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-4xl mb-4 leading-tight">
            Preparación Preventiva ante <span className="text-amber-400">Incendios Forestales</span>
          </h1>

          <p className="text-base md:text-lg text-teal-100/80 font-medium max-w-3xl mb-6 leading-relaxed">
            Diagnóstico preliminar y modelado de riesgo utilizando lógica difusa Mamdani ajustado específicamente a las condiciones meteorológicas y el ecosistema de la región Amazonas.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 px-5 py-2.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-sm font-medium text-gray-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-400 font-bold">En línea</span>
            </div>
            <span className="text-white/30 hidden sm:inline">&bull;</span>
            <span>Sistema Inferencia Difusa</span>
            <span className="text-white/30 hidden sm:inline">&bull;</span>
            <span className="flex items-center gap-1.5 text-amber-300/90"><Globe className="w-4 h-4" /> ODS 13: Acción por el Clima</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
          <button 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${mode === 'manual' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => changeMode('manual')}
          >
            <SlidersHorizontal size={18} /> Modo Manual
          </button>
          <button 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors ${mode === 'historical' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => changeMode('historical')}
          >
            <CalendarDays size={18} /> Modo Histórico
          </button>
        </div>
      </div>

      {bootError && <ErrorState message={bootError} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-500">Índice Preventivo</p>
              <h2 className="text-4xl font-black text-gray-900 mt-2">
                {result ? result.resultado.indice.toFixed(1) : '--'}
              </h2>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${result ? getCategoryColor(result.resultado.categoria) : 'bg-gray-100 text-gray-400'}`}>
              {result ? getCategoryIcon(result.resultado.categoria) : <AlertCircle size={28} />}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm font-medium">
             <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
               {result ? result.resultado.categoria : 'Sin evaluar'}
             </span>
             <span className="text-gray-400">
               Categoría Mamdani
             </span>
          </div>
        </div>

        {VARIABLES.slice(0, 2).map((v) => (
          <div key={v.key} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-gray-500">{v.label}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <h2 className="text-4xl font-black text-gray-900">{visibleInputs[v.key]}</h2>
                  <span className="text-gray-500 font-medium">{v.unit}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                 <v.Icon size={24} />
              </div>
            </div>
            <div className="mt-6">
               <button className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
                 Detalle
               </button>
            </div>
          </div>
        ))}

        {VARIABLES.slice(2, 4).map((v) => (
          <div key={v.key} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-gray-500">{v.label}</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <h2 className="text-4xl font-black text-gray-900">{visibleInputs[v.key]}</h2>
                  <span className="text-gray-500 font-medium">{v.unit}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center">
                 <v.Icon size={24} />
              </div>
            </div>
            <div className="mt-6">
               <button className="text-xs font-bold text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
                 Detalle
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">{mode === 'manual' ? 'Configuración de variables' : 'Selección de fecha'}</h2>
              <p className="text-sm text-gray-500 mt-1">{mode === 'manual' ? 'Ajusta los valores de las entradas crisp.' : 'Recupera datos meteorológicos históricos.'}</p>
            </div>

            {mode === 'historical' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6 border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm">
                  <CalendarDays size={20} />
                </div>
                <div className="flex-1">
                  <label htmlFor="historical-date" className="block text-sm font-bold text-gray-700">Fecha de consulta</label>
                  <span className="text-xs text-gray-500">Disp: {historyRange ? `${formatDate(historyRange.fecha_inicial)} - ${formatDate(historyRange.fecha_final)}` : '2000-2025'}</span>
                </div>
                <input 
                  id="historical-date" 
                  type="date" 
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-medium text-gray-800"
                  value={selectedDate} 
                  min={historyRange?.fecha_inicial ?? '2000-01-01'} 
                  max={historyRange?.fecha_final ?? '2025-12-31'} 
                  onChange={(event) => setSelectedDate(event.target.value)} 
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {error && <div className="mt-6"><ErrorState message={error} /></div>}
            {loading && <div className="mt-6"><LoadingState message={mode === 'manual' ? 'Evaluando...' : 'Recuperando fecha...'} /></div>}

            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
              {mode === 'manual' && (
                <button 
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                  type="button" 
                  onClick={() => { setInputs(DEFAULT_INPUTS); setResult(null) }}
                >
                  <RotateCcw size={18} /> Restablecer
                </button>
              )}
              <button 
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                type="button" 
                onClick={() => void submit()} 
                disabled={loading}
              >
                <Play size={18} fill="currentColor" /> 
                {mode === 'manual' ? 'Calcular Nivel' : 'Evaluar Fecha'}
              </button>
            </div>
          </div>
          
          {result && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Pipeline de Inferencia</h2>
              <InferencePipeline active={Boolean(result)} />
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          {result ? <ResultPanel result={result} /> : <ResultPlaceholder />}
          
          {result && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
               <Explainability result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
