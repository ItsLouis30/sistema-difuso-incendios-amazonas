# Sistema de inferencia difusa Mamdani para la preparación preventiva ante incendios forestales

Sistema web completo para calcular y explicar el **nivel de preparación preventiva ante condiciones meteorológicas favorables a incendios forestales en el entorno de Chachapoyas, Amazonas, Perú**.

El sistema combina cuatro variables diarias mediante inferencia difusa Mamdani:

- humedad relativa mínima;
- días consecutivos con precipitación menor a 1 mm;
- velocidad máxima diaria del viento a 10 m.
- humedad volumétrica media del suelo superficial entre 0 y 7 cm.

El resultado es un índice continuo de `0–100`, una categoría lingüística y una explicación de las reglas activadas. El índice representa una **prioridad relativa de preparación**. No es una probabilidad de incendio, un pronóstico de ignición ni una orden institucional de movilización.

> Proyecto del curso Sistemas Inteligentes, alineado con el **ODS 13: Acción por el clima**, especialmente las metas 13.1 y 13.3.

## Estado del proyecto

La planificación funcional y matemática de la versión 1 está cerrada. El núcleo
Mamdani, la serie histórica, la API y la interfaz web manual e histórica están
implementados. El trabajo pendiente se concentra en ampliar las pruebas integrales
y preparar las corridas y evidencias finales de presentación.

- [x] Configuración versionada del modelo difuso
- [x] Motor Mamdani y explicación de reglas
- [x] Pruebas unitarias del núcleo y corridas de referencia
- [x] Procesamiento y validación de la serie histórica
  - [x] Descarga reproducible y validación del archivo atmosférico ERA5
  - [x] Descarga y calibración de humedad superficial ERA5-Land
  - [x] Cálculo reproducible de `dias_secos`
  - [x] Unión diaria y generación del dataset procesado
- [x] Auditoría matemática y semántica de funciones y 192 reglas
- [x] Repositorio histórico y casos de uso manual e histórico
- [x] API REST del backend
- [x] Interfaz web manual e histórica
- [ ] Gráficos de pertenencia, inferencia y sensibilidad
- [ ] Pruebas de integración y corridas demostrativas de extremo a extremo
- [x] Documentación de ejecución

La meta del repositorio es una **implementación completa**, separada en backend y frontend, con un núcleo matemático verificable y una interfaz utilizable.

## Alcance funcional

El sistema tendrá dos modos de uso:

### Evaluación manual

El usuario introduce:

| Entrada | Unidad | Dominio v1 | Significado |
|---|---:|---:|---|
| HR mínima diaria | `%` | `0–100` | Menor HR implica mayor sequedad del aire |
| Días secos consecutivos | días | `0–15` | Racha de días con precipitación válida `< 1 mm` |
| Viento máximo diario | `m/s` | `0–6` | Máxima rapidez diaria a 10 m; no es ráfaga |
| Humedad del suelo superficial | `m³/m³` | `0–1` | Reserva hídrica modelada en la capa de 0–7 cm |

La aplicación devuelve el índice, categoría, recomendación académica, grados de pertenencia y reglas activadas.

### Consulta histórica

El usuario selecciona una fecha entre `2000-01-01` y `2025-12-31`. El backend recupera las entradas de la serie preparada y ejecuta el mismo motor. La interfaz muestra también la precipitación diaria utilizada para calcular la racha seca y la procedencia de los datos.

Las fechas fuera de junio–septiembre deben indicar que están fuera del periodo estacional empleado para calibrar las funciones y que su interpretación es exploratoria.

## Fuente de datos

Las variables atmosféricas provienen de **ERA5** y la humedad superficial del
suelo de **ERA5-Land**, consultadas mediante la API histórica de Open-Meteo para
las coordenadas de la estación Chachapoyas:

```text
Punto solicitado: -6.2083, -77.8671
Celda ERA5 devuelta: -6.25, -77.75
Celda ERA5-Land devuelta: -6.20, -77.90
Elevación ERA5-Land: 2441 m
Zona horaria: America/Lima
Periodo: 2000-01-01 a 2025-12-31
Registros diarios: 9497
Faltantes de humedad del suelo: 0
```

Variables del archivo preparado:

```text
fecha,pp_mm,hr_min_pct,viento_medio_ms,viento_max_ms,dias_secos,humedad_suelo_superficial_m3m3
```

Las entradas del viento y del suelo son `viento_max_ms` y
`humedad_suelo_superficial_m3m3`; `viento_medio_ms` se conserva únicamente para
análisis. Los datos son **estimaciones de reanálisis de celdas próximas a
Chachapoyas**, no mediciones de la estación SENAMHI `000375` ni una representación
de toda la región Amazonas.

