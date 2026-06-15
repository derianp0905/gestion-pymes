from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import date
from io import BytesIO
from app.database import get_db
from app.core.deps import require_module, get_current_user
from app.models.factura import Factura
from app.models.factura_item import FacturaItem
from app.models.caja import Movimiento
from app.models.cliente import Cliente
from app.models.empresa_perfil import EmpresaPerfil
from app.models.tenant import Tenant
from app.schemas.factura import FacturaCreate, FacturaUpdate, FacturaOut

router = APIRouter(prefix="/api/v1/facturacion", tags=["Facturación"])
_mod = require_module("facturacion")


# ── Schemas de ítems ──────────────────────────────────────────────────────────

class ItemIn(BaseModel):
    descripcion: str
    cantidad: Decimal = Decimal("1")
    precio_unitario: Decimal
    descuento_pct: Decimal = Decimal("0")


class FacturaConItemsCreate(FacturaCreate):
    items: Optional[List[ItemIn]] = None


class FacturaConItemsUpdate(FacturaUpdate):
    items: Optional[List[ItemIn]] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _next_numero(db: Session, establo_id: int) -> str:
    count = db.query(func.count(Factura.id)).filter(Factura.establo_id == establo_id).scalar() or 0
    return f"F-{str(count + 1).zfill(4)}"


def _calcular_item_subtotal(item: ItemIn) -> Decimal:
    base = item.cantidad * item.precio_unitario
    descuento = base * (item.descuento_pct / Decimal("100"))
    return (base - descuento).quantize(Decimal("0.01"))


def _sync_items(db: Session, factura: Factura, items: List[ItemIn]) -> None:
    db.query(FacturaItem).filter(FacturaItem.factura_id == factura.id).delete()
    subtotal_total = Decimal("0")
    for it in items:
        sub = _calcular_item_subtotal(it)
        subtotal_total += sub
        db.add(FacturaItem(
            factura_id=factura.id,
            descripcion=it.descripcion,
            cantidad=it.cantidad,
            precio_unitario=it.precio_unitario,
            descuento_pct=it.descuento_pct,
            subtotal=sub,
        ))
    factura.subtotal = subtotal_total
    itbis = (subtotal_total * Decimal("0.18")).quantize(Decimal("0.01")) if factura.impuesto else Decimal("0")
    if factura.impuesto and factura.impuesto > 0:
        factura.impuesto = itbis
    factura.total = (factura.subtotal + (factura.impuesto or Decimal("0"))).quantize(Decimal("0.01"))


def _factura_detail(factura: Factura, db: Session) -> dict:
    items = db.query(FacturaItem).filter(FacturaItem.factura_id == factura.id).all()
    cliente = db.query(Cliente).filter(Cliente.id == factura.cliente_id).first() if factura.cliente_id else None
    return {
        **FacturaOut.model_validate(factura).model_dump(),
        "cliente_nombre": cliente.nombre if cliente else None,
        "items": [
            {
                "id": i.id,
                "descripcion": i.descripcion,
                "cantidad": float(i.cantidad),
                "precio_unitario": float(i.precio_unitario),
                "descuento_pct": float(i.descuento_pct),
                "subtotal": float(i.subtotal),
            }
            for i in items
        ],
    }


def _registrar_ingreso(db: Session, factura: Factura) -> None:
    existe = db.query(Movimiento).filter(
        Movimiento.establo_id == factura.establo_id,
        Movimiento.descripcion == f"Factura {factura.numero}",
        Movimiento.tipo == "ingreso",
    ).first()
    if not existe:
        db.add(Movimiento(
            establo_id=factura.establo_id,
            tipo="ingreso",
            categoria="Cobros",
            descripcion=f"Factura {factura.numero}",
            monto=factura.total,
            fecha=date.today(),
            notas=factura.concepto,
        ))


def _revertir_ingreso(db: Session, factura: Factura) -> None:
    mov = db.query(Movimiento).filter(
        Movimiento.establo_id == factura.establo_id,
        Movimiento.descripcion == f"Factura {factura.numero}",
        Movimiento.tipo == "ingreso",
    ).first()
    if mov:
        db.delete(mov)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
def listar(db: Session = Depends(get_db), current_user=Depends(_mod)):
    facturas = (
        db.query(Factura)
        .filter(Factura.establo_id == current_user.id)
        .order_by(Factura.fecha.desc())
        .all()
    )
    return [_factura_detail(f, db) for f in facturas]


