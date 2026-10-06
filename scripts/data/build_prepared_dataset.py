"""Construye el dataset diario definitivo con las cuatro entradas Mamdani."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "backend"))

from app.domain.data_processing import DryDayCounter, ReanalysisJoiner  # noqa: E402
from app.infrastructure.data.loaders import (  # noqa: E402
    OpenMeteoAtmosphericCsvLoader,
    OpenMeteoSoilMoistureCsvLoader,
)


DEFAULT_ATMOSPHERIC = (
    REPOSITORY_ROOT / "data/raw/era5_atmospheric_chachapoyas_2000_2025.csv"
)
DEFAULT_SOIL = (
    REPOSITORY_ROOT / "data/raw/era5_land_soil_moisture_chachapoyas_2000_2025.csv"
)
DEFAULT_OUTPUT = REPOSITORY_ROOT / "data/processed/weather_inputs_2000_2025.csv"
DEFAULT_METADATA = REPOSITORY_ROOT / "data/metadata/prepared_dataset_v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def display_path(path: Path) -> str:
    try:
        return path.relative_to(REPOSITORY_ROOT).as_posix()
    except ValueError:
        return str(path)


def variable_range(records, attribute: str) -> list[float | int]:
    values = [getattr(record, attribute) for record in records]
    return [min(values), max(values)]


def build(
    atmospheric_path: Path,
    soil_path: Path,
    output_path: Path,
    metadata_path: Path,
    force: bool,
) -> None:
    for target in (output_path, metadata_path):
        if target.exists() and not force:
            raise FileExistsError(
                f"{target} ya existe. Use --force para reemplazarlo de forma explicita."
            )

    atmospheric_dataset = OpenMeteoAtmosphericCsvLoader().load(atmospheric_path)
    soil_dataset = OpenMeteoSoilMoistureCsvLoader().load(soil_path)
    dry_days = DryDayCounter(precipitation_threshold_mm=1.0).calculate(
        atmospheric_dataset.records
    )
    records = ReanalysisJoiner(
        maximum_dry_days=15, maximum_wind_ms=6.0
    ).join(
        atmospheric_records=atmospheric_dataset.records,
        dry_day_observations=dry_days,
        soil_records=soil_dataset.records,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_output = output_path.with_suffix(output_path.suffix + ".tmp")
    with temporary_output.open("w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(
            (
                "fecha",
                "pp_mm",
                "hr_min_pct",
                "viento_medio_ms",
                "viento_max_ms",
                "dias_secos",
                "humedad_suelo_superficial_m3m3",
            )
        )
        for record in records:
            writer.writerow(
                (
                    record.date.isoformat(),
                    record.pp_mm,
                    record.hr_min_pct,
                    record.wind_mean_ms,
                    record.wind_max_ms,
                    record.dry_days,
                    record.soil_moisture_m3m3,
                )
            )
    temporary_output.replace(output_path)

    metadata = {
        "dataset_version": "1.0.0",
        "sources": {
            "atmospheric": {
                "file": display_path(atmospheric_path),
                "sha256": sha256(atmospheric_path),
                "dataset": "ERA5",
                "coordinates": [
                    atmospheric_dataset.metadata.latitude,
                    atmospheric_dataset.metadata.longitude,
                ],
            },
            "soil_moisture": {
                "file": display_path(soil_path),
                "sha256": sha256(soil_path),
                "dataset": "ERA5-Land",
                "coordinates": [
                    soil_dataset.metadata.latitude,
                    soil_dataset.metadata.longitude,
                ],
            },
        },
        "output": {
            "file": display_path(output_path),
            "sha256": sha256(output_path),
            "records": len(records),
            "first_date": records[0].date.isoformat(),
            "last_date": records[-1].date.isoformat(),
            "missing_values": 0,
            "duplicate_dates": 0,
            "model_ready": True,
        },
        "variables": {
            "pp_mm": {"unit": "mm", "range": variable_range(records, "pp_mm")},
            "hr_min_pct": {
                "unit": "%",
                "range": variable_range(records, "hr_min_pct"),
            },
            "viento_medio_ms": {
                "unit": "m/s",
                "range": variable_range(records, "wind_mean_ms"),
            },
            "viento_max_ms": {
                "unit": "m/s",
                "range": variable_range(records, "wind_max_ms"),
            },
            "dias_secos": {
                "unit": "dias",
                "range": variable_range(records, "dry_days"),
                "precipitation_threshold_mm": 1.0,
            },
            "humedad_suelo_superficial_m3m3": {
                "unit": "m3/m3",
                "depth_cm": [0, 7],
                "range": variable_range(records, "soil_moisture_m3m3"),
            },
        },
    }
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_metadata = metadata_path.with_suffix(metadata_path.suffix + ".tmp")
    temporary_metadata.write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    temporary_metadata.replace(metadata_path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--atmospheric", type=Path, default=DEFAULT_ATMOSPHERIC)
    parser.add_argument("--soil", type=Path, default=DEFAULT_SOIL)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--metadata", type=Path, default=DEFAULT_METADATA)
    parser.add_argument("--force", action="store_true")
    arguments = parser.parse_args()
    build(
        atmospheric_path=arguments.atmospheric.resolve(),
        soil_path=arguments.soil.resolve(),
        output_path=arguments.output.resolve(),
        metadata_path=arguments.metadata.resolve(),
        force=arguments.force,
    )
    print(f"Dataset generado: {arguments.output}")


if __name__ == "__main__":
    main()
