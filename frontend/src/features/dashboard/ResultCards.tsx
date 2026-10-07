import { Check, Clock3, Info, LoaderCircle, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORY_MEANINGS, CATEGORY_META, CATEGORY_SUMMARIES, PIPELINE, TERM_LABELS, VARIABLES } from '../../app/constants'
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

export function explanationDetails(result: InferenceResponse) {
  const factors = VARIABLES.map((variable) => {
    const memberships = Object.entries(result.pertenencias_entrada[variable.key] ?? {})
    const [term = 'sin_dato', degree = 0] = memberships.reduce<[string, number]>(
      (dominant, current) => (current[1] > dominant[1] ? current : dominant),
      ['sin_dato', -1],
    )
    return {
      key: variable.key,
      variable: variable.shortLabel,
      term,
      label: label(term),
      degree: Math.max(0, degree),
    }
  })
  return { factors, dominantRule: sortedRules(result)[0] }
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
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-[#bdb8b3]">Nivel de despliegue preventivo</span>
      </div>

      <div>
        <div className="flex items-baseline gap-2.5">
          <strong className="font-display text-[80px] font-semibold leading-[0.9] tracking-[-0.04em] tabular-nums sm:text-[104px]">
            {formatNumber(score, 1)}
          </strong>
          <span className="text-[17px] text-[#bdb8b3]">/100</span>
        </div>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <strong
            className="font-display text-[30px] font-semibold uppercase leading-none tracking-[0.02em] sm:text-[36px]"
            style={{ color: CATEGORY_META[code].color }}
          >
            {result.resultado.categoria}
          </strong>
          <span className="text-sm text-[#bdb8b3]">{CATEGORY_SUMMARIES[code]}</span>
        </div>
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

      <div className="flex min-h-[150px] flex-1 flex-col justify-center rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
        <span className="flex items-center gap-2 text-xs font-medium text-[#d8d3cf]">
          <Info size={15} className="text-ember-300" /> ¿Qué significa?
        </span>
        <p className="mt-3 text-sm leading-7 text-[#c9c4bf]">{CATEGORY_MEANINGS[code]}</p>
      </div>

      <div className="flex items-start gap-3.5 rounded-[22px] bg-[#232120] p-4">
        <Sunburst />
        <div className="min-w-0">
          <span className="text-xs text-[#bdb8b3]">Acción recomendada</span>
          <p className="mt-1 break-words text-[17px] font-medium leading-snug">{result.resultado.recomendacion}</p>
        </div>
      </div>
    </article>
  )
}

export function ResultExplanationCard({ result, totalRules }: { result: InferenceResponse; totalRules: number }) {
  const { factors, dominantRule } = explanationDetails(result)

  return (
    <Card className="overflow-hidden p-0!">
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr]">
        <section className="border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={17} className="text-ember-500" /> ¿Por qué {result.resultado.categoria}?
          </div>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Principales señales</h3>
          <div className="mt-2 overflow-hidden rounded-2xl border border-line">
            <table className="w-full table-fixed text-left text-xs sm:text-[13px]">
              <thead className="bg-shell text-muted">
                <tr>
                  <th className="w-[48%] px-3 py-2 font-medium">Variable</th>
                  <th className="w-[34%] px-3 py-2 font-medium">Categoría</th>
                  <th className="w-[18%] px-3 py-2 text-right font-medium">μ</th>
                </tr>
              </thead>
              <tbody>
                {factors.map((factor) => (
                  <tr key={factor.key} className="border-t border-line first:border-t-0">
                    <td className="px-3 py-2.5 text-muted">{factor.variable}</td>
                    <td className="px-3 py-2.5 font-semibold">{factor.label}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">{factor.degree.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dominantRule && (
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Estas condiciones activaron <strong className="text-ink">{result.reglas_activas.length} de {totalRules} reglas</strong>. La mayor activación fue{' '}
              <strong className="text-ink">R{dominantRule.numero}, con μ = {dominantRule.activacion.toFixed(2)}</strong>:{' '}
              {ruleText(dominantRule).replace(/^SI /, '').toLowerCase()} → {label(dominantRule.consecuente)}.
            </p>
          )}
        </section>

        <section className="flex flex-col p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={17} className="text-ember-500" /> Alcance del resultado
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            Esta evaluación se basa en reglas difusas. No constituye una alerta oficial ni predice la ocurrencia de un incendio forestal.
          </p>
          <dl className="mt-5 grid flex-1 content-center gap-2">
            <div className="rounded-2xl bg-shell px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Qué evalúa</dt>
              <dd className="mt-1 text-xs leading-relaxed text-ink">Condiciones climáticas favorables para definir preparación preventiva.</dd>
            </div>
            <div className="rounded-2xl bg-shell px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Qué no predice</dt>
              <dd className="mt-1 text-xs leading-relaxed text-ink">La ignición, ubicación o probabilidad de un incendio futuro.</dd>
            </div>
            <div className="rounded-2xl bg-shell px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Ámbito</dt>
              <dd className="mt-1 text-xs leading-relaxed text-ink">Punto de referencia de Chachapoyas; el resultado no es un mapa de riesgo regional.</dd>
            </div>
          </dl>
        </section>
      </div>
    </Card>
  )
}

