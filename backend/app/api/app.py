from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.error_handlers import register_error_handlers
from app.api.routes import health_router, history_router, inferences_router, model_router
from app.infrastructure.configuration import build_application_services


BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
DEFAULT_CONFIG_DIRECTORY = REPOSITORY_ROOT / "config" / "fuzzy_model" / "v1"
DEFAULT_DATASET_PATH = (
    REPOSITORY_ROOT / "data" / "processed" / "weather_inputs_2000_2025.csv"
)


def create_app(
    config_directory: str | Path = DEFAULT_CONFIG_DIRECTORY,
    dataset_path: str | Path = DEFAULT_DATASET_PATH,
) -> FastAPI:
    application = FastAPI(
        title="Sistema Difuso G8 API",
        version="1.0.0",
        description=(
            "API del sistema Mamdani para preparacion preventiva ante condiciones "
            "meteorologicas favorables a incendios forestales en Chachapoyas."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
    )
    application.state.services = build_application_services(
        config_directory=config_directory,
        dataset_path=dataset_path,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
    register_error_handlers(application)
    application.include_router(health_router)
    application.include_router(model_router)
    application.include_router(inferences_router)
    application.include_router(history_router)
    return application
