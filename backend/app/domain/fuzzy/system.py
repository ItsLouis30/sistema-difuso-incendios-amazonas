from __future__ import annotations

from collections.abc import Mapping

from app.domain.fuzzy.explanation import OutputClassifier
from app.domain.fuzzy.fuzzifier import SingletonFuzzifier
from app.domain.fuzzy.inference_engine import MamdaniInferenceEngine
from app.domain.model import (
    InferenceResult,
    LinguisticVariable,
    ModelMetadata,
    OutputAction,
)


class MamdaniSystem:
    """Fachada del dominio que ejecuta la cascada completa del sistema difuso."""

    def __init__(
        self,
        metadata: ModelMetadata,
        input_variables: Mapping[str, LinguisticVariable],
        output_variable: LinguisticVariable,
        fuzzifier: SingletonFuzzifier,
        inference_engine: MamdaniInferenceEngine,
        classifier: OutputClassifier,
    ) -> None:
        self.metadata = metadata
        self.input_variables = dict(input_variables)
        self.output_variable = output_variable
        self._fuzzifier = fuzzifier
        self._engine = inference_engine
        self._classifier = classifier

    @property
    def rule_count(self) -> int:
        return self._engine.rule_count

    def evaluate(self, crisp_inputs: Mapping[str, float]) -> InferenceResult:
        memberships = self._fuzzifier.fuzzify(crisp_inputs)
        normalized_inputs = {name: float(value) for name, value in crisp_inputs.items()}
        output_index, active_rules, aggregated_curve = self._engine.infer(memberships)
        category, label, recommendation, output_memberships = self._classifier.classify(
            output_index
        )
        output_curve = tuple(zip(self._engine.output_universe, aggregated_curve))
        return InferenceResult(
            model_id=self.metadata.model_id,
            model_version=self.metadata.version,
            crisp_inputs=normalized_inputs,
            input_memberships=memberships,
            active_rules=active_rules,
            output_index=output_index,
            output_category=category,
            output_label=label,
            output_memberships=output_memberships,
            recommendation=recommendation,
            output_curve=output_curve,
        )
