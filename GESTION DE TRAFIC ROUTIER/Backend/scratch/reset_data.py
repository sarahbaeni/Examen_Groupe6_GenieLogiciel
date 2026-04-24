from database import engine
from sqlalchemy import text

def reset_tables():
    with engine.connect() as conn:
        print("Nettoyage des tables incidents et alertes...")
        conn.execute(text("DELETE FROM alertes"))
        conn.execute(text("DELETE FROM incidents"))
        conn.commit()
        print("Base de données nettoyée avec succès.")

if __name__ == "__main__":
    reset_tables()
