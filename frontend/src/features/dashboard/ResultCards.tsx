import { Check, Clock3, LoaderCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_META, PIPELINE, TERM_LABELS, VARIABLES } from '../../app/constants'
import { formatNumber } from '../../app/format'
import { Card, CardTitle, IconCircle } from '../../components/common/Bento'
import { OutputCurveChart } from '../../components/charts/OutputCurveChart'
import type { ActiveRule, CategoryCode, InferenceResponse } from '../../types/api'

const CATEGORY_ORDER: CategoryCode[] = ['muy_bajo', 'bajo', 'moderado', 'alto', 'muy_alto']

// Frases cortas por variable para leer una regla como texto natural.
const RULE_PHRASES: Record<string, { prefix: string; terms?: Record<string, string> }> = {
  hr_min_pct: { prefix: 'HR' },
  dias_secos: { prefix: 'días' },
  viento_max_ms: { prefix: 'viento' },
  humedad_suelo_superficial_m3m3: {
    prefix: 'suelo',
    terms: { seca: 'seco', intermedia: 'intermedio', humeda: 'húmedo' },
  },
}

function label(term: string) {
  return TERM_LABELS[term] ?? term
}

/** Mezcla un color semántico con el fondo según el grado de pertenencia (0..1). */
function membershipShade(hex: string, t: number) {
  const from = [251, 243, 239]
  const normalized = hex.replace('#', '')
  const to = [0, 2, 4].map((offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16))
  const mix = from.map((channel, index) => Math.round(channel + (to[index] - channel) * t))
  return `rgb(${mix.join(',')})`
}

export function ruleText(rule: ActiveRule) {
  const parts = VARIABLES.map((variable) => {
    const phrase = RULE_PHRASES[variable.key]
    const term = rule.antecedentes[variable.key]
    return `${phrase.prefix} ${(phrase.terms?.[term] ?? label(term)).toLowerCase()}`
  })
  return `SI ${parts.join(' · ')}`
}

function sortedRules(result: InferenceResponse) {
  return [...result.reglas_activas].sort((a, b) => b.activacion - a.activacion || a.numero - b.numero)
}

/** Activación con la que quedó recortado cada consecuente (máximo de sus reglas). */
function clippedConsequents(result: InferenceResponse) {
  return CATEGORY_ORDER.flatMap((code) => {
    const levels = result.reglas_activas.filter((rule) => rule.consecuente === code).map((rule) => rule.activacion)
    return levels.length ? [{ code, mu: Math.max(...levels) }] : []
  })
}

