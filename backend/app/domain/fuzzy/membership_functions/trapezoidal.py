from __future__ import annotations

from math import isfinite

from app.domain.model.errors import InputValueError


def trapezoidal_membership(
    value: float, points: tuple[float, float, float, float]
) -> float:
    """Evalua una funcion trapezoidal, incluidos hombros con a=b o c=d."""
    if not isfinite(value):
        raise InputValueError("La funcion de pertenencia requiere un valor finito.")

    a, b, c, d = points
    if value < a or value > d:
        return 0.0
    if b <= value <= c:
        return 1.0
    if a <= value < b:
        return 1.0 if a == b else (value - a) / (b - a)
    if c < value <= d:
        return 1.0 if c == d else (d - value) / (d - c)
    return 0.0
