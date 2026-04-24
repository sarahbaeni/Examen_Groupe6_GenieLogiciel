from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/alertes", tags=["Alertes"])

@router.get("/", response_model=List[schemas.AlerteWithDetails])
def get_all_alertes(db: Session = Depends(get_db)):
    """
    Récupère les alertes majeures de trafic avec détails.
    """
    return db.query(models.Alerte).order_by(models.Alerte.date_creation.desc()).all()

@router.post("/", response_model=schemas.Alerte)
def create_alerte(alerte: schemas.AlerteCreate, x_user_id: int = Header(...), db: Session = Depends(get_db)):
    """
    Permet à un agent de la police routière de diffuser une alerte.
    """
    new_alerte = models.Alerte(
        route_id=alerte.route_id,
        message=alerte.message,
        niveau_gravite=alerte.niveau_gravite,
        cree_par=x_user_id
    )
    db.add(new_alerte)
    db.commit()
    db.refresh(new_alerte)
    return new_alerte
