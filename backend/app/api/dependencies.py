from fastapi import Request

from app.infrastructure.configuration import ApplicationServices


def get_services(request: Request) -> ApplicationServices:
    return request.app.state.services
