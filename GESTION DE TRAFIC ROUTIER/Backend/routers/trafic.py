from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/trafic", tags=["Trafic"])

@router.get("/", response_model=List[schemas.RouteWithTrafic])
def get_all_routes_trafic(db: Session = Depends(get_db)):
    """
    Récupère toutes les routes et leur état de trafic actuel.
    """
    routes = db.query(models.Route).all()
    # Le relationship "trafic" avec "uselist=False" sur le modèle Route va lier chaque route à son trafic si défini
    return routes

@router.put("/update/{route_id}", response_model=schemas.Trafic)
def update_trafic(route_id: int, trafic_update: schemas.TraficUpdate, x_user_id: int = Header(...), db: Session = Depends(get_db)):
    """
    Met à jour l'état du trafic sur une route donnée.
    """
    route = db.query(models.Route).filter(models.Route.id == route_id).first()
    if not route:
         raise HTTPException(status_code=404, detail="Route introuvable")

    trafic = db.query(models.Trafic).filter(models.Trafic.route_id == route_id).first()
    
    if trafic:
        trafic.niveau = trafic_update.niveau
        trafic.temps_retard_min = trafic_update.temps_retard_min
        trafic.mis_a_jour_par = x_user_id
    else:
        trafic = models.Trafic(
            route_id=route_id, 
            niveau=trafic_update.niveau, 
            temps_retard_min=trafic_update.temps_retard_min,
            mis_a_jour_par=x_user_id
        )
        db.add(trafic)
        
    db.commit()
    db.refresh(trafic)
    return trafic
