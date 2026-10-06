from datetime import date
import unittest

from app.application.errors import HistoricalDateNotFoundError
from app.application.use_cases import RunHistoricalInference, RunManualInference
from app.domain.model import InputValueError
from app.infrastructure.data.repositories import CsvWeatherHistoryRepository
from tests.helpers import REPOSITORY_ROOT, configured_system


DATASET_PATH = (
    REPOSITORY_ROOT / "data" / "processed" / "weather_inputs_2000_2025.csv"
)


class InferenceUseCaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.system = configured_system()
        cls.repository = CsvWeatherHistoryRepository(DATASET_PATH)
        cls.manual = RunManualInference(cls.system)
        cls.historical = RunHistoricalInference(cls.system, cls.repository)

    def test_manual_use_case_delegates_to_the_configured_mamdani_system(self) -> None:
        result = self.manual.execute(
            hr_min_pct=30.0,
            dry_days=8.0,
            wind_max_ms=4.5,
            soil_moisture_m3m3=0.354,
        )

        self.assertEqual(result.model_version, "1.1.0")
        self.assertEqual(result.output_category, "muy_alto")
        self.assertAlmostEqual(result.output_index, 275.0 / 3.0, delta=0.08)

    def test_manual_use_case_preserves_domain_validation(self) -> None:
        with self.assertRaises(InputValueError):
            self.manual.execute(
                hr_min_pct=30.0,
                dry_days=8.0,
                wind_max_ms=6.1,
                soil_moisture_m3m3=0.354,
            )

    def test_historical_use_case_uses_the_exact_values_for_the_date(self) -> None:
        requested_date = date(2000, 6, 1)
        weather = self.repository.get_by_date(requested_date)
        self.assertIsNotNone(weather)
        assert weather is not None

        result = self.historical.execute(requested_date)
        direct = self.system.evaluate(
            {
                "hr_min_pct": weather.hr_min_pct,
                "dias_secos": weather.dry_days,
                "viento_max_ms": weather.wind_max_ms,
                "humedad_suelo_superficial_m3m3": weather.soil_moisture_m3m3,
            }
        )

        self.assertEqual(result.weather, weather)
        self.assertEqual(result.inference.crisp_inputs, direct.crisp_inputs)
        self.assertAlmostEqual(result.inference.output_index, direct.output_index)
        self.assertTrue(result.within_calibration_season)

    def test_historical_use_case_marks_dates_outside_calibration_season(self) -> None:
        result = self.historical.execute(date(2000, 1, 1))

        self.assertFalse(result.within_calibration_season)
        self.assertIn("exploratoria", result.interpretation_note)

    def test_historical_use_case_reports_the_available_range(self) -> None:
        with self.assertRaises(HistoricalDateNotFoundError) as context:
            self.historical.execute(date(1999, 12, 31))

        self.assertEqual(
            context.exception.available_range,
            (date(2000, 1, 1), date(2025, 12, 31)),
        )


if __name__ == "__main__":
    unittest.main()
