from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
import models, schemas

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("/", response_model=List[schemas.IncidentWithDetails])
def get_all_incidents(db: Session = Depends(get_db)):
    """
    Récupère la liste de tous les incidents avec détails.
    """
    return db.query(models.Incident).order_by(models.Incident.date_signalement.desc()).all()

def get_alert_mapping(incident_type: str):
    mapping = {
        'ACCIDENT': ('CRITIQUE', "Accident sur la route principale, circulation perturbée"),
        'BLOCAGE': ('CRITIQUE', "Route fermée temporairement"),
        'PANNE': ('IMPORTANT', "Véhicule immobilisé sur la chaussée"),
        'METEO': ('INFO', "Route glissante / inondée")
    }
    return mapping.get(incident_type, ('INFO', "Incident signalé sur la route"))

@router.post("/", response_model=schemas.Incident)
def create_incident(incident: schemas.IncidentCreate, x_user_id: int = Header(...), db: Session = Depends(get_db)):
    """
    Permet à un conducteur ou agent de signaler un incident.
    """
    new_incident = models.Incident(
        route_id=incident.route_id,
        type_incident=incident.type_incident,
        description=incident.description,
        signale_par=x_user_id,
        statut='EN_ATTENTE'
    )
    
    # Si c'est un policier ou admin qui signale, on valide directement et on crée une alerte
    user = db.query(models.Utilisateur).filter(models.Utilisateur.id == x_user_id).first()
    if user and user.role in ['POLICE', 'ADMIN']:
        new_incident.statut = 'VALIDE'
        new_incident.valide_par = x_user_id
        new_incident.date_traitement = datetime.utcnow()
        
        # Création automatique de l'alerte
        gravite, msg_defaut = get_alert_mapping(incident.type_incident)
        new_alerte = models.Alerte(
            route_id=incident.route_id,
            type_incident=incident.type_incident,
            message=f"{incident.type_incident} : {incident.description or msg_defaut}",
            niveau_gravite=gravite,
            cree_par=x_user_id
        )
        db.add(new_alerte)

    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    return new_incident

@router.patch("/{incident_id}/status", response_model=schemas.Incident)
def update_incident_status(incident_id: int, status: str, x_user_id: int = Header(...), db: Session = Depends(get_db)):
    """
    Permet à la police de valider ou rejeter un incident.
    """
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident introuvable")
    
    if status not in ['VALIDE', 'REJETE', 'RESOLU']:
        raise HTTPException(status_code=400, detail="Statut invalide")

    # Si on valide un incident qui n'était pas encore validé, on crée l'alerte
    if status == 'VALIDE' and incident.statut != 'VALIDE':
        gravite, msg_defaut = get_alert_mapping(incident.type_incident)
        new_alerte = models.Alerte(
            route_id=incident.route_id,
            type_incident=incident.type_incident,
            message=f"{incident.type_incident} : {incident.description or msg_defaut}",
            niveau_gravite=gravite,
            cree_par=x_user_id
        )
        db.add(new_alerte)

    incident.statut = status
    incident.valide_par = x_user_id
    incident.date_traitement = datetime.utcnow()
    db.commit()
    db.refresh(incident)
    return incident
@router.get("/me", response_model=List[schemas.IncidentWithDetails])
def get_my_incidents(x_user_id: int = Header(...), db: Session = Depends(get_db)):
    """
    Récupère la liste des incidents signalés par l'utilisateur connecté.
    """
    return db.query(models.Incident).filter(models.Incident.signale_par == x_user_id).order_by(models.Incident.date_signalement.desc()).all()
