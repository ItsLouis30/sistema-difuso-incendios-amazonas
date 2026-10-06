import csv
import hashlib
import json
import unittest

from tests.helpers import REPOSITORY_ROOT, configured_system


class PreparedDatasetArtifactTests(unittest.TestCase):
    def test_final_dataset_is_complete_and_compatible_with_the_model(self) -> None:
        dataset_path = (
            REPOSITORY_ROOT / "data" / "processed" / "weather_inputs_2000_2025.csv"
        )
        metadata_path = (
            REPOSITORY_ROOT / "data" / "metadata" / "prepared_dataset_v1.json"
        )
        with metadata_path.open(encoding="utf-8") as file:
            metadata = json.load(file)
        with dataset_path.open(encoding="utf-8", newline="") as file:
            rows = list(csv.DictReader(file))

        self.assertEqual(
            hashlib.sha256(dataset_path.read_bytes()).hexdigest(),
            metadata["output"]["sha256"],
        )
        self.assertEqual(len(rows), 9497)
        self.assertEqual(len({row["fecha"] for row in rows}), 9497)
        self.assertEqual(rows[0]["fecha"], "2000-01-01")
        self.assertEqual(rows[-1]["fecha"], "2025-12-31")
        self.assertFalse(any(value == "" for row in rows for value in row.values()))

        system = configured_system()
        column_by_variable = {
            "hr_min_pct": "hr_min_pct",
            "dias_secos": "dias_secos",
            "viento_max_ms": "viento_max_ms",
            "humedad_suelo_superficial_m3m3": "humedad_suelo_superficial_m3m3",
        }
        for variable_name, column in column_by_variable.items():
            variable = system.input_variables[variable_name]
            values = [float(row[column]) for row in rows]
            self.assertGreaterEqual(min(values), variable.minimum)
            self.assertLessEqual(max(values), variable.maximum)


if __name__ == "__main__":
    unittest.main()

