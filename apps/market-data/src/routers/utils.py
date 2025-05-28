from fastapi import HTTPException

from src.db.models import Base

def obj_or_404[T: Base](
    obj: T | None,
    fallback_type: type[T],
    identifier: str,
) -> T:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{fallback_type.__name__} {identifier} not found")
    return obj
