from sqlalchemy import Column, Integer, String, Numeric, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True)
    establo_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    numero = Column(String(50))
    fecha = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date)
    concepto = Column(String(300), nullable=False)
    subtotal = Column(Numeric(12, 2), default=0)
    impuesto = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    estado = Column(String(20), default="borrador")  # borrador | enviada | pagada | vencida
    notas = Column(Text)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
