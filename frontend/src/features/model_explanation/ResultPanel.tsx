import { ChevronRight, CircleHelp, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react'
import { CATEGORY_META } from '../../app/constants'
import { formatNumber } from '../../app/format'
import { OutputCurveChart } from '../../components/charts/OutputCurveChart'
import type { InferenceResponse } from '../../types/api'

export function ResultPanel({ result }: { result: InferenceResponse }) {
  const meta = CATEGORY_META[result.resultado.codigo_categoria]
  const score = result.resultado.indice
  
  // Convert score to a percentage of the circumference (2 * pi * 42 ~= 264)
  const dash = Math.max(0, Math.min(100, score)) * 2.64
  
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <article className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
        {/* Decorative background based on category color could go here */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <AlertCircle size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3">
              <Sparkles size={14} /> Resultado Mamdani
            </span>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: meta.color }} />
              <strong className="text-2xl font-black text-gray-900">{result.resultado.categoria}</strong>
            </div>
            <p className="text-gray-600 font-medium leading-relaxed mb-4">{result.resultado.recomendacion}</p>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-2 rounded-lg inline-flex">
              <ShieldCheck size={16} className="text-green-500" />
              <span>Modelo {result.model_version} • {result.reglas_activas.length} reglas activadas</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90 w-full h-full">
                <circle cx="60" cy="60" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                <circle 
                  cx="60" cy="60" r="42" 
                  fill="none" 
                  stroke={meta.color} 
                  strokeWidth="8" 
                  strokeDasharray={`${dash} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center">
                <strong className="text-3xl font-black text-gray-900 block leading-none">{formatNumber(score, 1)}</strong>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 block">de 100</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1 block">Conjunto de salida</span>
            <h2 className="text-lg font-bold text-gray-900">Agregación y centroide</h2>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Centroide</span>
            <strong className="text-sm font-black text-gray-900">{formatNumber(score, 2)}</strong>
          </div>
        </div>
        
        <div className="h-64 mb-4">
          <OutputCurveChart data={result.curva_salida} centroid={score} color={meta.color} />
        </div>
        
        <p className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg text-blue-800">
          <CircleHelp size={16} className="shrink-0 mt-0.5" /> 
          <span>La línea vertical marca el centro de gravedad de la figura agregada. Ese punto se convierte en el índice final.</span>
        </p>
      </article>
    </div>
  )
}

export function ResultPlaceholder() {
  return (
    <section className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4 border border-gray-100 shadow-inner">
        <ShieldCheck size={32} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Motor preparado</span>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Configura las condiciones</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-6">Ejecuta la evaluación para obtener un índice real, su categoría y la explicación completa de las reglas activadas.</p>
      
      <div className="flex items-center gap-3 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
        <span>4 entradas</span>
        <ChevronRight size={14} />
        <span>192 reglas</span>
        <ChevronRight size={14} />
        <span className="text-gray-700">1 índice</span>
      </div>
    </section>
  )
}
