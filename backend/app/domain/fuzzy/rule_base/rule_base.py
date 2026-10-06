from __future__ import annotations

from collections.abc import Sequence
from itertools import product
from math import prod
from typing import Any, Mapping

from app.domain.model import FuzzyConfigurationError, FuzzyRule, LinguisticVariable


class RuleBase:
    """Base completa de reglas derivada de una FAM multidimensional."""

    def __init__(
        self,
        input_variables: Mapping[str, LinguisticVariable],
        output_variable: LinguisticVariable,
        antecedent_order: Sequence[str],
        term_order: Mapping[str, Sequence[str]],
        fam: Sequence[Any],
        monotonicity: Mapping[str, str],
    ) -> None:
        self._inputs = dict(input_variables)
        self._output = output_variable
        self._input_order = tuple(antecedent_order)
        self._term_order = {name: tuple(terms) for name, terms in term_order.items()}
        self._fam = self._freeze_fam(fam)
        self._monotonicity = dict(monotonicity)
        self._validate_configuration()
        self.rules = self._build_rules()

    def _freeze_fam(self, value: Any) -> Any:
        if isinstance(value, Sequence) and not isinstance(value, (str, bytes)):
            return tuple(self._freeze_fam(item) for item in value)
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise FuzzyConfigurationError("La FAM contiene un valor no entero.") from exc

    def _validate_configuration(self) -> None:
        if len(self._input_order) != len(set(self._input_order)):
            raise FuzzyConfigurationError("El orden de antecedentes contiene duplicados.")
        if set(self._inputs) != set(self._input_order):
            raise FuzzyConfigurationError(
                "El orden de antecedentes no coincide con las variables de entrada."
            )
        for variable_name in self._input_order:
            configured = self._term_order.get(variable_name)
            actual = self._inputs[variable_name].term_names
            if configured != actual:
                raise FuzzyConfigurationError(
                    f"El orden de etiquetas de {variable_name!r} no coincide con su definicion."
                )
        if self._term_order.get(self._output.name) != self._output.term_names:
            raise FuzzyConfigurationError("El orden de las etiquetas de salida no coincide.")

        expected_shape = tuple(len(self._term_order[name]) for name in self._input_order)
        if not self._has_shape(self._fam, expected_shape):
            dimensions = " x ".join(str(size) for size in expected_shape)
            raise FuzzyConfigurationError(f"La FAM debe tener dimensiones {dimensions}.")

        highest_level = len(self._output.terms) - 1
        if any(
            level < 0 or level > highest_level
            for level in self._flatten(self._fam)
        ):
            raise FuzzyConfigurationError("La FAM contiene un nivel de salida inexistente.")
        self._validate_monotonicity()

    def _has_shape(self, value: Any, shape: tuple[int, ...]) -> bool:
        if not shape:
            return isinstance(value, int)
        return (
            isinstance(value, tuple)
            and len(value) == shape[0]
            and all(self._has_shape(item, shape[1:]) for item in value)
        )

    def _flatten(self, value: Any):
        if isinstance(value, tuple):
            for item in value:
                yield from self._flatten(item)
        else:
            yield value

    def _validate_monotonicity(self) -> None:
        if set(self._monotonicity) != set(self._input_order):
            raise FuzzyConfigurationError(
                "Debe definirse la monotonia de cada variable de entrada."
            )
        shape = tuple(len(self._term_order[name]) for name in self._input_order)
        for axis, variable_name in enumerate(self._input_order):
            direction = self._monotonicity[variable_name]
            if direction not in {"increasing", "decreasing"}:
                raise FuzzyConfigurationError(
                    f"Direccion de monotonia invalida para {variable_name!r}."
                )
            other_axes = [range(size) for index, size in enumerate(shape) if index != axis]
            for fixed_indices in product(*other_axes):
                levels = []
                for axis_index in range(shape[axis]):
                    indices = list(fixed_indices)
                    indices.insert(axis, axis_index)
                    levels.append(self._fam_value(tuple(indices)))
                pairs = zip(levels, levels[1:])
                invalid = (
                    any(left > right for left, right in pairs)
                    if direction == "increasing"
                    else any(left < right for left, right in pairs)
                )
                if invalid:
                    raise FuzzyConfigurationError(
                        f"La FAM no es monotona respecto a {variable_name!r}."
                    )

    def _fam_value(self, indices: tuple[int, ...]) -> int:
        value = self._fam
        for index in indices:
            value = value[index]
        return value

    def _build_rules(self) -> tuple[FuzzyRule, ...]:
        output_terms = self._term_order[self._output.name]
        rules: list[FuzzyRule] = []
        shape = tuple(len(self._term_order[name]) for name in self._input_order)
        for number, indices in enumerate(product(*(range(size) for size in shape)), start=1):
            antecedents = {
                name: self._term_order[name][index]
                for name, index in zip(self._input_order, indices)
            }
            rules.append(
                FuzzyRule(
                    number=number,
                    antecedents=antecedents,
                    consequent=output_terms[self._fam_value(indices)],
                )
            )
        if len(rules) != prod(shape):
            raise FuzzyConfigurationError("No se pudo generar la base completa de reglas.")
        return tuple(rules)

    def rule(self, number: int) -> FuzzyRule:
        if not 1 <= number <= len(self.rules):
            raise KeyError(f"No existe la regla {number}.")
        return self.rules[number - 1]
