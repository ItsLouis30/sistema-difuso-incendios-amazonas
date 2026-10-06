from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_services
from app.api.schemas.inference import InferenceRequest, InferenceResponse, ManualSource
from app.api.serializers import historical_source, serialize_inference
from app.infrastructure.configuration import ApplicationServices


router = APIRouter(prefix="/api/v1/inferences", tags=["inferences"])


@router.post(
    "",
    response_model=InferenceResponse,
    summary="Ejecutar una inferencia manual",
)
def run_manual_inference(
    request: InferenceRequest,
    services: Annotated[ApplicationServices, Depends(get_services)],
) -> InferenceResponse:
    result = services.manual_inference.execute(
        hr_min_pct=request.hr_min_pct,
        dry_days=request.dias_secos,
        wind_max_ms=request.viento_max_ms,
        soil_moisture_m3m3=request.humedad_suelo_superficial_m3m3,
    )
    return serialize_inference(result, mode="manual", source=ManualSource())


@router.get(
    "/history/{record_date}",
    response_model=InferenceResponse,
    summary="Ejecutar una inferencia con los datos de una fecha",
)
def run_historical_inference(
    record_date: date,
    services: Annotated[ApplicationServices, Depends(get_services)],
) -> InferenceResponse:
    result = services.historical_inference.execute(record_date)
    source = historical_source(
        result.weather,
        services.weather_history.source_path,
        result.within_calibration_season,
        result.interpretation_note,
    )
    return serialize_inference(result.inference, mode="historical", source=source)