export function OutputMembershipCard({ result }: { result: InferenceResponse }) {
  const selected = result.resultado.codigo_categoria
  return (
    <Card className="flex flex-col gap-4 p-6!">
      <CardTitle
        title="Pertenencia del índice final"
        caption="Grado μ del centroide respecto a cada categoría de salida"
      />
      <div className="flex flex-1 flex-col justify-center gap-3" role="img" aria-label="Grado de pertenencia del índice final por categoría">
        {CATEGORY_ORDER.map((code) => {
          const mu = result.pertenencias_salida[code] ?? 0
          const isSelected = code === selected
          return (
            <div key={code} className={`rounded-2xl px-3 py-2.5 ${isSelected ? 'bg-shell' : ''}`}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className={`flex items-center gap-2 ${isSelected ? 'font-semibold text-ink' : 'text-muted'}`}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_META[code].color }} />
                  {CATEGORY_META[code].label}
                </span>
                <strong className="font-mono font-semibold tabular-nums text-ink">μ {mu.toFixed(2)}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#edeae7]">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.max(0, Math.min(100, mu * 100))}%`, backgroundColor: CATEGORY_META[code].color }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs leading-relaxed text-muted">
        La categoría mostrada corresponde al mayor grado de pertenencia del índice crisp.
      </p>
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
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-shell px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">Agregación</dt>
          <dd className="mt-0.5 text-xs font-medium">Máximo de salidas recortadas</dd>
        </div>
        <div className="rounded-2xl bg-shell px-3 py-2.5">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-muted">Defuzzificación</dt>
          <dd className="mt-0.5 text-xs font-medium">Centroide</dd>
        </div>
        <div className="rounded-2xl bg-ink px-3 py-2.5 text-white">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#aaa6a1]">Resultado</dt>
          <dd className="mt-0.5 text-xs font-semibold tabular-nums">{formatNumber(result.resultado.indice, 2)}</dd>
        </div>
      </dl>
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
        <p className="text-xs font-medium text-ink">días secos consecutivos</p>
        <p className="mt-1 text-xs text-muted">Precipitación diaria menor a 1 mm.</p>
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
              <div className="w-[116px] shrink-0 border-l border-line pl-3 text-left">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">Consecuente</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[rule.consecuente].color }} />
                  {label(rule.consecuente)}
                </span>
                <span className="mt-2 block text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">Activación</span>
                <span className="mt-0.5 block text-xs font-medium tabular-nums">μ = {rule.activacion.toFixed(2)}</span>
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
    {
      title: `Centroide = ${formatNumber(result.resultado.indice, 2)}`,
      text: 'El centro de gravedad de la función agregada determina el índice final.',
      accent: true,
    },
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
        caption="AND: mínimo · Implicación: mínimo · Agregación: máximo · Defuzzificación: centroide"
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
