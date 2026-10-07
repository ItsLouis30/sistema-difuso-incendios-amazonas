import { TERM_LABELS } from '../../app/constants'
import type { FuzzyRule } from '../../types/api'

export type RuleFilterKey =
  | 'hr_min_pct'
  | 'dias_secos'
  | 'viento_max_ms'
  | 'humedad_suelo_superficial_m3m3'
  | 'consecuente'

export type RuleFilters = Record<RuleFilterKey, string>

export const EMPTY_RULE_FILTERS: RuleFilters = {
  hr_min_pct: '',
  dias_secos: '',
  viento_max_ms: '',
  humedad_suelo_superficial_m3m3: '',
  consecuente: '',
}

export function filterRules(rules: FuzzyRule[], query: string, filters: RuleFilters) {
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  return rules.filter((rule) => {
    const values = rule.antecedentes
    if (filters.hr_min_pct && values.hr_min_pct !== filters.hr_min_pct) return false
    if (filters.dias_secos && values.dias_secos !== filters.dias_secos) return false
    if (filters.viento_max_ms && values.viento_max_ms !== filters.viento_max_ms) return false
    if (
      filters.humedad_suelo_superficial_m3m3 &&
      values.humedad_suelo_superficial_m3m3 !== filters.humedad_suelo_superficial_m3m3
    ) return false
    if (filters.consecuente && rule.consecuente !== filters.consecuente) return false
    if (!normalizedQuery) return true

    const searchable = [
      `r${rule.numero}`,
      ...Object.values(values),
      ...Object.values(values).map((term) => TERM_LABELS[term] ?? term),
      rule.consecuente,
      TERM_LABELS[rule.consecuente] ?? rule.consecuente,
    ].join(' ').toLocaleLowerCase('es')
    return searchable.includes(normalizedQuery)
  })
}
