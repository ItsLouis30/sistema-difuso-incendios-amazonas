from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_services
from app.api.schemas.model import ModelResponse, RulesResponse
from app.api.serializers import serialize_variable
from app.infrastructure.configuration import ApplicationServices


router = APIRouter(prefix="/api/v1", tags=["model"])


@router.get(
    "/model",
    response_model=ModelResponse,
    summary="Consultar la definicion versionada del modelo Mamdani",
)
def get_model(
    services: Annotated[ApplicationServices, Depends(get_services)],
) -> ModelResponse:
    system = services.fuzzy_system
    metadata = system.metadata
    return ModelResponse(
        model_id=metadata.model_id,
        version=metadata.version,
        tipo=metadata.model_type,
        operadores={
            "and_operator": metadata.and_operator,
            "implicacion": metadata.implication_operator,
            "agregacion": metadata.aggregation_operator,
            "defuzzificacion": metadata.defuzzification_method,
        },
        entradas=[
            serialize_variable(variable) for variable in system.input_variables.values()
        ],
        salida=serialize_variable(system.output_variable),
        total_reglas=system.rule_count,
        fuente_datos={
            "variables_atmosfericas": "ERA5 mediante Open-Meteo Historical Weather API",
            "humedad_suelo": "ERA5-Land mediante Open-Meteo Historical Weather API",
            "ubicacion": "Entorno de Chachapoyas, Amazonas, Peru",
            "periodo": "2000-01-01 a 2025-12-31",
            "observacion": (
                "Datos de reanalisis de celdas proximas; no son observaciones "
                "de la estacion SENAMHI 000375."
            ),
        },
    )


@router.get(
    "/rules",
    response_model=RulesResponse,
    summary="Consultar la base de reglas que utiliza el motor Mamdani",
)
def get_rules(
    services: Annotated[ApplicationServices, Depends(get_services)],
) -> RulesResponse:
    system = services.fuzzy_system
    return RulesResponse(
        model_id=system.metadata.model_id,
        model_version=system.metadata.version,
        total_reglas=system.rule_count,
        reglas=[
            {
                "numero": rule.number,
                "antecedentes": dict(rule.antecedents),
                "consecuente": rule.consequent,
            }
            for rule in system.rules
        ],
    )
