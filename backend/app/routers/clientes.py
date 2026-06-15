from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.core.deps import require_module
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteOut

router = APIRouter(prefix="/api/v1/clientes", tags=["Clientes"])
_mod = require_module("clientes")


@router.get("/", response_model=List[ClienteOut])
def listar(db: Session = Depends(get_db), current_user=Depends(_mod)):
    return (
        db.query(Cliente)
        .filter(Cliente.establo_id == current_user.id, Cliente.activo == True)
        .order_by(Cliente.nombre)
        .all()
    )


@router.post("/", response_model=ClienteOut, status_code=201)
def crear(body: ClienteCreate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    cliente = Cliente(**body.model_dump(), establo_id=current_user.id)
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener(cliente_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id, Cliente.establo_id == current_user.id
    ).first()
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteOut)
def actualizar(cliente_id: int, body: ClienteUpdate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id, Cliente.establo_id == current_user.id
    ).first()
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(cliente, k, v)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=204)
def eliminar(cliente_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id, Cliente.establo_id == current_user.id
    ).first()
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")
    cliente.activo = False
    db.commit()
