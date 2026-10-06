# Backend: núcleo Mamdani y API REST

El backend implementa el dominio matemático, el procesamiento de ERA5/ERA5-Land,
el acceso de solo lectura al dataset definitivo, los casos de uso manual e
histórico y la API HTTP que los expone.

## Flujo implementado

```text
Entradas crisp
    ↓
Borrosificación Singleton
    ↓
192 reglas (AND mínimo)
    ↓
Implicación mínimo
    ↓
Agregación máximo
    ↓
Centroide
    ↓
Índice 0–100 + categoría + explicación
```

Las entradas requeridas son:

- `hr_min_pct`: humedad relativa mínima diaria, entre 0 y 100 %.
- `dias_secos`: días consecutivos con precipitación menor que 1 mm, entre 0 y 15.
- `viento_max_ms`: velocidad máxima diaria del viento a 10 m, entre 0 y 6 m/s.
- `humedad_suelo_superficial_m3m3`: humedad media del suelo de 0–7 cm,
  entre 0 y 1 m³/m³.

Los valores fuera de estos universos generan un error. El núcleo no recorta ni
reemplaza silenciosamente datos inválidos.

## Módulos

- `membership_functions`: función trapezoidal general y funciones hombro.
- `fuzzifier`: evaluación Singleton de las etiquetas configuradas para cada entrada.
- `rule_base`: generación y validación de la FAM completa de 192 reglas.
- `inference_engine`: activación, implicación y agregación Mamdani.
- `defuzzifier`: centroide numérico sobre el universo de salida.
- `explanation`: categoría, recomendación y grados de salida.
- `system.py`: fachada que ejecuta toda la cascada.
- `infrastructure/configuration`: construcción del modelo desde JSON versionado.
- `infrastructure/data/loaders`: lectura segura del CSV ERA5, metadatos y reporte
  de cobertura, faltantes, duplicados y rangos físicos.
- `domain/data_processing`: cálculo determinista de rachas secas con propagación
  explícita del estado desconocido.
- `domain/data_processing/reanalysis_joiner.py`: unión estricta por fecha de ERA5
  y ERA5-Land y validación contra los universos del modelo.
- `application/use_cases`: inferencia manual e inferencia por fecha histórica.
- `application/ports`: contrato de acceso a la serie histórica, independiente del CSV.
- `infrastructure/data/repositories`: índice diario de solo lectura con validación
  de esquema, continuidad, duplicados, faltantes y dominios.
- `infrastructure/configuration/application_factory.py`: composición de una sola
  instancia del motor, el repositorio y ambos casos de uso.
- `api/routes`: endpoints de salud, modelo, historial e inferencias.
- `api/schemas`: contratos Pydantic de solicitudes y respuestas.
- `api/error_handlers.py`: formato uniforme para errores de validación y fechas.

## Configuración versionada

Los parámetros están en `config/fuzzy_model/v1`:

- `model.json`: tipo de sistema, operadores y resolución.
- `membership_functions.json`: universos y nodos trapezoidales.
- `rule_base.json`: orden, monotonía y FAM 3 × 4 × 4 × 4.
- `output_actions.json`: nombres y recomendaciones de cada nivel.

Esto permite auditar y recalibrar el modelo sin duplicar valores dentro del código.

## Ejemplo de uso

Desde la carpeta `backend`:

```python
from pathlib import Path
from app.infrastructure.configuration import load_mamdani_system

system = load_mamdani_system(Path("../config/fuzzy_model/v1"))
result = system.evaluate(
    {
        "hr_min_pct": 30.0,
        "dias_secos": 8.0,
        "viento_max_ms": 4.5,
        "humedad_suelo_superficial_m3m3": 0.354,
    }
)

print(result.output_index)       # aproximadamente 91.67
print(result.output_label)       # Muy alto
print(result.strongest_rules[0]) # regla principal y fuerza de activación
```

`InferenceResult` también entrega las pertenencias de entrada, todas las reglas
activas, las pertenencias de salida y la curva agregada usada por el centroide.

## Casos de uso

`RunManualInference` recibe los cuatro valores del formulario. No consulta el
historial. `RunHistoricalInference` recibe una fecha, recupera el registro diario
preparado y ejecuta la misma instancia del motor Mamdani. También informa si la
fecha está dentro de junio–septiembre, periodo estacional de calibración.

El repositorio histórico carga una vez
`data/processed/weather_inputs_2000_2025.csv`, indexa sus 9 497 registros por
fecha y rechaza el arranque si el archivo incumple el contrato esperado.

## API REST

Instalar el backend con sus herramientas de desarrollo:

```powershell
python -m pip install -e ".[dev]"
```

Iniciar el servidor desde esta carpeta:

```powershell
python -m uvicorn app.main:app --reload
```

La documentación interactiva queda en `http://127.0.0.1:8000/docs`. El contrato
detallado y los ejemplos se encuentran en `docs/api/README.md`.

## Pruebas

No se requiere instalar dependencias para ejecutar la suite actual:

```powershell
python -m unittest discover -s tests -v
```

Las 57 pruebas cubren funciones de pertenencia, universos, 192 reglas, centroide,
corridas de referencia, explicabilidad, una malla de 648 escenarios, procesamiento
meteorológico, auditoría del modelo, repositorio histórico, casos de uso y contratos
HTTP de la API.