@router.post("/", status_code=201)
def crear(body: FacturaConItemsCreate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    data = body.model_dump(exclude={"items"})
    if not data.get("numero"):
        data["numero"] = _next_numero(db, current_user.id)
    if not data.get("fecha"):
        data["fecha"] = date.today()
    factura = Factura(**data, establo_id=current_user.id)
    db.add(factura)
    db.flush()
    if body.items:
        _sync_items(db, factura, body.items)
    elif data.get("total") == 0:
        factura.total = factura.subtotal + (factura.impuesto or Decimal("0"))
    if factura.estado == "pagada":
        _registrar_ingreso(db, factura)
    db.commit()
    db.refresh(factura)
    return _factura_detail(factura, db)


@router.get("/{factura_id}")
def obtener(factura_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.establo_id == current_user.id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")
    return _factura_detail(f, db)


@router.put("/{factura_id}")
def actualizar(factura_id: int, body: FacturaConItemsUpdate, db: Session = Depends(get_db), current_user=Depends(_mod)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.establo_id == current_user.id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")
    estado_anterior = f.estado
    data = body.model_dump(exclude={"items"}, exclude_unset=True)
    for k, v in data.items():
        setattr(f, k, v)
    if body.items is not None:
        _sync_items(db, f, body.items)
    nuevo_estado = f.estado
    if estado_anterior != "pagada" and nuevo_estado == "pagada":
        _registrar_ingreso(db, f)
    elif estado_anterior == "pagada" and nuevo_estado != "pagada":
        _revertir_ingreso(db, f)
    db.commit()
    db.refresh(f)
    return _factura_detail(f, db)


@router.delete("/{factura_id}", status_code=204)
def eliminar(factura_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.establo_id == current_user.id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")
    if f.estado == "pagada":
        _revertir_ingreso(db, f)
    db.query(FacturaItem).filter(FacturaItem.factura_id == f.id).delete()
    db.delete(f)
    db.commit()


# ── PDF ───────────────────────────────────────────────────────────────────────

@router.get("/{factura_id}/pdf")
def descargar_pdf(factura_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from weasyprint import HTML
    f = db.query(Factura).filter(Factura.id == factura_id, Factura.establo_id == current_user.id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")
    tenant = db.query(Tenant).filter(Tenant.id == current_user.id).first()
    perfil = db.query(EmpresaPerfil).filter(EmpresaPerfil.establo_id == current_user.id).first()
    cliente = db.query(Cliente).filter(Cliente.id == f.cliente_id).first() if f.cliente_id else None
    items = db.query(FacturaItem).filter(FacturaItem.factura_id == f.id).all()
    moneda = perfil.moneda if perfil and perfil.moneda else "DOP"

    def fmt(n):
        return f"{moneda} {float(n):,.2f}"

    items_html = "".join(f"""
        <tr>
            <td>{i.descripcion}</td>
            <td style="text-align:center">{float(i.cantidad):g}</td>
            <td style="text-align:right">{fmt(i.precio_unitario)}</td>
            <td style="text-align:center">{float(i.descuento_pct):g}%</td>
            <td style="text-align:right">{fmt(i.subtotal)}</td>
        </tr>
    """ for i in items) if items else f"""
        <tr>
            <td colspan="4">{f.concepto}</td>
            <td style="text-align:right">{fmt(f.total)}</td>
        </tr>
    """

    empresa_nombre = (perfil.nombre_comercial if perfil and perfil.nombre_comercial else tenant.nombre) if tenant else "Empresa"
    empresa_info = "<br>".join(filter(None, [
        perfil.rn_fiscal and f"RNC: {perfil.rn_fiscal}",
        perfil.telefono,
        perfil.email_comercial or tenant.email,
        perfil.direccion,
        perfil.ciudad and perfil.pais and f"{perfil.ciudad}, {perfil.pais}",
    ])) if perfil else tenant.email

    estado_color = {"pagada": "#10b981", "enviada": "#6366f1", "vencida": "#ef4444", "borrador": "#94a3b8"}.get(f.estado, "#94a3b8")

    html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
    <meta charset="UTF-8">
    <style>
      * {{ margin:0; padding:0; box-sizing:border-box; }}
      body {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size:13px; color:#1e293b; padding:40px; }}
      .header {{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }}
      .company-name {{ font-size:22px; font-weight:700; color:#1e293b; }}
      .company-info {{ font-size:11px; color:#64748b; margin-top:6px; line-height:1.6; }}
      .factura-badge {{ text-align:right; }}
      .factura-numero {{ font-size:28px; font-weight:800; color:#6366f1; }}
      .factura-label {{ font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; }}
      .estado-badge {{ display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; color:white; background:{estado_color}; margin-top:8px; text-transform:uppercase; }}
      .divider {{ border:none; border-top:1px solid #e2e8f0; margin:24px 0; }}
      .info-grid {{ display:flex; justify-content:space-between; margin-bottom:32px; }}
      .info-block {{ flex:1; }}
      .info-block:last-child {{ text-align:right; }}
      .info-label {{ font-size:10px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }}
      .info-value {{ font-size:13px; color:#1e293b; }}
      table {{ width:100%; border-collapse:collapse; margin-bottom:24px; }}
      thead tr {{ background:#f8fafc; }}
      th {{ padding:10px 12px; text-align:left; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e2e8f0; }}
      td {{ padding:12px; border-bottom:1px solid #f1f5f9; font-size:13px; }}
      tbody tr:last-child td {{ border-bottom:none; }}
      .totals {{ display:flex; justify-content:flex-end; }}
      .totals-table {{ width:260px; }}
      .totals-table td {{ padding:6px 12px; border:none; }}
      .totals-table .label {{ color:#64748b; }}
      .totals-table .total-row {{ font-size:16px; font-weight:700; color:#1e293b; border-top:2px solid #e2e8f0; padding-top:10px; }}
      .footer {{ margin-top:48px; padding-top:16px; border-top:1px solid #f1f5f9; text-align:center; font-size:11px; color:#94a3b8; }}
    </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-name">{empresa_nombre}</div>
          <div class="company-info">{empresa_info}</div>
        </div>
        <div class="factura-badge">
          <div class="factura-label">Factura</div>
          <div class="factura-numero">{f.numero}</div>
          <div><span class="estado-badge">{f.estado}</span></div>
        </div>
      </div>

      <hr class="divider">

      <div class="info-grid">
        <div class="info-block">
          <div class="info-label">Facturado a</div>
          <div class="info-value">{cliente.nombre if cliente else "—"}</div>
          {"<div style='font-size:11px;color:#64748b'>" + cliente.email + "</div>" if cliente and cliente.email else ""}
          {"<div style='font-size:11px;color:#64748b'>" + cliente.telefono + "</div>" if cliente and cliente.telefono else ""}
        </div>
        <div class="info-block">
          <div class="info-label">Fecha de emisión</div>
          <div class="info-value">{f.fecha.strftime("%d/%m/%Y")}</div>
          {"<div class='info-label' style='margin-top:12px'>Vencimiento</div><div class='info-value'>" + f.fecha_vencimiento.strftime("%d/%m/%Y") + "</div>" if f.fecha_vencimiento else ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th style="text-align:center">Cant.</th>
            <th style="text-align:right">Precio unit.</th>
            <th style="text-align:center">Desc.</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>{items_html}</tbody>
      </table>

      <div class="totals">
        <table class="totals-table">
          <tr><td class="label">Subtotal</td><td style="text-align:right">{fmt(f.subtotal)}</td></tr>
          <tr><td class="label">ITBIS (18%)</td><td style="text-align:right">{fmt(f.impuesto or 0)}</td></tr>
          <tr class="total-row"><td>Total</td><td style="text-align:right">{fmt(f.total)}</td></tr>
        </table>
      </div>

      {"<div style='margin-top:24px;padding:16px;background:#f8fafc;border-radius:8px;font-size:12px;color:#64748b'><strong>Notas:</strong> " + f.notas + "</div>" if f.notas else ""}

      <div class="footer">
        Generado el {date.today().strftime("%d/%m/%Y")} — {empresa_nombre}
      </div>
    </body>
    </html>
    """

    pdf_bytes = HTML(string=html).write_pdf()
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="factura-{f.numero}.pdf"'},
    )


# ── Clientes: historial ───────────────────────────────────────────────────────

@router.get("/cliente/{cliente_id}/historial")
def historial_cliente(cliente_id: int, db: Session = Depends(get_db), current_user=Depends(_mod)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id, Cliente.establo_id == current_user.id).first()
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")
    facturas = db.query(Factura).filter(
        Factura.cliente_id == cliente_id,
        Factura.establo_id == current_user.id,
    ).order_by(Factura.fecha.desc()).all()
    total_facturado = sum(float(f.total) for f in facturas)
    total_cobrado = sum(float(f.total) for f in facturas if f.estado == "pagada")
    return {
        "cliente": {"id": cliente.id, "nombre": cliente.nombre, "email": cliente.email, "telefono": cliente.telefono},
        "stats": {"total_facturas": len(facturas), "total_facturado": total_facturado, "total_cobrado": total_cobrado, "pendiente": total_facturado - total_cobrado},
        "facturas": [_factura_detail(f, db) for f in facturas],
    }
