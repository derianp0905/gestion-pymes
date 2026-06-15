# GestiónOS

Plataforma SaaS multi-tenant para la gestión de PYMES en Latinoamérica. Cada empresa accede solo a los módulos incluidos en su plan de suscripción.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12 · FastAPI · SQLAlchemy · Alembic |
| Frontend | React 18 · Vite · CSS Variables (sin Tailwind) |
| Base de datos | PostgreSQL |
| Auth | JWT (python-jose) · bcrypt |
| PDF | WeasyPrint |
| Deploy | Vultr VPS · Nginx · Cloudflare |

## Planes y módulos

| Módulo | Basic $15 | Pro $30 | Business $60 |
|---|:---:|:---:|:---:|
| Clientes | ✅ | ✅ | ✅ |
| Facturación + PDF | ✅ | ✅ | ✅ |
| Caja / Movimientos | ✅ | ✅ | ✅ |
| Inventario | ❌ | ✅ | ✅ |
| Agenda / Citas | ❌ | ✅ | ✅ |
| Empleados / Nómina | ❌ | ❌ | ✅ |
| Reportes del negocio | ❌ | ❌ | ✅ |

## Estructura del proyecto

```
gestion-pymes/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, deps, seguridad
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── routers/       # Endpoints por módulo
│   │   └── main.py
│   ├── alembic/           # Migraciones de BD
│   ├── requirements.txt
│   └── .env               # Variables de entorno (no commitear)
└── frontend/
    ├── src/
    │   ├── components/    # Layout, Modal, ModuleGuard…
    │   ├── pages/         # Una página por módulo
    │   ├── context/       # AuthContext
    │   └── api/           # Cliente axios
    └── vite.config.js
```

## Instalación local

### Requisitos
- Python 3.12+
- Node.js 18+
- PostgreSQL 15+

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate      # Linux/Mac
# source venv/bin/activate.fish  # Fish shell

# Instalar dependencias
pip install -r requirements.txt

# Crear base de datos
createdb gestion_pymes_db

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`. El frontend hace proxy a `http://localhost:8000` para las peticiones `/api`.

## Variables de entorno

Crea el archivo `backend/.env` con los siguientes valores:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost/gestion_pymes_db
SECRET_KEY=cambia_esto_por_una_clave_segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
SUPERADMIN_EMAIL=tu@email.com
```

## Super Admin

El primer usuario con `role = superadmin` tiene acceso al panel en `/superadmin` donde puede:
- Crear y gestionar planes de suscripción
- Activar/desactivar módulos por plan
- Ver y administrar todos los tenants

Para crear el superadmin, registra un usuario y luego actualiza su rol directamente en la BD:

```sql
UPDATE tenants SET role = 'superadmin' WHERE email = 'tu@email.com';
```

## API

La documentación interactiva de la API está disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Arquitectura multi-tenant

Cada empresa (tenant) se identifica con `establo_id`. Todos los endpoints protegidos extraen el `establo_id` del JWT y filtran los datos automáticamente — ningún tenant puede ver datos de otro.

El acceso a módulos se controla con la dependencia `require_module(key)`:

```python
@router.get("/")
def listar(db=Depends(get_db), user=Depends(require_module("inventario"))):
    ...
```

Si el tenant no tiene el módulo activo en su plan, la API responde `403`.
