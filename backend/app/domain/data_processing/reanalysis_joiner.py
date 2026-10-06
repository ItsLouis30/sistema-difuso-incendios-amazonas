from __future__ import annotations

from collections.abc import Iterable
from datetime import date

from app.domain.model import (
    AtmosphericRecord,
    DataValidationError,
    DryDayObservation,
    PreparedWeatherRecord,
    SoilMoistureRecord,
)


class ReanalysisJoiner:
    """Une las fuentes por fecha y exige entradas completas para el motor."""

    def __init__(self, maximum_dry_days: int = 15, maximum_wind_ms: float = 6.0) -> None:
        self.maximum_dry_days = maximum_dry_days
        self.maximum_wind_ms = maximum_wind_ms

    def join(
        self,
        atmospheric_records: Iterable[AtmosphericRecord],
        dry_day_observations: Iterable[DryDayObservation],
        soil_records: Iterable[SoilMoistureRecord],
    ) -> tuple[PreparedWeatherRecord, ...]:
        atmospheric = self._unique_by_date(atmospheric_records, "ERA5 atmosferico")
        dry_days = self._unique_by_date(dry_day_observations, "contador de dias secos")
        soil = self._unique_by_date(soil_records, "ERA5-Land")
        self._require_same_dates(atmospheric, dry_days, soil)

        prepared: list[PreparedWeatherRecord] = []
        for record_date in sorted(atmospheric):
            weather = atmospheric[record_date]
            dry = dry_days[record_date]
            soil_record = soil[record_date]
            self._validate_complete(record_date, weather, dry, soil_record)
            prepared.append(
                PreparedWeatherRecord(
                    date=record_date,
                    pp_mm=weather.pp_mm,
                    hr_min_pct=weather.hr_min_pct,
                    wind_mean_ms=weather.wind_mean_ms,
                    wind_max_ms=weather.wind_max_ms,
                    dry_days=dry.dry_days,
                    soil_moisture_m3m3=soil_record.soil_moisture_m3m3,
                )
            )
        return tuple(prepared)

    def _unique_by_date(self, records: Iterable, source_name: str) -> dict[date, object]:
        result: dict[date, object] = {}
        for record in records:
            if record.date in result:
                raise DataValidationError(
                    f"{source_name} contiene la fecha duplicada {record.date}."
                )
            result[record.date] = record
        if not result:
            raise DataValidationError(f"{source_name} no contiene registros.")
        return result

    def _require_same_dates(
        self,
        atmospheric: dict[date, object],
        dry_days: dict[date, object],
        soil: dict[date, object],
    ) -> None:
        expected = set(atmospheric)
        problems = []
        for name, observed in (("dias_secos", set(dry_days)), ("ERA5-Land", set(soil))):
            missing = expected - observed
            extra = observed - expected
            if missing or extra:
                problems.append(f"{name}: faltan {len(missing)}, sobran {len(extra)}")
        if problems:
            raise DataValidationError(
                "Las fuentes no tienen las mismas fechas: " + "; ".join(problems) + "."
            )

    def _validate_complete(
        self,
        record_date: date,
        weather: AtmosphericRecord,
        dry: DryDayObservation,
        soil: SoilMoistureRecord,
    ) -> None:
        values = {
            "pp_mm": weather.pp_mm,
            "hr_min_pct": weather.hr_min_pct,
            "wind_mean_ms": weather.wind_mean_ms,
            "wind_max_ms": weather.wind_max_ms,
            "dias_secos": dry.dry_days,
            "humedad_suelo_superficial_m3m3": soil.soil_moisture_m3m3,
        }
        missing = [name for name, value in values.items() if value is None]
        if missing:
            raise DataValidationError(
                f"Entradas incompletas en {record_date}: {', '.join(missing)}."
            )
        if dry.precipitation_mm != weather.pp_mm:
            raise DataValidationError(
                f"La precipitacion usada para dias secos difiere en {record_date}."
            )
        if not 0 <= dry.dry_days <= self.maximum_dry_days:
            raise DataValidationError(
                f"dias_secos={dry.dry_days} excede el universo en {record_date}."
            )
        if not 0.0 <= weather.wind_max_ms <= self.maximum_wind_ms:
            raise DataValidationError(
                f"viento_max_ms={weather.wind_max_ms} excede el universo en {record_date}."
            )
