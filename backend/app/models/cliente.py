from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True)
    establo_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    email = Column(String(200))
    telefono = Column(String(50))
    direccion = Column(String(300))
    notas = Column(Text)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
