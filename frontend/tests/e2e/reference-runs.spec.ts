import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resultCard, runManualInference, type ScenarioInputs } from './helpers'

interface Scenario {
  slug: string
  title: string
  inputs: ScenarioInputs
  expectedIndex: number
  expectedCode: string
}

const scenarios: Scenario[] = [
  {
    slug: 'muy-bajo',
    title: 'Muy bajo',
    inputs: { hr_min_pct: 85, dias_secos: 0, viento_max_ms: 1.5, humedad_suelo_superficial_m3m3: 0.354 },
    expectedIndex: 8.33,
    expectedCode: 'muy_bajo',
  },
  {
    slug: 'moderado',
    title: 'Moderado',
    inputs: { hr_min_pct: 85, dias_secos: 8, viento_max_ms: 1.5, humedad_suelo_superficial_m3m3: 0.354 },
    expectedIndex: 50,
    expectedCode: 'moderado',
  },
  {
    slug: 'alto',
    title: 'Alto',
    inputs: { hr_min_pct: 30, dias_secos: 0, viento_max_ms: 4.5, humedad_suelo_superficial_m3m3: 0.354 },
    expectedIndex: 75,
    expectedCode: 'alto',
  },
  {
    slug: 'muy-alto',
    title: 'Muy alto',
    inputs: { hr_min_pct: 30, dias_secos: 8, viento_max_ms: 4.5, humedad_suelo_superficial_m3m3: 0.354 },
    expectedIndex: 91.67,
    expectedCode: 'muy_alto',
  },
]

const testRoot = dirname(fileURLToPath(import.meta.url))
const evidenceDirectory = resolve(testRoot, '../../../docs/testing/evidence')
const reportPath = resolve(testRoot, '../../../docs/testing/REFERENCE_RUNS.md')

const termLabels: Record<string, string> = {
  muy_baja: 'Muy baja', baja: 'Baja', media: 'Media', alta: 'Alta',
  cortos: 'Cortos', moderados: 'Moderados', prolongados: 'Prolongados', extremos: 'Extremos',
  muy_bajo: 'Muy bajo', bajo: 'Bajo', medio: 'Medio', alto: 'Alto',
  seca: 'Seca', intermedia: 'Intermedia', humeda: 'Húmeda', moderado: 'Moderado', muy_alto: 'Muy alto',
}

const variableLabels: Record<string, string> = {
  hr_min_pct: 'HR mínima',
  dias_secos: 'Días secos',
  viento_max_ms: 'Viento máximo',
  humedad_suelo_superficial_m3m3: 'Humedad superficial del suelo',
}

function dominantFactors(body: any) {
  return Object.entries(body.pertenencias_entrada).map(([variable, memberships]) => {
    const [term, degree] = Object.entries(memberships as Record<string, number>)
      .sort((left, right) => right[1] - left[1])[0]
    return { variable: variableLabels[variable] ?? variable, term, label: termLabels[term] ?? term, degree }
  })
}

test('genera las cuatro corridas oficiales y sus capturas', async ({ page }) => {
  await mkdir(evidenceDirectory, { recursive: true })
  await page.goto('/manual')
  await expect(page.getByText('API conectada')).toBeVisible()
  const runs: Array<{ scenario: Scenario; body: any; factors: ReturnType<typeof dominantFactors>; dominantRule: any }> = []

  for (const scenario of scenarios) {
    const body = await runManualInference(page, scenario.inputs)
    expect(body.resultado.indice).toBe(scenario.expectedIndex)
    expect(body.resultado.codigo_categoria).toBe(scenario.expectedCode)
    const dominantRule = [...body.reglas_activas].sort(
      (left: any, right: any) => right.activacion - left.activacion || left.numero - right.numero,
    )[0]
    runs.push({ scenario, body, factors: dominantFactors(body), dominantRule })
    await page.screenshot({
      path: resolve(evidenceDirectory, `corrida-${scenario.slug}.png`),
      fullPage: true,
    })
  }

  const sections = runs.map(({ scenario, body, factors, dominantRule }) => `
## ${scenario.title}

![Corrida ${scenario.title}](evidence/corrida-${scenario.slug}.png)

| Elemento | Valor |
|---|---|
| HR mínima | ${scenario.inputs.hr_min_pct} % |
| Días secos | ${scenario.inputs.dias_secos} |
| Viento máximo | ${scenario.inputs.viento_max_ms} m/s |
| Humedad superficial del suelo | ${scenario.inputs.humedad_suelo_superficial_m3m3} m³/m³ |
| Índice | ${body.resultado.indice} / 100 |
| Categoría | ${body.resultado.categoria} |
| Recomendación | ${body.resultado.recomendacion} |

**Pertenencias dominantes:** ${factors.map((factor) => `${factor.variable} = ${factor.label} (μ ${factor.degree.toFixed(2)})`).join('; ')}.

**Regla más activa:** R${dominantRule.numero}, consecuente ${termLabels[dominantRule.consecuente] ?? dominantRule.consecuente}, activación μ ${dominantRule.activacion.toFixed(2)}.
`)

  await writeFile(
    reportPath,
    `# Cuatro corridas oficiales\n\nEstas corridas fueron ejecutadas desde la interfaz web contra la API real. Verifican el comportamiento esperado del software; no constituyen validación contra incendios observados.\n${sections.join('\n')}\n`,
    'utf8',
  )
})