La estación `000375` se mantiene como referencia geográfica, pero no apareció en el módulo histórico de descarga consultado. No se deben sustituir sus datos con los de Magunchal.

### Periodos de trabajo

| Uso | Periodo |
|---|---|
| Serie completa | 2000–2025 |
| Calibración de las funciones | Junio–septiembre de 2000–2019 |
| Evaluación temporal reservada | Junio–septiembre de 2020–2025 |

## Definición de días secos

Sea `P_d` la precipitación diaria válida:

```text
si P_d >= 1 mm:
    dias_secos = 0

si 0 <= P_d < 1 mm y el contador anterior es conocido:
    dias_secos = contador_anterior + 1

si P_d falta o es sospechosa:
    dias_secos = desconocido
```

Una precipitación de `0.2 mm` cuenta como día seco. Un dato faltante nunca se interpreta como cero. Después de un hueco, la racha permanece desconocida hasta encontrar un día húmedo válido o aplicar una reconstrucción expresamente documentada.

## Modelo difuso

El sistema es un Mamdani MISO de **cuatro entradas y una salida**:

```text
4 etiquetas de HR × 4 etiquetas de días × 4 etiquetas de viento × 3 de suelo
                                  =
                             192 reglas
```

### Funciones de pertenencia de entrada

Las funciones se expresan como trapezoides `(a,b,c,d)`. Cuando `b=c`, representan un triángulo. Los extremos usan funciones de hombro.

| Variable | Etiqueta | Parámetros `(a,b,c,d)` |
|---|---|---|
| HR mínima (%) | Muy baja | `(0,0,46,53)` |
| HR mínima (%) | Baja | `(46,53,53,66)` |
| HR mínima (%) | Media | `(53,66,66,78)` |
| HR mínima (%) | Alta | `(66,78,100,100)` |
| Días secos | Cortos | `(0,0,1,2)` |
| Días secos | Moderados | `(1,2,2,4)` |
| Días secos | Prolongados | `(2,4,4,7)` |
| Días secos | Extremos | `(4,7,15,15)` |
| Viento máximo (m/s) | Muy bajo | `(0,0,1.95,2.45)` |
| Viento máximo (m/s) | Bajo | `(1.95,2.45,2.45,2.95)` |
| Viento máximo (m/s) | Medio | `(2.45,2.95,2.95,3.75)` |
| Viento máximo (m/s) | Alto | `(2.95,3.75,6,6)` |
| Humedad del suelo (m³/m³) | Seca | `(0,0,0.313,0.354)` |
| Humedad del suelo (m³/m³) | Intermedia | `(0.313,0.354,0.354,0.385)` |
| Humedad del suelo (m³/m³) | Húmeda | `(0.354,0.385,1,1)` |

Las etiquetas de viento son relativas a la distribución local modelada. Por ejemplo, “Alto” no equivale a vendaval ni a una categoría universal de la escala Beaufort.

Los nodos de humedad del suelo corresponden a P25, P50 y P75 de los 2,440 días
de junio–septiembre de 2000–2019. La serie ERA5-Land contiene 9,497 registros
entre 2000 y 2025, sin faltantes. Esta variable representa humedad modelada del
suelo y no una medición directa de humedad del combustible vegetal.

### Variable de salida

El **nivel de preparación preventiva** usa el universo `[0,100]`:

| Etiqueta | Parámetros `(a,b,c,d)` | Interpretación |
|---|---|---|
| Muy bajo | `(0,0,0,25)` | Vigilancia básica |
| Bajo | `(0,25,25,50)` | Vigilancia reforzada |
| Moderado | `(25,50,50,75)` | Preparación preventiva |
| Alto | `(50,75,75,100)` | Coordinación y posible preposicionamiento |
| Muy alto | `(75,100,100,100)` | Máxima preparación preventiva propuesta |

La categoría mostrada para la salida crisp se determina por máxima pertenencia:

```text
[0,12.5)     → Muy bajo
[12.5,37.5)  → Bajo
[37.5,62.5)  → Moderado
[62.5,87.5)  → Alto
[87.5,100]   → Muy alto
```

En un empate exacto se elige la categoría superior. Debido a la defuzzificación por centroide, los extremos típicos son aproximadamente `8.33` y `91.67`, aunque el universo sea `0–100`.

### Base de reglas

Cada celda representa el consecuente: `0=Muy bajo`, `1=Bajo`, `2=Moderado`, `3=Alto`, `4=Muy alto`.

