import { ArrowRight, Check } from 'lucide-react'
import { PIPELINE } from '../../app/constants'

export function InferencePipeline({ active = false }: { active?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full overflow-x-auto pb-2" aria-label="Flujo de inferencia Mamdani">
      {PIPELINE.map((step, index) => (
        <div className="flex items-center gap-2 shrink-0" key={step}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            active 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-gray-50 border-gray-200 text-gray-500'
          } transition-colors duration-300`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {active ? <Check size={12} strokeWidth={3} /> : index + 1}
            </span>
            <strong className="text-xs">{step}</strong>
          </div>
          {index < PIPELINE.length - 1 && (
            <div className={`hidden sm:block ${active ? 'text-green-400' : 'text-gray-300'}`}>
              <ArrowRight size={16} strokeWidth={2.5} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
