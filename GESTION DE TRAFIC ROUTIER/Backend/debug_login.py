import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

from database import SessionLocal
import models
from routers.auth import verify_password
import schemas

def test_login(email, password):
    db = SessionLocal()
    try:
        user = db.query(models.Utilisateur).filter(models.Utilisateur.email == email).first()
        if not user:
            print("Utilisateur non trouvé")
            return
        
        print(f"Utilisateur trouvé: {user.prenom} {user.nom}, Role: {user.role}")
        
        try:
            is_valid = verify_password(password, user.mot_de_passe)
            print(f"Password valid: {is_valid}")
        except Exception as e:
            print(f"Erreur lors de la vérification du mot de passe: {e}")
            return

        # Simuler la réponse schemas.LoginResponse
        try:
            response = schemas.LoginResponse(
                id=user.id,
                nom=user.nom,
                prenom=user.prenom,
                email=user.email,
                role=user.role,
                message="Connexion réussie"
            )
            print("LoginResponse construit avec succès")
        except Exception as e:
            print(f"Erreur lors de la construction de LoginResponse: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    email = input("Email: ")
    password = input("Password: ")
    test_login(email, password)
