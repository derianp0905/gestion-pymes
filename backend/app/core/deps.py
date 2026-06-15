from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.core.config import settings
from app.models.tenant import Tenant
from app.models.subscription import TenantSubscription, PlanModule, Module

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Tenant:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    tenant = db.query(Tenant).filter(Tenant.id == int(payload["sub"])).first()
    if not tenant or not tenant.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return tenant


def get_superadmin(current_user: Tenant = Depends(get_current_user)) -> Tenant:
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return current_user


def require_module(module_key: str):
    def dependency(
        current_user: Tenant = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        subscription = (
            db.query(TenantSubscription)
            .filter(
                TenantSubscription.establo_id == current_user.id,
                TenantSubscription.status.in_(["active", "trial"]),
            )
            .first()
        )
        if not subscription:
            raise HTTPException(status_code=403, detail="Suscripción inactiva")

        has_module = (
            db.query(PlanModule)
            .join(Module)
            .filter(
                PlanModule.plan_id == subscription.plan_id,
                Module.key == module_key,
            )
            .first()
        )
        if not has_module:
            raise HTTPException(status_code=403, detail="Tu plan no incluye este módulo")

        return current_user

    return dependency
