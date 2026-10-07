import { ChevronDown, Lightbulb, Network, Sigma } from 'lucide-react'
import { TERM_LABELS, VARIABLES } from '../../app/constants'
import { formatNumber } from '../../app/format'
import type { ActiveRule, InferenceResponse } from '../../types/api'

function ruleText(rule: ActiveRule) {
  const parts = VARIABLES.map((variable) => {
    const term = rule.antecedentes[variable.key]
    return `${variable.shortLabel} es ${TERM_LABELS[term] ?? term}`
  })
  return `SI ${parts.join(' — Y — ')} ➔ ENTONCES nivel ${TERM_LABELS[rule.consecuente] ?? rule.consecuente}`
}

export function Explainability({ result }: { result: InferenceResponse }) {
  const strongest = [...result.reglas_activas].sort((a, b) => b.activacion - a.activacion || a.numero - b.numero)
  const primary = strongest[0]
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <div className="flex items-end justify-between border-b border-gray-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">Explicabilidad</span>
          <h2 className="text-xl font-bold text-gray-900">¿Por qué se obtuvo este resultado?</h2>
          <p className="text-sm text-gray-500 mt-1">El motor combina las etiquetas activas. Estas fueron las reglas que más influyeron.</p>
        </div>
        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
          <Network size={16} /> {result.reglas_activas.length} reglas activas
        </span>
      </div>

      {primary && (
        <article className="bg-gradient-to-r from-emerald-50 to-white rounded-2xl p-5 border border-emerald-100 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Lightbulb size={24} />
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">Regla dominante #{primary.numero}</span>
            <strong className="text-gray-900 block text-sm mb-1">{ruleText(primary)}</strong>
            <p className="text-xs text-gray-500">Su grado de activación fue {formatNumber(primary.activacion, 3)}. Cuanto más cercano a 1, mayor fue su influencia.</p>
          </div>
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
              <path
                className="text-emerald-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="text-emerald-600 transition-all duration-1000"
                strokeDasharray={`${primary.activacion * 100}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
            <div className="text-center">
              <strong className="block text-sm font-bold text-gray-900 leading-none">{formatNumber(primary.activacion, 2)}</strong>
            </div>
          </div>
        </article>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 text-sm font-bold text-gray-800">
          <Sigma size={18} className="text-gray-400" /> Contribuciones al resultado
        </div>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
          {strongest.map((rule, index) => (
            <details className="group" key={rule.numero} open={index === 0}>
              <summary className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center shrink-0">
                  R{rule.numero}
                </span>
                <div className="flex-1">
                  <strong className="block text-sm text-gray-900">{TERM_LABELS[rule.consecuente] ?? rule.consecuente}</strong>
                  <span className="text-xs text-gray-500">{index === 0 ? 'Mayor contribución' : 'Regla complementaria'}</span>
                </div>
                <div className="w-24 text-right">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mb-1 overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${rule.activacion * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{formatNumber(rule.activacion, 3)}</span>
                </div>
                <ChevronDown size={18} className="text-gray-400 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <div className="px-5 pb-4 pt-1 ml-14">
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {ruleText(rule)}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
