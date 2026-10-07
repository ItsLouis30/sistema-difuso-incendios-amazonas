import { CalendarDays, Play, Globe } from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '../app/format'
import { useAppContext } from '../app/AppContext'
import { ErrorState, LoadingState } from '../components/common/Feedback'
import { VariableControl } from '../features/manual_inference/VariableControl'
import { Explainability } from '../features/model_explanation/Explainability'
import { InferencePipeline } from '../features/model_explanation/InferencePipeline'
import { ResultPanel } from '../features/model_explanation/ResultPanel'
import { api } from '../services/api/client'
import type { InferenceResponse } from '../types/api'
import { VARIABLES } from '../app/constants'

export function HistoricalPage() {
  const { historyRange, bootError } = useAppContext()
  const [selectedDate, setSelectedDate] = useState('2025-09-01')
  const [result, setResult] = useState<InferenceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [calculating, setCalculating] = useState(false)
  const [calculationStep, setCalculationStep] = useState(7)
  const [hasCalculated, setHasCalculated] = useState(false)

  async function submit() {
    setLoading(true)
    setError(null)
    setCalculating(true)
    setCalculationStep(0)
    setHasCalculated(false)
    
    try {
      const res = await api.historicalInference(selectedDate)
      setResult(res)
      
      let step = 0
      const interval = setInterval(() => {
        step++
        setCalculationStep(step)
        if (step >= 7) {
          clearInterval(interval)
          setCalculating(false)
          setHasCalculated(true)
        }
      }, 500)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo ejecutar la inferencia.')
      setCalculating(false)
      setCalculationStep(7)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#020617]"></div>
        
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 w-full opacity-30">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto text-white" fill="currentColor"><path d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
        </div>

        <div className="relative z-10 px-6 py-8 md:py-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-900/30 text-blue-300 text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-sm gap-2">
            <Globe className="w-3.5 h-3.5" />
            Chachapoyas, Amazonas &bull; Perú
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight max-w-4xl mb-4 leading-tight">
            Evaluación <span className="text-cyan-400">Histórica</span>
          </h1>

          <p className="text-base md:text-lg text-blue-100/80 font-medium max-w-3xl mb-6 leading-relaxed">
            Modo de consulta temporal. Selecciona una fecha específica del pasado para recuperar de nuestra base de datos (Copernicus ERA5-Land) los registros meteorológicos reales de ese día y evaluar el nivel de riesgo que existía.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 px-5 py-2.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-sm font-medium text-gray-200">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="text-cyan-400 font-bold">Base de Datos Conectada</span>
            </div>
            <span className="text-white/30 hidden sm:inline">&bull;</span>
            <span>Registros Reales</span>
          </div>
        </div>
      </div>

      {bootError && <ErrorState message={bootError} />}

      <div className="w-full space-y-8 mt-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-gray-900">Selección de Fecha</h2>
            <p className="text-sm text-gray-500 mt-2">Elige un día dentro del rango disponible para cargar los parámetros climáticos.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-4 p-5 bg-gray-50 rounded-xl mb-8 border border-gray-100 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm shrink-0">
              <CalendarDays size={24} />
            </div>
            <div className="flex-1">
              <label htmlFor="historical-date" className="block text-sm font-bold text-gray-700">Fecha de consulta</label>
              <span className="text-xs text-gray-500">Disp: {historyRange ? `${formatDate(historyRange.fecha_inicial)} - ${formatDate(historyRange.fecha_final)}` : '2000-2025'}</span>
            </div>
            <input 
              id="historical-date" 
              type="date" 
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white font-medium text-gray-800"
              value={selectedDate} 
              min={historyRange?.fecha_inicial ?? '2000-01-01'} 
              max={historyRange?.fecha_final ?? '2025-12-31'} 
              onChange={(event) => setSelectedDate(event.target.value)} 
              disabled={calculating}
            />
          </div>

          {result && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider text-center mb-6">Condiciones registradas en esa fecha</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 opacity-75 grayscale-[30%]">
                {VARIABLES.map((variable) => (
                  <VariableControl
                    key={variable.key}
                    info={variable}
                    value={result.entradas[variable.key]}
                    memberships={result.pertenencias_entrada[variable.key]}
                    readOnly={true}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <div className="mt-8"><ErrorState message={error} /></div>}

          <div className="flex flex-col items-center justify-center gap-4 mt-10 pt-8 border-t border-gray-100">
            <button 
              className="flex items-center justify-center gap-2 px-8 py-4 w-full md:w-auto md:min-w-[300px] rounded-2xl font-black text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50"
              type="button" 
              onClick={() => void submit()} 
              disabled={loading || calculating}
            >
              <Play size={20} fill="currentColor" /> 
              {calculating ? 'Consultando y Evaluando...' : 'Evaluar Fecha Histórica'}
            </button>
          </div>
        </div>

        {calculating && (
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest text-center">Ejecutando Motor de Inferencia</h2>
            <InferencePipeline currentStep={calculationStep} isComplete={false} />
          </div>
        )}

        {!calculating && hasCalculated && result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
              <h2 className="text-sm font-bold text-blue-600 mb-6 uppercase tracking-widest text-center">Pipeline Completado</h2>
              <InferencePipeline currentStep={7} isComplete={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <ResultPanel result={result} />
              
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm sticky top-8">
                 <Explainability result={result} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
