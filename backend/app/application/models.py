from __future__ import annotations

from dataclasses import dataclass

from app.domain.model import InferenceResult, PreparedWeatherRecord


@dataclass(frozen=True, slots=True)
class HistoricalInferenceResult:
    weather: PreparedWeatherRecord
    inference: InferenceResult
    within_calibration_season: bool
    interpretation_note: str

