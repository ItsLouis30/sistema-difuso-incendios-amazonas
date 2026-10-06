class FuzzySystemError(Exception):
    """Error base del nucleo difuso."""


class FuzzyConfigurationError(FuzzySystemError):
    """La configuracion del modelo es incompleta o incoherente."""


class InputValueError(FuzzySystemError, ValueError):
    """Una entrada crisp falta, no es numerica o esta fuera del universo."""


class FuzzyInferenceError(FuzzySystemError):
    """La inferencia no puede producir una salida valida."""


class DataValidationError(ValueError):
    """Un archivo meteorologico no cumple el contrato de datos."""
