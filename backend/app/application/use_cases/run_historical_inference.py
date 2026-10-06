from __future__ import annotations

from datetime import date

from app.application.errors import HistoricalDateNotFoundError
from app.application.models import HistoricalInferenceResult
from app.application.ports import WeatherHistoryRepository
from app.domain.fuzzy import MamdaniSystem


class RunHistoricalInference:
    """Obtiene las entradas de una fecha y ejecuta el mismo motor Mamdani."""

    CALIBRATION_MONTHS = frozenset((6, 7, 8, 9))

    def __init__(
        self,
        fuzzy_system: MamdaniSystem,
        weather_repository: WeatherHistoryRepository,
    ) -> None:
        self._fuzzy_system = fuzzy_system
        self._weather_repository = weather_repository

    def execute(self, record_date: date) -> HistoricalInferenceResult:
        weather = self._weather_repository.get_by_date(record_date)
        if weather is None:
            raise HistoricalDateNotFoundError(
                requested_date=record_date,
                available_range=self._weather_repository.available_range(),
            )
        inference = self._fuzzy_system.evaluate(
            {
                "hr_min_pct": weather.hr_min_pct,
                "dias_secos": weather.dry_days,
                "viento_max_ms": weather.wind_max_ms,
                "humedad_suelo_superficial_m3m3": weather.soil_moisture_m3m3,
            }
        )
        within_season = record_date.month in self.CALIBRATION_MONTHS
        note = (
            "Fecha dentro del periodo estacional usado para calibrar las funciones."
            if within_season
            else "Fecha fuera de junio-septiembre; la interpretacion es exploratoria."
        )
        return HistoricalInferenceResult(
            weather=weather,
            inference=inference,
            within_calibration_season=within_season,
            interpretation_note=note,
        )
