"""Fase 3: productos, citas, empleados, pagos_nomina

Revision ID: 004
Revises: 003
Create Date: 2026-06-15
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "productos",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("sku", sa.String(50)),
        sa.Column("categoria", sa.String(100)),
        sa.Column("descripcion", sa.String(500)),
        sa.Column("precio_compra", sa.Numeric(12, 2), server_default="0"),
        sa.Column("precio_venta", sa.Numeric(12, 2), nullable=False),
        sa.Column("stock_actual", sa.Integer, server_default="0"),
        sa.Column("stock_minimo", sa.Integer, server_default="0"),
        sa.Column("activo", sa.Boolean, server_default="true"),
        sa.Column("creado_en", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_productos_establo_id", "productos", ["establo_id"])

    op.create_table(
        "citas",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("cliente_id", sa.Integer, sa.ForeignKey("clientes.id"), nullable=True),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("servicio", sa.String(200)),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("hora_inicio", sa.String(5), nullable=False),
        sa.Column("duracion_min", sa.Integer, server_default="60"),
        sa.Column("estado", sa.String(20), server_default="pendiente"),
        sa.Column("notas", sa.String(500)),
        sa.Column("creado_en", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_citas_establo_fecha", "citas", ["establo_id", "fecha"])

    op.create_table(
        "empleados",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("puesto", sa.String(100)),
        sa.Column("sucursal", sa.String(100)),
        sa.Column("salario", sa.Numeric(12, 2), server_default="0"),
        sa.Column("tipo_pago", sa.String(20), server_default="mensual"),
        sa.Column("fecha_ingreso", sa.Date),
        sa.Column("estado", sa.String(20), server_default="activo"),
        sa.Column("email", sa.String(200)),
        sa.Column("telefono", sa.String(50)),
        sa.Column("creado_en", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_empleados_establo_id", "empleados", ["establo_id"])

    op.create_table(
        "pagos_nomina",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("empleado_id", sa.Integer, sa.ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False),
        sa.Column("periodo", sa.String(30), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("fecha_pago", sa.Date, nullable=False),
        sa.Column("notas", sa.String(300)),
    )
    op.create_index("ix_pagos_nomina_empleado_id", "pagos_nomina", ["empleado_id"])


def downgrade() -> None:
    op.drop_table("pagos_nomina")
    op.drop_index("ix_empleados_establo_id", "empleados")
    op.drop_table("empleados")
    op.drop_index("ix_citas_establo_fecha", "citas")
    op.drop_table("citas")
    op.drop_index("ix_productos_establo_id", "productos")
    op.drop_table("productos")
