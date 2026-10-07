import { useEffect, useMemo, useState } from 'react'
import { BookOpenCheck, FilterX, Search, SlidersHorizontal } from 'lucide-react'
import { CATEGORY_META, TERM_LABELS } from '../app/constants'
import { Card, CardTitle, HeroBand, IconCircle, Pill } from '../components/common/Bento'
import { ErrorState, LoadingState } from '../components/common/Feedback'
import {
  EMPTY_RULE_FILTERS,
  filterRules,
  type RuleFilterKey,
  type RuleFilters,
} from '../features/rules/ruleFilters'
import { ApiError, api } from '../services/api/client'
import type { FuzzyRule, RulesResponse } from '../types/api'

const antecedents = [
  { key: 'hr_min_pct', label: 'HR mínima' },
  { key: 'dias_secos', label: 'Días secos' },
  { key: 'viento_max_ms', label: 'Viento' },
  { key: 'humedad_suelo_superficial_m3m3', label: 'Humedad del suelo' },
] as const

const filterDefinitions: Array<{ key: RuleFilterKey; label: string }> = [
  ...antecedents,
  { key: 'consecuente', label: 'Consecuente' },
]

function label(term: string) {
  return TERM_LABELS[term] ?? term.replaceAll('_', ' ')
}

function ruleSentence(rule: FuzzyRule) {
  const values = rule.antecedentes
  return `SI HR mínima es ${label(values.hr_min_pct).toLowerCase()}, días secos son ${label(values.dias_secos).toLowerCase()}, viento es ${label(values.viento_max_ms).toLowerCase()} y humedad del suelo es ${label(values.humedad_suelo_superficial_m3m3).toLowerCase()}, ENTONCES el nivel es ${label(rule.consecuente).toLowerCase()}.`
}