- Filas: HR `[Muy baja, Baja, Media, Alta]`.
- Columnas: días `[Cortos, Moderados, Prolongados, Extremos]`.
- Matrices: viento `[Muy bajo, Bajo, Medio, Alto]`.

```text
Viento Muy bajo    Viento Bajo        Viento Medio       Viento Alto
1 2 2 3            2 3 3 3            2 3 4 4            3 4 4 4
0 1 2 2            1 2 2 3            2 3 3 4            2 3 4 4
0 0 1 2            0 1 2 2            1 2 3 3            1 2 3 4
0 0 1 2            0 0 1 2            0 1 2 3            0 1 2 3
```

La matriz mostrada corresponde a humedad del suelo intermedia. La cuarta
dimensión se obtiene de forma reproducible: suelo seco suma un nivel, suelo
intermedio conserva el nivel y suelo húmedo resta un nivel, siempre limitado a
`[0,4]`.

Representación en el backend:

```text
reglas[indice_suelo][indice_viento][indice_hr][indice_dias]
numero_regla = 64*indice_suelo + 16*indice_viento + 4*indice_hr + indice_dias + 1
```

Así se obtienen 192 reglas sin transcribirlas manualmente. La FAM es monótona:
el nivel no disminuye cuando baja la HR, aumentan los días secos o el viento, ni
cuando disminuye la humedad del suelo.

### Operadores Mamdani

```text
AND:               mínimo
Implicación:       mínimo
Agregación:        máximo
Defuzzificación:   centroide
```

Para una regla `k`:

```text
alpha_k = min(mu_hr, mu_dias, mu_viento, mu_suelo)
mu_regla_k(y) = min(alpha_k, mu_consecuente_k(y))
mu_agregada(y) = max(mu_regla_k(y))
indice = integral(y * mu_agregada(y)) / integral(mu_agregada(y))
```

El backend debe rechazar una inferencia cuando falta una entrada o cuando un valor está fuera del dominio configurado. No debe recortar valores silenciosamente.

## Arquitectura prevista

```text
┌──────────────────────── Frontend ────────────────────────┐
│ Formularios manual e histórico                          │
│ Resultado, categoría, explicación y visualizaciones     │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTP / JSON
┌───────────────────────────▼──────────────────────────────┐
│ Backend API                                              │
│ Validación → casos de uso → motor Mamdani → respuesta   │
├──────────────────────────────────────────────────────────┤
│ Configuración versionada │ Serie histórica │ Auditoría  │
└──────────────────────────────────────────────────────────┘
```

### Stack recomendado

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12, FastAPI, Pydantic, NumPy y pandas |
| Frontend | React, TypeScript y Vite |
| Gráficos | Recharts o una librería equivalente mantenida |
| Pruebas backend | pytest |
| Pruebas frontend | Vitest y Testing Library |
| Calidad | Ruff para Python; ESLint y Prettier para TypeScript |

El motor difuso debe implementarse como un módulo independiente de FastAPI. La interfaz consume el contrato HTTP y no replica reglas ni funciones de pertenencia.

### Estructura objetivo

```text
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/                  # Endpoints HTTP
│   │   │   └── schemas/                 # Solicitudes y respuestas
│   │   ├── application/
│   │   │   ├── use_cases/               # Inferencia manual e histórica
│   │   │   └── ports/                   # Contratos hacia infraestructura
│   │   ├── domain/
│   │   │   ├── fuzzy/
│   │   │   │   ├── membership_functions/ # Triángulos y trapecios
│   │   │   │   ├── fuzzifier/            # Bloque 1: borrosificación
│   │   │   │   ├── rule_base/            # Bloque 2: BRD Mamdani
│   │   │   │   ├── inference_engine/     # Bloque 3: inferencia
│   │   │   │   ├── defuzzifier/          # Bloque 4: centroide
│   │   │   │   └── explanation/          # Trazabilidad del resultado
│   │   │   └── model/                    # Entidades y tipos del dominio
│   │   └── infrastructure/
│   │       ├── configuration/            # Carga del modelo versionado
│   │       └── data/
│   │           ├── loaders/              # Lectura y control de calidad
│   │           └── repositories/         # Consulta de la serie histórica
│   └── tests/
│       ├── unit/                         # Pruebas por bloque Mamdani
│       ├── integration/api/              # API + casos de uso
│       └── fixtures/                     # Escenarios controlados
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/                          # Inicio, rutas y proveedores
│   │   ├── pages/                        # Vistas completas
│   │   ├── features/
│   │   │   ├── manual_inference/
│   │   │   ├── historical_inference/
│   │   │   ├── model_explanation/
│   │   │   └── sensitivity_analysis/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── charts/
│   │   ├── services/api/                 # Cliente del backend
│   │   ├── types/                        # Contratos TypeScript
│   │   ├── styles/
│   │   └── assets/
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── config/fuzzy_model/v1/                # Parámetros y FAM versionados
├── data/
│   ├── raw/                              # Respuestas originales inmutables
│   ├── processed/                        # CSV validado para el sistema
│   ├── metadata/                         # Fuente y diccionario de datos
│   └── samples/                          # Muestras ligeras
├── docs/
│   ├── architecture/                     # Diseño y dependencias
│   ├── planning/                         # Alcance y decisiones
│   ├── model/                            # Matemática, BRD y corridas
│   ├── data/                             # Preparación y calidad
│   ├── api/                              # Contrato HTTP
│   └── testing/                          # Plan y resultados
├── scripts/
│   ├── data/                             # Preparación reproducible
│   └── quality/                          # Verificaciones automatizadas
├── deployment/docker/                    # Empaquetado posterior
└── README.md
```

