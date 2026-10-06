from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from types import MappingProxyType
from typing import Mapping


@dataclass(frozen=True, slots=True)
class DatasetMetadata:
    latitude: float
    longitude: float
    elevation_m: float
    utc_offset_seconds: int
    timezone: str
    timezone_abbreviation: str


@dataclass(frozen=True, slots=True)
class AtmosphericRecord:
    date: date
    pp_mm: float | None
    hr_min_pct: float | None
    wind_mean_ms: float | None
    wind_max_ms: float | None


@dataclass(frozen=True, slots=True)
class DataQualityReport:
    record_count: int
    first_date: date
    last_date: date
    duplicate_dates: tuple[date, ...]
    missing_dates: tuple[date, ...]
    missing_values: Mapping[str, int]
    minima: Mapping[str, float | None]
    maxima: Mapping[str, float | None]

    def __post_init__(self) -> None:
        object.__setattr__(
            self, "missing_values", MappingProxyType(dict(self.missing_values))
        )
        object.__setattr__(self, "minima", MappingProxyType(dict(self.minima)))
        object.__setattr__(self, "maxima", MappingProxyType(dict(self.maxima)))

    @property
    def has_complete_daily_coverage(self) -> bool:
        return not self.duplicate_dates and not self.missing_dates

    @property
    def total_missing_values(self) -> int:
        return sum(self.missing_values.values())


@dataclass(frozen=True, slots=True)
class AtmosphericDataset:
    metadata: DatasetMetadata
    records: tuple[AtmosphericRecord, ...]
    quality: DataQualityReport
