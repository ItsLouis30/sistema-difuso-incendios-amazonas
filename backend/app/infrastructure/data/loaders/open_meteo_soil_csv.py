from __future__ import annotations

import csv
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

from app.domain.model import (
    DataQualityReport,
    DatasetMetadata,
    DataValidationError,
    SoilMoistureDataset,
    SoilMoistureRecord,
)


class OpenMeteoSoilMoistureCsvLoader:
    """Carga la humedad superficial ERA5-Land exportada por Open-Meteo."""

    COLUMN_PREFIX = "soil_moisture_0_to_7cm_mean"

    def load(self, path: str | Path) -> SoilMoistureDataset:
        source = Path(path)
        try:
            lines = source.read_text(encoding="utf-8").splitlines()
        except FileNotFoundError as exc:
            raise DataValidationError(f"No existe el archivo {source}.") from exc
        if len(lines) < 4:
            raise DataValidationError("El CSV de humedad del suelo esta incompleto.")

        metadata = self._parse_metadata(lines)
        header_index = self._find_data_header(lines)
        reader = csv.DictReader(lines[header_index:])
        matches = [
            name for name in (reader.fieldnames or []) if name.startswith(self.COLUMN_PREFIX)
        ]
        if len(matches) != 1:
            raise DataValidationError(
                "Se esperaba una columna de humedad media del suelo de 0-7 cm."
            )
        column = matches[0]
        records = tuple(self._parse_record(row, column) for row in reader)
        if not records:
            raise DataValidationError("El CSV no contiene observaciones de suelo.")
        quality = self._quality_report(records)
        if quality.duplicate_dates:
            dates = ", ".join(value.isoformat() for value in quality.duplicate_dates[:3])
            raise DataValidationError(f"El CSV contiene fechas duplicadas: {dates}.")
        return SoilMoistureDataset(metadata=metadata, records=records, quality=quality)

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

    def _parse_record(self, row: dict[str, str], column: str) -> SoilMoistureRecord:
        try:
            record_date = date.fromisoformat(row["time"])
        except (KeyError, ValueError) as exc:
            raise DataValidationError("El CSV contiene una fecha invalida.") from exc
        raw = row[column].strip()
        if not raw:
            value = None
        else:
            try:
                value = float(raw)
            except ValueError as exc:
                raise DataValidationError(
                    f"Humedad del suelo no numerica en {record_date.isoformat()}."
                ) from exc
            if not 0.0 <= value <= 1.0:
                raise DataValidationError(
                    f"Humedad del suelo fuera de [0,1] en {record_date.isoformat()}."
                )
        return SoilMoistureRecord(date=record_date, soil_moisture_m3m3=value)

    def _quality_report(
        self, records: tuple[SoilMoistureRecord, ...]
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
        values = [
            record.soil_moisture_m3m3
            for record in ordered
            if record.soil_moisture_m3m3 is not None
        ]
        missing = len(ordered) - len(values)
        return DataQualityReport(
            record_count=len(ordered),
            first_date=ordered[0].date,
            last_date=ordered[-1].date,
            duplicate_dates=duplicates,
            missing_dates=tuple(missing_dates),
            missing_values={"soil_moisture_m3m3": missing},
            minima={"soil_moisture_m3m3": min(values) if values else None},
            maxima={"soil_moisture_m3m3": max(values) if values else None},
        )
