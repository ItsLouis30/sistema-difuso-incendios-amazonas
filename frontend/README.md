# Frontend del Sistema Difuso G8

Interfaz web en React, TypeScript y Vite para consumir la API del sistema Mamdani. Presenta las cuatro entradas reales del modelo, la inferencia manual e histórica, las reglas activadas, la curva agregada, el centroide, el historial y la metodología.

## Requisitos

- Node.js 20 o posterior.
- pnpm 11.
- Backend disponible en `http://127.0.0.1:8000` durante el desarrollo.

## Ejecución

```bash
pnpm install
pnpm dev
```

Vite expone el frontend en `http://127.0.0.1:5173` y redirige `/api` y `/health` al backend local.

## Comprobaciones

```powershell
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm test:e2e` inicia temporalmente FastAPI y Vite, abre Chrome y comprueba el
flujo manual, la consulta histórica, los límites de entrada y el estado de API
desconectada. Requiere Google Chrome instalado.

Para regenerar las cuatro corridas oficiales y sus capturas:

```powershell
pnpm evidence
```

El reporte se guarda en `../docs/testing/REFERENCE_RUNS.md` y las imágenes en
`../docs/testing/evidence/`.

## Rutas

- `/manual`: evaluación con cuatro valores ingresados por el usuario.
- `/historico`: evaluación de una fecha del dataset ERA5/ERA5-Land.
- `/historial`: evolución temporal del índice preventivo.
- `/metodologia`: variables, conjuntos lingüísticos, operadores y alcance del modelo.

El índice es una orientación académica de preparación preventiva. No representa una probabilidad de incendio, una predicción espacial ni una orden operativa.
