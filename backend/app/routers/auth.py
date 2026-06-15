from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.tenant import Tenant
from app.models.subscription import TenantSubscription, Plan
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

TRIAL_DAYS = 14


@router.post("/registro", response_model=TokenResponse)
def registro(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Tenant).filter(Tenant.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    tenant = Tenant(
        nombre=body.nombre,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(tenant)
    db.flush()

    plan_basic = db.query(Plan).filter(Plan.name == "Basic").first()
    if plan_basic:
        now = datetime.utcnow()
        subscription = TenantSubscription(
            establo_id=tenant.id,
            plan_id=plan_basic.id,
            status="trial",
            trial_ends_at=now + timedelta(days=TRIAL_DAYS),
            current_period_start=now,
            current_period_end=now + timedelta(days=TRIAL_DAYS),
        )
        db.add(subscription)

    db.commit()
    db.refresh(tenant)

    token = create_access_token({"sub": str(tenant.id), "role": tenant.role})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.email == body.email).first()
    if not tenant or not verify_password(body.password, tenant.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    if not tenant.activo:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    token = create_access_token({"sub": str(tenant.id), "role": tenant.role})
    return TokenResponse(access_token=token)
