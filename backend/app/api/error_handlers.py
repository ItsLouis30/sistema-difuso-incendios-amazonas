from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.application.errors import HistoricalDateNotFoundError
from app.domain.model import InputValueError


def _error_response(
    status_code: int,
    code: str,
    message: str,
    *,
    field: str | None = None,
    details: list[dict[str, object]] | None = None,
) -> JSONResponse:
    error: dict[str, object] = {"code": code, "message": message}
    if field is not None:
        error["field"] = field
    if details is not None:
        error["details"] = details
    return JSONResponse(status_code=status_code, content={"error": error})


def register_error_handlers(application: FastAPI) -> None:
    @application.exception_handler(RequestValidationError)
    async def request_validation_handler(
        _request: Request, exception: RequestValidationError
    ) -> JSONResponse:
        details = [
            {
                "field": ".".join(str(part) for part in error["loc"] if part != "body"),
                "message": error["msg"],
                "type": error["type"],
            }
            for error in exception.errors()
        ]
        return _error_response(
            422,
            "VALIDATION_ERROR",
            "La solicitud contiene datos invalidos.",
            details=details,
        )

    @application.exception_handler(InputValueError)
    async def input_value_handler(
        _request: Request, exception: InputValueError
    ) -> JSONResponse:
        return _error_response(422, "INPUT_OUT_OF_DOMAIN", str(exception))

    @application.exception_handler(HistoricalDateNotFoundError)
    async def historical_date_handler(
        _request: Request, exception: HistoricalDateNotFoundError
    ) -> JSONResponse:
        return _error_response(404, "HISTORICAL_DATE_NOT_FOUND", str(exception))
