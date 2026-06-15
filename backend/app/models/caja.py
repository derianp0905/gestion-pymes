from sqlalchemy import Column, Integer, String, Numeric, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

CATEGORIAS_INGRESO = ["Ventas", "Servicios", "Cobros", "Otros ingresos"]
CATEGORIAS_GASTO = ["Proveedores", "Nómina", "Alquiler", "Servicios públicos", "Marketing", "Otros gastos"]


class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True)
    establo_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    tipo = Column(String(10), nullable=False)  # ingreso | gasto
    categoria = Column(String(100))
    descripcion = Column(String(300), nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    fecha = Column(Date, nullable=False)
    notas = Column(Text)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
