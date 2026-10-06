# Datos meteorológicos

## Paso 1: adquisición y validación atmosférica

La primera etapa del pipeline está implementada. El archivo principal es:

```text
data/raw/era5_atmospheric_chachapoyas_2000_2025.csv
```

Contiene datos diarios ERA5 obtenidos mediante Open-Meteo para `2000-01-01` a
`2025-12-31`:

| Campo interno | Campo de origen | Unidad |
|---|---|---:|
| `pp_mm` | `precipitation_sum` | mm |
| `hr_min_pct` | `relative_humidity_2m_min` | % |
| `wind_mean_ms` | `wind_speed_10m_mean` | m/s |
| `wind_max_ms` | `wind_speed_10m_max` | m/s |

La descarga se puede repetir desde la raíz del repositorio:

```powershell
python scripts/data/download_era5_atmospheric.py
```

El script no reemplaza un archivo existente salvo que se use `--force`.

## Controles implementados

`OpenMeteoAtmosphericCsvLoader` realiza los siguientes controles:

- presencia de metadatos geográficos;
- presencia inequívoca de las cuatro variables;
- fechas ISO válidas;
- detección de fechas duplicadas y días ausentes;
- conservación de celdas vacías como `None`;
- precipitación y viento no negativos;
- humedad relativa dentro de `[0,100]`;
- viento máximo mayor o igual que viento medio;
- conteo de faltantes y rangos de cada variable.

El archivo descargado tiene 9,497 días consecutivos, 9,497 fechas únicas y cero
valores faltantes. Su procedencia, consulta, rangos y SHA-256 se registran en:

```text
data/metadata/era5_atmospheric_v1.json
```

## Datos originales

Los archivos de `data/raw` son inmutables. La limpieza, el cálculo de rachas y
la unión de fuentes deben escribir nuevos archivos dentro de `data/processed`.
Un vacío nunca debe convertirse en precipitación cero.

## Paso 2: cálculo de días secos

El contador está implementado en `backend/app/domain/data_processing/dry_days.py`.
La definición aplicada es:

```text
si pp_mm >= 1.0:
    dias_secos = 0

si 0 <= pp_mm < 1.0 y la racha anterior es conocida:
    dias_secos = racha_anterior + 1

si pp_mm falta, existe un salto de fecha o no se conoce el antecedente:
    dias_secos = desconocido
```

Una racha desconocida vuelve a ser calculable después de observar un día húmedo
válido. Un primer registro seco permanece desconocido porque el archivo no informa
lo ocurrido antes de su fecha inicial.

La generación reproducible se ejecuta desde la raíz:

```powershell
python scripts/data/build_dry_days.py
```

Produce:

```text
data/processed/era5_atmospheric_with_dry_days.csv
data/metadata/dry_days_v1.json
```

En la serie completa se obtuvieron 9,497 valores conocidos, cero desconocidos y
una racha máxima de 14 días. Por tanto, el universo difuso `0–15` cubre la serie
histórica sin truncamiento.

## Próximo paso

Leer y validar la serie ERA5-Land, unirla por fecha con este archivo intermedio y
generar el dataset definitivo de cuatro entradas.
