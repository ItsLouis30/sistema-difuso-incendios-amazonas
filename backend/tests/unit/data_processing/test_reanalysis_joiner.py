import unittest
from dataclasses import replace
from datetime import date

from app.domain.data_processing import DryDayCounter, ReanalysisJoiner
from app.domain.model import (
    AtmosphericRecord,
    DataValidationError,
    DryDayObservation,
    SoilMoistureRecord,
)
from app.infrastructure.data.loaders import (
    OpenMeteoAtmosphericCsvLoader,
    OpenMeteoSoilMoistureCsvLoader,
)
from tests.helpers import REPOSITORY_ROOT


def weather(day: str, **changes) -> AtmosphericRecord:
    base = AtmosphericRecord(
        date=date.fromisoformat(day),
        pp_mm=0.0,
        hr_min_pct=50.0,
        wind_mean_ms=1.0,
        wind_max_ms=2.0,
    )
    return replace(base, **changes)


class ReanalysisJoinerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.joiner = ReanalysisJoiner(maximum_dry_days=15, maximum_wind_ms=6.0)

    def test_joins_the_two_complete_historical_sources(self) -> None:
        atmospheric_path = (
            REPOSITORY_ROOT
            / "data/raw/era5_atmospheric_chachapoyas_2000_2025.csv"
        )
        soil_path = (
            REPOSITORY_ROOT
            / "data/raw/era5_land_soil_moisture_chachapoyas_2000_2025.csv"
        )
        atmospheric = OpenMeteoAtmosphericCsvLoader().load(atmospheric_path).records
        soil = OpenMeteoSoilMoistureCsvLoader().load(soil_path).records
        dry_days = DryDayCounter().calculate(atmospheric)
        prepared = self.joiner.join(atmospheric, dry_days, soil)

        self.assertEqual(len(prepared), 9497)
        self.assertEqual(prepared[0].date.isoformat(), "2000-01-01")
        self.assertEqual(prepared[-1].date.isoformat(), "2025-12-31")
        self.assertEqual(prepared[0].dry_days, 0)
        self.assertAlmostEqual(prepared[0].soil_moisture_m3m3, 0.411)

    def test_rejects_different_date_sets(self) -> None:
        atmospheric = (weather("2020-01-01"), weather("2020-01-02"))
        dry_days = DryDayCounter().calculate(atmospheric)
        soil = (SoilMoistureRecord(date=date(2020, 1, 1), soil_moisture_m3m3=0.3),)
        with self.assertRaises(DataValidationError):
            self.joiner.join(atmospheric, dry_days, soil)

    def test_rejects_missing_or_out_of_universe_inputs(self) -> None:
        base_weather = weather("2020-01-01", pp_mm=2.0)
        soil = (SoilMoistureRecord(date=date(2020, 1, 1), soil_moisture_m3m3=0.3),)
        cases = (
            (
                (replace(base_weather, hr_min_pct=None),),
                (DryDayObservation(date=date(2020, 1, 1), precipitation_mm=2.0, dry_days=0),),
            ),
            (
                (replace(base_weather, wind_max_ms=6.1),),
                (DryDayObservation(date=date(2020, 1, 1), precipitation_mm=2.0, dry_days=0),),
            ),
            (
                (base_weather,),
                (DryDayObservation(date=date(2020, 1, 1), precipitation_mm=2.0, dry_days=16),),
            ),
        )
        for atmospheric, dry_days in cases:
            with self.subTest(atmospheric=atmospheric), self.assertRaises(
                DataValidationError
            ):
                self.joiner.join(atmospheric, dry_days, soil)


if __name__ == "__main__":
    unittest.main()
