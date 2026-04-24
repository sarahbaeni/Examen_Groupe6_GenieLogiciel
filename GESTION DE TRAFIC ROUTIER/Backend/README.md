# Gestion de Trafic Routier - Backend

Ce dossier contient l'API et la logique serveur (Backend) pour le projet de Gestion de Trafic Routier (VolcanWay).

## Technologies Utilisées
- Python 3
- FastAPI
- SQLAlchemy (pour la base de données)
- Uvicorn (Serveur ASGI)

## Prérequis
Assurez-vous d'avoir Python installé sur la machine.

## Installation et Démarrage

1. Créer et activer un environnement virtuel (recommandé) :
   ```bash
   python -m venv venv
   # Sur Windows :
   venv\Scripts\activate
   # Sur macOS/Linux :
   source venv/bin/activate
   ```

2. Installer les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

3. Configuration :
   Assurez-vous que le fichier `.env` est correctement configuré à la racine de ce dossier (variables de base de données, JWT, etc.).

4. Démarrer le serveur de développement :
   ```bash
   uvicorn main:app --reload
   ```
   L'API sera accessible localement sur `http://127.0.0.1:8000`. Vous pouvez consulter la documentation interactive Swagger sur `http://127.0.0.1:8000/docs`.

## Scripts Utiles
- `create_admin.py` : Pour générer un compte administrateur.
- `check_db.py` / `update_db_schema.py` : Pour vérifier ou mettre à jour la structure de la base de données.
- `repair_passwords.py` : Pour réparer les mots de passe mal hachés.
