from __future__ import annotations

from datetime import date


class HistoricalDateNotFoundError(LookupError):
    def __init__(
        self, requested_date: date, available_range: tuple[date, date]
    ) -> None:
        self.requested_date = requested_date
        self.available_range = available_range
        super().__init__(
            f"No existen datos para {requested_date.isoformat()}. "
            f"Rango disponible: {available_range[0].isoformat()} a "
            f"{available_range[1].isoformat()}."
        )

