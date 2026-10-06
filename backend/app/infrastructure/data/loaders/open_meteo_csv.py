from __future__ import annotations

import csv
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

from app.domain.model import (
    AtmosphericDataset,
    AtmosphericRecord,
    DataQualityReport,
    DatasetMetadata,
    DataValidationError,
)


class OpenMeteoAtmosphericCsvLoader:
    """Carga el CSV de Open-Meteo sin confundir vacios con valores cero."""

    COLUMN_PREFIXES = {
        "pp_mm": "precipitation_sum",
        "hr_min_pct": "relative_humidity_2m_min",
        "wind_mean_ms": "wind_speed_10m_mean",
        "wind_max_ms": "wind_speed_10m_max",
    }

    def load(self, path: str | Path) -> AtmosphericDataset:
        source = Path(path)
        try:
            lines = source.read_text(encoding="utf-8").splitlines()
        except FileNotFoundError as exc:
            raise DataValidationError(f"No existe el archivo {source}.") from exc
        if len(lines) < 4:
            raise DataValidationError("El CSV de Open-Meteo esta incompleto.")

        metadata = self._parse_metadata(lines)
        header_index = self._find_data_header(lines)
        reader = csv.DictReader(lines[header_index:])
        columns = self._resolve_columns(reader.fieldnames or [])
        records = tuple(self._parse_record(row, columns) for row in reader)
        if not records:
            raise DataValidationError("El CSV no contiene observaciones meteorologicas.")
        quality = self._quality_report(records)
        if quality.duplicate_dates:
            dates = ", ".join(value.isoformat() for value in quality.duplicate_dates[:3])
            raise DataValidationError(f"El CSV contiene fechas duplicadas: {dates}.")
        return AtmosphericDataset(metadata=metadata, records=records, quality=quality)

    def _parse_metadata(self, lines: list[str]) -> DatasetMetadata:
        names = next(csv.reader([lines[0]]))
        values = next(csv.reader([lines[1]]))
        raw = dict(zip(names, values))
        required = {
            "latitude",
            "longitude",
            "elevation",
            "utc_offset_seconds",
            "timezone",
            "timezone_abbreviation",
        }
        if not required.issubset(raw):
            raise DataValidationError("Faltan metadatos geograficos de Open-Meteo.")
        try:
            return DatasetMetadata(
                latitude=float(raw["latitude"]),
                longitude=float(raw["longitude"]),
                elevation_m=float(raw["elevation"]),
                utc_offset_seconds=int(raw["utc_offset_seconds"]),
                timezone=raw["timezone"],
                timezone_abbreviation=raw["timezone_abbreviation"],
            )
        except ValueError as exc:
            raise DataValidationError("Los metadatos geograficos son invalidos.") from exc

    def _find_data_header(self, lines: list[str]) -> int:
        try:
            return next(index for index, line in enumerate(lines) if line.startswith("time,"))
        except StopIteration as exc:
            raise DataValidationError("No se encontro la cabecera temporal del CSV.") from exc

    def _resolve_columns(self, fieldnames: list[str]) -> dict[str, str]:
        resolved: dict[str, str] = {}
        for internal_name, prefix in self.COLUMN_PREFIXES.items():
            matches = [name for name in fieldnames if name.startswith(prefix)]
            if len(matches) != 1:
                raise DataValidationError(
                    f"Se esperaba exactamente una columna con prefijo {prefix!r}."
                )
            resolved[internal_name] = matches[0]
        if "time" not in fieldnames:
            raise DataValidationError("Falta la columna time.")
        return resolved

    def _optional_float(self, raw: str, field: str, record_date: date) -> float | None:
        value = raw.strip()
        if not value:
            return None
        try:
            return float(value)
        except ValueError as exc:
            raise DataValidationError(
                f"{field} no es numerico en {record_date.isoformat()}."
            ) from exc

    def _parse_record(
        self, row: dict[str, str], columns: dict[str, str]
    ) -> AtmosphericRecord:
        try:
            record_date = date.fromisoformat(row["time"])
        except (KeyError, ValueError) as exc:
            raise DataValidationError("El CSV contiene una fecha invalida.") from exc
        values = {
            name: self._optional_float(row[column], name, record_date)
            for name, column in columns.items()
        }
        self._validate_physical_ranges(record_date, values)
        return AtmosphericRecord(date=record_date, **values)

    def _validate_physical_ranges(
        self, record_date: date, values: dict[str, float | None]
    ) -> None:
        pp = values["pp_mm"]
        humidity = values["hr_min_pct"]
        mean_wind = values["wind_mean_ms"]
        maximum_wind = values["wind_max_ms"]
        if pp is not None and pp < 0.0:
            raise DataValidationError(f"Precipitacion negativa en {record_date}.")
        if humidity is not None and not 0.0 <= humidity <= 100.0:
            raise DataValidationError(f"Humedad relativa fuera de [0,100] en {record_date}.")
        if mean_wind is not None and mean_wind < 0.0:
            raise DataValidationError(f"Viento medio negativo en {record_date}.")
        if maximum_wind is not None and maximum_wind < 0.0:
            raise DataValidationError(f"Viento maximo negativo en {record_date}.")
        if (
            mean_wind is not None
            and maximum_wind is not None
            and maximum_wind < mean_wind
        ):
            raise DataValidationError(
                f"El viento maximo es menor que el medio en {record_date}."
            )

    def _quality_report(
        self, records: tuple[AtmosphericRecord, ...]
    ) -> DataQualityReport:
        ordered = tuple(sorted(records, key=lambda record: record.date))
        counts = Counter(record.date for record in ordered)
        duplicates = tuple(day for day, count in counts.items() if count > 1)
        observed = set(counts)
        current = ordered[0].date
        missing_dates: list[date] = []
        while current <= ordered[-1].date:
            if current not in observed:
                missing_dates.append(current)
            current += timedelta(days=1)

        field_names = ("pp_mm", "hr_min_pct", "wind_mean_ms", "wind_max_ms")
        missing_values = {
            field: sum(getattr(record, field) is None for record in ordered)
            for field in field_names
        }
        available = {
            field: [
                value
                for record in ordered
                if (value := getattr(record, field)) is not None
            ]
            for field in field_names
        }
        return DataQualityReport(
            record_count=len(ordered),
            first_date=ordered[0].date,
            last_date=ordered[-1].date,
            duplicate_dates=duplicates,
            missing_dates=tuple(missing_dates),
            missing_values=missing_values,
            minima={field: min(values) if values else None for field, values in available.items()},
            maxima={field: max(values) if values else None for field, values in available.items()},
        )
