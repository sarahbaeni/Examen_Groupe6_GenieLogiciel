from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# =================
# SCHEMAS D'UTILISATEUR
# =================
class UtilisateurBase(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    role: str

class UtilisateurCreate(UtilisateurBase):
    mot_de_passe: str

class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    mot_de_passe: Optional[str] = None

class Utilisateur(UtilisateurBase):
    id: int
    cree_le: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str

class LoginResponse(BaseModel):
    id: int
    nom: str
    prenom: str
    email: str
    role: str
    message: str

    class Config:
        from_attributes = True

# =================
# SCHEMAS DE ROUTE
# =================
class RouteBase(BaseModel):
    nom: str
    description: Optional[str] = None
    distance_km: Optional[float] = None

class RouteCreate(RouteBase):
    pass

class RouteUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    distance_km: Optional[float] = None

class Route(RouteBase):
    id: int
    enregistre_par: Optional[int] = None
    cree_le: datetime

    class Config:
        from_attributes = True

# =================
# SCHEMAS DE TRAFIC
# =================
class TraficBase(BaseModel):
    niveau: str
    temps_retard_min: int = 0

class TraficUpdate(TraficBase):
    pass

class Trafic(TraficBase):
    id: int
    route_id: int
    mis_a_jour_par: Optional[int] = None
    date_maj: datetime

    class Config:
        from_attributes = True

class RouteWithTrafic(Route):
    trafic: Optional[Trafic] = None

# =================
# SCHEMAS D'INCIDENT
# =================
class IncidentBase(BaseModel):
    type_incident: str
    description: Optional[str] = None

class IncidentCreate(IncidentBase):
    route_id: int

class Incident(IncidentBase):
    id: int
    route_id: int
    statut: str
    signale_par: Optional[int] = None
    valide_par: Optional[int] = None
    date_signalement: datetime
    date_traitement: Optional[datetime] = None

    class Config:
        from_attributes = True

class IncidentWithDetails(Incident):
    route: RouteBase
    signaleur: Optional[UtilisateurBase] = None
    validateur: Optional[UtilisateurBase] = None

# =================
# SCHEMAS D'ALERTE
# =================
class AlerteBase(BaseModel):
    type_incident: str
    message: str
    niveau_gravite: str

class AlerteCreate(AlerteBase):
    route_id: int

class Alerte(AlerteBase):
    id: int
    route_id: int
    cree_par: int
    date_creation: datetime

    class Config:
        from_attributes = True

class AlerteWithDetails(Alerte):
    route: RouteBase
    police: Optional[UtilisateurBase] = None

# =================
# SCHEMAS DE RAPPORT
# =================
class DailyReportResponse(BaseModel):
    date: datetime
    total_incidents: int
    incidents_valides: int
    incidents_en_attente: int
    incidents_rejetes: int
    total_alertes: int
    routes_fluides: int
    routes_ralenties: int
    routes_saturees: int
    routes_bloquees: int
    incidents_list: List[IncidentWithDetails]

