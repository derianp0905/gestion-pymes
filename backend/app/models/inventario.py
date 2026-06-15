from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class Producto(Base):
    __tablename__ = "productos"
    id           = Column(Integer, primary_key=True)
    establo_id   = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    nombre       = Column(String(200), nullable=False)
    sku          = Column(String(50))
    categoria    = Column(String(100))
    descripcion  = Column(String(500))
    precio_compra= Column(Numeric(12, 2), default=0)
    precio_venta = Column(Numeric(12, 2), nullable=False)
    stock_actual = Column(Integer, default=0)
    stock_minimo = Column(Integer, default=0)
    activo       = Column(Boolean, default=True)
    creado_en    = Column(DateTime, default=datetime.utcnow)
