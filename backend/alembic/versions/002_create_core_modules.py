"""Crear tablas de módulos core: clientes, facturas, movimientos

Revision ID: 002
Revises: 001
Create Date: 2026-06-15
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clientes",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("email", sa.String(200)),
        sa.Column("telefono", sa.String(50)),
        sa.Column("direccion", sa.String(300)),
        sa.Column("notas", sa.Text),
        sa.Column("activo", sa.Boolean, server_default="true"),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_clientes_establo_id", "clientes", ["establo_id"])

    op.create_table(
        "facturas",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("cliente_id", sa.Integer, sa.ForeignKey("clientes.id"), nullable=True),
        sa.Column("numero", sa.String(50)),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("fecha_vencimiento", sa.Date),
        sa.Column("concepto", sa.String(300), nullable=False),
        sa.Column("subtotal", sa.Numeric(12, 2), server_default="0"),
        sa.Column("impuesto", sa.Numeric(12, 2), server_default="0"),
        sa.Column("total", sa.Numeric(12, 2), server_default="0"),
        sa.Column("estado", sa.String(20), server_default="borrador"),
        sa.Column("notas", sa.Text),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_facturas_establo_id", "facturas", ["establo_id"])

    op.create_table(
        "movimientos",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("tipo", sa.String(10), nullable=False),
        sa.Column("categoria", sa.String(100)),
        sa.Column("descripcion", sa.String(300), nullable=False),
        sa.Column("monto", sa.Numeric(12, 2), nullable=False),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("notas", sa.Text),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_movimientos_establo_id", "movimientos", ["establo_id"])


def downgrade() -> None:
    op.drop_index("ix_movimientos_establo_id", "movimientos")
    op.drop_table("movimientos")
    op.drop_index("ix_facturas_establo_id", "facturas")
    op.drop_table("facturas")
    op.drop_index("ix_clientes_establo_id", "clientes")
    op.drop_table("clientes")
