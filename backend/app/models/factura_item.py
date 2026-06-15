from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.database import Base


class FacturaItem(Base):
    __tablename__ = "factura_items"

    id = Column(Integer, primary_key=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False, index=True)
    descripcion = Column(String(300), nullable=False)
    cantidad = Column(Numeric(10, 2), default=1)
    precio_unitario = Column(Numeric(12, 2), nullable=False)
    descuento_pct = Column(Numeric(5, 2), default=0)   # porcentaje 0-100
    subtotal = Column(Numeric(12, 2), nullable=False)
