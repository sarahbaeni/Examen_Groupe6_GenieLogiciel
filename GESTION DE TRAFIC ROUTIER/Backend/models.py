from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, DECIMAL, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    mot_de_passe = Column(String(255), nullable=False)
    role = Column(Enum('ADMIN', 'POLICE', 'STANDARD'), nullable=False)
    cree_le = Column(TIMESTAMP, default=datetime.utcnow)
    mis_a_jour_le = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    routes_enregistrees = relationship("Route", back_populates="admin")
    trafics_mis_a_jour = relationship("Trafic", back_populates="police")
    incidents_signales = relationship("Incident", foreign_keys="[Incident.signale_par]", back_populates="signaleur")
    incidents_valides = relationship("Incident", foreign_keys="[Incident.valide_par]", back_populates="validateur")
    alertes_crees = relationship("Alerte", back_populates="police")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String(150), unique=True, index=True, nullable=False)
    description = Column(Text)
    distance_km = Column(DECIMAL(5, 2))
    enregistre_par = Column(Integer, ForeignKey("utilisateurs.id", ondelete="SET NULL"))
    cree_le = Column(TIMESTAMP, default=datetime.utcnow)

    # Relations
    admin = relationship("Utilisateur", back_populates="routes_enregistrees")
    trafic = relationship("Trafic", back_populates="route", uselist=False, cascade="all, delete")
    incidents = relationship("Incident", back_populates="route", cascade="all, delete")
    alertes = relationship("Alerte", back_populates="route", cascade="all, delete")


class Trafic(Base):
    __tablename__ = "trafic"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    niveau = Column(Enum('FLUIDE', 'RALENTI', 'SATURE', 'BLOQUE'), default='FLUIDE', nullable=False)
    temps_retard_min = Column(Integer, default=0)
    mis_a_jour_par = Column(Integer, ForeignKey("utilisateurs.id", ondelete="SET NULL"))
    date_maj = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    route = relationship("Route", back_populates="trafic")
    police = relationship("Utilisateur", back_populates="trafics_mis_a_jour")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    type_incident = Column(Enum('ACCIDENT', 'PANNE', 'BLOCAGE', 'METEO', 'AUTRE'), nullable=False)
    description = Column(Text)
    statut = Column(Enum('EN_ATTENTE', 'VALIDE', 'REJETE', 'RESOLU'), default='EN_ATTENTE', nullable=False)
    signale_par = Column(Integer, ForeignKey("utilisateurs.id", ondelete="SET NULL"))
    valide_par = Column(Integer, ForeignKey("utilisateurs.id", ondelete="SET NULL"))
    date_signalement = Column(TIMESTAMP, default=datetime.utcnow)
    date_traitement = Column(TIMESTAMP, nullable=True)
    date_resolution = Column(TIMESTAMP, nullable=True)

    # Relations
    route = relationship("Route", back_populates="incidents")
    signaleur = relationship("Utilisateur", foreign_keys=[signale_par], back_populates="incidents_signales")
    validateur = relationship("Utilisateur", foreign_keys=[valide_par], back_populates="incidents_valides")


class Alerte(Base):
    __tablename__ = "alertes"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    type_incident = Column(Enum('ACCIDENT', 'PANNE', 'BLOCAGE', 'METEO', 'AUTRE'), nullable=False, default='AUTRE')
    message = Column(String(255), nullable=False)
    niveau_gravite = Column(Enum('INFO', 'IMPORTANT', 'CRITIQUE'), default='IMPORTANT', nullable=False)
    cree_par = Column(Integer, ForeignKey("utilisateurs.id", ondelete="CASCADE"), nullable=False)
    date_creation = Column(TIMESTAMP, default=datetime.utcnow)

    # Relations
    route = relationship("Route", back_populates="alertes")
    police = relationship("Utilisateur", back_populates="alertes_crees")