export function ResultHeroCard({ result }: { result: InferenceResponse }) {
  const score = result.resultado.indice
  const code = result.resultado.codigo_categoria
  const marker = Math.max(0, Math.min(100, score))
  return (
    <article className="rise flex h-full min-w-0 flex-col gap-6 overflow-hidden rounded-[32px] bg-ink p-7 text-white">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-[#bdb8b3]">Nivel de despliegue preventivo</span>
        <span className="flex items-center gap-2 rounded-full bg-[#2a2826] px-3 py-1.5 text-[13px]">
          <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[code].color }} />
          {result.resultado.categoria}
        </span>
      </div>

      <div className="flex items-baseline gap-2.5">
        <strong className="font-display text-[88px] font-semibold leading-[0.9] tracking-[-0.04em] tabular-nums sm:text-[112px]">
          {formatNumber(score, 1)}
        </strong>
        <span className="text-[15px] text-[#bdb8b3]">/ 100</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div
          className="relative h-3 rounded-full"
          style={{ background: `linear-gradient(90deg, ${CATEGORY_ORDER.map((item) => CATEGORY_META[item].color).join(', ')})` }}
          role="img"
          aria-label={`Índice ${formatNumber(score, 1)} en la escala de 0 a 100`}
        >
          <span
            className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_3px_#161514] transition-[left] duration-700"
            style={{ left: `${marker}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-[#bdb8b3] sm:text-xs">
          {CATEGORY_ORDER.map((item) => (
            <span key={item} className={`min-w-0 ${item === code ? 'text-white' : ''}`}>
              {CATEGORY_META[item].label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3.5 rounded-[22px] bg-[#232120] p-4">
        <Sunburst />
        <div className="min-w-0">
          <span className="text-xs text-[#bdb8b3]">Acción recomendada</span>
          <p className="mt-1 break-words text-[17px] font-medium leading-snug">{result.resultado.recomendacion}</p>
        </div>
      </div>
      <p className="mt-auto text-xs leading-relaxed text-[#bdb8b3]">
        Orientación de preparación basada en condiciones meteorológicas; no predice la ocurrencia de un incendio.
      </p>
    </article>
  )
}

export function OutputMembershipCard({ result }: { result: InferenceResponse }) {
  const radii = [116, 94, 72, 50, 28]
  const selected = result.resultado.codigo_categoria
  return (
    <Card className="flex flex-col gap-3 p-6!">
      <CardTitle title="Pertenencia de salida" caption="Del anillo exterior (muy bajo) al centro (muy alto)" />
      <svg viewBox="0 0 260 240" className="mx-auto w-full max-w-[300px]" role="img" aria-label="Grado de pertenencia por categoría de salida">
        {CATEGORY_ORDER.map((code, index) => {
          const r = radii[index]
          const cy = 238 - r
          const mu = result.pertenencias_salida[code] ?? 0
          const isSelected = code === selected
          const innermost = index === radii.length - 1
          return (
            <g key={code}>
              <circle
                cx="130"
                cy={cy}
                r={r}
                fill={membershipShade(CATEGORY_META[code].color, mu)}
                stroke={isSelected ? 'var(--color-ink)' : '#fff'}
                strokeWidth={2}
              />
              <text
                x="130"
                y={innermost ? cy + 4 : cy - r + 15}
                textAnchor="middle"
                fontSize={isSelected ? 12 : 11}
                fontWeight={isSelected ? 600 : 400}
                fill={mu > 0.55 ? '#fff' : mu > 0 ? 'var(--color-ink)' : 'var(--color-muted)'}
              >
                {innermost ? mu.toFixed(2) : `${CATEGORY_META[code].label} ${mu.toFixed(2)}`}
              </text>
            </g>
          )
        })}
      </svg>
    </Card>
  )
}

export function AggregatedCurveCard({ result }: { result: InferenceResponse }) {
  return (
    <Card className="flex flex-col gap-3.5 p-6!">
      <CardTitle
        title="Agregación y centroide"
        caption="Unión (máximo) de los consecuentes recortados por cada regla"
        action={
          <strong className="font-display text-[28px] font-semibold leading-none tabular-nums">
            <span className="text-ember-500">#</span> {formatNumber(result.resultado.indice, 2)}
          </strong>
        }
      />
      <div className="h-52 min-h-0 flex-1">
        <OutputCurveChart data={result.curva_salida} centroid={result.resultado.indice} />
      </div>
      <div className="flex flex-wrap gap-2">
        {clippedConsequents(result).map(({ code, mu }) => (
          <span key={code} className="rounded-full bg-shell px-3 py-1.5 text-xs">
            {CATEGORY_META[code].label} recortado a μ {mu.toFixed(2)}
          </span>
        ))}
      </div>
    </Card>
  )
}

export function DryDaysCard({ result, maximum = 15 }: { result: InferenceResponse; maximum?: number }) {
  const days = result.entradas.dias_secos
  const terms = Object.entries(result.pertenencias_entrada.dias_secos ?? {}).filter(([, degree]) => degree > 0)
  return (
    <Card className="flex flex-col gap-3.5 p-6!">
      <IconCircle className="h-10! w-10!">
        <Clock3 size={18} />
      </IconCircle>
      <div>
        <strong className="font-display text-[26px] font-semibold">{days} {days === 1 ? 'día' : 'días'}</strong>
        <p className="text-xs text-muted">sin lluvia ≥ 1 mm</p>
      </div>
      <div className="mt-auto grid grid-cols-5 gap-2" aria-hidden>
        {Array.from({ length: maximum }, (_, index) => (
          <span key={index} className={`aspect-square rounded-full ${index < days ? 'bg-ember-500' : 'bg-[#ece8e5]'}`} />
        ))}
      </div>
      <p className="text-xs text-muted">
        {terms.map(([term, degree]) => `${label(term)} ${degree.toFixed(2)}`).join(' · ')}
      </p>
    </Card>
  )
}

export function RulesCard({ result, totalRules }: { result: InferenceResponse; totalRules: number }) {
  const [query, setQuery] = useState('')
  const rules = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sortedRules(result).filter(
      (rule) => !needle || `r${rule.numero} ${ruleText(rule)} ${label(rule.consecuente)}`.toLowerCase().includes(needle),
    )
  }, [result, query])
  const dominant = sortedRules(result)[0]?.numero

  return (
    <Card className="flex flex-col gap-4 p-6!">
      <CardTitle
        title="Reglas activadas"
        caption={`${result.reglas_activas.length} de ${totalRules} reglas · activación = mínimo de sus antecedentes`}
        action={
          <label className="flex min-h-11 items-center gap-2 rounded-full border border-line px-3.5 text-[13px] text-muted">
            <Search size={15} />
            <span className="sr-only">Buscar reglas</span>
            <input
              type="search"
              className="w-36 bg-transparent text-ink outline-none placeholder:text-muted sm:w-44"
              placeholder="Buscar en las reglas…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        }
      />
      <ol className="no-scrollbar flex max-h-[460px] flex-col gap-2 overflow-y-auto">
        {rules.map((rule) => {
          const isDominant = rule.numero === dominant
          return (
            <li key={rule.numero} className="flex items-center gap-3.5 rounded-[20px] border border-[#efecea] px-3.5 py-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isDominant ? 'bg-ember-500 text-white' : 'bg-shell text-ink'
                }`}
              >
                R{rule.numero}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug">{ruleText(rule)}</p>
                <div className="mt-2 h-1 rounded-full bg-[#efecea]">
                  <div className="h-1 rounded-full bg-ink" style={{ width: `${rule.activacion * 100}%` }} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="flex items-center justify-end gap-1.5 text-[13px] font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[rule.consecuente].color }} />
                  {label(rule.consecuente)}
                </span>
                <span className="text-xs text-muted">μ {rule.activacion.toFixed(2)}</span>
              </div>
            </li>
          )
        })}
        {!rules.length && <li className="py-6 text-center text-xs text-muted">Ninguna regla coincide con la búsqueda.</li>}
      </ol>
    </Card>
  )
}

