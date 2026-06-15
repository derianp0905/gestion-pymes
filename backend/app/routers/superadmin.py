from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_superadmin
from app.models.tenant import Tenant
from app.models.subscription import TenantSubscription, Plan

router = APIRouter(prefix="/api/v1/superadmin", tags=["SuperAdmin"])


@router.get("/tenants")
def lista_tenants(db: Session = Depends(get_db), _=Depends(get_superadmin)):
    tenants = db.query(Tenant).filter(Tenant.role != "superadmin").order_by(Tenant.creado_en.desc()).all()
    result = []
    for t in tenants:
        sub = db.query(TenantSubscription).filter(TenantSubscription.establo_id == t.id).first()
        plan_name = None
        if sub:
            plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
            plan_name = plan.name if plan else None
        result.append({
            "id": t.id,
            "nombre": t.nombre,
            "email": t.email,
            "activo": t.activo,
            "creado_en": str(t.creado_en.date()) if t.creado_en else None,
            "plan": plan_name,
            "suscripcion_status": sub.status if sub else None,
        })
    return result


@router.get("/planes")
def lista_planes(db: Session = Depends(get_db), _=Depends(get_superadmin)):
    planes = db.query(Plan).all()
    return [{"id": p.id, "name": p.name, "price_monthly": float(p.price_monthly), "max_users": p.max_users} for p in planes]


@router.get("/metricas")
def metricas(db: Session = Depends(get_db), _=Depends(get_superadmin)):
    total = db.query(Tenant).filter(Tenant.role != "superadmin").count()
    activos = db.query(TenantSubscription).filter(TenantSubscription.status == "active").count()
    trials = db.query(TenantSubscription).filter(TenantSubscription.status == "trial").count()
    return {"total_tenants": total, "suscripciones_activas": activos, "en_trial": trials}
