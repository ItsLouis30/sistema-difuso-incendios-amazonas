import { ChevronDown, Lightbulb, Network, Sigma } from 'lucide-react'
import { TERM_LABELS, VARIABLES } from '../../app/constants'
import { formatNumber } from '../../app/format'
import type { ActiveRule, InferenceResponse } from '../../types/api'

function ruleText(rule: ActiveRule) {
  const parts = VARIABLES.map((variable) => {
    const term = rule.antecedentes[variable.key]
    return `${variable.shortLabel} es ${TERM_LABELS[term] ?? term}`
  })
  return `SI ${parts.join(' · Y ')} → ENTONCES nivel ${TERM_LABELS[rule.consecuente] ?? rule.consecuente}`
}

export function Explainability({ result }: { result: InferenceResponse }) {
  const strongest = [...result.reglas_activas].sort((a, b) => b.activacion - a.activacion || a.numero - b.numero)
  const primary = strongest[0]
  return (
    <section className="explain-section animate-in">
      <div className="section-title-row">
        <div><span className="eyebrow">Explicabilidad</span><h2>¿Por qué se obtuvo este resultado?</h2><p>El motor combina las etiquetas activas de tus cuatro entradas. Estas fueron las reglas que más influyeron.</p></div>
        <span className="soft-badge"><Network size={15} /> {result.reglas_activas.length} reglas activas</span>
      </div>

      {primary && <article className="dominant-rule card">
        <div className="dominant-icon"><Lightbulb size={23} /></div>
        <div><span>Regla dominante #{primary.numero}</span><strong>{ruleText(primary)}</strong><p>Su grado de activación fue {formatNumber(primary.activacion, 3)}. Cuanto más cercano a 1, mayor fue su influencia.</p></div>
        <div className="activation-ring" style={{ '--activation': `${primary.activacion * 100}%` } as React.CSSProperties}><strong>{formatNumber(primary.activacion, 2)}</strong><span>activación</span></div>
      </article>}

      <div className="rules-list card">
        <div className="card-heading compact"><div><span className="section-kicker"><Sigma size={14} /> Reglas activadas</span><h3>Contribuciones al resultado</h3></div></div>
        {strongest.slice(0, 6).map((rule, index) => (
          <details className="rule-item" key={rule.numero} open={index === 0}>
            <summary>
              <span className="rule-number">R{rule.numero}</span>
              <div><strong>{TERM_LABELS[rule.consecuente] ?? rule.consecuente}</strong><span>{index === 0 ? 'Mayor contribución' : 'Regla complementaria'}</span></div>
              <div className="rule-strength"><i style={{ width: `${rule.activacion * 100}%` }} /><span>{formatNumber(rule.activacion, 3)}</span></div>
              <ChevronDown size={17} />
            </summary>
            <p>{ruleText(rule)}</p>
          </details>
        ))}
        {strongest.length > 6 && <p className="rules-note">Se muestran las 6 reglas más influyentes de {strongest.length} activadas. Las 192 reglas completas permanecen en la base auditada del backend.</p>}
      </div>
    </section>
  )
}
