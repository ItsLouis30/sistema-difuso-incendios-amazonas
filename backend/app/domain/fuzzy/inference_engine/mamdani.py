from __future__ import annotations

from collections.abc import Mapping
from math import isfinite

from app.domain.fuzzy.defuzzifier import CentroidDefuzzifier
from app.domain.fuzzy.membership_functions import trapezoidal_membership
from app.domain.model import ActiveRule, FuzzyInferenceError, LinguisticVariable

from app.domain.fuzzy.rule_base import RuleBase


class MamdaniInferenceEngine:
    """Inferencia Mamdani minimo-minimo-maximo con defusificacion centroide."""

    def __init__(
        self,
        rule_base: RuleBase,
        output_variable: LinguisticVariable,
        output_resolution: float,
        defuzzifier: CentroidDefuzzifier | None = None,
    ) -> None:
        if output_resolution <= 0:
            raise ValueError("La resolucion de salida debe ser positiva.")
        self._rule_base = rule_base
        self._output = output_variable
        self._universe = self._build_universe(output_resolution)
        self._output_term_curves = {
            term.name: tuple(
                trapezoidal_membership(value, term.points) for value in self._universe
            )
            for term in output_variable.terms
        }
        self._defuzzifier = defuzzifier or CentroidDefuzzifier()

    @property
    def output_universe(self) -> tuple[float, ...]:
        return self._universe

    @property
    def rule_count(self) -> int:
        return len(self._rule_base.rules)

    def _build_universe(self, step: float) -> tuple[float, ...]:
        minimum = self._output.minimum
        maximum = self._output.maximum
        count = int(round((maximum - minimum) / step))
        values = [minimum + index * step for index in range(count + 1)]
        if values[-1] < maximum - 1e-12:
            values.append(maximum)
        else:
            values[-1] = maximum
        return tuple(values)

    def infer(
        self, input_memberships: Mapping[str, Mapping[str, float]]
    ) -> tuple[float, tuple[ActiveRule, ...], tuple[float, ...]]:
        activations: list[ActiveRule] = []
        aggregate = [0.0] * len(self._universe)

        for rule in self._rule_base.rules:
            try:
                strength = min(
                    input_memberships[variable][term]
                    for variable, term in rule.antecedents.items()
                )
            except KeyError as exc:
                raise FuzzyInferenceError(
                    f"Falta el grado de pertenencia requerido por la regla {rule.number}."
                ) from exc
            if not isfinite(strength) or not 0.0 <= strength <= 1.0:
                raise FuzzyInferenceError(
                    f"La regla {rule.number} recibio un grado fuera de [0, 1]."
                )
            if strength <= 0.0:
                continue

            activations.append(
                ActiveRule(
                    number=rule.number,
                    antecedents=rule.antecedents,
                    consequent=rule.consequent,
                    activation=strength,
                )
            )
            consequent_curve = self._output_term_curves[rule.consequent]
            for index, degree in enumerate(consequent_curve):
                implied_degree = min(strength, degree)
                if implied_degree > aggregate[index]:
                    aggregate[index] = implied_degree

        if not activations:
            raise FuzzyInferenceError("Ninguna regla fue activada por las entradas.")

        output_index = self._defuzzifier.defuzzify(self._universe, aggregate)
        return output_index, tuple(activations), tuple(aggregate)
