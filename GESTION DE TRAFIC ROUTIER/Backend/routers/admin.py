from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import get_db
from routers.auth import get_password_hash, get_current_admin

from sqlalchemy import func
from datetime import date

router = APIRouter(
    prefix="/admin",
    tags=["Administration"]
)

@router.get("/stats")
def get_admin_stats(admin: models.Utilisateur = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Calcule les statistiques pour le dashboard admin"""
    today = date.today()
    
    total_police = db.query(models.Utilisateur).filter(models.Utilisateur.role == 'POLICE').count()
    total_routes = db.query(models.Route).count()
    total_alerts_today = db.query(models.Alerte).filter(func.date(models.Alerte.date_creation) == today).count()
    total_users = db.query(models.Utilisateur).filter(models.Utilisateur.role == 'STANDARD').count()
    
    # Répartition des incidents par type
    incidents_by_type = db.query(
        models.Incident.type_incident, 
        func.count(models.Incident.id)
    ).group_by(models.Incident.type_incident).all()
    
    # Transformer en dictionnaire { 'ACCIDENT': 5, ... }
    types_dict = {}
    for t, count in incidents_by_type:
        # Gérer le cas où t est un Enum (t.name) ou une chaîne (t)
        key = t.name if hasattr(t, 'name') else str(t)
        types_dict[key] = count
    
    return {
        "policiers_actifs": total_police,
        "routes_surveillees": total_routes,
        "alerts_aujourdhui": total_alerts_today,
        "utilisateurs_total": total_users,
        "incidents_par_type": types_dict
    }

# ==========================
# GESTION DES UTILISATEURS
# ==========================

@router.get("/users", response_model=List[schemas.Utilisateur])
def get_all_users(
    role: Optional[str] = None,
    admin: models.Utilisateur = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Liste tous les utilisateurs, filtrable par rôle"""
    query = db.query(models.Utilisateur)
    if role:
        query = query.filter(models.Utilisateur.role == role.upper())
    return query.order_by(models.Utilisateur.cree_le.desc()).all()

@router.post("/users", response_model=schemas.Utilisateur, status_code=status.HTTP_201_CREATED)
def create_privileged_user(
    user: schemas.UtilisateurCreate,
    admin: models.Utilisateur = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Créer un utilisateur ADMIN ou POLICE (réservé aux admins)"""
    allowed_roles = ["ADMIN", "POLICE"]
    if user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les rôles ADMIN et POLICE peuvent être créés via ce panneau."
        )

    db_user = db.query(models.Utilisateur).filter(models.Utilisateur.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email déjà enregistré")

    hashed_password = get_password_hash(user.mot_de_passe)
    new_user = models.Utilisateur(
        nom=user.nom,
        prenom=user.prenom,
        email=user.email,
        mot_de_passe=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=schemas.Utilisateur)
def update_user(
    user_id: int,
    user_update: schemas.UtilisateurUpdate,
    admin: models.Utilisateur = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mettre à jour un utilisateur (réservé aux admins)"""
    db_user = db.query(models.Utilisateur).filter(models.Utilisateur.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    update_data = user_update.dict(exclude_unset=True)
    if "mot_de_passe" in update_data:
        update_data["mot_de_passe"] = get_password_hash(update_data["mot_de_passe"])
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: models.Utilisateur = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Supprimer un utilisateur (réservé aux admins)"""
    user = db.query(models.Utilisateur).filter(models.Utilisateur.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous supprimer vous-même")

    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé"}

# ==========================
# GESTION DES ROUTES
# ==========================

@router.get("/routes", response_model=List[schemas.Route])
def get_routes(admin: models.Utilisateur = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(models.Route).all()

@router.post("/routes", response_model=schemas.Route)
def create_route(
    route: schemas.RouteCreate,
    admin: models.Utilisateur = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_route = models.Route(**route.dict(), enregistre_par=admin.id)
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route

@router.put("/routes/{route_id}", response_model=schemas.Route)
def update_route(
    route_id: int,
    route_update: schemas.RouteUpdate,
    admin: models.Utilisateur = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    db_route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route non trouvée")
    
    for key, value in route_update.dict(exclude_unset=True).items():
        setattr(db_route, key, value)
    
    db.commit()
    db.refresh(db_route)
    return db_route

@router.delete("/routes/{route_id}")
def delete_route(
    route_id: int,
    admin: models.Utilisateur = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route non trouvée")
    db.delete(route)
    db.commit()
    return {"message": "Route supprimée"}

# ==========================
# MONITORING
# ==========================

@router.get("/alerts", response_model=List[schemas.AlerteWithDetails])
def get_admin_alerts(admin: models.Utilisateur = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Récupère toutes les alertes avec les détails de la route et de l'auteur"""
    return db.query(models.Alerte).order_by(models.Alerte.date_creation.desc()).all()

@router.get("/incidents-history", response_model=List[schemas.IncidentWithDetails])
def get_incidents_history(admin: models.Utilisateur = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Historique complet de tous les signalements pour l'audit admin"""
    return db.query(models.Incident).order_by(models.Incident.date_signalement.desc()).all()

@router.get("/traffic-overview", response_model=List[schemas.RouteWithTrafic])
def get_traffic_overview(admin: models.Utilisateur = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Vue d'ensemble de l'état du trafic pour toutes les routes"""
    return db.query(models.Route).all()

@router.get("/daily-report", response_model=schemas.DailyReportResponse)
def get_daily_report(admin: models.Utilisateur = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Génère le rapport journalier des activités de trafic"""
    from datetime import datetime
    today_date = date.today()
    
    # Incidents d'aujourd'hui
    incidents_today = db.query(models.Incident).filter(func.date(models.Incident.date_signalement) == today_date).all()
    
    # Alertes d'aujourd'hui
    total_alerts_today = db.query(models.Alerte).filter(func.date(models.Alerte.date_creation) == today_date).count()
    
    # Comptage des incidents par statut
    incidents_valides = sum(1 for inc in incidents_today if inc.statut in ['VALIDE', 'RESOLU'])
    incidents_en_attente = sum(1 for inc in incidents_today if inc.statut == 'EN_ATTENTE')
    incidents_rejetes = sum(1 for inc in incidents_today if inc.statut == 'REJETE')
    
    # Etat du trafic (basé sur la table Trafic)
    routes = db.query(models.Route).all()
    routes_fluides = sum(1 for r in routes if not r.trafic or r.trafic.niveau == 'FLUIDE')
    routes_ralenties = sum(1 for r in routes if r.trafic and r.trafic.niveau == 'RALENTI')
    routes_saturees = sum(1 for r in routes if r.trafic and r.trafic.niveau == 'SATURE')
    routes_bloquees = sum(1 for r in routes if r.trafic and r.trafic.niveau == 'BLOQUE')
    
    return {
        "date": datetime.utcnow(),
        "total_incidents": len(incidents_today),
        "incidents_valides": incidents_valides,
        "incidents_en_attente": incidents_en_attente,
        "incidents_rejetes": incidents_rejetes,
        "total_alertes": total_alerts_today,
        "routes_fluides": routes_fluides,
        "routes_ralenties": routes_ralenties,
        "routes_saturees": routes_saturees,
        "routes_bloquees": routes_bloquees,
        "incidents_list": incidents_today
    }

