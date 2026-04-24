from database import engine
from sqlalchemy import text

def update_db():
    with engine.connect() as conn:
        print("Vérification de la table 'alertes'...")
        try:
            conn.execute(text("ALTER TABLE alertes ADD COLUMN type_incident ENUM('ACCIDENT', 'TRAVAUX', 'EMBOUTEILLAGE', 'ROUTE_BARREE', 'AUTRE') NOT NULL DEFAULT 'AUTRE' AFTER route_id"))
            conn.commit()
            print("Colonne 'type_incident' ajoutée aux alertes.")
        except Exception:
            print("La colonne 'type_incident' existe déjà ou erreur ignorée.")

        print("Vérification de la table 'incidents'...")
        try:
            conn.execute(text("ALTER TABLE incidents ADD COLUMN date_traitement TIMESTAMP NULL AFTER date_signalement"))
            conn.commit()
            print("Colonne 'date_traitement' ajoutée aux incidents avec succès.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("La colonne 'date_traitement' existe déjà.")
            else:
                print(f"Erreur lors de la mise à jour des incidents : {e}")

        try:
            conn.execute(text("ALTER TABLE incidents ADD COLUMN date_resolution TIMESTAMP NULL AFTER date_traitement"))
            conn.commit()
            print("Colonne 'date_resolution' ajoutée aux incidents avec succès.")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("La colonne 'date_resolution' existe déjà.")
            else:
                print(f"Erreur ajout date_resolution : {e}")

if __name__ == "__main__":
    update_db()
