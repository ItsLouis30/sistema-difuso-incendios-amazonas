import csv
import hashlib
import json
import unittest
from datetime import date

from app.domain.data_processing import DryDayCounter
from app.domain.model import AtmosphericRecord, DataValidationError
from app.infrastructure.data.loaders import OpenMeteoAtmosphericCsvLoader
from tests.helpers import REPOSITORY_ROOT


def record(day: str, precipitation: float | None) -> AtmosphericRecord:
    return AtmosphericRecord(
        date=date.fromisoformat(day),
        pp_mm=precipitation,
        hr_min_pct=50.0,
        wind_mean_ms=1.0,
        wind_max_ms=2.0,
    )


class DryDayCounterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.counter = DryDayCounter(precipitation_threshold_mm=1.0)

    def test_counts_dry_days_and_resets_at_exactly_one_millimeter(self) -> None:
        observations = self.counter.calculate(
            (
                record("2020-01-01", 1.2),
                record("2020-01-02", 0.9),
                record("2020-01-03", 0.0),
                record("2020-01-04", 1.0),
                record("2020-01-05", 0.2),
            )
        )
        self.assertEqual(
            tuple(item.dry_days for item in observations), (0, 1, 2, 0, 1)
        )

    def test_first_dry_day_is_unknown_until_a_wet_day_occurs(self) -> None:
        observations = self.counter.calculate(
            (
                record("2020-01-01", 0.0),
                record("2020-01-02", 0.5),
                record("2020-01-03", 1.0),
                record("2020-01-04", 0.0),
            )
        )
        self.assertEqual(
            tuple(item.dry_days for item in observations), (None, None, 0, 1)
        )

    def test_missing_value_invalidates_the_streak_until_a_wet_day(self) -> None:
        observations = self.counter.calculate(
            (
                record("2020-01-01", 2.0),
                record("2020-01-02", 0.0),
                record("2020-01-03", None),
                record("2020-01-04", 0.0),
                record("2020-01-05", 0.0),
                record("2020-01-06", 1.0),
                record("2020-01-07", 0.0),
            )
        )
        self.assertEqual(
            tuple(item.dry_days for item in observations),
            (0, 1, None, None, None, 0, 1),
        )

    def test_calendar_gap_invalidates_a_known_streak(self) -> None:
        observations = self.counter.calculate(
            (
                record("2020-01-01", 2.0),
                record("2020-01-02", 0.0),
                record("2020-01-04", 0.0),
                record("2020-01-05", 1.0),
            )
        )
        self.assertEqual(tuple(item.dry_days for item in observations), (0, 1, None, 0))

    def test_rejects_negative_precipitation_and_unordered_dates(self) -> None:
        invalid_sequences = (
            (record("2020-01-01", -0.1),),
            (record("2020-01-02", 1.0), record("2020-01-01", 0.0)),
            (record("2020-01-01", 1.0), record("2020-01-01", 0.0)),
        )
        for records in invalid_sequences:
            with self.subTest(records=records), self.assertRaises(DataValidationError):
                self.counter.calculate(records)

    def test_real_series_stays_inside_the_configured_universe(self) -> None:
        path = (
            REPOSITORY_ROOT
            / "data"
            / "raw"
            / "era5_atmospheric_chachapoyas_2000_2025.csv"
        )
        records = OpenMeteoAtmosphericCsvLoader().load(path).records
        observations = self.counter.calculate(records)
        values = [item.dry_days for item in observations if item.dry_days is not None]
        self.assertEqual(len(observations), 9497)
        self.assertEqual(len(values), 9497)
        self.assertEqual(max(values), 14)
        self.assertLessEqual(max(values), 15)

    def test_generated_artifact_matches_its_metadata(self) -> None:
        output_path = (
            REPOSITORY_ROOT
            / "data"
            / "processed"
            / "era5_atmospheric_with_dry_days.csv"
        )
        metadata_path = REPOSITORY_ROOT / "data" / "metadata" / "dry_days_v1.json"
        with metadata_path.open(encoding="utf-8") as file:
            metadata = json.load(file)
        with output_path.open(encoding="utf-8", newline="") as file:
            rows = list(csv.DictReader(file))

        self.assertEqual(
            hashlib.sha256(output_path.read_bytes()).hexdigest(),
            metadata["output_sha256"],
        )
        self.assertEqual(len(rows), metadata["quality"]["records"])
        values = [int(row["dias_secos"]) for row in rows if row["dias_secos"]]
        self.assertEqual(max(values), metadata["quality"]["maximum_dry_days"])


if __name__ == "__main__":
    unittest.main()
