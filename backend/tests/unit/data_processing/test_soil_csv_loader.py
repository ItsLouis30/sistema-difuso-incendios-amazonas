import tempfile
import unittest
from pathlib import Path

from app.domain.model import DataValidationError
from app.infrastructure.data.loaders import OpenMeteoSoilMoistureCsvLoader
from tests.helpers import REPOSITORY_ROOT


METADATA_HEADER = (
    "latitude,longitude,elevation,utc_offset_seconds,timezone,timezone_abbreviation\n"
    "-6.2,-77.9,2441.0,-18000,America/Lima,GMT-5\n\n"
)
DATA_HEADER = "time,soil_moisture_0_to_7cm_mean (m3/m3)\n"


class SoilMoistureCsvLoaderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.loader = OpenMeteoSoilMoistureCsvLoader()

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
            / "era5_land_soil_moisture_chachapoyas_2000_2025.csv"
        )
        dataset = self.loader.load(path)
        self.assertEqual(dataset.quality.record_count, 9497)
        self.assertTrue(dataset.quality.has_complete_daily_coverage)
        self.assertEqual(dataset.quality.total_missing_values, 0)
        self.assertEqual(dataset.quality.minima["soil_moisture_m3m3"], 0.161)
        self.assertEqual(dataset.quality.maxima["soil_moisture_m3m3"], 0.443)
        self.assertAlmostEqual(dataset.metadata.latitude, -6.199997)
        self.assertAlmostEqual(dataset.metadata.longitude, -77.9)

    def test_preserves_missing_value_and_reports_calendar_gap(self) -> None:
        dataset = self.loader.load(
            self._temporary_csv("2020-01-01,\n2020-01-03,0.35\n")
        )
        self.assertIsNone(dataset.records[0].soil_moisture_m3m3)
        self.assertEqual(dataset.quality.missing_values["soil_moisture_m3m3"], 1)
        self.assertEqual(
            tuple(value.isoformat() for value in dataset.quality.missing_dates),
            ("2020-01-02",),
        )

    def test_rejects_duplicate_and_out_of_range_values(self) -> None:
        invalid_rows = (
            "2020-01-01,0.3\n2020-01-01,0.4\n",
            "2020-01-01,-0.01\n",
            "2020-01-01,1.01\n",
        )
        for rows in invalid_rows:
            with self.subTest(rows=rows), self.assertRaises(DataValidationError):
                self.loader.load(self._temporary_csv(rows))


if __name__ == "__main__":
    unittest.main()

