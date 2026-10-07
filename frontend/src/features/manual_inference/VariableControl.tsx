import { Info, X, Satellite, Gauge, CloudRain, Wind as WindIcon, Droplets, Sprout, CloudSun } from 'lucide-react'
import { useState } from 'react'
import { TERM_LABELS, type VariableInfo } from '../../app/constants'
import { formatNumber } from '../../app/format'

function Illustration({ variableKey }: { variableKey: string }) {
  if (variableKey === 'hr_min_pct') {
    return (
      <div className="relative w-full h-28 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl overflow-hidden flex items-center justify-center border border-blue-100/50 group">
        <Droplets size={48} className="text-blue-400 group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500" />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-blue-500/10 backdrop-blur-sm transition-all duration-500 group-hover:h-8" />
        <div className="absolute right-3 top-3 text-[10px] font-bold text-blue-600 bg-blue-100/50 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
          <Gauge size={12} /> Higrómetro
        </div>
      </div>
    )
  }
  if (variableKey === 'dias_secos') {
    return (
      <div className="relative w-full h-28 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl overflow-hidden flex items-center justify-center border border-orange-100/50 group">
        <CloudSun size={48} className="text-orange-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500" />
        <div className="absolute inset-x-0 bottom-0 h-3 bg-amber-900/5 border-t border-amber-900/10" />
        <div className="absolute right-3 top-3 text-[10px] font-bold text-orange-700 bg-orange-200/50 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
          <CloudRain size={12} /> Pluviómetro
        </div>
      </div>
    )
  }
  if (variableKey === 'viento_max_ms') {
    return (
      <div className="relative w-full h-28 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200/50 group">
        <WindIcon size={48} className="text-slate-400 group-hover:translate-x-4 transition-transform duration-700" />
        <div className="absolute right-3 top-3 text-[10px] font-bold text-slate-600 bg-slate-200/50 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
          <WindIcon size={12} /> Anemómetro (10m)
        </div>
      </div>
    )
  }
  return (
    <div className="relative w-full h-28 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl overflow-hidden flex items-center justify-center border border-emerald-100/50 group">
      <Sprout size={48} className="text-emerald-500 group-hover:-translate-y-2 transition-transform duration-500 relative z-10" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-amber-900/10 border-t-2 border-amber-800/10 border-dashed transition-all duration-500 group-hover:bg-amber-900/15" />
      <div className="absolute right-3 top-3 text-[10px] font-bold text-emerald-700 bg-emerald-200/50 px-2 py-1 rounded flex items-center gap-1.5 shadow-sm">
        <Satellite size={12} /> Satélite SMAP / Sonda
      </div>
    </div>
  )
}

export function VariableControl({ info, value, onChange, memberships, readOnly = false }: {
  info: VariableInfo
  value: number
  onChange?: (value: number) => void
  memberships?: Record<string, number>
  readOnly?: boolean
}) {
  const [showInfo, setShowInfo] = useState(false)
  const percentage = ((value - info.minimum) / (info.maximum - info.minimum)) * 100
  const activeTerms = Object.entries(memberships ?? {}).filter(([, degree]) => degree > 0).sort((a, b) => b[1] - a[1])
  const inputId = `input-${info.key}`

  return (
    <div className={`bg-white rounded-2xl p-5 border flex flex-col relative transition-all duration-500 ${showInfo ? 'border-emerald-300 shadow-lg shadow-emerald-900/5' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <info.Icon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <label htmlFor={inputId} className="block text-sm font-bold text-gray-800">{info.label}</label>
            <span className="text-xs text-gray-500 font-medium">{info.unit}</span>
          </div>
        </div>
        <button 
          onClick={() => setShowInfo(!showInfo)} 
          className={`shrink-0 transition-colors ${showInfo ? 'text-emerald-600 bg-emerald-50 p-1.5 rounded-lg' : 'text-gray-400 hover:text-emerald-600 p-1.5'}`}
          aria-label="Ver información de la variable"
        >
          {showInfo ? <X size={18} /> : <Info size={18} />}
        </button>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <input
          id={inputId}
          className="w-full text-3xl font-black text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
          type="number"
          value={value}
          min={info.minimum}
          max={info.maximum}
          step={info.step}
          readOnly={readOnly}
          onChange={(event) => onChange?.(Number(event.target.value))}
        />
      </div>

      <div className="relative pt-2 pb-1 mt-2">
        {!readOnly ? (
          <input
            type="range"
            min={info.minimum}
            max={info.maximum}
            step={info.step}
            value={value}
            onChange={(event) => onChange?.(Number(event.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        ) : (
          <div className="w-full h-2 bg-gray-200 rounded-lg overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
          </div>
        )}
        <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
          <span>{info.minimum}</span>
          <span>{info.maximum} {info.unit}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
        {activeTerms.length ? activeTerms.map(([term, degree]) => (
          <div key={term} className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">{TERM_LABELS[term] ?? term}</span>
            <div className="flex-1 mx-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500" style={{ width: `${degree * 100}%` }} />
            </div>
            <strong className="text-gray-800">{formatNumber(degree, 3)}</strong>
          </div>
        )) : (
          <span className="text-xs text-gray-400 italic">Pertenencia calculada tras evaluar</span>
        )}
      </div>

      {showInfo && (
        <div className="mt-5 pt-5 border-t border-emerald-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <Illustration variableKey={info.key} />
          <div className="mt-5 space-y-4">
            <div>
              <strong className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-1">¿Qué mide?</strong>
              <p className="text-sm text-gray-600 leading-relaxed">{info.explanation}</p>
            </div>
            <div>
              <strong className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">Impacto en el riesgo</strong>
              <p className="text-sm text-emerald-700 bg-emerald-50/80 p-3 rounded-xl border border-emerald-100/50 leading-relaxed">{info.influence}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
