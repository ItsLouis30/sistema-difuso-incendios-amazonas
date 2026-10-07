# Pruebas extremo a extremo

Las pruebas E2E ejecutan la aplicación completa con **FastAPI + Vite + Chrome**.
Playwright inicia ambos servicios, interactúa con la interfaz y verifica las
respuestas reales de la API.

## Casos cubiertos

| Caso | Verificación |
|---|---|
| Evaluación manual | Envía las cuatro entradas, espera la inferencia y comprueba índice, categoría y explicación |
| Evaluación histórica | Consulta `2000-06-01` y comprueba fecha, dataset y periodo de calibración |
| Validación | Rechaza viento `6.1 m/s` y muestra un mensaje comprensible |
| Límites | Acepta exactamente HR `100`, días `15`, viento `6` y suelo `1` |
| API desconectada | Interrumpe las solicitudes y comprueba el estado y mensaje de conexión |
| Corridas oficiales | Ejecuta y captura los niveles Muy bajo, Moderado, Alto y Muy alto |

## Ejecución

Desde `frontend`:

```powershell
pnpm test:e2e
```

Para regenerar únicamente las evidencias oficiales:

```powershell
pnpm evidence
```

Las pruebas utilizan el Chrome instalado en el equipo y los puertos locales
`8000` y `5173`. Los servidores se cierran al finalizar.

## Evidencias

- [`REFERENCE_RUNS.md`](REFERENCE_RUNS.md): entradas, resultados, explicación y regla dominante.
- [`evidence/`](evidence/): cuatro capturas completas de la interfaz.

Estas pruebas demuestran integración y reproducibilidad del software. No validan
el modelo contra incendios observados ni convierten el índice en una alerta oficial.

## Resultado de cierre

Verificación ejecutada el **7 de octubre de 2026**:

| Comprobación | Resultado |
|---|---:|
| Backend | 59 pruebas aprobadas |
| Frontend unitario | 5 pruebas aprobadas |
| Frontend E2E | 4 recorridos aprobados |
| Generación de evidencias | 4 escenarios y 4 capturas generadas |
| TypeScript y build Vite | Completados sin errores |
