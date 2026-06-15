from pydantic import BaseModel, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional


class FacturaCreate(BaseModel):
    cliente_id: Optional[int] = None
    numero: Optional[str] = None
    fecha: date
    fecha_vencimiento: Optional[date] = None
    concepto: str
    subtotal: Decimal = Decimal("0")
    impuesto: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
    estado: str = "borrador"
    notas: Optional[str] = None

    @field_validator("cliente_id", mode="before")
    @classmethod
    def empty_str_to_none_int(cls, v):
        if v == "" or v is None:
            return None
        return int(v)

    @field_validator("fecha_vencimiento", mode="before")
    @classmethod
    def empty_str_to_none_date(cls, v):
        if v == "" or v is None:
            return None
        return v

    @field_validator("subtotal", "impuesto", "total", mode="before")
    @classmethod
    def empty_str_to_zero(cls, v):
        if v == "" or v is None:
            return Decimal("0")
        return Decimal(str(v))

    @field_validator("numero", "notas", mode="before")
    @classmethod
    def empty_str_to_none_str(cls, v):
        if v == "":
            return None
        return v


class FacturaUpdate(BaseModel):
    cliente_id: Optional[int] = None
    numero: Optional[str] = None
    fecha: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    concepto: Optional[str] = None
    subtotal: Optional[Decimal] = None
    impuesto: Optional[Decimal] = None
    total: Optional[Decimal] = None
    estado: Optional[str] = None
    notas: Optional[str] = None

    @field_validator("cliente_id", mode="before")
    @classmethod
    def empty_int(cls, v):
        return None if v == "" else v

    @field_validator("fecha_vencimiento", mode="before")
    @classmethod
    def empty_date(cls, v):
        return None if v == "" else v

    @field_validator("subtotal", "impuesto", "total", mode="before")
    @classmethod
    def empty_decimal(cls, v):
        if v == "" or v is None:
            return None
        return Decimal(str(v))

    @field_validator("numero", "notas", mode="before")
    @classmethod
    def empty_str(cls, v):
        return None if v == "" else v


class FacturaOut(BaseModel):
    id: int
    cliente_id: Optional[int]
    numero: Optional[str]
    fecha: date
    fecha_vencimiento: Optional[date]
    concepto: str
    subtotal: Decimal
    impuesto: Decimal
    total: Decimal
    estado: str
    notas: Optional[str]
    creado_en: datetime

    model_config = {"from_attributes": True}
