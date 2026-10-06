# Auditoría del modelo difuso Mamdani 1.1.0

## Resultado

**Estado: aprobado con observaciones.**

La auditoría confirma que las funciones de pertenencia cubren sus universos, las
192 reglas son únicas y coherentes, los consecuentes respetan la monotonía y los
casos extremos producen las categorías esperadas.

La auditoría se reproduce desde la raíz del repositorio:

```powershell
python scripts/quality/audit_fuzzy_model.py --force
```

Los resultados completos están en:

```text
docs/model/audit/audit_v1_1.json
docs/model/audit/rules_v1_1.csv
```

## Funciones de pertenencia

Se muestrearon 4,001 puntos de cada universo.

| Variable | Puntos sin cobertura | Suma de pertenencias | Etiquetas activadas por datos |
|---|---:|---:|---:|
| HR mínima | 0 | 1.0 | 4 de 4 |
| Días secos | 0 | 1.0 | 4 de 4 |
| Viento máximo | 0 | 1.0 | 4 de 4 |
| Humedad del suelo | 0 | 1.0 | 3 de 3 |
| Salida | 0 | ≈ 1.0 | No aplica |

Los núcleos de las etiquetas aparecen en orden creciente dentro de cada universo.
La dirección del peligro se aplica en las reglas:

```text
HR menor                  → salida mayor o igual
Días secos mayores        → salida mayor o igual
Viento mayor              → salida mayor o igual
Humedad del suelo menor   → salida mayor o igual
```

Todas las etiquetas de entrada se activan al menos una vez en los 9,497 registros
del dataset definitivo.

## Base de 192 reglas

La tabla completa está en `rules_v1_1.csv`. La distribución es:

| Consecuente | Reglas |
|---|---:|
| Muy bajo | 31 |
| Bajo | 40 |
| Moderado | 45 |
| Alto | 43 |
| Muy alto | 33 |

Se comprobaron todas las transiciones entre etiquetas vecinas:

| Variable modificada | Comparaciones | Inversiones |
|---|---:|---:|
| Humedad del suelo | 128 | 0 |
| Viento máximo | 144 | 0 |
| HR mínima | 144 | 0 |
| Días secos | 144 | 0 |
| **Total** | **560** | **0** |

## Casos semánticos críticos

| HR | Días | Viento | Suelo | Consecuente | Evaluación |
|---|---|---|---|---|---|
| Alta | Cortos | Bajo | Seco | Bajo | Correcto |
| Muy baja | Extremos | Alto | Húmedo | Alto | Correcto |
| Alta | Cortos | Muy bajo | Húmedo | Muy bajo | Correcto |
| Muy baja | Extremos | Alto | Seco | Muy alto | Correcto |

La humedad del suelo modifica el nivel sin dominar por sí sola a las otras tres
condiciones.

## Corridas extremas

| Escenario | HR | Días | Viento | Suelo | Índice | Categoría |
|---|---:|---:|---:|---:|---:|---|
| Mínimo peligro | 85 | 0 | 1.5 | 0.420 | 8.33 | Muy bajo |
| Intermedio | 60 | 3 | 3.0 | 0.354 | 62.56 | Alto |
| Máximo peligro | 30 | 8 | 4.5 | 0.200 | 91.67 | Muy alto |

## Sensibilidad de humedad del suelo

Se evaluaron 64 combinaciones de HR, días secos y viento. Cada combinación se
calculó con suelo seco, intermedio y húmedo, para un total de 192 inferencias.

```text
índice con suelo seco >= índice intermedio >= índice con suelo húmedo
```

El criterio se cumplió en las 64 combinaciones. En el punto HR=66 %, cuatro días
secos y viento=2.95 m/s se obtuvo:

| Suelo | Índice |
|---|---:|
| Seco | 91.67 |
| Intermedio | 75.00 |
| Húmedo | 50.00 |

## Observación sobre la superficie crisp

Se realizó también un barrido fino de humedad del suelo con incrementos de 0.001
m³/m³. En escenarios que saturan el consecuente `Muy bajo` o `Muy alto` aparecen
pequeñas oscilaciones locales del centroide:

| Escenario | Pasos con oscilación | Máxima oscilación de un paso | Ascensos de categoría |
|---|---:|---:|---:|
| Benigno | 15 | 0.144 puntos | 0 |
| Intermedio | 0 | 0.000 puntos | 0 |
| Extremo | 20 | 0.110 puntos | 0 |

Estas oscilaciones aparecen cuando reglas vecinas comparten un consecuente extremo
y la agregación máxima modifica la altura de una función de hombro. No generan una
regla contradictoria ni un cambio ascendente de categoría al aumentar la humedad.
Se conservan como una limitación matemática documentada del Mamdani mínimo–máximo
con centroide.

## Conclusión

La base de 192 reglas no contiene los resultados absurdos planteados. Las reglas,
las particiones y las pruebas de sensibilidad satisfacen los criterios definidos.
No se requiere modificar las entradas, la FAM ni los operadores antes de construir
los casos de uso del backend.
