import { ArrowRight, Check } from 'lucide-react'
import { PIPELINE } from '../../app/constants'

export function InferencePipeline({ active = false }: { active?: boolean }) {
  return (
    <div className={`inference-pipeline ${active ? 'complete' : ''}`} aria-label="Flujo de inferencia Mamdani">
      {PIPELINE.map((step, index) => (
        <div className="pipeline-fragment" key={step}>
          <div className="pipeline-step"><span>{active ? <Check size={13} /> : index + 1}</span><strong>{step}</strong></div>
          {index < PIPELINE.length - 1 && <ArrowRight className="pipeline-arrow" size={16} />}
        </div>
      ))}
    </div>
  )
}
