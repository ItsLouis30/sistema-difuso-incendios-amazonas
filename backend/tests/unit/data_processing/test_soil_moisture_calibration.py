import csv
import hashlib
import json
import unittest
from datetime import date

from tests.helpers import REPOSITORY_ROOT


def percentile(values: list[float], probability: float) -> float:
    ordered = sorted(values)
    position = (len(ordered) - 1) * probability
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = position - lower
    return ordered[lower] * (1.0 - fraction) + ordered[upper] * fraction


class SoilMoistureCalibrationTests(unittest.TestCase):
    def test_metadata_matches_the_downloaded_era5_land_series(self) -> None:
        raw_path = (
            REPOSITORY_ROOT
            / "data"
            / "raw"
            / "era5_land_soil_moisture_chachapoyas_2000_2025.csv"
        )
        metadata_path = (
            REPOSITORY_ROOT / "data" / "metadata" / "soil_moisture_calibration_v1.json"
        )
        with metadata_path.open(encoding="utf-8") as file:
            metadata = json.load(file)
        self.assertEqual(
            hashlib.sha256(raw_path.read_bytes()).hexdigest(),
            metadata["raw_file_sha256"],
        )
        with raw_path.open(encoding="utf-8", errors="replace") as file:
            lines = file.readlines()

        header_index = next(
            index for index, line in enumerate(lines) if line.startswith("time,")
        )
        reader = csv.DictReader(lines[header_index:])
        value_column = next(
            name for name in reader.fieldnames if name.startswith("soil_moisture")
        )
        records = [
            (date.fromisoformat(row["time"]), float(row[value_column]))
            for row in reader
            if row[value_column]
        ]
        calibration = [
            value
            for record_date, value in records
            if 2000 <= record_date.year <= 2019 and 6 <= record_date.month <= 9
        ]

        self.assertEqual(len(records), metadata["total_records"])
        self.assertEqual(len(calibration), metadata["calibration_period"]["records"])
        statistics = metadata["calibration_statistics"]
        for name, probability in (("p25", 0.25), ("p50", 0.50), ("p75", 0.75)):
            self.assertAlmostEqual(percentile(calibration, probability), statistics[name])


if __name__ == "__main__":
    unittest.main()
