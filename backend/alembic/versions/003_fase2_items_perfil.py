"""Fase 2: factura_items y empresa_perfil

Revision ID: 003
Revises: 002
Create Date: 2026-06-15
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "factura_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("factura_id", sa.Integer, sa.ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False),
        sa.Column("descripcion", sa.String(300), nullable=False),
        sa.Column("cantidad", sa.Numeric(10, 2), server_default="1"),
        sa.Column("precio_unitario", sa.Numeric(12, 2), nullable=False),
        sa.Column("descuento_pct", sa.Numeric(5, 2), server_default="0"),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False),
    )
    op.create_index("ix_factura_items_factura_id", "factura_items", ["factura_id"])

    op.create_table(
        "empresa_perfil",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False, unique=True),
        sa.Column("nombre_comercial", sa.String(200)),
        sa.Column("rn_fiscal", sa.String(50)),
        sa.Column("telefono", sa.String(50)),
        sa.Column("email_comercial", sa.String(200)),
        sa.Column("direccion", sa.String(300)),
        sa.Column("ciudad", sa.String(100)),
        sa.Column("pais", sa.String(100), server_default="República Dominicana"),
        sa.Column("moneda", sa.String(10), server_default="DOP"),
        sa.Column("logo_url", sa.String(500)),
    )


def downgrade() -> None:
    op.drop_table("empresa_perfil")
    op.drop_index("ix_factura_items_factura_id", "factura_items")
    op.drop_table("factura_items")
