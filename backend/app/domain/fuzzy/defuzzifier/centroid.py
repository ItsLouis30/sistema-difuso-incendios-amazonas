from __future__ import annotations

from collections.abc import Sequence

from app.domain.model import FuzzyInferenceError


class CentroidDefuzzifier:
    """Calcula el centroide numerico de la salida agregada con trapecios."""

    def defuzzify(self, universe: Sequence[float], membership: Sequence[float]) -> float:
        if len(universe) != len(membership) or len(universe) < 2:
            raise FuzzyInferenceError(
                "El universo y la funcion agregada deben tener igual longitud "
                "y al menos dos puntos."
            )
        if any(right <= left for left, right in zip(universe, universe[1:])):
            raise FuzzyInferenceError("El universo de salida debe ser estrictamente creciente.")
        if any(degree < 0.0 or degree > 1.0 for degree in membership):
            raise FuzzyInferenceError("La funcion agregada contiene grados fuera de [0, 1].")

        area = 0.0
        first_moment = 0.0
        for x0, x1, mu0, mu1 in zip(
            universe, universe[1:], membership, membership[1:]
        ):
            width = x1 - x0
            area += width * (mu0 + mu1) / 2.0
            first_moment += width * (x0 * mu0 + x1 * mu1) / 2.0

        if area <= 1e-12:
            raise FuzzyInferenceError("La salida agregada tiene area cero.")
        return first_moment / area
