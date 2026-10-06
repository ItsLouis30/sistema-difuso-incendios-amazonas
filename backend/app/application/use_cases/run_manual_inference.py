from __future__ import annotations

from app.domain.fuzzy import MamdaniSystem
from app.domain.model import InferenceResult


class RunManualInference:
    """Ejecuta el motor con cuatro valores proporcionados por el usuario."""

    def __init__(self, fuzzy_system: MamdaniSystem) -> None:
        self._fuzzy_system = fuzzy_system

    def execute(
        self,
        *,
        hr_min_pct: float,
        dry_days: float,
        wind_max_ms: float,
        soil_moisture_m3m3: float,
    ) -> InferenceResult:
        return self._fuzzy_system.evaluate(
            {
                "hr_min_pct": hr_min_pct,
                "dias_secos": dry_days,
                "viento_max_ms": wind_max_ms,
                "humedad_suelo_superficial_m3m3": soil_moisture_m3m3,
            }
        )

