# API REST del sistema difuso

La API FastAPI expone la versión `1.1.0` del modelo Mamdani y el dataset diario
preparado. El prefijo funcional es `/api/v1`; la comprobación de salud permanece
en `/health`.

## Ejecución

Desde `backend`:

```powershell
python -m pip install -e ".[dev]"
python -m uvicorn app.main:app --reload
```

La especificación generada está disponible en `/openapi.json`, Swagger UI en
`/docs` y ReDoc en `/redoc`.

## Endpoints

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/health` | Estado del servicio |
| `GET` | `/api/v1/model` | Versión, operadores, universos, etiquetas y fuente |
| `POST` | `/api/v1/inferences` | Inferencia manual explicable |
| `GET` | `/api/v1/inferences/history/{fecha}` | Inferencia histórica explicable |
| `GET` | `/api/v1/history/range` | Rango, frecuencia y cantidad de registros |
| `GET` | `/api/v1/history/{fecha}` | Registro meteorológico preparado |

Las fechas usan el formato ISO `AAAA-MM-DD`.

## Inferencia manual

Solicitud:

```http
POST /api/v1/inferences
Content-Type: application/json
```

```json
{
  "hr_min_pct": 30,
  "dias_secos": 8,
  "viento_max_ms": 4.5,
  "humedad_suelo_superficial_m3m3": 0.354
}
```

La respuesta contiene:

- identificación y versión del modelo;
- cuatro entradas realmente evaluadas;
- índice, categoría y recomendación;
- grados de pertenencia de entrada y salida;
- reglas activas, antecedentes, consecuente y fuerza;
- 2 001 puntos de la curva agregada para graficar el centroide;
- procedencia manual o histórica.

El campo `dias_secos` acepta enteros entre 0 y 15. Los demás dominios pueden
consultarse dinámicamente en `GET /api/v1/model`.

## Inferencia histórica

```http
GET /api/v1/inferences/history/2000-06-01
```

Además del resultado Mamdani, `fuente` incluye la fecha, el archivo preparado,
el registro meteorológico completo y si la fecha pertenece a junio–septiembre.
Para fechas de octubre a mayo, la nota de interpretación indica que el uso es
exploratorio.

## Errores

Todos los errores controlados usan este envoltorio:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La solicitud contiene datos invalidos.",
    "details": [
      {
        "field": "viento_max_ms",
        "message": "Input should be less than or equal to 6",
        "type": "less_than_equal"
      }
    ]
  }
}
```

| Estado | Código | Situación |
|---:|---|---|
| `422` | `VALIDATION_ERROR` | Cuerpo incompleto, campo extra, dominio o fecha inválida |
| `422` | `INPUT_OUT_OF_DOMAIN` | Rechazo adicional del dominio difuso |
| `404` | `HISTORICAL_DATE_NOT_FOUND` | Fecha válida sin registro disponible |

## CORS

Se permiten durante el desarrollo los orígenes `http://localhost:5173` y
`http://127.0.0.1:5173`, destinados al frontend local.
