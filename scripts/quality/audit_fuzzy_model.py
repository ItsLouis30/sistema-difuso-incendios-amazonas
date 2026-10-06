"""Genera la auditoria reproducible del modelo Mamdani 1.1.0."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import Counter
from itertools import product
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "backend"))

from app.domain.fuzzy.membership_functions import trapezoidal_membership  # noqa: E402
from app.domain.fuzzy.rule_base import RuleBase  # noqa: E402
from app.infrastructure.configuration import load_mamdani_system  # noqa: E402


CONFIG_DIRECTORY = REPOSITORY_ROOT / "config/fuzzy_model/v1"
DATASET_PATH = REPOSITORY_ROOT / "data/processed/weather_inputs_2000_2025.csv"
DEFAULT_RULES_OUTPUT = REPOSITORY_ROOT / "docs/model/audit/rules_v1_1.csv"
DEFAULT_AUDIT_OUTPUT = REPOSITORY_ROOT / "docs/model/audit/audit_v1_1.json"


def load_rule_base(system) -> tuple[RuleBase, dict]:
    with (CONFIG_DIRECTORY / "rule_base.json").open(encoding="utf-8") as file:
        configuration = json.load(file)
    rule_base = RuleBase(
        input_variables=system.input_variables,
        output_variable=system.output_variable,
        antecedent_order=configuration["antecedent_order"],
        term_order=configuration["term_order"],
        fam=configuration["fam"],
        monotonicity=configuration["monotonicity"],
    )
    return rule_base, configuration


def audit_membership_variable(variable, samples: int = 4001) -> dict:
    step = (variable.maximum - variable.minimum) / (samples - 1)
    partition_sums = []
    maximum_degrees = []
    for index in range(samples):
        value = variable.minimum + index * step
        degrees = [
            trapezoidal_membership(value, term.points) for term in variable.terms
        ]
        partition_sums.append(sum(degrees))
        maximum_degrees.append(max(degrees))
    cores = [(term.points[1] + term.points[2]) / 2.0 for term in variable.terms]
    return {
        "universe": [variable.minimum, variable.maximum],
        "unit": variable.unit,
        "terms": [
            {"name": term.name, "points": list(term.points)} for term in variable.terms
        ],
        "ordered_cores": all(left < right for left, right in zip(cores, cores[1:])),
        "uncovered_samples": sum(value <= 1e-12 for value in maximum_degrees),
        "minimum_max_membership": min(maximum_degrees),
        "partition_sum_range": [min(partition_sums), max(partition_sums)],
    }


def audit_dataset_memberships(system) -> dict:
    with DATASET_PATH.open(encoding="utf-8", newline="") as file:
        rows = list(csv.DictReader(file))
    columns = {
        "hr_min_pct": "hr_min_pct",
        "dias_secos": "dias_secos",
        "viento_max_ms": "viento_max_ms",
        "humedad_suelo_superficial_m3m3": "humedad_suelo_superficial_m3m3",
    }
    result = {}
    for variable_name, column in columns.items():
        variable = system.input_variables[variable_name]
        activation_counts = Counter({term.name: 0 for term in variable.terms})
        dominant_counts = Counter({term.name: 0 for term in variable.terms})
        values = []
        for row in rows:
            value = float(row[column])
            values.append(value)
            degrees = {
                term.name: trapezoidal_membership(value, term.points)
                for term in variable.terms
            }
            for name, degree in degrees.items():
                if degree > 0.0:
                    activation_counts[name] += 1
            dominant = max(
                range(len(variable.terms)),
                key=lambda index: (degrees[variable.terms[index].name], index),
            )
            dominant_counts[variable.terms[dominant].name] += 1
        result[variable_name] = {
            "observed_range": [min(values), max(values)],
            "records": len(values),
            "activation_counts": dict(activation_counts),
            "dominant_counts": dict(dominant_counts),
            "all_terms_activated": all(activation_counts.values()),
        }
    return result


def rule_rows(rule_base: RuleBase, output_terms: tuple[str, ...]) -> list[dict]:
    levels = {name: index for index, name in enumerate(output_terms)}
    rows = []
    for rule in rule_base.rules:
        rows.append(
            {
                "numero": rule.number,
                "hr_min_pct": rule.antecedents["hr_min_pct"],
                "dias_secos": rule.antecedents["dias_secos"],
                "viento_max_ms": rule.antecedents["viento_max_ms"],
                "humedad_suelo_superficial_m3m3": rule.antecedents[
                    "humedad_suelo_superficial_m3m3"
                ],
                "salida": rule.consequent,
                "nivel": levels[rule.consequent],
            }
        )
    return rows


def audit_rule_monotonicity(rows: list[dict], configuration: dict) -> dict:
    axes = configuration["antecedent_order"]
    orders = configuration["term_order"]
    directions = configuration["monotonicity"]
    lookup = {
        tuple(row[name] for name in axes): row["nivel"]
        for row in rows
    }
    comparisons = Counter()
    strict_changes = Counter()
    violations = []
    shape = [len(orders[name]) for name in axes]
    for axis, variable_name in enumerate(axes):
        other_ranges = [range(size) for index, size in enumerate(shape) if index != axis]
        for fixed in product(*other_ranges):
            for current in range(shape[axis] - 1):
                left_indices = list(fixed)
                left_indices.insert(axis, current)
                right_indices = list(fixed)
                right_indices.insert(axis, current + 1)
                left_key = tuple(orders[name][index] for name, index in zip(axes, left_indices))
                right_key = tuple(
                    orders[name][index] for name, index in zip(axes, right_indices)
                )
                left_level = lookup[left_key]
                right_level = lookup[right_key]
                comparisons[variable_name] += 1
                direction = directions[variable_name]
                valid = (
                    right_level >= left_level
                    if direction == "increasing"
                    else right_level <= left_level
                )
                if left_level != right_level:
                    strict_changes[variable_name] += 1
                if not valid:
                    violations.append(
                        {
                            "variable": variable_name,
                            "from": dict(zip(axes, left_key)),
                            "to": dict(zip(axes, right_key)),
                            "levels": [left_level, right_level],
                        }
                    )
    return {
        "comparisons_by_variable": dict(comparisons),
        "total_comparisons": sum(comparisons.values()),
        "strict_changes_by_variable": dict(strict_changes),
        "violations": violations,
    }


def audit_guardrails(rows: list[dict]) -> list[dict]:
    lookup = {
        (
            row["hr_min_pct"],
            row["dias_secos"],
            row["viento_max_ms"],
            row["humedad_suelo_superficial_m3m3"],
        ): row
        for row in rows
    }
    checks = (
        {
            "name": "condiciones_benignas_con_suelo_seco",
            "key": ("alta", "cortos", "bajo", "seca"),
            "operator": "maximum",
            "limit": 1,
        },
        {
            "name": "condiciones_extremas_con_suelo_humedo",
            "key": ("muy_baja", "extremos", "alto", "humeda"),
            "operator": "minimum",
            "limit": 3,
        },
        {
            "name": "minimo_peligro",
            "key": ("alta", "cortos", "muy_bajo", "humeda"),
            "operator": "maximum",
            "limit": 0,
        },
        {
            "name": "maximo_peligro",
            "key": ("muy_baja", "extremos", "alto", "seca"),
            "operator": "minimum",
            "limit": 4,
        },
    )
    results = []
    for check in checks:
        row = lookup[check["key"]]
        passed = (
            row["nivel"] <= check["limit"]
            if check["operator"] == "maximum"
            else row["nivel"] >= check["limit"]
        )
        results.append(
            {
                "name": check["name"],
                "antecedents": {
                    "hr_min_pct": check["key"][0],
                    "dias_secos": check["key"][1],
                    "viento_max_ms": check["key"][2],
                    "humedad_suelo_superficial_m3m3": check["key"][3],
                },
                "output": row["salida"],
                "level": row["nivel"],
                "passed": passed,
            }
        )
    return results


def evaluate_scenario(system, name: str, inputs: dict[str, float]) -> dict:
    result = system.evaluate(inputs)
    return {
        "name": name,
        "inputs": inputs,
        "index": result.output_index,
        "category": result.output_category,
        "active_rules": len(result.active_rules),
        "strongest_rule": result.strongest_rules[0].number,
    }


def audit_soil_sensitivity(system) -> dict:
    grid = {
        "hr_min_pct": (30.0, 53.0, 66.0, 85.0),
        "dias_secos": (0.0, 2.0, 4.0, 8.0),
        "viento_max_ms": (1.5, 2.45, 2.95, 4.5),
    }
    soil_values = {"seca": 0.2, "intermedia": 0.354, "humeda": 0.42}
    violations = []
    examples = []
    for hr, dry_days, wind in product(*grid.values()):
        outputs = {}
        for soil_name, soil_value in soil_values.items():
            result = system.evaluate(
                {
                    "hr_min_pct": hr,
                    "dias_secos": dry_days,
                    "viento_max_ms": wind,
                    "humedad_suelo_superficial_m3m3": soil_value,
                }
            )
            outputs[soil_name] = result.output_index
        if not outputs["seca"] >= outputs["intermedia"] >= outputs["humeda"]:
            violations.append(
                {"hr": hr, "dias": dry_days, "viento": wind, "outputs": outputs}
            )
        if (hr, dry_days, wind) == (66.0, 4.0, 2.95):
            examples.append({"inputs": [hr, dry_days, wind], "outputs": outputs})
    return {
        "combinations": 64,
        "evaluations": 192,
        "soil_values": soil_values,
        "violations": violations,
        "examples": examples,
    }


def continuous_soil_diagnostic(system) -> dict:
    scenarios = {
        "benigno": (85.0, 0.0, 1.5),
        "intermedio": (60.0, 3.0, 3.0),
        "extremo": (30.0, 8.0, 4.5),
    }
    result = {}
    category_levels = {
        "muy_bajo": 0,
        "bajo": 1,
        "moderado": 2,
        "alto": 3,
        "muy_alto": 4,
    }
    for name, (hr, dry_days, wind) in scenarios.items():
        values = []
        for index in range(201):
            soil = 0.25 + index * 0.001
            inference = system.evaluate(
                {
                    "hr_min_pct": hr,
                    "dias_secos": dry_days,
                    "viento_max_ms": wind,
                    "humedad_suelo_superficial_m3m3": soil,
                }
            )
            values.append((soil, inference.output_index, inference.output_category))
        reversals = [
            {
                "from_soil": left[0],
                "to_soil": right[0],
                "increase": right[1] - left[1],
            }
            for left, right in zip(values, values[1:])
            if right[1] > left[1] + 1e-9
        ]
        category_reversals = sum(
            category_levels[right[2]] > category_levels[left[2]]
            for left, right in zip(values, values[1:])
        )
        result[name] = {
            "local_reversals": len(reversals),
            "upward_category_reversals": category_reversals,
            "maximum_single_step_reversal": max(
                (item["increase"] for item in reversals), default=0.0
            ),
            "output_range": [
                min(value for _, value, _ in values),
                max(value for _, value, _ in values),
            ],
        }
    return result


def write_rules(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rules-output", type=Path, default=DEFAULT_RULES_OUTPUT)
    parser.add_argument("--audit-output", type=Path, default=DEFAULT_AUDIT_OUTPUT)
    parser.add_argument("--force", action="store_true")
    arguments = parser.parse_args()
    for target in (arguments.rules_output, arguments.audit_output):
        if target.exists() and not arguments.force:
            raise FileExistsError(f"{target} ya existe; use --force para reemplazarlo.")

    system = load_mamdani_system(CONFIG_DIRECTORY)
    rule_base, configuration = load_rule_base(system)
    rows = rule_rows(rule_base, system.output_variable.term_names)
    membership_audit = {
        name: audit_membership_variable(variable)
        for name, variable in {
            **system.input_variables,
            system.output_variable.name: system.output_variable,
        }.items()
    }
    monotonicity = audit_rule_monotonicity(rows, configuration)
    guardrails = audit_guardrails(rows)
    scenarios = [
        evaluate_scenario(
            system,
            "minimo_peligro",
            {
                "hr_min_pct": 85.0,
                "dias_secos": 0.0,
                "viento_max_ms": 1.5,
                "humedad_suelo_superficial_m3m3": 0.42,
            },
        ),
        evaluate_scenario(
            system,
            "maximo_peligro",
            {
                "hr_min_pct": 30.0,
                "dias_secos": 8.0,
                "viento_max_ms": 4.5,
                "humedad_suelo_superficial_m3m3": 0.2,
            },
        ),
        evaluate_scenario(
            system,
            "intermedio",
            {
                "hr_min_pct": 60.0,
                "dias_secos": 3.0,
                "viento_max_ms": 3.0,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
        ),
    ]
    distribution = Counter(row["salida"] for row in rows)
    soil_sensitivity = audit_soil_sensitivity(system)
    continuous_diagnostic = continuous_soil_diagnostic(system)
    warnings = []
    if any(item["local_reversals"] for item in continuous_diagnostic.values()):
        warnings.append(
            "La superficie crisp presenta oscilaciones locales pequenas en transiciones "
            "con consecuentes extremos saturados; no producen ascensos de categoria."
        )
    audit = {
        "model_id": system.metadata.model_id,
        "model_version": system.metadata.version,
        "memberships": membership_audit,
        "dataset_memberships": audit_dataset_memberships(system),
        "rules": {
            "count": len(rows),
            "unique_antecedents": len(
                {
                    (
                        row["hr_min_pct"],
                        row["dias_secos"],
                        row["viento_max_ms"],
                        row["humedad_suelo_superficial_m3m3"],
                    )
                    for row in rows
                }
            ),
            "output_distribution": dict(distribution),
            "monotonicity": monotonicity,
            "guardrails": guardrails,
        },
        "scenarios": scenarios,
        "soil_sensitivity": soil_sensitivity,
        "continuous_soil_diagnostic": continuous_diagnostic,
        "warnings": warnings,
    }
    audit["passed"] = (
        all(item["uncovered_samples"] == 0 for item in membership_audit.values())
        and all(item["ordered_cores"] for item in membership_audit.values())
        and not monotonicity["violations"]
        and all(item["passed"] for item in guardrails)
        and not soil_sensitivity["violations"]
        and len(rows) == 192
        and all(
            item["upward_category_reversals"] == 0
            for item in continuous_diagnostic.values()
        )
    )
    audit["status"] = (
        "approved_with_observations" if audit["passed"] and warnings else "approved"
    )
    write_rules(arguments.rules_output, rows)
    arguments.audit_output.parent.mkdir(parents=True, exist_ok=True)
    arguments.audit_output.write_text(
        json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Auditoria generada: {arguments.audit_output}")
    print(f"Resultado general: {audit['status'] if audit['passed'] else 'review_required'}")


if __name__ == "__main__":
    main()
