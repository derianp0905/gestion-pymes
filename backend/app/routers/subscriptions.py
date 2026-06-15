from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.deps import get_current_user, get_superadmin
from app.models.tenant import Tenant
from app.models.subscription import TenantSubscription, Plan, PlanModule, Module

router = APIRouter(prefix="/api/v1/subscriptions", tags=["Subscriptions"])


@router.get("/mi-estado")
def mi_estado(current_user: Tenant = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(TenantSubscription).filter(TenantSubscription.establo_id == current_user.id).first()
    if not sub:
        return {"status": "sin_suscripcion", "plan": None, "modulos": []}

    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
    modulos = (
        db.query(Module.key)
        .join(PlanModule, PlanModule.module_id == Module.id)
        .filter(PlanModule.plan_id == sub.plan_id)
        .all()
    )
    return {
        "status": sub.status,
        "plan": plan.name if plan else None,
        "trial_ends_at": str(sub.trial_ends_at) if sub.trial_ends_at else None,
        "current_period_end": str(sub.current_period_end) if sub.current_period_end else None,
        "modulos": [m.key for m in modulos],
    }


@router.post("/activar/{tenant_id}")
def activar_suscripcion(
    tenant_id: int,
    plan_name: str,
    db: Session = Depends(get_db),
    _=Depends(get_superadmin),
):
    plan = db.query(Plan).filter(Plan.name == plan_name).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")

    sub = db.query(TenantSubscription).filter(TenantSubscription.establo_id == tenant_id).first()
    if not sub:
        sub = TenantSubscription(establo_id=tenant_id, plan_id=plan.id)
        db.add(sub)

    sub.plan_id = plan.id
    sub.status = "active"
    db.commit()
    return {"mensaje": "Suscripción activada", "plan": plan.name}
