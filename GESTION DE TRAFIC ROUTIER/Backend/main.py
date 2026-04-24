from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="VolcanWay API", description="API de gestion de trafic à Goma", version="1.0.0")

# Configuration CORS pour permettre au Front-end React de communiquer avec le Back-end
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://192.168.1.68:5174", # Votre IP locale
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API de VolcanWay"}

from routers import trafic, incidents, alertes, auth, admin

app.include_router(trafic.router)
app.include_router(incidents.router)
app.include_router(alertes.router)
app.include_router(auth.router)
app.include_router(admin.router)
