from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import date
from app.database import get_db
from app.core.deps import require_module
from app.models.empleados import Empleado, PagoNomina

router = APIRouter(prefix="/api/v1/empleados", tags=["Empleados"])
_mod = require_module("empleados")


class EmpleadoIn(BaseModel):
    nombre: str
    puesto: Optional[str] = None
    sucursal: Optional[str] = None
    salario: Optional[Decimal] = Decimal("0")
    tipo_pago: Optional[str] = "mensual"
    fecha_ingreso: Optional[date] = None
    estado: Optional[str] = "activo"
    email: Optional[str] = None
    telefono: Optional[str] = None


class EmpleadoUpdate(EmpleadoIn):
    nombre: Optional[str] = None


class NominaIn(BaseModel):
    periodo: str
    monto: Decimal
    fecha_pago: date
    notas: Optional[str] = None


def _out(e: Empleado) -> dict:
    return {
        "id": e.id, "nombre": e.nombre, "puesto": e.puesto, "sucursal": e.sucursal,
        "salario": float(e.salario or 0), "tipo_pago": e.tipo_pago,
        "fecha_ingreso": str(e.fecha_ingreso) if e.fecha_ingreso else None,
        "estado": e.estado, "email": e.email, "telefono": e.telefono,
    }


@router.get("/")
def listar(estado: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(_mod)):
    q = db.query(Empleado).filter(Empleado.establo_id == current_user.id)
    if estado: q = q.filter(Empleado.estado == estado)
    return [_out(e) for e in q.order_by(Empleado.nombre).all()]


@router.get("/resumen")
def resumen(db: Session = Depends(get_db), current_user=Depends(_mod)):
    empleados = db.query(Empleado).filter(Empleado.establo_id == current_user.id).all()
    activos   = [e for e in empleados if e.estado == "activo"]
    nomina    = sum(float(e.salario or 0) for e in activos)
    vacaciones= sum(1 for e in empleados if e.estado == "vacaciones")
    sucursales= len({e.sucursal for e in activos if e.sucursal})
    return {
        "total": len(empleados), "activos": len(activos),
        "en_vacaciones": vacaciones, "nomina_mensual": nomina,
        "sucursales": sucursales,
    }


@router.post("/", status_code=201)
def crear(body: EmpleadoIn, db: Session = Depends(get_db), current_user=Depends(_mod)):
    e = Empleado(**body.model_dump(), establo_id=current_user.id)
    db.add(e); db.commit(); db.refresh(e)
    return _out(e)


@router.put("/{eid}")
def actualizar(eid: int, body: EmpleadoUpdate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    e = db.query(Empleado).filter(Empleado.id == eid, Empleado.establo_id == current_user.id).first()
    if not e: raise HTTPException(404, "Empleado no encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    db.commit(); db.refresh(e)
    return _out(e)


@router.delete("/{eid}", status_code=204)
def eliminar(eid: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    e = db.query(Empleado).filter(Empleado.id == eid, Empleado.establo_id == current_user.id).first()
    if not e: raise HTTPException(404, "Empleado no encontrado")
    db.delete(e); db.commit()


# ── Nómina ──────────────────────────────────────────────────────────────────

@router.get("/{eid}/nomina")
def historial_nomina(eid: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    e = db.query(Empleado).filter(Empleado.id == eid, Empleado.establo_id == current_user.id).first()
    if not e: raise HTTPException(404, "Empleado no encontrado")
    pagos = db.query(PagoNomina).filter(PagoNomina.empleado_id == eid).order_by(PagoNomina.fecha_pago.desc()).all()
    return [{"id": p.id, "periodo": p.periodo, "monto": float(p.monto), "fecha_pago": str(p.fecha_pago), "notas": p.notas} for p in pagos]


@router.post("/{eid}/nomina", status_code=201)
def pagar_nomina(eid: int, body: NominaIn, db: Session = Depends(get_db), current_user=Depends(_mod)):
    e = db.query(Empleado).filter(Empleado.id == eid, Empleado.establo_id == current_user.id).first()
    if not e: raise HTTPException(404, "Empleado no encontrado")
    pago = PagoNomina(empleado_id=eid, establo_id=current_user.id, **body.model_dump())
    db.add(pago); db.commit(); db.refresh(pago)
    return {"id": pago.id, "periodo": pago.periodo, "monto": float(pago.monto), "fecha_pago": str(pago.fecha_pago)}


@router.get("/nomina/resumen")
def resumen_nomina(db: Session = Depends(get_db), current_user=Depends(_mod)):
    hoy = date.today()
    mes_actual = f"{hoy.year}-{hoy.month:02d}"
    total_mes = db.query(func.sum(PagoNomina.monto)).filter(
        PagoNomina.establo_id == current_user.id,
        PagoNomina.periodo.like(f"{mes_actual}%"),
    ).scalar() or 0
    total_pagos = db.query(func.count(PagoNomina.id)).filter(PagoNomina.establo_id == current_user.id).scalar() or 0
    return {"total_pagado_mes": float(total_mes), "total_pagos": total_pagos}
