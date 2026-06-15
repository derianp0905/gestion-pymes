from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class Empleado(Base):
    __tablename__ = "empleados"
    id            = Column(Integer, primary_key=True)
    establo_id    = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    nombre        = Column(String(200), nullable=False)
    puesto        = Column(String(100))
    sucursal      = Column(String(100))
    salario       = Column(Numeric(12, 2), default=0)
    tipo_pago     = Column(String(20), default="mensual")
    fecha_ingreso = Column(Date)
    estado        = Column(String(20), default="activo")
    email         = Column(String(200))
    telefono      = Column(String(50))
    creado_en     = Column(DateTime, default=datetime.utcnow)


class PagoNomina(Base):
    __tablename__ = "pagos_nomina"
    id          = Column(Integer, primary_key=True)
    establo_id  = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    empleado_id = Column(Integer, ForeignKey("empleados.id", ondelete="CASCADE"), nullable=False)
    periodo     = Column(String(30), nullable=False)
    monto       = Column(Numeric(12, 2), nullable=False)
    fecha_pago  = Column(Date, nullable=False)
    notas       = Column(String(300))
