import { describe, expect, it } from 'vitest'
import { explanationDetails } from '../../src/features/dashboard/ResultCards'
import type { InferenceResponse } from '../../src/types/api'

const result = {
  pertenencias_entrada: {
    hr_min_pct: { muy_baja: 0, baja: 0.8, media: 0.2, alta: 0 },
    dias_secos: { cortos: 0.1, moderados: 0.9, prolongados: 0, extremos: 0 },
    viento_max_ms: { muy_bajo: 0.2, bajo: 0.7, medio: 0.3, alto: 0 },
    humedad_suelo_superficial_m3m3: { seca: 0.1, intermedia: 0.75, humeda: 0.25 },
  },
  reglas_activas: [
    {
      numero: 42,
      antecedentes: {
        hr_min_pct: 'baja',
        dias_secos: 'moderados',
        viento_max_ms: 'bajo',
        humedad_suelo_superficial_m3m3: 'intermedia',
      },
      consecuente: 'moderado',
      activacion: 0.7,
    },
    {
      numero: 41,
      antecedentes: {
        hr_min_pct: 'baja',
        dias_secos: 'moderados',
        viento_max_ms: 'muy_bajo',
        humedad_suelo_superficial_m3m3: 'intermedia',
      },
      consecuente: 'bajo',
      activacion: 0.2,
    },
  ],
} as unknown as InferenceResponse

describe('explanationDetails', () => {
  it('uses the dominant membership of every input and the strongest active rule', () => {
    const details = explanationDetails(result)

    expect(details.factors.map(({ label, degree }) => [label, degree])).toEqual([
      ['Baja', 0.8],
      ['Moderados', 0.9],
      ['Bajo', 0.7],
      ['Intermedia', 0.75],
    ])
    expect(details.dominantRule?.numero).toBe(42)
  })
})
