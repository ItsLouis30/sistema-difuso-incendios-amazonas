import unittest

from app.domain.fuzzy.rule_base import RuleBase
from tests.helpers import CONFIG_DIRECTORY, configured_system
import json


class RuleBaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        system = configured_system()
        with (CONFIG_DIRECTORY / "rule_base.json").open(encoding="utf-8") as file:
            raw = json.load(file)
        cls.rule_base = RuleBase(
            system.input_variables, system.output_variable, raw["term_order"], raw["fam"]
        )

    def test_contains_all_64_unique_combinations(self) -> None:
        self.assertEqual(len(self.rule_base.rules), 64)
        combinations = {
            tuple(rule.antecedents.items()) for rule in self.rule_base.rules
        }
        self.assertEqual(len(combinations), 64)

    def test_numbering_and_extreme_rules(self) -> None:
        first = self.rule_base.rule(1)
        last = self.rule_base.rule(64)
        self.assertEqual(first.consequent, "bajo")
        self.assertEqual(last.consequent, "alto")
        self.assertEqual(last.antecedents["viento_max_ms"], "alto")
        self.assertEqual(last.antecedents["hr_min_pct"], "alta")
        self.assertEqual(last.antecedents["dias_secos"], "extremos")


if __name__ == "__main__":
    unittest.main()
