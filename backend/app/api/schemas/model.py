from __future__ import annotations

from .common import ApiModel


class MembershipTermResponse(ApiModel):
    nombre: str
    puntos: tuple[float, float, float, float]


class LinguisticVariableResponse(ApiModel):
    nombre: str
    nombre_visible: str
    unidad: str
    universo: tuple[float, float]
    etiquetas: list[MembershipTermResponse]


class OperatorsResponse(ApiModel):
    and_operator: str
    implicacion: str
    agregacion: str
    defuzzificacion: str


class DataSourceResponse(ApiModel):
    variables_atmosfericas: str
    humedad_suelo: str
    ubicacion: str
    periodo: str
    observacion: str


class ModelResponse(ApiModel):
    model_id: str
    version: str
    tipo: str
    operadores: OperatorsResponse
    entradas: list[LinguisticVariableResponse]
    salida: LinguisticVariableResponse
    total_reglas: int
    fuente_datos: DataSourceResponse
