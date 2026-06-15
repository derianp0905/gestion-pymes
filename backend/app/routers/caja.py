from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.core.deps import require_module
from app.models.caja import Movimiento
from app.schemas.caja import MovimientoCreate, MovimientoUpdate, MovimientoOut

router = APIRouter(prefix="/api/v1/caja", tags=["Caja"])
_mod = require_module("caja")


@router.get("/", response_model=List[MovimientoOut])
def listar(
    tipo: Optional[str] = Query(None),
    mes: Optional[str] = Query(None, description="Formato YYYY-MM"),
    db: Session = Depends(get_db),
    current_user=Depends(_mod),
):
    q = db.query(Movimiento).filter(Movimiento.establo_id == current_user.id)
    if tipo:
        q = q.filter(Movimiento.tipo == tipo)
    if mes:
        year, month = mes.split("-")
        q = q.filter(
            func.extract("year", Movimiento.fecha) == int(year),
            func.extract("month", Movimiento.fecha) == int(month),
        )
    return q.order_by(Movimiento.fecha.desc()).all()


@router.get("/resumen")
def resumen(
    mes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(_mod),
):
    q = db.query(Movimiento).filter(Movimiento.establo_id == current_user.id)
    if mes:
        year, month = mes.split("-")
        q = q.filter(
            func.extract("year", Movimiento.fecha) == int(year),
            func.extract("month", Movimiento.fecha) == int(month),
        )
    movs = q.all()
    ingresos = sum(float(m.monto) for m in movs if m.tipo == "ingreso")
    gastos = sum(float(m.monto) for m in movs if m.tipo == "gasto")
    return {
        "ingresos": ingresos,
        "gastos": gastos,
        "balance": ingresos - gastos,
    }


@router.post("/", response_model=MovimientoOut, status_code=201)
def crear(body: MovimientoCreate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    if body.tipo not in ("ingreso", "gasto"):
        raise HTTPException(400, "tipo debe ser 'ingreso' o 'gasto'")
    mov = Movimiento(**body.model_dump(), establo_id=current_user.id)
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


@router.put("/{mov_id}", response_model=MovimientoOut)
def actualizar(mov_id: int, body: MovimientoUpdate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    mov = db.query(Movimiento).filter(Movimiento.id == mov_id, Movimiento.establo_id == current_user.id).first()
    if not mov:
        raise HTTPException(404, "Movimiento no encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(mov, k, v)
    db.commit()
    db.refresh(mov)
    return mov


@router.delete("/{mov_id}", status_code=204)
def eliminar(mov_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    mov = db.query(Movimiento).filter(Movimiento.id == mov_id, Movimiento.establo_id == current_user.id).first()
    if not mov:
        raise HTTPException(404, "Movimiento no encontrado")
    db.delete(mov)
    db.commit()
