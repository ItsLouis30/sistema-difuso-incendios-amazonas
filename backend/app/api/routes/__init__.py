from .health import router as health_router
from .history import router as history_router
from .inferences import router as inferences_router
from .model import router as model_router

__all__ = ["health_router", "history_router", "inferences_router", "model_router"]
