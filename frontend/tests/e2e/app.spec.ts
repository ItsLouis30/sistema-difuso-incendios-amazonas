import { expect, test } from '@playwright/test'
import { resultCard, runManualInference, setManualInputs } from './helpers'

test('ejecuta una inferencia manual completa desde la interfaz', async ({ page }) => {
  await page.goto('/manual')
  await expect(page.getByText('API conectada')).toBeVisible()
  await expect(resultCard(page)).toHaveCount(0)
  await expect(page.getByText('Ejecuta una evaluación para ver el índice, sus reglas y la explicación.')).toBeVisible()
  await expect(page.getByText('Punto geográfico de referencia')).toBeVisible()
  await expect(page.getByText('6 250 hectáreas afectadas')).toBeVisible()
  await expect(page.getByText('Incendios forestales reportados en 2026')).toBeVisible()

  const response = await runManualInference(page, {
    hr_min_pct: 30,
    dias_secos: 8,
    viento_max_ms: 4.5,
    humedad_suelo_superficial_m3m3: 0.354,
  })

  expect(response.resultado).toMatchObject({ indice: 91.67, codigo_categoria: 'muy_alto' })
  await expect(resultCard(page).getByText('91.7')).toBeVisible()
  await expect(resultCard(page).getByText('Muy alto', { exact: true }).first()).toBeVisible()
  await expect(resultCard(page).getByText('Máxima preparación preventiva')).toBeVisible()
  await expect(resultCard(page).getByText('¿Qué significa?')).toBeVisible()
  await expect(page.getByText('¿Por qué Muy alto?')).toBeVisible()
  await expect(page.getByText('Precipitación diaria menor a 1 mm.', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pertenencia del índice final' })).toBeVisible()
  await expect(page.getByText('Centroide = 91.67')).toBeVisible()
  await expect(page.getByText('Rango del modelo: 0–6 m/s', { exact: false }).first()).toBeVisible()
  await expect(page.getByText('el resultado no es un mapa de riesgo regional', { exact: false })).toBeVisible()
})

test('restablecer elimina el resultado anterior', async ({ page }) => {
  await page.goto('/manual')
  await runManualInference(page, {
    hr_min_pct: 85,
    dias_secos: 0,
    viento_max_ms: 1.5,
    humedad_suelo_superficial_m3m3: 0.354,
  })
  await expect(resultCard(page)).toBeVisible()

  await page.getByRole('button', { name: 'Restablecer valores por defecto' }).click()
  await expect(resultCard(page)).toHaveCount(0)
  await expect(page.getByText('Ejecuta una evaluación para ver el índice, sus reglas y la explicación.')).toBeVisible()
})

test('consulta una fecha histórica y conserva su trazabilidad', async ({ page }) => {
  await page.goto('/historico')
  await page.locator('#historical-date').fill('2000-06-01')
  const responsePromise = page.waitForResponse('**/api/v1/inferences/history/2000-06-01')
  await page.getByRole('button', { name: 'Evaluar fecha' }).click()
  const response = await responsePromise
  const body = await response.json()

  expect(response.ok()).toBeTruthy()
  expect(body.modo).toBe('historical')
  expect(body.fuente).toMatchObject({ fecha: '2000-06-01', dentro_periodo_calibracion: true })
  await expect(page.getByText('Inferencia completa')).toBeVisible()
  await expect(page.getByText('weather_inputs_2000_2025.csv')).toBeVisible()
  await expect(resultCard(page)).toBeVisible()
})

test('rechaza valores fuera del universo y acepta los límites exactos', async ({ page }) => {
  await page.goto('/manual')
  await setManualInputs(page, {
    hr_min_pct: 30,
    dias_secos: 8,
    viento_max_ms: 6.1,
    humedad_suelo_superficial_m3m3: 0.354,
  })
  await page.getByRole('button', { name: 'Calcular nivel preventivo' }).click()
  await expect(page.getByRole('alert')).toContainText('Viento máximo diario debe estar entre 0 y 6 m/s')

  const boundary = await runManualInference(page, {
    hr_min_pct: 100,
    dias_secos: 15,
    viento_max_ms: 6,
    humedad_suelo_superficial_m3m3: 1,
  })
  expect(boundary.resultado.indice).toBeGreaterThanOrEqual(0)
  expect(boundary.resultado.indice).toBeLessThanOrEqual(100)
})

test('informa claramente cuando la API no está disponible', async ({ page }) => {
  await page.route('**/health', (route) => route.abort())
  await page.route('**/api/v1/**', (route) => route.abort())
  await page.goto('/manual')

  await expect(page.getByText('API desconectada')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('No pudimos conectar con el backend')
})

test('permite auditar y filtrar la misma base de 192 reglas', async ({ page }) => {
  await page.goto('/reglas')

  await expect(page.getByRole('heading', { name: 'Base de conocimiento.' })).toBeVisible()
  await expect(page.getByText('192 de 192 reglas visibles')).toBeVisible()

  await page.getByRole('searchbox', { name: 'Buscar regla' }).fill('R86')
  await expect(page.getByText('1 de 192 reglas visibles')).toBeVisible()
  await expect(page.getByText('R86', { exact: true })).toBeVisible()

  await page.getByLabel('Abrir detalle de la regla R86').click()
  await expect(page.getByRole('heading', { name: 'Lectura de la regla' })).toBeVisible()
  await expect(page.getByText(/SI HR mínima es/)).toBeVisible()
})
