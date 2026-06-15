"""Crear tablas iniciales: tenants, modules, plans, plan_modules, tenant_subscriptions

Revision ID: 001
Revises:
Create Date: 2026-06-15
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Tabla tenants (empresa/cliente de la plataforma) ---
    op.create_table(
        "tenants",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("nombre", sa.String(200), nullable=False),
        sa.Column("email", sa.String(200), nullable=False, unique=True),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column("role", sa.String(20), server_default="admin"),
        sa.Column("activo", sa.Boolean, server_default="true"),
        sa.Column("creado_en", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )
    op.create_index("ix_tenants_email", "tenants", ["email"], unique=True)

    # --- Catálogo de módulos ---
    op.create_table(
        "modules",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("key", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text),
    )

    # --- Planes disponibles ---
    op.create_table(
        "plans",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(50), nullable=False),
        sa.Column("price_monthly", sa.Numeric(10, 2)),
        sa.Column("price_yearly", sa.Numeric(10, 2)),
        sa.Column("max_users", sa.Integer, server_default="2"),
    )

    # --- Módulos incluidos por plan ---
    op.create_table(
        "plan_modules",
        sa.Column("plan_id", sa.Integer, sa.ForeignKey("plans.id"), primary_key=True),
        sa.Column("module_id", sa.Integer, sa.ForeignKey("modules.id"), primary_key=True),
    )

    # --- Suscripción activa de cada tenant ---
    op.create_table(
        "tenant_subscriptions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("establo_id", sa.Integer, sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("plan_id", sa.Integer, sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("status", sa.String(20), server_default="trial"),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True)),
        sa.Column("current_period_start", sa.DateTime(timezone=True)),
        sa.Column("current_period_end", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # =========================================================
    # SEED DATA
    # =========================================================

    # Módulos
    op.bulk_insert(
        sa.table(
            "modules",
            sa.column("key", sa.String),
            sa.column("name", sa.String),
            sa.column("description", sa.Text),
        ),
        [
            # Core (todos los planes)
            {"key": "clientes",     "name": "Clientes",              "description": "Gestión de clientes y contactos"},
            {"key": "facturacion",  "name": "Facturación",           "description": "Cotizaciones y facturas"},
            {"key": "caja",         "name": "Caja",                  "description": "Ingresos y gastos"},
            # Especializados (Pro+)
            {"key": "inventario",   "name": "Inventario",            "description": "Control de stock para tiendas"},
            {"key": "agenda",       "name": "Agenda / Citas",        "description": "Gestión de citas para servicios"},
            {"key": "establo",      "name": "Establo",               "description": "Gestión de caballerizas"},
            # Premium (Business)
            {"key": "empleados",    "name": "Empleados / Nómina",    "description": "Gestión de personal y nómina básica"},
            {"key": "reportes_ia",  "name": "Reportes con IA",       "description": "Análisis avanzado con inteligencia artificial"},
            {"key": "multi_sucursal", "name": "Multi-sucursal",      "description": "Gestión de múltiples sucursales"},
        ],
    )

    # Planes
    op.bulk_insert(
        sa.table(
            "plans",
            sa.column("name", sa.String),
            sa.column("price_monthly", sa.Numeric),
            sa.column("price_yearly", sa.Numeric),
            sa.column("max_users", sa.Integer),
        ),
        [
            {"name": "Basic",    "price_monthly": 15.00, "price_yearly": 150.00, "max_users": 2},
            {"name": "Pro",      "price_monthly": 30.00, "price_yearly": 300.00, "max_users": 5},
            {"name": "Business", "price_monthly": 60.00, "price_yearly": 600.00, "max_users": 999},
        ],
    )

    # Relación plan ↔ módulos usando subqueries para no hardcodear IDs
    op.execute("""
        INSERT INTO plan_modules (plan_id, module_id)
        SELECT p.id, m.id
        FROM plans p, modules m
        WHERE p.name = 'Basic'
          AND m.key IN ('clientes', 'facturacion', 'caja')
    """)

    op.execute("""
        INSERT INTO plan_modules (plan_id, module_id)
        SELECT p.id, m.id
        FROM plans p, modules m
        WHERE p.name = 'Pro'
          AND m.key IN ('clientes', 'facturacion', 'caja', 'inventario', 'agenda', 'establo')
    """)

    op.execute("""
        INSERT INTO plan_modules (plan_id, module_id)
        SELECT p.id, m.id
        FROM plans p, modules m
        WHERE p.name = 'Business'
          AND m.key IN ('clientes', 'facturacion', 'caja', 'inventario', 'agenda', 'establo',
                        'empleados', 'reportes_ia', 'multi_sucursal')
    """)


def downgrade() -> None:
    op.drop_table("tenant_subscriptions")
    op.drop_table("plan_modules")
    op.drop_table("plans")
    op.drop_table("modules")
    op.drop_index("ix_tenants_email", table_name="tenants")
    op.drop_table("tenants")
