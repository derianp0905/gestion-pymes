from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_db
from app.core.deps import require_module
from app.models.agenda import Cita
from app.models.cliente import Cliente

router = APIRouter(prefix="/api/v1/agenda", tags=["Agenda"])
_mod = require_module("agenda")

ESTADOS = ["pendiente", "confirmada", "cancelada", "completada"]


class CitaIn(BaseModel):
    titulo: str
    servicio: Optional[str] = None
    fecha: date
    hora_inicio: str
    duracion_min: Optional[int] = 60
    cliente_id: Optional[int] = None
    estado: Optional[str] = "pendiente"
    notas: Optional[str] = None


class CitaUpdate(BaseModel):
    titulo: Optional[str] = None
    servicio: Optional[str] = None
    fecha: Optional[date] = None
    hora_inicio: Optional[str] = None
    duracion_min: Optional[int] = None
    cliente_id: Optional[int] = None
    estado: Optional[str] = None
    notas: Optional[str] = None


def _out(c: Cita, db: Session) -> dict:
    cliente = db.query(Cliente).filter(Cliente.id == c.cliente_id).first() if c.cliente_id else None
    return {
        "id": c.id,
        "titulo": c.titulo,
        "servicio": c.servicio,
        "fecha": str(c.fecha),
        "hora_inicio": c.hora_inicio,
        "duracion_min": c.duracion_min,
        "cliente_id": c.cliente_id,
        "cliente_nombre": cliente.nombre if cliente else None,
        "estado": c.estado,
        "notas": c.notas,
    }


@router.get("/")
def listar(fecha_desde: Optional[date] = None, fecha_hasta: Optional[date] = None,
           estado: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(_mod)):
    q = db.query(Cita).filter(Cita.establo_id == current_user.id)
    if fecha_desde: q = q.filter(Cita.fecha >= fecha_desde)
    if fecha_hasta: q = q.filter(Cita.fecha <= fecha_hasta)
    if estado: q = q.filter(Cita.estado == estado)
    return [_out(c, db) for c in q.order_by(Cita.fecha, Cita.hora_inicio).all()]


@router.get("/resumen")
def resumen(db: Session = Depends(get_db), current_user=Depends(_mod)):
    hoy = date.today()
    citas_hoy   = db.query(Cita).filter(Cita.establo_id == current_user.id, Cita.fecha == hoy).all()
    confirmadas = sum(1 for c in citas_hoy if c.estado == "confirmada")
    pendientes  = sum(1 for c in citas_hoy if c.estado == "pendiente")
    total_mes   = db.query(Cita).filter(
        Cita.establo_id == current_user.id,
        Cita.fecha >= hoy.replace(day=1),
    ).count()
    return {"citas_hoy": len(citas_hoy), "confirmadas": confirmadas, "pendientes": pendientes, "total_mes": total_mes}


@router.post("/", status_code=201)
def crear(body: CitaIn, db: Session = Depends(get_db), current_user=Depends(_mod)):
    c = Cita(**body.model_dump(), establo_id=current_user.id)
    db.add(c); db.commit(); db.refresh(c)
    return _out(c, db)


@router.put("/{cid}")
def actualizar(cid: int, body: CitaUpdate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    c = db.query(Cita).filter(Cita.id == cid, Cita.establo_id == current_user.id).first()
    if not c: raise HTTPException(404, "Cita no encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit(); db.refresh(c)
    return _out(c, db)


@router.patch("/{cid}/estado")
def cambiar_estado(cid: int, estado: str, db: Session = Depends(get_db), current_user=Depends(_mod)):
    if estado not in ESTADOS: raise HTTPException(400, f"Estado inválido. Usa: {ESTADOS}")
    c = db.query(Cita).filter(Cita.id == cid, Cita.establo_id == current_user.id).first()
    if not c: raise HTTPException(404, "Cita no encontrada")
    c.estado = estado; db.commit(); db.refresh(c)
    return _out(c, db)


@router.delete("/{cid}", status_code=204)
def eliminar(cid: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    c = db.query(Cita).filter(Cita.id == cid, Cita.establo_id == current_user.id).first()
    if not c: raise HTTPException(404, "Cita no encontrada")
    db.delete(c); db.commit()