export function InferenceStepsCard({ result, totalRules }: { result: InferenceResponse; totalRules: number }) {
  const nonZero = Object.values(result.pertenencias_entrada).reduce(
    (count, degrees) => count + Object.values(degrees).filter((degree) => degree > 0).length,
    0,
  )
  const code = result.resultado.codigo_categoria
  const steps = [
    { title: 'Fuzzificación', text: `4 valores → ${nonZero} grados de pertenencia no nulos.` },
    { title: 'Evaluación de reglas', text: `${result.reglas_activas.length} de ${totalRules} reglas se activan (operador mínimo).` },
    { title: 'Implicación', text: 'Cada consecuente se recorta a la activación de su regla.' },
    { title: 'Agregación', text: 'Las figuras recortadas se unen con el máximo.' },
    { title: 'Centroide', text: `El centro de gravedad de la figura es ${formatNumber(result.resultado.indice, 2)}.`, accent: true },
    {
      title: 'Categoría',
      text: `Mayor pertenencia: ${result.resultado.categoria} (${(result.pertenencias_salida[code] ?? 0).toFixed(2)}).`,
      accent: true,
    },
  ]
  return (
    <Card className="flex flex-col gap-3.5 p-6!">
      <CardTitle
        title={`Cómo se llegó al ${formatNumber(result.resultado.indice, 1)}`}
        caption="Mamdani: mínimo · mínimo · máximo · centroide"
      />
      <ol className="flex flex-col">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ${
                  step.accent ? 'bg-ember-500' : 'bg-ink'
                }`}
              >
                {index + 1}
              </span>
              {index < steps.length - 1 && <span className="min-h-3.5 w-px flex-1 bg-line" />}
            </div>
            <div className="pb-4">
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link
        to="/metodologia"
        className="mt-auto flex min-h-12 items-center justify-center rounded-full bg-ink text-sm font-medium text-white transition-colors hover:bg-[#2a2826]"
      >
        Ver la metodología completa
      </Link>
    </Card>
  )
}

function Sunburst() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" className="shrink-0 text-ember-300" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <circle cx="24" cy="24" r="7" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2" />
    </svg>
  )
}

export function PipelineStrip({ step, done }: { step: number; done: boolean }) {
  return (
    <Card className="no-scrollbar flex items-center gap-2 overflow-x-auto py-3!">
      <span className="mr-2 shrink-0 text-xs font-medium text-muted">{done ? 'Inferencia completa' : 'Motor Mamdani'}</span>
      {PIPELINE.map((name, index) => {
        const complete = done || step > index
        const current = !done && step === index
        return (
          <span
            key={name}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              complete ? 'bg-ink text-white' : current ? 'bg-ember-500 text-white' : 'border border-line text-muted'
            }`}
          >
            {complete ? <Check size={12} /> : current ? <LoaderCircle size={12} className="animate-spin" /> : <span className="tabular-nums">{index + 1}</span>}
            {name}
          </span>
        )
      })}
    </Card>
  )
}

export function EmptyResultCard({ message }: { message: string }) {
  return <Card className="text-sm text-muted">{message}</Card>
}
