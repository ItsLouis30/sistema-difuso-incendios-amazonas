import { ChevronRight, CircleHelp, ShieldCheck, Sparkles } from 'lucide-react'
import { CATEGORY_META } from '../../app/constants'
import { formatNumber } from '../../app/format'
import { OutputCurveChart } from '../../components/charts/OutputCurveChart'
import type { InferenceResponse } from '../../types/api'

export function ResultPanel({ result }: { result: InferenceResponse }) {
  const meta = CATEGORY_META[result.resultado.codigo_categoria]
  const score = result.resultado.indice
  const dash = Math.max(0, Math.min(100, score)) * 2.64
  return (
    <section className="result-stack animate-in" aria-live="polite">
      <article className={`result-hero card ${meta.className}`} style={{ '--level-color': meta.color } as React.CSSProperties}>
        <div className="result-copy">
          <span className="section-kicker"><Sparkles size={15} /> Resultado Mamdani</span>
          <div className="category-row"><span className="category-dot" /><strong>{result.resultado.categoria}</strong></div>
          <p>{result.resultado.recomendacion}</p>
          <div className="result-proof"><ShieldCheck size={15} /><span>Calculado con el modelo {result.model_version} y {result.reglas_activas.length} reglas activas</span></div>
        </div>
        <div className="score-gauge" aria-label={`Índice preventivo ${score} de 100`}>
          <svg viewBox="0 0 120 120" role="img">
            <circle className="gauge-track" cx="60" cy="60" r="42" />
            <circle className="gauge-progress" cx="60" cy="60" r="42" strokeDasharray={`${dash} 264`} />
          </svg>
          <div><strong>{formatNumber(score, 2)}</strong><span>de 100</span></div>
        </div>
      </article>

      <article className="card chart-card">
        <div className="card-heading">
          <div><span className="section-kicker">Conjunto de salida</span><h2>Agregación y centroide</h2></div>
          <div className="centroid-chip"><span>Centroide</span><strong>{formatNumber(score, 2)}</strong></div>
        </div>
        <OutputCurveChart data={result.curva_salida} centroid={score} color={meta.color} />
        <p className="chart-caption"><CircleHelp size={14} /> La línea vertical marca el centro de gravedad de la figura agregada. Ese punto se convierte en el índice final.</p>
      </article>
    </section>
  )
}

export function ResultPlaceholder() {
  return (
    <section className="result-placeholder card">
      <div className="placeholder-orbit"><span /><span /><span /><strong>μ</strong></div>
      <span className="section-kicker">Motor preparado</span>
      <h2>Configura las condiciones</h2>
      <p>Ejecuta la evaluación para obtener un índice real, su categoría y la explicación completa de las reglas activadas.</p>
      <div className="placeholder-steps"><span>4 entradas</span><ChevronRight size={14} /><span>192 reglas</span><ChevronRight size={14} /><span>1 índice</span></div>
    </section>
  )
}
