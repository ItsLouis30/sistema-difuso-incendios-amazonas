"""Descarga reproducible de las variables atmosfericas ERA5 del proyecto."""

from __future__ import annotations

import argparse
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen


API_URL = "https://archive-api.open-meteo.com/v1/archive"
DEFAULT_OUTPUT = Path("data/raw/era5_atmospheric_chachapoyas_2000_2025.csv")


def build_url(start_date: str, end_date: str) -> str:
    parameters = {
        "latitude": -6.2083,
        "longitude": -77.8671,
        "start_date": start_date,
        "end_date": end_date,
        "daily": ",".join(
            (
                "precipitation_sum",
                "relative_humidity_2m_min",
                "wind_speed_10m_mean",
                "wind_speed_10m_max",
            )
        ),
        "timezone": "America/Lima",
        "models": "era5",
        "wind_speed_unit": "ms",
        "precipitation_unit": "mm",
        "format": "csv",
    }
    return f"{API_URL}?{urlencode(parameters)}"


def download(start_date: str, end_date: str, output: Path, force: bool) -> None:
    if output.exists() and not force:
        raise FileExistsError(
            f"{output} ya existe. Use --force para reemplazarlo de forma explicita."
        )
    output.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(build_url(start_date, end_date), timeout=90) as response:
        content = response.read()
    if not content.startswith(b"latitude,longitude,elevation"):
        raise RuntimeError("La respuesta no tiene el formato CSV esperado.")
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.write_bytes(content)
    temporary.replace(output)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start-date", default="2000-01-01")
    parser.add_argument("--end-date", default="2025-12-31")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--force", action="store_true")
    arguments = parser.parse_args()
    download(
        start_date=arguments.start_date,
        end_date=arguments.end_date,
        output=arguments.output,
        force=arguments.force,
    )
    print(f"Archivo descargado: {arguments.output}")


if __name__ == "__main__":
    main()

