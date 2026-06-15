from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime
from datetime import datetime
from app.database import Base


class Cita(Base):
    __tablename__ = "citas"
    id          = Column(Integer, primary_key=True)
    establo_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    cliente_id  = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    titulo      = Column(String(200), nullable=False)
    servicio    = Column(String(200))
    fecha       = Column(Date, nullable=False)
    hora_inicio = Column(String(5), nullable=False)
    duracion_min= Column(Integer, default=60)
    estado      = Column(String(20), default="pendiente")
    notas       = Column(String(500))
    creado_en   = Column(DateTime, default=datetime.utcnow)
