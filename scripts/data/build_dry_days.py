"""Genera la serie atmosferica intermedia con el contador de dias secos."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "backend"))

from app.domain.data_processing import DryDayCounter  # noqa: E402
from app.infrastructure.data.loaders import OpenMeteoAtmosphericCsvLoader  # noqa: E402


DEFAULT_INPUT = REPOSITORY_ROOT / "data/raw/era5_atmospheric_chachapoyas_2000_2025.csv"
DEFAULT_OUTPUT = REPOSITORY_ROOT / "data/processed/era5_atmospheric_with_dry_days.csv"
DEFAULT_METADATA = REPOSITORY_ROOT / "data/metadata/dry_days_v1.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(input_path: Path, output_path: Path, metadata_path: Path, force: bool) -> None:
    for target in (output_path, metadata_path):
        if target.exists() and not force:
            raise FileExistsError(
                f"{target} ya existe. Use --force para reemplazarlo de forma explicita."
            )

    dataset = OpenMeteoAtmosphericCsvLoader().load(input_path)
    observations = DryDayCounter(precipitation_threshold_mm=1.0).calculate(
        dataset.records
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
            )
        )
        for record, observation in zip(dataset.records, observations):
            writer.writerow(
                (
                    record.date.isoformat(),
                    "" if record.pp_mm is None else record.pp_mm,
                    "" if record.hr_min_pct is None else record.hr_min_pct,
                    "" if record.wind_mean_ms is None else record.wind_mean_ms,
                    "" if record.wind_max_ms is None else record.wind_max_ms,
                    "" if observation.dry_days is None else observation.dry_days,
                )
            )
    temporary_output.replace(output_path)

    known = [item for item in observations if item.dry_days is not None]
    maximum = max((item.dry_days for item in known), default=None)
    maximum_dates = [
        item.date.isoformat() for item in known if item.dry_days == maximum
    ]
    metadata = {
        "source_file": input_path.relative_to(REPOSITORY_ROOT).as_posix(),
        "source_sha256": sha256(input_path),
        "output_file": output_path.relative_to(REPOSITORY_ROOT).as_posix(),
        "output_sha256": sha256(output_path),
        "algorithm": {
            "precipitation_threshold_mm": 1.0,
            "wet_day": "pp_mm >= 1.0 reinicia dias_secos a 0",
            "dry_day": "0 <= pp_mm < 1.0 incrementa una racha conocida",
            "missing_value": "produce desconocido hasta observar un dia humedo valido",
            "calendar_gap": "produce desconocido hasta observar un dia humedo valido",
            "first_dry_day": "desconocido porque no existe antecedente previo",
        },
        "quality": {
            "records": len(observations),
            "unknown_dry_days": len(observations) - len(known),
            "maximum_dry_days": maximum,
            "maximum_dates": maximum_dates,
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
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--metadata", type=Path, default=DEFAULT_METADATA)
    parser.add_argument("--force", action="store_true")
    arguments = parser.parse_args()
    build(
        input_path=arguments.input.resolve(),
        output_path=arguments.output.resolve(),
        metadata_path=arguments.metadata.resolve(),
        force=arguments.force,
    )
    print(f"Serie generada: {arguments.output}")


if __name__ == "__main__":
    main()

