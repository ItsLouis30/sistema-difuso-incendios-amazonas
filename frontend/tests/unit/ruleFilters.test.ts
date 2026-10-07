import { describe, expect, it } from 'vitest'
import { EMPTY_RULE_FILTERS, filterRules } from '../../src/features/rules/ruleFilters'
import type { FuzzyRule } from '../../src/types/api'

const rules: FuzzyRule[] = [
  {
    numero: 86,
    antecedentes: {
      hr_min_pct: 'baja',
      dias_secos: 'moderados',
      viento_max_ms: 'bajo',
      humedad_suelo_superficial_m3m3: 'intermedia',
    },
    consecuente: 'moderado',
  },
  {
    numero: 192,
    antecedentes: {
      hr_min_pct: 'alta',
      dias_secos: 'extremos',
      viento_max_ms: 'alto',
      humedad_suelo_superficial_m3m3: 'humeda',
    },
    consecuente: 'alto',
  },
]

describe('filterRules', () => {
  it('encuentra una regla por su identificador sin exigir ceros iniciales', () => {
    expect(filterRules(rules, 'R86', EMPTY_RULE_FILTERS)).toEqual([rules[0]])
  })

  it('combina filtros de antecedentes y consecuente', () => {
    expect(filterRules(rules, '', {
      ...EMPTY_RULE_FILTERS,
      humedad_suelo_superficial_m3m3: 'humeda',
      consecuente: 'alto',
    })).toEqual([rules[1]])
  })
})
