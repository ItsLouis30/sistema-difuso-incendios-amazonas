from __future__ import annotations

from datetime import date
from typing import Protocol

from app.domain.model import PreparedWeatherRecord


class WeatherHistoryRepository(Protocol):
    def get_by_date(self, record_date: date) -> PreparedWeatherRecord | None: ...

    def available_range(self) -> tuple[date, date]: ...

    def count(self) -> int: ...

