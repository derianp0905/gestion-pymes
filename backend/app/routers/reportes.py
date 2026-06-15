import json
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.config import settings
from app.core.deps import require_module
from app.models.cliente import Cliente
from app.models.factura import Factura
from app.models.caja import Movimiento as MovimientoCaja
from app.models.inventario import Producto
from app.models.agenda import Cita
from app.models.empleados import Empleado, PagoNomina

router = APIRouter(prefix="/api/v1/reportes", tags=["Reportes IA"])
_mod = require_module("reportes_ia")

# Cache simple en memoria: {establo_id: (timestamp, reporte)}
_cache: dict[int, tuple[datetime, dict]] = {}
CACHE_MINUTES = 30


def _reporte_fresco(establo_id: int) -> Optional[dict]:
    if establo_id in _cache:
        ts, data = _cache[establo_id]
        if (datetime.utcnow() - ts).seconds < CACHE_MINUTES * 60:
            return data
    return None


def _guardar_cache(establo_id: int, data: dict):
    _cache[establo_id] = (datetime.utcnow(), data)


def _recopilar_datos(establo_id: int, db: Session) -> dict:
    hoy = date.today()
    mes_inicio = hoy.replace(day=1)

    # ── Facturación ─────────────────────────────────────────────────────────
    facturas_mes = db.query(Factura).filter(
        Factura.establo_id == establo_id,
        Factura.fecha >= mes_inicio,
    ).all()
    facturas_mes_ant = db.query(Factura).filter(
        Factura.establo_id == establo_id,
        Factura.fecha >= mes_inicio.replace(month=mes_inicio.month - 1 if mes_inicio.month > 1 else 12,
                                            year=mes_inicio.year if mes_inicio.month > 1 else mes_inicio.year - 1),
        Factura.fecha < mes_inicio,
    ).all()
    ingresos_mes     = sum(float(f.total or 0) for f in facturas_mes if f.estado == "pagada")
    ingresos_mes_ant = sum(float(f.total or 0) for f in facturas_mes_ant if f.estado == "pagada")
    facturas_pendientes = [f for f in facturas_mes if f.estado == "pendiente"]
    top_clientes = (
        db.query(Factura.cliente_id, func.sum(Factura.total).label("total"))
        .filter(Factura.establo_id == establo_id, Factura.estado == "pagada")
        .group_by(Factura.cliente_id)
        .order_by(func.sum(Factura.total).desc())
        .limit(3)
        .all()
    )

    # ── Caja ────────────────────────────────────────────────────────────────
    movs_mes = db.query(MovimientoCaja).filter(
        MovimientoCaja.establo_id == establo_id,
        MovimientoCaja.fecha >= mes_inicio,
    ).all()
    gastos_mes    = sum(float(m.monto or 0) for m in movs_mes if m.tipo == "gasto")
    ingresos_caja = sum(float(m.monto or 0) for m in movs_mes if m.tipo == "ingreso")
    cats_gasto = {}
    for m in movs_mes:
        if m.tipo == "gasto":
            cats_gasto[m.categoria or "Sin categoría"] = cats_gasto.get(m.categoria or "Sin categoría", 0) + float(m.monto or 0)

    # ── Clientes ────────────────────────────────────────────────────────────
    total_clientes  = db.query(func.count(Cliente.id)).filter(Cliente.establo_id == establo_id).scalar() or 0
    nuevos_mes      = db.query(func.count(Cliente.id)).filter(
        Cliente.establo_id == establo_id,
        func.date(Cliente.creado_en) >= mes_inicio,
    ).scalar() or 0

    # ── Inventario ──────────────────────────────────────────────────────────
    prods = db.query(Producto).filter(Producto.establo_id == establo_id, Producto.activo == True).all()
    stock_bajo = [p for p in prods if (p.stock_actual or 0) < (p.stock_minimo or 0)]

    # ── Agenda ──────────────────────────────────────────────────────────────
    citas_mes = db.query(func.count(Cita.id)).filter(
        Cita.establo_id == establo_id,
        Cita.fecha >= mes_inicio,
    ).scalar() or 0
    citas_canceladas = db.query(func.count(Cita.id)).filter(
        Cita.establo_id == establo_id,
        Cita.fecha >= mes_inicio,
        Cita.estado == "cancelada",
    ).scalar() or 0

    # ── Empleados ───────────────────────────────────────────────────────────
    empleados = db.query(Empleado).filter(Empleado.establo_id == establo_id).all()
    nomina    = sum(float(e.salario or 0) for e in empleados if e.estado == "activo")

    return {
        "periodo": str(mes_inicio),
        "facturacion": {
            "ingresos_mes": round(ingresos_mes, 2),
            "ingresos_mes_anterior": round(ingresos_mes_ant, 2),
            "variacion_pct": round(((ingresos_mes - ingresos_mes_ant) / ingresos_mes_ant * 100) if ingresos_mes_ant else 0, 1),
            "facturas_emitidas": len(facturas_mes),
            "facturas_pendientes": len(facturas_pendientes),
            "monto_pendiente": round(sum(float(f.total or 0) for f in facturas_pendientes), 2),
        },
        "caja": {
            "ingresos": round(ingresos_caja, 2),
            "gastos": round(gastos_mes, 2),
            "balance": round(ingresos_caja - gastos_mes, 2),
            "categorias_gasto": dict(sorted(cats_gasto.items(), key=lambda x: -x[1])[:5]),
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


def _llamar_claude(datos: dict) -> dict:
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise HTTPException(503, "ANTHROPIC_API_KEY no configurada")

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""Eres un consultor financiero experto en PYMES latinoamericanas. Analiza estos datos de negocio del mes actual y genera un reporte ejecutivo breve y accionable.

DATOS DEL NEGOCIO:
{json.dumps(datos, ensure_ascii=False, indent=2)}

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto extra) con esta estructura exacta:
{{
  "resumen": "2-3 oraciones resumiendo el estado financiero del negocio este mes.",
  "salud": "buena",
  "kpis": [
    {{"titulo": "Nombre del KPI", "valor": "valor formateado", "tendencia": "up", "insight": "Una oración de contexto"}},
    {{"titulo": "...", "valor": "...", "tendencia": "down", "insight": "..."}},
    {{"titulo": "...", "valor": "...", "tendencia": "neutral", "insight": "..."}}
  ],
  "alertas": [
    {{"nivel": "alta", "titulo": "Título de la alerta", "descripcion": "Descripción breve", "accion": "Qué hacer ahora"}}
  ],
  "recomendaciones": [
    {{"titulo": "Recomendación", "descripcion": "Descripción breve y accionable", "impacto": "alto", "categoria": "finanzas"}}
  ]
}}

Reglas:
- "salud" debe ser "buena", "regular" o "alerta"
- "tendencia" de KPIs: "up", "down" o "neutral"
- "nivel" de alertas: "alta", "media" o "baja"
- "impacto" de recomendaciones: "alto", "medio" o "bajo"
- "categoria" de recomendaciones: "ventas", "operaciones", "finanzas" o "marketing"
- Incluye exactamente 3-4 KPIs, 0-3 alertas, 2-3 recomendaciones
- Si no hay datos suficientes en un módulo, no incluyas alertas sobre ese módulo
- Usa RD$ para montos (es un negocio dominicano)
- Responde solo el JSON, sin texto adicional"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    texto = message.content[0].text.strip()
    # Limpiar posible markdown
    if texto.startswith("```"):
        texto = texto.split("```")[1]
        if texto.startswith("json"):
            texto = texto[4:]
    texto = texto.strip().rstrip("```").strip()

    return json.loads(texto)


@router.get("/")
def generar_reporte(forzar: bool = False, db: Session = Depends(get_db), current_user=Depends(_mod)):
    if not forzar:
        cached = _reporte_fresco(current_user.id)
        if cached:
            return {**cached, "desde_cache": True}

    datos = _recopilar_datos(current_user.id, db)
    reporte = _llamar_claude(datos)
    reporte["datos_base"] = datos
    reporte["generado_en"] = datetime.utcnow().isoformat()
    reporte["desde_cache"] = False

    _guardar_cache(current_user.id, reporte)
    return reporte


@router.get("/datos")
def solo_datos(db: Session = Depends(get_db), current_user=Depends(_mod)):
    """Devuelve los datos en bruto sin llamar a Claude — útil para debugging."""
    return _recopilar_datos(current_user.id, db)
