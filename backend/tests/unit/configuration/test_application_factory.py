from datetime import date
import unittest

from app.infrastructure.configuration import build_application_services
from tests.helpers import CONFIG_DIRECTORY, REPOSITORY_ROOT


class ApplicationFactoryTests(unittest.TestCase):
    def test_wires_one_model_into_both_use_cases(self) -> None:
        dataset_path = (
            REPOSITORY_ROOT / "data" / "processed" / "weather_inputs_2000_2025.csv"
        )

        services = build_application_services(CONFIG_DIRECTORY, dataset_path)
        historical_result = services.historical_inference.execute(date(2000, 1, 1))
        manual_result = services.manual_inference.execute(
            hr_min_pct=30.0,
            dry_days=8.0,
            wind_max_ms=4.5,
            soil_moisture_m3m3=0.354,
        )

        self.assertEqual(services.weather_history.count(), 9497)
        self.assertEqual(historical_result.inference.model_version, "1.1.0")
        self.assertEqual(manual_result.model_version, "1.1.0")
        self.assertEqual(services.fuzzy_system.metadata.version, "1.1.0")


if __name__ == "__main__":
    unittest.main()
