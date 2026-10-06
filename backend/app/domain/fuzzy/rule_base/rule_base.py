from __future__ import annotations

from collections.abc import Sequence
from itertools import product
from typing import Mapping

from app.domain.model import FuzzyConfigurationError, FuzzyRule, LinguisticVariable


class RuleBase:
    """Base completa de 64 reglas derivada de la matriz asociativa difusa."""

    INPUT_ORDER = ("viento_max_ms", "hr_min_pct", "dias_secos")

    def __init__(
        self,
        input_variables: Mapping[str, LinguisticVariable],
        output_variable: LinguisticVariable,
        term_order: Mapping[str, Sequence[str]],
        fam: Sequence[Sequence[Sequence[int]]],
    ) -> None:
        self._inputs = dict(input_variables)
        self._output = output_variable
        self._term_order = {name: tuple(terms) for name, terms in term_order.items()}
        self._fam = tuple(
            tuple(tuple(int(level) for level in humidity_row) for humidity_row in wind_matrix)
            for wind_matrix in fam
        )
        self._validate_configuration()
        self.rules = self._build_rules()

    def _validate_configuration(self) -> None:
        if set(self._inputs) != set(self.INPUT_ORDER):
            raise FuzzyConfigurationError(
                f"La base requiere exactamente estas entradas: {', '.join(self.INPUT_ORDER)}."
            )
        for variable_name in self.INPUT_ORDER:
            configured = self._term_order.get(variable_name)
            actual = self._inputs[variable_name].term_names
            if configured != actual:
                raise FuzzyConfigurationError(
                    f"El orden de etiquetas de {variable_name!r} no coincide con su definicion."
                )
        if self._term_order.get(self._output.name) != self._output.term_names:
            raise FuzzyConfigurationError("El orden de las etiquetas de salida no coincide.")

        expected_shape = (4, 4, 4)
        shape_is_valid = (
            len(self._fam) == expected_shape[0]
            and all(len(matrix) == expected_shape[1] for matrix in self._fam)
            and all(len(row) == expected_shape[2] for matrix in self._fam for row in matrix)
        )
        if not shape_is_valid:
            raise FuzzyConfigurationError("La FAM debe tener dimensiones 4 x 4 x 4.")

        highest_level = len(self._output.terms) - 1
        if any(
            level < 0 or level > highest_level
            for matrix in self._fam
            for row in matrix
            for level in row
        ):
            raise FuzzyConfigurationError("La FAM contiene un nivel de salida inexistente.")
        self._validate_monotonicity()

    def _validate_monotonicity(self) -> None:
        # Mas dias secos o mas viento no deben reducir el despliegue.
        for wind_index in range(4):
            for humidity_index in range(4):
                row = self._fam[wind_index][humidity_index]
                if any(left > right for left, right in zip(row, row[1:])):
                    raise FuzzyConfigurationError("La FAM no es monotona respecto a dias secos.")
        for humidity_index, dry_index in product(range(4), range(4)):
            levels = [self._fam[w][humidity_index][dry_index] for w in range(4)]
            if any(left > right for left, right in zip(levels, levels[1:])):
                raise FuzzyConfigurationError("La FAM no es monotona respecto al viento.")
        # Mayor HR implica menor o igual sequedad potencial.
        for wind_index, dry_index in product(range(4), range(4)):
            levels = [self._fam[wind_index][h][dry_index] for h in range(4)]
            if any(left < right for left, right in zip(levels, levels[1:])):
                raise FuzzyConfigurationError("La FAM invierte la relacion esperada con la HR.")

    def _build_rules(self) -> tuple[FuzzyRule, ...]:
        output_terms = self._term_order[self._output.name]
        rules: list[FuzzyRule] = []
        for wind_index, humidity_index, dry_index in product(range(4), repeat=3):
            number = 16 * wind_index + 4 * humidity_index + dry_index + 1
            antecedents = {
                "viento_max_ms": self._term_order["viento_max_ms"][wind_index],
                "hr_min_pct": self._term_order["hr_min_pct"][humidity_index],
                "dias_secos": self._term_order["dias_secos"][dry_index],
            }
            rules.append(
                FuzzyRule(
                    number=number,
                    antecedents=antecedents,
                    consequent=output_terms[self._fam[wind_index][humidity_index][dry_index]],
                )
            )
        return tuple(rules)

    def rule(self, number: int) -> FuzzyRule:
        if not 1 <= number <= len(self.rules):
            raise KeyError(f"No existe la regla {number}.")
        return self.rules[number - 1]
