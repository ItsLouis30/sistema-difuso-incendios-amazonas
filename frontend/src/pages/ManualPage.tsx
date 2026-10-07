import { Info, Play, SlidersHorizontal, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle, Globe } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_INPUTS, VARIABLES, type InputKey } from '../app/constants'
import { useAppContext } from '../app/AppContext'
import { ErrorState, LoadingState } from '../components/common/Feedback'
import { VariableControl } from '../features/manual_inference/VariableControl'
import { Explainability } from '../features/model_explanation/Explainability'
import { InferencePipeline } from '../features/model_explanation/InferencePipeline'
import { ResultPanel, ResultPlaceholder } from '../features/model_explanation/ResultPanel'
import { api } from '../services/api/client'
import type { InferenceRequest, InferenceResponse } from '../types/api'

export function ManualPage() {
  const { bootError } = useAppContext()
  const [inputs, setInputs] = useState<InferenceRequest>(DEFAULT_INPUTS)
  const [result, setResult] = useState<InferenceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [calculating, setCalculating] = useState(false)
  const [calculationStep, setCalculationStep] = useState(7)
  const [hasCalculated, setHasCalculated] = useState(false)

  const executeManual = useCallback(async (payload: InferenceRequest) => {
    try {
      setResult(await api.manualInference(payload))
    } catch (caught) {
      console.error(caught)
    }
  }, [])

  useEffect(() => {
    void executeManual(DEFAULT_INPUTS)
  }, [executeManual])

  const visibleInputs = inputs

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
    setLoading(true)
    setError(null)
    setCalculating(true)
    setCalculationStep(0)
    setHasCalculated(false)
    
    try {
      const res = await api.manualInference(inputs)
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

      {bootError && <ErrorState message={bootError} />}

      <div className="w-full space-y-8 mt-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-gray-900">Configuración de variables</h2>
            <p className="text-sm text-gray-500 mt-2">Ajusta los parámetros meteorológicos de entrada para evaluar el nivel de riesgo.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VARIABLES.map((variable) => (
              <VariableControl
                key={variable.key}
                info={variable}
                value={visibleInputs[variable.key]}
                onChange={(value) => updateInput(variable.key, value)}
                memberships={result?.pertenencias_entrada[variable.key]}
                readOnly={calculating}
              />
            ))}
          </div>

          {error && <div className="mt-8"><ErrorState message={error} /></div>}

          <div className="flex flex-col items-center justify-center gap-4 mt-10 pt-8 border-t border-gray-100">
            <button 
              className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              type="button" 
              onClick={() => { setInputs(DEFAULT_INPUTS); setHasCalculated(false); void executeManual(DEFAULT_INPUTS); }}
              disabled={calculating}
            >
              Restablecer valores por defecto
            </button>
            <button 
              className="flex items-center justify-center gap-2 px-8 py-4 w-full md:w-auto md:min-w-[300px] rounded-2xl font-black text-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50"
              type="button" 
              onClick={() => void submit()} 
              disabled={loading || calculating}
            >
              <Play size={20} fill="currentColor" /> 
              {calculating ? 'Evaluando...' : 'Calcular Nivel de Riesgo'}
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
              <h2 className="text-sm font-bold text-emerald-600 mb-6 uppercase tracking-widest text-center">Pipeline Completado</h2>
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
