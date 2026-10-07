import { Info } from 'lucide-react'
import { TERM_LABELS, type VariableInfo } from '../../app/constants'
import { formatNumber } from '../../app/format'

export function VariableControl({ info, value, onChange, memberships, readOnly = false }: {
  info: VariableInfo
  value: number
  onChange?: (value: number) => void
  memberships?: Record<string, number>
  readOnly?: boolean
}) {
  const percentage = ((value - info.minimum) / (info.maximum - info.minimum)) * 100
  const activeTerms = Object.entries(memberships ?? {}).filter(([, degree]) => degree > 0).sort((a, b) => b[1] - a[1])
  const inputId = `input-${info.key}`

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <info.Icon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <label htmlFor={inputId} className="block text-sm font-bold text-gray-800">{info.label}</label>
            <span className="text-xs text-gray-500 font-medium">{info.unit}</span>
          </div>
        </div>
        <button className="text-gray-400 hover:text-emerald-600 transition-colors" title={`${info.explanation} ${info.influence}`}>
          <Info size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          className="w-24 text-2xl font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
          type="number"
          value={value}
          min={info.minimum}
          max={info.maximum}
          step={info.step}
          readOnly={readOnly}
          onChange={(event) => onChange?.(Number(event.target.value))}
        />
      </div>

      <div className="relative pt-2 pb-1">
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

      <div className="mt-2 pt-4 border-t border-gray-100 flex flex-col gap-2">
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
    </div>
  )
}
