import csv
import json
import unittest

from tests.helpers import REPOSITORY_ROOT


class ModelAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        audit_path = REPOSITORY_ROOT / "docs/model/audit/audit_v1_1.json"
        rules_path = REPOSITORY_ROOT / "docs/model/audit/rules_v1_1.csv"
        with audit_path.open(encoding="utf-8") as file:
            cls.audit = json.load(file)
        with rules_path.open(encoding="utf-8", newline="") as file:
            cls.rules = list(csv.DictReader(file))

    def test_all_membership_partitions_are_complete_and_ordered(self) -> None:
        for name, result in self.audit["memberships"].items():
            with self.subTest(variable=name):
                self.assertEqual(result["uncovered_samples"], 0)
                self.assertTrue(result["ordered_cores"])
                self.assertAlmostEqual(result["partition_sum_range"][0], 1.0)
                self.assertAlmostEqual(result["partition_sum_range"][1], 1.0)

    def test_all_rules_are_unique_monotone_and_use_every_output(self) -> None:
        rules = self.audit["rules"]
        self.assertEqual(len(self.rules), 192)
        self.assertEqual(rules["count"], 192)
        self.assertEqual(rules["unique_antecedents"], 192)
        self.assertEqual(rules["monotonicity"]["total_comparisons"], 560)
        self.assertFalse(rules["monotonicity"]["violations"])
        self.assertEqual(
            set(rules["output_distribution"]),
            {"muy_bajo", "bajo", "moderado", "alto", "muy_alto"},
        )

    def test_semantic_guardrails_and_extreme_scenarios_pass(self) -> None:
        self.assertTrue(all(item["passed"] for item in self.audit["rules"]["guardrails"]))
        scenarios = {item["name"]: item for item in self.audit["scenarios"]}
        self.assertEqual(scenarios["minimo_peligro"]["category"], "muy_bajo")
        self.assertEqual(scenarios["maximo_peligro"]["category"], "muy_alto")

    def test_soil_sensitivity_has_no_decision_reversals(self) -> None:
        self.assertFalse(self.audit["soil_sensitivity"]["violations"])
        for diagnostic in self.audit["continuous_soil_diagnostic"].values():
            self.assertEqual(diagnostic["upward_category_reversals"], 0)
        self.assertTrue(self.audit["passed"])
        self.assertEqual(self.audit["status"], "approved_with_observations")


if __name__ == "__main__":
    unittest.main()

