from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from app.database import get_db
from app.core.deps import require_module
from app.models.inventario import Producto

router = APIRouter(prefix="/api/v1/inventario", tags=["Inventario"])
_mod = require_module("inventario")


class ProductoIn(BaseModel):
    nombre: str
    sku: Optional[str] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    precio_compra: Optional[Decimal] = Decimal("0")
    precio_venta: Decimal
    stock_actual: Optional[int] = 0
    stock_minimo: Optional[int] = 0


class ProductoUpdate(ProductoIn):
    nombre: Optional[str] = None
    precio_venta: Optional[Decimal] = None


class AjusteStock(BaseModel):
    cantidad: int
    motivo: Optional[str] = None


def _out(p: Producto) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "sku": p.sku,
        "categoria": p.categoria,
        "descripcion": p.descripcion,
        "precio_compra": float(p.precio_compra or 0),
        "precio_venta": float(p.precio_venta),
        "stock_actual": p.stock_actual,
        "stock_minimo": p.stock_minimo,
        "activo": p.activo,
        "stock_bajo": (p.stock_actual or 0) < (p.stock_minimo or 0),
        "margen_pct": round(
            ((float(p.precio_venta) - float(p.precio_compra or 0)) / float(p.precio_venta) * 100)
            if p.precio_venta else 0, 1
        ),
    }


@router.get("/")
def listar(categoria: Optional[str] = None, solo_bajo: bool = False,
           db: Session = Depends(get_db), current_user=Depends(_mod)):
    q = db.query(Producto).filter(Producto.establo_id == current_user.id, Producto.activo == True)
    if categoria:
        q = q.filter(Producto.categoria == categoria)
    if solo_bajo:
        q = q.filter(Producto.stock_actual < Producto.stock_minimo)
    return [_out(p) for p in q.order_by(Producto.nombre).all()]


@router.get("/categorias")
def categorias(db: Session = Depends(get_db), current_user=Depends(_mod)):
    rows = db.query(Producto.categoria).filter(
        Producto.establo_id == current_user.id,
        Producto.activo == True,
        Producto.categoria != None,
    ).distinct().all()
    return [r[0] for r in rows if r[0]]


@router.get("/resumen")
def resumen(db: Session = Depends(get_db), current_user=Depends(_mod)):
    total = db.query(func.count(Producto.id)).filter(Producto.establo_id == current_user.id, Producto.activo == True).scalar() or 0
    bajo  = db.query(func.count(Producto.id)).filter(
        Producto.establo_id == current_user.id, Producto.activo == True,
        Producto.stock_actual < Producto.stock_minimo,
    ).scalar() or 0
    valor = db.query(func.sum(Producto.stock_actual * Producto.precio_venta)).filter(
        Producto.establo_id == current_user.id, Producto.activo == True,
    ).scalar() or 0
    return {"total_productos": total, "stock_bajo": bajo, "valor_inventario": float(valor)}


@router.post("/", status_code=201)
def crear(body: ProductoIn, db: Session = Depends(get_db), current_user=Depends(_mod)):
    p = Producto(**body.model_dump(), establo_id=current_user.id)
    db.add(p); db.commit(); db.refresh(p)
    return _out(p)


@router.put("/{pid}")
def actualizar(pid: int, body: ProductoUpdate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    p = db.query(Producto).filter(Producto.id == pid, Producto.establo_id == current_user.id).first()
    if not p: raise HTTPException(404, "Producto no encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit(); db.refresh(p)
    return _out(p)


@router.patch("/{pid}/stock")
def ajustar_stock(pid: int, body: AjusteStock, db: Session = Depends(get_db), current_user=Depends(_mod)):
    p = db.query(Producto).filter(Producto.id == pid, Producto.establo_id == current_user.id).first()
    if not p: raise HTTPException(404, "Producto no encontrado")
    p.stock_actual = (p.stock_actual or 0) + body.cantidad
    db.commit(); db.refresh(p)
    return _out(p)


@router.delete("/{pid}", status_code=204)
def eliminar(pid: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    p = db.query(Producto).filter(Producto.id == pid, Producto.establo_id == current_user.id).first()
    if not p: raise HTTPException(404, "Producto no encontrado")
    p.activo = False; db.commit()
