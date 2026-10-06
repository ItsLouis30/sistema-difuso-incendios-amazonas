import unittest

from app.domain.fuzzy.membership_functions import trapezoidal_membership


class TrapezoidalMembershipTests(unittest.TestCase):
    def test_regular_trapezoid(self) -> None:
        points = (0.0, 2.0, 4.0, 6.0)
        self.assertEqual(trapezoidal_membership(-1.0, points), 0.0)
        self.assertEqual(trapezoidal_membership(0.0, points), 0.0)
        self.assertEqual(trapezoidal_membership(1.0, points), 0.5)
        self.assertEqual(trapezoidal_membership(3.0, points), 1.0)
        self.assertEqual(trapezoidal_membership(5.0, points), 0.5)
        self.assertEqual(trapezoidal_membership(6.0, points), 0.0)

    def test_left_and_right_shoulders(self) -> None:
        self.assertEqual(
            trapezoidal_membership(0.0, (0.0, 0.0, 10.0, 20.0)), 1.0
        )
        self.assertEqual(
            trapezoidal_membership(100.0, (80.0, 90.0, 100.0, 100.0)), 1.0
        )


if __name__ == "__main__":
    unittest.main()

