from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date
from app.database import get_db
from app.core.deps import get_current_user
from app.models.cliente import Cliente
from app.models.factura import Factura
from app.models.caja import Movimiento

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/resumen")
def resumen(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    hoy = date.today()
    tid = current_user.id

    # --- KPIs del mes actual ---
    def movs_mes(tipo):
        return db.query(func.coalesce(func.sum(Movimiento.monto), 0)).filter(
            Movimiento.establo_id == tid,
            Movimiento.tipo == tipo,
            extract("year",  Movimiento.fecha) == hoy.year,
            extract("month", Movimiento.fecha) == hoy.month,
        ).scalar()

    ingresos_mes  = float(movs_mes("ingreso"))
    gastos_mes    = float(movs_mes("gasto"))
    balance_mes   = ingresos_mes - gastos_mes

    clientes_total = db.query(func.count(Cliente.id)).filter(
        Cliente.establo_id == tid, Cliente.activo == True
    ).scalar()

    # --- Facturas ---
    facturas_pagadas   = db.query(func.count(Factura.id)).filter(Factura.establo_id == tid, Factura.estado == "pagada").scalar()
    facturas_pendientes = db.query(func.count(Factura.id)).filter(Factura.establo_id == tid, Factura.estado == "enviada").scalar()
    monto_por_cobrar   = float(db.query(func.coalesce(func.sum(Factura.total), 0)).filter(
        Factura.establo_id == tid, Factura.estado == "enviada"
    ).scalar())

    # --- Gráfica: últimos 6 meses ---
    rows = db.query(
        extract("year",  Movimiento.fecha).label("year"),
        extract("month", Movimiento.fecha).label("month"),
        Movimiento.tipo,
        func.sum(Movimiento.monto).label("total"),
    ).filter(
        Movimiento.establo_id == tid,
        Movimiento.fecha >= date(hoy.year if hoy.month > 6 else hoy.year - 1,
                                 (hoy.month - 5) if hoy.month > 5 else (hoy.month + 7), 1),
    ).group_by("year", "month", Movimiento.tipo).all()

    # Construir los últimos 6 meses en orden
    meses_nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    chart = {}
    for i in range(5, -1, -1):
        m = hoy.month - i
        y = hoy.year
        if m <= 0:
            m += 12
            y -= 1
        key = (y, m)
        chart[key] = {"mes": meses_nombres[m - 1], "ingresos": 0, "gastos": 0}

    for r in rows:
        key = (int(r.year), int(r.month))
        if key in chart:
            chart[key]["ingresos" if r.tipo == "ingreso" else "gastos"] = float(r.total)

    return {
        "ingresos_mes":       ingresos_mes,
        "gastos_mes":         gastos_mes,
        "balance_mes":        balance_mes,
        "clientes_total":     clientes_total,
        "facturas_pagadas":   facturas_pagadas,
        "facturas_pendientes":facturas_pendientes,
        "monto_por_cobrar":   monto_por_cobrar,
        "chart":              list(chart.values()),
    }
