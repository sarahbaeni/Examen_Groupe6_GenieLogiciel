from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import bcrypt
from typing import List, Optional

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

@router.post("/register", response_model=schemas.Utilisateur, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UtilisateurCreate, db: Session = Depends(get_db)):
    # Forcer le rôle STANDARD pour toute inscription publique
    # Les rôles ADMIN et POLICE sont attribués uniquement par un administrateur
    user.role = "STANDARD"

    # Vérifier si l'email existe déjà
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

@router.post("/login", response_model=schemas.LoginResponse)
def login_user(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Utilisateur).filter(models.Utilisateur.email == credentials.email).first()
    
    if not user or not verify_password(credentials.mot_de_passe, user.mot_de_passe):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect"
        )
    
    return schemas.LoginResponse(
        id=user.id,
        nom=user.nom,
        prenom=user.prenom,
        email=user.email,
        role=user.role,
        message="Connexion réussie"
    )

# Dépendance pour récupérer l'utilisateur actuel
def get_current_user(x_user_id: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    
    user = db.query(models.Utilisateur).filter(models.Utilisateur.id == int(x_user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")
    
    return user

# Dépendance pour vérifier qu'un admin est connecté
def get_current_admin(user: models.Utilisateur = Depends(get_current_user)):
    if user.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")
    return user

