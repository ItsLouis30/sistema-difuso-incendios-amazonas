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
    <article className="variable-card">
      <div className="variable-card-head">
        <span className="variable-icon"><info.Icon size={19} /></span>
        <div><label htmlFor={inputId}>{info.label}</label><span>{info.unit}</span></div>
        <button className="icon-button" type="button" title={`${info.explanation} ${info.influence}`} aria-label={`Información sobre ${info.label}`}><Info size={16} /></button>
      </div>

      <div className="value-row">
        <input id={inputId} className="number-input" type="number" value={value} min={info.minimum} max={info.maximum} step={info.step} readOnly={readOnly} onChange={(event) => onChange?.(Number(event.target.value))} />
        <span>{info.unit}</span>
      </div>

      <div className="range-wrap">
        {!readOnly && <input aria-label={`Ajustar ${info.label}`} type="range" min={info.minimum} max={info.maximum} step={info.step} value={value} onChange={(event) => onChange?.(Number(event.target.value))} style={{ '--range-progress': `${percentage}%` } as React.CSSProperties} />}
        {readOnly && <div className="readonly-range"><span style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} /></div>}
        <div className="range-labels"><span>{info.minimum}</span><span>{info.maximum} {info.unit}</span></div>
      </div>

      <p className="variable-help">{info.explanation}</p>
      <div className="membership-summary">
        {activeTerms.length ? activeTerms.map(([term, degree]) => (
          <div className="membership-row" key={term}>
            <span>{TERM_LABELS[term] ?? term}</span>
            <div className="membership-bar"><i style={{ width: `${degree * 100}%` }} /></div>
            <strong>{formatNumber(degree, 3)}</strong>
          </div>
        )) : <span className="membership-placeholder">Se calculará su pertenencia lingüística</span>}
      </div>
    </article>
  )
}
