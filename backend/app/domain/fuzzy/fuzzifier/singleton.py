from __future__ import annotations

from math import isfinite
from typing import Mapping

from app.domain.fuzzy.membership_functions import trapezoidal_membership
from app.domain.model import InputValueError, LinguisticVariable


class SingletonFuzzifier:
    """Convierte entradas crisp en grados de pertenencia entre cero y uno."""

    def __init__(self, variables: Mapping[str, LinguisticVariable]) -> None:
        self._variables = dict(variables)

    def fuzzify(self, crisp_inputs: Mapping[str, float]) -> dict[str, dict[str, float]]:
        expected = set(self._variables)
        received = set(crisp_inputs)
        missing = sorted(expected - received)
        unknown = sorted(received - expected)
        if missing:
            raise InputValueError(f"Faltan entradas obligatorias: {', '.join(missing)}.")
        if unknown:
            raise InputValueError(f"Entradas no reconocidas: {', '.join(unknown)}.")

        result: dict[str, dict[str, float]] = {}
        for name, variable in self._variables.items():
            raw_value = crisp_inputs[name]
            if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
                raise InputValueError(f"{name} debe ser un numero.")
            value = float(raw_value)
            if not isfinite(value):
                raise InputValueError(f"{name} debe ser un numero finito.")
            if not variable.minimum <= value <= variable.maximum:
                raise InputValueError(
                    f"{name}={value} esta fuera del universo "
                    f"[{variable.minimum}, {variable.maximum}] {variable.unit}."
                )

            degrees = {
                # La normalizacion evita que errores binarios minimos alteren
                # el orden de reglas que matematicamente tienen igual fuerza.
                term.name: round(trapezoidal_membership(value, term.points), 12)
                for term in variable.terms
            }
            if max(degrees.values(), default=0.0) <= 0.0:
                raise InputValueError(
                    f"{name}={value} no esta cubierto por las funciones de pertenencia."
                )
            result[name] = degrees
        return result
