from fastapi import HTTPException


def obj_or_404[T](obj: T | None) -> T:
    if not obj:
        raise HTTPException(status_code=404, detail=f"{T.__name__} Not found")
    return obj