export function RulesPage() {
  const [data, setData] = useState<RulesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<RuleFilters>({ ...EMPTY_RULE_FILTERS })
  const [selectedRule, setSelectedRule] = useState<FuzzyRule | null>(null)

  useEffect(() => {
    let active = true
    api.rules()
      .then((response) => {
        if (active) setData(response)
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof ApiError ? requestError.message : 'No fue posible cargar la base de reglas.')
        }
      })
    return () => { active = false }
  }, [])

  const visibleRules = useMemo(
    () => filterRules(data?.reglas ?? [], query, filters),
    [data, query, filters],
  )

  const options = useMemo(() => {
    const rules = data?.reglas ?? []
    return Object.fromEntries(filterDefinitions.map(({ key }) => {
      const values = rules.map((rule) => key === 'consecuente' ? rule.consecuente : rule.antecedentes[key])
      return [key, [...new Set(values)]]
    })) as Record<RuleFilterKey, string[]>
  }, [data])

  function changeFilter(key: RuleFilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
    setSelectedRule(null)
  }

  function clearFilters() {
    setQuery('')
    setFilters({ ...EMPTY_RULE_FILTERS })
    setSelectedRule(null)
  }

  return (
    <>
      <HeroBand
        left={
          <>
            <Pill tone="dark" className="px-4! py-2! text-sm!">{data?.total_reglas ?? 192} reglas</Pill>
            <Pill className="px-4! py-2! text-sm!">4 variables de entrada</Pill>
            <Pill className="px-4! py-2! text-sm!">5 niveles de salida</Pill>
          </>
        }
        title="Base de conocimiento."
        subtitle="Las reglas que utiliza el motor Mamdani."
      />

      <div className="grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:px-6 xl:grid-cols-12">
        <Card className="xl:col-span-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-3xl gap-3">
              <IconCircle dark><BookOpenCheck size={17} /></IconCircle>
              <div>
                <h2 className="font-display text-xl font-semibold">¿Cómo se construyen las reglas?</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  La base combina sistemáticamente las etiquetas lingüísticas de las cuatro entradas. En cada evaluación participan únicamente las reglas cuyo grado de activación es mayor que cero.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-3xl bg-ink px-5 py-4 text-white" aria-label="Cálculo de reglas">
              <span className="font-display text-lg font-semibold">4 × 4 × 4 × 3</span>
              <span className="text-[#aaa6a1]">=</span>
              <strong className="font-display text-2xl">192</strong>
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-12">
          <CardTitle
            title="Explorar reglas"
            caption="Busca por identificador o término lingüístico y combina los filtros para auditar la matriz de conocimiento."
            action={<IconCircle><SlidersHorizontal size={16} /></IconCircle>}
          />

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="relative md:col-span-2 xl:col-span-1">
              <span className="sr-only">Buscar regla</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="search"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setSelectedRule(null) }}
                placeholder="Buscar R86…"
                className="min-h-12 w-full rounded-2xl border border-line bg-band py-3 pl-11 pr-4 text-sm outline-none transition focus:border-ember-300 focus:ring-2 focus:ring-ember-100"
              />
            </label>
            {filterDefinitions.map(({ key, label: filterLabel }) => (
              <label key={key} className="min-w-0">
                <span className="sr-only">Filtrar por {filterLabel}</span>
                <select
                  value={filters[key]}
                  onChange={(event) => changeFilter(key, event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-line bg-band px-3 text-sm outline-none transition focus:border-ember-300 focus:ring-2 focus:ring-ember-100"
                >
                  <option value="">{filterLabel}: todos</option>
                  {options[key]?.map((term) => <option key={term} value={term}>{label(term)}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted" aria-live="polite">
              <strong className="font-semibold text-ink">{visibleRules.length}</strong> de {data?.total_reglas ?? 192} reglas visibles
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium transition hover:bg-band"
            >
              <FilterX size={15} /> Limpiar filtros
            </button>
          </div>
        </Card>

        {selectedRule && (
          <Card className="xl:col-span-12" aria-live="polite">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <Pill tone="dark" className="self-start px-4! py-2! text-sm!">R{selectedRule.numero}</Pill>
              <div>
                <h2 className="font-display text-lg font-semibold">Lectura de la regla</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{ruleSentence(selectedRule)}</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden p-0! xl:col-span-12">
          {error ? (
            <div className="p-5"><ErrorState message={error} /></div>
          ) : !data ? (
            <div className="p-5"><LoadingState message="Cargando la base de conocimiento…" /></div>
          ) : visibleRules.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
              <Search size={24} className="text-muted" />
              <h2 className="mt-3 font-display text-lg font-semibold">No hay reglas con estos criterios</h2>
              <p className="mt-1 text-sm text-muted">Prueba otra búsqueda o limpia los filtros.</p>
            </div>
          ) : (
            <div className="max-h-[680px] overflow-auto">
              <table className="w-full min-w-[940px] border-collapse text-left text-sm">
                <caption className="sr-only">Base completa de reglas difusas del modelo Mamdani</caption>
                <thead className="sticky top-0 z-10 bg-ink text-xs uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-5 py-4 font-medium">ID</th>
                    {antecedents.map(({ key, label: heading }) => <th key={key} className="px-4 py-4 font-medium">{heading}</th>)}
                    <th className="px-4 py-4 font-medium">Consecuente</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRules.map((rule) => {
                    const category = CATEGORY_META[rule.consecuente]
                    const isSelected = selectedRule?.numero === rule.numero
                    return (
                      <tr
                        key={rule.numero}
                        tabIndex={0}
                        onClick={() => setSelectedRule(rule)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedRule(rule)
                          }
                        }}
                        className={`cursor-pointer border-b border-line outline-none transition last:border-0 hover:bg-band focus-visible:bg-ember-50 ${isSelected ? 'bg-ember-50' : ''}`}
                        aria-label={`Abrir detalle de la regla R${rule.numero}`}
                      >
                        <td className="px-5 py-3.5 font-mono font-semibold">R{rule.numero}</td>
                        {antecedents.map(({ key }) => <td key={key} className="px-4 py-3.5">{label(rule.antecedentes[key])}</td>)}
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-medium">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                            {category.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
