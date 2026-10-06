# Arquitectura del sistema

Esta carpeta documenta la arquitectura técnica y sus decisiones. La implementación debe mantener separado el **núcleo Mamdani** de la API, el acceso a datos y la interfaz.

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
| Base de reglas | `backend/app/domain/fuzzy/rule_base/` | Cargar y validar los 64 antecedentes y consecuentes lingüísticos |
| Motor de inferencia | `backend/app/domain/fuzzy/inference_engine/` | Evaluar antecedentes, implicar y agregar conjuntos de salida |
| Desborrosificador | `backend/app/domain/fuzzy/defuzzifier/` | Calcular el centroide del conjunto agregado |
| Explicabilidad | `backend/app/domain/fuzzy/explanation/` | Exponer membresías, fuerzas y reglas activadas |

## Regla de dependencias

```text
API → casos de uso → dominio difuso
infraestructura → puertos definidos por aplicación/dominio
frontend → API HTTP
```

El dominio difuso no debe importar FastAPI, pandas, componentes de interfaz ni detalles de archivos. La API valida y transporta datos; los casos de uso coordinan; la infraestructura carga configuración y series; el dominio ejecuta Mamdani.

## Mamdani, no Sugeno

Los consecuentes son conjuntos difusos lingüísticos: Muy bajo, Bajo, Moderado, Alto y Muy alto. Cada consecuente se recorta según la fuerza de su regla, se agrega con máximo y luego se desborrosifica mediante centroide. No se implementarán consecuentes constantes o lineales ni media ponderada de tipo Sugeno.

## Configuración versionada

`config/fuzzy_model/v1/` almacenará, cuando se implemente:

```text
model.json                 # versión, universos y operadores
membership_functions.json # etiquetas y nodos
rule_base.json             # matriz FAM 4×4×4
output_actions.json        # categoría y texto orientativo
```

Una modificación de nodos, operadores o reglas requiere una nueva versión y la repetición de las pruebas matemáticas y corridas.
