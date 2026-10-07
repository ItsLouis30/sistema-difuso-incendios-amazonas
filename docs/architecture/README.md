# Arquitectura del sistema

Esta carpeta documenta la arquitectura técnica implementada. El **núcleo Mamdani** permanece separado de la API, el acceso a datos y la interfaz.

## Flujo funcional

```text
Entradas crisp
  → Borrosificador
  → Base de reglas + Motor de inferencia
      → evaluación del antecedente por mínimo
      → implicación Mamdani por mínimo
      → agregación por máximo
  → Desborrosificador por centroide
  → Índice crisp + categoría + explicación
```

## Correspondencia con carpetas

| Bloque funcional | Carpeta | Responsabilidad |
|---|---|---|
| Funciones de membresía | `backend/app/domain/fuzzy/membership_functions/` | Triángulos, trapecios, universos y evaluación de `mu(x)` |
| Borrosificador | `backend/app/domain/fuzzy/fuzzifier/` | Convertir cada entrada crisp en grados de pertenencia |
| Base de reglas | `backend/app/domain/fuzzy/rule_base/` | Cargar y validar los 192 antecedentes y consecuentes lingüísticos |
| Motor de inferencia | `backend/app/domain/fuzzy/inference_engine/` | Evaluar antecedentes, implicar y agregar conjuntos de salida |
| Desborrosificador | `backend/app/domain/fuzzy/defuzzifier/` | Calcular el centroide del conjunto agregado |
| Explicabilidad | `backend/app/domain/fuzzy/explanation/` | Exponer membresías, fuerzas y reglas activadas |
| Casos de uso | `backend/app/application/use_cases/` | Coordinar inferencias manuales e históricas |
| Puerto histórico | `backend/app/application/ports/` | Definir el acceso a datos sin depender de CSV |
| Repositorio CSV | `backend/app/infrastructure/data/repositories/` | Validar e indexar el dataset diario definitivo |
| Composición | `backend/app/infrastructure/configuration/application_factory.py` | Construir y compartir el modelo y sus dependencias |

## Regla de dependencias

```text
API → casos de uso → dominio difuso
infraestructura → puertos definidos por aplicación/dominio
frontend → API HTTP
```

El dominio difuso no debe importar FastAPI, pandas, componentes de interfaz ni detalles de archivos. La API valida y transporta datos; los casos de uso coordinan; la infraestructura carga configuración y series; el dominio ejecuta Mamdani.

## Flujos de aplicación implementados

```text
Manual
HTTP POST → RunManualInference → MamdaniSystem → InferenceResult

Histórico
HTTP GET → RunHistoricalInference → WeatherHistoryRepository
                                    → MamdaniSystem
                                    → HistoricalInferenceResult
```

Ambos flujos comparten la misma instancia de `MamdaniSystem`. De este modo, la API
no reproduce nombres de variables, reglas ni operadores. El repositorio implementa
el puerto de la aplicación y puede cambiarse en el futuro sin afectar el dominio.

La consulta histórica conserva el registro meteorológico junto al resultado para
mostrar procedencia y valores usados. Las fechas de octubre a mayo se aceptan,
pero quedan marcadas como interpretación exploratoria porque las funciones se
calibraron con datos de junio a septiembre.

## Frontend

```text
React Router → páginas → cliente HTTP → FastAPI
                         ↓
             dashboard y explicabilidad
             gráficas Recharts
```

Las páginas manual e histórica reutilizan `InferenceDashboard`. El frontend
recibe funciones, reglas, categorías y resultados desde la API; no contiene una
segunda implementación del motor. Vitest cubre componentes y utilidades, mientras
Playwright comprueba el recorrido completo con servicios reales.

## Mamdani, no Sugeno

Los consecuentes son conjuntos difusos lingüísticos: Muy bajo, Bajo, Moderado, Alto y Muy alto. Cada consecuente se recorta según la fuerza de su regla, se agrega con máximo y luego se desborrosifica mediante centroide. No se implementan consecuentes constantes o lineales ni media ponderada de tipo Sugeno.

## Configuración versionada

`config/fuzzy_model/v1/` almacena:

```text
model.json                 # versión, universos y operadores
membership_functions.json # etiquetas y nodos
rule_base.json             # matriz FAM 3×4×4×4
output_actions.json        # categoría y texto orientativo
```

Una modificación de nodos, operadores o reglas requiere una nueva versión y la repetición de las pruebas matemáticas y corridas.
