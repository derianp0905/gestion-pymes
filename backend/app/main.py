from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, subscriptions, superadmin, clientes, facturacion, caja, dashboard

app = FastAPI(
    title="Gestión PYMES — SaaS Platform",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(subscriptions.router)
app.include_router(superadmin.router)
app.include_router(clientes.router)
app.include_router(facturacion.router)
app.include_router(caja.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"mensaje": "Gestión PYMES API funcionando"}
