import type { CSSProperties } from 'react'
import { TERM_LABELS, type VariableInfo } from '../../app/constants'
import { formatNumber } from '../../app/format'
import { Card, IconCircle, Pill } from '../../components/common/Bento'

export function VariableCard({ info, value, memberships, onChange, readOnly = false }: {
  info: VariableInfo
  value: number
  memberships?: Record<string, number>
  onChange?: (value: number) => void
  readOnly?: boolean
}) {
  const fill = Math.max(0, Math.min(100, ((value - info.minimum) / (info.maximum - info.minimum)) * 100))
  const terms = Object.entries(memberships ?? {}).filter(([, degree]) => degree > 0).sort((a, b) => b[1] - a[1])
  const dominant = terms[0]
  const inputId = `input-${info.key}`
  const decimals = info.step < 0.01 ? 3 : info.step < 1 ? 2 : 0

  return (
    <Card className="flex flex-col gap-4 rounded-[28px]! p-[22px]!">
      <div className="flex items-center justify-between gap-3">
        <IconCircle>
          <info.Icon size={16} />
        </IconCircle>
        <Pill>{dominant ? TERM_LABELS[dominant[0]] ?? dominant[0] : 'Sin evaluar'}</Pill>
      </div>

      <div>
        <label htmlFor={inputId} className="text-[13px] text-muted">
          {info.label}
        </label>
        <div className="mt-1 flex items-baseline gap-1.5">
          {readOnly ? (
            <strong id={inputId} className="font-display text-[40px] font-semibold leading-none tracking-[-0.02em]">
              {formatNumber(value, decimals)}
            </strong>
          ) : (
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              style={{ width: `${Math.max(2, String(value).length) + 0.6}ch` }}
              className="rounded-lg bg-transparent font-display text-[40px] font-semibold leading-none tracking-[-0.02em] outline-none focus-visible:bg-[#f5f5f5]"
              value={value}
              min={info.minimum}
              max={info.maximum}
              step={info.step}
              onChange={(event) => onChange?.(Number(event.target.value))}
            />
          )}
          <span className="text-sm text-muted">{info.unit}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          Valor ingresado · Rango del modelo: {formatNumber(info.minimum, decimals)}–{formatNumber(info.maximum, decimals)} {info.unit}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted" title={info.influence}>
          {info.explanation} {info.influence}
        </p>
      </div>

      {readOnly ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#ededed]">
          <div className="h-full rounded-full bg-ember-500" style={{ width: `${fill}%` }} />
        </div>
      ) : (
        <input
          aria-label={`Deslizador de ${info.label}`}
          type="range"
          className="ember-range"
          style={{ '--fill': `${fill}%` } as CSSProperties}
          min={info.minimum}
          max={info.maximum}
          step={info.step}
          value={value}
          onChange={(event) => onChange?.(Number(event.target.value))}
        />
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 border-t border-[#efecea] pt-3">
        <span className="mb-0.5 w-full text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          Pertenencias activas
        </span>
        {terms.length ? (
          terms.map(([term, degree]) => (
            <span key={term} className="flex items-center gap-1.5 rounded-full bg-shell px-2.5 py-1 text-xs">
              {TERM_LABELS[term] ?? term} <strong className="font-semibold tabular-nums">μ {degree.toFixed(2)}</strong>
            </span>
          ))
        ) : (
          <span className="text-xs text-muted">La pertenencia aparece al evaluar.</span>
        )}
      </div>
    </Card>
  )
}