La estructura contiene el núcleo Mamdani implementado y probado. La
correspondencia detallada entre los cuatro bloques y sus dependencias está en
[`docs/architecture/README.md`](docs/architecture/README.md).

### Correspondencia con el material de la profesora

| Arquitectura difusa | Carpeta principal | Operación fijada |
|---|---|---|
| Borrosificador | `domain/fuzzy/fuzzifier/` | Evaluación de funciones de membresía; entradas crisp como singleton |
| Base de Reglas Difusas | `domain/fuzzy/rule_base/` | 192 reglas con consecuentes lingüísticos difusos |
| Motor de inferencia | `domain/fuzzy/inference_engine/` | Antecedente mínimo, implicación mínima y agregación máxima |
| Desborrosificador | `domain/fuzzy/defuzzifier/` | Centro de gravedad o centroide |

Esta separación confirma que el proyecto implementará un sistema **Mamdani**: los consecuentes son conjuntos difusos y existe una etapa explícita de agregación y defusificación. No se utilizarán consecuentes constantes o ecuaciones lineales de tipo Sugeno.

## Contrato inicial de la API

Prefijo sugerido: `/api/v1`.

| Método y ruta | Propósito |
|---|---|
| `GET /health` | Estado básico del backend |
| `GET /api/v1/model` | Dominios, etiquetas, funciones, versión y fuente |
| `POST /api/v1/inferences` | Inferencia con cuatro entradas manuales |
| `GET /api/v1/inferences/history/{date}` | Inferencia para una fecha del CSV |
| `GET /api/v1/history/range` | Rango temporal y cobertura disponible |
| `GET /api/v1/history/{date}` | Variables meteorológicas de una fecha |

Solicitud manual propuesta:

```json
{
  "hr_min_pct": 59,
  "dias_secos": 3,
  "viento_max_ms": 2.7,
  "humedad_suelo_superficial_m3m3": 0.354
}
```

Respuesta propuesta:

```json
{
  "model_version": "1.1.0",
  "mode": "manual",
  "inputs": {
    "hr_min_pct": 59.0,
    "dias_secos": 3,
    "viento_max_ms": 2.7,
    "humedad_suelo_superficial_m3m3": 0.354
  },
  "result": {
    "index": 56.4,
    "category": "Moderado",
    "recommendation": "Preparación preventiva"
  },
  "memberships": {},
  "active_rules": [],
  "source": {
    "type": "manual"
  }
}
```

Los valores del ejemplo describen la forma del contrato; el índice real debe calcularse con el motor implementado.

Cada error debe utilizar un formato estable:

```json
{
  "error": {
    "code": "INPUT_OUT_OF_DOMAIN",
    "message": "viento_max_ms debe estar entre 0 y 6 m/s",
    "field": "viento_max_ms"
  }
}
```

## Requisitos de la interfaz

La aplicación web debe incluir:

1. vista de presentación y alcance del sistema;
2. formulario de evaluación manual con unidades, dominios y ayuda contextual;
3. selector de fecha para consulta histórica;
4. resultado numérico y categoría con una escala visual accesible;
5. variables utilizadas y procedencia de datos;
6. reglas activadas, fuerza de disparo y explicación legible;
7. gráficas de funciones de pertenencia y conjunto agregado;
8. mensajes claros para datos ausentes, fechas inválidas y valores fuera de dominio;
9. aviso visible de que el índice no predice ignición ni reemplaza decisiones institucionales.

Los colores de las categorías no deben ser la única forma de comunicar el nivel. Cada resultado debe incluir texto y valor numérico.

## Estrategia de pruebas

### Backend

