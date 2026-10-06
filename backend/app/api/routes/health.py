from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.get("/health", summary="Comprobar disponibilidad del backend")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sistema-difuso-g8-backend"}
