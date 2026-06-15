from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.core.deps import get_superadmin
from app.models.tenant import Tenant
from app.models.subscription import TenantSubscription, Plan

router = APIRouter(prefix="/api/v1/superadmin", tags=["SuperAdmin"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class GestionarBody(BaseModel):
    plan_name: Optional[str] = None        # Basic | Pro | Business
    status: Optional[str] = None           # trial | active | expired | blocked
    trial_days: Optional[int] = None       # extiende el trial N días desde hoy
    activo: Optional[bool] = None          # bloquear/desbloquear cuenta


# ── Helpers ───────────────────────────────────────────────────────────────────

def _tenant_detail(t: Tenant, db: Session) -> dict:
    sub = db.query(TenantSubscription).filter(TenantSubscription.establo_id == t.id).first()
    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first() if sub else None
    return {
        "id": t.id,
        "nombre": t.nombre,
        "email": t.email,
        "activo": t.activo,
        "creado_en": str(t.creado_en.date()) if t.creado_en else None,
        "plan": plan.name if plan else None,
        "plan_id": plan.id if plan else None,
        "suscripcion_status": sub.status if sub else None,
        "trial_ends_at": sub.trial_ends_at.isoformat() if sub and sub.trial_ends_at else None,
        "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/tenants")
def lista_tenants(db: Session = Depends(get_db), _=Depends(get_superadmin)):
    tenants = db.query(Tenant).filter(Tenant.role != "superadmin").order_by(Tenant.creado_en.desc()).all()
    return [_tenant_detail(t, db) for t in tenants]


@router.get("/tenants/{tenant_id}")
def get_tenant(tenant_id: int, db: Session = Depends(get_db), _=Depends(get_superadmin)):
    t = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.role != "superadmin").first()
    if not t:
        raise HTTPException(404, "Tenant no encontrado")
    return _tenant_detail(t, db)


@router.patch("/tenants/{tenant_id}/gestionar")
def gestionar_tenant(
    tenant_id: int,
    body: GestionarBody,
    db: Session = Depends(get_db),
    _=Depends(get_superadmin),
):
    t = db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.role != "superadmin").first()
    if not t:
        raise HTTPException(404, "Tenant no encontrado")

    # Bloquear / desbloquear cuenta
    if body.activo is not None:
        t.activo = body.activo

    sub = db.query(TenantSubscription).filter(TenantSubscription.establo_id == tenant_id).first()

    # Cambiar plan
    if body.plan_name:
        plan = db.query(Plan).filter(Plan.name == body.plan_name).first()
        if not plan:
            raise HTTPException(400, f"Plan '{body.plan_name}' no existe")
        if sub:
            sub.plan_id = plan.id
        else:
            sub = TenantSubscription(establo_id=tenant_id, plan_id=plan.id, status="active")
            db.add(sub)
            db.flush()

    # Cambiar status de suscripción
    if body.status and sub:
        if body.status not in ("trial", "active", "expired", "blocked"):
            raise HTTPException(400, "status inválido")
        sub.status = body.status
        if body.status == "active":
            now = datetime.utcnow()
            sub.current_period_start = now
            sub.current_period_end = now + timedelta(days=30)

    # Extender trial
    if body.trial_days is not None and sub:
        new_end = datetime.utcnow() + timedelta(days=body.trial_days)
        sub.trial_ends_at = new_end
        sub.current_period_end = new_end
        sub.status = "trial"

    db.commit()
    return _tenant_detail(t, db)


@router.get("/planes")
def lista_planes(db: Session = Depends(get_db), _=Depends(get_superadmin)):
    planes = db.query(Plan).all()
    return [{"id": p.id, "name": p.name, "price_monthly": float(p.price_monthly), "max_users": p.max_users} for p in planes]


@router.get("/metricas")
def metricas(db: Session = Depends(get_db), _=Depends(get_superadmin)):
    total    = db.query(Tenant).filter(Tenant.role != "superadmin").count()
    activos  = db.query(TenantSubscription).filter(TenantSubscription.status == "active").count()
    trials   = db.query(TenantSubscription).filter(TenantSubscription.status == "trial").count()
    expirados = db.query(TenantSubscription).filter(TenantSubscription.status == "expired").count()
    bloqueados = db.query(Tenant).filter(Tenant.role != "superadmin", Tenant.activo == False).count()
    mrr = db.query(
        func.sum(Plan.price_monthly)
    ).join(TenantSubscription, TenantSubscription.plan_id == Plan.id).filter(
        TenantSubscription.status == "active"
    ).scalar() or 0
    return {
        "total_tenants": total,
        "suscripciones_activas": activos,
        "en_trial": trials,
        "expirados": expirados,
        "bloqueados": bloqueados,
        "mrr": float(mrr),
    }
