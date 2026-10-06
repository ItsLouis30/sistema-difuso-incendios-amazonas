import unittest

from app.domain.fuzzy.fuzzifier import SingletonFuzzifier
from app.domain.model import InputValueError
from tests.helpers import configured_system


class SingletonFuzzifierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.system = configured_system()
        cls.fuzzifier = SingletonFuzzifier(cls.system.input_variables)

    def test_calculates_overlapping_memberships(self) -> None:
        result = self.fuzzifier.fuzzify(
            {
                "hr_min_pct": 49.5,
                "dias_secos": 1.5,
                "viento_max_ms": 2.2,
                "humedad_suelo_superficial_m3m3": 0.3335,
            }
        )
        self.assertAlmostEqual(result["hr_min_pct"]["muy_baja"], 0.5)
        self.assertAlmostEqual(result["hr_min_pct"]["baja"], 0.5)
        self.assertAlmostEqual(result["dias_secos"]["cortos"], 0.5)
        self.assertAlmostEqual(result["dias_secos"]["moderados"], 0.5)
        self.assertAlmostEqual(result["viento_max_ms"]["muy_bajo"], 0.5)
        self.assertAlmostEqual(result["viento_max_ms"]["bajo"], 0.5)
        self.assertAlmostEqual(
            result["humedad_suelo_superficial_m3m3"]["seca"], 0.5
        )
        self.assertAlmostEqual(
            result["humedad_suelo_superficial_m3m3"]["intermedia"], 0.5
        )

    def test_rejects_missing_unknown_and_out_of_range_inputs(self) -> None:
        invalid_inputs = (
            {"hr_min_pct": 50.0, "dias_secos": 2.0},
            {
                "hr_min_pct": 50.0,
                "dias_secos": 2.0,
                "viento_max_ms": 3.0,
                "humedad_suelo_superficial_m3m3": 0.354,
                "temperatura": 20.0,
            },
            {
                "hr_min_pct": 101.0,
                "dias_secos": 2.0,
                "viento_max_ms": 3.0,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
            {
                "hr_min_pct": 50.0,
                "dias_secos": 2.0,
                "viento_max_ms": 3.0,
                "humedad_suelo_superficial_m3m3": 1.01,
            },
        )
        for values in invalid_inputs:
            with self.subTest(values=values), self.assertRaises(InputValueError):
                self.fuzzifier.fuzzify(values)

    def test_partitions_cover_every_input_universe(self) -> None:
        for variable in self.system.input_variables.values():
            for index in range(201):
                value = variable.minimum + (variable.maximum - variable.minimum) * index / 200
                degrees = self.fuzzifier.fuzzify(
                    {
                        "hr_min_pct": value if variable.name == "hr_min_pct" else 60.0,
                        "dias_secos": value if variable.name == "dias_secos" else 3.0,
                        "viento_max_ms": value if variable.name == "viento_max_ms" else 3.0,
                        "humedad_suelo_superficial_m3m3": (
                            value
                            if variable.name == "humedad_suelo_superficial_m3m3"
                            else 0.354
                        ),
                    }
                )[variable.name]
                self.assertAlmostEqual(sum(degrees.values()), 1.0, places=10)


if __name__ == "__main__":
    unittest.main()
