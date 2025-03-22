from typing import TypeVar

from fastapi import HTTPException

from src.db.models import Base

T = TypeVar("T", bound=Base)


def obj_or_404(obj: T | None, T) -> T:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{T.__name__} Not found")
    return obj
