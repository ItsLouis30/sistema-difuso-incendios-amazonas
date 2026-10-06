import unittest

from app.domain.fuzzy.defuzzifier import CentroidDefuzzifier
from app.domain.model import FuzzyInferenceError


class CentroidDefuzzifierTests(unittest.TestCase):
    def setUp(self) -> None:
        self.defuzzifier = CentroidDefuzzifier()

    def test_centroid_of_symmetric_triangle(self) -> None:
        universe = (0.0, 5.0, 10.0)
        membership = (0.0, 1.0, 0.0)
        self.assertAlmostEqual(
            self.defuzzifier.defuzzify(universe, membership), 5.0
        )

    def test_rejects_zero_area(self) -> None:
        with self.assertRaises(FuzzyInferenceError):
            self.defuzzifier.defuzzify((0.0, 1.0), (0.0, 0.0))


if __name__ == "__main__":
    unittest.main()