- funciones triangulares, trapezoidales y hombros;
- cobertura y partición de los universos;
- 192 antecedentes únicos y generación correcta desde la FAM;
- operadores mínimo, máximo y centroide;
- validación de límites y datos faltantes;
- cálculo de días secos para `P=0`, `0.2`, `0.999`, `1.0` y faltantes;
- lectura de fechas históricas y procedencia;
- contratos HTTP y códigos de error;
- barridos de sensibilidad de las cuatro entradas.

### Frontend

- validación y unidades de los formularios;
- estados de carga, error y éxito;
- renderizado del resultado y las reglas;
- consulta histórica por fecha;
- accesibilidad básica por teclado y etiquetas;
- correspondencia entre tipos del frontend y contrato del backend.

### Diez corridas obligatorias

| Caso | HR % | Días | Viento m/s | Suelo m³/m³ | Resultado esperado |
|---|---:|---:|---:|---:|---|
| Favorable | 85 | 0 | 1.5 | 0.354 | Muy bajo, centroide ≈ 8.33 |
| Aire húmedo con sequía | 85 | 8 | 1.5 | 0.354 | Moderado, centroide ≈ 50 |
| Solo viento alto | 85 | 0 | 4.5 | 0.354 | Muy bajo, centroide ≈ 8.33 |
| Aire muy seco con lluvia reciente | 30 | 0 | 1.5 | 0.354 | Bajo, centroide ≈ 25 |
| Aire seco, lluvia reciente y viento alto | 30 | 0 | 4.5 | 0.354 | Alto, centroide ≈ 75 |
| Aire seco, sequía y poco viento | 30 | 8 | 1.5 | 0.354 | Alto, centroide ≈ 75 |
| Condiciones desfavorables | 30 | 8 | 4.5 | 0.354 | Muy alto, centroide ≈ 91.67 |
| Combinación media | 66 | 4 | 2.95 | 0.354 | Alto, centroide ≈ 75 |
| Combinación baja-media | 53 | 2 | 2.45 | 0.354 | Moderado, centroide ≈ 50 |
| Transición | 59 | 3 | 2.70 | 0.354 | Activa varias reglas; resultado explicable |

Las corridas verifican que el software respete el diseño. No constituyen validación contra incendios observados.

## Criterios de aceptación

La primera versión se considera completa cuando:

- backend y frontend se ejecutan con instrucciones reproducibles;
- el modelo y la FAM se cargan desde una configuración única y versionada;
- el modo manual y el histórico producen resultados explicables;
- las 192 reglas tienen cobertura y no presentan inversiones discretas;
- las diez corridas y la suite automatizada pasan;
- los barridos de sensibilidad están disponibles y documentados;
- la procedencia ERA5/ERA5-Land y las limitaciones aparecen en la interfaz y documentación;
- no se afirma que el sistema prediga incendios o utilice observaciones de SENAMHI.

La revisión por expertos y el contraste con incendios reales quedan fuera del alcance del curso.

## Desarrollo local

La API requiere Python 3.12 o superior. Desde `backend`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
python -m uvicorn app.main:app --reload
```

Servicios disponibles:

```text
API:          http://127.0.0.1:8000
Swagger UI:   http://127.0.0.1:8000/docs
ReDoc:        http://127.0.0.1:8000/redoc
OpenAPI JSON: http://127.0.0.1:8000/openapi.json
```

Ejecutar todas las pruebas:

```powershell
python -m unittest discover -s tests -v
```

Las instrucciones del frontend se añadirán con su implementación.

## Principios para contribuir

- No duplicar parámetros o reglas entre frontend y backend.
- No modificar nodos, dominios o la FAM sin actualizar la versión del modelo y sus pruebas.
- Mantener datos originales, datos procesados y configuración separados.
- No reemplazar faltantes por cero.
- No redondear entradas antes de fuzzificarlas; redondear solo la presentación del resultado.
- Añadir pruebas cuando se corrija un error del motor o del contrato.
- Documentar toda transformación de unidades, fechas o fuente de datos.

## Limitaciones conocidas

- ERA5 y ERA5-Land representan celdas espaciales y pueden diferir del microclima local de Chachapoyas.
- Los días secos y la humedad del suelo aproximan el estado hídrico, pero no
  equivalen a humedad medida del combustible vegetal.
- El viento máximo diario puede no coincidir temporalmente con la HR mínima.
- La base de reglas es una heurística académica del grupo.
- El sistema no incluye vegetación, pendiente, actividad humana ni detección de focos.

## Licencia y autores

Proyecto académico del Grupo 8. La licencia y la lista completa de integrantes se definirán antes de publicar la primera versión estable.
