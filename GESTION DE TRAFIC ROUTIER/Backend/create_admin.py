"""
Script pour créer le premier administrateur dans la base de données.
Exécuter une seule fois : python create_admin.py
"""
import bcrypt
from database import SessionLocal
import models

def create_first_admin():
    db = SessionLocal()
    
    # Vérifier si un admin existe déjà
    existing_admin = db.query(models.Utilisateur).filter(models.Utilisateur.email == "admin@volcanway.com").first()
    
    password = "Admin@2024"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    if existing_admin:
        print(f"L'admin existe déjà : {existing_admin.prenom} {existing_admin.nom} ({existing_admin.email})")
        print("Mise à jour du mot de passe vers le nouveau hash...")
        existing_admin.mot_de_passe = hashed
        db.commit()
        db.close()
        print("✅ Mot de passe mis à jour !")
        return
    
    # Créer le premier admin
    password = "Admin@2024"
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    admin = models.Utilisateur(
        nom="Admin",
        prenom="Super",
        email="admin@volcanway.com",
        mot_de_passe=hashed,
        role="ADMIN"
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    print("="*50)
    print("✅ Premier administrateur créé avec succès !")
    print(f"   Email : admin@volcanway.com")
    print(f"   Mot de passe : {password}")
    print(f"   Rôle : ADMIN")
    print("="*50)
    
    db.close()

if __name__ == "__main__":
    create_first_admin()
