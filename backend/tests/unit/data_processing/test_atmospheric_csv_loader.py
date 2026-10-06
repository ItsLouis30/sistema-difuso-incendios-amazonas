import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from app.domain.model import DataValidationError
from app.infrastructure.data.loaders import OpenMeteoAtmosphericCsvLoader
from tests.helpers import REPOSITORY_ROOT


METADATA_HEADER = (
    "latitude,longitude,elevation,utc_offset_seconds,timezone,timezone_abbreviation\n"
    "-6.25,-77.75,2441.0,-18000,America/Lima,GMT-5\n\n"
)
DATA_HEADER = (
    "time,precipitation_sum (mm),relative_humidity_2m_min (%),"
    "wind_speed_10m_mean (m/s),wind_speed_10m_max (m/s)\n"
)


class AtmosphericCsvLoaderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.loader = OpenMeteoAtmosphericCsvLoader()

    def _temporary_csv(self, rows: str) -> Path:
        temporary = tempfile.NamedTemporaryFile(
            mode="w", suffix=".csv", encoding="utf-8", delete=False
        )
        with temporary:
            temporary.write(METADATA_HEADER + DATA_HEADER + rows)
        self.addCleanup(Path(temporary.name).unlink, missing_ok=True)
        return Path(temporary.name)

    def test_loads_the_complete_downloaded_series(self) -> None:
        path = (
            REPOSITORY_ROOT
            / "data"
            / "raw"
            / "era5_atmospheric_chachapoyas_2000_2025.csv"
        )
        metadata_path = (
            REPOSITORY_ROOT / "data" / "metadata" / "era5_atmospheric_v1.json"
        )
        with metadata_path.open(encoding="utf-8") as file:
            source_metadata = json.load(file)
        self.assertEqual(
            hashlib.sha256(path.read_bytes()).hexdigest(),
            source_metadata["raw_file_sha256"],
        )
        dataset = self.loader.load(path)
        self.assertEqual(dataset.quality.record_count, 9497)
        self.assertTrue(dataset.quality.has_complete_daily_coverage)
        self.assertEqual(dataset.quality.total_missing_values, 0)
        self.assertEqual(dataset.quality.minima["hr_min_pct"], 14.0)
        self.assertEqual(dataset.quality.maxima["hr_min_pct"], 92.0)
        self.assertEqual(dataset.quality.minima["wind_max_ms"], 0.71)
        self.assertEqual(dataset.quality.maxima["wind_max_ms"], 5.21)
        self.assertAlmostEqual(dataset.metadata.latitude, -6.25)
        self.assertAlmostEqual(dataset.metadata.longitude, -77.75)

    def test_preserves_a_missing_value_as_none(self) -> None:
        path = self._temporary_csv(
            "2020-01-01,,50,1.0,2.0\n"
            "2020-01-02,0.0,51,1.1,2.1\n"
        )
        dataset = self.loader.load(path)
        self.assertIsNone(dataset.records[0].pp_mm)
        self.assertEqual(dataset.records[1].pp_mm, 0.0)
        self.assertEqual(dataset.quality.missing_values["pp_mm"], 1)

    def test_reports_a_missing_calendar_date(self) -> None:
        path = self._temporary_csv(
            "2020-01-01,0.0,50,1.0,2.0\n"
            "2020-01-03,0.0,51,1.1,2.1\n"
        )
        dataset = self.loader.load(path)
        self.assertEqual(
            tuple(value.isoformat() for value in dataset.quality.missing_dates),
            ("2020-01-02",),
        )

    def test_rejects_duplicates_and_physical_inconsistencies(self) -> None:
        invalid_rows = (
            (
                "2020-01-01,0.0,50,1.0,2.0\n"
                "2020-01-01,0.1,51,1.1,2.1\n"
            ),
            "2020-01-01,-0.1,50,1.0,2.0\n",
            "2020-01-01,0.0,101,1.0,2.0\n",
            "2020-01-01,0.0,50,3.0,2.0\n",
        )
        for rows in invalid_rows:
            with self.subTest(rows=rows), self.assertRaises(DataValidationError):
                self.loader.load(self._temporary_csv(rows))


if __name__ == "__main__":
    unittest.main()
