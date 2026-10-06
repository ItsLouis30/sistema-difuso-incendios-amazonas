from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.application.use_cases import RunHistoricalInference, RunManualInference
from app.domain.fuzzy import MamdaniSystem
from app.infrastructure.data.repositories import CsvWeatherHistoryRepository

from .model_loader import load_mamdani_system


@dataclass(frozen=True, slots=True)
class ApplicationServices:
    fuzzy_system: MamdaniSystem
    weather_history: CsvWeatherHistoryRepository
    manual_inference: RunManualInference
    historical_inference: RunHistoricalInference


def build_application_services(
    config_directory: str | Path,
    dataset_path: str | Path,
) -> ApplicationServices:
    """Crea una sola instancia del modelo y sus casos de uso."""
    fuzzy_system = load_mamdani_system(config_directory)
    weather_history = CsvWeatherHistoryRepository(dataset_path)
    return ApplicationServices(
        fuzzy_system=fuzzy_system,
        weather_history=weather_history,
        manual_inference=RunManualInference(fuzzy_system),
        historical_inference=RunHistoricalInference(fuzzy_system, weather_history),
    )
