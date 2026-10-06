from pathlib import Path

from app.infrastructure.configuration import load_mamdani_system


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIRECTORY = REPOSITORY_ROOT / "config" / "fuzzy_model" / "v1"


def configured_system():
    return load_mamdani_system(CONFIG_DIRECTORY)

