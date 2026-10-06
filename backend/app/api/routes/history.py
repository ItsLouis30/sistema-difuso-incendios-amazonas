from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_services
from app.api.schemas.history import HistoricalRecordResponse, HistoryRangeResponse
from app.api.serializers import serialize_weather
from app.application.errors import HistoricalDateNotFoundError
from app.infrastructure.configuration import ApplicationServices


router = APIRouter(prefix="/api/v1/history", tags=["history"])


@router.get(
    "/range",
    response_model=HistoryRangeResponse,
    summary="Consultar cobertura de la serie historica",
)
def get_history_range(
    services: Annotated[ApplicationServices, Depends(get_services)],
) -> HistoryRangeResponse:
    first_date, last_date = services.weather_history.available_range()
    return HistoryRangeResponse(
        fecha_inicial=first_date,
        fecha_final=last_date,
        total_registros=services.weather_history.count(),
        frecuencia="diaria",
        zona_horaria="America/Lima",
    )


@router.get(
    "/{record_date}",
    response_model=HistoricalRecordResponse,
    summary="Consultar las variables preparadas de una fecha",
)
def get_historical_record(
    record_date: date,
    services: Annotated[ApplicationServices, Depends(get_services)],
) -> HistoricalRecordResponse:
    record = services.weather_history.get_by_date(record_date)
    if record is None:
        raise HistoricalDateNotFoundError(
            requested_date=record_date,
            available_range=services.weather_history.available_range(),
        )
    return serialize_weather(record)
