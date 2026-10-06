from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from types import MappingProxyType
from typing import Mapping

from .errors import FuzzyConfigurationError


@dataclass(frozen=True, slots=True)
class MembershipTerm:
    name: str
    points: tuple[float, float, float, float]

    def __post_init__(self) -> None:
        if not self.name:
            raise FuzzyConfigurationError("Una etiqueta linguistica no puede estar vacia.")
        if len(self.points) != 4 or not all(isfinite(value) for value in self.points):
            raise FuzzyConfigurationError(f"Puntos invalidos para la etiqueta {self.name!r}.")
        if tuple(sorted(self.points)) != self.points:
            raise FuzzyConfigurationError(
                f"Los puntos de {self.name!r} deben cumplir a <= b <= c <= d."
            )


@dataclass(frozen=True, slots=True)
class LinguisticVariable:
    name: str
    display_name: str
    unit: str
    minimum: float
    maximum: float
    terms: tuple[MembershipTerm, ...]

    def __post_init__(self) -> None:
        if not self.name or not isfinite(self.minimum) or not isfinite(self.maximum):
            raise FuzzyConfigurationError("Definicion de variable linguistica invalida.")
        if self.minimum >= self.maximum:
            raise FuzzyConfigurationError(f"Universo invalido para {self.name!r}.")
        if not self.terms:
            raise FuzzyConfigurationError(f"{self.name!r} no tiene etiquetas linguisticas.")
        names = [term.name for term in self.terms]
        if len(names) != len(set(names)):
            raise FuzzyConfigurationError(f"Hay etiquetas duplicadas en {self.name!r}.")
        for term in self.terms:
            if term.points[0] < self.minimum or term.points[3] > self.maximum:
                raise FuzzyConfigurationError(
                    f"La etiqueta {term.name!r} excede el universo de {self.name!r}."
                )

    @property
    def term_names(self) -> tuple[str, ...]:
        return tuple(term.name for term in self.terms)

    def term(self, name: str) -> MembershipTerm:
        try:
            return next(term for term in self.terms if term.name == name)
        except StopIteration as exc:
            raise FuzzyConfigurationError(
                f"La etiqueta {name!r} no existe en {self.name!r}."
            ) from exc


@dataclass(frozen=True, slots=True)
class FuzzyRule:
    number: int
    antecedents: Mapping[str, str]
    consequent: str

    def __post_init__(self) -> None:
        if self.number < 1:
            raise FuzzyConfigurationError("El numero de regla debe ser positivo.")
        if not self.antecedents or not self.consequent:
            raise FuzzyConfigurationError(f"La regla {self.number} esta incompleta.")
        object.__setattr__(self, "antecedents", MappingProxyType(dict(self.antecedents)))


@dataclass(frozen=True, slots=True)
class ActiveRule:
    number: int
    antecedents: Mapping[str, str]
    consequent: str
    activation: float

    def __post_init__(self) -> None:
        object.__setattr__(self, "antecedents", MappingProxyType(dict(self.antecedents)))


@dataclass(frozen=True, slots=True)
class OutputAction:
    name: str
    label: str
    recommendation: str


@dataclass(frozen=True, slots=True)
class ModelMetadata:
    model_id: str
    version: str
    model_type: str
    and_operator: str
    implication_operator: str
    aggregation_operator: str
    defuzzification_method: str
    output_resolution: float


@dataclass(frozen=True, slots=True)
class InferenceResult:
    model_id: str
    model_version: str
    crisp_inputs: Mapping[str, float]
    input_memberships: Mapping[str, Mapping[str, float]]
    active_rules: tuple[ActiveRule, ...]
    output_index: float
    output_category: str
    output_label: str
    output_memberships: Mapping[str, float]
    recommendation: str
    output_curve: tuple[tuple[float, float], ...]

    def __post_init__(self) -> None:
        object.__setattr__(self, "crisp_inputs", MappingProxyType(dict(self.crisp_inputs)))
        memberships = {
            variable: MappingProxyType(dict(degrees))
            for variable, degrees in self.input_memberships.items()
        }
        object.__setattr__(self, "input_memberships", MappingProxyType(memberships))
        object.__setattr__(
            self, "output_memberships", MappingProxyType(dict(self.output_memberships))
        )

    @property
    def strongest_rules(self) -> tuple[ActiveRule, ...]:
        return tuple(
            sorted(self.active_rules, key=lambda rule: (-rule.activation, rule.number))
        )

