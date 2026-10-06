# Backend: núcleo Mamdani

Esta primera etapa implementa el dominio matemático del sistema difuso. Todavía no
incluye HTTP, persistencia ni el procesamiento completo de ERA5/ERA5-Land; esos adaptadores se conectarán
después sin modificar las reglas del modelo.

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
- `fuzzifier`: evaluación Singleton de las cuatro etiquetas de cada entrada.
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

## Pruebas

No se requiere instalar dependencias para ejecutar la suite actual:

```powershell
python -m unittest discover -s tests -v
```

Las pruebas cubren los nodos y hombros de las funciones, cobertura de los universos,
validación de entradas, las 192 combinaciones, centroide, nueve corridas de
referencia, explicabilidad y una malla de 648 escenarios.
