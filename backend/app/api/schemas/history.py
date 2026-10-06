from datetime import date

from .common import ApiModel


class HistoricalRecordResponse(ApiModel):
    fecha: date
    pp_mm: float
    hr_min_pct: float
    viento_medio_ms: float
    viento_max_ms: float
    dias_secos: int
    humedad_suelo_superficial_m3m3: float


class HistoryRangeResponse(ApiModel):
    fecha_inicial: date
    fecha_final: date
    total_registros: int
    frecuencia: str
    zona_horaria: str
