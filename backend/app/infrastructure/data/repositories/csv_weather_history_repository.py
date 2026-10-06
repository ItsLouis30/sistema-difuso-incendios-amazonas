from __future__ import annotations

import csv
from datetime import date, timedelta
import math
from pathlib import Path
from types import MappingProxyType

from app.domain.model import DataValidationError, PreparedWeatherRecord


class CsvWeatherHistoryRepository:
    """Indice inmutable en memoria del dataset diario preparado."""

    REQUIRED_COLUMNS = (
        "fecha",
        "pp_mm",
        "hr_min_pct",
        "viento_medio_ms",
        "viento_max_ms",
        "dias_secos",
        "humedad_suelo_superficial_m3m3",
    )

    def __init__(self, source_path: str | Path) -> None:
        self.source_path = Path(source_path)
        self._records = MappingProxyType(self._load(self.source_path))
        self._first_date = min(self._records)
        self._last_date = max(self._records)
        self._validate_daily_continuity()

    def get_by_date(self, record_date: date) -> PreparedWeatherRecord | None:
        return self._records.get(record_date)

    def available_range(self) -> tuple[date, date]:
        return self._first_date, self._last_date

    def count(self) -> int:
        return len(self._records)

    def _load(self, source: Path) -> dict[date, PreparedWeatherRecord]:
        try:
            file = source.open("r", encoding="utf-8", newline="")
        except FileNotFoundError as exc:
            raise DataValidationError(f"No existe el dataset preparado {source}.") from exc

        with file:
            reader = csv.DictReader(file)
            fieldnames = tuple(reader.fieldnames or ())
            missing = [name for name in self.REQUIRED_COLUMNS if name not in fieldnames]
            if missing:
                raise DataValidationError(
                    "Faltan columnas en el dataset preparado: " + ", ".join(missing) + "."
                )
            records: dict[date, PreparedWeatherRecord] = {}
            for line_number, row in enumerate(reader, start=2):
                record = self._parse_record(row, line_number)
                if record.date in records:
                    raise DataValidationError(
                        f"Fecha duplicada {record.date.isoformat()} en la linea {line_number}."
                    )
                records[record.date] = record

        if not records:
            raise DataValidationError("El dataset preparado no contiene observaciones.")
        return records

    def _parse_record(
        self, row: dict[str, str], line_number: int
    ) -> PreparedWeatherRecord:
        raw_date = (row.get("fecha") or "").strip()
        try:
            record_date = date.fromisoformat(raw_date)
        except ValueError as exc:
            raise DataValidationError(
                f"Fecha invalida en la linea {line_number}: {raw_date!r}."
            ) from exc

        values = {
            field: self._required_float(row, field, record_date)
            for field in (
                "pp_mm",
                "hr_min_pct",
                "viento_medio_ms",
                "viento_max_ms",
                "humedad_suelo_superficial_m3m3",
            )
        }
        dry_days_value = self._required_float(row, "dias_secos", record_date)
        if not dry_days_value.is_integer():
            raise DataValidationError(
                f"dias_secos debe ser entero en {record_date.isoformat()}."
            )
        dry_days = int(dry_days_value)
        self._validate_ranges(record_date, values, dry_days)
        return PreparedWeatherRecord(
            date=record_date,
            pp_mm=values["pp_mm"],
            hr_min_pct=values["hr_min_pct"],
            wind_mean_ms=values["viento_medio_ms"],
            wind_max_ms=values["viento_max_ms"],
            dry_days=dry_days,
            soil_moisture_m3m3=values["humedad_suelo_superficial_m3m3"],
        )

    def _required_float(
        self, row: dict[str, str], field: str, record_date: date
    ) -> float:
        raw = (row.get(field) or "").strip()
        if not raw:
            raise DataValidationError(
                f"Falta {field} en {record_date.isoformat()}."
            )
        try:
            value = float(raw)
        except ValueError as exc:
            raise DataValidationError(
                f"{field} no es numerico en {record_date.isoformat()}."
            ) from exc
        if not math.isfinite(value):
            raise DataValidationError(
                f"{field} no es finito en {record_date.isoformat()}."
            )
        return value

    def _validate_ranges(
        self,
        record_date: date,
        values: dict[str, float],
        dry_days: int,
    ) -> None:
        if values["pp_mm"] < 0.0:
            raise DataValidationError(f"Precipitacion negativa en {record_date}.")
        if not 0.0 <= values["hr_min_pct"] <= 100.0:
            raise DataValidationError(f"HR minima fuera de [0,100] en {record_date}.")
        if values["viento_medio_ms"] < 0.0:
            raise DataValidationError(f"Viento medio negativo en {record_date}.")
        if not 0.0 <= values["viento_max_ms"] <= 6.0:
            raise DataValidationError(f"Viento maximo fuera de [0,6] en {record_date}.")
        if values["viento_max_ms"] < values["viento_medio_ms"]:
            raise DataValidationError(
                f"El viento maximo es menor que el medio en {record_date}."
            )
        if not 0 <= dry_days <= 15:
            raise DataValidationError(f"dias_secos fuera de [0,15] en {record_date}.")
        soil = values["humedad_suelo_superficial_m3m3"]
        if not 0.0 <= soil <= 1.0:
            raise DataValidationError(
                f"Humedad del suelo fuera de [0,1] en {record_date}."
            )

    def _validate_daily_continuity(self) -> None:
        expected_count = (self._last_date - self._first_date).days + 1
        if len(self._records) == expected_count:
            return
        current = self._first_date
        while current <= self._last_date:
            if current not in self._records:
                raise DataValidationError(
                    f"Falta la fecha diaria {current.isoformat()} en el dataset preparado."
                )
            current += timedelta(days=1)
