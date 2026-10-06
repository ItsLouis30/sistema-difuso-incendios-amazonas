from __future__ import annotations

from collections.abc import Mapping

from app.domain.fuzzy.membership_functions import trapezoidal_membership
from app.domain.model import FuzzyInferenceError, LinguisticVariable, OutputAction


class OutputClassifier:
    """Traduce el indice crisp a una categoria linguistica y una accion entendible."""

    def __init__(
        self,
        output_variable: LinguisticVariable,
        actions: Mapping[str, OutputAction],
    ) -> None:
        self._output = output_variable
        self._actions = dict(actions)

    def classify(
        self, value: float
    ) -> tuple[str, str, str, dict[str, float]]:
        if not self._output.minimum <= value <= self._output.maximum:
            raise FuzzyInferenceError(
                f"La salida {value} esta fuera del universo configurado."
            )
        memberships = {
            term.name: trapezoidal_membership(value, term.points)
            for term in self._output.terms
        }
        # enumerate + indice como segundo criterio resuelve empates hacia la categoria mayor.
        selected_index = max(
            range(len(self._output.terms)),
            key=lambda index: (memberships[self._output.terms[index].name], index),
        )
        category = self._output.terms[selected_index].name
        action = self._actions[category]
        return category, action.label, action.recommendation, memberships
