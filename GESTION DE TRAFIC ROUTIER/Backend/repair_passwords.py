"""
Script de réparation : Hachage des mots de passe en texte clair.
Exécution : python repair_passwords.py
"""
import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'Backend'))

import bcrypt
from database import SessionLocal
import models

def hash_plain_passwords():
    db = SessionLocal()
    try:
        users = db.query(models.Utilisateur).all()
        updated_count = 0
        
        for user in users:
            # Si le mot de passe ne ressemble pas à un hash bcrypt (commence par $2b$ ou $2a$)
            if not user.mot_de_passe.startswith('$2b$') and not user.mot_de_passe.startswith('$2a$'):
                print(f"Hachage du mot de passe pour : {user.email} (actuellement: {user.mot_de_passe})")
                
                # On utilise la méthode standard du projet
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw(user.mot_de_passe.encode('utf-8'), salt).decode('utf-8')
                
                user.mot_de_passe = hashed
                updated_count += 1
        
        db.commit()
        print("="*50)
        print(f"✅ Réparation terminée : {updated_count} mot(s) de passe haché(s).")
        print("="*50)

    except Exception as e:
        print(f"❌ Erreur lors de la réparation : {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    hash_plain_passwords()
