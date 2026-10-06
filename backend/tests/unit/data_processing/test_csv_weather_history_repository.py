from datetime import date
from pathlib import Path
import tempfile
import unittest

from app.domain.model import DataValidationError
from app.infrastructure.data.repositories import CsvWeatherHistoryRepository
from tests.helpers import REPOSITORY_ROOT


DATASET_PATH = (
    REPOSITORY_ROOT / "data" / "processed" / "weather_inputs_2000_2025.csv"
)
HEADER = (
    "fecha,pp_mm,hr_min_pct,viento_medio_ms,viento_max_ms,dias_secos,"
    "humedad_suelo_superficial_m3m3\n"
)


class CsvWeatherHistoryRepositoryTests(unittest.TestCase):
    def test_loads_and_indexes_the_definitive_dataset(self) -> None:
        repository = CsvWeatherHistoryRepository(DATASET_PATH)

        self.assertEqual(repository.count(), 9497)
        self.assertEqual(
            repository.available_range(),
            (date(2000, 1, 1), date(2025, 12, 31)),
        )
        first = repository.get_by_date(date(2000, 1, 1))
        self.assertIsNotNone(first)
        assert first is not None
        self.assertEqual(first.pp_mm, 8.2)
        self.assertEqual(first.hr_min_pct, 63.0)
        self.assertEqual(first.wind_mean_ms, 1.18)
        self.assertEqual(first.wind_max_ms, 2.11)
        self.assertEqual(first.dry_days, 0)
        self.assertEqual(first.soil_moisture_m3m3, 0.411)
        self.assertIsNone(repository.get_by_date(date(1999, 12, 31)))

    def test_rejects_missing_values_and_non_integer_dry_days(self) -> None:
        invalid_rows = (
            "2000-01-01,0,50,1,2,,0.3\n",
            "2000-01-01,0,50,1,2,1.5,0.3\n",
            "2000-01-01,0,nan,1,2,0,0.3\n",
            "2000-01-01,0,50,1,inf,0,0.3\n",
        )
        for row in invalid_rows:
            with self.subTest(row=row), self.assertRaises(DataValidationError):
                self._load_temporary(HEADER + row)

    def test_rejects_duplicates_gaps_and_values_outside_model_universes(self) -> None:
        invalid_contents = (
            HEADER
            + "2000-01-01,0,50,1,2,0,0.3\n"
            + "2000-01-01,0,50,1,2,0,0.3\n",
            HEADER
            + "2000-01-01,0,50,1,2,0,0.3\n"
            + "2000-01-03,0,50,1,2,0,0.3\n",
            HEADER + "2000-01-01,0,50,1,6.1,0,0.3\n",
            HEADER + "2000-01-01,0,50,3,2,0,0.3\n",
            HEADER + "2000-01-01,0,50,1,2,16,0.3\n",
            HEADER + "2000-01-01,0,50,1,2,0,1.1\n",
        )
        for content in invalid_contents:
            with self.subTest(content=content), self.assertRaises(DataValidationError):
                self._load_temporary(content)

    def _load_temporary(self, content: str) -> CsvWeatherHistoryRepository:
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "history.csv"
            path.write_text(content, encoding="utf-8")
            return CsvWeatherHistoryRepository(path)


if __name__ == "__main__":
    unittest.main()
