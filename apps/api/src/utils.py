from typing import TypeVar

from db.models import Base
from fastapi import HTTPException

T = TypeVar("T", bound=Base)


def obj_or_404(obj: T | None) -> T:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{T.__name__} not found")
    return obj
