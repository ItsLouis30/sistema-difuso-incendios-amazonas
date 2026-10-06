from __future__ import annotations

from pathlib import Path
from typing import Literal

from app.api.schemas.history import HistoricalRecordResponse
from app.api.schemas.inference import (
    ActiveRuleResponse,
    CurvePoint,
    HistoricalSource,
    InferenceInputs,
    InferenceResponse,
    InferenceSummary,
    ManualSource,
)
from app.domain.model import InferenceResult, LinguisticVariable, PreparedWeatherRecord


def serialize_weather(record: PreparedWeatherRecord) -> HistoricalRecordResponse:
    return HistoricalRecordResponse(
        fecha=record.date,
        pp_mm=record.pp_mm,
        hr_min_pct=record.hr_min_pct,
        viento_medio_ms=record.wind_mean_ms,
        viento_max_ms=record.wind_max_ms,
        dias_secos=record.dry_days,
        humedad_suelo_superficial_m3m3=record.soil_moisture_m3m3,
    )


def serialize_variable(variable: LinguisticVariable) -> dict[str, object]:
    return {
        "nombre": variable.name,
        "nombre_visible": variable.display_name,
        "unidad": variable.unit,
        "universo": (variable.minimum, variable.maximum),
        "etiquetas": [
            {"nombre": term.name, "puntos": term.points} for term in variable.terms
        ],
    }


def serialize_inference(
    result: InferenceResult,
    *,
    mode: Literal["manual", "historical"],
    source: ManualSource | HistoricalSource,
) -> InferenceResponse:
    inputs = result.crisp_inputs
    return InferenceResponse(
        model_id=result.model_id,
        model_version=result.model_version,
        modo=mode,
        entradas=InferenceInputs(
            hr_min_pct=inputs["hr_min_pct"],
            dias_secos=inputs["dias_secos"],
            viento_max_ms=inputs["viento_max_ms"],
            humedad_suelo_superficial_m3m3=inputs[
                "humedad_suelo_superficial_m3m3"
            ],
        ),
        resultado=InferenceSummary(
            indice=result.output_index,
            categoria=result.output_label,
            codigo_categoria=result.output_category,
            recomendacion=result.recommendation,
        ),
        pertenencias_entrada={
            variable: dict(memberships)
            for variable, memberships in result.input_memberships.items()
        },
        pertenencias_salida=dict(result.output_memberships),
        reglas_activas=[
            ActiveRuleResponse(
                numero=rule.number,
                antecedentes=dict(rule.antecedents),
                consecuente=rule.consequent,
                activacion=rule.activation,
            )
            for rule in result.active_rules
        ],
        curva_salida=[
            CurvePoint(x=x, pertenencia=membership)
            for x, membership in result.output_curve
        ],
        fuente=source,
    )


def historical_source(
    record: PreparedWeatherRecord,
    dataset_path: Path,
    within_calibration_season: bool,
    interpretation_note: str,
) -> HistoricalSource:
    return HistoricalSource(
        fecha=record.date,
        dataset=dataset_path.name,
        dentro_periodo_calibracion=within_calibration_season,
        nota_interpretacion=interpretation_note,
        registro=serialize_weather(record),
    )
