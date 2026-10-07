import { expect, type Page } from '@playwright/test'

export interface ScenarioInputs {
  hr_min_pct: number
  dias_secos: number
  viento_max_ms: number
  humedad_suelo_superficial_m3m3: number
}

const fields: Array<[keyof ScenarioInputs, string]> = [
  ['hr_min_pct', 'Humedad relativa mínima'],
  ['dias_secos', 'Días secos consecutivos'],
  ['viento_max_ms', 'Viento máximo diario'],
  ['humedad_suelo_superficial_m3m3', 'Humedad superficial del suelo'],
]

export async function setManualInputs(page: Page, inputs: ScenarioInputs) {
  for (const [key, label] of fields) {
    await page.getByLabel(label, { exact: true }).fill(String(inputs[key]))
  }
}

export async function runManualInference(page: Page, inputs: ScenarioInputs) {
  await setManualInputs(page, inputs)
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/api/v1/inferences') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Calcular nivel preventivo' }).click()
  const response = await responsePromise
  expect(response.ok()).toBeTruthy()
  await expect(page.getByText('Inferencia completa')).toBeVisible()
  return response.json()
}

export function resultCard(page: Page) {
  return page.locator('article').filter({ hasText: 'Nivel de despliegue preventivo' }).first()
}
