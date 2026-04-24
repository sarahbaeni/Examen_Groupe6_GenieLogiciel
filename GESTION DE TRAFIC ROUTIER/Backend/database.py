import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Chargement du fichier .env
load_dotenv()

# L'URL de connexion MySQL construite dynamiquement
DB_USER = os.getenv("DB_USER", "root")
# Si on n'a pas de fichier .env, ça prend le mot de passe local "SarahMySQL2.0" par défaut
DB_PASSWORD = os.getenv("DB_PASSWORD", "SarahMySQL2.0")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "volcanway_db")

# Permet de prendre en charge DATABASE_URL passée en ligne (plus facile pour Vercel/Render)
# Sinon, on la construit nous-mêmes à partir des variables d'InfinityFree
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dépendance pour injecter la session de base de données dans les routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
