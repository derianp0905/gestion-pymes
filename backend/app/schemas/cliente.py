from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class ClienteCreate(BaseModel):
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    notas: Optional[str] = None
    activo: Optional[bool] = None


class ClienteOut(BaseModel):
    id: int
    nombre: str
    email: Optional[str]
    telefono: Optional[str]
    direccion: Optional[str]
    notas: Optional[str]
    activo: bool
    creado_en: datetime

    model_config = {"from_attributes": True}
