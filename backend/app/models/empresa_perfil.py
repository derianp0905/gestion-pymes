from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class EmpresaPerfil(Base):
    __tablename__ = "empresa_perfil"

    id = Column(Integer, primary_key=True)
    establo_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, unique=True)
    nombre_comercial = Column(String(200))
    rn_fiscal = Column(String(50))         # RNC / NIT / RUC según país
    telefono = Column(String(50))
    email_comercial = Column(String(200))
    direccion = Column(String(300))
    ciudad = Column(String(100))
    pais = Column(String(100), default="República Dominicana")
    moneda = Column(String(10), default="DOP")
    logo_url = Column(String(500))
