from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date
from app.database import get_db
from app.core.deps import require_module
from app.models.factura import Factura
from app.models.caja import Movimiento
from app.schemas.factura import FacturaCreate, FacturaUpdate, FacturaOut

router = APIRouter(prefix="/api/v1/facturacion", tags=["Facturación"])
_mod = require_module("facturacion")


def _next_numero(db: Session, establo_id: int) -> str:
    count = db.query(func.count(Factura.id)).filter(Factura.establo_id == establo_id).scalar() or 0
    return f"F-{str(count + 1).zfill(4)}"


def _registrar_ingreso(db: Session, factura: Factura) -> None:
    """Crea un movimiento de ingreso en caja cuando una factura se marca como pagada."""
    existe = db.query(Movimiento).filter(
        Movimiento.establo_id == factura.establo_id,
        Movimiento.descripcion == f"Factura {factura.numero}",
        Movimiento.tipo == "ingreso",
    ).first()
    if not existe:
        mov = Movimiento(
            establo_id=factura.establo_id,
            tipo="ingreso",
            categoria="Cobros",
            descripcion=f"Factura {factura.numero}",
            monto=factura.total,
            fecha=date.today(),
            notas=factura.concepto,
        )
        db.add(mov)


def _revertir_ingreso(db: Session, factura: Factura) -> None:
    """Elimina el movimiento de caja si la factura deja de estar pagada."""
    mov = db.query(Movimiento).filter(
        Movimiento.establo_id == factura.establo_id,
        Movimiento.descripcion == f"Factura {factura.numero}",
        Movimiento.tipo == "ingreso",
    ).first()
    if mov:
        db.delete(mov)


@router.get("/", response_model=List[FacturaOut])
def listar(db: Session = Depends(get_db), current_user=Depends(_mod)):
    return (
        db.query(Factura)
        .filter(Factura.establo_id == current_user.id)
        .order_by(Factura.fecha.desc())
        .all()
    )


@router.post("/", response_model=FacturaOut, status_code=201)
def crear(body: FacturaCreate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    data = body.model_dump()
    if not data.get("numero"):
        data["numero"] = _next_numero(db, current_user.id)
    if not data.get("fecha"):
        data["fecha"] = date.today()
    if data["total"] == 0:
        data["total"] = data["subtotal"] + data["impuesto"]
    factura = Factura(**data, establo_id=current_user.id)
    db.add(factura)
    db.flush()
    if factura.estado == "pagada":
        _registrar_ingreso(db, factura)
    db.commit()
    db.refresh(factura)
    return factura


@router.get("/{factura_id}", response_model=FacturaOut)
def obtener(factura_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.establo_id == current_user.id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")
    return f


@router.put("/{factura_id}", response_model=FacturaOut)
def actualizar(factura_id: int, body: FacturaUpdate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.establo_id == current_user.id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")

    estado_anterior = f.estado
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(f, k, v)

    nuevo_estado = f.estado
    if estado_anterior != "pagada" and nuevo_estado == "pagada":
        _registrar_ingreso(db, f)
    elif estado_anterior == "pagada" and nuevo_estado != "pagada":
        _revertir_ingreso(db, f)

    db.commit()
    db.refresh(f)
    return f


@router.delete("/{factura_id}", status_code=204)
def eliminar(factura_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.establo_id == current_user.id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")
    if f.estado == "pagada":
        _revertir_ingreso(db, f)
    db.delete(f)
    db.commit()
