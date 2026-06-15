from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user
from app.models.empresa_perfil import EmpresaPerfil
from app.schemas.perfil_empresa import PerfilEmpresaUpdate, PerfilEmpresaOut

router = APIRouter(prefix="/api/v1/perfil-empresa", tags=["Perfil Empresa"])


def _get_or_create(db: Session, establo_id: int) -> EmpresaPerfil:
    perfil = db.query(EmpresaPerfil).filter(EmpresaPerfil.establo_id == establo_id).first()
    if not perfil:
        perfil = EmpresaPerfil(establo_id=establo_id)
        db.add(perfil)
        db.commit()
        db.refresh(perfil)
    return perfil


@router.get("/", response_model=PerfilEmpresaOut)
def obtener(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return _get_or_create(db, current_user.id)


@router.put("/", response_model=PerfilEmpresaOut)
def actualizar(body: PerfilEmpresaUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    perfil = _get_or_create(db, current_user.id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(perfil, k, v)
    db.commit()
    db.refresh(perfil)
    return perfil
