import unittest

from tests.helpers import configured_system


class ModelLoaderTests(unittest.TestCase):
    def test_loads_only_the_required_mamdani_pipeline(self) -> None:
        system = configured_system()
        self.assertEqual(system.metadata.model_type, "mamdani")
        self.assertEqual(system.metadata.and_operator, "minimum")
        self.assertEqual(system.metadata.implication_operator, "minimum")
        self.assertEqual(system.metadata.aggregation_operator, "maximum")
        self.assertEqual(system.metadata.defuzzification_method, "centroid")
        self.assertEqual(set(system.input_variables), {
            "hr_min_pct",
            "dias_secos",
            "viento_max_ms",
            "humedad_suelo_superficial_m3m3",
        })
        self.assertEqual(system.metadata.version, "1.1.0")


if __name__ == "__main__":
    unittest.main()
