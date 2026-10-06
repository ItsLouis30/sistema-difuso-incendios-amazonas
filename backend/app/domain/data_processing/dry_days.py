from __future__ import annotations

from collections.abc import Iterable
from datetime import timedelta

from app.domain.model import (
    AtmosphericRecord,
    DataValidationError,
    DryDayObservation,
)


class DryDayCounter:
    """Calcula rachas secas sin convertir ausencias de datos en dias secos."""

    def __init__(self, precipitation_threshold_mm: float = 1.0) -> None:
        if precipitation_threshold_mm <= 0.0:
            raise ValueError("El umbral de precipitacion debe ser positivo.")
        self.threshold_mm = precipitation_threshold_mm

    def calculate(
        self, records: Iterable[AtmosphericRecord]
    ) -> tuple[DryDayObservation, ...]:
        observations: list[DryDayObservation] = []
        previous_date = None
        current_streak: int | None = None

        for record in records:
            if previous_date is not None:
                if record.date <= previous_date:
                    raise DataValidationError(
                        "Las observaciones deben estar ordenadas y no repetirse."
                    )
                if record.date != previous_date + timedelta(days=1):
                    current_streak = None

            precipitation = record.pp_mm
            if precipitation is None:
                current_streak = None
            elif precipitation < 0.0:
                raise DataValidationError(
                    f"Precipitacion negativa en {record.date.isoformat()}."
                )
            elif precipitation >= self.threshold_mm:
                current_streak = 0
            elif current_streak is not None:
                current_streak += 1

            observations.append(
                DryDayObservation(
                    date=record.date,
                    precipitation_mm=precipitation,
                    dry_days=current_streak,
                )
            )
            previous_date = record.date

        return tuple(observations)
