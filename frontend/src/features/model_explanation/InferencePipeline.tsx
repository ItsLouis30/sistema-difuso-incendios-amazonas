import { ArrowRight, Check, LoaderCircle } from 'lucide-react'
import { PIPELINE } from '../../app/constants'

export function InferencePipeline({ currentStep = 0, isComplete = false }: { currentStep?: number; isComplete?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full overflow-x-auto pb-2" aria-label="Flujo de inferencia Mamdani">
      {PIPELINE.map((step, index) => {
        const isActive = isComplete || currentStep > index;
        const isCurrent = !isComplete && currentStep === index;
        
        return (
          <div className="flex items-center gap-2 shrink-0" key={step}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors duration-300 ${
              isActive 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : isCurrent
                  ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive 
                  ? 'bg-emerald-500 text-white' 
                  : isCurrent
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {isActive ? <Check size={12} strokeWidth={3} /> : isCurrent ? <LoaderCircle size={10} className="animate-spin" /> : index + 1}
              </span>
              <strong className="text-xs">{step}</strong>
            </div>
            {index < PIPELINE.length - 1 && (
              <div className={`hidden sm:block ${isActive ? 'text-emerald-400' : isCurrent ? 'text-amber-300 animate-pulse' : 'text-gray-200'}`}>
                <ArrowRight size={16} strokeWidth={2.5} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
