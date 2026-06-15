from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import require_module
from app.models.cliente import Cliente
from app.models.factura import Factura
from app.models.caja import Movimiento as MovimientoCaja
from app.models.inventario import Producto
from app.models.agenda import Cita
from app.models.empleados import Empleado, PagoNomina

router = APIRouter(prefix="/api/v1/reportes", tags=["Reportes"])
_mod = require_module("reportes_ia")


def _recopilar_datos(establo_id: int, db: Session) -> dict:
    hoy = date.today()
    mes_inicio = hoy.replace(day=1)
    mes_ant_inicio = mes_inicio.replace(
        month=mes_inicio.month - 1 if mes_inicio.month > 1 else 12,
        year=mes_inicio.year if mes_inicio.month > 1 else mes_inicio.year - 1,
    )

    # ── Facturación ──────────────────────────────────────────────────────────
    facturas_mes = db.query(Factura).filter(
        Factura.establo_id == establo_id,
        Factura.fecha >= mes_inicio,
    ).all()
    facturas_mes_ant = db.query(Factura).filter(
        Factura.establo_id == establo_id,
        Factura.fecha >= mes_ant_inicio,
        Factura.fecha < mes_inicio,
    ).all()
    ingresos_mes     = sum(float(f.total or 0) for f in facturas_mes if f.estado == "pagada")
    ingresos_mes_ant = sum(float(f.total or 0) for f in facturas_mes_ant if f.estado == "pagada")
    facturas_pendientes = [f for f in facturas_mes if f.estado in ("enviada", "pendiente")]
    variacion_pct = round(
        ((ingresos_mes - ingresos_mes_ant) / ingresos_mes_ant * 100) if ingresos_mes_ant else 0, 1
    )

    # ── Caja ─────────────────────────────────────────────────────────────────
    movs_mes = db.query(MovimientoCaja).filter(
        MovimientoCaja.establo_id == establo_id,
        MovimientoCaja.fecha >= mes_inicio,
    ).all()
    gastos_mes    = sum(float(m.monto or 0) for m in movs_mes if m.tipo == "gasto")
    ingresos_caja = sum(float(m.monto or 0) for m in movs_mes if m.tipo == "ingreso")
    cats_gasto: dict = {}
    for m in movs_mes:
        if m.tipo == "gasto":
            key = m.categoria or "Sin categoría"
            cats_gasto[key] = cats_gasto.get(key, 0) + float(m.monto or 0)
    top_cats = dict(sorted(cats_gasto.items(), key=lambda x: -x[1])[:5])

    # ── Clientes ─────────────────────────────────────────────────────────────
    total_clientes = db.query(func.count(Cliente.id)).filter(Cliente.establo_id == establo_id).scalar() or 0
    nuevos_mes     = db.query(func.count(Cliente.id)).filter(
        Cliente.establo_id == establo_id,
        func.date(Cliente.creado_en) >= mes_inicio,
    ).scalar() or 0

    # ── Inventario ───────────────────────────────────────────────────────────
    prods = db.query(Producto).filter(Producto.establo_id == establo_id, Producto.activo == True).all()
    stock_bajo = [p for p in prods if (p.stock_actual or 0) < (p.stock_minimo or 0)]

    # ── Agenda ───────────────────────────────────────────────────────────────
    citas_mes = db.query(func.count(Cita.id)).filter(
        Cita.establo_id == establo_id,
        Cita.fecha >= mes_inicio,
    ).scalar() or 0
    citas_canceladas = db.query(func.count(Cita.id)).filter(
        Cita.establo_id == establo_id,
        Cita.fecha >= mes_inicio,
        Cita.estado == "cancelada",
    ).scalar() or 0

    # ── Empleados ────────────────────────────────────────────────────────────
    empleados = db.query(Empleado).filter(Empleado.establo_id == establo_id).all()
    nomina    = sum(float(e.salario or 0) for e in empleados if e.estado == "activo")

    # ── KPIs calculados ──────────────────────────────────────────────────────
    kpis = [
        {
            "titulo": "Ingresos del mes",
            "valor": ingresos_mes,
            "anterior": ingresos_mes_ant,
            "variacion_pct": variacion_pct,
            "tendencia": "up" if variacion_pct > 0 else ("down" if variacion_pct < 0 else "neutral"),
        },
        {
            "titulo": "Balance de caja",
            "valor": ingresos_caja - gastos_mes,
            "ingresos": ingresos_caja,
            "gastos": gastos_mes,
            "tendencia": "up" if ingresos_caja >= gastos_mes else "down",
        },
        {
            "titulo": "Facturas pendientes",
            "valor": len(facturas_pendientes),
            "monto": sum(float(f.total or 0) for f in facturas_pendientes),
            "tendencia": "down" if facturas_pendientes else "neutral",
        },
        {
            "titulo": "Clientes activos",
            "valor": total_clientes,
            "nuevos": nuevos_mes,
            "tendencia": "up" if nuevos_mes > 0 else "neutral",
        },
    ]

    # ── Alertas automáticas ──────────────────────────────────────────────────
    alertas = []
    if stock_bajo:
        alertas.append({
            "nivel": "alta" if len(stock_bajo) >= 3 else "media",
            "titulo": f"{len(stock_bajo)} producto(s) con stock bajo",
            "items": [p.nombre for p in stock_bajo[:5]],
        })
    if facturas_pendientes:
        monto_pend = sum(float(f.total or 0) for f in facturas_pendientes)
        alertas.append({
            "nivel": "media",
            "titulo": f"{len(facturas_pendientes)} factura(s) por cobrar",
            "items": [f"RD${monto_pend:,.0f} pendiente de cobro"],
        })
    if citas_canceladas and citas_mes:
        tasa = citas_canceladas / citas_mes * 100
        if tasa >= 20:
            alertas.append({
                "nivel": "baja",
                "titulo": f"Tasa de cancelación: {tasa:.0f}%",
                "items": [f"{citas_canceladas} de {citas_mes} citas canceladas este mes"],
            })

    return {
        "periodo": str(mes_inicio),
        "generado_en": datetime.utcnow().isoformat(),
        "kpis": kpis,
        "alertas": alertas,
        "facturacion": {
            "ingresos_mes": round(ingresos_mes, 2),
            "ingresos_mes_anterior": round(ingresos_mes_ant, 2),
            "variacion_pct": variacion_pct,
            "facturas_emitidas": len(facturas_mes),
            "facturas_pendientes": len(facturas_pendientes),
            "monto_pendiente": round(sum(float(f.total or 0) for f in facturas_pendientes), 2),
        },
        "caja": {
            "ingresos": round(ingresos_caja, 2),
            "gastos": round(gastos_mes, 2),
            "balance": round(ingresos_caja - gastos_mes, 2),
            "categorias_gasto": top_cats,
        },
        "clientes": {
            "total": total_clientes,
            "nuevos_este_mes": nuevos_mes,
        },
        "inventario": {
            "total_productos": len(prods),
            "productos_stock_bajo": len(stock_bajo),
            "nombres_stock_bajo": [p.nombre for p in stock_bajo[:5]],
            "valor_inventario": round(sum(float(p.precio_venta or 0) * (p.stock_actual or 0) for p in prods), 2),
        },
        "agenda": {
            "citas_mes": citas_mes,
            "canceladas": citas_canceladas,
            "tasa_cancelacion_pct": round(citas_canceladas / citas_mes * 100 if citas_mes else 0, 1),
        },
        "empleados": {
            "total": len(empleados),
            "activos": sum(1 for e in empleados if e.estado == "activo"),
            "nomina_mensual": round(nomina, 2),
        },
    }


@router.get("/")
def generar_reporte(db: Session = Depends(get_db), current_user=Depends(_mod)):
    return _recopilar_datos(current_user.id, db)
