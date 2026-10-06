from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.domain.fuzzy import MamdaniSystem
from app.domain.fuzzy.explanation import OutputClassifier
from app.domain.fuzzy.fuzzifier import SingletonFuzzifier
from app.domain.fuzzy.inference_engine import MamdaniInferenceEngine
from app.domain.fuzzy.rule_base import RuleBase
from app.domain.model import (
    FuzzyConfigurationError,
    LinguisticVariable,
    MembershipTerm,
    ModelMetadata,
    OutputAction,
)


def _read_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError as exc:
        raise FuzzyConfigurationError(f"No existe el archivo de configuracion {path}.") from exc
    except json.JSONDecodeError as exc:
        raise FuzzyConfigurationError(f"JSON invalido en {path}: {exc.msg}.") from exc
    if not isinstance(data, dict):
        raise FuzzyConfigurationError(f"La raiz de {path} debe ser un objeto JSON.")
    return data


def _variable(name: str, raw: dict[str, Any]) -> LinguisticVariable:
    try:
        universe = raw["universe"]
        terms = tuple(
            MembershipTerm(
                name=term["name"],
                points=tuple(float(point) for point in term["points"]),
            )
            for term in raw["terms"]
        )
        return LinguisticVariable(
            name=name,
            display_name=raw["display_name"],
            unit=raw["unit"],
            minimum=float(universe[0]),
            maximum=float(universe[1]),
            terms=terms,
        )
    except (KeyError, IndexError, TypeError, ValueError) as exc:
        raise FuzzyConfigurationError(f"Definicion invalida para la variable {name!r}.") from exc


def load_mamdani_system(config_directory: str | Path) -> MamdaniSystem:
    """Construye el sistema a partir de una version explicita de la configuracion."""
    directory = Path(config_directory)
    model_data = _read_json(directory / "model.json")
    membership_data = _read_json(directory / "membership_functions.json")
    rules_data = _read_json(directory / "rule_base.json")
    actions_data = _read_json(directory / "output_actions.json")

    try:
        metadata = ModelMetadata(
            model_id=model_data["model_id"],
            version=model_data["version"],
            model_type=model_data["model_type"],
            and_operator=model_data["and_operator"],
            implication_operator=model_data["implication_operator"],
            aggregation_operator=model_data["aggregation_operator"],
            defuzzification_method=model_data["defuzzification_method"],
            output_resolution=float(model_data["output_resolution"]),
        )
        if (
            metadata.model_type,
            metadata.and_operator,
            metadata.implication_operator,
            metadata.aggregation_operator,
            metadata.defuzzification_method,
        ) != ("mamdani", "minimum", "minimum", "maximum", "centroid"):
            raise FuzzyConfigurationError(
                "La version actual solo admite Mamdani minimo-minimo-maximo con centroide."
            )

        input_variables = {
            name: _variable(name, raw)
            for name, raw in membership_data["inputs"].items()
        }
        output_raw = membership_data["output"]
        output_variable = _variable(output_raw["name"], output_raw)
        actions = {
            name: OutputAction(
                name=name,
                label=raw["label"],
                recommendation=raw["recommendation"],
            )
            for name, raw in actions_data.items()
        }
    except (KeyError, TypeError, ValueError) as exc:
        raise FuzzyConfigurationError("La configuracion del modelo esta incompleta.") from exc

    if set(actions) != set(output_variable.term_names):
        raise FuzzyConfigurationError("Debe existir una accion para cada etiqueta de salida.")

    rule_base = RuleBase(
        input_variables=input_variables,
        output_variable=output_variable,
        term_order=rules_data.get("term_order", {}),
        fam=rules_data.get("fam", []),
    )
    fuzzifier = SingletonFuzzifier(input_variables)
    engine = MamdaniInferenceEngine(
        rule_base=rule_base,
        output_variable=output_variable,
        output_resolution=metadata.output_resolution,
    )
    classifier = OutputClassifier(output_variable, actions)
    return MamdaniSystem(
        metadata=metadata,
        input_variables=input_variables,
        output_variable=output_variable,
        fuzzifier=fuzzifier,
        inference_engine=engine,
        classifier=classifier,
    )
