from pydantic import BaseModel
from typing import Optional


class PerfilEmpresaUpdate(BaseModel):
    nombre_comercial: Optional[str] = None
    rn_fiscal: Optional[str] = None
    telefono: Optional[str] = None
    email_comercial: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    pais: Optional[str] = None
    moneda: Optional[str] = None
    logo_url: Optional[str] = None


class PerfilEmpresaOut(BaseModel):
    nombre_comercial: Optional[str]
    rn_fiscal: Optional[str]
    telefono: Optional[str]
    email_comercial: Optional[str]
    direccion: Optional[str]
    ciudad: Optional[str]
    pais: Optional[str]
    moneda: Optional[str]
    logo_url: Optional[str]

    model_config = {"from_attributes": True}
