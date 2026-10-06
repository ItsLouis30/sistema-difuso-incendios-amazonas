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
            input_variables=system.input_variables,
            output_variable=system.output_variable,
            antecedent_order=raw["antecedent_order"],
            term_order=raw["term_order"],
            fam=raw["fam"],
            monotonicity=raw["monotonicity"],
        )

    def test_contains_all_192_unique_combinations(self) -> None:
        self.assertEqual(len(self.rule_base.rules), 192)
        combinations = {
            tuple(rule.antecedents.items()) for rule in self.rule_base.rules
        }
        self.assertEqual(len(combinations), 192)

    def test_numbering_and_extreme_rules(self) -> None:
        first = self.rule_base.rule(1)
        intermediate_first = self.rule_base.rule(65)
        last = self.rule_base.rule(192)
        self.assertEqual(first.consequent, "moderado")
        self.assertEqual(intermediate_first.consequent, "bajo")
        self.assertEqual(last.consequent, "moderado")
        self.assertEqual(first.antecedents["humedad_suelo_superficial_m3m3"], "seca")
        self.assertEqual(last.antecedents["humedad_suelo_superficial_m3m3"], "humeda")
        self.assertEqual(last.antecedents["viento_max_ms"], "alto")
        self.assertEqual(last.antecedents["hr_min_pct"], "alta")
        self.assertEqual(last.antecedents["dias_secos"], "extremos")

    def test_soil_dimension_adjusts_every_original_consequent(self) -> None:
        levels = {name: index for index, name in enumerate(
            ("muy_bajo", "bajo", "moderado", "alto", "muy_alto")
        )}
        for offset in range(64):
            dry = levels[self.rule_base.rule(1 + offset).consequent]
            intermediate = levels[self.rule_base.rule(65 + offset).consequent]
            wet = levels[self.rule_base.rule(129 + offset).consequent]
            self.assertEqual(dry, min(4, intermediate + 1))
            self.assertEqual(wet, max(0, intermediate - 1))


if __name__ == "__main__":
    unittest.main()
