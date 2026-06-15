from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal
from typing import Optional


class MovimientoCreate(BaseModel):
    tipo: str  # ingreso | gasto
    categoria: Optional[str] = None
    descripcion: str
    monto: Decimal
    fecha: date
    notas: Optional[str] = None


class MovimientoUpdate(BaseModel):
    tipo: Optional[str] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    monto: Optional[Decimal] = None
    fecha: Optional[date] = None
    notas: Optional[str] = None


class MovimientoOut(BaseModel):
    id: int
    tipo: str
    categoria: Optional[str]
    descripcion: str
    monto: Decimal
    fecha: date
    notas: Optional[str]
    creado_en: datetime

    model_config = {"from_attributes": True}
