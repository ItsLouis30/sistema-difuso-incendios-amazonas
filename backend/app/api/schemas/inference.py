from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import Field

from .common import ApiModel
from .history import HistoricalRecordResponse


class InferenceRequest(ApiModel):
    hr_min_pct: float = Field(ge=0.0, le=100.0)
    dias_secos: int = Field(ge=0, le=15)
    viento_max_ms: float = Field(ge=0.0, le=6.0)
    humedad_suelo_superficial_m3m3: float = Field(ge=0.0, le=1.0)


class InferenceInputs(ApiModel):
    hr_min_pct: float
    dias_secos: float
    viento_max_ms: float
    humedad_suelo_superficial_m3m3: float


class InferenceSummary(ApiModel):
    indice: float
    categoria: str
    codigo_categoria: str
    recomendacion: str


class ActiveRuleResponse(ApiModel):
    numero: int
    antecedentes: dict[str, str]
    consecuente: str
    activacion: float


class CurvePoint(ApiModel):
    x: float
    pertenencia: float


class ManualSource(ApiModel):
    tipo: Literal["manual"] = "manual"


class HistoricalSource(ApiModel):
    tipo: Literal["historical"] = "historical"
    fecha: date
    dataset: str
    dentro_periodo_calibracion: bool
    nota_interpretacion: str
    registro: HistoricalRecordResponse


class InferenceResponse(ApiModel):
    model_id: str
    model_version: str
    modo: Literal["manual", "historical"]
    entradas: InferenceInputs
    resultado: InferenceSummary
    pertenencias_entrada: dict[str, dict[str, float]]
    pertenencias_salida: dict[str, float]
    reglas_activas: list[ActiveRuleResponse]
    curva_salida: list[CurvePoint]
    fuente: ManualSource | HistoricalSource
