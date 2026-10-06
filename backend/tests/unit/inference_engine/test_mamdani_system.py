import math
import unittest

from app.domain.model import InputValueError
from tests.helpers import configured_system


class MamdaniSystemTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.system = configured_system()

    def assert_scenario(
        self,
        hr: float,
        dry_days: float,
        wind: float,
        expected_category: str,
        expected_index: float,
        soil_moisture: float = 0.354,
    ) -> None:
        result = self.system.evaluate(
            {
                "hr_min_pct": hr,
                "dias_secos": dry_days,
                "viento_max_ms": wind,
                "humedad_suelo_superficial_m3m3": soil_moisture,
            }
        )
        self.assertEqual(result.output_category, expected_category)
        self.assertAlmostEqual(result.output_index, expected_index, delta=0.08)
        self.assertTrue(result.active_rules)
        self.assertTrue(result.recommendation)
        self.assertEqual(len(result.output_curve), 2001)

    def test_anchor_scenarios_activate_expected_consequents(self) -> None:
        scenarios = (
            (85.0, 0.0, 1.5, "muy_bajo", 25.0 / 3.0),
            (85.0, 8.0, 1.5, "moderado", 50.0),
            (85.0, 0.0, 4.5, "muy_bajo", 25.0 / 3.0),
            (30.0, 0.0, 1.5, "bajo", 25.0),
            (30.0, 0.0, 4.5, "alto", 75.0),
            (30.0, 8.0, 1.5, "alto", 75.0),
            (30.0, 8.0, 4.5, "muy_alto", 275.0 / 3.0),
            (66.0, 4.0, 2.95, "alto", 75.0),
            (53.0, 2.0, 2.45, "moderado", 50.0),
        )
        for scenario in scenarios:
            with self.subTest(scenario=scenario):
                self.assert_scenario(*scenario)

    def test_explanation_contains_memberships_and_rule_strength(self) -> None:
        result = self.system.evaluate(
            {
                "hr_min_pct": 49.5,
                "dias_secos": 1.5,
                "viento_max_ms": 2.2,
                "humedad_suelo_superficial_m3m3": 0.354,
            }
        )
        self.assertEqual(len(result.active_rules), 8)
        self.assertTrue(
            all(math.isclose(rule.activation, 0.5, abs_tol=1e-12) for rule in result.active_rules)
        )
        lowest_active_number = min(rule.number for rule in result.active_rules)
        self.assertEqual(result.strongest_rules[0].number, lowest_active_number)
        self.assertAlmostEqual(sum(result.input_memberships["hr_min_pct"].values()), 1.0)

    def test_output_is_finite_and_bounded_for_a_dense_grid(self) -> None:
        for hr in (0.0, 25.0, 49.5, 60.0, 72.0, 100.0):
            for dry_days in (0.0, 1.5, 3.0, 5.5, 10.0, 15.0):
                for wind in (0.0, 2.2, 2.7, 3.3, 4.5, 6.0):
                    for soil_moisture in (0.2, 0.354, 0.42):
                        result = self.system.evaluate(
                            {
                                "hr_min_pct": hr,
                                "dias_secos": dry_days,
                                "viento_max_ms": wind,
                                "humedad_suelo_superficial_m3m3": soil_moisture,
                            }
                        )
                        self.assertTrue(math.isfinite(result.output_index))
                        self.assertGreaterEqual(result.output_index, 0.0)
                        self.assertLessEqual(result.output_index, 100.0)

    def test_does_not_silently_clip_invalid_values(self) -> None:
        for inputs in (
            {
                "hr_min_pct": -0.1,
                "dias_secos": 0.0,
                "viento_max_ms": 1.0,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
            {
                "hr_min_pct": 50.0,
                "dias_secos": 16.0,
                "viento_max_ms": 1.0,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
            {
                "hr_min_pct": 50.0,
                "dias_secos": 1.0,
                "viento_max_ms": 6.1,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
            {
                "hr_min_pct": 50.0,
                "dias_secos": 1.0,
                "viento_max_ms": 3.0,
                "humedad_suelo_superficial_m3m3": -0.01,
            },
        ):
            with self.subTest(inputs=inputs), self.assertRaises(InputValueError):
                self.system.evaluate(inputs)

    def test_global_sensitivity_has_the_expected_direction(self) -> None:
        def index(
            hr: float, dry_days: float, wind: float, soil_moisture: float = 0.354
        ) -> float:
            return self.system.evaluate(
                {
                    "hr_min_pct": hr,
                    "dias_secos": dry_days,
                    "viento_max_ms": wind,
                    "humedad_suelo_superficial_m3m3": soil_moisture,
                }
            ).output_index

        self.assertGreaterEqual(index(60.0, 15.0, 3.0), index(60.0, 0.0, 3.0))
        self.assertLessEqual(index(100.0, 3.0, 3.0), index(0.0, 3.0, 3.0))
        self.assertGreaterEqual(index(60.0, 3.0, 6.0), index(60.0, 3.0, 0.0))
        self.assertLessEqual(
            index(60.0, 3.0, 3.0, 0.42), index(60.0, 3.0, 3.0, 0.2)
        )

    def test_soil_moisture_changes_the_result_without_replacing_weather(self) -> None:
        dry_soil = self.system.evaluate(
            {
                "hr_min_pct": 60.0,
                "dias_secos": 3.0,
                "viento_max_ms": 3.0,
                "humedad_suelo_superficial_m3m3": 0.2,
            }
        )
        wet_soil = self.system.evaluate(
            {
                "hr_min_pct": 60.0,
                "dias_secos": 3.0,
                "viento_max_ms": 3.0,
                "humedad_suelo_superficial_m3m3": 0.42,
            }
        )
        self.assertGreater(dry_soil.output_index, wet_soil.output_index)


if __name__ == "__main__":
    unittest.main()
